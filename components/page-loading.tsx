export function PageLoading({ label = "正在加载内容…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4 py-5">
      <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-700 dark:border-t-slate-200" />
        {label}
      </p>
      <div aria-hidden="true" className="site-surface space-y-5 rounded-2xl border border-slate-200 bg-white/70 p-6 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  )
}
