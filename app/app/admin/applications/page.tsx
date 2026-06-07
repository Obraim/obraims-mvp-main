import { redirect } from "next/navigation";
import { z } from "zod";
import { ObraimsAppShell } from "@/components/obraims-app-shell";
import { MetricTile, ShellCard, SourceChip, StatusChip, titleize } from "@/components/obraims-ui";
import { requireAdmin } from "@/src/lib/obraims/access-control";
import {
  createDecision,
  createLoanOffer,
  getLoanApplicationDetail,
  listDocumentRecordsForApplication,
  listLoanApplicationsForAdmin,
  saveCreditMemo,
  type DecisionValue,
  type LoanApplicationStatus
} from "@/src/lib/obraims/simple-core";
import { generateCreditMemo } from "@/src/lib/obraims/credit-memo";
import { runMockDecision } from "@/src/lib/obraims/mock-decision";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const adminFilters = ["submitted", "under_review", "approved", "rejected", "offer_generated", "offer_accepted"] as const;
const queueFilters = ["documents", "memos"] as const;
type AdminFilter = (typeof adminFilters)[number];
type QueueFilter = (typeof queueFilters)[number];
type AdminDecision = Extract<DecisionValue, "approved" | "rejected" | "referred" | "counteroffer">;

const terminalDecisionValues = new Set<DecisionValue>(["approved", "rejected", "counteroffer"]);
const lockedApplicationStatuses = new Set<LoanApplicationStatus>(["approved", "rejected", "offer_generated", "offer_accepted", "cancelled"]);

const adminDecisionSchema = z.object({
  applicationId: z.string().uuid("Application ID is required."),
  decision: z.enum(["approved", "rejected", "referred", "counteroffer"]),
  approvedAmount: z.coerce.number().positive("[decision text]").nullable(),
  approvedTermMonths: z.coerce.number().int().positive("[decision text]").nullable(),
  annualInterestRate: z.coerce.number().positive("Annual interest rate must be greater than 0.").max(100, "Annual interest rate cannot exceed 100%.").nullable(),
  summary: z.string().trim().max(500, "Summary must be 500 characters or less.").nullable(),
  reasonTitle: z.string().trim().max(120, "Reason title must be 120 characters or less.").nullable(),
  reasonDescription: z.string().trim().max(500, "Reason description must be 500 characters or less.").nullable()
});

function safeReturnTo(formData: FormData) {
  const returnTo = String(formData.get("return_to") ?? "");
  return returnTo.startsWith("/app/admin/applications") ? returnTo : "/app/admin/applications";
}

function nullableFormString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function nullableFormNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function withNotice(returnTo: string, type: "decision_success" | "decision_error", message: string) {
  const url = new URL(returnTo, "https://obraims.local");
  url.searchParams.delete("decision_success");
  url.searchParams.delete("decision_error");
  url.searchParams.set(type, message);
  return `${url.pathname}${url.search}`;
}

function latestByCreatedAt<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
}

function ensureDecisionCanBeRecorded(application: Awaited<ReturnType<typeof getLoanApplicationDetail>>) {
  const latestDecision = latestByCreatedAt(application.decisions);
  const latestOffer = latestByCreatedAt(application.loan_offers);

  if (lockedApplicationStatuses.has(application.status)) {
    throw new Error(`Application status is already ${formatStatus(application.status)}.`);
  }

  if (latestDecision && terminalDecisionValues.has(latestDecision.decision)) {
    throw new Error(`${formatDecision(latestDecision.decision)} decision has already been recorded.`);
  }

  if (latestOffer && (latestOffer.status === "pending" || latestOffer.status === "accepted")) {
    throw new Error(`${formatOfferStatus(latestOffer.status)} offer is already active.`);
  }
}

function defaultDecisionCopy(decision: AdminDecision) {
  if (decision === "approved") {
    return {
      summary: "Admin MVP approval recorded. Not production underwriting.",
      reasonTitle: "Admin approval",
      reasonDescription: "Approved for MVP admin review purposes.",
      severity: "info"
    };
  }

  if (decision === "rejected") {
    return {
      summary: "Admin MVP rejection recorded. Not production underwriting.",
      reasonTitle: "Admin rejection",
      reasonDescription: "Rejected for MVP admin review purposes.",
      severity: "warning"
    };
  }

  if (decision === "counteroffer") {
    return {
      summary: "Admin MVP counteroffer recorded. Not production underwriting.",
      reasonTitle: "Admin counteroffer",
      reasonDescription: "Counteroffer issued for MVP admin review purposes.",
      severity: "info"
    };
  }

  return {
    summary: "Referred for further review by admin.",
    reasonTitle: "Admin referral",
    reasonDescription: "Referred for additional admin review.",
    severity: "info"
  };
}

