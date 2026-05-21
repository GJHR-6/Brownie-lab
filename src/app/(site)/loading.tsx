export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-amber-900 py-28 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="h-3 bg-amber-700 rounded w-40 mx-auto" />
          <div className="h-14 bg-amber-700 rounded-2xl w-80 mx-auto" />
          <div className="h-4 bg-amber-700 rounded w-96 mx-auto" />
          <div className="h-4 bg-amber-700 rounded w-72 mx-auto" />
          <div className="flex gap-4 justify-center mt-6">
            <div className="h-12 w-32 bg-amber-700 rounded-full" />
            <div className="h-12 w-40 bg-amber-700 rounded-full" />
          </div>
        </div>
      </div>
      {/* Products skeleton */}
      <div className="py-20 px-4 max-w-5xl mx-auto">
        <div className="h-8 bg-stone-200 rounded w-48 mx-auto mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100">
              <div className="h-44 bg-stone-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-stone-200 rounded" />
                <div className="h-3 bg-stone-200 rounded w-3/4" />
                <div className="h-9 bg-stone-200 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
