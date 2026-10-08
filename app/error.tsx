"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <section className="py-8">
      <h1 className="font-serif text-2xl font-bold">内容暂时未能加载</h1>
      <p role="alert" className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">请稍后重试，或返回作品列表继续浏览。</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" disabled={pending} onClick={() => startTransition(() => { router.refresh(); reset() })} className="min-h-[44px] rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">{pending ? "正在重试…" : "重新加载"}</button>
        <Link href="/" className="text-sm underline underline-offset-4">返回作品列表</Link>
      </div>
    </section>
  )
}
