import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { approveAgentMessageAction, rejectAgentMessageAction, runAgentAnalysisAction } from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import { TopNav } from "@/components/top-nav";
import { agentActionLogs } from "@/lib/data";
import {
  getConversationsForApplication,
  getStoredChecklist,
  runMissingDocumentAnalysis
} from "@/lib/agents/loan-operations-agent";
import { getAuthorizedApplication, getCurrentDemoUser } from "@/lib/security/access-control";

export default async function ApplicationAgentPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { run?: string; message?: string; body?: string };
}) {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const t = await getTranslations("AgentWorkspace");
  const common = await getTranslations("Common");
  const documentTypeT = await getTranslations("DocumentType");
  const actionTypeT = await getTranslations("AgentActionType");

  if (user.role === "BORROWER") {
    notFound();
  }

  const application = await getAuthorizedApplication(params.id, user);

  if (!application) {
    notFound();
  }

  const generated = searchParams.run ? await runMissingDocumentAnalysis(application.id) : undefined;
  const storedChecklist = getStoredChecklist(application.id);
  const checklist = generated?.checklist ?? storedChecklist;
  const conversations = getConversationsForApplication(application.id);
  const draftMessage = generated?.draftMessage ?? conversations[0]?.messages.find((message) => message.status === "PENDING_APPROVAL");
  const logs = [...agentActionLogs.filter((log) => log.loanApplicationId === application.id), ...(generated?.actionLogs ?? [])];
  const approvedBody = searchParams.message === "approved" ? searchParams.body ?? "" : undefined;

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-normal text-ink">{application.applicationNumber}</h1>
              <StatusBadge status={application.status} />
            </div>
            <p className="mt-3 max-w-3xl text-slate-600">
              {t("description")}
            </p>
          </div>
          <Link
            href={`/applications/${application.id}`}
            className="focus-ring rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-surface"
          >
            {t("openApplication")}
          </Link>
        </div>

        {approvedBody ? (
          <p className="mt-6 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {t("approvedNotice")}
          </p>
        ) : null}
        {searchParams.message === "rejected" ? (
          <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {t("rejectedNotice")}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{t("missingDocumentAnalysis")}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("analysisDescription")}
            </p>
            <form action={runAgentAnalysisAction} className="mt-5">
              <input type="hidden" name="applicationId" value={application.id} />
              <button className="focus-ring rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                {t("runAnalysis")}
              </button>
            </form>
            <div className="mt-6 space-y-3">
              {checklist.length > 0 ? (
                checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded border p-4 ${
                      item.isSatisfied ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-ink">{item.label}</p>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {item.isSatisfied ? common("satisfied") : common("missing")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{documentTypeT(item.documentType)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded border border-dashed border-line p-4 text-sm text-slate-600">
                  {t("runToGenerateChecklist")}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{t("followUpDraft")}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("followUpDescription")}
            </p>
            {draftMessage ? (
              <form action={approveAgentMessageAction} className="mt-5 space-y-4">
                <input type="hidden" name="applicationId" value={application.id} />
                <label className="block text-sm font-medium text-slate-700">
                  {t("subject")}
                  <input
                    name="subject"
                    defaultValue={draftMessage.subject}
                    className="focus-ring mt-2 w-full rounded border border-line px-3 py-2"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  {t("messageBody")}
                  <textarea
                    name="body"
                    defaultValue={approvedBody ?? draftMessage.body}
                    rows={10}
                    className="focus-ring mt-2 w-full rounded border border-line px-3 py-2"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-accent">
                    {t("approveMessage")}
                  </button>
                  <button
                    formAction={rejectAgentMessageAction}
                    className="focus-ring rounded border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-surface"
                  >
                    {t("rejectDraft")}
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-5 rounded border border-dashed border-line p-4 text-sm text-slate-600">
                {t("runToGenerateMessage")}
              </p>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">{t("actionLog")}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded border border-line bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                  {actionTypeT(log.actionType)}
                </p>
                <p className="mt-3 text-sm text-slate-700">{log.outputSummary}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
