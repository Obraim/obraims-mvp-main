import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { TopNav } from "@/components/top-nav";
import { getAuthorizedApplication, getCurrentDemoUser } from "@/lib/security/access-control";

const checklistKeys = ["identityDocument", "bankStatements", "taxReturn", "financialStatement"] as const;

export default async function DocumentsPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const user = await getCurrentDemoUser("BORROWER");
  const application = await getAuthorizedApplication(params.id, user);
  const t = await getTranslations("Documents");
  const common = await getTranslations("Common");

  if (!application) {
    notFound();
  }

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              {t("description")}
            </p>
          </div>
          <Link
            href={`/applications/${params.id}`}
            className="focus-ring rounded border border-line bg-white px-4 py-2 text-center text-sm font-semibold hover:bg-surface"
          >
            {common("viewApplication")}
          </Link>
        </div>
        {searchParams.created ? (
          <p className="mb-6 rounded border border-teal/30 bg-teal/10 px-4 py-3 text-sm font-medium text-teal">
            {t("created")}
          </p>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded border border-line bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold">{t("requiredChecklist")}</h2>
            <div className="mt-5 space-y-3">
              {checklistKeys.map((item) => (
                <div key={item} className="flex items-center justify-between rounded border border-line px-4 py-3">
                  <span className="text-sm font-medium">{t(item)}</span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {common("pending")}
                  </span>
                </div>
              ))}
            </div>
            {application ? (
              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-700">{t("alreadyUploaded")}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {application.documents.map((document) => (
                    <li key={document.id} className="rounded bg-surface px-3 py-2">
                      {document.fileName}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <DocumentUploadForm applicationId={params.id} />
        </div>
      </section>
    </main>
  );
}
