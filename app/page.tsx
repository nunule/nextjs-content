import { allChapters, allNovels } from "contentlayer/generated"
import Link from "next/link"

const statusLabels: Record<string, string> = {
  连载中: "连载中",
  已完结: "已完结",
}

export default function Home() {
  return (
    <section className="py-8">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          小说作品
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">小说</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          点击小说标题，展开章节目录。
        </p>
      </header>

      <div className="space-y-3">
        {allNovels.map((novel) => {
          const chapters = allChapters
            .filter((chapter) => chapter.novelSlug === novel.slugAsParams)
            .sort((a, b) => a.chapterNumber - b.chapterNumber)

          return (
            <details
              key={novel._id}
              className="group rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium [&::-webkit-details-marker]:hidden">
                <span className="text-lg">{novel.title}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {statusLabels[novel.status]}
                </span>
              </summary>

              <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                {novel.description && (
                  <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                    {novel.description}
                  </p>
                )}

                <ol className="space-y-2 text-sm">
                  {chapters.map((chapter) => (
                    <li key={chapter._id}>
                      <Link
                        href={chapter.slug}
                        className="text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
                      >
                        第{chapter.chapterNumber}章：{chapter.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
