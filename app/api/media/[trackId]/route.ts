import { NextResponse } from "next/server"
import { getImageKitConfig, getImageKitAssetUrl, signImageKitUrl } from "@/lib/imagekit"
import { getAudioAsset } from "@/lib/media-source"

export const dynamic = "force-dynamic"

// Let ImageKit deliver the audio and handle Range requests directly.
export async function GET(_: Request, { params }: { params: { trackId: string } }) {
  const config = getImageKitConfig()
  if (!config) return new NextResponse("音频源尚未配置", { status: 503 })
  try {
    const asset = await getAudioAsset(params.trackId, config)
    if (!asset) return new NextResponse("音频不存在", { status: 404 })
    // A fresh URL is created when a track is loaded. Allow long listening sessions and seeks.
    const url = signImageKitUrl(getImageKitAssetUrl(asset, config), config, 24 * 60 * 60)
    return NextResponse.redirect(url, {
      status: 307,
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    console.error("获取音频地址失败", error)
    return new NextResponse("暂时无法播放音频", { status: 502 })
  }
}
