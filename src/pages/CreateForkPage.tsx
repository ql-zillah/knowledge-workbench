import { useState, useEffect } from 'react';
import ForkForm from '../components/ForkForm';
import { useCreateFork } from '../hooks/useCreateFork';
import { fetchBookTitles } from '../lib/reading-fork-api';
import type { FullForkForm } from '../types/reading-fork';
import { parseTags } from '../utils/helpers';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

export default function CreateForkPage({ onSaved, onCancel }: Props) {
  const [bookTitles, setBookTitles] = useState<string[]>([]);
  const { create, loading, error } = useCreateFork();

  useEffect(() => {
    fetchBookTitles().then(setBookTitles).catch(() => {});
  }, []);

  const handleSave = async (data: FullForkForm) => {
    const fork = await create({
      book_title: data.book_title,
      page_number: data.page_number ? Number(data.page_number) : null,
      domain: data.domain,
      thought: data.thought,
      author: data.author || null,
      chapter: data.chapter || null,
      page_range: data.page_range || null,
      reading_session: data.reading_session || '',
      sub_domain: data.sub_domain || '',
      tags: parseTags(data.tags),
      inspiration: data.inspiration || '',
      original_quote: data.original_quote || '',
      relationship: data.relationship || '',
      priority: data.priority,
      status: data.status,
    });

    if (fork) {
      // 触发列表刷新
      const refetch = (window as unknown as Record<string, unknown>)
        .__refetchForks as (() => void) | undefined;
      refetch?.();
      onSaved();
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          返回
        </button>
        <h2 className="text-lg font-bold text-gray-900">新建岔路标记</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          创建失败：{error.message}
        </div>
      )}

      <ForkForm
        bookTitles={bookTitles}
        onSave={handleSave}
        onCancel={onCancel}
        saving={loading}
      />
    </div>
  );
}
