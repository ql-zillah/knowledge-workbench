import { useEffect, useState, useMemo } from 'react';
import { useReadingForks } from '../hooks/useReadingForks';
import { fetchBookTitles, fetchDomains } from '../lib/reading-fork-api';
import type { ForkFilters } from '../types/reading-fork';
import SearchBar from '../components/SearchBar';
import ForkCard from '../components/ForkCard';
import EmptyState from '../components/EmptyState';

interface Props {
  onNewFork: () => void;
  onSelectFork: (id: string) => void;
}

export default function HomePage({ onNewFork, onSelectFork }: Props) {
  const [filters, setFilters] = useState<ForkFilters>({
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [bookTitles, setBookTitles] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);

  const { forks, loading, error, refetch } = useReadingForks(filters);

  // 加载筛选用的书名和领域列表
  useEffect(() => {
    fetchBookTitles().then(setBookTitles).catch(() => {});
    fetchDomains().then(setDomains).catch(() => {});
  }, []);

  // 数据变更后刷新（创建/删除后）
  useEffect(() => {
    const handleFocus = () => refetch();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  // 传给子组件的刷新回调
  const memoizedRefetch = useMemo(() => refetch, [refetch]);

  // 暴露 refetch 给父组件（通过 window 事件）
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__refetchForks = memoizedRefetch;
  }, [memoizedRefetch]);

  return (
    <div>
      <SearchBar
        filters={filters}
        bookTitles={bookTitles}
        domains={domains}
        onFiltersChange={setFilters}
      />

      {/* 错误状态 */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          ⚠️ 加载失败：{error.message}
          <button
            type="button"
            onClick={refetch}
            className="ml-2 underline hover:no-underline"
          >
            重试
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && forks.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-white p-4 border border-amber-100"
            >
              <div className="mb-2 h-5 w-1/3 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-1/4 rounded bg-amber-50" />
              <div className="h-4 w-2/3 rounded bg-amber-50" />
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && forks.length === 0 && (
        <EmptyState onNewFork={onNewFork} />
      )}

      {/* 岔路列表 */}
      {forks.length > 0 && (
        <div className="space-y-3">
          {forks.map((fork) => (
            <ForkCard
              key={fork.id}
              fork={fork}
              onClick={() => onSelectFork(fork.id)}
            />
          ))}
          <p className="text-center text-xs text-gray-400 py-4">
            共 {forks.length} 条岔路标记
          </p>
        </div>
      )}
    </div>
  );
}
