import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TopNav } from "@/components/top-nav";
import { conversations } from "@/lib/data";
import { getCurrentDemoUser } from "@/lib/security/access-control";

export default async function OfficerInboxPage({
  searchParams
}: {
  searchParams: { approved?: string; error?: string };
}) {
  const user = await getCurrentDemoUser("LOAN_OFFICER");
  const t = await getTranslations("OfficerInbox");
  const statusT = await getTranslations("MessageStatus");
  const common = await getTranslations("Common");

  if (user.role === "BORROWER") {
    notFound();
  }

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{t("title")}</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            {t("description")}
          </p>
        </div>
        {searchParams.approved ? (
          <p className="mt-6 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {t("approvedNotice")}
          </p>
        ) : null}
        <div className="mt-8 space-y-4">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/officer/applications/${conversation.loanApplicationId}/agent`}
              className="block rounded-lg border border-line bg-white p-5 shadow-soft hover:bg-surface"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{conversation.subject}</p>
                  <p className="mt-1 text-sm text-slate-500">{conversation.borrowerProfile.legalName}</p>
                </div>
                <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                  {conversation.messages[0]?.status ? statusT(conversation.messages[0].status) : common("noMessages")}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                {conversation.messages[0]?.body}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
