import { allChapters, allNovels } from "contentlayer/generated"
import Link from "next/link"
import { Mdx } from "@/components/mdx-components"

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
          悬停小说标题查看简介，再展开章节目录开始阅读。
        </p>
      </header>

      <div className="space-y-5">
        {allNovels.map((novel) => {
          const chapters = allChapters
            .filter((chapter) => chapter.novelSlug === novel.slugAsParams)
            .sort((a, b) => a.chapterNumber - b.chapterNumber)

          return (
            <article
              key={novel._id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="px-5 py-6 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="group/novel-title relative min-w-0">
                    <button
                      type="button"
                      className="cursor-pointer text-left"
                      aria-label={`查看${novel.title}简介`}
                    >
                      <p className="text-xs font-medium tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        作品
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{novel.title}</h2>
                    </button>

                    <div className="pointer-events-none invisible absolute left-0 top-full z-20 mt-3 w-[min(28rem,calc(100vw-2rem))] -translate-y-1 rounded-xl border border-slate-200 bg-white p-5 text-left opacity-0 shadow-xl transition duration-150 group-hover/novel-title:pointer-events-auto group-hover/novel-title:visible group-hover/novel-title:translate-y-0 group-hover/novel-title:opacity-100 group-focus-within/novel-title:pointer-events-auto group-focus-within/novel-title:visible group-focus-within/novel-title:translate-y-0 group-focus-within/novel-title:opacity-100 dark:border-slate-700 dark:bg-slate-950">
                      <p className="text-xs font-medium tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        内容简介
                      </p>
                      {novel.description && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          类型：{novel.description}
                        </p>
                      )}
                      {novel.body.code ? (
                        <div className="novel-summary prose prose-sm mt-4 max-w-none break-words text-slate-600 dark:prose-invert dark:text-slate-300">
                          <Mdx code={novel.body.code} />
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          暂未提供作品简介。
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {statusLabels[novel.status]}
                  </span>
                </div>
              </div>

              <details className="group border-t border-slate-200 dark:border-slate-800">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium [&::-webkit-details-marker]:hidden sm:px-7">
                  <span>章节目录</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    共 {chapters.length} 章
                  </span>
                </summary>

                <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
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
            </article>
          )
        })}
      </div>
    </section>
  )
}
