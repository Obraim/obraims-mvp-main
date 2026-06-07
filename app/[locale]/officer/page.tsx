import { notFound } from "next/navigation";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MetricCard } from "@/components/metric-card";
import { RiskBadge, StatusBadge } from "@/components/status-badge";
import { TopNav } from "@/components/top-nav";
import { statusOptions } from "@/lib/data";
import { getCurrentDemoUser, getVisibleApplicationsForUser } from "@/lib/security/access-control";
import type { ApplicationStatus } from "@/lib/types";

export default async function OfficerDashboardPage({
  searchParams
}: {
  searchParams: { status?: string };
}) {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const t = await getTranslations("OfficerDashboard");
  const common = await getTranslations("Common");
  const statusT = await getTranslations("Status");
  const locale = await getLocale();

  if (!["LOAN_OFFICER", "CREDIT_ANALYST", "ADMIN"].includes(user.role)) {
    notFound();
  }

  const applications = await getVisibleApplicationsForUser(user);
  const metrics = {
    totalApplications: applications.length,
    totalExposure: applications.reduce((sum, application) => sum + application.requestedAmount, 0),
    highRisk: applications.filter((application) => application.aiAnalysis?.riskLevel === "HIGH").length,
    needsInfo: applications.filter((application) => application.status === "MORE_INFO_NEEDED").length
  };
  const activeStatus = statusOptions.includes(searchParams.status as ApplicationStatus)
    ? (searchParams.status as ApplicationStatus)
    : undefined;
  const visibleApplications = activeStatus
    ? applications.filter((application) => application.status === activeStatus)
    : applications;

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{t("title")}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              {t("description")}
            </p>
          </div>
          <NextLink
            href="/app/apply"
            className="focus-ring rounded bg-ink px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700"
          >
            {common("newApplication")}
          </NextLink>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label={t("applications")} value={String(metrics.totalApplications)} detail={t("activeRecords")} />
          <MetricCard
            label={t("exposure")}
            value={new Intl.NumberFormat(locale, {
              notation: "compact",
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 1
            }).format(metrics.totalExposure)}
            detail={t("requestedPrincipal")}
          />
          <MetricCard label={t("highRisk")} value={String(metrics.highRisk)} detail={t("aiPreliminaryLevel")} />
          <MetricCard label={t("needsInfo")} value={String(metrics.needsInfo)} detail={t("borrowerFollowUp")} />
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/officer"
            className={`focus-ring rounded border px-3 py-2 text-sm font-semibold ${
              activeStatus ? "border-line bg-white text-slate-700" : "border-ink bg-ink text-white"
            }`}
          >
            {common("all")}
          </Link>
          {statusOptions.map((status) => (
            <Link
              key={status}
              href={`/officer?status=${status}`}
              className={`focus-ring rounded border px-3 py-2 text-sm font-semibold ${
                activeStatus === status ? "border-ink bg-ink text-white" : "border-line bg-white text-slate-700"
              }`}
            >
              {statusT(status)}
            </Link>
          ))}
        </div>
        <div className="mt-8 overflow-x-auto rounded border border-line bg-white shadow-soft">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.75fr_0.8fr_0.7fr] gap-4 border-b border-line bg-surface px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>{t("application")}</span>
              <span>{t("borrower")}</span>
              <span>{common("status")}</span>
              <span>{t("risk")}</span>
              <span>{t("missingDocs")}</span>
              <span className="text-right">{t("amount")}</span>
            </div>
            {visibleApplications.map((application) => (
              <Link
                key={application.id}
                href={`/applications/${application.id}`}
                className="grid grid-cols-[1.2fr_1fr_0.8fr_0.75fr_0.8fr_0.7fr] gap-4 border-b border-line px-5 py-4 text-sm last:border-b-0 hover:bg-surface"
              >
                <span>
                  <span className="block font-semibold text-ink">{application.applicationNumber}</span>
                  <span className="text-slate-500">{application.loanPurpose}</span>
                </span>
                <span className="font-medium text-slate-700">
                  {application.borrowerProfile.legalName}
                </span>
                <span>
                  <StatusBadge status={application.status} />
                </span>
                <span>
                  {application.aiAnalysis ? <RiskBadge riskLevel={application.aiAnalysis.riskLevel} /> : null}
                </span>
                <span className="font-medium text-slate-700">
                  {application.aiAnalysis?.missingDocuments.length ?? 0}
                </span>
                <span className="text-right font-semibold">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: application.currency,
                    maximumFractionDigits: 0
                  }).format(application.requestedAmount)}
                </span>
              </Link>
            ))}
          </div>
          {visibleApplications.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-600">{common("noApplicationsForStatus")}</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
