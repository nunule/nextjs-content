import { redirect } from "next/navigation"
import { listImageAssets } from "@/lib/image-assets"

export const dynamic = "force-dynamic"

function getTodayParts() {
  const today = new Date()
  const year = String(today.getFullYear())
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const dateName = `${year}${month}${String(today.getDate()).padStart(2, "0")}`

  return { year, month, dateName }
}

export default async function ImagesIndexPage() {
  const images = await listImageAssets()

  if (images.length === 0) {
    return (
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          图片展示
        </p>
        <h1 className="mt-2 text-2xl font-semibold">暂无图片</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          请先按照图片目录规则添加图片。
        </p>
      </section>
    )
  }

  const today = getTodayParts()
  const todayImage = images.find(
    (image) =>
      image.year === today.year && image.month === today.month && image.dateName === today.dateName,
  )

  redirect(todayImage?.pagePath ?? images[0].pagePath)
}
