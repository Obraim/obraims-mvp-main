import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ApplicationStatusForm } from "@/components/application-status-form";
import { RiskBadge, StatusBadge } from "@/components/status-badge";
import type { LoanApplication, UserRole } from "@/lib/types";

export function ApplicationDetailWorkspace({
  application,
  actorRole
}: {
  application: LoanApplication;
  actorRole: UserRole;
}) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <BorrowerProfilePanel application={application} />
        <LoanRequestPanel application={application} />
        <DocumentPanel application={application} />
        <NotesPanel application={application} />
        <StatusTimeline application={application} />
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <StatusPanel application={application} canUpdateStatus={actorRole !== "BORROWER"} />
        <AiSidebar application={application} />
        <MissingDocumentsPanel application={application} />
        <ActionsPanel application={application} />
      </aside>
    </div>
  );
}

function BorrowerProfilePanel({ application }: { application: LoanApplication }) {
  const profile = application.borrowerProfile;
  const t = useTranslations("ApplicationDetail");
  const common = useTranslations("Common");
  const borrowerType = useTranslations("BorrowerType");
  const locale = useLocale();

  return (
    <Panel title={t("borrowerProfile")}>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Info label={t("legalName")} value={profile.legalName} />
        <Info label={t("borrowerType")} value={borrowerType(profile.borrowerType)} />
        <Info label={t("email")} value={profile.user.email} />
        <Info label={t("phone")} value={profile.phone} />
        <Info label={t("address")} value={profile.address} />
        <Info label={t("industry")} value={profile.industry ?? common("notProvided")} />
        <Info label={t("registration")} value={profile.registrationNumber ?? common("notProvided")} />
        <Info
          label={t("annualRevenue")}
          value={
            profile.annualRevenue
              ? new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: application.currency,
                  maximumFractionDigits: 0
                }).format(profile.annualRevenue)
              : common("notProvided")
          }
        />
      </dl>
    </Panel>
  );
}

function LoanRequestPanel({ application }: { application: LoanApplication }) {
  const t = useTranslations("ApplicationDetail");
  const loanType = useTranslations("LoanType");
  const locale = useLocale();

  return (
    <Panel title={t("loanRequest")}>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Info label={t("loanType")} value={loanType(application.loanType)} />
        <Info
          label={t("requestedAmount")}
          value={new Intl.NumberFormat(locale, {
            style: "currency",
            currency: application.currency,
            maximumFractionDigits: 0
          }).format(application.requestedAmount)}
        />
        <Info label={t("term")} value={t("termMonths", { months: application.requestedTermMonths })} />
        <Info label={t("officer")} value={application.assignedOfficer?.name ?? t("unassigned")} />
      </dl>
      <div className="mt-5 rounded border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("purpose")}</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{application.loanPurpose}</p>
      </div>
    </Panel>
  );
}

