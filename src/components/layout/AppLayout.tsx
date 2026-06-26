// ============================================================
// AppLayout：主应用布局（导航栏 + 内容区）
// ============================================================
// 职责：
//   1. 顶部导航栏：Logo + 导航 Tab + 用户菜单
//   2. 内容区：children 就是当前路由对应的页面
//
// 对应 PRD：
//   8.1 页面流转图、8.2 全局导航交互
// ============================================================

import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// 导航项配置（对应 PRD 5.2 页面清单）
const navItems = [
  { path: '/capture', label: '💡 闪念', },
  { path: '/notes', label: '📖 笔记' },
  { path: '/organize', label: '📂 PARA' },
  { path: '/output', label: '🔮 产出' },
  { path: '/review', label: '📋 复盘' },
  { path: '/settings', label: '⚙️' },
]

interface AppLayoutProps {
  user: User
  children: React.ReactNode
}

export function AppLayout({ user, children }: AppLayoutProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // 退出登录
  // 对应 PRD REQ-AUTH-07
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen">
      {/* 顶部导航栏 */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-[960px] mx-auto flex items-center justify-between h-14 px-6">
          {/* Logo */}
          <NavLink to="/capture" className="text-lg font-extrabold">
            📚 工作台
          </NavLink>

          {/* 导航 Tab */}
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-text-secondary hover:bg-[#F5F0E8] hover:text-text-main'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* 用户菜单 */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center"
            >
              {/* 显示邮箱首字母 */}
              {user.email?.[0].toUpperCase()}
            </button>

            {menuOpen && (
              <>
                {/* 点击外部关闭菜单 */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-10 z-50 bg-card border border-border rounded-lg shadow-card-hover py-2 w-48">
                  <div className="px-4 py-2 text-xs text-text-muted border-b border-border">
                    {user.email}
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/settings') }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F0E8]"
                  >
                    ⚙️ 设置
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    🚪 退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="max-w-[960px] mx-auto px-6 py-7 pb-20">
        {children}
      </main>
    </div>
  )
}
