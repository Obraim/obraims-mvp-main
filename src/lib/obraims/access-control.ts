import "server-only";
import type { User } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import {
  getCurrentUser as getSupabaseCurrentUser,
  isAdmin as isAllowlistedAdmin,
  requireAdmin as requireAllowlistedAdmin
} from "@/src/lib/obraims/admin-auth";
import type { Customer, LoanApplication } from "@/src/lib/obraims/simple-core";

export type RoleArea = "borrower" | "loan_officer" | "credit_analyst" | "admin";

export type ApplicationAccessTarget = LoanApplication & {
  customer?: Pick<Customer, "auth_user_id" | "email"> | null;
};

export async function getCurrentUser() {
  return getSupabaseCurrentUser();
}

export function isAdminEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return new Set(
    (process.env.OBRAIMS_ADMIN_EMAILS ?? "")
      .split(",")
      .map((candidate) => candidate.trim().toLowerCase())
      .filter(Boolean)
  ).has(normalizedEmail);
}

export async function isSuperAdmin(user?: User | null) {
  if (user) {
    return isAdminEmail(user.email);
  }

  return isAllowlistedAdmin();
}

export async function requireAuthenticatedUser(redirectTo = "/en/login") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

export async function requireAdmin() {
  return requireAllowlistedAdmin();
}

export async function requireSuperAdmin() {
  return requireAllowlistedAdmin();
}

export function canAccessRoleArea(user: User, area: RoleArea) {
  if (isAdminEmail(user.email)) {
    return true;
  }

  return area === "borrower";
}

export async function requireRoleArea(area: RoleArea, redirectTo = "/en/login") {
  const user = await requireAuthenticatedUser(redirectTo);

  if (!canAccessRoleArea(user, area)) {
    notFound();
  }

  return user;
}

export function canAccessApplication(user: User, application: ApplicationAccessTarget) {
  if (isAdminEmail(user.email)) {
    return true;
  }

  const userEmail = user.email?.trim().toLowerCase();
  const customerEmail = application.customer?.email?.trim().toLowerCase();

  return Boolean(
    (application.customer?.auth_user_id && application.customer.auth_user_id === user.id) ||
      (userEmail && customerEmail && userEmail === customerEmail)
  );
}

export function requireApplicationAccess(user: User, application: ApplicationAccessTarget) {
  if (!canAccessApplication(user, application)) {
    notFound();
  }
}
