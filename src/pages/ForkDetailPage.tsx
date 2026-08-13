import { useState } from 'react';
import { useReadingFork } from '../hooks/useReadingFork';
import { updateFork, deleteFork } from '../lib/reading-fork-api';
import type { ReadingFork, FullForkForm } from '../types/reading-fork';
import { parseTags } from '../utils/helpers';
import ForkDetail from '../components/ForkDetail';
import ForkForm from '../components/ForkForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { fetchBookTitles } from '../lib/reading-fork-api';

interface Props {
  forkId: string;
  onBack: () => void;
  onDeleted: () => void;
}

export default function ForkDetailPage({ forkId, onBack, onDeleted }: Props) {
  const { fork, loading, error, refetch } = useReadingFork(forkId);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bookTitles, setBookTitles] = useState<string[]>([]);

  // 状态快速切换
  const handleStatusChange = async (newStatus: ReadingFork['status']) => {
    if (!fork) return;
    try {
      await updateFork(fork.id, { status: newStatus });
      await refetch();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // 编辑保存
  const handleEditSave = async (data: FullForkForm) => {
    if (!fork) return;
    setSaving(true);
    try {
      await updateFork(fork.id, {
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
      await refetch();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setSaving(false);
    }
  };

  // 删除
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFork(forkId);
      onDeleted();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 加载编辑用的书名列表
  const handleStartEdit = async () => {
    if (bookTitles.length === 0) {
      try {
        const titles = await fetchBookTitles();
        setBookTitles(titles);
      } catch {
        // ignore
      }
    }
    setIsEditing(true);
  };

  // 加载状态
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-24 rounded bg-gray-200" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-amber-50" />
        ))}
      </div>
    );
  }

  // 错误状态
  if (error || !fork) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-gray-500">
          {error ? `加载失败：${error.message}` : '岔路不存在'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-amber-600 hover:underline"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 返回按钮 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={isEditing ? () => setIsEditing(false) : onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {isEditing ? '取消编辑' : '返回列表'}
        </button>
      </div>

      {/* 编辑模式 / 展示模式 */}
      {isEditing ? (
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">编辑岔路</h2>
          <ForkForm
            initialData={fork}
            bookTitles={bookTitles}
            onSave={handleEditSave}
            onCancel={() => setIsEditing(false)}
            saving={saving}
          />
        </div>
      ) : (
        <ForkDetail
          fork={fork}
          onEdit={handleStartEdit}
          onDelete={() => setShowDeleteConfirm(true)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除这个岔路标记？"
        message="删除后可以在 Supabase 中恢复（使用软删除），但列表中会隐藏此条目。"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={deleting}
      />
    </div>
  );
}
