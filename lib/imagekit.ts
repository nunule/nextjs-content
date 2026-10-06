import { createHmac } from "node:crypto"

export interface ImageKitConfig {
  apiKey: string
  urlEndpoint: string
  signedFiles: boolean
  cacheSeconds: number
}

export interface ImageKitAsset {
  fileId?: string
  filePath?: string
  name?: string
  type?: string
  url?: string
  isPrivateFile?: boolean
}

export function getImageKitConfig(): ImageKitConfig | null {
  const apiKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim()
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim()
  if (!apiKey || !urlEndpoint) return null
  const seconds = Number(process.env.IMAGEKIT_CACHE_SECONDS)
  return {
    apiKey,
    urlEndpoint: urlEndpoint.replace(/\/+$/, ""),
    signedFiles: process.env.IMAGEKIT_SIGNED_FILES !== "false",
    cacheSeconds: Number.isFinite(seconds) && seconds >= 0 ? seconds : 60,
  }
}

export function normalizeImageKitPath(value: string) {
  const clean = value.trim().replace(/^\/+|\/+$/g, "")
  return clean ? `/${clean}/` : "/"
}

export async function listImageKitFiles(config: ImageKitConfig, folder: string) {
  const assets: ImageKitAsset[] = []
  const limit = 1000
  for (let skip = 0; ; skip += limit) {
    const params = new URLSearchParams({
      fileType: "non-image",
      limit: String(limit),
      skip: String(skip),
      searchQuery: `type = "file" AND path:${JSON.stringify(folder)}`,
    })
    const response = await fetch(`https://api.imagekit.io/v1/files?${params}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${config.apiKey}:`).toString("base64")}` },
      cache: "no-store",
    })
    if (!response.ok) throw new Error(`ImageKit 文件列表请求失败（${response.status}）`)
    const page: unknown = await response.json()
    if (!Array.isArray(page)) throw new Error("ImageKit 文件列表返回格式不正确")
    assets.push(...page)
    if (page.length < limit) return assets
  }
}

export function getImageKitAssetUrl(asset: ImageKitAsset, config: ImageKitConfig) {
  if (asset.url) return asset.url
  if (!asset.filePath) throw new Error("ImageKit 文件缺少访问地址")
  return `${config.urlEndpoint}/${asset.filePath.replace(/^\/+/, "")}`
}

export function signImageKitUrl(assetUrl: string, config: ImageKitConfig, expiresIn = 300) {
  if (!config.signedFiles) return assetUrl
  const url = new URL(assetUrl)
  const endpoint = new URL(config.urlEndpoint)
  const prefix = `${endpoint.pathname.replace(/\/+$/, "")}/`
  if (url.origin !== endpoint.origin || !url.pathname.startsWith(prefix)) {
    throw new Error("ImageKit 文件地址与 URL Endpoint 不匹配")
  }
  url.searchParams.delete("ik-s")
  url.searchParams.delete("ik-t")
  const relativePath = url.pathname.slice(prefix.length)
  const query = url.searchParams.toString()
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn
  const signature = createHmac("sha1", config.apiKey)
    .update(`${relativePath}${query ? `?${query}` : ""}${expiresAt}`)
    .digest("hex")
  url.searchParams.set("ik-t", String(expiresAt))
  url.searchParams.set("ik-s", signature)
  return url.toString()
}
