"use client"

import { NavigationLink } from "@/components/navigation-link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "首页" },
  { href: "/novels", label: "小说" },
  { href: "/media", label: "声音" },
  { href: "/about", label: "关于" },
]

export function SiteNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="主导航" className="flex items-center gap-1 text-sm font-medium sm:gap-2">
      {links.map(({ href, label }) => {
        const active = pathname === href || (href !== "/" && Boolean(pathname?.startsWith(`${href}/`)))
        return (
          <NavigationLink key={href} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-2.5 py-2.5 sm:px-3 ${active ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white" : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}`}>
            {label}
          </NavigationLink>
        )
      })}
    </nav>
  )
}
