export const SUPPORTED_LOCALES = ["zh-CN", "en"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "zh-CN"
export const LOCALE_COOKIE = "snowfall-locale"
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function resolveLocale(value: unknown): Locale {
  return SUPPORTED_LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE
}
