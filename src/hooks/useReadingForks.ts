// ============================================================
// useReadingForks — 岔路列表 + 筛选
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { ReadingFork, ForkFilters } from '../types/reading-fork';
import { fetchForks } from '../lib/reading-fork-api';

export function useReadingForks(filters: ForkFilters = {}) {
  const [forks, setForks] = useState<ReadingFork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 使用 JSON.stringify 做浅层依赖比较，避免对象引用触发无限循环
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchForks(filters);
      setForks(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载失败'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { forks, loading, error, refetch: load };
}
