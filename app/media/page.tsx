import { AudioPlayer } from "@/components/audio-player"
import { getAudioCatalog } from "@/lib/media-source"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "雪落聆音",
  description: "雪落山庄按日期收录的声音记录，煮茶听风，安静听一会儿。",
}

export default async function MediaPage() {
  const catalog = await getAudioCatalog()
  return (
    <section className="py-4 sm:py-6">
      <header className="mb-8">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-400 dark:text-slate-500">
          雪落山庄 · 留声小憩
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 font-serif">
          雪落聆音
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          按日期收录，煮茶听风。静坐片刻，听一段岁月回响。
        </p>
      </header>

      {!catalog.configured ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          尚未配置音频存储源，请在环境变量中设置 ImageKit。
        </div>
      ) : catalog.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50/50 p-5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
        >
          {catalog.error}
        </div>
      ) : catalog.groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-8 text-center text-sm text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
          暂无音频记录，新的声音将在这里静候。
        </div>
      ) : (
        <AudioPlayer groups={catalog.groups} />
      )}
    </section>
  )
}
