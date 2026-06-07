import "server-only";
import { Buffer } from "node:buffer";
import { createClient, type Session, type User } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getAuthSupabase() {
  if (!supabaseUrl || !publishableKey) {
    throw new Error("Supabase auth configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function getProjectRef() {
  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

type ParsedAuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

function parseAuthTokens(rawValue: string | undefined): ParsedAuthTokens {
  if (!rawValue) {
    return { accessToken: null, refreshToken: null };
  }

  const decoded = decodeURIComponent(rawValue);
  const candidates = decoded.startsWith("base64-")
    ? [Buffer.from(decoded.slice("base64-".length), "base64").toString("utf8"), decoded]
    : [decoded];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as
        | string[]
        | {
            access_token?: string;
            refresh_token?: string;
            currentSession?: {
              access_token?: string;
              refresh_token?: string;
            };
          };

      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        return {
          accessToken: parsed[0],
          refreshToken: typeof parsed[1] === "string" ? parsed[1] : null
        };
      }

      if (!Array.isArray(parsed)) {
        return {
          accessToken: parsed.access_token ?? parsed.currentSession?.access_token ?? null,
          refreshToken: parsed.refresh_token ?? parsed.currentSession?.refresh_token ?? null
        };
      }
    } catch {
      if (candidate.split(".").length === 3) {
        return { accessToken: candidate, refreshToken: null };
      }
    }
  }

  return { accessToken: null, refreshToken: null };
}

function authCookieNames() {
  const projectRef = getProjectRef();
  return [
    projectRef ? `sb-${projectRef}-auth-token` : null,
    "supabase-auth-token"
  ].filter(Boolean) as string[];
}

function getBearerTokens(): ParsedAuthTokens {
  const authorization = headers().get("authorization");
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearer) {
    return { accessToken: bearer, refreshToken: null };
  }

  const cookieStore = cookies();

  for (const name of authCookieNames()) {
    const exactValue = cookieStore.get(name)?.value;
    const exactToken = parseAuthTokens(exactValue);

    if (exactToken.accessToken) {
      return exactToken;
    }

    const chunkedValue = cookieStore
      .getAll()
      .filter((cookie) => cookie.name.startsWith(`${name}.`))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((cookie) => cookie.value)
      .join("");
    const chunkedToken = parseAuthTokens(chunkedValue);

    if (chunkedToken.accessToken) {
      return chunkedToken;
    }
  }

  return { accessToken: null, refreshToken: null };
}

function adminEmailAllowlist() {
  return new Set(
    (process.env.OBRAIMS_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function writeAuthSessionCookie(session: Session) {
  const projectRef = getProjectRef();
  const cookieName = projectRef ? `sb-${projectRef}-auth-token` : "supabase-auth-token";

  cookies().set(cookieName, JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function signInWithPassword(input: { email: string; password: string }) {
  const supabase = getAuthSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password
  });

  if (error || !data.session || !data.user) {
    throw new Error(error?.message || "Unable to sign in.");
  }

  writeAuthSessionCookie(data.session);
  return data.user;
}

export function clearCurrentAuthSession() {
  const cookieStore = cookies();

  for (const name of authCookieNames()) {
    cookieStore.delete(name);
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.startsWith(`${name}.`)) {
        cookieStore.delete(cookie.name);
      }
    }
  }
}

export async function getCurrentUser() {
  const tokens = getBearerTokens();

  if (!tokens.accessToken) {
    return null;
  }

  const supabase = getAuthSupabase();
  const { data, error } = await supabase.auth.getUser(tokens.accessToken);

  if (!error && data.user) {
    return data.user;
  }

  if (!tokens.refreshToken) {
    return null;
  }

  const refreshed = await supabase.auth.refreshSession({
    refresh_token: tokens.refreshToken
  });

  if (refreshed.error || !refreshed.data.session || !refreshed.data.user) {
    return null;
  }

  try {
    writeAuthSessionCookie(refreshed.data.session);
  } catch {
    // Server Components can read cookies but cannot always update them.
  }

  return refreshed.data.user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  const email = user?.email?.trim().toLowerCase();

  if (!email) {
    return false;
  }

  return adminEmailAllowlist().has(email);
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/en/login");
  }

  const email = user.email?.trim().toLowerCase();

  if (!email || !adminEmailAllowlist().has(email)) {
    notFound();
  }

  return user;
}
