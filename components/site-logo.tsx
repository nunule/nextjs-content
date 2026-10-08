"use client"

import { useLocale } from "@/components/locale-provider"
import Image from "next/image"

export function SiteLogo({ className = "h-10 w-10" }: { className?: string }) {
  const { t } = useLocale()
  return (
    <Image
      src="/icon.svg"
      alt={t("site.logo")}
      width={64}
      height={64}
      priority
      unoptimized
      className={`shrink-0 dark:invert ${className}`}
    />
  )
}
