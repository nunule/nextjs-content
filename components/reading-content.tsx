"use client"

import type { CSSProperties, ReactNode } from "react"
import { useEffect, useState } from "react"

type BackgroundKey = "white" | "green" | "yellow"

interface ReadingPreferences {
  background: BackgroundKey
  fontSize: number
  lineHeight: number
}

interface ReadingContentProps {
  children: ReactNode
}

const defaultPreferences: ReadingPreferences = {
  background: "white",
  fontSize: 18,
  lineHeight: 1.8,
}

const backgroundOptions: Array<{
  key: BackgroundKey
  label: string
  color: string
}> = [
  { key: "white", label: "白色", color: "#ffffff" },
  { key: "green", label: "护眼绿", color: "#e8f3e8" },
  { key: "yellow", label: "护眼黄", color: "#fff7d6" },
]

const storageKey = "novel-reading-preferences"

function isBackgroundKey(value: unknown): value is BackgroundKey {
  return value === "white" || value === "green" || value === "yellow"
}

export function ReadingContent({ children }: ReadingContentProps) {
  const [preferences, setPreferences] =
    useState<ReadingPreferences>(defaultPreferences)
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false)
  const [showSettingsButton, setShowSettingsButton] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)

      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ReadingPreferences>

        setPreferences({
          background: isBackgroundKey(parsed.background)
            ? parsed.background
            : defaultPreferences.background,
          fontSize:
            typeof parsed.fontSize === "number" &&
            parsed.fontSize >= 14 &&
            parsed.fontSize <= 24
              ? parsed.fontSize
              : defaultPreferences.fontSize,
          lineHeight:
            typeof parsed.lineHeight === "number" &&
            parsed.lineHeight >= 1.4 &&
            parsed.lineHeight <= 2.4
              ? parsed.lineHeight
              : defaultPreferences.lineHeight,
        })
      }
    } catch {
      // Ignore invalid or unavailable local storage values.
    } finally {
      setHasLoadedPreferences(true)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedPreferences) {
      return
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences))
    } catch {
      // Reading preferences still works when local storage is unavailable.
    }
  }, [hasLoadedPreferences, preferences])

  const selectedBackground = backgroundOptions.find(
    (option) => option.key === preferences.background
  )

  useEffect(() => {
    if (!hasLoadedPreferences || !selectedBackground) {
      return
    }

    const html = document.documentElement
    const body = document.body
    const previousHtmlBackground = html.style.backgroundColor
    const previousBodyBackground = body.style.backgroundColor

    html.style.backgroundColor = selectedBackground.color
    body.style.backgroundColor = selectedBackground.color

    return () => {
      html.style.backgroundColor = previousHtmlBackground
      body.style.backgroundColor = previousBodyBackground
    }
  }, [hasLoadedPreferences, selectedBackground])

  const contentStyle = {
    "--novel-font-size": `${preferences.fontSize}px`,
    "--novel-line-height": preferences.lineHeight,
  } as CSSProperties

  return (
    <>
      <div
        className="novel-content prose rounded-lg px-4 py-2 dark:prose-invert"
        style={contentStyle}
        onClick={() => setShowSettingsButton(true)}
      >
        {children}
      </div>

      {showSettingsButton && (
        <button
          type="button"
          className="fixed bottom-5 right-4 z-40 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg md:hidden dark:bg-white dark:text-slate-900"
          onClick={(event) => {
            event.stopPropagation()
            setSettingsOpen(true)
          }}
        >
          阅读设置
        </button>
      )}

      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="阅读设置"
          onClick={() => setSettingsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <section
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">阅读设置</h2>
              <button
                type="button"
                className="text-sm text-slate-500 dark:text-slate-300"
                onClick={() => setSettingsOpen(false)}
              >
                完成
              </button>
            </div>

            <div className="space-y-5 text-sm">
              <fieldset>
                <legend className="mb-2 font-medium">背景颜色</legend>
                <div className="grid grid-cols-3 gap-2">
                  {backgroundOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={preferences.background === option.key}
                      className={`rounded-lg border px-3 py-2 ${
                        preferences.background === option.key
                          ? "border-slate-900 ring-1 ring-slate-900 dark:border-white dark:ring-white"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                      onClick={() =>
                        setPreferences((current) => ({
                          ...current,
                          background: option.key,
                        }))
                      }
                    >
                      <span
                        className="mr-2 inline-block h-3 w-3 rounded-full border border-slate-300 align-[-1px]"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="mb-2 flex items-center justify-between font-medium">
                  <span>字体大小</span>
                  <span className="text-slate-500 dark:text-slate-300">
                    {preferences.fontSize}px
                  </span>
                </span>
                <input
                  className="w-full accent-slate-900 dark:accent-white"
                  type="range"
                  min="14"
                  max="24"
                  step="1"
                  value={preferences.fontSize}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      fontSize: Number(event.target.value),
                    }))
                  }
                  aria-label="字体大小"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between font-medium">
                  <span>行距</span>
                  <span className="text-slate-500 dark:text-slate-300">
                    {preferences.lineHeight.toFixed(1)} 倍
                  </span>
                </span>
                <input
                  className="w-full accent-slate-900 dark:accent-white"
                  type="range"
                  min="1.4"
                  max="2.4"
                  step="0.1"
                  value={preferences.lineHeight}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      lineHeight: Number(event.target.value),
                    }))
                  }
                  aria-label="行距"
                />
              </label>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
