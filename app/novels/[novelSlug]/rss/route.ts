import { getNovelBySlug } from "@/lib/novel-source"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { novelSlug: string } }) {
  const novel = await getNovelBySlug(params.novelSlug)

  if (!novel) {
    return new Response("小说未找到", { status: 404 })
  }

  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`
  const novelUrl = `${baseUrl}/#${novel.slug}`

  // 1. 组装单本小说的 RSS 基础信息
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${novel.title} - 小说连载</title>
    <link>${novelUrl}</link>
    <description><![CDATA[ ${novel.description ? `<p>类型：${novel.description}</p>` : ""}<p>${novel.summary}</p> ]]></description>
    <language>zh-CN</language>
    <atom:link href="${baseUrl}/novels/${novel.slug}/rss" rel="self" type="application/rss+xml"/>`

  // 为了让 RSS 阅读器能正确识别章节的先后顺序，我们按从新到旧的顺序输出章节条目
  const sortedChapters = [...novel.chapters].sort((a, b) => b.chapterNumber - a.chapterNumber)

  // 2. 将章节作为 RSS 的 items
  // 为了确保 RSS 阅读器认为每章都是独立的更新，即使没有真实时间戳，我们依然可以使用当前时间，
  // 阅读器通常会依赖 <guid> (也就是章节链接) 来判断是否为新内容。
  const pubDate = new Date().toUTCString()

  if (sortedChapters.length === 0) {
    rss += `
    <item>
      <title>[${novel.title}] 新书已上架</title>
      <link>${novelUrl}</link>
      <description><![CDATA[ <p>《${novel.title}》已经建立，尚未发布正文章节，敬请期待！</p> ]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid>${novelUrl}</guid>
    </item>`
  } else {
    for (const chapter of sortedChapters) {
      const chapterLink = `${baseUrl}${chapter.path}`
      
      // 将小说的纯文本换行转换为 HTML 的段落
      const contentHtml = chapter.content
        .split('\\n')
        .filter((line) => line.trim())
        .map((line) => `<p>${line.trim()}</p>`)
        .join('')

      rss += `
    <item>
      <title>第${chapter.chapterNumber}章 ${chapter.title}</title>
      <link>${chapterLink}</link>
      <description><![CDATA[ 
        <p>《${novel.title}》更新了第${chapter.chapterNumber}章：${chapter.title}</p>
        <hr/>
        ${contentHtml}
        <hr/>
        <p><a href="${chapterLink}">点击在网页中阅读</a></p>
      ]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid>${chapterLink}</guid>
    </item>`
    }
  }

  rss += `
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  })
}
