const skel = "animate-pulse bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] rounded-ledger";

export default function ApplicationLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      {/* Back square */}
      <div className={`h-11 w-11 mb-4 ${skel}`} />

      {/* Eyebrow and title */}
      <div className="mb-8">
        <div className={`h-3 w-24 mb-2 ${skel}`} />
        <div className={`h-8 w-72 max-w-full ${skel}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Left rail */}
        <div className="bg-card border border-hairline rounded-ledger">
          <div className="px-5 py-3.5 border-b border-hairline">
            <div className={`h-5 w-24 ${skel}`} />
          </div>
          <div className="p-5 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className={`h-3 w-16 mb-2 ${skel}`} />
                <div className={`h-4 w-28 ${skel}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right 3 panels */}
        <div className="space-y-6">
          {/* Extracted Details */}
          <div className="bg-card border border-hairline rounded-ledger">
            <div className="px-5 py-3.5 border-b border-hairline">
              <div className={`h-5 w-36 ${skel}`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className={`h-3 w-1/3 mb-2 ${skel}`} />
                  <div className={`h-11 ${skel}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Details */}
          <div className="bg-card border border-hairline rounded-ledger">
            <div className="px-5 py-3.5 border-b border-hairline">
              <div className={`h-5 w-36 ${skel}`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className={`h-3 w-1/3 mb-2 ${skel}`} />
                  <div className={`h-11 ${skel}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation and Interviews */}
          <div className="bg-card border border-hairline rounded-ledger">
            <div className="px-5 py-3.5 border-b border-hairline">
              <div className={`h-5 w-36 ${skel}`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className={`h-3 w-1/3 mb-2 ${skel}`} />
                  <div className={`h-11 ${skel}`} />
                </div>
              ))}
              <div className="md:col-span-2">
                <div className={`h-3 w-1/3 mb-2 ${skel}`} />
                <div className={`h-48 ${skel}`} />
              </div>
              <div className="md:col-span-2">
                <div className={`h-3 w-1/3 mb-2 ${skel}`} />
                <div className={`h-48 ${skel}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
