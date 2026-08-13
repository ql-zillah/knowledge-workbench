import { useState } from 'react';
import type { AuthState } from '../hooks/useAuth';

interface Props {
  auth: AuthState;
}

type Mode = 'login' | 'register';

export default function LoginPage({ auth }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await auth.signIn(email, password);
      } else {
        await auth.signUp(email, password);
        setLocalError('注册成功！如果未开启邮箱验证，可以直接切换到「登录」进行登录。');
      }
    } catch {
      // auth.error 会自动更新
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || auth.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">阅读岔路管理</h1>
          <p className="mt-1 text-sm text-amber-700">捕获阅读中的每一个灵感</p>
        </div>

        {/* Tab 切换 */}
        <div className="mb-6 flex rounded-lg bg-amber-100 p-0.5">
          <button
            type="button"
            onClick={() => { setMode('login'); setLocalError(null); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-amber-700 hover:text-amber-800'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setLocalError(null); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-amber-700 hover:text-amber-800'
            }`}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={submitting}
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-amber-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              disabled={submitting}
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-amber-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
            />
          </div>

          {/* 错误信息 */}
          {displayError && (
            <div className={`rounded-lg p-3 text-sm ${
              displayError.includes('成功')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email.trim() || password.length < 6}
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting
              ? '处理中…'
              : mode === 'login'
                ? '登录'
                : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-amber-600/70">
          {mode === 'login'
            ? '还没有账号？切换到「注册」创建'
            : '已有账号？切换到「登录」'}
        </p>
      </div>
    </div>
  );
}
