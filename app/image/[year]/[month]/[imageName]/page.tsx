import { getTranslations } from "@/lib/i18n/server"
import { Text } from "@/components/locale-provider"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  decodeRouteParam,
  findImageAsset,
  listImageAssets,
  type ImageAsset,
} from "@/lib/image-assets"

interface ImagePageProps {
  params: {
    year: string
    month: string
    imageName: string
  }
}

function groupImages(images: ImageAsset[]) {
  const groups = new Map<string, { year: string; month: string; images: ImageAsset[] }>()

  for (const image of images) {
    const key = `${image.year}-${image.month}`
    const group = groups.get(key)

    if (group) {
      group.images.push(image)
    } else {
      groups.set(key, { year: image.year, month: image.month, images: [image] })
    }
  }

  return Array.from(groups.values())
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: ImagePageProps) {
  const imageName = decodeRouteParam(params.imageName)

  return {
    title: `${imageName} | ${getTranslations()("images.title")}`,
  }
}

export default async function ImagePage({ params }: ImagePageProps) {
  const [image, allImages] = await Promise.all([
    findImageAsset(params),
    listImageAssets(),
  ])

  if (!image) {
    notFound()
  }

  const groups = groupImages(allImages)

  return (
    <section className="py-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          <Text id="images.title" />
        </p>
        <h1 className="mt-2 break-all text-2xl font-semibold tracking-tight">{image.fileName}</h1>
      </header>

      <div className="relative min-h-[240px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <Image
          src={image.src}
          alt={image.fileName}
          fill
          priority
          sizes="(max-width: 672px) 100vw, 672px"
          className="object-contain"
          unoptimized
        />
      </div>

      <p className="mt-4 break-all text-sm text-slate-500 dark:text-slate-400">
        <Text id="images.fileName" values={{ name: image.fileName }} />
      </p>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold"><Text id="images.catalog" /></h2>
          <span className="text-sm text-slate-500 dark:text-slate-400"><Text id="images.total" values={{ count: allImages.length }} /></span>
        </div>

        <div className="space-y-3">
          {groups.map((group) => (
            <details
              key={`${group.year}-${group.month}`}
              open={group.year === image.year && group.month === image.month}
              className="group rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium [&::-webkit-details-marker]:hidden">
                <span><Text id="images.month" values={{ year: group.year, month: group.month }} /></span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  <Text id="images.count" values={{ count: group.images.length }} />
                </span>
              </summary>

              <ol className="space-y-2 border-t border-slate-200 px-5 py-4 text-sm dark:border-slate-800">
                {group.images.map((item) => (
                  <li key={item.filePath}>
                    <Link
                      href={item.pagePath}
                      className={
                        item.filePath === image.filePath
                          ? "font-semibold text-slate-900 underline underline-offset-4 dark:text-slate-50"
                          : "text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
                      }
                    >
                      {item.fileName}
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </section>
    </section>
  )
}
