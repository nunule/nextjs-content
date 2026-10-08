import path from "node:path"
import {
  getImageKitConfig,
  getImageKitAssetUrl,
  listImageKitFiles,
  normalizeImageKitPath,
  signImageKitUrl,
} from "@/lib/imagekit"
import type { ImageKitAsset, ImageKitConfig } from "@/lib/imagekit"
import { CATALOG_REQUEST_TIMEOUT_MS, NOVEL_DOWNLOAD_CONCURRENCY, NOVEL_STALE_CACHE_MS } from "@/lib/catalog.constants"

const defaultNovelPath = "/novels/"
const supportedNovelExtensions = [".txt", ".md", ".mdx"] as const

interface NovelSourceConfig extends ImageKitConfig {
  novelPath: string
}

interface Frontmatter {
  chapterNumber?: string
  description?: string
  slug?: string
  status?: string
  title?: string
}

export interface RemoteChapter {
  chapterNumber: number
  content: string
  downloadPath: string
  path: string
  slug: string
  title: string
}

export interface RemoteNovel {
  description?: string
  chapters: RemoteChapter[]
  slug: string
  sourceFileName: string
  status: "连载中" | "已完结"
  summary: string
  title: string
}

export interface NovelCatalogResult {
  configured: boolean
  error?: string
  warning?: string
  novels: RemoteNovel[]
}

interface TextCacheEntry {
  expiresAt: number
  text: string
}

interface CatalogCacheEntry {
  key: string
  expiresAt: number
  novels: RemoteNovel[]
}

interface ReadableAsset {
  asset: ImageKitAsset
  text: string
}

interface ParsedChapter {
  chapterNumber: number
  content: string
  title: string
}

const textCache = new Map<string, TextCacheEntry>()
let catalogCache: CatalogCacheEntry | null = null
let catalogRequest: { key: string; promise: Promise<NovelCatalogResult> } | null = null

function getConfig(): NovelSourceConfig | null {
  const config = getImageKitConfig()
  if (!config) return null
  return {
    ...config,
    novelPath: normalizeImageKitPath(process.env.IMAGEKIT_NOVEL_PATH || defaultNovelPath),
  }
}

export function isNovelSourceConfigured() {
  return getConfig() !== null
}

async function listImageKitAssets(config: NovelSourceConfig) {
  return listImageKitFiles(config, config.novelPath)
}

function getAssetFileName(asset: ImageKitAsset) {
  const name = path.posix.basename(
    asset.name || (asset.filePath ? path.posix.basename(asset.filePath) : ""),
  )

  return supportedNovelExtensions.some((extension) => name.toLowerCase().endsWith(extension))
    ? name
    : null
}

function stripNovelExtension(value: string) {
  const extension = supportedNovelExtensions.find((item) => value.toLowerCase().endsWith(item))

  return extension ? value.slice(0, -extension.length) : value
}

function getAssetKey(asset: ImageKitAsset) {
  return asset.fileId || asset.filePath || asset.url || asset.name || "unknown"
}

function getAssetUrl(asset: ImageKitAsset, config: NovelSourceConfig) {
  return getImageKitAssetUrl(asset, config)
}

function getSignedAssetUrl(assetUrl: string, config: NovelSourceConfig) {
  return signImageKitUrl(assetUrl, config)
}

function decodeText(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.slice(2))
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.slice(2))
  }

  return new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "")
}

async function downloadAssetText(asset: ImageKitAsset, config: NovelSourceConfig) {
  const cacheKey = getAssetKey(asset)
  const cached = textCache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.text
  }

  const response = await fetch(getSignedAssetUrl(getAssetUrl(asset, config), config), {
    cache: "no-store",
    signal: AbortSignal.timeout(CATALOG_REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`ImageKit 小说文件读取失败（${response.status}）`)
  }

  const text = decodeText(await response.arrayBuffer())

  if (config.cacheSeconds > 0) {
    textCache.set(cacheKey, {
      expiresAt: Date.now() + config.cacheSeconds * 1000,
      text,
    })
  }

  return text
}

