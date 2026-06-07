import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ApplicationDetailWorkspace } from "@/components/application-detail-workspace";
import { RiskBadge, StatusBadge } from "@/components/status-badge";
import { TopNav } from "@/components/top-nav";
import { statusOptions } from "@/lib/data";
import { getAuthorizedApplication, getCurrentDemoUser } from "@/lib/security/access-control";
import type { ApplicationStatus } from "@/lib/types";

export default async function ApplicationDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { status?: string };
}) {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const application = await getAuthorizedApplication(params.id, user);
  const t = await getTranslations("ApplicationDetail");
  const common = await getTranslations("Common");

  if (!application) {
    if (isUuid(params.id)) {
      redirect(`/app/application/${params.id}`);
    }

    notFound();
  }

  const updatedStatus = statusOptions.includes(searchParams.status as ApplicationStatus)
    ? (searchParams.status as ApplicationStatus)
    : undefined;
  const visibleApplication = updatedStatus ? { ...application, status: updatedStatus } : application;
  const backHref = user.role === "BORROWER" ? "/borrower" : user.role === "ADMIN" ? "/admin" : "/officer";

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-normal text-ink">
                {visibleApplication.applicationNumber}
              </h1>
              <StatusBadge status={visibleApplication.status} />
              {visibleApplication.aiAnalysis ? <RiskBadge riskLevel={visibleApplication.aiAnalysis.riskLevel} /> : null}
            </div>
            <p className="mt-3 max-w-3xl text-slate-600">{visibleApplication.loanPurpose}</p>
          </div>
          <Link
            href={backHref}
            className="focus-ring rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-surface"
          >
            {common("backToDashboard")}
          </Link>
        </div>

        <ApplicationDetailWorkspace application={visibleApplication} actorRole={user.role} />
      </section>
    </main>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
