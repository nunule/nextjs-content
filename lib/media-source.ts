import {
  getImageKitConfig,
  listImageKitFiles,
  normalizeImageKitPath,
} from "@/lib/imagekit"
import type { ImageKitAsset, ImageKitConfig } from "@/lib/imagekit"
import { compareAudioDates } from "@/lib/audio-date"

export interface AudioTrack {
  id: string
  title: string
  fileName: string
  order: number
  date: string
  playbackPath: string
}

export interface AudioGroup {
  date: string
  tracks: AudioTrack[]
}

interface MediaCache {
  key: string
  expiresAt: number
  entries: Array<{ asset: ImageKitAsset; track: AudioTrack }>
}

let cache: MediaCache | null = null

async function getMediaEntries(config: ImageKitConfig) {
  const folder = normalizeImageKitPath(process.env.IMAGEKIT_MEDIA_PATH || "/media/")
  const key = `${config.urlEndpoint}:${folder}`
  if (cache?.key === key && cache.expiresAt > Date.now()) return cache.entries
  const assets = await listImageKitFiles(config, folder)
  const entries: MediaCache["entries"] = []
  for (const asset of assets) {
    if (!asset.filePath?.startsWith(folder) || asset.type === "folder") continue
    const parts = asset.filePath.slice(folder.length).split("/")
    if (parts.length !== 2 || !/^\d+$/.test(parts[0])) continue
    const fileName = parts[1]
    const match = fileName.match(/^(\d+)_(.+)\.(?:mp3|wav)$/i)
    if (!match) continue
    const order = Number(match[1])
    if (!Number.isSafeInteger(order) || order < 1) continue
    const id = Buffer.from(asset.filePath).toString("base64url")
    entries.push({
      asset,
      track: {
        id,
        date: parts[0],
        fileName,
        title: match[2],
        order,
        playbackPath: `/api/media/${id}`,
      },
    })
  }
  entries.sort((a, b) =>
    compareAudioDates(a.track.date, b.track.date) ||
    a.track.order - b.track.order ||
    a.track.fileName.localeCompare(b.track.fileName, "zh-CN", { numeric: true }),
  )
  cache = { key, entries, expiresAt: Date.now() + config.cacheSeconds * 1000 }
  return entries
}

export async function getAudioCatalog(): Promise<{
  configured: boolean
  groups: AudioGroup[]
  error?: string
}> {
  const config = getImageKitConfig()
  if (!config) return { configured: false, groups: [] }
  try {
    const entries = await getMediaEntries(config)
    const groups = new Map<string, AudioGroup>()
    for (const { track } of entries) {
      const group = groups.get(track.date) || { date: track.date, tracks: [] }
      group.tracks.push(track)
      groups.set(track.date, group)
    }
    return { configured: true, groups: Array.from(groups.values()) }
  } catch (error) {
    console.error("读取音频目录失败", error)
    return { configured: true, groups: [], error: "音频目录暂时无法读取，请稍后重试。" }
  }
}

export async function getAudioAsset(id: string, config: ImageKitConfig) {
  return (await getMediaEntries(config)).find((entry) => entry.track.id === id)?.asset
}
