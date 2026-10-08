"use client"

import { NavigationLink } from "@/components/navigation-link"
import { SiteLogo } from "@/components/site-logo"
import { useLocale } from "@/components/locale-provider"

export function SiteBrand() {
  const { t } = useLocale()
  return (
    <NavigationLink href="/" className="group flex shrink-0 items-center gap-2 transition-opacity hover:opacity-95 sm:gap-2.5" aria-label={t("site.home")}>
      <SiteLogo className="h-9 w-9 sm:h-10 sm:w-10" />
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold leading-5 tracking-[0.04em] text-neutral-950 sm:text-lg sm:tracking-[0.06em] dark:text-neutral-100">{t("site.name")}</span>
        <span className="text-[9px] font-medium uppercase leading-3 tracking-[0.08em] text-slate-500 sm:tracking-[0.16em] dark:text-slate-400">{t("site.subtitle")}</span>
      </div>
    </NavigationLink>
  )
}

export function SiteFooter() {
  const { t } = useLocale()
  return (
    <footer className="mt-16 border-t border-slate-200/70 pb-16 pt-8 text-center text-xs leading-6 text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
      <div className="mb-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-serif text-xs text-slate-600 sm:text-sm dark:text-slate-400">
        <span>{t("site.name")}</span><span className="opacity-40">·</span><span>{t("site.tagline")}</span>
      </div>
      <p className="tracking-wide">{t("site.footer")}</p>
    </footer>
  )
}
