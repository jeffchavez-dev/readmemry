// Next.js shows this immediately on navigation, before the destination
// page's async data has resolved — without it, switching between
// Feed/Library/Add/etc. has a dead pause with no feedback while the
// Supabase queries are in flight. This doesn't make the queries faster,
// but it removes the "did my tap even register?" feeling that makes
// waiting feel worse than the actual delay.
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="space-y-3 pt-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-border/60 bg-muted/40"
          />
        ))}
      </div>
    </div>
  );
}
