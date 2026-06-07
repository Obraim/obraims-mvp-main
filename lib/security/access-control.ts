import { users } from "@/lib/data";
import { loanApplicationRepository } from "@/lib/repositories/loan-applications";
import type { LoanApplication, UserRole, UserSummary } from "@/lib/types";
import { isAdminEmail, requireAuthenticatedUser } from "@/src/lib/obraims/access-control";

export const demoRoleCookieName = "obraims_demo_role";

export class AccessDeniedError extends Error {
  constructor(message = "Access denied.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export function getDemoUserForRole(role: UserRole): UserSummary {
  const user = users.find((candidate) => candidate.role === role);

  if (!user) {
    throw new AccessDeniedError(`No demo user configured for role ${role}.`);
  }

  return user;
}

export type DemoAccessUser = UserSummary & {
  isSuperAdmin?: boolean;
};

export async function getCurrentDemoUser(fallbackRole: UserRole): Promise<DemoAccessUser> {
  const authenticatedUser = await requireAuthenticatedUser();
  const authenticatedEmail = authenticatedUser.email?.trim().toLowerCase();
  const superAdmin = isAdminEmail(authenticatedEmail);

  if (superAdmin) {
    return {
      ...getDemoUserForRole(fallbackRole),
      email: authenticatedEmail ?? getDemoUserForRole(fallbackRole).email,
      isSuperAdmin: true
    };
  }

  return {
    ...getDemoUserForRole("BORROWER"),
    email: authenticatedEmail ?? getDemoUserForRole("BORROWER").email,
    isSuperAdmin: false
  };
}

function isSuperAdminUser(user: UserSummary) {
  return Boolean((user as DemoAccessUser).isSuperAdmin);
}

export function canViewApplication(user: UserSummary, application: LoanApplication) {
  if (isSuperAdminUser(user)) {
    return true;
  }

  if (user.role === "ADMIN" || user.role === "CREDIT_ANALYST") {
    return true;
  }

  if (user.role === "LOAN_OFFICER") {
    return application.assignedOfficer?.id === user.id;
  }

  return application.borrowerProfile.user.id === user.id || application.borrowerProfile.user.email?.toLowerCase() === user.email?.toLowerCase();
}

export function canUpdateApplicationStatus(user: UserSummary, application: LoanApplication) {
  if (isSuperAdminUser(user)) {
    return true;
  }

  if (user.role === "ADMIN" || user.role === "CREDIT_ANALYST") {
    return true;
  }

  return user.role === "LOAN_OFFICER" && application.assignedOfficer?.id === user.id;
}

export function canUploadDocument(user: UserSummary, application: LoanApplication) {
  if (isSuperAdminUser(user)) {
    return true;
  }

  if (user.role === "ADMIN" || user.role === "CREDIT_ANALYST") {
    return true;
  }

  if (user.role === "LOAN_OFFICER") {
    return application.assignedOfficer?.id === user.id;
  }

  return application.borrowerProfile.user.id === user.id;
}

export async function getVisibleApplicationsForUser(user: UserSummary) {
  const applications = await loanApplicationRepository.findMany();
  return applications.filter((application) => canViewApplication(user, application));
}

export async function getAuthorizedApplication(applicationId: string, user: UserSummary) {
  const application = await loanApplicationRepository.findById(applicationId);

  return application && canViewApplication(user, application) ? application : undefined;
}

export async function getStatusUpdateApplication(applicationId: string, user: UserSummary) {
  const application = await loanApplicationRepository.findById(applicationId);

  return application && canUpdateApplicationStatus(user, application) ? application : undefined;
}
