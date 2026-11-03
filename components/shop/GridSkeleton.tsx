export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading products">
      <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:ml-[17.5rem]">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="animate-pulse">
            <div className="aspect-[5/6] bg-pearl" />
            <div className="mt-3 h-3 w-2/3 bg-mist" />
            <div className="mt-2 h-3 w-1/3 bg-mist" />
          </li>
        ))}
      </ul>
    </div>
  );
}
