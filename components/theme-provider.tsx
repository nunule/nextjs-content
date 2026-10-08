"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { ReadingPreferencesProvider, useReadingPreferences } from "@/components/reading-preferences-provider"
import { NavigationFeedbackProvider } from "@/components/navigation-feedback"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <ReadingPreferencesProvider>
      <AppThemeProvider {...props}>{children}</AppThemeProvider>
    </ReadingPreferencesProvider>
  )
}

function AppThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { preferences } = useReadingPreferences()
  return (
    <NextThemesProvider {...props} forcedTheme={preferences.background === "theme" ? undefined : "light"}>
      <NavigationFeedbackProvider>{children}</NavigationFeedbackProvider>
    </NextThemesProvider>
  )
}
