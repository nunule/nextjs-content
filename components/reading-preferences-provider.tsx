"use client"

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { DEFAULT_READING_PREFERENCES, READING_BACKGROUNDS, READING_FONT_SIZE, READING_LINE_HEIGHT, READING_STORAGE_KEY, type ReadingPreferences } from "@/components/reading.constants"

const ReadingPreferencesContext = createContext<{
  preferences: ReadingPreferences
  setPreferences: Dispatch<SetStateAction<ReadingPreferences>>
} | null>(null)

export function ReadingPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(DEFAULT_READING_PREFERENCES)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(READING_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ReadingPreferences> | null
        if (parsed) {
          setPreferences({
            background: READING_BACKGROUNDS.some((option) => option.key === parsed.background)
              ? parsed.background! : DEFAULT_READING_PREFERENCES.background,
            fontSize: typeof parsed.fontSize === "number" && parsed.fontSize >= READING_FONT_SIZE.MIN && parsed.fontSize <= READING_FONT_SIZE.MAX
              ? parsed.fontSize : DEFAULT_READING_PREFERENCES.fontSize,
            lineHeight: typeof parsed.lineHeight === "number" && parsed.lineHeight >= READING_LINE_HEIGHT.MIN && parsed.lineHeight <= READING_LINE_HEIGHT.MAX
              ? parsed.lineHeight : DEFAULT_READING_PREFERENCES.lineHeight,
          })
        }
      }
    } catch {
      // Preferences remain usable when storage is unavailable or invalid.
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (preferences.background === "theme") {
      delete document.documentElement.dataset.siteBackground
    } else {
      document.documentElement.dataset.siteBackground = preferences.background
    }
    try {
      window.localStorage.setItem(READING_STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Applying the appearance does not depend on persistent storage.
    }
  }, [loaded, preferences])

  return (
    <ReadingPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </ReadingPreferencesContext.Provider>
  )
}

export function useReadingPreferences() {
  const context = useContext(ReadingPreferencesContext)
  if (!context) throw new Error("Reading preferences provider is missing")
  return context
}
