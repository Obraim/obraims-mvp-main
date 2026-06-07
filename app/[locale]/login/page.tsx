import { selectDemoRoleAction } from "@/app/actions";
import { ObraimsLogo } from "@/components/obraims-logo";
import { TopNav } from "@/components/top-nav";
import { useTranslations } from "next-intl";
import { LoginForm } from "./login-form";

const demoAccounts = [
  { role: "BORROWER", email: "amina@example.com", href: "/borrower" },
  { role: "LOAN_OFFICER", email: "daniel@obraims.local", href: "/officer" },
  { role: "CREDIT_ANALYST", email: "priya@obraims.local", href: "/officer" },
  { role: "ADMIN", email: "admin@obraims.local", href: "/admin" }
] as const;

export const dynamic = "force-dynamic";

export default function LoginPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: { redirectTo?: string };
}) {
  const t = useTranslations("Login");
  const common = useTranslations("Common");
  const roleT = useTranslations("Role");
  const showDemoAuth = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true";
  const redirectTo =
    searchParams?.redirectTo && searchParams.redirectTo.startsWith("/") && !searchParams.redirectTo.startsWith("//")
      ? searchParams.redirectTo
      : undefined;

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded border border-line bg-white p-6 shadow-soft">
          <ObraimsLogo className="h-10 max-w-[170px]" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-teal">{showDemoAuth ? t("eyebrow") : "Secure sign in"}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">{t("title")}</h1>
          <p className="mt-3 text-slate-600">
            {t("description")}
          </p>
          <LoginForm locale={params.locale} redirectTo={redirectTo} />
          {showDemoAuth ? (
            <>
              <p className="mt-6 rounded border border-dashed border-line bg-surface p-3 text-sm text-slate-600">
                {t("productionNote")}
              </p>
              <div className="mt-6 grid gap-3">
                {demoAccounts.map((account) => (
                  <form
                    key={account.email}
                    action={selectDemoRoleAction}
                    className="rounded border border-line hover:bg-surface"
                  >
                    <input type="hidden" name="role" value={account.role} />
                    <input type="hidden" name="redirectTo" value={account.href} />
                    <button className="focus-ring flex w-full items-center justify-between rounded p-4 text-left">
                      <span>
                        <span className="block font-semibold text-ink">{roleT(account.role)}</span>
                        <span className="text-sm text-slate-500">{account.email}</span>
                      </span>
                      <span className="text-sm font-semibold text-teal">{common("continue")}</span>
                    </button>
                  </form>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
