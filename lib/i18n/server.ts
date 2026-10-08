import { cookies } from "next/headers"
import { LOCALE_COOKIE, resolveLocale } from "./constants"
import { createTranslator } from "./messages"

export function getLocale() {
  return resolveLocale(cookies().get(LOCALE_COOKIE)?.value)
}

export function getTranslations() {
  return createTranslator(getLocale())
}
