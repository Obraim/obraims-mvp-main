import { defineRouting } from "next-intl/routing";

export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always"
});

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function localizePath(path: string, locale: string | undefined) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/en${normalizedPath}`;
}
