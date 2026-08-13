import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { allChapters, allNovels } from "contentlayer/generated"
import { Mdx } from "@/components/mdx-components"
import { ReadingContent } from "@/components/reading-content"

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

function getChapterFromParams(params: ChapterPageProps["params"]) {
  const chapter = allChapters.find(
    (item) =>
      item.novelSlug === decodeRouteParam(params.novelSlug) &&
      item.chapterSlug === decodeRouteParam(params.chapterSlug)
  )
  const novel = allNovels.find(
    (item) => item.slugAsParams === decodeRouteParam(params.novelSlug)
  )

  return { chapter, novel }
}

function getNovelChapters(novelSlug: string) {
  return allChapters
    .filter((chapter) => chapter.novelSlug === novelSlug)
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
}

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  const { chapter, novel } = getChapterFromParams(params)

  if (!chapter || !novel) {
    return {}
  }

  return {
    title: `${chapter.title} | ${novel.title}`,
    description: novel.description,
  }
}

export async function generateStaticParams(): Promise<
  ChapterPageProps["params"][]
> {
  return allChapters.map((chapter) => ({
    novelSlug: chapter.novelSlug,
    chapterSlug: chapter.chapterSlug,
  }))
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { chapter, novel } = getChapterFromParams(params)

  if (!chapter || !novel) {
    notFound()
  }

  const chapters = getNovelChapters(novel.slugAsParams)
  const currentIndex = chapters.findIndex((item) => item._id === chapter._id)
  const previousChapter = chapters[currentIndex - 1]
  const nextChapter = chapters[currentIndex + 1]

  return (
    <article className="py-8">
      <div className="mb-8 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
          ← 返回小说列表
        </Link>
        <span className="mx-2">/</span>
        <span>{novel.title}</span>
      </div>

      <header className="mb-10 border-b border-slate-200 pb-6 dark:border-slate-800">
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          {novel.title}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          第{chapter.chapterNumber}章：{chapter.title}
        </h1>
      </header>

      <ReadingContent>
        <Mdx code={chapter.body.code} />
      </ReadingContent>

      <nav className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        {previousChapter ? (
          <Link
            href={previousChapter.slug}
            className="text-slate-600 hover:underline dark:text-slate-300"
          >
            ← 上一章
          </Link>
        ) : (
          <span />
        )}

        <Link href="/" className="text-slate-600 hover:underline dark:text-slate-300">
          返回目录
        </Link>

        {nextChapter ? (
          <Link
            href={nextChapter.slug}
            className="text-slate-600 hover:underline dark:text-slate-300"
          >
            下一章 →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
