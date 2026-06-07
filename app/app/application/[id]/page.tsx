import { notFound, redirect } from "next/navigation";
import { isSuperAdmin, requireAdmin, requireAuthenticatedUser, requireApplicationAccess } from "@/src/lib/obraims/access-control";
import {
  acceptLoanOffer,
  getLoanApplicationDetail,
  listAuditEventsForApplication,
  listDocumentRecordsForApplication,
  saveCreditMemo,
  uploadApplicationDocument,
  type IntakeDocument,
  type IntakeDocumentType
} from "@/src/lib/obraims/simple-core";
import { generateCreditMemo } from "@/src/lib/obraims/credit-memo";
import { ObraimsDocumentDownloadButton } from "@/components/obraims-document-download-button";
import { ObraimsAppShell } from "@/components/obraims-app-shell";
import { AiInsightCard, Alert, MetricTile, SectionHeader, ShellCard, SourceChip, StatusChip, TabsBar, Timeline, titleize } from "@/components/obraims-ui";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "MNT",
  maximumFractionDigits: 0
});
const documentTypes = new Set<IntakeDocumentType>([
  "national_id",
  "income_proof",
  "bank_statement",
  "credit_bureau",
  "business_registration",
  "collateral_document",
  "loan_agreement",
  "other_statement",
  "other"
]);
const defaultDocumentRequests: IntakeDocument[] = [
  { type: "national_id", name: "National ID", status: "requested" },
  { type: "income_proof", name: "Income proof or salary/business revenue proof", status: "requested" },
  { type: "bank_statement", name: "Bank statement", status: "requested" },
  { type: "credit_bureau", name: "Credit bureau report", status: "requested" },
  { type: "business_registration", name: "Business registration", status: "requested" },
  { type: "collateral_document", name: "Collateral document", status: "requested" },
  { type: "loan_agreement", name: "Other loan agreement", status: "requested" },
  { type: "other_statement", name: "Other loan or account statement", status: "requested" },
  { type: "other", name: "Other supporting document", status: "requested" }
];

function applicationReturnTo(applicationId: string, type: "document_uploaded" | "document_error", message: string) {
  const params = new URLSearchParams();
  params.set(type, message);
  return `/app/application/${applicationId}?${params.toString()}`;
}

async function acceptOfferAction(formData: FormData) {
  "use server";

  const offerId = String(formData.get("offer_id") ?? "");
  const applicationId = String(formData.get("application_id") ?? "");

  if (!offerId || !applicationId) {
    throw new Error("Offer and application are required.");
  }

  await acceptLoanOffer({
    loanOfferId: offerId,
    audit: {
      actorType: "customer"
    }
  });

  redirect(`/app/application/${applicationId}`);
}

async function uploadDocumentAction(formData: FormData) {
  "use server";

  const applicationId = String(formData.get("application_id") ?? "");
  let redirectTo = applicationId ? `/app/application/${applicationId}` : "/app/apply";

  try {
    const admin = await requireAdmin();
    const file = formData.get("file");
    const documentType = String(formData.get("document_type") ?? "");

    if (!applicationId) {
      throw new Error("Application is required.");
    }

    if (!documentTypes.has(documentType as IntakeDocumentType)) {
      throw new Error("Document type is required.");
    }

    if (!(file instanceof File)) {
      throw new Error("A document file is required.");
    }

    await uploadApplicationDocument({
      loanApplicationId: applicationId,
      documentType: documentType as IntakeDocumentType,
      file,
      audit: {
        actorType: "admin",
        actorId: admin.id,
        metadata: {
          action_source: "application_detail_document_upload"
        }
      }
    });

    redirectTo = applicationReturnTo(applicationId, "document_uploaded", "Document uploaded successfully.");
  } catch (error) {
    console.error("Application document upload failed", error);
    redirectTo = applicationReturnTo(applicationId, "document_error", error instanceof Error ? error.message : "Unable to upload document.");
  }

  redirect(redirectTo);
}

