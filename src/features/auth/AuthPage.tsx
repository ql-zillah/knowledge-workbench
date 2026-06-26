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
      let result;
      if (mode === 'signup') {
        result = await supabase.auth.signUp({ email, password })
        if (result.error) throw result.error

        // 注册成功但 session 为 null（mailer_autoconfirm 模式下）→ 自动登录
        if (!result.data.session) {
          const loginResult = await supabase.auth.signInWithPassword({ email, password })
          if (loginResult.error) throw loginResult.error
        }
      } else {
        result = await supabase.auth.signInWithPassword({ email, password })
        if (result.error) throw result.error
      }
    } catch (err: any) {
      // Supabase Auth 错误处理
      // err 可能是 AuthError 对象，也可能是普通 Error
      const rawMessage = err?.message || err?.msg || err?.error_description || ''
      const rawCode = err?.code || err?.status || ''

      // 按错误码和关键词友好化
      if (rawCode === 'user_already_exists' || rawMessage.includes('already') || rawMessage.includes('registered') || rawMessage.includes('exists') || rawMessage.includes('注册')) {
        setError('该邮箱已注册')
      } else if (rawCode === 'invalid_credentials' || rawMessage.includes('Invalid') || rawMessage.includes('credential') || rawMessage.includes('密码')) {
        setError('邮箱或密码错误')
      } else if (rawMessage.includes('email') && rawMessage.includes('confirm')) {
        setError('请先验证邮箱（检查确认邮件）')
      } else if (rawMessage.includes('rate') || rawMessage.includes('limit')) {
        setError('操作太频繁，请稍后再试')
      } else if (rawMessage) {
        // 兜底：显示原始错误（调试用，后续可去掉）
        setError('操作失败: ' + rawMessage)
      } else {
        setError('操作失败，请检查网络连接')
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
