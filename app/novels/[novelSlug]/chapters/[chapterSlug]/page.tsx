import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PlainTextContent } from "@/components/plain-text-content"
import { ReadingContent } from "@/components/reading-content"
import { getNovelBySlug } from "@/lib/novel-source"

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
  const novel = await getNovelBySlug(params.novelSlug)
  const chapter = novel?.chapters.find(
    (item) => item.slug === decodeRouteParam(params.chapterSlug),
  )

  return { chapter, novel }
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
  const { chapter, novel } = await getChapterFromParams(params)

  if (!chapter || !novel) {
    notFound()
  }

  const currentIndex = novel.chapters.findIndex((item) => item.slug === chapter.slug)
  const previousChapter = novel.chapters[currentIndex - 1]
  const nextChapter = novel.chapters[currentIndex + 1]

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
        <a
          href={chapter.downloadPath}
          download
          className="mt-5 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          下载本章
        </a>
      </header>

      <ReadingContent>
        <PlainTextContent content={chapter.content} />
      </ReadingContent>

      <nav className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        {previousChapter ? (
          <Link
            href={previousChapter.path}
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
            href={nextChapter.path}
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
