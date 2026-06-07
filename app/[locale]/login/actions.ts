"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { localizePath } from "@/i18n/routing";
import { signInWithPassword } from "@/src/lib/obraims/admin-auth";

export type LoginFormState = {
  error: string | null;
  email: string;
};

const loginSchema = z.object({
  email: z.string().trim().email("Use a valid email address."),
  password: z.string().min(1, "Password is required."),
  locale: z.string().optional(),
  redirectTo: z
    .string()
    .startsWith("/")
    .refine((value) => !value.startsWith("//"))
    .optional()
});

function adminEmailAllowlist() {
  return new Set(
    (process.env.OBRAIMS_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function signInAction(_state: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);
  const locale = typeof raw.locale === "string" ? raw.locale : "en";
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to sign in.",
      email
    };
  }

  try {
    const user = await signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password
    });

    const userEmail = user.email?.trim().toLowerCase();
    const fallbackPath = userEmail && adminEmailAllowlist().has(userEmail) ? "/app/admin/applications" : localizePath("/borrower", locale);

    redirect(parsed.data.redirectTo || fallbackPath);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return {
      error: error instanceof Error ? error.message : "Unable to sign in.",
      email: parsed.data.email
    };
  }
}
