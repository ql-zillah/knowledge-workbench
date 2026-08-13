interface Props {
  onNewFork: () => void;
}

export default function EmptyState({ onNewFork }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* 图标 */}
      <div className="mb-6 rounded-full bg-amber-100 p-5">
        <svg
          className="h-12 w-12 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        还没有岔路标记
      </h3>
      <p className="mb-8 max-w-sm text-sm text-gray-500 leading-relaxed">
        阅读中遇到不熟悉的领域？<br />
        快速标记岔路，捕获当时灵感，事后回来处理。
      </p>

      <button
        type="button"
        onClick={onNewFork}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600 transition-colors shadow-sm"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        标记第一个岔路
      </button>
    </div>
  );
}
