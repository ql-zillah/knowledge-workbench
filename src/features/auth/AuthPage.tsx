// ============================================================
// AuthPage：登录注册页
// ============================================================
// 职责：
//   1. 提供邮箱+密码注册和登录
//   2. 注册成功后自动登录
//   3. 登录成功后 App.tsx 会自动检测到状态变化并跳转
//
// 对应 PRD：
//   REQ-AUTH-01~04：注册、密码校验、邮箱重复、登录
// ============================================================

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthPage() {
  // 模式切换：登录 / 注册
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // REQ-AUTH-02：密码强度校验
    if (password.length < 8) {
      setError('密码至少 8 位')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        // 注册
        // 注意：Supabase 默认可能开启邮箱确认，你可以在
        // Dashboard → Authentication → Settings 中关闭 "Confirm email"
        // 这样注册后直接登录，不需要点确认链接
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // 注册成功后 App.tsx 的 onAuthStateChange 会自动更新状态
      } else {
        // 登录
        // REQ-AUTH-04
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      // 错误处理（邮箱重复、密码错误等）
      const message = err instanceof Error ? err.message : '操作失败'
      // 友好化常见错误提示
      if (message.includes('already registered')) {
        setError('该邮箱已注册')
      } else if (message.includes('Invalid login')) {
        setError('邮箱或密码错误')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">📚</div>
          <h1 className="text-xl font-extrabold">知识管理工作台</h1>
          <p className="text-sm text-text-secondary mt-1">
            你的 AI 驱动第二大脑
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="card">
          {/* 模式切换 Tab */}
          <div className="flex gap-2 mb-6 p-1 bg-[#F5F0E8] rounded-lg">
            <button
              onClick={() => { setMode('signup'); setError('') }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-card text-primary shadow-sm' : 'text-text-secondary'
              }`}
            >
              注册
            </button>
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-card text-primary shadow-sm' : 'text-text-secondary'
              }`}
            >
              登录
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱 */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="form-input"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                required
                className="form-input"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? '处理中…' : mode === 'signup' ? '注册' : '登录'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          注册即创建你的私密知识空间
        </p>
      </div>
    </div>
  )
}
