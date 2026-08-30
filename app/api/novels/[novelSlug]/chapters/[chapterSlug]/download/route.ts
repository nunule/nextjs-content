import { NextResponse } from "next/server"

import { getNovelBySlug } from "@/lib/novel-source"

interface DownloadRouteProps {
  params: {
    novelSlug: string
    chapterSlug: string
  }
}

function decodeRouteParam(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "章节"
}

export async function GET(_: Request, { params }: DownloadRouteProps) {
  const novel = await getNovelBySlug(params.novelSlug)
  const chapter = novel?.chapters.find(
    (item) => item.slug === decodeRouteParam(params.chapterSlug),
  )

  if (!novel || !chapter) {
    return new NextResponse("章节不存在", { status: 404 })
  }

  const fileName = safeFileName(
    `${novel.title}_${String(chapter.chapterNumber).padStart(3, "0")}_${chapter.title}.txt`,
  )
  const content = `《${novel.title}》\n\n第${chapter.chapterNumber}章：${chapter.title}\n\n${chapter.content}\n`

  return new NextResponse(content, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="chapter-${String(
        chapter.chapterNumber,
      ).padStart(3, "0")}.txt"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
