export default function DashboardLoading() {
  const skel = "bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] rounded-ledger animate-pulse motion-reduce:animate-none";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-ink" aria-busy="true" aria-live="polite">
      {/* 1. Nav bar skeleton */}
      <div className="flex items-center justify-between pb-3 mb-6 border-b border-hairline">
        <div className="flex items-center gap-2.5 min-h-[44px]">
          <div className={`w-7 h-7 ${skel} shrink-0`} />
          <div className={`w-20 h-5 ${skel}`} />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className={`w-16 h-8 ${skel}`} />
          <div className={`w-16 h-8 ${skel}`} />
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <div className={`w-11 h-11 ${skel}`} />
          <div className={`w-11 h-11 ${skel}`} />
        </div>
      </div>

      {/* 2. Header block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4 mb-8">
        <div>
          <div className={`w-28 h-3.5 ${skel} mb-2`} />
          <div className={`w-48 h-8 ${skel}`} />
        </div>
        <div className={`hidden sm:block w-36 h-11 ${skel}`} />
      </div>

      {/* 3. Stats Panel */}
      <div className="bg-card border border-hairline rounded-ledger grid grid-cols-2 lg:flex mb-6">
        {/* Cell 1: Daily Goal */}
        <div className="p-3 lg:p-5 min-h-0 lg:min-h-[120px] border-hairline border-b lg:border-b-0 border-r lg:border-r lg:last:border-r-0 last:border-b-0 lg:flex-1 flex flex-col gap-1 lg:gap-3">
          <div className={`w-20 h-3.5 ${skel}`} />
          <div className={`w-14 h-7 lg:h-8 ${skel}`} />
          <div className={`hidden lg:block w-full h-1.5 ${skel} mt-auto`} />
        </div>

        {/* Cell 2: Weekly Count */}
        <div className="p-3 lg:p-5 min-h-0 lg:min-h-[120px] border-hairline border-b lg:border-b-0 border-r-0 lg:border-r lg:last:border-r-0 last:border-b-0 lg:flex-1 flex flex-col gap-1 lg:gap-3">
          <div className={`w-16 h-3.5 ${skel}`} />
          <div className={`w-10 h-7 lg:h-8 ${skel}`} />
        </div>

        {/* Cell 3: Streak */}
        <div className="col-span-2 lg:col-span-1 p-3 lg:p-5 min-h-0 lg:min-h-[120px] border-hairline border-b lg:border-b-0 border-r-0 lg:border-r lg:last:border-r-0 last:border-b-0 lg:flex-[1.4] flex flex-col gap-1 lg:gap-3">
          <div className={`w-14 h-3.5 ${skel}`} />
          <div className={`w-16 h-7 lg:h-8 ${skel}`} />
        </div>

        {/* Cell 4: Quote */}
        <div className="col-span-2 lg:col-span-1 p-3 lg:p-5 min-h-0 lg:min-h-[120px] border-hairline border-b last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:flex-[2] flex flex-col gap-1 lg:gap-3">
          <div className={`w-24 h-3.5 ${skel}`} />
          <div className={`w-full h-4 ${skel}`} />
        </div>
      </div>

      {/* 4. Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className={`w-full sm:w-72 h-11 ${skel}`} />
        <div className="flex gap-2">
          <div className={`w-20 h-11 ${skel}`} />
          <div className={`w-24 h-11 ${skel}`} />
          <div className={`w-20 h-11 ${skel}`} />
        </div>
      </div>

      {/* 5. Ledger Panel */}
      <div className="bg-card border border-hairline rounded-ledger overflow-hidden mb-8">
        <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-3 border-b border-hairline bg-paper">
          <div className={`h-3.5 ${skel} w-16`} />
          <div className={`h-3.5 ${skel} w-12`} />
          <div className={`h-3.5 ${skel} w-14`} />
          <div className={`h-3.5 ${skel} w-14`} />
          <div className={`h-3.5 ${skel} w-10`} />
          <div className={`h-3.5 ${skel} w-14`} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 md:grid-cols-6 md:gap-4 p-4 md:px-4 md:py-3.5 md:items-center border-b border-hairline last:border-b-0">
            <div className={`col-span-2 col-start-1 row-start-1 md:col-auto h-5 ${skel} w-28 md:w-32`} />
            <div className={`col-start-3 row-start-1 justify-self-end md:col-auto md:justify-self-start h-5 ${skel} w-16`} />
            <div className={`col-span-3 row-start-2 md:col-auto h-4 ${skel} w-36 md:w-28`} />
            <div className={`col-start-1 row-start-3 md:col-auto h-3.5 ${skel} w-20 md:w-16`} />
            <div className={`col-start-2 row-start-3 md:col-auto h-3.5 ${skel} w-12`} />
            <div className={`col-start-3 row-start-3 justify-self-end md:col-auto md:justify-self-start h-3.5 ${skel} w-12`} />
          </div>
        ))}
      </div>

      {/* 6. Pagination bar */}
      <div className="flex justify-between items-center py-4">
        <div className={`w-28 h-4 ${skel}`} />
        <div className="flex gap-2">
          <div className={`w-16 h-8 ${skel}`} />
          <div className={`w-16 h-8 ${skel}`} />
        </div>
      </div>
    </div>
  );
}
