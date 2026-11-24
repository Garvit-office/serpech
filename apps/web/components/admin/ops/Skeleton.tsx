/** Placeholder shown while an admin page verifies the session and reads data. */
export function PageSkeleton({ title }: { title: string }) {
  return (
    <div aria-busy="true" aria-label={`Loading ${title}`}>
      <h1 className="text-xl sm:text-2xl">{title}</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse border border-mist bg-white" />
        ))}
      </div>
      <div className="mt-6 h-72 animate-pulse border border-mist bg-white" />
    </div>
  );
}
