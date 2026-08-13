-- ============================================================
-- 登录功能 — 数据库迁移 SQL
-- 使用方式：复制到 Supabase SQL Editor → 运行
-- ============================================================

-- 1. 添加 user_id 列（关联 auth.users）
ALTER TABLE reading_forks
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. 创建索引加速用户查询
CREATE INDEX IF NOT EXISTS idx_forks_user_id ON reading_forks (user_id);

-- 3. 更新 RLS 策略：用户只能操作自己的数据
-- 删除旧的开放策略
DROP POLICY IF EXISTS "Allow all operations for anon key" ON reading_forks;

-- 新策略：用户隔离 + 历史数据兼容（user_id IS NULL 的旧数据仍可见）
CREATE POLICY "Users manage their own forks" ON reading_forks
  FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
