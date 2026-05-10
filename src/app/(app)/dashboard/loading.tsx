export default function DashboardLoading() {
  return (
    <div>
      {/* Hero header skeleton */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <div className="h-3 w-24 bg-bg-elevated rounded animate-pulse mb-2" />
          <div className="h-8 w-72 bg-bg-elevated rounded animate-pulse mb-2" />
          <div className="h-4 w-56 bg-bg-elevated rounded animate-pulse" />
        </div>
        <div className="flex gap-2.5 items-center">
          <div className="w-10 h-10 bg-bg-elevated rounded-ios animate-pulse" />
          <div className="w-32 h-10 bg-bg-elevated rounded-full animate-pulse" />
        </div>
      </div>

      {/* 4 stat cards skeleton */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card-compact">
            <div className="flex justify-between items-center mb-2.5">
              <div className="w-8 h-8 bg-bg-elevated rounded-lg animate-pulse" />
            </div>
            <div className="h-3 w-20 bg-bg-elevated rounded animate-pulse mb-1.5" />
            <div className="h-7 w-12 bg-bg-elevated rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Pending tasks skeleton */}
      <div className="panel">
        <div className="px-5 py-4 flex justify-between items-center border-b border-border">
          <div>
            <div className="h-4 w-32 bg-bg-elevated rounded animate-pulse mb-1.5" />
            <div className="h-3 w-48 bg-bg-elevated rounded animate-pulse" />
          </div>
          <div className="w-20 h-8 bg-bg-elevated rounded-full animate-pulse" />
        </div>
        <div className="px-5 py-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-9 h-9 bg-bg-elevated rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-3.5 w-48 bg-bg-elevated rounded animate-pulse mb-1.5" />
                <div className="h-3 w-32 bg-bg-elevated rounded animate-pulse" />
              </div>
              <div className="w-16 h-5 bg-bg-elevated rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