function unquote(value: string) {
  const trimmed = value.trim()

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

function parseFrontmatter(text: string) {
  const lines = text.replace(/\r/g, "").split("\n")

  if (lines[0]?.trim() !== "---") {
    return { body: text, frontmatter: {} as Frontmatter }
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---")

  if (closingIndex === -1) {
    return { body: text, frontmatter: {} as Frontmatter }
  }

  const frontmatter: Frontmatter = {}

  for (const line of lines.slice(1, closingIndex)) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)

    if (!match) {
      continue
    }

    const [, key, rawValue] = match
    const value = unquote(rawValue)

    if (
      key === "title" ||
      key === "description" ||
      key === "status" ||
      key === "slug" ||
      key === "chapterNumber"
    ) {
      frontmatter[key] = value
    }
  }

  return {
    body: lines.slice(closingIndex + 1).join("\n").trim(),
    frontmatter,
  }
}

function normalizeDigits(value: string) {
  return value.replace(/[０-９]/g, (digit) => String(digit.charCodeAt(0) - "０".charCodeAt(0)))
}

function chineseNumberToArabic(value: string) {
  const digits: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    零: 0,
    〇: 0,
    两: 2,
  }
  const units: Record<string, number> = {
    十: 10,
    百: 100,
    千: 1000,
    万: 10000,
  }

  if (/^\d+$/.test(value)) {
    return Number(value)
  }

  let total = 0
  let section = 0
  let number = 0

  for (const character of value) {
    if (units[character]) {
      const unit = units[character]

      if (unit === 10000) {
        section += number
        total += (section || 1) * unit
        section = 0
      } else {
        section += (number || 1) * unit
      }

      number = 0
    } else if (digits[character] !== undefined) {
      number = digits[character]
    }
  }

  return total + section + number
}

