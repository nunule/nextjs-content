import { RssLink } from "@/components/rss-link"
import { Text } from "@/components/locale-provider"
import { NavigationLink } from "@/components/navigation-link"
import { Suspense } from "react"
import { CatalogNotice } from "@/components/catalog-notice"
import { Disclosure } from "@/components/disclosure"
import { PageLoading } from "@/components/page-loading"

import { PlainTextContent } from "@/components/plain-text-content"
import { getNovelCatalog } from "@/lib/novel-source"

export function NovelLibrary() {
  return (
    <section className="py-4 sm:py-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.25em] text-slate-500 dark:text-slate-400">
            <Text id="library.eyebrow" />
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 font-serif">
            <Text id="library.title" />
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            <Text id="library.description" />
          </p>
        </div>
        <RssLink
          href="/rss"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-200/80 bg-orange-50/50 px-2.5 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-100/70 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-900/40"
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
          <span><Text id="rss.subscribe" /></span>
        </RssLink>
      </header>

      <Suspense fallback={<PageLoading labelKey="loading.novels" />}>
        {/* @ts-expect-error React 18.2.0 types do not yet support async server components. */}
        <NovelList />
      </Suspense>
    </section>
  )
}

async function NovelList() {
  const catalog = await getNovelCatalog()
  if (!catalog.configured) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"><Text id="library.unavailable" /></p>
  }
  if (catalog.error) {
    return <CatalogNotice message={catalog.error} />
  }
  return (
    <>
      {catalog.warning && <CatalogNotice message={catalog.warning} warning />}
      {catalog.novels.length === 0 && <p className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300"><Text id="library.empty" /></p>}
      <div className="space-y-6">
        {catalog.novels.map((novel) => (
          <article
            key={novel.slug}
            className="site-surface overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 shadow-[0_2px_16px_rgba(0,0,0,0.02)] transition-colors hover:border-slate-300 dark:border-slate-800/90 dark:bg-slate-900/80 dark:hover:border-slate-700"
          >
            <div className="px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3">
                <div className="min-w-0 flex-1">
                  <Disclosure
                    labelKey="novel.showSummary" labelValues={{ title: novel.title }}
                    buttonClassName="rounded-lg py-1 text-slate-700 dark:text-slate-200"
                    title={<>
                      <span role="heading" aria-level={2} className="block font-serif text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">{novel.title}</span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400"><Text id="novel.introduction" /></span>
                    </>}
                  >
                    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                      <p className="text-xs font-medium tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        <Text id="novel.summary" />
                      </p>
                      {novel.description && (
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Text id="novel.genre" values={{ genre: novel.description }} />
                        </p>
                      )}
                      {novel.summary ? (
                        <div className="novel-summary prose prose-sm mt-3 max-w-none break-words text-slate-600 dark:prose-invert dark:text-slate-300">
                          <PlainTextContent content={novel.summary} />
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                          <Text id="novel.noSummary" />
                        </p>
                      )}
                    </div>
                  </Disclosure>
                </div>

                <div className="order-first flex items-center justify-between gap-2.5">
                  <span className="font-mono text-xs tracking-widest text-slate-500 dark:text-slate-400"><Text id="novel.label" /></span>
                  <div className="flex items-center gap-2.5">
                  <RssLink
                    href={`/novels/${novel.slug}/rss`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-orange-500 transition hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/40"
                    novelTitle={novel.title}
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
                  </RssLink>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      novel.status === "连载中"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Text id={novel.status === "连载中" ? "novel.ongoing" : "novel.completed"} />
                  </span>
                  </div>
                </div>
              </div>
            </div>

            <Disclosure
              className="border-t border-slate-100 dark:border-slate-800/80"
              buttonClassName="px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50/60 dark:text-slate-300 dark:hover:bg-slate-800/40 sm:px-6"
              title={<span className="flex items-center justify-between gap-3"><span><Text id="novel.chapters" /></span><span className="text-xs text-slate-500 dark:text-slate-400"><Text id="novel.chapterCount" values={{ count: novel.chapters.length }} /></span></span>}
            >
              <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 dark:border-slate-800/60 dark:bg-slate-950/30 sm:px-6">
                <ol className="divide-y divide-slate-100/70 dark:divide-slate-800/40 text-sm">
                  {novel.chapters.map((chapter) => (
                    <li key={chapter.path} className="py-2.5 first:pt-1 last:pb-1">
                      <NavigationLink
                        href={chapter.path}
                        className="group/link flex min-h-[44px] items-center justify-between gap-3 text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                      >
                        <span className="min-w-0 break-words">
                          <Text id="novel.chapter" values={{ number: chapter.chapterNumber, title: chapter.title }} />
                        </span>
                        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          <Text id="novel.read" />
                        </span>
                      </NavigationLink>
                    </li>
                  ))}
                </ol>
              </div>
            </Disclosure>
          </article>
        ))}
      </div>
    </>
  )
}
