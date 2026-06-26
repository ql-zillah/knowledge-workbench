// ============================================================
// App.tsx：应用根组件
// ============================================================
// 职责：
//   1. 管理全局登录状态（登录了？没登录？）
//   2. 根据登录状态决定显示"登录页"还是"主应用"
//   3. 主应用包含导航栏 + 路由（不同 URL 显示不同页面）
//
// 对应 PRD：
//   REQ-AUTH-05：登录态保持（已登录显示导航栏）
//   REQ-AUTH-06：未登录访问拦截（自动跳转登录页）
//   REQ-AUTH-07：退出登录
// ============================================================

import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// 布局组件
import { AppLayout } from '@/components/layout/AppLayout'

// 页面组件
import { AuthPage } from '@/features/auth/AuthPage'
import { CapturePage } from '@/features/capture/CapturePage'
import { NotesPage } from '@/features/notes/NotesPage'
import { OrganizePage } from '@/features/organize/OrganizePage'
import { OutputPage } from '@/features/output/OutputPage'
import { ReviewPage } from '@/features/review/ReviewPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export default function App() {
  // 登录状态管理
  // user 为 null = 未登录；有值 = 已登录
  const [user, setUser] = useState<User | null>(null)
  // loading = true 表示还在检查登录状态（页面刚打开时）
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 页面打开时，检查是否已有登录会话（比如上次登录没退出）
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听登录状态变化（登录、退出、Token 过期都会触发）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    // 组件卸载时取消监听（避免内存泄漏）
    return () => subscription.unsubscribe()
  }, [])

  // 加载中：显示一个简单的 loading 状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">⏳ 加载中…</p>
      </div>
    )
  }

  // 未登录：只显示登录注册页
  if (!user) {
    return <AuthPage />
  }

  // 已登录：显示主应用（导航栏 + 路由页面）
  return (
    <AppLayout user={user}>
      <Routes>
        {/* 默认页重定向到闪念捕获 */}
        <Route path="/" element={<Navigate to="/capture" replace />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/organize" element={<OrganizePage />} />
        <Route path="/output" element={<OutputPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* 未知路由重定向到闪念捕获 */}
        <Route path="*" element={<Navigate to="/capture" replace />} />
      </Routes>
    </AppLayout>
  )
}
