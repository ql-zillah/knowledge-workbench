-- ============================================================
-- 阅读岔路管理 — Supabase 数据库建表 SQL
-- 使用方式：复制到 Supabase SQL Editor → 运行
-- ============================================================

-- 1. 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建 reading_forks 表
CREATE TABLE reading_forks (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- === 位置锚定 (Position Anchor) ===
  book_title TEXT NOT NULL,          -- 书名 — 唯一必填字段
  author TEXT,                       -- 作者
  chapter TEXT,                      -- 章节
  page_number INTEGER,               -- 页码
  page_range TEXT,                   -- 页码范围，如 "45-47"
  reading_session TEXT DEFAULT '',   -- 阅读场次标签

  -- === 分支标记 (Branch Marker) ===
  domain TEXT NOT NULL DEFAULT '',   -- 所属领域
  sub_domain TEXT DEFAULT '',        -- 子领域
  tags TEXT[] DEFAULT '{}',          -- 灵活标签数组

  -- === 思维快照 (Thought Snapshot) ===
  thought TEXT NOT NULL DEFAULT '',  -- 当时在想什么
  inspiration TEXT DEFAULT '',       -- 关联想法/创意

  -- === 上下文关联 (Context Association) ===
  original_quote TEXT DEFAULT '',    -- 触发岔路的原文
  relationship TEXT DEFAULT '',      -- 岔路与原文的关系

  -- === 状态管理 ===
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'exploring', 'resolved', 'archived')),
  priority INTEGER NOT NULL DEFAULT 3
    CHECK (priority >= 1 AND priority <= 5),

  -- === 软删除 ===
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- 3. 创建索引（按常见查询模式）
CREATE INDEX idx_forks_created_at ON reading_forks (created_at DESC);
CREATE INDEX idx_forks_book_title ON reading_forks (book_title);
CREATE INDEX idx_forks_domain ON reading_forks (domain);
CREATE INDEX idx_forks_status ON reading_forks (status);
CREATE INDEX idx_forks_priority ON reading_forks (priority);
CREATE INDEX idx_forks_is_deleted ON reading_forks (is_deleted) WHERE is_deleted = false;

-- 4. 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reading_forks_updated_at
  BEFORE UPDATE ON reading_forks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 启用 Row Level Security
ALTER TABLE reading_forks ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略（MVP 阶段：允许匿名访问）
-- 后续加 auth 时，改为 USING (auth.uid() = user_id)
CREATE POLICY "Allow all operations for anon key" ON reading_forks
  FOR ALL
  USING (true)
  WITH CHECK (true);
