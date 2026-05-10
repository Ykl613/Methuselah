export default function InProgressLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="h-7 w-40 bg-bg-elevated rounded animate-pulse mb-1.5" />
          <div className="h-3 w-48 bg-bg-elevated rounded animate-pulse" />
        </div>
        <div className="flex gap-2.5">
          <div className="w-10 h-10 bg-bg-elevated rounded-ios animate-pulse" />
          <div className="w-24 h-10 bg-bg-elevated rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex gap-1 bg-white p-1 rounded-ios mb-3 w-fit border border-border">
        <div className="w-16 h-7 bg-bg-elevated rounded-md animate-pulse" />
        <div className="w-24 h-7 bg-bg-elevated rounded-md animate-pulse" />
        <div className="w-28 h-7 bg-bg-elevated rounded-md animate-pulse" />
      </div>

      <div className="panel">
        <div className="px-4 py-3 border-b border-border">
          <div className="w-full max-w-md h-9 bg-bg-elevated rounded-ios animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-3">
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
