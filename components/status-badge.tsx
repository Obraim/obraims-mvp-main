import { useTranslations } from "next-intl";
import type { ApplicationStatus, RiskLevel } from "@/lib/types";

const statusTone: Record<ApplicationStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  IN_REVIEW: "border-amber-200 bg-amber-50 text-amber-800",
  MORE_INFO_NEEDED: "border-orange-200 bg-orange-50 text-orange-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800"
};

const riskTone: Record<RiskLevel, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  HIGH: "border-red-200 bg-red-50 text-red-800"
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useTranslations("Status");

  return (
    <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${statusTone[status]}`}>
      {t(status)}
    </span>
  );
}

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const t = useTranslations("Risk");

  return (
    <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${riskTone[riskLevel]}`}>
      {t(riskLevel)}
    </span>
  );
}
