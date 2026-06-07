import NextLink from "next/link";
import { redirect } from "next/navigation";
import { ObraimsAppShell } from "@/components/obraims-app-shell";
import { EmptyState, MetricTile, ShellCard, SourceChip, StatusChip, Timeline } from "@/components/obraims-ui";
import { localizePath } from "@/i18n/routing";
import { getCurrentUser, isSuperAdmin } from "@/src/lib/obraims/access-control";
import { listLoanApplicationsForAdmin, listLoanApplicationsForCustomerEmail } from "@/src/lib/obraims/simple-core";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "MNT",
  maximumFractionDigits: 0
});

export const dynamic = "force-dynamic";

export default async function BorrowerStatusPage({
  params
}: {
  params: { locale: string };
}) {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect(`${localizePath("/login", params.locale)}?redirectTo=${encodeURIComponent(localizePath("/borrower", params.locale))}`);
  }

  const superAdmin = await isSuperAdmin(user);
  const applications = superAdmin ? await listLoanApplicationsForAdmin() : await listLoanApplicationsForCustomerEmail(user.email);
  const awaitingReview = applications.filter((application) => ["submitted", "under_review"].includes(application.status)).length;
  const offers = applications.filter((application) => ["offer_generated", "offer_accepted"].includes(application.status)).length;

  return (
    <ObraimsAppShell
      active="Borrower Status"
      eyebrow="Borrower portal"
      title="Application status"
      subtitle={
        superAdmin
          ? "Super Admin Testing Mode: showing all Simple Core applications."
          : `Track applications submitted with ${user.email}.`
      }
      actions={
        <NextLink href="/app/apply" className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          New application
        </NextLink>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Submitted applications" value={String(applications.length)} detail="Visible to this account" />
        <MetricTile label="In review" value={String(awaitingReview)} detail="Being assessed" tone="amber" />
        <MetricTile label="Offers" value={String(offers)} detail="Generated or accepted" tone="teal" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
      <ShellCard className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">Your applications</h2>
          <p className="mt-1 text-sm text-slate-600">Open an application to see current status, documents, decisions, offers, and next steps.</p>
        </div>
        <div>
          {applications.length > 0 ? (
            <div className="divide-y divide-line">
              {applications.map((application) => (
                <NextLink
                  key={application.id}
                  href={`/app/application/${application.id}`}
                  className="grid grid-cols-1 gap-4 px-5 py-5 hover:bg-surface lg:grid-cols-[1fr_auto_auto_auto] lg:items-center"
                >
                  <div>
                    <p className="font-semibold text-ink">{application.loan_purpose ?? "Loan application"}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Submitted {new Date(application.created_at).toLocaleDateString()} · {application.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusChip value={application.status} />
                    <SourceChip value={application.source ?? application.channel} />
                  </div>
                  <p className="font-semibold text-ink">{currency.format(Number(application.requested_amount))}</p>
                  <p className="text-sm font-semibold text-teal">Open</p>
                </NextLink>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="No applications found"
                description={`Submit a new application or sign in with the email address used on the application. Current account: ${user.email}.`}
              />
            </div>
          )}
        </div>
      </ShellCard>
      <div className="space-y-6">
        <ShellCard className="p-5">
          <h2 className="font-semibold text-ink">What to expect</h2>
          <div className="mt-4">
            <Timeline
              items={[
                { label: "Application submitted", detail: "Your request is saved in Obraims.", state: applications.length > 0 ? "done" : "todo" },
                { label: "Review in progress", detail: "A reviewer checks details and supporting documents.", state: awaitingReview > 0 ? "current" : "todo" },
                { label: "Decision or offer", detail: "If eligible, an offer appears here for review.", state: offers > 0 ? "done" : "todo" }
              ]}
            />
          </div>
        </ShellCard>
        <ShellCard tone="subtle" className="p-5">
          <h2 className="font-semibold text-ink">Status access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            For privacy, regular borrowers only see applications linked to their signed-in email address.
          </p>
        </ShellCard>
      </div>
      </div>
    </ObraimsAppShell>
  );
}
