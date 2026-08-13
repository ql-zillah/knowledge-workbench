import type { ReadingFork } from '../types/reading-fork';
import ForkStatusBadge from './ForkStatusBadge';
import ForkPriorityStars from './ForkPriorityStars';
import { formatDate } from '../utils/helpers';

interface Props {
  fork: ReadingFork;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ReadingFork['status']) => void;
}

export default function ForkDetail({ fork, onEdit, onDelete, onStatusChange }: Props) {
  return (
    <div className="space-y-6">
      {/* ===== 位置锚定 ===== */}
      <section className="rounded-xl bg-white p-5 shadow-sm border border-amber-100">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          位置锚定
        </h3>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          《{fork.book_title}》
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          {fork.author && <span>作者：{fork.author}</span>}
          {fork.chapter && <span>{fork.chapter}</span>}
          {fork.page_number && (
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-mono">
              p.{fork.page_number}{fork.page_range ? ` (${fork.page_range})` : ''}
            </span>
          )}
          {fork.reading_session && (
            <span className="text-gray-400">📖 {fork.reading_session}</span>
          )}
        </div>
      </section>

      {/* ===== 分支标记 ===== */}
      <section className="rounded-xl bg-white p-5 shadow-sm border border-amber-100">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          分支标记
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {fork.domain && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              {fork.domain}
            </span>
          )}
          {fork.sub_domain && (
            <span className="text-sm text-gray-500">→ {fork.sub_domain}</span>
          )}
        </div>
        {fork.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fork.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ===== 思维快照 ===== */}
      <section className="rounded-xl bg-white p-5 shadow-sm border border-amber-100">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          思维快照
        </h3>
        {fork.thought && (
          <div className="mb-4 rounded-lg bg-amber-50 p-4 border border-amber-100">
            <p className="text-sm font-medium text-amber-800 mb-1">当时想到了什么</p>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {fork.thought}
            </p>
          </div>
        )}
        {fork.inspiration && (
          <div className="rounded-lg bg-purple-50 p-4 border border-purple-100">
            <p className="text-sm font-medium text-purple-800 mb-1">引申灵感</p>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {fork.inspiration}
            </p>
          </div>
        )}
        {!fork.thought && !fork.inspiration && (
          <p className="text-sm text-gray-400">暂无思维记录</p>
        )}
      </section>

      {/* ===== 上下文关联 ===== */}
      <section className="rounded-xl bg-white p-5 shadow-sm border border-amber-100">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          上下文关联
        </h3>
        {fork.original_quote && (
          <blockquote className="mb-3 border-l-4 border-amber-300 pl-4 italic text-gray-600">
            {fork.original_quote}
          </blockquote>
        )}
        {fork.relationship && (
          <p className="text-sm text-gray-700 leading-relaxed">{fork.relationship}</p>
        )}
        {!fork.original_quote && !fork.relationship && (
          <p className="text-sm text-gray-400">未补充上下文关联信息</p>
        )}
      </section>

      {/* ===== 状态 + 优先级 ===== */}
      <section className="rounded-xl bg-white p-5 shadow-sm border border-amber-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">状态：</span>
            <ForkStatusBadge status={fork.status} />
            <select
              value={fork.status}
              onChange={(e) =>
                onStatusChange(e.target.value as ReadingFork['status'])
              }
              className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
            >
              <option value="open">待探索</option>
              <option value="exploring">探索中</option>
              <option value="resolved">已解决</option>
              <option value="archived">已归档</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">优先级：</span>
            <ForkPriorityStars priority={fork.priority} />
          </div>
        </div>
      </section>

      {/* ===== 时间信息 ===== */}
      <div className="text-center text-xs text-gray-400">
        创建于 {formatDate(fork.created_at)} · 更新于 {formatDate(fork.updated_at)}
      </div>

      {/* ===== 操作按钮 ===== */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-lg border border-amber-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors"
        >
          编辑补充
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  );
}
