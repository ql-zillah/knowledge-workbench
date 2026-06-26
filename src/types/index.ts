// ============================================================
// 类型定义：与数据库表结构一一对应
// ============================================================
// 这里的每个 interface 对应 Supabase 里的一张表
// TypeScript 的核心价值：让前端代码"知道"数据长什么样
// 如果数据库字段名拼错了，编译时就会报错，而不是等运行时才白屏
// ============================================================

// 笔记类型
export type NoteType = 'fleeting' | 'literature' | 'permanent'

// 笔记成熟度
export type Maturity = 'draft' | 'refined' | 'mature'

// PARA 分类
export type ParaCategory = 'project' | 'area' | 'resource' | 'archive'

// 产出类型
export type OutputType = 'article' | 'feynman' | 'project' | 'presentation' | 'other'

// 用户配置
export interface UserSettings {
  user_id: string
  nickname: string | null
  main_goal: string | null
  current_tools: string | null
  deepseek_api_key: string | null
  openai_api_key: string | null
  created_at: string
  updated_at: string
}

// 笔记
export interface Note {
  id: string
  user_id: string
  type: NoteType
  title: string
  core_viewpoint: string
  my_understanding: string | null
  knowledge_links: string | null
  source: string | null
  tags: string[]
  maturity: Maturity
  para_category: ParaCategory | null
  para_item_id: string | null
  photos: string[]
  content_plain: string | null
  created_at: string
  updated_at: string
}

// 闪念笔记
export interface FleetingNote {
  id: string
  user_id: string
  trigger_text: string
  my_view: string | null
  promoted_to: string | null  // 整理为文献笔记后，关联的 note id
  created_at: string
}

// PARA 分类项
export interface ParaItem {
  id: string
  user_id: string
  category: ParaCategory
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

// 产出记录
export interface Output {
  id: string
  user_id: string
  type: OutputType
  title: string
  description: string | null
  reflection: string | null
  linked_note_ids: string[]
  created_at: string
}

// 每周复盘
export interface Review {
  id: string
  user_id: string
  week_start: string  // ISO 日期
  week_end: string
  key_takeaways: string | null
  connections: string | null
  output_summary: string | null
  next_actions: string | null
  ai_summary: string | null
  created_at: string
  updated_at: string
}
