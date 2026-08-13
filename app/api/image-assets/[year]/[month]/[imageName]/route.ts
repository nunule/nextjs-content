import fs from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { findImageFile, imageContentTypes, type ImageRouteParams } from "@/lib/image-assets"

export async function GET(_: Request, { params }: { params: ImageRouteParams }) {
  const image = await findImageFile(params)

  if (!image) {
    return new NextResponse("图片不存在", { status: 404 })
  }

  const extension = path.extname(image.fileName).toLowerCase()
  let file: Buffer

  try {
    file = await fs.readFile(image.filePath)
  } catch {
    return new NextResponse("图片不存在", { status: 404 })
  }

  return new NextResponse(file, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": imageContentTypes[extension],
    },
  })
}