function DocumentPanel({ application }: { application: LoanApplication }) {
  const t = useTranslations("ApplicationDetail");
  const documentType = useTranslations("DocumentType");
  const documentStatus = useTranslations("DocumentStatus");

  return (
    <Panel
      title={t("uploadedDocuments")}
      action={
        <Link
          href={`/applications/${application.id}/documents`}
          className="focus-ring rounded border border-line px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-surface"
        >
          {t("upload")}
        </Link>
      }
    >
      <div className="space-y-3">
        {application.documents.length > 0 ? (
          application.documents.map((document) => (
            <div key={document.id} className="rounded border border-line p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{document.fileName}</p>
                  <p className="mt-1 text-sm text-slate-500">{documentType(document.documentType)}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>{Math.round(document.fileSize / 1024)} KB</span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {documentStatus(document.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded border border-dashed border-line p-4 text-sm text-slate-600">
            {t("noDocuments")}
          </p>
        )}
      </div>
    </Panel>
  );
}

function NotesPanel({ application }: { application: LoanApplication }) {
  const t = useTranslations("ApplicationDetail");
  const locale = useLocale();

  return (
    <Panel title={t("notes")}>
      <div className="space-y-3">
        {application.notes.length > 0 ? (
          application.notes.map((note) => (
            <div key={note.id} className="rounded border border-line bg-surface p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-ink">{note.author.name}</p>
                <p className="text-xs text-slate-500">{formatDate(note.createdAt, locale)}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{note.content}</p>
            </div>
          ))
        ) : (
          <p className="rounded border border-dashed border-line p-4 text-sm text-slate-600">
            {t("noNotes")}
          </p>
        )}
      </div>
      <textarea
        rows={5}
        className="focus-ring mt-5 w-full rounded border border-line px-3 py-2"
        placeholder={t("notePlaceholder")}
      />
      <div className="mt-4 flex justify-end">
        <button className="focus-ring rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          {t("saveNote")}
        </button>
      </div>
    </Panel>
  );
}

function StatusTimeline({ application }: { application: LoanApplication }) {
  const t = useTranslations("ApplicationDetail");
  const common = useTranslations("Common");
  const locale = useLocale();

  return (
    <Panel title={t("statusHistory")}>
      <ol className="space-y-4">
        {application.statusHistory.map((entry, index) => (
          <li key={entry.id} className="relative pl-8">
            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal shadow" />
            {index < application.statusHistory.length - 1 ? (
              <span className="absolute left-[5px] top-5 h-full w-px bg-line" />
            ) : null}
            <div className="rounded border border-line bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={entry.oldStatus} />
                  <span className="text-sm text-slate-400">{common("to")}</span>
                  <StatusBadge status={entry.newStatus} />
                </div>
                <p className="text-xs text-slate-500">{formatDate(entry.createdAt, locale)}</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {entry.comment ?? common("statusUpdated")} {common("changedBy", { name: entry.changedBy.name })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function StatusPanel({
  application,
  canUpdateStatus
}: {
  application: LoanApplication;
  canUpdateStatus: boolean;
}) {
  const t = useTranslations("ApplicationDetail");
  const common = useTranslations("Common");
  const locale = useLocale();

  return (
    <Panel title={t("currentStatus")}>
      <div className="flex items-center justify-between gap-4">
        <StatusBadge status={application.status} />
        <p className="text-xs text-slate-500">
          {common("updated", { date: formatDate(application.updatedAt, locale) })}
        </p>
      </div>
      {canUpdateStatus ? (
        <div className="mt-5">
          <ApplicationStatusForm applicationId={application.id} currentStatus={application.status} />
        </div>
      ) : null}
    </Panel>
  );
}

function AiSidebar({ application }: { application: LoanApplication }) {
  const analysis = application.aiAnalysis;
  const t = useTranslations("ApplicationDetail");

  return (
    <Panel title={t("aiSummary")}>
      {analysis ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <RiskBadge riskLevel={analysis.riskLevel} />
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("riskScore")}</p>
              <p className="mt-1 text-3xl font-semibold text-ink">{analysis.riskScore}</p>
            </div>
          </div>
          <p className="mt-5 rounded border border-line bg-surface p-4 text-sm leading-6 text-slate-700">
            {analysis.summary}
          </p>
          <div className="mt-5">
            <List title={t("riskFlags")} items={analysis.riskFlags} />
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">{t("noAiSummary")}</p>
      )}
    </Panel>
  );
}

function MissingDocumentsPanel({ application }: { application: LoanApplication }) {
  const missingDocuments = application.aiAnalysis?.missingDocuments ?? [];
  const t = useTranslations("ApplicationDetail");
  const common = useTranslations("Common");
  const documentTypeT = useTranslations("DocumentType");

  return (
    <Panel title={t("missingDocuments")}>
      {missingDocuments.length > 0 ? (
        <ul className="space-y-2">
          {missingDocuments.map((documentType) => (
            <li
              key={documentType}
              className="flex items-center justify-between rounded border border-orange-200 bg-orange-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-orange-900">{documentTypeT(documentType)}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-orange-700">{common("needed")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          {t("documentsPresent")}
        </p>
      )}
    </Panel>
  );
}

function ActionsPanel({ application }: { application: LoanApplication }) {
  const t = useTranslations("ApplicationDetail");
  const actions = application.aiAnalysis?.recommendedActions ?? [t("defaultAction")];

  return (
    <Panel title={t("actions")}>
      <List title={t("recommendedActions")} items={actions} />
      <div className="mt-5 rounded border border-dashed border-line bg-surface p-4 text-sm text-slate-600">
        {t("placeholderCapabilities")}
      </div>
    </Panel>
  );
}

function Panel({
  title,
  action,
  children
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
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

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="rounded bg-surface px-3 py-2 text-sm text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
