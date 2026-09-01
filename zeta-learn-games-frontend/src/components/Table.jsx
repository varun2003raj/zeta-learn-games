export default function Table({
  columns,
  data,
  rowKey = "id",
  loading = false,
  emptyMessage = "No records found.",
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 ${
                    column.headerClassName || ""
                  }`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-sm text-slate-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            ) : null}

            {!loading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}

            {!loading && data.length > 0
              ? data.map((row, index) => (
                  <tr key={row[rowKey] ?? `${index}`}>
                    {columns.map((column) => (
                      <td
                        key={`${column.key}-${row[rowKey] ?? index}`}
                        className={`px-4 py-3 align-middle ${
                          column.cellClassName || ""
                        }`}
                      >
                        {column.render
                          ? column.render(row, index)
                          : row[column.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
