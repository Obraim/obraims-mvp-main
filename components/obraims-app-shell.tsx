import type { ReactNode } from "react";
import Link from "next/link";
import { ObraimsLogo } from "@/components/obraims-logo";
import { getCurrentUser, isSuperAdmin } from "@/src/lib/obraims/access-control";

type ShellLink = {
  label: string;
  href: string;
  section: "Workspace" | "Review" | "Operations";
  marker: string;
  superAdminOnly?: boolean;
};

const navLinks: ShellLink[] = [
  { label: "Dashboard", href: "/app/dashboard", section: "Workspace", marker: "D" },
  { label: "Applications", href: "/app/admin/applications", section: "Workspace", marker: "A", superAdminOnly: true },
  { label: "Borrower Status", href: "/en/borrower", section: "Workspace", marker: "S" },
  { label: "Pipeline", href: "/app/admin/applications?status=submitted", section: "Review", marker: "P", superAdminOnly: true },
  { label: "Documents", href: "/app/admin/applications?queue=documents", section: "Review", marker: "F", superAdminOnly: true },
  { label: "Credit Memos", href: "/app/admin/applications?queue=memos", section: "Review", marker: "M", superAdminOnly: true }
];

export async function ObraimsAppShell({
  title,
  subtitle,
  eyebrow,
  active,
  actions,
  children
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  active?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  const superAdmin = await isSuperAdmin(user);
  const visibleLinks = navLinks.filter((link) => !link.superAdminOnly || superAdmin);
  const grouped = visibleLinks.reduce<Record<ShellLink["section"], ShellLink[]>>(
    (groups, link) => {
      groups[link.section].push(link);
      return groups;
    },
    { Workspace: [], Review: [], Operations: [] }
  );

  return (
    <main className="obraims-design-dark min-h-screen bg-techBg text-techFg">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-techLine bg-white/95 text-techFg lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
            <Link href="/app/dashboard" className="block">
              <span className="min-w-0">
                <span className="inline-flex items-center">
                  <ObraimsLogo className="h-7 w-auto max-w-[170px]" />
                </span>
                <span className="mt-2 block font-mono text-xs text-techMuted">Origination workspace</span>
              </span>
            </Link>
            {superAdmin ? (
              <span className="rounded-md border border-primary/40 bg-primarySoft px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                Super Admin
              </span>
            ) : null}
          </div>
          <div className="mx-4 mb-4 hidden rounded-md border border-techLine bg-techSurface2 p-3 text-xs leading-5 text-techMuted lg:block">
            Intelligent intake, review, documents, and credit memo workflow in one place.
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-6 lg:overflow-visible lg:px-4 lg:pb-6">
            {Object.entries(grouped).map(([section, links]) =>
              links.length > 0 ? (
                <div key={section} className="min-w-[220px] lg:min-w-0">
                  <p className="px-2 font-mono text-xs font-semibold uppercase text-techMuted">{section}</p>
                  <div className="mt-2 space-y-1">
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          active === link.label
                            ? "bg-primary text-[#07100E] shadow-sm"
                            : "text-techMuted hover:bg-techSurface2 hover:text-techFg"
                        }`}
                      >
                        <span className={`grid h-6 w-6 place-items-center rounded-md text-[11px] font-bold ${
                          active === link.label ? "bg-white text-[#07100E]" : "bg-techSurface2 text-techMuted"
                        }`}>
                          {link.marker}
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </nav>
        </aside>
        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-techLine bg-white/92 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            {superAdmin ? (
              <div className="mb-3 inline-flex rounded-md border border-primary/30 bg-primarySoft px-3 py-1 font-mono text-xs font-semibold uppercase text-primary">
                Super Admin Testing Mode
              </div>
            ) : null}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                {eyebrow ? <p className="font-mono text-xs font-semibold uppercase text-primary">{eyebrow}</p> : null}
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-techFg sm:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-3xl text-sm text-techMuted">{subtitle}</p> : null}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-[220px] items-center justify-between rounded-md border border-techLine bg-techSurface px-3 py-2 text-sm text-techMuted shadow-sm">
                  <span>Search or command</span>
                  <span className="rounded border border-techLine bg-techBg px-1.5 py-0.5 font-mono text-[10px] font-semibold text-techMuted">/</span>
                </div>
                <div className="rounded-md border border-techLine bg-techSurface px-3 py-2 text-sm text-techFg shadow-sm">
                  <span className="block max-w-[220px] truncate">{user?.email ?? "Not signed in"}</span>
                  <span className="caption">{superAdmin ? "Super admin" : user ? "Authenticated" : "Guest"}</span>
                </div>
                {actions}
              </div>
            </div>
          </header>
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
