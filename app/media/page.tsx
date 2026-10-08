import { Suspense } from "react"
import { CatalogNotice } from "@/components/catalog-notice"
import { PageLoading } from "@/components/page-loading"
import { AudioPlayer } from "@/components/audio-player"
import { getAudioCatalog } from "@/lib/media-source"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "雪落聆音",
  description: "雪落山庄按日期收录的声音记录，煮茶听风，安静听一会儿。",
}

export default function MediaPage() {
  return (
    <section className="py-4 sm:py-6">
      <header className="mb-8">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 dark:text-slate-400">
          雪落山庄 · 留声小憩
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 font-serif">
          雪落聆音
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          最新的声音，先听见。煮茶听风，静坐片刻。
        </p>
      </header>

      <Suspense fallback={<PageLoading label="正在加载声音目录…" />}>
        {/* @ts-expect-error React 18.2.0 types do not yet support async server components. */}
        <AudioCatalog />
      </Suspense>
    </section>
  )
}

async function AudioCatalog() {
  const catalog = await getAudioCatalog()
  if (!catalog.configured) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">声音尚未上架，请稍后再来。</p>
  }
  if (catalog.error) return <CatalogNotice message={catalog.error} />
  if (catalog.groups.length === 0) {
    return <p className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">暂无音频记录，新的声音将在这里静候。</p>
  }
  return <AudioPlayer groups={catalog.groups} />
}
