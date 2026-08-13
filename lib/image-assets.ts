import fs from "node:fs/promises"
import path from "node:path"

export const imageRoot = path.join(process.cwd(), "public", "images")

export const imageContentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
}

const supportedExtensions = new Set(Object.keys(imageContentTypes))

export interface ImageAsset {
  year: string
  month: string
  dateName: string
  fileName: string
  filePath: string
  pagePath: string
  src: string
}

export interface ImageRouteParams {
  year: string
  month: string
  imageName: string
}

export function decodeRouteParam(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function isValidDateName(value: string, year: string, month: string) {
  if (!/^\d{8}$/.test(value) || !value.startsWith(`${year}${month}`)) {
    return false
  }

  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(value.slice(6, 8)))
  )

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(value.slice(6, 8))
  )
}

function parseImageName(value: string, year: string, month: string, requireExtension = false) {
  if (path.basename(value) !== value) {
    return null
  }

  const extension = path.extname(value).toLowerCase()
  const dateName = extension ? path.basename(value, extension) : value

  if (
    (requireExtension && !extension) ||
    (extension && !supportedExtensions.has(extension)) ||
    !isValidDateName(dateName, year, month)
  ) {
    return null
  }

  return { dateName, extension }
}

export async function listImageAssets(): Promise<ImageAsset[]> {
  let yearEntries

  try {
    yearEntries = await fs.readdir(imageRoot, { withFileTypes: true })
  } catch {
    return []
  }

  const images: ImageAsset[] = []

  for (const yearEntry of yearEntries) {
    if (!yearEntry.isDirectory() || !/^\d{4}$/.test(yearEntry.name)) {
      continue
    }

    const year = yearEntry.name
    const yearPath = path.join(imageRoot, year)
    const monthEntries = await fs.readdir(yearPath, { withFileTypes: true })

    for (const monthEntry of monthEntries) {
      if (!monthEntry.isDirectory() || !/^(0[1-9]|1[0-2])$/.test(monthEntry.name)) {
        continue
      }

      const month = monthEntry.name
      const monthPath = path.join(yearPath, month)
      const imageEntries = await fs.readdir(monthPath, { withFileTypes: true })

      for (const imageEntry of imageEntries) {
        if (!imageEntry.isFile()) {
          continue
        }

        const extension = path.extname(imageEntry.name).toLowerCase()
        const dateName = path.basename(imageEntry.name, extension)

        if (!supportedExtensions.has(extension) || !isValidDateName(dateName, year, month)) {
          continue
        }

        images.push({
          year,
          month,
          dateName,
          fileName: imageEntry.name,
          filePath: path.join(monthPath, imageEntry.name),
          pagePath: `/image/${year}/${month}/${encodeURIComponent(imageEntry.name)}`,
          src: `/api/image-assets/${year}/${month}/${encodeURIComponent(imageEntry.name)}`,
        })
      }
    }
  }

  return images.sort((a, b) =>
    `${b.year}${b.month}${b.dateName}${b.fileName}`.localeCompare(
      `${a.year}${a.month}${a.dateName}${a.fileName}`
    )
  )
}

export async function findImageAsset(params: ImageRouteParams) {
  const year = decodeRouteParam(params.year)
  const month = decodeRouteParam(params.month)
  const imageName = decodeRouteParam(params.imageName)

  if (!/^\d{4}$/.test(year) || !/^(0[1-9]|1[0-2])$/.test(month)) {
    return null
  }

  const requested = parseImageName(imageName, year, month)

  if (!requested) {
    return null
  }

  const images = await listImageAssets()

  return (
    images.find(
      (image) =>
        image.year === year &&
        image.month === month &&
        image.dateName === requested.dateName &&
        (!requested.extension || path.extname(image.fileName).toLowerCase() === requested.extension)
    ) ?? null
  )
}

export async function findImageFile(params: ImageRouteParams) {
  const imageName = decodeRouteParam(params.imageName)

  if (!path.extname(imageName)) {
    return null
  }

  return findImageAsset(params)
}
