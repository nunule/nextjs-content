import { NavigationLink } from "@/components/navigation-link"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@/components/analytics"
import { ModeToggle } from "@/components/mode-toggle"
import { SiteLogo } from "@/components/site-logo"
import { SiteNav } from "@/components/site-nav"

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
            <div className="site-ambient pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(148,163,184,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(255,255,255,0.04),rgba(0,0,0,0))]" />

            <div className="relative z-10 max-w-2xl mx-auto w-full py-8 sm:py-12 px-4 sm:px-6">
              <header className="mb-10 sm:mb-12">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:flex-nowrap">
                  {/* 透明底雪山标志，随页面主题切换黑白。 */}
                  <NavigationLink
                    href="/"
                    className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-95"
                    aria-label="雪落山庄首页"
                  >
                    <SiteLogo />
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-semibold leading-5 tracking-[0.12em] text-neutral-950 dark:text-neutral-100">
                        雪落山庄
                      </span>
                      <span className="text-[9px] font-medium leading-3 tracking-[0.16em] uppercase text-slate-500 dark:text-slate-400">
                        Snowfall Villa
                      </span>
                    </div>
                  </NavigationLink>

                  {/* 顶栏导航 */}
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:gap-4">
                    <SiteNav />
                    <div aria-hidden="true" className="hidden h-4 w-px bg-slate-200 sm:block dark:bg-slate-800" />
                    <ModeToggle />
                  </div>
                </div>
              </header>

              <main>{children}</main>

              {/* 极简山庄页脚 */}
              <footer className="mt-16 border-t border-slate-200/70 pt-8 pb-16 text-center text-xs leading-6 text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
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
