import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ObraimsLogo } from "@/components/obraims-logo";
import { isSuperAdmin } from "@/src/lib/obraims/access-control";

const links = [
  { href: "/app/apply", label: "apply", appRoute: true, superAdminOnly: false },
  { href: "/borrower", label: "status", appRoute: false, superAdminOnly: false },
  { href: "/borrower/messages", label: "messages", appRoute: false, superAdminOnly: false },
  { href: "/app/admin/applications", label: "applications", appRoute: true, superAdminOnly: true },
  { href: "/officer", label: "officer", appRoute: false, superAdminOnly: false },
  { href: "/officer/agent-review", label: "agent", appRoute: false, superAdminOnly: false },
  { href: "/officer/inbox", label: "inbox", appRoute: false, superAdminOnly: false },
  { href: "/admin", label: "admin", appRoute: false, superAdminOnly: true },
  { href: "/login", label: "signIn", appRoute: false, superAdminOnly: false }
] as const;

export async function TopNav() {
  const t = await getTranslations("Nav");
  const superAdmin = await isSuperAdmin();
  const visibleLinks = links.filter((link) => !link.superAdminOnly || superAdmin);

  return (
    <header className="border-b border-line bg-white">
      {superAdmin ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-amber-900">
          Super Admin Testing Mode
        </div>
      ) : null}
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <ObraimsLogo className="h-9 max-w-[150px]" />
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <nav className="flex flex-wrap items-center gap-1">
            {visibleLinks.map((link) =>
              link.appRoute ? (
                <NextLink
                  key={link.href}
                  href={link.href}
                  className="rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-surface hover:text-ink"
                >
                  {t(link.label)}
                </NextLink>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-surface hover:text-ink"
                >
                  {t(link.label)}
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
