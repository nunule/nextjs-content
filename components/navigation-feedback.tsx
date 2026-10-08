"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { NAVIGATION_FEEDBACK_DELAY_MS, NAVIGATION_FEEDBACK_TIMEOUT_MS } from "@/components/navigation.constants"

const NavigationFeedbackContext = createContext<(() => void) | null>(null)

export function NavigationFeedbackProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const delay = useRef<ReturnType<typeof setTimeout>>()
  const timeout = useRef<ReturnType<typeof setTimeout>>()

  const clear = useCallback(() => {
    clearTimeout(delay.current)
    clearTimeout(timeout.current)
    setVisible(false)
  }, [])

  useEffect(() => {
    clear()
    return () => {
      clearTimeout(delay.current)
      clearTimeout(timeout.current)
    }
  }, [pathname, clear])

  const begin = useCallback(() => {
    clear()
    delay.current = setTimeout(() => setVisible(true), NAVIGATION_FEEDBACK_DELAY_MS)
    timeout.current = setTimeout(clear, NAVIGATION_FEEDBACK_TIMEOUT_MS)
  }, [clear])

  return (
    <NavigationFeedbackContext.Provider value={begin}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5" aria-hidden={!visible}>
        {visible && <><span className="navigation-progress block h-full w-full bg-slate-600 dark:bg-slate-300" /><span className="sr-only">正在打开页面…</span></>}
      </div>
    </NavigationFeedbackContext.Provider>
  )
}

export function useNavigationFeedback() {
  return useContext(NavigationFeedbackContext)
}
