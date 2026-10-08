"use client"

import { useLocale } from "@/components/locale-provider"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function RetryButton() {
  const { t } = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="mt-3 min-h-[44px] rounded-lg border border-current px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60">
      {pending ? t("common.retrying") : t("common.retry")}
    </button>
  )
}
