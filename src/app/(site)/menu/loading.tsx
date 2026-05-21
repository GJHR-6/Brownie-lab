export default function MenuLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="h-10 bg-stone-200 rounded-xl w-52 mx-auto mb-3" />
        <div className="h-4 bg-stone-200 rounded w-72 mx-auto" />
      </div>
      {/* Search */}
      <div className="h-11 bg-stone-200 rounded-xl max-w-sm mx-auto mb-6" />
      {/* Filter tabs */}
      <div className="flex gap-2 mb-12 justify-center flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-stone-200 rounded-full" />
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100">
            <div className="h-44 bg-stone-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-stone-200 rounded" />
              <div className="h-3 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
              <div className="h-9 bg-stone-200 rounded-xl mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
