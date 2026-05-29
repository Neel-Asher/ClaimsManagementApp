import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  title,
  searchable = true,
  searchPlaceholder = 'Search...',
  actions,
  pageSize = 8,
  onRowClick,
  emptyMessage = 'No data available',
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Filter
  const filtered = data.filter((row) =>
    columns.some((col) => {
      const val = col.accessor ? row[col.accessor] : col.render?.(row);
      return String(val || '').toLowerCase().includes(search.toLowerCase());
    })
  );

  // Sort
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const aVal = a[sortCol] ?? '';
        const bVal = b[sortCol] ?? '';
        const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (accessor) => {
    if (!accessor) return;
    if (sortCol === accessor) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(accessor);
      setSortDir('asc');
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {searchable && (
            <div className="relative flex-1 sm:flex-none">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder={searchPlaceholder}
                className="w-full sm:w-56 pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          )}
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/30">
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(col.accessor)}
                  className={`px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${col.accessor ? 'cursor-pointer hover:text-slate-200 select-none' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortCol === col.accessor && (
                      <span className="text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, ri) => (
                <tr
                  key={ri}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-slate-700/20 transition-colors ${onRowClick ? 'cursor-pointer' : ''} hover:bg-slate-800/40`}
                >
                  {columns.map((col, ci) => (
                    <td key={ci} className="px-5 py-3 text-sm text-slate-300">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-700/30 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-all"><ChevronsLeft size={16} /></button>
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
            <span className="px-3 py-1 text-xs text-slate-300 font-medium">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-all"><ChevronsRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
