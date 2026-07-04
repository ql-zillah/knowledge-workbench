import { useState } from 'react';
import type { FullForkForm, ReadingFork } from '../types/reading-fork';
import { EMPTY_FULL_FORM, STATUS_LABELS } from '../types/reading-fork';

interface Props {
  // 编辑模式：传入已有 fork 数据
  initialData?: ReadingFork;
  // 书名列表（快速模式下自动补全用）
  bookTitles: string[];
  onSave: (data: FullForkForm) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function ForkForm({
  initialData,
  bookTitles,
  onSave,
  onCancel,
  saving,
}: Props) {
  const isEdit = !!initialData;
  const [expanded, setExpanded] = useState(isEdit);

  // 从 ReadingFork 还原表单数据
  const initFull = initialData
    ? {
        book_title: initialData.book_title,
        author: initialData.author || '',
        chapter: initialData.chapter || '',
        page_number: initialData.page_number?.toString() || '',
        page_range: initialData.page_range || '',
        reading_session: initialData.reading_session || '',
        domain: initialData.domain,
        sub_domain: initialData.sub_domain,
        tags: initialData.tags.join(', '),
        thought: initialData.thought,
        inspiration: initialData.inspiration,
        original_quote: initialData.original_quote,
        relationship: initialData.relationship,
        priority: initialData.priority,
        status: initialData.status,
      }
    : EMPTY_FULL_FORM;

  const [form, setForm] = useState<FullForkForm>(initFull);

  // 显示上次用的书名（快速模式提示）
  const lastBookTitle = bookTitles[0] || '';

  const update = (field: keyof FullForkForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ===== 快速模式：4 个核心字段 ===== */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
        {/* 书名 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            书名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.book_title}
            onChange={(e) => update('book_title', e.target.value)}
            placeholder={lastBookTitle ? `如：《${lastBookTitle}》` : '输入书名'}
            list="book-titles"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <datalist id="book-titles">
            {bookTitles.map((title) => (
              <option key={title} value={title} />
            ))}
          </datalist>
        </div>

        {/* 页码 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            页码
          </label>
          <input
            type="number"
            value={form.page_number}
            onChange={(e) => update('page_number', e.target.value)}
            placeholder="如：87"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            autoFocus
          />
        </div>

        {/* 领域 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            这个岔路属于什么领域
          </label>
          <input
            type="text"
            value={form.domain}
            onChange={(e) => update('domain', e.target.value)}
            placeholder="如：认知心理学、计量经济学"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* 思维快照 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            当时想到了什么
          </label>
          <textarea
            value={form.thought}
            onChange={(e) => update('thought', e.target.value)}
            placeholder="记录此刻脑海中的想法、疑问或关联…"
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* ===== 展开/收起开关 ===== */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
      >
        {expanded ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            收起详细字段
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            展开更多字段（阅读后补充）
          </>
        )}
      </button>

      {/* ===== 完整模式：所有字段 ===== */}
      {expanded && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
          {/* 位置锚定补充 */}
          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              位置锚定（补充）
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">作者</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => update('author', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">章节</label>
                <input
                  type="text"
                  value={form.chapter}
                  onChange={(e) => update('chapter', e.target.value)}
                  placeholder="如：第3章"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">页码范围</label>
                <input
                  type="text"
                  value={form.page_range}
                  onChange={(e) => update('page_range', e.target.value)}
                  placeholder="如：45-47"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">阅读场次</label>
                <input
                  type="text"
                  value={form.reading_session}
                  onChange={(e) => update('reading_session', e.target.value)}
                  placeholder="如：7月4日下午"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </fieldset>

          {/* 分支标记补充 */}
          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              分支标记（补充）
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">子领域</label>
                <input
                  type="text"
                  value={form.sub_domain}
                  onChange={(e) => update('sub_domain', e.target.value)}
                  placeholder="如：工作记忆模型"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => update('tags', e.target.value)}
                  placeholder="如：推荐系统, 协同过滤"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </fieldset>

          {/* 思维快照补充 */}
          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              思维快照（补充）
            </legend>
            <div>
              <label className="mb-1 block text-xs text-gray-500">引申灵感 / 关联想法</label>
              <textarea
                value={form.inspiration}
                onChange={(e) => update('inspiration', e.target.value)}
                placeholder="读完之后的延伸思考…"
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </fieldset>

          {/* 上下文关联 */}
          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              上下文关联
            </legend>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">触发岔路的原文</label>
                <textarea
                  value={form.original_quote}
                  onChange={(e) => update('original_quote', e.target.value)}
                  placeholder="摘录原文…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">与原文的关系</label>
                <input
                  type="text"
                  value={form.relationship}
                  onChange={(e) => update('relationship', e.target.value)}
                  placeholder="如：对原文假设的质疑、想深入的理论背景"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </fieldset>

          {/* 状态 + 优先级 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
              >
                {(Object.entries(STATUS_LABELS) as [string, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                优先级：{form.priority}
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={form.priority}
                onChange={(e) => update('priority', Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== 操作按钮 ===== */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={saving || !form.book_title.trim()}
          className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {saving ? '保存中…' : isEdit ? '保存修改' : '标记岔路 ✓'}
        </button>
      </div>
    </form>
  );
}
