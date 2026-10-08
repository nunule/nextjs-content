"use client"

import { useLocale } from "@/components/locale-provider"

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()
  return (
    <button type="button" onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")} aria-label={t("locale.switch")} title={t("locale.switch")}
      className="flex h-11 min-w-[44px] items-center justify-center rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800">
      <span lang={locale === "zh-CN" ? "en" : "zh-CN"}>{locale === "zh-CN" ? "EN" : "中文"}</span>
    </button>
  )
}
