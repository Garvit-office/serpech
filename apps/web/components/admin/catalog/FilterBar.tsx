import type { ReactNode } from "react";

/** GET form for list filters: search + selects; submits to the same page. */
export function FilterBar({ children, q, placeholder = "Search…", resetHref }: { children?: ReactNode; q?: string; placeholder?: string; resetHref: string }) {
  return (
    <form method="get" role="search" className="flex flex-col gap-3 border-b border-mist px-5 py-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="sm:min-w-64 sm:flex-1">
        <label htmlFor="filter-q" className="field-label">
          Search
        </label>
        <input id="filter-q" name="q" defaultValue={q} placeholder={placeholder} className="field min-h-10 py-1.5" type="search" />
      </div>
      {children}
      <div className="flex gap-2">
        <button type="submit" className="btn-royal min-h-10 px-5 py-1.5">
          Apply
        </button>
        <a href={resetHref} className="btn-outline min-h-10 px-4 py-1.5">
          Reset
        </a>
      </div>
    </form>
  );
}

export function FilterSelect({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={`filter-${name}`} className="field-label">
        {label}
      </label>
      <select id={`filter-${name}`} name={name} defaultValue={value ?? ""} className="field min-h-10 py-1.5">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
