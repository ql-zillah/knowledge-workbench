import type { ReadingFork } from '../types/reading-fork';
import { formatRelativeTime, truncate } from '../utils/helpers';
import ForkStatusBadge from './ForkStatusBadge';
import ForkPriorityStars from './ForkPriorityStars';

interface Props {
  fork: ReadingFork;
  onClick: () => void;
}

export default function ForkCard({ fork, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-white p-4 text-left shadow-sm border border-amber-100 hover:shadow-md hover:border-amber-200 transition-all"
    >
      {/* 顶行：书名 + 状态 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="h-4 w-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          <h3 className="font-semibold text-gray-900 truncate">
            {fork.book_title}
          </h3>
        </div>
        <ForkStatusBadge status={fork.status} />
      </div>

      {/* 领域 + 页码 */}
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
        {fork.domain && (
          <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {fork.domain}
          </span>
        )}
        {fork.page_number && (
          <span>p.{fork.page_number}</span>
        )}
        {fork.chapter && (
          <span className="truncate">{fork.chapter}</span>
        )}
      </div>

      {/* 思维快照预览 */}
      {fork.thought && (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {truncate(fork.thought, 100)}
        </p>
      )}

      {/* 底行：时间 + 优先级 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {formatRelativeTime(fork.created_at)}
        </span>
        <ForkPriorityStars priority={fork.priority} />
      </div>
    </button>
  );
}
