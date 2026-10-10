import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@/components/analytics"
import { ModeToggle } from "@/components/mode-toggle"
import { SiteNav } from "@/components/site-nav"
import { LocaleProvider } from "@/components/locale-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { SiteBrand, SiteFooter } from "@/components/site-brand"
import { getLocale, getTranslations } from "@/lib/i18n/server"

export const dynamic = "force-dynamic"

export function generateMetadata() {
  const t = getTranslations()
  return {
    title: { default: t("site.name"), template: `%s · ${t("site.name")}` },
    description: t("site.description"),
    icons: { icon: "/icon.svg" },
  }
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const locale = getLocale()
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-[#fafafc] text-slate-900 antialiased selection:bg-slate-900 selection:text-white dark:bg-[#0c0f17] dark:text-slate-100">
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="relative min-h-screen flex flex-col justify-between">
              {/* 极简氛围衬底：极轻量CSS无任何外部图片依赖 */}
              <div className="site-ambient pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(148,163,184,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(255,255,255,0.04),rgba(0,0,0,0))]" />

              <div className="site-shell relative z-10 max-w-2xl mx-auto w-full py-8 sm:py-12 px-4 sm:px-6">
                <header className="mb-10 sm:mb-12">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 md:flex-nowrap">
                    {/* 透明底雪山标志，随页面主题切换黑白。 */}
                    <SiteBrand />

                    {/* 顶栏导航 */}
                    <div className="order-last w-full md:order-none md:ml-auto md:w-auto">
                      <SiteNav />
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <LanguageToggle />
                      <ModeToggle />
                    </div>
                  </div>
                </header>

                <main>{children}</main>

                {/* 极简山庄页脚 */}
                <SiteFooter />
              </div>
            </div>
            <Analytics />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
