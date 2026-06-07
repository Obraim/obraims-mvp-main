import Link from "next/link";
import { ObraimsAppShell } from "@/components/obraims-app-shell";
import { MetricTile, ShellCard, StatusChip, SourceChip } from "@/components/obraims-ui";
import { isSuperAdmin, requireAuthenticatedUser } from "@/src/lib/obraims/access-control";
import { listLoanApplicationsForAdmin, listLoanApplicationsForCustomerEmail } from "@/src/lib/obraims/simple-core";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "MNT",
  maximumFractionDigits: 0
});

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser("/en/login?redirectTo=/app/dashboard");
  const superAdmin = await isSuperAdmin(user);
  const applications = superAdmin ? await listLoanApplicationsForAdmin() : await listLoanApplicationsForCustomerEmail(user.email ?? "");
  const recent = applications.slice(0, 6);
  const awaitingReview = applications.filter((application) => ["submitted", "under_review"].includes(application.status));
  const pendingDocuments = applications.filter((application) =>
    application.documents?.some((document) => document.status !== "uploaded")
  );
  const memoReady = applications.filter((application) => !application.metadata?.credit_memo && application.documents?.some((document) => document.status === "uploaded"));
  const approved = applications.filter((application) => ["approved", "offer_generated", "offer_accepted"].includes(application.status));

  return (
    <ObraimsAppShell
      active="Dashboard"
      eyebrow="Command center"
      title="Lending dashboard"
      subtitle={superAdmin ? "Portfolio-wide origination view for testing and operations." : "Track your submitted loan applications and next steps."}
      actions={
        <Link href="/app/apply" className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          New application
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Applications in progress" value={String(applications.length)} detail="Active Simple Core records" />
        <MetricTile label="Awaiting review" value={String(awaitingReview.length)} detail="Submitted or under review" tone="amber" />
        <MetricTile label="Pending documents" value={String(pendingDocuments.length)} detail="One or more requested items" />
        <MetricTile label="Credit memo ready" value={String(memoReady.length)} detail="Documents exist, memo missing" tone="teal" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <ShellCard>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-semibold text-ink">Recent applications</h2>
              <p className="mt-1 text-sm text-slate-600">Newest requests across form and chat intake.</p>
            </div>
            <Link href={superAdmin ? "/app/admin/applications" : "/en/borrower"} className="text-sm font-semibold text-teal hover:text-ink">
              View queue
            </Link>
          </div>
          <div className="divide-y divide-line">
            {recent.map((application) => (
              <Link key={application.id} href={`/app/application/${application.id}`} className="grid gap-3 px-5 py-4 hover:bg-surface md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-semibold text-ink">{application.customer.full_name ?? "Unnamed applicant"}</p>
                  <p className="mt-1 text-sm text-slate-600">{application.loan_purpose ?? "Loan request"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusChip value={application.status} />
                  <SourceChip value={application.source ?? application.channel} />
                </div>
                <p className="font-semibold text-ink">{currency.format(Number(application.requested_amount))}</p>
              </Link>
            ))}
            {recent.length === 0 ? <p className="px-5 py-8 text-sm text-slate-600">No applications yet.</p> : null}
          </div>
        </ShellCard>

        <div className="space-y-6">
          <ShellCard className="p-5">
            <h2 className="font-semibold text-ink">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-surface" href="/app/apply">
                New application
              </Link>
              <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-surface" href={recent[0] ? `/app/application/${recent[0].id}` : "/app/admin/applications"}>
                Review latest application
              </Link>
              <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-surface" href="/app/admin/applications?queue=documents">
                Open documents queue
              </Link>
              <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-surface" href="/app/admin/applications?queue=memos">
                Generate missing memos
              </Link>
            </div>
          </ShellCard>
          <ShellCard className="p-5">
            <h2 className="font-semibold text-ink">Portfolio snapshot</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Snapshot label="Approved" value={String(approved.length)} />
              <Snapshot label="Declined" value={String(applications.filter((application) => application.status === "rejected").length)} />
              <Snapshot label="Offers" value={String(applications.filter((application) => application.status === "offer_generated").length)} />
              <Snapshot label="Total exposure" value={currency.format(applications.reduce((sum, application) => sum + Number(application.requested_amount), 0))} />
            </dl>
          </ShellCard>
        </div>
      </div>
    </ObraimsAppShell>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-2 font-semibold text-ink">{value}</dd>
    </div>
  );
}