function monthlyPayment(amount: number, annualInterestRate: number, termMonths: number) {
  const monthlyRate = annualInterestRate / 100 / 12;

  if (monthlyRate <= 0) {
    return Math.round((amount / termMonths) * 100) / 100;
  }

  const payment = amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths)));
  return Math.round(payment * 100) / 100;
}

async function runMockDecisionAction(formData: FormData) {
  "use server";

  const returnTo = safeReturnTo(formData);
  let redirectTo = returnTo;

  try {
    const admin = await requireAdmin();
    const applicationId = String(formData.get("application_id") ?? "");

    if (!applicationId) {
    throw new Error("Application ID is required.");
    }

    const application = await getLoanApplicationDetail(applicationId);
    ensureDecisionCanBeRecorded(application);

    const result = runMockDecision({
      requested_amount: Number(application.requested_amount),
      requested_term_months: application.requested_term_months,
      monthly_income: application.monthly_income === null ? null : Number(application.monthly_income)
    });
    const annualInterestRate = 18;
    const decision = await createDecision({
      loanApplicationId: application.id,
      customerId: application.customer_id,
      decision: result.decision,
      decidedBy: "mock_system",
      summary: `Simple MVP mock decision score: ${result.score}. Not production underwriting.`,
      approvedAmount: result.suggestedApprovedAmount,
      approvedTermMonths: result.decision === "approved" ? application.requested_term_months : null,
      annualInterestRate: result.decision === "approved" ? annualInterestRate : null,
      reasons: result.reasons,
      audit: {
        actorType: "admin",
        actorId: admin.id,
        metadata: {
          action_source: "admin_mock_decision"
        }
      }
    });

    if (result.decision === "approved" && result.suggestedApprovedAmount) {
      await createLoanOffer({
        loanApplicationId: application.id,
        customerId: application.customer_id,
        decisionId: decision.id,
        amount: result.suggestedApprovedAmount,
        termMonths: application.requested_term_months,
        annualInterestRate,
        monthlyPayment: monthlyPayment(result.suggestedApprovedAmount, annualInterestRate, application.requested_term_months),
        audit: {
          actorType: "admin",
          actorId: admin.id,
          metadata: {
            action_source: "admin_mock_decision"
          }
        }
      });
    }

    redirectTo = withNotice(returnTo, "decision_success", "Mock decision recorded.");
  } catch (error) {
    console.error("Admin mock decision failed", error);
    redirectTo = withNotice(returnTo, "decision_error", error instanceof Error ? error.message : "Failed to record mock decision.");
  }

  redirect(redirectTo);
}

