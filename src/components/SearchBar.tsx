import type { ForkFilters, ForkStatus } from '../types/reading-fork';
import { STATUS_LABELS } from '../types/reading-fork';

interface Props {
  filters: ForkFilters;
  bookTitles: string[];
  domains: string[];
  onFiltersChange: (filters: ForkFilters) => void;
}

export default function SearchBar({
  filters,
  bookTitles,
  domains,
  onFiltersChange,
}: Props) {
  const statuses: ForkStatus[] = ['open', 'exploring', 'resolved', 'archived'];

  return (
    <div className="mb-6 space-y-3">
      {/* 搜索框 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="搜索书名、领域或灵感关键词…"
          value={filters.search || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value || undefined })
          }
          className="w-full rounded-lg border border-amber-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-amber-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-shadow"
        />
      </div>

      {/* 筛选行 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 书名筛选 */}
        {bookTitles.length > 0 && (
          <select
            value={filters.book_title || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                book_title: e.target.value || undefined,
              })
            }
            className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
          >
            <option value="">全部书名</option>
            {bookTitles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        )}

        {/* 领域筛选 */}
        {domains.length > 0 && (
          <select
            value={filters.domain || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                domain: e.target.value || undefined,
              })
            }
            className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
          >
            <option value="">全部领域</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {/* 状态筛选 */}
        <select
          value={filters.status || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              status: (e.target.value || undefined) as ForkStatus | undefined,
            })
          }
          className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
        >
          <option value="">全部状态</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {/* 排序 */}
        <select
          value={filters.sort_by || 'created_at'}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              sort_by: e.target.value as 'created_at' | 'priority' | 'book_title',
            })
          }
          className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
        >
          <option value="created_at">按时间</option>
          <option value="priority">按优先级</option>
          <option value="book_title">按书名</option>
        </select>
      </div>
    </div>
  );
}
