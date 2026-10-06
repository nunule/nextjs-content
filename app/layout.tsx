import Link from "next/link"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@/components/analytics"
import { ModeToggle } from "@/components/mode-toggle"
import { SiteLogo } from "@/components/site-logo"

export const metadata = {
  title: {
    default: "雪落山庄",
    template: "%s · 雪落山庄",
  },
  description: "雪落山庄 · 听风听雪，翻书煮茶。简洁的小说连载与声音聆听空间。",
  icons: {
    icon: "/icon.svg",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-[#fafafc] text-slate-900 antialiased selection:bg-slate-900 selection:text-white dark:bg-[#0c0f17] dark:text-slate-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative min-h-screen flex flex-col justify-between">
            {/* 极简氛围衬底：极轻量CSS无任何外部图片依赖 */}
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(148,163,184,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(255,255,255,0.04),rgba(0,0,0,0))]" />

            <div className="relative z-10 max-w-2xl mx-auto w-full py-8 sm:py-12 px-4 sm:px-6">
              <header className="mb-10 sm:mb-12">
                <div className="flex items-center justify-between gap-4">
                  {/* 雪落山庄 Brand Logo (白色主体 + 黑色边框) */}
                  <Link
                    href="/"
                    className="group flex items-center gap-3 transition-opacity hover:opacity-95"
                    aria-label="雪落山庄首页"
                  >
                    <SiteLogo className="h-9 w-9 shrink-0 shadow-sm" />
                    <div className="flex flex-col">
                      <span className="font-serif text-lg font-bold tracking-wider text-slate-900 dark:text-slate-100">
                        雪落山庄
                      </span>
                      <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 font-mono">
                        Snowfall Villa
                      </span>
                    </div>
                  </Link>

                  {/* 顶栏导航 */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <nav className="flex items-center space-x-5 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <Link
                        href="/"
                        className="transition-colors hover:text-slate-900 dark:hover:text-white"
                      >
                        首页
                      </Link>
                      <Link
                        href="/media"
                        className="transition-colors hover:text-slate-900 dark:hover:text-white"
                      >
                        声音
                      </Link>
                      <Link
                        href="/about"
                        className="transition-colors hover:text-slate-900 dark:hover:text-white"
                      >
                        关于
                      </Link>
                    </nav>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
                    <ModeToggle />
                  </div>
                </div>
              </header>

              <main>{children}</main>

              {/* 极简山庄页脚 */}
              <footer className="mt-20 border-t border-slate-200/70 pt-8 pb-10 text-center text-xs text-slate-400 dark:border-slate-800/70 dark:text-slate-500">
                <div className="flex items-center justify-center gap-2 mb-2 font-serif text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <span>雪落山庄</span>
                  <span className="opacity-40">·</span>
                  <span>听风听雪，翻书烹茶</span>
                </div>
                <p className="tracking-wide">
                  简洁连载 · 留声小憩 · 基于 Next.js 与 ImageKit
                </p>
              </footer>
            </div>
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
