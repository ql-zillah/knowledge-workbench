import { useState } from 'react';
import type { ReactNode } from 'react';

type PageName = 'home' | 'create' | 'detail' | 'ai-chat';

interface Props {
  userEmail: string | undefined;
  onSignOut: () => void;
  onNavigate: (
    view:
      | { page: 'home' }
      | { page: 'create' }
      | { page: 'ai-chat' },
  ) => void;
  currentPage: string;
  children: ReactNode;
}

const TABS: { page: PageName; label: string }[] = [
  { page: 'home', label: '📖 岔路' },
  { page: 'ai-chat', label: '💬 AI' },
];

export default function Layout({
  userEmail,
  onSignOut,
  onNavigate,
  currentPage,
  children,
}: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen bg-amber-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 bg-white border-b border-amber-200 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => onNavigate({ page: 'home' })}
            className="flex items-center gap-2 text-gray-900 hover:text-amber-600 transition-colors flex-shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-lg font-bold tracking-tight">阅读岔路</span>
          </button>

          {/* 标签切换 */}
          <nav className="flex items-center gap-0.5 rounded-lg bg-amber-50 p-0.5">
            {TABS.map((tab) => {
              const isActive =
                tab.page === currentPage ||
                (tab.page === 'home' && (currentPage === 'create' || currentPage === 'detail'));
              return (
                <button
                  key={tab.page}
                  type="button"
                  onClick={() => onNavigate({ page: tab.page === 'home' ? 'home' : 'ai-chat' })}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-amber-700 hover:text-amber-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* 右侧：新建按钮 + 用户菜单 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentPage === 'home' && (
              <button
                type="button"
                onClick={() => onNavigate({ page: 'create' })}
                className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                新建岔路
              </button>
            )}

            <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:border-amber-300 transition-colors"
            >
              <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="max-w-[100px] truncate">{userEmail}</span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg bg-white border border-amber-200 shadow-lg py-1">
                  <div className="px-3 py-2 border-b border-amber-100">
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onSignOut();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
