// ============================================================
// useCreateFork — 创建岔路（含乐观更新）
// ============================================================

import { useState } from 'react';
import type { ReadingFork, ForkCreateInput } from '../types/reading-fork';
import { createFork } from '../lib/reading-fork-api';

export function useCreateFork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function create(input: ForkCreateInput): Promise<ReadingFork> {
    setLoading(true);
    setError(null);
    try {
      const fork = await createFork(input);
      return fork;
    } catch (err) {
      const e = err instanceof Error ? err : new Error('创建失败');
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error };
}
