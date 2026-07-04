// ============================================================
// useReadingFork — 单条岔路详情
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { ReadingFork } from '../types/reading-fork';
import { fetchFork } from '../lib/reading-fork-api';

export function useReadingFork(id: string | undefined) {
  const [fork, setFork] = useState<ReadingFork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setFork(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFork(id);
      setFork(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载失败'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { fork, loading, error, refetch: load };
}
