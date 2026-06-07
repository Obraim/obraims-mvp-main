import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/status-badge";
import { TopNav } from "@/components/top-nav";
import { users } from "@/lib/data";
import { getCurrentDemoUser, getVisibleApplicationsForUser } from "@/lib/security/access-control";

export default async function AdminPage() {
  const user = await getCurrentDemoUser("ADMIN");
  const t = await getTranslations("Admin");
  const roleT = await getTranslations("Role");

  if (user.role !== "ADMIN") {
    notFound();
  }

  const applications = await getVisibleApplicationsForUser(user);

  return (
    <main>
      <TopNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">{t("eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            {t("description")}
          </p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{t("users")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("roleManagement")}</p>
              </div>
              <button className="focus-ring rounded border border-line px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-surface">
                {t("manageRoles")}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded border border-line p-4">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-teal">
                    {roleT(user.role)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded border border-dashed border-line bg-surface p-3 text-sm text-slate-600">
              {t("rolePolicyNote")}
            </p>
          </div>
          <div className="rounded border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold">{t("applications")}</h2>
            <div className="mt-4 space-y-3">
              {applications.map((application) => (
                <Link
                  key={application.id}
                  href={`/applications/${application.id}`}
                  className="flex flex-col gap-3 rounded border border-line p-4 hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="block font-semibold">{application.applicationNumber}</span>
                    <span className="text-sm text-slate-500">
                      {application.borrowerProfile.legalName}
                    </span>
                  </span>
                  <StatusBadge status={application.status} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
