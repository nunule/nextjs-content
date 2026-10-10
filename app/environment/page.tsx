import { EnvironmentExplorer } from "@/components/environment/environment-explorer"
import { getTranslations } from "@/lib/i18n/server"
import "./environment.css"

export function generateMetadata() {
  const t = getTranslations()
  return { title: t("environment.title"), description: t("environment.description") }
}

export default function EnvironmentPage() {
  return <EnvironmentExplorer />
}
