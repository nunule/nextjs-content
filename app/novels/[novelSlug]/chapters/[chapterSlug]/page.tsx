import { Text } from "@/components/locale-provider"
import type { Metadata } from "next"
import { NavigationLink } from "@/components/navigation-link"
import { notFound } from "next/navigation"

import { PlainTextContent } from "@/components/plain-text-content"
import { ReadingContent } from "@/components/reading-content"
import { CatalogNotice } from "@/components/catalog-notice"
import { getNovelCatalog } from "@/lib/novel-source"

interface ChapterPageProps {
  params: {
    novelSlug: string
    chapterSlug: string
  }
}

function decodeRouteParam(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function getChapterFromParams(params: ChapterPageProps["params"]) {
  const catalog = await getNovelCatalog()
  const novel = catalog.novels.find((item) => item.slug === decodeRouteParam(params.novelSlug))
  const chapter = novel?.chapters.find(
    (item) => item.slug === decodeRouteParam(params.chapterSlug),
  )

  return { chapter, novel, warning: catalog.warning, error: catalog.error }
}

export const dynamic = "force-dynamic"
export const dynamicParams = true

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  const { chapter, novel } = await getChapterFromParams(params)

  if (!chapter || !novel) {
    return {}
  }

  return {
    title: `${chapter.title} | ${novel.title}`,
    description: novel.description,
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { chapter, novel, warning, error } = await getChapterFromParams(params)

  if (!chapter || !novel) {
    if (error || warning) throw new Error("章节暂时无法读取")
    notFound()
  }

  const currentIndex = novel.chapters.findIndex((item) => item.slug === chapter.slug)
  const previousChapter = novel.chapters[currentIndex - 1]
  const nextChapter = novel.chapters[currentIndex + 1]

  return (
    <article className="py-4 sm:py-8">
      {warning && <CatalogNotice message={warning} warning />}
      <div className="mb-8 text-sm text-slate-500 dark:text-slate-400">
        <NavigationLink href="/novels" className="hover:text-slate-900 dark:hover:text-white">
          <Text id="novel.back" />
        </NavigationLink>
        <span className="mx-2">/</span>
        <span>{novel.title}</span>
      </div>

      <header className="mb-10 border-b border-slate-200 pb-6 dark:border-slate-800">
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          {novel.title}
        </p>
        <h1 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          <Text id="novel.chapter" values={{ number: chapter.chapterNumber, title: chapter.title }} />
        </h1>
      </header>

      <ReadingContent>
        <PlainTextContent content={chapter.content} />
      </ReadingContent>

      <nav className="mt-12 flex items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        {previousChapter ? (
          <NavigationLink
            href={previousChapter.path}
            className="text-slate-600 hover:underline dark:text-slate-300"
          >
            <Text id="novel.previous" />
          </NavigationLink>
        ) : (
          <span />
        )}

        <NavigationLink href="/novels" className="text-slate-600 hover:underline dark:text-slate-300">
          <Text id="novel.contents" />
        </NavigationLink>

        {nextChapter ? (
          <NavigationLink
            href={nextChapter.path}
            className="text-slate-600 hover:underline dark:text-slate-300"
          >
            <Text id="novel.next" />
          </NavigationLink>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