async function recordAdminDecisionAction(formData: FormData) {
  "use server";

  const returnTo = safeReturnTo(formData);
  let redirectTo = returnTo;

  try {
    const admin = await requireAdmin();
    const parsed = adminDecisionSchema.parse({
      applicationId: String(formData.get("application_id") ?? ""),
      decision: String(formData.get("decision") ?? ""),
      approvedAmount: nullableFormNumber(formData, "approved_amount"),
      approvedTermMonths: nullableFormNumber(formData, "approved_term_months"),
      annualInterestRate: nullableFormNumber(formData, "annual_interest_rate"),
      summary: nullableFormString(formData, "summary"),
      reasonTitle: nullableFormString(formData, "reason_title"),
      reasonDescription: nullableFormString(formData, "reason_description")
    });
    const application = await getLoanApplicationDetail(parsed.applicationId);
    ensureDecisionCanBeRecorded(application);

    const copy = defaultDecisionCopy(parsed.decision);
    const needsOffer = parsed.decision === "approved" || parsed.decision === "counteroffer";
    const approvedAmount = needsOffer ? (parsed.approvedAmount ?? Number(application.requested_amount)) : null;
    const approvedTermMonths = needsOffer ? (parsed.approvedTermMonths ?? application.requested_term_months) : null;
    const annualInterestRate = needsOffer ? (parsed.annualInterestRate ?? 18) : null;

    if (needsOffer && (!approvedAmount || !approvedTermMonths || !annualInterestRate)) {
      throw new Error("[decision text]");
    }

    const decision = await createDecision({
      loanApplicationId: application.id,
      customerId: application.customer_id,
      decision: parsed.decision,
      decidedBy: "admin",
      decidedById: admin.id,
      summary: parsed.summary ?? copy.summary,
      approvedAmount,
      approvedTermMonths,
      annualInterestRate,
      reasons: [
        {
          code: `MANUAL_${parsed.decision.toUpperCase()}`,
          title: parsed.reasonTitle ?? copy.reasonTitle,
          description: parsed.reasonDescription ?? copy.reasonDescription,
          severity: copy.severity
        }
      ],
      audit: {
        actorType: "admin",
        actorId: admin.id,
        metadata: {
          action_source: "admin_manual_decision",
          decision: parsed.decision
        }
      }
    });

    if (needsOffer && approvedAmount && approvedTermMonths && annualInterestRate) {
      await createLoanOffer({
        loanApplicationId: application.id,
        customerId: application.customer_id,
        decisionId: decision.id,
        amount: approvedAmount,
        termMonths: approvedTermMonths,
        annualInterestRate,
        monthlyPayment: monthlyPayment(approvedAmount, annualInterestRate, approvedTermMonths),
        audit: {
          actorType: "admin",
          actorId: admin.id,
          metadata: {
            action_source: "admin_manual_decision",
            decision: parsed.decision
          }
        }
      });
    }

    redirectTo = withNotice(returnTo, "decision_success", `${formatDecision(parsed.decision)} recorded.`);
  } catch (error) {
    console.error("Admin manual decision failed", error);
    const message = error instanceof z.ZodError ? error.errors[0]?.message ?? "Invalid decision data." : error instanceof Error ? error.message : "Unable to record decision.";
    redirectTo = withNotice(returnTo, "decision_error", message);
  }

  redirect(redirectTo);
}

async function generateCreditMemoAction(formData: FormData) {
  "use server";

  const returnTo = safeReturnTo(formData);
  let redirectTo = returnTo;

  try {
    const admin = await requireAdmin();
    const applicationId = String(formData.get("application_id") ?? "");

    if (!applicationId) {
      throw new Error("Application is required.");
    }

    const application = await getLoanApplicationDetail(applicationId);
    const documentRecords = await listDocumentRecordsForApplication(application.id);
    const creditMemo = await generateCreditMemo({
      application,
      documentRecords
    });

    await saveCreditMemo({
      loanApplicationId: application.id,
      creditMemo,
      audit: {
        actorType: "admin",
        actorId: admin.id,
        metadata: {
          action_source: "admin_generate_credit_memo",
          model: creditMemo.model
        }
      }
    });

    redirectTo = withNotice(returnTo, "decision_success", "Credit memo generated.");
  } catch (error) {
    console.error("Credit memo generation failed", error);
    redirectTo = withNotice(returnTo, "decision_error", error instanceof Error ? error.message : "Credit memo generation failed.");
  }

  redirect(redirectTo);
}

