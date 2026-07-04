// ============================================================
// 阅读岔路管理 — 核心类型定义
// ============================================================

// --- 岔路状态 ---
export type ForkStatus = 'open' | 'exploring' | 'resolved' | 'archived';

// --- 核心实体：阅读岔路 ---
// 四个维度映射到数据库字段：
//   位置锚定: book_title, author, chapter, page_number, page_range
//   分支标记: domain, sub_domain, tags
//   思维快照: thought, inspiration
//   上下文关联: original_quote, relationship
export interface ReadingFork {
  id: string;
  created_at: string;  // ISO 8601
  updated_at: string;

  // 位置锚定 (Position Anchor)
  book_title: string;         // 书名 — 唯一必填字段
  author: string | null;
  chapter: string | null;
  page_number: number | null;
  page_range: string | null;
  reading_session: string;

  // 分支标记 (Branch Marker)
  domain: string;
  sub_domain: string;
  tags: string[];

  // 思维快照 (Thought Snapshot)
  thought: string;            // 当时在想什么 — 灵感捕获的核心
  inspiration: string;

  // 上下文关联 (Context Association)
  original_quote: string;     // 触发岔路的原文摘录
  relationship: string;       // 岔路与原文的关系

  // 状态管理
  status: ForkStatus;
  priority: number;           // 1-5
  is_deleted: boolean;
}

// --- 快速表单（阅读中捕捉，4 个核心字段） ---
export interface QuickForkForm {
  book_title: string;
  page_number: string;    // string 类型方便 input 绑定
  domain: string;
  thought: string;
}

// --- 完整表单（事后补充，所有字段） ---
export interface FullForkForm {
  book_title: string;
  author: string;
  chapter: string;
  page_number: string;
  page_range: string;
  reading_session: string;
  domain: string;
  sub_domain: string;
  tags: string;           // 逗号分隔输入，保存时转数组
  thought: string;
  inspiration: string;
  original_quote: string;
  relationship: string;
  priority: number;
  status: ForkStatus;
}

// --- API 输入/输出 ---
export interface ForkCreateInput {
  book_title: string;
  page_number?: number | null;
  domain?: string;
  thought?: string;
  // 其他字段可选
  [key: string]: unknown;
}

// --- 筛选条件 ---
export interface ForkFilters {
  book_title?: string;
  domain?: string;
  status?: ForkStatus;
  priority?: number;
  search?: string;
  sort_by?: 'created_at' | 'priority' | 'book_title';
  sort_order?: 'asc' | 'desc';
}

// --- 空表单默认值 ---
export const EMPTY_QUICK_FORM: QuickForkForm = {
  book_title: '',
  page_number: '',
  domain: '',
  thought: '',
};

export const EMPTY_FULL_FORM: FullForkForm = {
  book_title: '',
  author: '',
  chapter: '',
  page_number: '',
  page_range: '',
  reading_session: '',
  domain: '',
  sub_domain: '',
  tags: '',
  thought: '',
  inspiration: '',
  original_quote: '',
  relationship: '',
  priority: 3,
  status: 'open',
};

// --- 状态标签映射 ---
export const STATUS_LABELS: Record<ForkStatus, string> = {
  open: '待探索',
  exploring: '探索中',
  resolved: '已解决',
  archived: '已归档',
};

export const STATUS_COLORS: Record<ForkStatus, string> = {
  open: 'bg-amber-100 text-amber-800',
  exploring: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-500',
};
