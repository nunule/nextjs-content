"use client"

import type { CSSProperties, ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { useReadingPreferences } from "@/components/reading-preferences-provider"
import { READING_BACKGROUNDS, READING_FONT_SIZE, READING_LINE_HEIGHT } from "@/components/reading.constants"

interface ReadingContentProps {
  children: ReactNode
}

export function ReadingContent({ children }: ReadingContentProps) {
  const { preferences, setPreferences } = useReadingPreferences()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!settingsOpen || !dialog) return
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [settingsOpen])

  const contentStyle = {
    "--novel-font-size": `${preferences.fontSize}px`,
    "--novel-line-height": preferences.lineHeight,
  } as CSSProperties

  return (
    <>
      <div
        className="novel-content prose max-w-none rounded-xl px-4 py-2 sm:px-6 dark:prose-invert"
        style={contentStyle}
      >
        {children}
      </div>

      <button
        type="button"
        className="reading-settings-button fixed right-4 z-40 min-h-[44px] rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900"
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
        onClick={() => setSettingsOpen(true)}
      >
        阅读设置
      </button>
      <dialog
        ref={dialogRef}
        className="site-surface reading-settings-dialog m-0 mt-auto w-full max-w-none rounded-t-2xl bg-white text-slate-900 shadow-2xl sm:m-auto sm:max-w-lg sm:rounded-2xl dark:bg-slate-900 dark:text-slate-100"
        aria-label="阅读设置"
        onCancel={() => setSettingsOpen(false)}
        onClose={() => setSettingsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSettingsOpen(false)
        }}
      >
        <section
          className="reading-settings-panel p-5 sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">阅读设置</h2>
            <button
              type="button"
              className="min-h-[44px] rounded-lg px-3 text-sm text-slate-600 dark:text-slate-300"
              onClick={() => setSettingsOpen(false)}
            >
              完成
            </button>
          </div>

          <div className="space-y-5 text-sm">
            <fieldset>
              <legend className="mb-2 font-medium">全站背景颜色</legend>
              <p className="mb-3 text-xs leading-6 text-slate-500 dark:text-slate-400">同时应用于小说、声音、首页和关于页面。</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {READING_BACKGROUNDS.map((option) => (
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
                min={READING_FONT_SIZE.MIN}
                max={READING_FONT_SIZE.MAX}
                step={READING_FONT_SIZE.STEP}
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
                min={READING_LINE_HEIGHT.MIN}
                max={READING_LINE_HEIGHT.MAX}
                step={READING_LINE_HEIGHT.STEP}
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
      </dialog>
    </>
  )
}
