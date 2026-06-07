import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TopNav } from "@/components/top-nav";
import { conversations } from "@/lib/data";
import { getCurrentDemoUser } from "@/lib/security/access-control";

export default async function BorrowerMessagesPage() {
  const user = await getCurrentDemoUser("BORROWER");
  const t = await getTranslations("Borrower");
  const common = await getTranslations("Common");
  const channelT = await getTranslations("Channel");

  if (user.role !== "BORROWER") {
    notFound();
  }

  const visibleConversations = conversations.filter(
    (conversation) => user.isSuperAdmin || conversation.borrowerProfile.user.id === user.id
  );

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{t("messagesTitle")}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              {t("messagesDescription")}
            </p>
          </div>
          <Link
            href="/borrower"
            className="focus-ring rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-surface"
          >
            {t("backToStatus")}
          </Link>
        </div>
        <div className="mt-8 space-y-5">
          {visibleConversations.map((conversation) => {
            const visibleMessages = conversation.messages.filter((message) =>
              ["APPROVED", "SENT"].includes(message.status)
            );

            return (
              <section key={conversation.id} className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{conversation.subject}</h2>
                    <p className="mt-1 text-sm text-slate-500">{channelT(conversation.channel)}</p>
                  </div>
                  <span className="rounded border border-line bg-surface px-2 py-1 text-xs font-semibold text-slate-600">
                    {common("approvedCount", { count: visibleMessages.length })}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {visibleMessages.length > 0 ? (
                    visibleMessages.map((message) => (
                      <article key={message.id} className="rounded border border-line bg-surface p-4">
                        <p className="text-sm font-semibold text-ink">{message.subject}</p>
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{message.body}</p>
                      </article>
                    ))
                  ) : (
                    <p className="rounded border border-dashed border-line p-4 text-sm text-slate-600">
                      {t("noApprovedMessages")}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
