// ============================================================
// useAuth — Supabase 身份认证
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化：获取当前 session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setError(translateError(err));
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
    });
    if (err) {
      setError(translateError(err));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, error, signIn, signUp, signOut };
}

/** 把 Supabase 英文错误翻译成中文 */
function translateError(error: AuthError): string {
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return '邮箱或密码错误';
  }
  if (msg.includes('user already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
    return '该邮箱已注册，请直接登录';
  }
  if (msg.includes('email not confirmed')) {
    return '邮箱未验证，请先点击邮件中的确认链接';
  }
  if (msg.includes('password') && msg.includes('length')) {
    return '密码至少需要 6 个字符';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return '操作太频繁，请稍后再试';
  }
  return error.message;
}
