export default function SettingsLoading() {
  const skel = "bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] rounded-ledger";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 animate-pulse">
      {/* Back button skeleton */}
      <div className={`h-11 w-11 mb-4 ${skel}`} />

      {/* Eyebrow and title */}
      <div className="mb-8">
        <div className={`h-3 w-24 mb-2 ${skel}`} />
        <div className={`h-8 w-40 ${skel}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Left rail skeleton */}
        <div className="hidden lg:block space-y-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-10 w-full ${skel}`} />
          ))}
        </div>

        {/* Right column with four panels */}
        <div className="space-y-6 min-w-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-hairline rounded-ledger p-5 space-y-4">
              <div className={`h-5 w-36 ${skel}`} />
              <div className="space-y-3">
                <div className={`h-11 w-full ${skel}`} />
                <div className={`h-11 w-full ${skel}`} />
                <div className={`h-11 w-full ${skel}`} />
              </div>
              <div className={`h-11 w-44 ml-auto ${skel}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

