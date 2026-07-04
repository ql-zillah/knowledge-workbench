// ============================================================
// 阅读岔路管理 — Supabase CRUD API
// ============================================================

import { supabase } from './supabase';
import type {
  ReadingFork,
  ForkCreateInput,
  ForkFilters,
} from '../types/reading-fork';

const TABLE = 'reading_forks';

// --- 列表查询（主页用） ---
export async function fetchForks(
  filters: ForkFilters = {}
): Promise<ReadingFork[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('is_deleted', false)
    .order(filters.sort_by || 'created_at', {
      ascending: filters.sort_order === 'asc',
    });

  if (filters.book_title) {
    query = query.eq('book_title', filters.book_title);
  }
  if (filters.domain) {
    query = query.eq('domain', filters.domain);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters.search) {
    query = query.or(
      `book_title.ilike.%${filters.search}%,domain.ilike.%${filters.search}%,thought.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as ReadingFork[]) || [];
}

// --- 单条查询（详情页用） ---
export async function fetchFork(id: string): Promise<ReadingFork | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ReadingFork;
}

// --- 创建岔路 ---
export async function createFork(
  input: ForkCreateInput
): Promise<ReadingFork> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      book_title: input.book_title,
      page_number: input.page_number ?? null,
      domain: input.domain || '',
      thought: input.thought || '',
    })
    .select()
    .single();

  if (error) throw error;
  return data as ReadingFork;
}

// --- 更新岔路 ---
export async function updateFork(
  id: string,
  updates: Partial<ReadingFork>
): Promise<ReadingFork> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ReadingFork;
}

// --- 软删除岔路 ---
export async function deleteFork(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw error;
}

// --- 获取去重后的书名列表（下拉框/自动补全用） ---
export async function fetchBookTitles(): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('book_title')
    .eq('is_deleted', false)
    .order('book_title');

  if (error) throw error;
  return [...new Set(data.map((r: { book_title: string }) => r.book_title))];
}

// --- 获取去重后的领域列表（自动补全用） ---
export async function fetchDomains(): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('domain')
    .eq('is_deleted', false)
    .neq('domain', '')
    .order('domain');

  if (error) throw error;
  return [...new Set(data.map((r: { domain: string }) => r.domain))];
}
