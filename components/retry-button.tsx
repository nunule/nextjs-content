"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function RetryButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="mt-3 min-h-[44px] rounded-lg border border-current px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60">
      {pending ? "正在重试…" : "重新加载"}
    </button>
  )
}
