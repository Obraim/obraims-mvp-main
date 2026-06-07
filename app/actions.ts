"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { localizePath } from "@/i18n/routing";
import {
  demoRoleCookieName,
  getCurrentDemoUser,
  getStatusUpdateApplication,
  getAuthorizedApplication,
} from "@/lib/security/access-control";
import { applicationSchema } from "@/lib/validations/application";

const statusUpdateSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["DRAFT", "SUBMITTED", "IN_REVIEW", "MORE_INFO_NEEDED", "APPROVED", "REJECTED"])
});

const demoRoleSchema = z.object({
  role: z.enum(["BORROWER", "LOAN_OFFICER", "CREDIT_ANALYST", "ADMIN"]),
  redirectTo: z.string().startsWith("/").refine((value) => !value.startsWith("//")).default("/")
});

export async function createApplicationAction(formData: FormData) {
  const user = await getCurrentDemoUser("BORROWER");
  const locale = await getLocale();

  if (user.role !== "BORROWER") {
    redirect(localizePath("/login", locale));
  }

  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const errors = await getTranslations("Errors");
    const message = encodeURIComponent(errors("invalidApplication"));
    redirect(localizePath(`/applications/new?error=${message}`, locale));
  }

  redirect(localizePath("/applications/app-004/documents?created=1", locale));
}

export async function updateApplicationStatusAction(formData: FormData) {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const parsed = statusUpdateSchema.safeParse(Object.fromEntries(formData));
  const locale = await getLocale();

  if (!parsed.success) {
    redirect(localizePath("/officer", locale));
  }

  const { applicationId, status } = parsed.data;
  const application = await getStatusUpdateApplication(applicationId, user);

  if (!application) {
    redirect(localizePath("/officer?error=access_denied", locale));
  }

  redirect(localizePath(`/applications/${applicationId}?status=${status}`, locale));
}

export async function selectDemoRoleAction(formData: FormData) {
  const parsed = demoRoleSchema.safeParse(Object.fromEntries(formData));
  const locale = await getLocale();

  if (!parsed.success) {
    redirect(localizePath("/login", locale));
  }

  cookies().set(demoRoleCookieName, parsed.data.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  redirect(localizePath(parsed.data.redirectTo, locale));
}

export async function runAgentAnalysisAction(formData: FormData) {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const locale = await getLocale();
  const applicationId = String(formData.get("applicationId") ?? "");
  const application = await getAuthorizedApplication(applicationId, user);

  if (!application || user.role === "BORROWER") {
    redirect(localizePath("/officer/agent-review?error=access_denied", locale));
  }

  redirect(localizePath(`/officer/applications/${applicationId}/agent?run=1`, locale));
}

export async function approveAgentMessageAction(formData: FormData) {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const locale = await getLocale();
  const applicationId = String(formData.get("applicationId") ?? "");
  const body = encodeURIComponent(String(formData.get("body") ?? ""));
  const application = await getAuthorizedApplication(applicationId, user);

  if (!application || user.role === "BORROWER") {
    redirect(localizePath("/officer/inbox?error=access_denied", locale));
  }

  redirect(localizePath(`/officer/applications/${applicationId}/agent?message=approved&body=${body}`, locale));
}

export async function rejectAgentMessageAction(formData: FormData) {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const locale = await getLocale();
  const applicationId = String(formData.get("applicationId") ?? "");
  const application = await getAuthorizedApplication(applicationId, user);

  if (!application || user.role === "BORROWER") {
    redirect(localizePath("/officer/inbox?error=access_denied", locale));
  }

  redirect(localizePath(`/officer/applications/${applicationId}/agent?message=rejected`, locale));
}
