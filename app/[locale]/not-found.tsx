import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TopNav } from "@/components/top-nav";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const common = useTranslations("Common");

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded border border-line bg-white p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">{t("title")}</h1>
          <p className="mt-3 text-slate-600">{t("description")}</p>
          <Link
            href="/officer"
            className="focus-ring mt-6 inline-flex rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {common("backToDashboard")}
          </Link>
        </div>
      </section>
    </main>
  );
}
