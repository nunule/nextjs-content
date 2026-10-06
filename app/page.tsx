import Link from "next/link"

import { PlainTextContent } from "@/components/plain-text-content"
import { getNovelCatalog } from "@/lib/novel-source"

export const dynamic = "force-dynamic"

export default async function Home() {
  const catalog = await getNovelCatalog()

  if (!catalog.configured) {
    return (
      <section className="py-4 sm:py-6">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-400 dark:text-slate-500">
          雪落山庄 · 藏书阁
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 font-serif">
          作品辑录
        </h1>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          尚未配置 ImageKit 小说源，请先设置环境变量。
        </div>
      </section>
    )
  }

  if (catalog.error) {
    return (
      <section className="py-4 sm:py-6">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-400 dark:text-slate-500">
          雪落山庄 · 藏书阁
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 font-serif">
          暂时无法读取作品
        </h1>
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
        >
          {catalog.error}
        </div>
      </section>
    )
  }

  if (catalog.novels.length === 0) {
    return (
      <section className="py-4 sm:py-6">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-400 dark:text-slate-500">
          雪落山庄 · 藏书阁
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 font-serif">
          作品辑录
        </h1>
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/60 p-8 text-center text-sm text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
          暂无收录作品，新上传的故事将在此陈列。
        </div>
      </section>
    )
  }

  return (
    <section className="py-4 sm:py-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.25em] text-slate-400 dark:text-slate-500">
            雪落山庄 · 藏书阁
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 font-serif">
            作品辑录
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            落雪煮茶，闲翻百卷。悬停作品可查梗概，展开目录即刻阅读。
          </p>
        </div>
        <a
          href="/rss"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 flex items-center gap-1.5 rounded-lg border border-orange-200/80 bg-orange-50/50 px-2.5 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-100/70 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-900/40"
          aria-label="RSS 订阅"
        >
          <svg
            xmlns="http://www.w3.org/2005/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          <span>订阅 RSS</span>
        </a>
      </header>

      <div className="space-y-6">
        {catalog.novels.map((novel) => (
          <article
            key={novel.slug}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 shadow-[0_2px_16px_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all hover:border-slate-300 dark:border-slate-800/90 dark:bg-slate-900/80 dark:hover:border-slate-700"
          >
            <div className="px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="group/novel-title relative min-w-0">
                  <button
                    type="button"
                    className="cursor-pointer text-left"
                    aria-label={`查看${novel.title}简介`}
                  >
                    <p className="text-[11px] font-mono font-medium tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      NOVEL
                    </p>
                    <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                      {novel.title}
                    </h2>
                  </button>

                  {/* 悬停简介浮层 */}
                  <div className="pointer-events-none invisible absolute left-0 top-full z-20 mt-3 w-[min(28rem,calc(100vw-2rem))] -translate-y-1 rounded-2xl border border-slate-200 bg-white p-5 text-left opacity-0 shadow-xl transition duration-150 group-hover/novel-title:pointer-events-auto group-hover/novel-title:visible group-hover/novel-title:translate-y-0 group-hover/novel-title:opacity-100 group-focus-within/novel-title:pointer-events-auto group-focus-within/novel-title:visible group-focus-within/novel-title:translate-y-0 group-focus-within/novel-title:opacity-100 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-medium tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      内容梗概
                    </p>
                    {novel.description && (
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        类型：{novel.description}
                      </p>
                    )}
                    {novel.summary ? (
                      <div className="novel-summary prose prose-sm mt-3 max-w-none break-words text-slate-600 dark:prose-invert dark:text-slate-300">
                        <PlainTextContent content={novel.summary} />
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                        暂未提供作品简介。
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <a
                    href={`/novels/${novel.slug}/rss`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-orange-500 transition hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/40"
                    aria-label={`订阅 ${novel.title}`}
                    title={`订阅 ${novel.title}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2005/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 11a9 9 0 0 1 9 9" />
                      <path d="M4 4a16 16 0 0 1 16 16" />
                      <circle cx="5" cy="19" r="1" />
                    </svg>
                  </a>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      novel.status === "连载中"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {novel.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 章节折叠区 */}
            <details className="group border-t border-slate-100 dark:border-slate-800/80">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50/60 dark:text-slate-300 dark:hover:bg-slate-800/40 sm:px-6">
                <span>章节目录</span>
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                  共 {novel.chapters.length} 章
                </span>
              </summary>

              <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 dark:border-slate-800/60 dark:bg-slate-950/30 sm:px-6">
                <ol className="divide-y divide-slate-100/70 dark:divide-slate-800/40 text-sm">
                  {novel.chapters.map((chapter) => (
                    <li key={chapter.path} className="py-2.5 first:pt-1 last:pb-1">
                      <Link
                        href={chapter.path}
                        className="group/link flex items-center justify-between text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                      >
                        <span className="truncate">
                          第{chapter.chapterNumber}章：{chapter.title}
                        </span>
                        <span className="font-mono text-xs text-slate-400 opacity-0 transition-opacity group-hover/link:opacity-100">
                          阅读 →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  )
}
