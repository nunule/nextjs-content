import { Text } from "@/components/locale-provider"
import { getTranslations } from "@/lib/i18n/server"

export function generateMetadata() {
  const t = getTranslations()
  return { title: t("about.title"), description: t("about.description") }
}

export default function AboutPage() {
  return (
    <article className="prose py-6 dark:prose-invert">
      <h1><Text id="about.title" /></h1>
      <p className="text-xl"><Text id="about.description" /></p>
      <hr />
      <p><Text id="about.introduction" /></p>
      <h2><Text id="about.libraryTitle" /></h2>
      <p><Text id="about.library" /></p>
      <p><Text id="about.reading" /></p>
      <h2><Text id="about.audioTitle" /></h2>
      <p><Text id="about.audio" /></p>
    </article>
  )
}
