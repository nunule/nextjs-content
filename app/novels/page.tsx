import { NovelLibrary } from "@/components/novel-library"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "小说作品",
  description: "雪落山庄小说作品目录，展开简介与章节，静心读一段故事。",
}

export default function NovelsPage() {
  return <NovelLibrary />
}
