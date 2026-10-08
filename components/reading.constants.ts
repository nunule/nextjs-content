export const READING_STORAGE_KEY = "novel-reading-preferences"
export const READING_FONT_SIZE = { MIN: 14, MAX: 24, DEFAULT: 18, STEP: 1 } as const
export const READING_LINE_HEIGHT = { MIN: 1.4, MAX: 2.4, DEFAULT: 1.8, STEP: 0.1 } as const

export type ReadingBackground = "theme" | "white" | "green" | "yellow"

export interface ReadingPreferences {
  background: ReadingBackground
  fontSize: number
  lineHeight: number
}

export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  background: "theme",
  fontSize: READING_FONT_SIZE.DEFAULT,
  lineHeight: READING_LINE_HEIGHT.DEFAULT,
}

export const READING_BACKGROUNDS: Array<{ key: ReadingBackground; label: string; color: string }> = [
  { key: "theme", label: "跟随主题", color: "#64748b" },
  { key: "white", label: "白色", color: "#ffffff" },
  { key: "green", label: "护眼绿", color: "#e8f3e8" },
  { key: "yellow", label: "护眼黄", color: "#fff7d6" },
]
