"use client"

import type { ComponentProps } from "react"
import { useLocale } from "@/components/locale-provider"

export function RssLink({ novelTitle, ...props }: ComponentProps<"a"> & { novelTitle?: string }) {
  const { t } = useLocale()
  const label = novelTitle ? t("rss.novel", { title: novelTitle }) : t("rss.subscribe")
  return <a {...props} aria-label={label} title={label} />
}
