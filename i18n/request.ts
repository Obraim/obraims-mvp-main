import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";

type Messages = Record<string, unknown>;

function mergeMessages(fallback: Messages, messages: Messages): Messages {
  return Object.fromEntries(
    Object.entries(fallback).map(([key, value]) => {
      const override = messages[key];

      if (isPlainObject(value) && isPlainObject(override)) {
        return [key, mergeMessages(value, override)];
      }

      return [key, override ?? value];
    })
  );
}

function isPlainObject(value: unknown): value is Messages {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function loadMessages(locale: Locale) {
  return (await import(`../messages/${locale}.json`)).default as Messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : defaultLocale;
  const fallbackMessages = await loadMessages("en");
  const localeMessages = locale === "en" ? fallbackMessages : mergeMessages(fallbackMessages, await loadMessages(locale));

  return {
    locale,
    messages: localeMessages
  };
});
