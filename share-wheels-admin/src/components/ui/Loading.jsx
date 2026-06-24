export default function Loading({ message = "Loading…", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 text-slate-500 dark:text-slate-400 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
        <div className="absolute inset-2 animate-pulse rounded-full bg-brand-50 dark:bg-brand-950/50" />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
