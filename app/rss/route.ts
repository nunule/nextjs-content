import { getNovelCatalog } from "@/lib/novel-source"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const catalog = await getNovelCatalog()

  if (!catalog.configured || catalog.error) {
    return new Response("小说源未配置或无法读取", { status: 500 })
  }

  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  // 1. 组装 RSS 基础信息
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>雪落山庄 RSS</title>
    <link>${baseUrl}</link>
    <description>雪落山庄作品更新与故事连载</description>
    <language>zh-CN</language>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml"/>`

  // 2. 遍历小说和最新章节，作为 RSS 的 items
  // 因为目前系统没有专门记录时间，我们以小说列表及其最新进度为条目展示
  for (const novel of catalog.novels) {
    const novelLink = `${baseUrl}/#${novel.slug}`
    
    // 获取最新一章作为更新提示
    const latestChapter = novel.chapters.length > 0 
      ? novel.chapters[novel.chapters.length - 1] 
      : null

    const title = latestChapter 
      ? `[${novel.title}] 更新：第${latestChapter.chapterNumber}章 ${latestChapter.title}`
      : `[${novel.title}] 新书上架`
      
    const link = latestChapter 
      ? `${baseUrl}${latestChapter.path}`
      : novelLink

    const description = novel.description 
      ? `<![CDATA[ <p>类型：${novel.description}</p><p>${novel.summary}</p> ]]>` 
      : `<![CDATA[ <p>${novel.summary}</p> ]]>`

    // 当前时间（如果 ImageKitAsset 中扩展出 updated_at，可以替换为文件的实际更新时间）
    const pubDate = new Date().toUTCString()

    rss += `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid>${link}</guid>
    </item>`
  }

  rss += `
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      // 配置 HTTP 缓存：CDN 缓存1小时，过期后允许陈旧数据作为过渡
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  })
}
