"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/lib/i18n/constants"
import { createTranslator, type MessageKey, type MessageValues } from "@/lib/i18n/messages"

const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: (_locale: Locale) => {},
  t: createTranslator(DEFAULT_LOCALE),
})

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setCurrentLocale] = useState(initialLocale)
  const router = useRouter()
  const [, startTransition] = useTransition()
  const t = useMemo(() => createTranslator(locale), [locale])

  useEffect(() => { document.documentElement.lang = locale }, [locale])

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`
    setCurrentLocale(next)
    document.documentElement.lang = next
    // Refresh server metadata and cached routes without remounting reader or player state.
    startTransition(() => router.refresh())
  }, [router])

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function Text({ id, values }: { id: MessageKey; values?: MessageValues }) {
  const { t } = useLocale()
  return <>{t(id, values)}</>
}
