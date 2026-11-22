export default function LoadingPage() {
  return (
    <div aria-busy="true" aria-live="polite" className="grid max-w-[720px] gap-4">
      <div className="h-4 w-24 animate-pulse rounded-full bg-border" aria-hidden="true" />
      <div className="h-10 w-3/5 animate-pulse rounded-xl bg-border" aria-hidden="true" />
      <div className="h-4 w-full animate-pulse rounded bg-border" aria-hidden="true" />
      <div className="h-4 w-4/5 animate-pulse rounded bg-border" aria-hidden="true" />
      <span className="text-sm text-muted">Загружаем…</span>
    </div>
  );
}
