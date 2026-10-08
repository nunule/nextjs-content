import { NavigationLink } from "@/components/navigation-link"
import { Text } from "@/components/locale-provider"

export default function NotFound() {
  return (
    <section className="py-8">
      <h1 className="font-serif text-2xl font-bold"><Text id="notFound.title" /></h1>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300"><Text id="notFound.description" /></p>
      <NavigationLink href="/" className="mt-6 inline-flex min-h-[44px] items-center text-sm underline underline-offset-4"><Text id="error.back" /></NavigationLink>
    </section>
  )
}