function parseChapterHeading(line: string) {
  const normalizedLine = line.trim().replace(/^#{1,6}\s+/, "")
  const chineseMatch = normalizedLine.match(
    /^第\s*([0-9０-９零〇一二三四五六七八九十百千万两]+)\s*章(?:\s*[:：、.．\-—]\s*|\s+)?(.*?)\s*$/,
  )

  if (chineseMatch) {
    const chapterNumber = chineseNumberToArabic(normalizeDigits(chineseMatch[1]))

    return {
      chapterNumber,
      title: chineseMatch[2] || `第${chapterNumber}章`,
    }
  }

  const englishMatch = normalizedLine.match(
    /^Chapter\s+([0-9０-９]+)(?:\s*[:：.．\-—]\s*|\s+)?(.*?)\s*$/i,
  )

  if (englishMatch) {
    const chapterNumber = Number(normalizeDigits(englishMatch[1]))

    return {
      chapterNumber,
      title: englishMatch[2] || `Chapter ${chapterNumber}`,
    }
  }

  return null
}

function toSafePathSegment(value: string) {
  return value
    .trim()
    .replace(/[\\/?#%]+/g, "-")
    .replace(/\s+/g, "-")
}

function createChapterSlug(chapterNumber: number, title: string) {
  const number = String(chapterNumber).padStart(3, "0")
  const safeTitle = toSafePathSegment(title.replace(/^第\d+章[：:]?\s*/, ""))

  return safeTitle ? `${number}_${safeTitle}` : number
}

function createNovelSlug(value: string) {
  return toSafePathSegment(stripNovelExtension(value))
}

function createChapterPath(novelSlug: string, chapterSlug: string) {
  return `/novels/${encodeURIComponent(novelSlug)}/chapters/${encodeURIComponent(chapterSlug)}`
}

function createRemoteChapter(novelSlug: string, chapter: ParsedChapter): RemoteChapter {
  const chapterSlug = createChapterSlug(chapter.chapterNumber, chapter.title)
  const chapterPath = createChapterPath(novelSlug, chapterSlug)

  return {
    chapterNumber: chapter.chapterNumber,
    content: chapter.content,
    downloadPath: `/api${chapterPath}/download`,
    path: chapterPath,
    slug: chapterSlug,
    title: chapter.title,
  }
}

function parseChapterNumber(value?: string) {
  if (!value) {
    return null
  }

  const normalized = normalizeDigits(value.trim())

  if (!/^[0-9零〇一二三四五六七八九十百千万两]+$/.test(normalized)) {
    return null
  }

  const chapterNumber = chineseNumberToArabic(normalized)

  return Number.isFinite(chapterNumber) && chapterNumber > 0 ? chapterNumber : null
}

function parseChapterFileName(fileName: string) {
  const baseName = stripNovelExtension(fileName)
  const heading = parseChapterHeading(baseName)

  if (heading) {
    return heading
  }

  const match = baseName.match(/^([0-9０-９]+)[_\-—.．、\s]+(.+)$/)

  if (!match) {
    return null
  }

  const chapterNumber = Number(normalizeDigits(match[1]))

  return Number.isFinite(chapterNumber) && chapterNumber > 0
    ? {
        chapterNumber,
        title: match[2].trim() || `第${chapterNumber}章`,
      }
    : null
}

function parseStandaloneChapter(text: string, asset: ImageKitAsset): ParsedChapter {
  const fileName = getAssetFileName(asset) || "chapter.txt"
  const { body, frontmatter } = parseFrontmatter(text)
  const lines = body.replace(/\r/g, "").split("\n")
  const firstContentLineIndex = lines.findIndex((line) => line.trim())
  const firstHeading =
    firstContentLineIndex >= 0 ? parseChapterHeading(lines[firstContentLineIndex]) : null
  const fileNameHeading = parseChapterFileName(fileName)
  const chapterNumber =
    parseChapterNumber(frontmatter.chapterNumber) ??
    firstHeading?.chapterNumber ??
    fileNameHeading?.chapterNumber ??
    1
  const title = frontmatter.title || firstHeading?.title || fileNameHeading?.title || `第${chapterNumber}章`
  const contentLines =
    firstContentLineIndex >= 0 && firstHeading
      ? lines.filter((_, index) => index !== firstContentLineIndex)
      : lines

  return {
    chapterNumber,
    content: contentLines.join("\n").trim(),
    title,
  }
}

function getAssetPathSegments(asset: ImageKitAsset, config: NovelSourceConfig) {
  const rawPath = (asset.filePath || asset.name || "").replace(/\\/g, "/")
  const normalizedPath = rawPath.replace(/^\/+/, "")
  const novelPath = config.novelPath.replace(/^\/+|\/+$/g, "")

  if (!novelPath) {
    return normalizedPath.split("/").filter(Boolean)
  }

  const prefix = `${novelPath}/`

  if (normalizedPath.startsWith(prefix)) {
    return normalizedPath.slice(prefix.length).split("/").filter(Boolean)
  }

  return normalizedPath.split("/").filter(Boolean)
}

function getChapterOwnerSlug(asset: ImageKitAsset, config: NovelSourceConfig) {
  const pathSegments = getAssetPathSegments(asset, config)

  if (pathSegments.length < 3 || pathSegments[1].toLowerCase() !== "chapters") {
    return null
  }

  return createNovelSlug(pathSegments[0])
}

function isNovelDocumentAsset(asset: ImageKitAsset, config: NovelSourceConfig) {
  const pathSegments = getAssetPathSegments(asset, config)

  return pathSegments.length === 1 || pathSegments[1]?.toLowerCase() !== "chapters"
}

function createFallbackNovel(novelSlug: string, folderName: string): RemoteNovel {
  return {
    chapters: [],
    slug: novelSlug,
    sourceFileName: folderName,
    status: "连载中",
    summary: "",
    title: folderName,
  }
}

function addChapterToNovel(novel: RemoteNovel, chapter: ParsedChapter) {
  const remoteChapter = createRemoteChapter(novel.slug, chapter)
  const existingIndex = novel.chapters.findIndex(
    (item) => item.chapterNumber === remoteChapter.chapterNumber,
  )

  if (existingIndex >= 0) {
    novel.chapters[existingIndex] = remoteChapter
  } else {
    novel.chapters.push(remoteChapter)
  }

  novel.chapters.sort((left, right) => left.chapterNumber - right.chapterNumber)
}

function parseNovel(
  text: string,
  asset: ImageKitAsset,
  options: { fallbackBodyAsChapter?: boolean } = {},
): RemoteNovel {
  const fileName = getAssetFileName(asset) || "novel.txt"
  const { body, frontmatter } = parseFrontmatter(text)
  const fallbackBodyAsChapter = options.fallbackBodyAsChapter ?? true
  const slug = createNovelSlug(frontmatter.slug || fileName)
  const lines = body.replace(/\r/g, "").split("\n")
  const summaryLines: string[] = []
  const chapters: Array<{ chapterNumber: number; content: string; title: string }> = []
  let currentChapter: { chapterNumber: number; contentLines: string[]; title: string } | null = null

  for (const line of lines) {
    const heading = parseChapterHeading(line)

    if (heading && Number.isFinite(heading.chapterNumber) && heading.chapterNumber > 0) {
      if (currentChapter) {
        chapters.push({
          chapterNumber: currentChapter.chapterNumber,
          content: currentChapter.contentLines.join("\n").trim(),
          title: currentChapter.title,
        })
      }

      currentChapter = {
        chapterNumber: heading.chapterNumber,
        contentLines: [],
        title: heading.title,
      }
    } else if (currentChapter) {
      currentChapter.contentLines.push(line)
    } else {
      summaryLines.push(line)
    }
  }

  if (currentChapter) {
    chapters.push({
      chapterNumber: currentChapter.chapterNumber,
      content: currentChapter.contentLines.join("\n").trim(),
      title: currentChapter.title,
    })
  }

  if (chapters.length === 0 && body.trim() && fallbackBodyAsChapter) {
    chapters.push({
      chapterNumber: 1,
      content: body.trim(),
      title: "正文",
    })
    summaryLines.length = 0
  }

  chapters.sort((left, right) => left.chapterNumber - right.chapterNumber)

  const remoteChapters = chapters.map((chapter) => createRemoteChapter(slug, chapter))

  return {
    description: frontmatter.description,
    chapters: remoteChapters,
    slug,
    sourceFileName: fileName,
    status: frontmatter.status === "已完结" ? "已完结" : "连载中",
    summary: summaryLines.join("\n").trim(),
    title: frontmatter.title || stripNovelExtension(fileName),
  }
}

async function readNovelAssets(assets: ImageKitAsset[], config: NovelSourceConfig) {
  const results: Array<ReadableAsset | undefined> = new Array(assets.length)
  let cursor = 0
  let failedCount = 0
  await Promise.all(Array.from({ length: Math.min(NOVEL_DOWNLOAD_CONCURRENCY, assets.length) }, async () => {
    while (cursor < assets.length) {
      const index = cursor++
      const asset = assets[index]
      try {
        results[index] = { asset, text: await downloadAssetText(asset, config) }
      } catch {
        failedCount += 1
        console.error("ImageKit 小说文件暂时无法读取", asset.filePath || asset.name)
      }
    }
  }))
  return { readableAssets: results.filter((asset): asset is ReadableAsset => Boolean(asset)), failedCount }
}

function getPreviousCatalog(config: NovelSourceConfig) {
  return catalogCache?.key === `${config.urlEndpoint}:${config.novelPath}` &&
    catalogCache.expiresAt + NOVEL_STALE_CACHE_MS > Date.now()
      ? catalogCache.novels : null
}

export async function getNovelCatalog(): Promise<NovelCatalogResult> {
  const config = getConfig()
  if (!config) return { configured: false, novels: [] }
  const key = `${config.urlEndpoint}:${config.novelPath}`
  if (catalogCache?.key === key && catalogCache.expiresAt > Date.now()) {
    return { configured: true, novels: catalogCache.novels }
  }
  if (catalogRequest?.key === key) return catalogRequest.promise
  const request = { key, promise: loadNovelCatalog(config) }
  catalogRequest = request
  try {
    return await request.promise
  } finally {
    if (catalogRequest === request) catalogRequest = null
  }
}

async function loadNovelCatalog(config: NovelSourceConfig): Promise<NovelCatalogResult> {
  try {
    const assets = await listImageKitAssets(config)
    const novelAssets = assets.filter((asset) => asset.type !== "folder" && getAssetFileName(asset))
    const { readableAssets, failedCount } = await readNovelAssets(novelAssets, config)
    const previous = getPreviousCatalog(config)
    if (failedCount > 0 && previous) {
      return { configured: true, novels: previous, warning: "部分章节更新未能加载，正在显示上次成功读取的完整目录与正文。请稍后重新加载。" }
    }
    if (failedCount > 0 && readableAssets.length === 0) {
      return { configured: true, novels: [], error: "作品暂时无法读取，请稍后重新加载。" }
    }

    const novelsBySlug = new Map<string, RemoteNovel>()
    const novelSlugAliases = new Map<string, string>()
    const chapterOwnerSlugs = new Set(
      novelAssets
        .map((asset) => getChapterOwnerSlug(asset, config))
        .filter((slug): slug is string => Boolean(slug)),
    )

    for (const readableAsset of readableAssets) {
      if (!isNovelDocumentAsset(readableAsset.asset, config)) {
        continue
      }

      const pathSegments = getAssetPathSegments(readableAsset.asset, config)
      const folderSlug = pathSegments[0] ? createNovelSlug(pathSegments[0]) : null
      const novel = parseNovel(readableAsset.text, readableAsset.asset, {
        fallbackBodyAsChapter: !folderSlug || !chapterOwnerSlugs.has(folderSlug),
      })
      const existingNovel = novelsBySlug.get(novel.slug)

      if (existingNovel) {
        existingNovel.chapters.push(...novel.chapters)
        existingNovel.chapters.sort((left, right) => left.chapterNumber - right.chapterNumber)
      } else {
        novelsBySlug.set(novel.slug, novel)
      }

      if (pathSegments[0]) {
        novelSlugAliases.set(createNovelSlug(pathSegments[0]), novel.slug)
      }
    }

    for (const readableAsset of readableAssets) {
      const ownerSlug = getChapterOwnerSlug(readableAsset.asset, config)

      if (!ownerSlug) {
        continue
      }

      const mappedSlug = novelSlugAliases.get(ownerSlug) || ownerSlug
      let novel = novelsBySlug.get(mappedSlug)

      if (!novel) {
        const pathSegments = getAssetPathSegments(readableAsset.asset, config)
        const folderName = pathSegments[0] || ownerSlug
        novel = createFallbackNovel(ownerSlug, folderName)
        novelsBySlug.set(ownerSlug, novel)
      }

      if (novel.chapters.length === 1 && novel.chapters[0].title === "正文") {
        novel.chapters = []
      }

      addChapterToNovel(novel, parseStandaloneChapter(readableAsset.text, readableAsset.asset))
    }

    const novels = Array.from(novelsBySlug.values())

    novels.sort((left, right) => left.title.localeCompare(right.title, "zh-CN"))
    if (failedCount === 0) catalogCache = {
      key: `${config.urlEndpoint}:${config.novelPath}`,
      expiresAt: Date.now() + config.cacheSeconds * 1000,
      novels,
    }

    return {
      configured: true,
      novels,
      warning: failedCount > 0 ? "部分作品或章节未能加载，当前目录可能不完整。请重新加载后继续阅读。" : undefined,
    }
  } catch {
    console.error("ImageKit 小说目录暂时无法读取")
    const previous = getPreviousCatalog(config)
    if (previous) {
      return { configured: true, novels: previous, warning: "目录更新暂时失败，正在显示上次成功读取的内容。请稍后重新加载。" }
    }
    return {
      configured: true,
      error: "作品目录暂时无法读取，请稍后重新加载。",
      novels: [],
    }
  }
}

export async function getNovelBySlug(slug: string) {
  let decodedSlug = slug

  try {
    decodedSlug = decodeURIComponent(slug)
  } catch {
    // Keep the original route segment when it is not valid URI encoding.
  }

  const result = await getNovelCatalog()

  return result.novels.find((novel) => novel.slug === decodedSlug) || null
}