async function generateCreditMemoAction(formData: FormData) {
  "use server";

  const applicationId = String(formData.get("application_id") ?? "");
  let redirectTo = applicationId ? `/app/application/${applicationId}` : "/app/admin/applications";

  try {
    const admin = await requireAdmin();

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
          action_source: "application_detail_generate_credit_memo",
          model: creditMemo.model
        }
      }
    });
  } catch (error) {
    console.error("Application credit memo generation failed", error);
    const params = new URLSearchParams();
    params.set("document_error", error instanceof Error ? error.message : "Credit memo generation failed.");
    redirectTo = applicationId ? `/app/application/${applicationId}?${params.toString()}` : "/app/admin/applications";
  }

  redirect(redirectTo);
}

export default async function ApplicationPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { document_uploaded?: string; document_error?: string };
}) {
  let application: Awaited<ReturnType<typeof getLoanApplicationDetail>>;
  const user = await requireAuthenticatedUser(`/en/login?redirectTo=${encodeURIComponent(`/app/application/${params.id}`)}`);

  try {
    application = await getLoanApplicationDetail(params.id);
  } catch {
    notFound();
  }

  requireApplicationAccess(user, application);

  const latestDecision = [...application.decisions].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const latestOffer = [...application.loan_offers].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const showAudit = await isSuperAdmin(user);
  const auditEvents = showAudit ? await listAuditEventsForApplication(application.id) : [];
  const documentRecords = showAudit ? await listDocumentRecordsForApplication(application.id) : [];
  const documentUploadSuccess = searchParams?.document_uploaded ? decodeURIComponent(searchParams.document_uploaded) : null;
  const documentUploadError = searchParams?.document_error ? decodeURIComponent(searchParams.document_error) : null;
  const documentRows = documentUploadRows(application.documents ?? []);
  const creditMemo = creditMemoFromMetadata(application.metadata);
  const uploadedDocuments = documentRows.filter((document) => {
    const record = documentRecords.find((item) => item.document_type === document.type);
    return (record?.status ?? document.status) === "uploaded";
  });
  const missingDocuments = documentRows.filter((document) => {
    const record = documentRecords.find((item) => item.document_type === document.type);
    return (record?.status ?? document.status) !== "uploaded";
  });
  const recentAuditEvents = auditEvents.slice(0, 4);
  const currentReviewStage = latestOffer
    ? "Offer stage"
    : latestDecision
      ? "Decision recorded"
      : application.status === "submitted" || application.status === "under_review"
        ? "Human review"
        : titleize(application.status);
  const memoStatus = creditMemo ? "Memo ready" : "Memo needed";
  const collateralStatus = application.has_collateral ? "Collateral offered" : "No collateral";

  return (
    <ObraimsAppShell
      active="Applications"
      eyebrow="Application workspace"
      title={application.customer.full_name ?? "Unnamed applicant"}
      subtitle={`${currency.format(Number(application.requested_amount))} requested over ${application.requested_term_months} months`}
      actions={
        <a href="/app/admin/applications" className="btn-secondary">Back to applications</a>
      }
    >
      <ShellCard className="p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip value={application.status} />
              <SourceChip value={application.source ?? application.channel} />
              {showAudit ? <StatusChip value="info" label="Super Admin Testing Mode" /> : null}
              {latestOffer ? <StatusChip value={latestOffer.status} label={`Offer ${titleize(latestOffer.status)}`} /> : null}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <HeaderFact label="Application ID" value={application.id} />
              <HeaderFact label="Created" value={new Date(application.created_at).toLocaleDateString()} />
              <HeaderFact label="Requested" value={currency.format(Number(application.requested_amount))} />
              <HeaderFact label="Review stage" value={currentReviewStage} />
            </div>
            <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-700">{application.loan_purpose ?? "No purpose provided."}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {showAudit ? (
              <form action={generateCreditMemoAction}>
                <input type="hidden" name="application_id" value={application.id} />
                <button className="btn-primary">{creditMemo ? "Regenerate memo" : "Generate credit memo"}</button>
              </form>
            ) : null}
            <a href="#documents" className="btn-secondary">View documents</a>
            <a href="#credit-memo" className="btn-secondary">Credit memo</a>
            <a href="#decision" className="btn-secondary">Decision</a>
          </div>
        </div>
      </ShellCard>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricTile label="Requested amount" value={currency.format(Number(application.requested_amount))} detail={`${application.requested_term_months} months`} />
        <MetricTile label="Documents" value={`${uploadedDocuments.length}/${documentRows.length}`} detail="Uploaded / required" tone={missingDocuments.length > 0 ? "amber" : "teal"} />
        <MetricTile label="Collateral" value={collateralStatus} detail={application.collateral_type ?? "Borrower stated"} tone={application.has_collateral ? "teal" : "default"} />
        <MetricTile label="Credit memo" value={memoStatus} detail={creditMemo?.model ?? "AI-assisted draft"} tone={creditMemo ? "ai" : "amber"} />
        <MetricTile label="Missing items" value={String(missingDocuments.length)} detail="Document checklist" tone={missingDocuments.length > 0 ? "red" : "teal"} />
        <MetricTile label="Review stage" value={currentReviewStage} detail="Human decision required" tone={latestDecision ? "teal" : "amber"} />
      </div>

      {documentUploadSuccess ? <Notice tone="success" message={documentUploadSuccess} /> : null}
      {documentUploadError ? <Notice tone="error" message={documentUploadError} /> : null}

      <TabsBar
        className="mt-6"
        items={["Overview", "Documents", "Credit Memo", "Decision", "Activity"].map((tab) => ({
          label: tab,
          href: `#${tab.toLowerCase().replaceAll(" ", "-")}`
        }))}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <ShellCard id="overview" className="p-5">
            <SectionHeader title="Overview" detail="The review file at a glance: borrower, request, evidence, and next action." />
            <div className="mt-5 grid gap-3 xl:grid-cols-5">
              <WorkflowStep
                label="Intake"
                state="done"
                detail={application.channel === "chat" ? "Chat captured" : "Form captured"}
              />
              <WorkflowStep
                label="Documents"
                state={missingDocuments.length > 0 ? "current" : "done"}
                detail={missingDocuments.length > 0 ? `${missingDocuments.length} missing` : "Checklist ready"}
              />
              <WorkflowStep
                label="Credit memo"
                state={creditMemo ? "done" : "current"}
                detail={creditMemo ? "Draft ready" : "Needs generation"}
              />
              <WorkflowStep
                label="Decision"
                state={latestDecision ? "done" : "todo"}
                detail={latestDecision ? titleize(latestDecision.decision) : "Human review"}
              />
              <WorkflowStep
                label="Offer"
                state={latestOffer ? "done" : "todo"}
                detail={latestOffer ? titleize(latestOffer.status) : "Pending decision"}
              />
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-line bg-surface p-4">
                <h3 className="font-semibold text-ink">Loan request summary</h3>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Info label="Requested amount" value={currency.format(Number(application.requested_amount))} />
                  <Info label="Requested term" value={`${application.requested_term_months} months`} />
                  <Info label="Loan purpose" value={application.loan_purpose ?? "Not provided"} />
                  <Info label="Submitted" value={application.submitted_at ? new Date(application.submitted_at).toLocaleString() : "Not submitted"} />
                  <Info label="Monthly income" value={application.monthly_income ? currency.format(Number(application.monthly_income)) : "Not provided"} />
                  <Info label="Employment" value={application.employment_status ?? "Not provided"} />
                </dl>
              </div>
              <div className="rounded-xl border border-line bg-white p-4">
                <h3 className="font-semibold text-ink">Borrower snapshot</h3>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Info label="Full name" value={application.customer.full_name ?? "Not provided"} />
                  <Info label="Phone" value={application.customer.phone ?? "Not provided"} />
                  <Info label="Email" value={application.customer.email ?? "Not provided"} />
                  <Info label="Address" value={application.address_line1 ?? "Not provided"} />
                  <Info label="District / city" value={application.district_city ?? "Not provided"} />
                </dl>
              </div>
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
              <AiInsightCard title="AI-assisted review guidance">
                <p>
                  {creditMemo
                    ? "A credit memo draft is ready. Treat it as structured guidance for human review, not as an approval decision."
                    : "Generate a credit memo once the document set is sufficient. Obraims should clarify requirements and never promise approval."}
                </p>
              </AiInsightCard>
              <div className="rounded-xl border border-warning/25 bg-amber-50 p-4">
                <h3 className="font-semibold text-amber-900">Required next steps</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
                  <li>Review borrower-stated income, purpose, address, and collateral context.</li>
                  <li>Resolve missing documents before relying on AI memo output.</li>
                  <li>Record a human decision only after review is complete.</li>
                </ul>
              </div>
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
              <ChecklistPanel title="Missing documents" items={missingDocuments.map((document) => document.name)} empty="No missing documents in the current checklist." />
              <CollateralSummary application={application} />
            </div>
          </ShellCard>

          <ShellCard id="documents" className="p-5">
            <SectionHeader title="Documents" detail="Private documents are accessed only through short-lived signed links." />
            {showAudit ? <QuickDocumentUploadForm applicationId={application.id} /> : null}
            {documentRecords.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-line bg-surface p-5 text-sm text-slate-600">
                No uploaded files yet. The checklist below shows requested document types and admin-only upload actions.
              </div>
            ) : null}
            <div className="mt-5 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-line bg-surface text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Requested item</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {documentRows.map((document) => {
                    const record = documentRecords.find((item) => item.document_type === document.type);
                    return (
                      <tr key={document.type} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-3 font-medium text-ink">{titleize(document.type)}</td>
                        <td className="px-4 py-3 text-slate-600">{document.name}</td>
                        <td className="px-4 py-3"><StatusChip value={record?.status ?? document.status} /></td>
                        <td className="px-4 py-3 text-slate-600">{record?.file_name ?? "No file yet"}</td>
                        <td className="px-4 py-3 text-slate-600">{record?.created_at ? new Date(record.created_at).toLocaleString() : "Not uploaded"}</td>
                        <td className="px-4 py-3">
                          {record ? <ObraimsDocumentDownloadButton applicationId={application.id} documentId={record.id} /> : showAudit ? <DocumentUploadForm applicationId={application.id} document={document} /> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ShellCard>

          <ShellCard id="credit-memo" className="p-5">
            {showAudit ? (
              <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <SectionHeader title="Credit Memo" detail="AI-generated draft for human review only. It is not an approval decision." />
                <form action={generateCreditMemoAction}>
                  <input type="hidden" name="application_id" value={application.id} />
                  <button className="btn-primary">
                    {creditMemo ? "Regenerate" : "Generate"}
                  </button>
                </form>
              </div>
              {missingDocuments.length > 0 ? (
                <Alert tone="warning" title="Document set incomplete" className="mt-5">
                  {missingDocuments.length} requested item{missingDocuments.length === 1 ? " is" : "s are"} still missing. Memo output should be reviewed with that limitation in mind.
                </Alert>
              ) : null}
              {creditMemo ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-ai/20 bg-aiSoft p-4 lg:col-span-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip value="memo_ready" label="AI-generated draft" />
                      <span className="caption">Human review required</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {creditMemo.disclaimer ?? "AI-generated draft for human review only. This is not an approval decision."}
                    </p>
                  </div>
                  <MemoBlock title="Borrower summary" value={creditMemo.borrower_summary} />
                  <MemoBlock title="Request summary" value={creditMemo.request_summary} />
                  <MemoBlock title="Document summary" value={creditMemo.document_summary} />
                  <MemoList title="Strengths" items={creditMemo.strengths} />
                  <MemoList title="Risks" items={creditMemo.risks} />
                  <MemoList title="Missing items" items={creditMemo.missing_items} />
                  <MemoList title="Next steps" items={creditMemo.recommended_next_steps} />
                  <MemoList title="Requirements" items={creditMemo.lending_requirements} />
                  <p className="text-xs text-slate-500 lg:col-span-2">
                    Generated {creditMemo.generated_at ? new Date(creditMemo.generated_at).toLocaleString() : "recently"} with {creditMemo.model ?? "OpenAI"}.
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-line bg-surface p-5 text-sm leading-6 text-slate-600">
                  No credit memo generated yet. Generate one after reviewing document completeness.
                </div>
              )}
              </>
            ) : (
              <>
                <SectionHeader title="Credit Memo" detail="Internal AI memo workspace." />
                <div className="mt-5 rounded-xl border border-dashed border-line bg-surface p-5 text-sm leading-6 text-slate-600">
                  Credit memo details are available to authorized internal reviewers.
                </div>
              </>
            )}
          </ShellCard>

          <ShellCard id="decision" className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader title="Decision" detail="Human decision, reasons, and offer records from Simple Core." />
              <StatusChip value={latestDecision ? latestDecision.decision : "under_review"} label={latestDecision ? titleize(latestDecision.decision) : "Human decision required"} />
            </div>
            <Alert tone="info" title="Human decision required" className="mt-5">
              Obraims can structure evidence and generate AI memo drafts, but this workspace does not auto-approve or auto-reject applications. Final decisioning stays with an authorized human reviewer.
            </Alert>
            {latestDecision ? (
              <div className="mt-5 space-y-4">
                <StatusChip value={latestDecision.decision} label={titleize(latestDecision.decision)} />
                <p className="text-sm leading-6 text-slate-700">{latestDecision.summary}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {latestDecision.decision_reasons.map((reason) => (
                    <div key={reason.id} className="rounded-lg border border-line bg-surface p-4">
                      <p className="text-sm font-semibold text-ink">{reason.title}</p>
                      {reason.description ? <p className="mt-1 text-sm text-slate-600">{reason.description}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert tone="info" className="mt-5">Under review. No decision has been recorded yet.</Alert>
            )}
            {latestOffer ? (
              <div className="mt-5 rounded-lg border border-line bg-surface p-4">
                <h3 className="font-semibold text-ink">Loan offer</h3>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Info label="Amount" value={currency.format(Number(latestOffer.amount))} />
                  <Info label="Term" value={`${latestOffer.term_months} months`} />
                  <Info label="APR" value={`${Number(latestOffer.annual_interest_rate).toFixed(2)}%`} />
                  <Info label="Monthly payment" value={latestOffer.monthly_payment ? currency.format(Number(latestOffer.monthly_payment)) : "Not calculated"} />
                </dl>
                {latestOffer.status === "pending" ? (
                  <form action={acceptOfferAction} className="mt-4">
                    <input type="hidden" name="offer_id" value={latestOffer.id} />
                    <input type="hidden" name="application_id" value={application.id} />
                    <button className="btn-accent">Accept offer</button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </ShellCard>

          <ShellCard id="activity" className="p-5">
            <SectionHeader title="Activity" detail="Audit events related to this loan application." />
            {showAudit ? (
              <div className="mt-4">
                {auditEvents.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-line bg-white">
                    <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-2 text-xs text-slate-500">
                      <span>Showing latest {Math.min(auditEvents.length, 12)} of {auditEvents.length} events</span>
                      <span>Admin only</span>
                    </div>
                    <div className="max-h-72 divide-y divide-line overflow-y-auto">
                      {auditEvents.slice(0, 12).map((event) => (
                        <div
                          key={event.id}
                          className="grid gap-2 px-3 py-2.5 text-xs sm:grid-cols-[minmax(0,1fr)_120px_170px] sm:items-center"
                        >
                          <p className="truncate font-semibold text-ink">{event.action}</p>
                          <p className="text-slate-600">Actor: {event.actor_type}</p>
                          <p className="text-slate-500 sm:text-right">{new Date(event.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {auditEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line bg-surface p-5 text-sm text-slate-600">
                    No audit events have been recorded for this application yet.
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-line bg-surface p-5 text-sm text-slate-600">
                Audit trail visibility is limited to authorized internal users.
              </div>
            )}
          </ShellCard>
        </div>

        <aside className="space-y-6">
          <ShellCard className="p-5">
            <h2 className="font-semibold text-ink">Next actions</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>Review document completeness and generate or refresh the credit memo.</p>
              <p>Confirm borrower-stated income, purpose, and collateral before decisioning.</p>
              <p>Never treat AI output as an approval decision.</p>
            </div>
          </ShellCard>
          <ShellCard className="p-5">
            <h2 className="font-semibold text-ink">Status timeline</h2>
            <div className="mt-4">
              <Timeline
                items={[
                  { label: "Submitted", detail: application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : "Awaiting submission", state: application.submitted_at ? "done" : "todo" },
                  { label: latestDecision ? "Decision recorded" : "Under review", detail: latestDecision ? titleize(latestDecision.decision) : "Reviewer checks documents and affordability", state: latestDecision ? "done" : "current" },
                  { label: latestOffer ? "Offer generated" : "Offer pending", detail: latestOffer ? titleize(latestOffer.status) : "Created only after an eligible decision", state: latestOffer ? "done" : "todo" }
                ]}
              />
            </div>
          </ShellCard>
        </aside>
      </div>
    </ObraimsAppShell>
  );
}
function DocumentUploadForm({
  applicationId,
  document
}: {
  applicationId: string;
  document: IntakeDocument;
}) {
  return (
    <form action={uploadDocumentAction} encType="multipart/form-data" className="flex min-w-[280px] flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="document_type" value={document.type} />
      <input
        name="file"
        type="file"
        required
        className="file-input text-xs file:text-xs"
      />
      <button className="btn-accent px-3 py-2 text-xs">
        Upload
      </button>
    </form>
  );
}

function QuickDocumentUploadForm({ applicationId }: { applicationId: string }) {
  return (
    <form
      action={uploadDocumentAction}
      encType="multipart/form-data"
      className="mt-5 grid gap-3 rounded-xl border border-primary/20 bg-primarySoft/70 p-4 md:grid-cols-[1fr_1.4fr_auto]"
    >
      <input type="hidden" name="application_id" value={applicationId} />
      <label className="label block">
        Document type
        <select name="document_type" required className="field mt-2">
          {defaultDocumentRequests.map((document) => (
            <option key={document.type} value={document.type}>
              {formatDocumentType(document.type)}
            </option>
          ))}
        </select>
      </label>
      <label className="label block">
        File attachment
        <input
          name="file"
          type="file"
          required
          className="file-input mt-2"
        />
      </label>
      <button className="btn-accent self-end">
        Attach document
      </button>
    </form>
  );
}

function documentUploadRows(documents: IntakeDocument[]) {
  const byType = new Map<IntakeDocumentType, IntakeDocument>();

  for (const document of defaultDocumentRequests) {
    byType.set(document.type, document);
  }

  for (const document of documents) {
    byType.set(document.type, document);
  }

  return [...byType.values()];
}

function HeaderFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="caption uppercase tracking-wide">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function WorkflowStep({
  label,
  detail,
  state
}: {
  label: string;
  detail: string;
  state: "done" | "current" | "todo";
}) {
  const dotClass =
    state === "done"
      ? "bg-success"
      : state === "current"
        ? "bg-warning"
        : "bg-slate-300";
  const cardClass =
    state === "current"
      ? "border-warning/30 bg-amber-50"
      : state === "done"
        ? "border-teal/20 bg-teal-50/60"
        : "border-line bg-white";

  return (
    <div className={`rounded-xl border p-3 ${cardClass}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <p className="text-sm font-semibold text-ink">{label}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

function CollateralSummary({
  application
}: {
  application: Awaited<ReturnType<typeof getLoanApplicationDetail>>;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="font-semibold text-ink">Collateral and property</h3>
      {application.has_collateral ? (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Info label="Type" value={application.collateral_type ?? "Not provided"} />
          <Info
            label="Estimated value"
            value={application.collateral_estimated_value ? currency.format(Number(application.collateral_estimated_value)) : "Not provided"}
          />
          <Info label="Ownership" value={application.collateral_ownership_status ?? "Not provided"} />
          <Info label="Location" value={application.collateral_location ?? "Not provided"} />
          <div className="sm:col-span-2">
            <Info label="Description" value={application.collateral_description ?? "Not provided"} />
          </div>
        </dl>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-line bg-surface p-3 text-sm text-slate-600">
          No collateral was offered for this request.
        </p>
      )}
    </div>
  );
}

function ChecklistPanel({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="font-semibold text-ink">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 6).map((item) => (
            <li key={item} className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2 text-sm text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-line bg-surface p-3 text-sm text-slate-600">{empty}</p>
      )}
    </div>
  );
}

function ActivityPreview({
  events,
  showAudit
}: {
  events: Awaited<ReturnType<typeof listAuditEventsForApplication>>;
  showAudit: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="font-semibold text-ink">Recent activity</h3>
      {showAudit ? (
        events.length > 0 ? (
          <div className="mt-3 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg bg-surface px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink">{event.action}</span>
                  <span className="caption shrink-0">{new Date(event.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-slate-600">Actor: {event.actor_type}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-line bg-surface p-3 text-sm text-slate-600">No recent audit activity.</p>
        )
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-line bg-surface p-3 text-sm text-slate-600">
          Activity is visible to authorized internal users.
        </p>
      )}
    </div>
  );
}

function Notice({ tone, message }: { tone: "success" | "error"; message: string }) {
  const className =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return <div className={`mt-6 rounded-md border p-4 text-sm font-medium ${className}`}>{message}</div>;
}

function MemoBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value || "Not generated."}</p>
    </div>
  );
}

function MemoList({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="rounded border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {items && items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item} className="rounded bg-white px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-600">None listed.</p>
      )}
    </div>
  );
}

function creditMemoFromMetadata(metadata: Record<string, unknown>) {
  const memo = metadata.credit_memo;

  if (!memo || typeof memo !== "object" || Array.isArray(memo)) {
    return null;
  }

  return memo as {
    generated_at?: string;
    model?: string;
    borrower_summary?: string;
    request_summary?: string;
    document_summary?: string;
    strengths?: string[];
    risks?: string[];
    missing_items?: string[];
    recommended_next_steps?: string[];
    lending_requirements?: string[];
    disclaimer?: string;
  };
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "Ð½Ð¾Ð¾Ñ€Ð¾Ð³",
    submitted: "Ð¸Ð»Ð³ÑÑÑÑÐ½",
    under_review: "Ñ…ÑÐ½Ð°Ð»Ñ‚Ð°Ð´",
    approved: "Ð·Ó©Ð²ÑˆÓ©Ó©Ñ€ÑÓ©Ð½",
    rejected: "Ñ‚Ð°Ñ‚Ð³Ð°Ð»Ð·ÑÐ°Ð½",
    offer_generated: "ÑÐ°Ð½Ð°Ð» Ò¯Ò¯ÑÑÑÐ½",
    offer_accepted: "ÑÐ°Ð½Ð°Ð» Ð·Ó©Ð²ÑˆÓ©Ó©Ñ€ÑÓ©Ð½",
    cancelled: "Ñ†ÑƒÑ†Ð°Ð»ÑÐ°Ð½"
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function formatDecision(decision: string) {
  const labels: Record<string, string> = {
    approved: "Ð—Ó©Ð²ÑˆÓ©Ó©Ñ€ÑÓ©Ð½",
    rejected: "Ð¢Ð°Ñ‚Ð³Ð°Ð»Ð·ÑÐ°Ð½",
    referred: "Ð”Ð°Ñ…Ð¸Ð½ Ñ…ÑÐ½Ð°Ñ…",
    counteroffer: "Ð¡Ó©Ñ€Ó©Ð³ ÑÐ°Ð½Ð°Ð»"
  };

  return labels[decision] ?? decision.replaceAll("_", " ");
}

function formatSource(source: string) {
  const labels: Record<string, string> = {
    chat_intake: "Ñ‡Ð°Ñ‚ Ó©Ñ€Ð³Ó©Ð´Ó©Ð»",
    traditional_form: "Ð¼Ð°ÑÐ³Ñ‚",
    web: "Ð²ÑÐ±"
  };

  return labels[source] ?? source.replaceAll("_", " ");
}

function formatDocumentType(type: string) {
  const labels: Record<string, string> = {
    national_id: "National ID",
    income_proof: "Income proof",
    bank_statement: "Bank statement",
    credit_bureau: "Credit bureau report",
    business_registration: "Business registration",
    collateral_document: "Collateral document",
    loan_agreement: "Other loan agreement",
    other_statement: "Other loan or account statement",
    other: "Other"
  };

  return labels[type] ?? type.replaceAll("_", " ");
}

function formatDocumentStatus(status: string) {
  const labels: Record<string, string> = {
    requested: "ÑˆÐ°Ð°Ñ€Ð´Ð»Ð°Ð³Ð°Ñ‚Ð°Ð¹",
    uploaded: "Ð¾Ñ€ÑƒÑƒÐ»ÑÐ°Ð½",
    missing: "Ð´ÑƒÑ‚ÑƒÑƒ"
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) {
    return "Unknown";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatOfferStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Ñ…Ò¯Ð»ÑÑÐ³Ð´ÑÐ¶ Ð±Ð°Ð¹Ð½Ð°",
    accepted: "Ð·Ó©Ð²ÑˆÓ©Ó©Ñ€ÑÓ©Ð½",
    expired: "Ñ…ÑƒÐ³Ð°Ñ†Ð°Ð° Ð´ÑƒÑƒÑÑÐ°Ð½",
    cancelled: "Ñ†ÑƒÑ†Ð°Ð»ÑÐ°Ð½"
  };

  return labels[status] ?? status.replaceAll("_", " ");
}
