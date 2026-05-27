export default function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="w-12 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
