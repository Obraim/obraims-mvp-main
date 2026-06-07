import Link from "next/link";
import { ObraimsLogo } from "@/components/obraims-logo";
import { ButtonLink, ShellCard } from "@/components/obraims-ui";
import { ChatFlow } from "./chat-flow";

export default function ApplyByChatPage() {
  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/app/dashboard" className="flex items-center gap-3">
            <ObraimsLogo className="h-9 max-w-[150px]" />
            <span className="hidden sm:block">
              <span className="caption">Guided chat intake</span>
            </span>
          </Link>
          <ButtonLink href="/app/apply" variant="secondary">
            Use traditional form
          </ButtonLink>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div>
          <div className="mb-8 max-w-3xl">
            <p className="caption uppercase tracking-wide text-primary">Guided intake</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Apply by chat</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              The Obraims assistant asks one question at a time, validates answers, and submits into the same Simple Core application flow.
            </p>
          </div>
          <ChatFlow />
        </div>
        <ShellCard className="p-5 lg:sticky lg:top-6">
          <h2 className="font-semibold text-ink">Prefer a form?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You can switch to the standard form at any time. Both intake paths create the same customer, consent, application, and audit records.
          </p>
          <ButtonLink href="/app/apply" variant="secondary" className="mt-4 w-full">
            Apply with form
          </ButtonLink>
        </ShellCard>
      </section>
    </main>
  );
}
