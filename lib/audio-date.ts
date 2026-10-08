function parseAudioDate(value: string) {
  // Older folders used a three-digit month, for example 202601006 (2026-10-06).
  const match = /^(\d{4})(\d{2,3})(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return { year, month, day }
}

export function compareAudioDates(a: string, b: string) {
  const first = parseAudioDate(a)
  const second = parseAudioDate(b)
  const key = (date: typeof first) => date ? date.year * 10000 + date.month * 100 + date.day : 0
  return key(second) - key(first) || b.localeCompare(a, "en", { numeric: true })
}

export function formatAudioDate(value: string) {
  const date = parseAudioDate(value)
  return date ? `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")}` : value
}
