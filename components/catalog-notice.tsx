import { RetryButton } from "@/components/retry-button"

export function CatalogNotice({ message, warning = false }: { message: string; warning?: boolean }) {
  return (
    <div role={warning ? "status" : "alert"} className={`my-5 rounded-xl border p-5 text-sm leading-6 ${warning ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200" : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"}`}>
      <p>{message}</p>
      <RetryButton />
    </div>
  )
}
