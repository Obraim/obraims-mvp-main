import Link from "next/link";
import { ObraimsLogo } from "@/components/obraims-logo";
import { ButtonLink, ShellCard } from "@/components/obraims-ui";
import { ApplyForm } from "./apply-form";

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/app/dashboard" className="flex items-center gap-3">
            <ObraimsLogo className="h-9 max-w-[150px]" />
            <span className="hidden sm:block">
              <span className="caption">Loan application intake</span>
            </span>
          </Link>
          <ButtonLink href="/en/borrower" variant="secondary">
            Check status
          </ButtonLink>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="caption uppercase tracking-wide text-primary">Borrower intake</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Start a loan request</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Choose a guided chat or the standard form. Both paths create the same Obraims application record and keep documents private.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <a
            href="/app/apply/chat"
            className="focus-ring rounded-xl border-2 border-ink bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:bg-surface"
          >
            <p className="caption uppercase tracking-wide text-primary">Option A</p>
            <h2 className="mt-2 text-xl font-semibold tracking-normal text-ink">Apply by chat</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Answer questions step by step with the Obraims assistant.</p>
          </a>
          <a
            href="#standard-form"
            className="focus-ring rounded-xl border border-line bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:bg-surface"
          >
            <p className="caption uppercase tracking-wide text-primary">Option B</p>
            <h2 className="mt-2 text-xl font-semibold tracking-normal text-ink">Apply with form</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use the standard application form.</p>
          </a>
        </div>

        <div id="standard-form" className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold tracking-normal text-ink">Standard application form</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Provide borrower, loan, collateral, and supporting document details. Required fields are validated before submission.
              </p>
            </div>
            <ApplyForm />
          </div>
          <ShellCard className="p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold text-ink">What happens next</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <li>1. Obraims creates your application and consent record.</li>
              <li>2. Uploaded files are stored in private document storage.</li>
              <li>3. An internal reviewer checks documents and decision readiness.</li>
              <li>4. Sign in with the same email to track status.</li>
            </ol>
          </ShellCard>
        </div>
      </section>
    </main>
  );
}
