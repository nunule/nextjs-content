"use client"

import { useLocale } from "@/components/locale-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <section className="py-8">
      <h1 className="font-serif text-2xl font-bold">{t("error.title")}</h1>
      <p role="alert" className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{t("error.description")}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" disabled={pending} onClick={() => startTransition(() => { router.refresh(); reset() })} className="min-h-[44px] rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">{pending ? t("common.retrying") : t("common.retry")}</button>
        <Link href="/" className="text-sm underline underline-offset-4">{t("error.back")}</Link>
      </div>
    </section>
  )
}
