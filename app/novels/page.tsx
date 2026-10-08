import { getTranslations } from "@/lib/i18n/server"
import { NovelLibrary } from "@/components/novel-library"

export const dynamic = "force-dynamic"
export function generateMetadata() {
  const t = getTranslations()
  return { title: t("library.metaTitle"), description: t("library.metaDescription") }
}

export default function NovelsPage() {
  return <NovelLibrary />
}
