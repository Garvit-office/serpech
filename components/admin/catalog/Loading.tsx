/** Skeleton shown while an admin page's data streams in. */
export function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-6 h-8 w-48 bg-mist" />
      <div className="border border-mist bg-white p-5 shadow-card">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="mb-3 h-6 bg-pearl" />
        ))}
      </div>
    </div>
  );
}
