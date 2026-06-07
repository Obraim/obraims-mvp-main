import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ObraimsLogo } from "@/components/obraims-logo";
import { isLocale, type Locale } from "@/i18n/routing";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://obraims-mvp.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Obraims | AI-Powered Loan Origination",
  description:
    "Obraims helps lenders collect applications, documents, and AI-generated credit memos in one secure, auditable workflow.",
  openGraph: {
    title: "Obraims | AI-Powered Loan Origination",
    description:
      "Obraims helps lenders collect applications, documents, and AI-generated credit memos in one secure, auditable workflow.",
    type: "website",
    images: [
      {
        url: "/brand/obraims-logo-full-white-bg.png",
        width: 1200,
        height: 630,
        alt: "Obraims"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Obraims | AI-Powered Loan Origination",
    description:
      "Obraims helps lenders collect applications, documents, and AI-generated credit memos in one secure, auditable workflow.",
    images: ["/brand/obraims-logo-full-white-bg.png"]
  }
};

const navLinks = [
  { href: "#platform", label: "Platform" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#lenders", label: "For lenders" },
  { href: "#security", label: "Security" }
] as const;

const trustItems = [
  "Human-in-the-loop AI",
  "Secure document storage",
  "Audit-ready workflow",
  "Built for global lenders"
] as const;

const workflowSteps = [
  {
    title: "Receive applications via chat or form",
    body: "Borrowers choose their preferred intake flow and provide core information in a single structured session."
  },
  {
    title: "Collect supporting documents",
    body: "ID, bank statements, collateral docs and more are uploaded securely into private storage."
  },
  {
    title: "Generate AI credit memo",
    body: "Submitted data, document status, and missing items are synthesized into a draft memo automatically."
  },
  {
    title: "Loan officer reviews and decides",
    body: "All final decisions are made by an authorized person, with full audit trail and policy controls."
  }
] as const;

const capabilities = [
  {
    title: "Application intake",
    body: "Capture borrower applications as structured, auditable records.",
    icon: "file"
  },
  {
    title: "Conversational loan intake",
    body: "Collect required information step-by-step through a guided chat flow.",
    icon: "chat"
  },
  {
    title: "Document intelligence",
    body: "Track document types, statuses, and missing items in a unified workspace.",
    icon: "scan"
  },
  {
    title: "Credit memo generation",
    body: "Produce underwriter-ready draft memos from borrower data and documents.",
    icon: "memo"
  },
  {
    title: "Collateral review",
    body: "Centralize collateral documents and next steps in one place.",
    icon: "shield"
  },
  {
    title: "Borrower status tracking",
    body: "Give borrowers clear visibility into progress, gaps, and next steps.",
    icon: "progress"
  },
  {
    title: "Admin review queue",
    body: "Monitor all applications, documents, memos, and decisions in a single queue.",
    icon: "queue"
  },
  {
    title: "Audit trail",
    body: "Every critical action is logged with full traceability for compliance.",
    icon: "audit"
  },
  {
    title: "Role-based access",
    body: "Separate access controls for admins, officers, analysts, and borrowers.",
    icon: "lock"
  },
  {
    title: "Future integrations",
    body: "Architecture designed for external data, core banking, and KYC/KYB connections.",
    icon: "connect"
  }
] as const;

const borrowerItems = [
  "Chat-based application intake",
  "Simple document upload flow",
  "Clear progress visibility",
  "Plain-language status updates"
] as const;

const lenderItems = [
  "Unified application queue",
  "AI memo drafts",
  "Document status tracking",
  "Human decision workflow",
  "Full audit trail"
] as const;

const aiBadges = ["Human-in-the-loop", "Admin approval", "Explainable memo", "Secure server-side AI"] as const;

const securityItems = [
  {
    title: "Authenticated access",
    body: "All user access is gated by authentication and scoped by permission level."
  },
  {
    title: "Private document storage",
    body: "Documents are never exposed via public URLs — access is always controlled."
  },
  {
    title: "Signed document links",
    body: "Document access links are time-limited and generated server-side on demand."
  },
  {
    title: "Server-side AI calls",
    body: "All AI processing runs in a privileged server environment, never client-side."
  },
  {
    title: "Admin-only controls",
    body: "Decisions, approvals, and memos are restricted to authorized roles only."
  },
  {
    title: "No public document URLs",
    body: "Private documents are never exposed in landing pages or client components."
  }
] as const;

const integrations = [
  "Bank statements",
  "Credit bureau",
  "KYC / KYB",
  "Collateral registry",
  "Core banking",
  "External data providers"
] as const;

const heroMiniCards = [
  { label: "AI memo generated", className: "left-3 top-[22%] hidden xl:block" },
  { label: "Document verified", className: "right-1 top-[16%] hidden xl:block" },
  { label: "Human review required", className: "-left-2 bottom-[18%] hidden lg:block" },
  { label: "Audit event logged", className: "right-4 bottom-[12%] hidden lg:block" }
] as const;

const heroDots = Array.from({ length: 56 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 53) % 100}%`,
  delay: `${(index % 11) * 0.42}s`,
  duration: `${9 + (index % 7)}s`
}));

function localePath(locale: string | undefined, path: string) {
  const activeLocale: Locale = isLocale(locale) ? locale : "en";
  return `/${activeLocale}${path}`;
}

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const activeLocale = isLocale(params.locale) ? params.locale : "en";
  const signInHref = localePath(activeLocale, "/login");
  const viewPlatformHref = `/app/view-platform?locale=${activeLocale}`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f4] text-[#101828]">
      <div className="relative overflow-hidden bg-[#061313] text-white">
        <PremiumHeader signInHref={signInHref} applyHref="/app/apply" activeLocale={activeLocale} />
        <HeroSection signInHref={signInHref} viewPlatformHref={viewPlatformHref} />
        <TrustStrip />
      </div>

      <section id="how-it-works" className="border-b border-[#dce3dd] bg-[#f5f7f4]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Origination workflow"
            title="From application to decision in one flow"
            body="Obraims centralizes borrower data, documents, AI memos, and human-reviewed decisions in a single auditable workflow."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <WorkflowCard key={step.title} index={index + 1} title={step.title} body={step.body} />
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Platform capabilities"
            title="Everything you need for intelligent loan operations"
            body="The core modules required to run loan origination faster, with control, and audit-ready."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {capabilities.map((capability) => (
              <CapabilityCard key={capability.title} {...capability} />
            ))}
          </div>
        </div>
      </section>

      <section id="lenders" className="border-b border-[#dce3dd] bg-[#f5f7f4]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <ExperiencePanel
            eyebrow="Borrower experience"
            title="Simpler for borrowers"
            body="Applications, documents, and status updates all live in one clear, guided flow."
            items={borrowerItems}
          />
          <ExperiencePanel
            eyebrow="Lender experience"
            title="Faster for lenders"
            body="Your team manages applications, documents, AI memos, and decisions from one workspace."
            items={lenderItems}
            dark
          />
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/10 bg-[#071716] text-white">
        <div className="obraims-section-dots absolute inset-0 opacity-45" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_10%,rgba(20,184,166,0.22),transparent_30%),linear-gradient(180deg,rgba(7,23,22,0.25),#071716)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#93f0df]">AI governance</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-5xl">
              AI supports your loan officers — it does not replace them
            </h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-slate-300">
              Obraims synthesizes information, flags gaps, and drafts credit memos. Every final decision is made by an authorized human with full policy and audit control.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {aiBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Security foundation"
            title="A secure foundation for financial workflows"
            body="Architecture designed for security-conscious financial operations from day one."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {securityItems.map((item) => (
              <SecurityCard key={item.title} title={item.title} body={item.body} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce3dd] bg-[#f5f7f4]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Integration-ready architecture"
            title="Built to connect with your ecosystem"
            body="Obraims core workflow is designed to plug into external data sources, KYC/KYB providers, and core banking systems at your pace."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {integrations.map((item) => (
              <div key={item} className="rounded-lg border border-[#d8e0d9] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#9db6aa] hover:shadow-panel">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
                  <p className="text-sm font-semibold text-[#101828]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#061313] p-8 text-white shadow-[0_28px_100px_rgba(16,24,40,0.18)] sm:p-12">
            <div className="obraims-section-dots absolute inset-0 opacity-35" aria-hidden="true" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(20,184,166,0.22),transparent_28%)]" aria-hidden="true" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#93f0df]">Obraims</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-normal sm:text-5xl">
                  Ready to modernize your loan origination?
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link href="/app/apply" className="focus-ring rounded-md bg-white px-5 py-3 text-center text-sm font-semibold text-[#101828] transition hover:bg-slate-100">
                  Apply for a loan
                </Link>
                <Link href={signInHref} className="focus-ring rounded-md border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer signInHref={signInHref} />
    </main>
  );
}

function PremiumHeader({
  signInHref,
  applyHref,
  activeLocale
}: {
  signInHref: string;
  applyHref: string;
  activeLocale: Locale;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#061313]/78 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href={localePath(activeLocale, "/")} aria-label="Obraims homepage" className="flex items-center">
          <ObraimsLogo className="h-8 max-w-[142px]" dark />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-white/70 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href={signInHref} className="rounded-md px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
            Sign in
          </Link>
          <Link href={applyHref} className="focus-ring rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-[#101828] shadow-sm transition hover:bg-slate-100">
            Apply for a loan
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="focus-ring flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-white/20 bg-white/10 text-white [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open menu</span>
            <span className="relative h-4 w-5">
              <span className="absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition group-open:top-2 group-open:rotate-45" />
              <span className="absolute left-0 top-2 h-0.5 w-5 rounded-full bg-current transition group-open:opacity-0" />
              <span className="absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-current transition group-open:bottom-1.5 group-open:-rotate-45" />
            </span>
          </summary>
          <div className="absolute right-0 mt-3 w-[min(88vw,320px)] rounded-xl border border-white/10 bg-[#071716]/96 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
            <nav aria-label="Mobile navigation" className="grid gap-1">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="rounded-md px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
                  {link.label}
                </a>
              ))}
              <Link href={signInHref} className="rounded-md px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
                Sign in
              </Link>
              <Link href={applyHref} className="mt-2 rounded-md bg-white px-3 py-3 text-center text-sm font-semibold text-[#101828]">
                Apply for a loan
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

function HeroSection({
  signInHref,
  viewPlatformHref
}: {
  signInHref: string;
  viewPlatformHref: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <HeroDotWave />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#061313] to-transparent" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#93f0df] shadow-sm backdrop-blur">
            <Image src="/brand/obraims-logo-mark.png" alt="" width={20} height={20} className="h-5 w-5 rounded" />
            AI lending infrastructure
          </div>
          <h1 className="mt-7 text-4xl font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
            AI-powered loan origination platform
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Obraims unifies borrower intake, document collection, AI credit memo generation, and human-reviewed decisions in a single secure workflow.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/app/apply" className="focus-ring rounded-md bg-white px-5 py-3 text-center text-sm font-semibold text-[#101828] shadow-sm transition hover:bg-slate-100">
              Apply for a loan
            </Link>
            <Link href={viewPlatformHref} className="focus-ring rounded-md border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/20">
              View platform
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-3xl lg:max-w-none">
          {heroMiniCards.map((card) => (
            <FloatingMiniCard key={card.label} label={card.label} className={card.className} />
          ))}
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}

function HeroDotWave() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_28%,rgba(20,184,166,0.26),transparent_34%),radial-gradient(circle_at_80%_22%,rgba(79,70,229,0.16),transparent_30%),linear-gradient(135deg,#071b1a_0%,#061313_48%,#020807_100%)]" />
      <div className="obraims-dot-wave absolute inset-[-12%]" />
      <div className="obraims-dot-grid absolute inset-0 opacity-40" />
      {heroDots.map((dot) => (
        <span
          key={dot.id}
          className="obraims-particle absolute h-1 w-1 rounded-full bg-[#a7fff0]/70"
          style={{
            left: dot.left,
            top: dot.top,
            animationDelay: dot.delay,
            animationDuration: dot.duration
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,19,19,0.14)_42%,rgba(6,19,19,0.88)_82%)]" />
    </div>
  );
}

function HeroDashboard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-3 shadow-[0_32px_130px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" aria-hidden="true" />
      <div className="rounded-xl border border-white/10 bg-[#0a1a19]/90">
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/obraims-logo-mark.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Origination workspace</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Application OB-2048</h2>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
            <span className="obraims-live-dot h-2 w-2 rounded-full bg-amber-300" />
            Human review
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <DashboardMetric label="Requested" value="$120,000" />
              <DashboardMetric label="Documents" value="3/4 verified" />
              <DashboardMetric label="AI memo" value="Draft ready" />
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.06] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#93f0df]">Credit memo draft</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Working capital request</h3>
                </div>
                <span className="w-fit rounded-full bg-indigo-300/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                  Explainable memo
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Borrower data, income indicators, and document status consolidated into a draft. Final decision subject to officer review and approval.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MemoSignal title="Strength" body="Stable income profile, complete identity documentation." tone="teal" />
                <MemoSignal title="Next review" body="Collateral valuation and loan statement verification pending." tone="amber" />
              </div>
            </div>
          </div>

          <aside className="border-t border-white/10 bg-white/[0.045] p-5 lg:border-l lg:border-t-0">
            <Timeline title="Borrower progress" items={["Application submitted", "Documents uploaded", "AI memo drafted", "Decision pending"]} />
            <div className="mt-6 rounded-xl border border-white/10 bg-[#061313]/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Next actions</p>
              <div className="mt-4 space-y-3">
                {["Review collateral", "Request loan statement", "Prepare decision"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                    <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[#34d399]" : "bg-white/30"}`} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.065] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function MemoSignal({ title, body, tone }: { title: string; body: string; tone: "teal" | "amber" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#061313]/42 p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${tone === "teal" ? "bg-[#34d399]" : "bg-amber-300"}`} />
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function Timeline({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{title}</p>
      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div key={item} className="relative flex gap-3">
            {index < items.length - 1 ? <span className="absolute left-[5px] top-4 h-6 w-px bg-white/10" /> : null}
            <span className={`relative mt-1 h-2.5 w-2.5 rounded-full ${index < 3 ? "bg-[#34d399]" : "bg-amber-300"}`} />
            <span className="text-sm font-medium text-slate-200">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingMiniCard({ label, className }: { label: string; className: string }) {
  return (
    <div className={`obraims-float-card absolute z-10 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}>
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#34d399]" />
      {label}
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="relative border-y border-white/10 bg-[#061313]/96">
      <div className="obraims-section-dots absolute inset-0 opacity-35" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {trustItems.map((item) => (
          <div key={item} className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-4 text-sm font-semibold text-slate-100 shadow-sm backdrop-blur">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#34d399]" />
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#0f766e]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-normal text-[#101828] sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-slate-600">{body}</p>
    </div>
  );
}

function WorkflowCard({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <article className="group rounded-xl border border-[#d8e0d9] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#9db6aa] hover:shadow-panel">
      <span className="grid h-11 w-11 place-items-center rounded-lg border border-[#cfe0d9] bg-[#e8f5f1] text-sm font-semibold text-[#0f766e]">
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="mt-6 text-lg font-semibold text-[#101828]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function CapabilityCard({ title, body, icon }: { title: string; body: string; icon: IconName }) {
  return (
    <article className="group flex min-h-[230px] flex-col rounded-xl border border-[#d8e0d9] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#0f766e]/35 hover:shadow-panel">
      <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#d8e0d9] bg-[#f5f7f4] text-[#0f766e] transition group-hover:border-[#0f766e]/35 group-hover:bg-[#e8f5f1]">
        <Icon name={icon} />
      </div>
      <h3 className="mt-6 text-base font-semibold text-[#101828]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function ExperiencePanel({
  eyebrow,
  title,
  body,
  items,
  dark = false
}: {
  eyebrow: string;
  title: string;
  body: string;
  items: readonly string[];
  dark?: boolean;
}) {
  return (
    <article className={`rounded-xl border p-6 shadow-sm sm:p-8 ${dark ? "border-[#061313] bg-[#061313] text-white" : "border-[#d8e0d9] bg-white text-[#101828]"}`}>
      <p className={`text-sm font-semibold uppercase tracking-wide ${dark ? "text-[#93f0df]" : "text-[#0f766e]"}`}>{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-normal">{title}</h2>
      <p className={`mt-4 text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-600"}`}>{body}</p>
      <ul className="mt-8 grid gap-3">
        {items.map((item) => (
          <li key={item} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${dark ? "border-white/10 bg-white/[0.065] text-white" : "border-[#d8e0d9] bg-[#f8faf8] text-slate-700"}`}>
            <span className={`h-2 w-2 rounded-full ${dark ? "bg-[#34d399]" : "bg-[#0f766e]"}`} />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function SecurityCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-[#d8e0d9] bg-[#f8faf8] p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#061313] text-white">
          <Icon name="lock" />
        </span>
        <h3 className="text-base font-semibold text-[#101828]">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function Footer({ signInHref }: { signInHref: string }) {
  return (
    <footer className="border-t border-[#dce3dd] bg-[#f5f7f4]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <ObraimsLogo className="h-9 max-w-[150px]" />
          <p className="mt-3 text-sm text-slate-500">© 2026 Obraims. All rights reserved.</p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
          <a href="#platform">Platform</a>
          <Link href="/app/apply">Apply</Link>
          <a href="#security">Security</a>
          <Link href={signInHref}>Sign in</Link>
          <span>Contact</span>
        </nav>
      </div>
    </footer>
  );
}

type IconName = "file" | "chat" | "scan" | "memo" | "shield" | "progress" | "queue" | "audit" | "lock" | "connect";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    file: <path d="M7 3.5h6l4 4V20.5H7V3.5Zm6 0v4h4" />,
    chat: <path d="M5 6.5h14v9H9l-4 4v-13Z" />,
    scan: <path d="M5 8V5h3M16 5h3v3M19 16v3h-3M8 19H5v-3M8 12h8" />,
    memo: <path d="M7 4.5h10v15H7v-15Zm3 4h4M10 12h4M10 15.5h2" />,
    shield: <path d="M12 3.5 18 6v5.5c0 3.7-2.4 6.6-6 8-3.6-1.4-6-4.3-6-8V6l6-2.5Z" />,
    progress: <path d="M5 16.5h14M7 13.5l3-3 2 2 5-6M7 16.5v-3M12 16.5v-4M17 16.5v-10" />,
    queue: <path d="M5 7h14M5 12h14M5 17h9" />,
    audit: <path d="M7 5h10v14H7V5Zm3-2h4l1 2H9l1-2Zm0 7h5M10 14h5" />,
    lock: <path d="M7 10h10v9H7v-9Zm2 0V7.8a3 3 0 0 1 6 0V10" />,
    connect: <path d="M8 8h3v3H8V8Zm5 5h3v3h-3v-3Zm-2-2 2 2M6 16l2-5M18 8l-2 5" />
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
