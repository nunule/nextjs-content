import { getTranslations } from "@/lib/i18n/server"
import { Text } from "@/components/locale-provider"
import { Suspense } from "react"
import { CatalogNotice } from "@/components/catalog-notice"
import { PageLoading } from "@/components/page-loading"
import { AudioPlayer } from "@/components/audio-player"
import { getAudioCatalog } from "@/lib/media-source"

export const dynamic = "force-dynamic"
export function generateMetadata() {
  const t = getTranslations()
  return { title: t("audio.title"), description: t("audio.metaDescription") }
}

export default function MediaPage() {
  return (
    <section className="py-4 sm:py-6">
      <header className="mb-8">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 dark:text-slate-400">
          <Text id="audio.eyebrow" />
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 font-serif">
          <Text id="audio.title" />
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          <Text id="audio.description" />
        </p>
      </header>

      <Suspense fallback={<PageLoading labelKey="loading.audio" />}>
        {/* @ts-expect-error React 18.2.0 types do not yet support async server components. */}
        <AudioCatalog />
      </Suspense>
    </section>
  )
}

async function AudioCatalog() {
  const catalog = await getAudioCatalog()
  if (!catalog.configured) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"><Text id="audio.unavailable" /></p>
  }
  if (catalog.error) return <CatalogNotice message={catalog.error} />
  if (catalog.groups.length === 0) {
    return <p className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300"><Text id="audio.empty" /></p>
  }
  return <AudioPlayer groups={catalog.groups} />
}
