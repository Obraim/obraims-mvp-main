import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { isLocale } from "@/i18n/routing";
import { getCurrentUser, isAdminEmail } from "@/src/lib/obraims/access-control";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") ?? undefined;
  const loginPath = `/${isLocale(locale) ? locale : "en"}/login`;
  const user = await getCurrentUser();

  if (isAdminEmail(user?.email)) {
    redirect("/app/admin/applications");
  }

  redirect(`${loginPath}?redirectTo=/app/admin/applications`);
}
