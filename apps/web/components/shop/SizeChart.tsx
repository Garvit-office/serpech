import { SIZE_CHARTS, type SizeChartKey } from "@sarpech/core/size-guide";

export function SizeChart({ chart, caption = true }: { chart: SizeChartKey; caption?: boolean }) {
  const c = SIZE_CHARTS[chart];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-left text-base">
        {caption && (
          <caption className="mb-3 text-left">
            <span className="block font-display text-sm uppercase tracking-[0.18em]">{c.title}</span>
            <span className="block text-ink-soft">{c.note}</span>
          </caption>
        )}
        <thead>
          <tr className="border-b border-brand-green">
            {c.columns.map((col) => (
              <th key={col} scope="col" className="px-3 py-2 font-display text-[0.68rem] font-medium uppercase tracking-[0.18em]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.rows.map((row) => (
            <tr key={row[0]} className="border-b border-mist even:bg-pearl">
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-3 py-2 font-display text-sm font-medium">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="px-3 py-2">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
