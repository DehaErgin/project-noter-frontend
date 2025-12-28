import clsx from 'clsx';

const DataTable = ({ columns, data, onEdit, onDelete, emptyMessage = 'No data available', customActions }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete || customActions) && (
                <th className="px-6 py-3 text-right text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {(onEdit || onDelete || customActions) && (
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {customActions && customActions(row)}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="px-3 py-1.5 text-sm font-medium text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="px-3 py-1.5 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

