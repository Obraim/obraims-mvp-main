import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { runAgentAnalysisAction } from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import { TopNav } from "@/components/top-nav";
import { agentActionLogs, agentTasks } from "@/lib/data";
import { loanApplicationRepository } from "@/lib/repositories/loan-applications";
import { getCurrentDemoUser, getVisibleApplicationsForUser } from "@/lib/security/access-control";

export default async function AgentReviewPage() {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const t = await getTranslations("AgentReview");
  const taskStatusT = await getTranslations("AgentTaskStatus");
  const actionTypeT = await getTranslations("AgentActionType");

  if (user.role === "BORROWER") {
    notFound();
  }

  const applications = await getVisibleApplicationsForUser(user);
  const taskRows = await Promise.all(
    agentTasks.map(async (task) => ({
      task,
      application: await loanApplicationRepository.findById(task.loanApplicationId)
    }))
  );

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-line pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{t("title")}</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            {t("description")}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{t("readyTitle")}</h2>
            <div className="mt-5 space-y-3">
              {applications.map((application) => (
                <div key={application.id} className="rounded border border-line p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">{application.applicationNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">{application.borrowerProfile.legalName}</p>
                      <p className="mt-2 text-sm text-slate-500">{application.loanPurpose}</p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={runAgentAnalysisAction}>
                      <input type="hidden" name="applicationId" value={application.id} />
                      <button className="focus-ring rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                        {t("runMissingDocumentAnalysis")}
                      </button>
                    </form>
                    <Link
                      href={`/officer/applications/${application.id}/agent`}
                      className="focus-ring rounded border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-surface"
                    >
                      {t("openAgentWorkspace")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{t("taskQueue")}</h2>
            <div className="mt-5 space-y-3">
              {taskRows.map(({ task, application }) => {
                return (
                  <Link
                    key={task.id}
                    href={`/officer/applications/${task.loanApplicationId}/agent`}
                    className="block rounded border border-line p-4 hover:bg-surface"
                  >
                    <p className="text-sm font-semibold text-ink">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {application?.applicationNumber ?? task.loanApplicationId} - {taskStatusT(task.status)}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">{task.description}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">{t("recentLog")}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {agentActionLogs.map((log) => (
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
