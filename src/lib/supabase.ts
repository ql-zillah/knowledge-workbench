// ============================================================
// Supabase 客户端：连接前端和数据库的桥梁
// ============================================================
// 这个文件创建了一个全局的 Supabase 客户端实��
// 其他所有文件都从这里 import supabase 来操作数据库
//
// 环境变量说明：
//   VITE_SUPABASE_URL  - 在 Supabase Dashboard → Settings → API 中找到 Project URL
//   VITE_SUPABASE_ANON_KEY - 同一页面找到 anon public key
//
// Vite 的约定：以 VITE_ 开头的环境变量才会暴露给前端
// 这些值写在 .env.local 文件中，不入 Git（安全要求）
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 开发环境下的友好提示：如果没配环境变量，控制台会报错提醒
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ 缺少 Supabase 环境变量！请在项目根目录创建 .env.local 文件：\n' +
    'VITE_SUPABASE_URL=你的项目URL\n' +
    'VITE_SUPABASE_ANON_KEY=你的anon密钥\n' +
    '在 Supabase Dashboard → Settings → API 中获取'
  )
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      // 持久化登录状态（刷新页面不掉登录）
      persistSession: true,
      // 页面打开时自动从存储恢复会话
      autoRefreshToken: true,
      // 检测到已有会话时自动刷新
      detectSessionInUrl: true,
    },
  }
)
