/**
 * OnboardingBackdrop – decorative dashboard skeleton rendered behind the onboarding card.
 * Purely presentational: aria-hidden, no state, no focusable children, no data fetching.
 * Mirrors the structure of app/(protected)/dashboard/loading.tsx without importing it,
 * keeping the two paths independent (see docs/decisions.md – backdrop duplication).
 */
export default function OnboardingBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Scrim overlay so the card reads clearly on top */}
      <div className="absolute inset-0 bg-paper opacity-80" />

      {/* Dashboard skeleton — mirrors loading.tsx structure, decorative only */}
      <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-8 py-8 opacity-40">
        {/* Nav bar skeleton */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-hairline">
          <div className="flex items-center gap-6">
            <div className="h-5 w-20 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]" />
            <div className="hidden sm:flex gap-4">
              <div className="h-4 w-20 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
              <div className="h-4 w-28 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
              <div className="h-4 w-16 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
            </div>
          </div>
          <div className="h-8 w-8 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
        </div>

        {/* Stats strip skeleton */}
        <div className="grid grid-cols-2 lg:flex mb-6 border border-hairline rounded-ledger overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 p-3 lg:p-4 border-r border-hairline last:border-r-0">
              <div className="h-3 w-12 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] mb-3" />
              <div className="h-8 w-10 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] mb-2" />
              <div className="h-2 w-full rounded-ledger bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]" />
            </div>
          ))}
        </div>

        {/* Toolbar skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 flex-1 max-w-xs rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
          <div className="h-9 w-28 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
        </div>

        {/* Ledger rows skeleton */}
        <div className="border border-hairline rounded-ledger overflow-hidden">
          {/* Header row */}
          <div className="hidden md:flex border-b border-hairline px-4 py-2 gap-4">
            {[60, 80, 40, 36, 28, 28].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          {/* Data rows */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-hairline last:border-b-0">
              <div className="h-4 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]" style={{ width: `${55 + (i % 3) * 20}px` }} />
              <div className="h-4 flex-1 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" style={{ maxWidth: `${120 + (i % 4) * 20}px` }} />
              <div className="h-5 w-16 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
              <div className="hidden md:block h-4 w-14 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]" />
              <div className="hidden md:block h-4 w-10 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]" />
              <div className="hidden md:block h-4 w-8 rounded-ledger bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
