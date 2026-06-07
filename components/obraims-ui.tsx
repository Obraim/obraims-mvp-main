import type { ReactNode } from "react";
import Link from "next/link";

const statusTone: Record<string, string> = {
  draft: "border-techLine bg-techSurface2 text-techMuted",
  submitted: "border-info/20 bg-blue-50 text-blue-800",
  under_review: "border-warning/25 bg-amber-50 text-amber-900",
  pending_review: "border-warning/25 bg-amber-50 text-amber-900",
  documents_needed: "border-warning/25 bg-amber-50 text-amber-900",
  memo_ready: "border-ai/20 bg-aiSoft text-ai",
  approved: "border-primary/35 bg-primarySoft text-primary",
  funded: "border-primary/35 bg-primarySoft text-primary",
  declined: "border-danger/20 bg-red-50 text-red-800",
  rejected: "border-danger/20 bg-red-50 text-red-800",
  offer_generated: "border-primary/35 bg-primarySoft text-primary",
  offer_accepted: "border-primary/35 bg-primarySoft text-primary",
  cancelled: "border-techLine bg-techSurface2 text-techMuted",
  referred: "border-ai/20 bg-aiSoft text-ai",
  counteroffer: "border-ai/20 bg-aiSoft text-ai",
  pending: "border-warning/25 bg-amber-50 text-amber-900",
  accepted: "border-primary/35 bg-primarySoft text-primary",
  uploaded: "border-primary/35 bg-primarySoft text-primary",
  requested: "border-warning/25 bg-amber-50 text-amber-900",
  missing: "border-danger/20 bg-red-50 text-red-800",
  ready: "border-ai/20 bg-aiSoft text-ai",
  neutral: "border-techLine bg-techSurface2 text-techMuted",
  info: "border-info/20 bg-blue-50 text-blue-800"
};

export function ShellCard({
  children,
  className = "",
  id,
  tone = "default"
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "subtle" | "ai";
}) {
  const tones = {
    default: "border-techLine bg-techSurface shadow-panel",
    subtle: "border-techLine bg-techSurface2 shadow-sm",
    ai: "border-ai/25 bg-aiSoft/80 shadow-sm"
  };

  return (
    <section id={id} className={`rounded-md border ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}

export function StatusChip({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold leading-none ${statusTone[value] ?? "border-techLine bg-techSurface text-techMuted"}`}>
      {label ?? titleize(value)}
    </span>
  );
}

export function SourceChip({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-techLine bg-techSurface2 px-2.5 py-1 font-mono text-xs font-semibold leading-none text-techMuted">
      {titleize(value)}
    </span>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  tone = "default"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "amber" | "teal" | "red" | "ai";
}) {
  const tones = {
    default: "border-techLine bg-techSurface",
    amber: "border-warning/25 bg-amber-50",
    teal: "border-primary/35 bg-primarySoft",
    red: "border-danger/20 bg-red-50",
    ai: "border-ai/30 bg-aiSoft"
  };

  return (
    <div className={`rounded-md border p-4 shadow-sm ${tones[tone]}`}>
      <p className="caption uppercase tracking-wide">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-normal text-techFg">{value}</p>
      {detail ? <p className="mt-1 text-sm text-techMuted">{detail}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-techLine bg-techSurface2 px-5 py-10 text-center">
      <p className="font-semibold text-techFg">{title}</p>
      <p className="mt-2 text-sm text-techMuted">{description}</p>
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = ""
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent";
  className?: string;
}) {
  const classes = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent"
  };

  return (
    <Link href={href} className={`${classes[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  className = ""
}: {
  tone?: "success" | "warning" | "danger" | "info" | "ai";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    success: "border-primary/30 bg-primarySoft text-primary",
    warning: "border-warning/25 bg-amber-50 text-amber-900",
    danger: "border-danger/20 bg-red-50 text-red-900",
    info: "border-info/20 bg-blue-50 text-blue-900",
    ai: "border-ai/20 bg-aiSoft text-ai"
  };

  return (
    <div className={`rounded-md border p-4 text-sm ${tones[tone]} ${className}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1 leading-6" : "leading-6"}>{children}</div>
    </div>
  );
}

export function TabsBar({
  items,
  className = ""
}: {
  items: { label: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={`flex gap-1 overflow-x-auto rounded-md border border-techLine bg-techSurface p-1 shadow-sm ${className}`}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="focus-ring whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-techMuted transition hover:bg-primarySoft hover:text-primary"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

export function AiInsightCard({
  title,
  children,
  action
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-ai/30 bg-aiSoft/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex rounded-md border border-ai/20 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-ai">
            AI-assisted draft
          </span>
          <p className="mt-3 font-semibold text-techFg">{title}</p>
        </div>
        {action}
      </div>
      <div className="mt-2 text-sm leading-6 text-techMuted">{children}</div>
    </div>
  );
}

export function Timeline({
  items
}: {
  items: { label: string; detail?: string; state?: "done" | "current" | "todo" }[];
}) {
  return (
    <ol className="space-y-4">
      {items.map((item) => {
        const dot =
          item.state === "done"
            ? "bg-primary"
            : item.state === "current"
              ? "bg-warning"
              : "bg-techLine";

        return (
          <li key={item.label} className="flex gap-3 text-sm">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
            <span>
              <span className="block font-semibold text-techFg">{item.label}</span>
              {item.detail ? <span className="mt-0.5 block text-techMuted">{item.detail}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-normal text-techFg">{title}</h2>
      {detail ? <p className="mt-1 text-sm leading-6 text-techMuted">{detail}</p> : null}
    </div>
  );
}

export function titleize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
