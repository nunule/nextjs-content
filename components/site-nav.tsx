"use client"

import { useLocale } from "@/components/locale-provider"
import type { MessageKey } from "@/lib/i18n/messages"
import { NavigationLink } from "@/components/navigation-link"
import { usePathname } from "next/navigation"

const links: Array<{ href: string; label: MessageKey }> = [
  { href: "/", label: "nav.home" },
  { href: "/novels", label: "nav.novels" },
  { href: "/media", label: "nav.audio" },
  { href: "/about", label: "nav.about" },
]

export function SiteNav() {
  const { t } = useLocale()
  const pathname = usePathname()
  return (
    <nav aria-label={t("nav.main")} className="flex items-center justify-between gap-1 text-sm font-medium sm:gap-2 md:justify-start">
      {links.map(({ href, label }) => {
        const active = pathname === href || (href !== "/" && Boolean(pathname?.startsWith(`${href}/`)))
        return (
          <NavigationLink key={href} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-2 py-2.5 sm:px-2.5 ${active ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white" : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}`}>
            {t(label)}
          </NavigationLink>
        )
      })}
    </nav>
  )
}
