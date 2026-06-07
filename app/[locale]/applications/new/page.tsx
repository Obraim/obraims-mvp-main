import { createApplicationAction } from "@/app/actions";
import { TopNav } from "@/components/top-nav";
import { requireRoleArea } from "@/src/lib/obraims/access-control";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

export default async function NewApplicationPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  await requireRoleArea("borrower");
  const t = await getTranslations("NewApplication");
  const borrowerType = await getTranslations("BorrowerType");
  const loanType = await getTranslations("LoanType");

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            {t("description")}
          </p>
          {searchParams.error ? (
            <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {decodeURIComponent(searchParams.error)}
            </p>
          ) : null}
        </div>
        <form action={createApplicationAction} className="rounded border border-line bg-white p-6 shadow-soft">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={t("borrowerType")}>
              <select name="borrowerType" className="focus-ring w-full rounded border border-line px-3 py-2">
                <option value="INDIVIDUAL">{borrowerType("INDIVIDUAL")}</option>
                <option value="BUSINESS">{borrowerType("BUSINESS")}</option>
              </select>
            </Field>
            <Field label={t("loanType")}>
              <select name="loanType" className="focus-ring w-full rounded border border-line px-3 py-2">
                <option value="WORKING_CAPITAL">{loanType("WORKING_CAPITAL")}</option>
                <option value="BUSINESS_LOAN">{loanType("BUSINESS_LOAN")}</option>
                <option value="PERSONAL_LOAN">{loanType("PERSONAL_LOAN")}</option>
                <option value="MORTGAGE">{loanType("MORTGAGE")}</option>
                <option value="EQUIPMENT_FINANCE">{loanType("EQUIPMENT_FINANCE")}</option>
              </select>
            </Field>
            <Field label={t("requestedAmount")}>
              <input name="requestedAmount" type="number" min="1000" defaultValue="75000" className="field" />
            </Field>
            <Field label={t("currency")}>
              <input name="currency" defaultValue="USD" maxLength={3} className="field uppercase" />
            </Field>
            <Field label={t("termMonths")}>
              <input name="requestedTermMonths" type="number" min="1" max="360" defaultValue="36" className="field" />
            </Field>
            <Field label={t("email")}>
              <input name="email" type="email" required className="field" />
            </Field>
            <Field label={t("phone")}>
              <input name="phone" required className="field" />
            </Field>
            <Field label={t("address")}>
              <input name="address" required className="field" />
            </Field>
            <Field label={t("legalName")}>
              <input name="legalName" required className="field" />
            </Field>
            <Field label={t("registrationNumber")}>
              <input name="registrationNumber" className="field" />
            </Field>
            <Field label={t("industry")}>
              <input name="industry" className="field" />
            </Field>
            <Field label={t("annualRevenue")}>
              <input name="annualRevenue" type="number" className="field" />
            </Field>
            <div className="md:col-span-2">
              <label htmlFor="loanPurpose" className="text-sm font-medium text-slate-700">
                {t("loanPurpose")}
              </label>
              <textarea
                id="loanPurpose"
                name="loanPurpose"
                required
                rows={4}
                className="focus-ring mt-2 w-full rounded border border-line px-3 py-2"
                defaultValue={t("defaultPurpose")}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="focus-ring rounded bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
              {t("continueToDocuments")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