export default async function AdminApplicationsPage({
  searchParams
}: {
  searchParams?: { status?: string; queue?: string; decision_success?: string; decision_error?: string };
}) {
  await requireAdmin();

  let applications: Awaited<ReturnType<typeof listLoanApplicationsForAdmin>> = [];
  let configError: string | null = null;
  const activeQueue = queueFilters.includes(searchParams?.queue as QueueFilter) ? (searchParams?.queue as QueueFilter) : null;
  const activeStatus = adminFilters.includes(searchParams?.status as AdminFilter) ? (searchParams?.status as AdminFilter) : null;
  const returnTo = activeQueue
    ? `/app/admin/applications?queue=${activeQueue}`
    : activeStatus
      ? `/app/admin/applications?status=${activeStatus}`
      : "/app/admin/applications";
  const decisionSuccess = searchParams?.decision_success ? decodeURIComponent(searchParams.decision_success) : null;
  const decisionError = searchParams?.decision_error ? decodeURIComponent(searchParams.decision_error) : null;

  try {
    applications = await listLoanApplicationsForAdmin();
  } catch (error) {
    configError = error instanceof Error ? error.message : "Unable to load applications.";
  }

  const visibleApplications = applications.filter((application) => {
    if (activeQueue === "documents") {
      return (application.documents?.length ?? 0) > 0;
    }

    if (activeQueue === "memos") {
      return !application.metadata?.credit_memo;
    }

    if (activeStatus) {
      return application.status === activeStatus;
    }

    return true;
  });
  const awaitingReview = applications.filter((application) => ["submitted", "under_review"].includes(application.status)).length;
  const pendingDocuments = applications.filter((application) => application.documents?.some((document) => document.status !== "uploaded")).length;
  const memoMissing = applications.filter((application) => !application.metadata?.credit_memo).length;
  const approved = applications.filter((application) => ["approved", "offer_generated", "offer_accepted"].includes(application.status)).length;
  const activeLabel = activeQueue === "documents" ? "Documents" : activeQueue === "memos" ? "Credit Memos" : activeStatus === "submitted" ? "Pipeline" : "Applications";
  const pageTitle = activeQueue === "documents" ? "Documents queue" : activeQueue === "memos" ? "Credit memo queue" : activeStatus === "submitted" ? "Pipeline" : "Applications";
  const pageSubtitle = activeQueue === "documents"
    ? "Review applications with uploaded borrower documents and open secure file access from the application workspace."
    : activeQueue === "memos"
      ? "Find applications that still need an AI-generated credit memo."
      : activeStatus === "submitted"
        ? "Review newly submitted applications waiting for the next internal action."
        : "Review intake, documents, decisions, offers, and AI-generated credit memos from one queue.";

  return (
    <ObraimsAppShell
      active={activeLabel}
      eyebrow="Operations queue"
      title={pageTitle}
      subtitle={pageSubtitle}
      actions={
        <a href="/app/apply" className="focus-ring rounded-md bg-ink px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700">
          New application
        </a>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total applications" value={String(applications.length)} detail="All Simple Core records" />
        <MetricTile label="Awaiting review" value={String(awaitingReview)} detail="Submitted or under review" tone="amber" />
        <MetricTile label="Pending documents" value={String(pendingDocuments)} detail="Requested items outstanding" />
        <MetricTile label="Approved / offers" value={String(approved)} detail="Approved or offer generated" tone="teal" />
      </div>

      <ShellCard className="mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-semibold text-ink">Origination queue</h2>
              <p className="mt-1 text-sm text-slate-600">{visibleApplications.length} visible applications, {memoMissing} without a saved credit memo.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-[220px] items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm text-slate-500 shadow-sm">
                <span>Search applicant, phone, ID</span>
                <span className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">Soon</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterLink href="/app/admin/applications" active={!activeStatus && !activeQueue} label="All" />
                <FilterLink href="/app/admin/applications?queue=documents" active={activeQueue === "documents"} label="Documents" />
                <FilterLink href="/app/admin/applications?queue=memos" active={activeQueue === "memos"} label="Credit memos" />
                {adminFilters.map((status) => (
                  <FilterLink
                    key={status}
                    href={`/app/admin/applications?status=${status}`}
                    active={!activeQueue && activeStatus === status}
                    label={titleize(status)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {decisionSuccess ? <Notice tone="success" message={decisionSuccess} /> : null}
        {decisionError ? <Notice tone="error" message={decisionError} /> : null}

        {configError ? (
          <div className="m-5 rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{configError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-line bg-surface text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Purpose</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Documents</th>
                  <th className="px-5 py-3">Memo</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleApplications.map((application) => {
                  const latestDecision = latestByCreatedAt(application.decisions);
                  const latestOffer = latestByCreatedAt(application.loan_offers);
                  const locked =
                    lockedApplicationStatuses.has(application.status) ||
                    (latestDecision ? terminalDecisionValues.has(latestDecision.decision) : false) ||
                    latestOffer?.status === "pending" ||
                    latestOffer?.status === "accepted";
                  const uploadedDocuments = application.documents?.filter((document) => document.status === "uploaded").length ?? 0;
                  const totalDocuments = application.documents?.length ?? 0;

                  return (
                    <tr key={application.id} className="border-b border-line align-top transition last:border-b-0 hover:bg-surface/80">
                      <td className="px-5 py-4">
                        <a className="font-semibold text-ink hover:text-teal" href={`/app/application/${application.id}`}>
                          {application.customer.full_name ?? "Unnamed applicant"}
                        </a>
                        <p className="mt-1 text-xs text-slate-500">{application.customer.phone ?? "No phone"} - {application.customer.email ?? "No email"}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink">{currency.format(Number(application.requested_amount))}</td>
                      <td className="max-w-[240px] px-5 py-4 text-slate-600">{application.loan_purpose ?? "Not provided"}</td>
                      <td className="px-5 py-4"><StatusChip value={application.status} /></td>
                      <td className="px-5 py-4"><SourceChip value={application.source ?? application.channel} /></td>
                      <td className="px-5 py-4 text-slate-700">{totalDocuments > 0 ? `${uploadedDocuments}/${totalDocuments}` : "None"}</td>
                      <td className="px-5 py-4">
                        <StatusChip value={application.metadata?.credit_memo ? "approved" : "pending"} label={application.metadata?.credit_memo ? "Ready" : "Missing"} />
                      </td>
                      <td className="px-5 py-4 text-slate-600">{new Date(application.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <a href={`/app/application/${application.id}`} className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-surface">
                            Open
                          </a>
                          <ActionForm action={generateCreditMemoAction} application={application} returnTo={returnTo} label="Memo" />
                          {locked ? (
                            <span className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-slate-500">Locked</span>
                          ) : (
                            <>
                              <ActionForm action={runMockDecisionAction} application={application} returnTo={returnTo} label="Mock" />
                              <ActionForm action={recordAdminDecisionAction} application={application} returnTo={returnTo} label="Approve" decision="approved" tone="approve" />
                              <ActionForm action={recordAdminDecisionAction} application={application} returnTo={returnTo} label="Reject" decision="rejected" tone="reject" />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleApplications.length === 0 ? <div className="px-5 py-8 text-sm text-slate-600">No applications match this filter.</div> : null}
          </div>
        )}
      </ShellCard>
    </ObraimsAppShell>
  );
}
function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`focus-ring rounded border px-3 py-2 text-sm font-semibold ${
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-slate-700 hover:bg-surface"
      }`}
    >
      {label}
    </a>
  );
}

function Notice({ tone, message }: { tone: "success" | "error"; message: string }) {
  const className =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return <div className={`m-5 rounded-md border p-4 text-sm font-medium ${className}`}>{message}</div>;
}

function ActionForm({
  action,
  application,
  returnTo,
  label,
  decision,
  tone = "default"
}: {
  action: (formData: FormData) => Promise<void>;
  application: Awaited<ReturnType<typeof listLoanApplicationsForAdmin>>[number];
  returnTo: string;
  label: string;
  decision?: AdminDecision;
  tone?: "default" | "approve" | "reject";
}) {
  const className =
    tone === "approve"
      ? "focus-ring rounded bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
      : tone === "reject"
        ? "focus-ring rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-white"
        : "focus-ring rounded bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700";

  return (
    <form action={action}>
      <input type="hidden" name="application_id" value={application.id} />
      <input type="hidden" name="return_to" value={returnTo} />
      {decision ? <input type="hidden" name="decision" value={decision} /> : null}
      {decision === "approved" || decision === "counteroffer" ? (
        <>
          <input type="hidden" name="approved_amount" value={Number(application.requested_amount)} />
          <input type="hidden" name="approved_term_months" value={application.requested_term_months} />
          <input type="hidden" name="annual_interest_rate" value="18" />
        </>
      ) : null}
      <button className={className}>{label}</button>
    </form>
  );
}

function formatStatus(status: LoanApplicationStatus | string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under review",
    approved: "[decision text]",
    rejected: "Rejected",
    offer_generated: "Offer generated",
    offer_accepted: "[decision text]",
    cancelled: "Cancelled"
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function formatDecision(decision: DecisionValue | string) {
  const labels: Record<string, string> = {
    approved: "[decision text]",
    rejected: "Ð¢Ð°Ñ‚Ð³Ð°Ð»Ð·ÑÐ°Ð½",
    referred: "Ð”Ð°Ñ…Ð¸Ð½ Ñ…ÑÐ½Ð°Ñ…",
    counteroffer: "[decision text]"
  };

  return labels[decision] ?? decision.replaceAll("_", " ");
}

function formatSource(source: string) {
  const labels: Record<string, string> = {
    chat_intake: "[decision text]",
    traditional_form: "Ð¼Ð°ÑÐ³Ñ‚",
    web: "Ð²ÑÐ±"
  };

  return labels[source] ?? source.replaceAll("_", " ");
}

function formatOfferStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Ñ…Ò¯Ð»ÑÑÐ³Ð´ÑÐ¶ Ð±ÑƒÐ¹",
    accepted: "[decision text]",
    expired: "Ñ…ÑƒÐ³Ð°Ñ†Ð°Ð° Ð´ÑƒÑƒÑÑÐ°Ð½",
    cancelled: "Ñ†ÑƒÑ†Ð°Ð»ÑÐ°Ð½"
  };

  return labels[status] ?? status.replaceAll("_", " ");
}
