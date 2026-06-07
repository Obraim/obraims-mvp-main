import { updateApplicationStatusAction } from "@/app/actions";
import { useTranslations } from "next-intl";
import { statusOptions } from "@/lib/data";
import type { ApplicationStatus } from "@/lib/types";

export function ApplicationStatusForm({
  applicationId,
  currentStatus
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const t = useTranslations("ApplicationStatusForm");
  const statusT = useTranslations("Status");

  return (
    <form action={updateApplicationStatusAction} className="flex flex-col gap-3 sm:flex-row">
      <input type="hidden" name="applicationId" value={applicationId} />
      <select
        name="status"
        defaultValue={currentStatus}
        className="focus-ring rounded border border-line bg-white px-3 py-2 text-sm"
      >
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {statusT(status)}
          </option>
        ))}
      </select>
      <button className="focus-ring rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
        {t("updateStatus")}
      </button>
    </form>
  );
}
