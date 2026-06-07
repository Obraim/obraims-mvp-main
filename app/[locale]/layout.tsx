import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, locales, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : "en";
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: "Obraims",
    description: t("description"),
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png"
    },
    manifest: "/site.webmanifest"
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{ children: ReactNode; params: { locale: Locale } }>) {
  const locale = isLocale(params.locale) ? params.locale : "en";
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
