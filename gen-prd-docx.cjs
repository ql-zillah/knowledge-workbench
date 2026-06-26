const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak
} = require("docx");

// ============================================================
// 辅助函数
// ============================================================

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function makeCell(text, opts = {}) {
  const { bold, shading, width } = opts;
  return new TableCell({
    borders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, font: "Microsoft YaHei", size: 20 })],
      }),
    ],
  });
}

function makeCellWithRuns(runs, opts = {}) {
  const { shading, width } = opts;
  return new TableCell({
    borders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: runs.map(r => new TextRun({ font: "Microsoft YaHei", size: 20, ...r })),
      }),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 32, bold: true, color: "2B579A" })],
    spacing: { before: 360, after: 200 },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 28, bold: true, color: "2B579A" })],
    spacing: { before: 280, after: 160 },
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 24, bold: true, color: "333333" })],
    spacing: { before: 200, after: 120 },
  });
}

function para(text, opts = {}) {
  const { bold, indent } = opts;
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    indent: indent ? { left: 720 } : undefined,
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 21, bold })],
  });
}

function bulletItem(text, level = 0) {
  const indentValues = [720, 1080, 1440];
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 80, line: 360 },
    indent: { left: indentValues[level] + 360 },
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 21 })],
  });
}

function numberedItem(text, level = 0) {
  const indentValues = [720, 1080, 1440];
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { after: 80, line: 360 },
    indent: { left: indentValues[level] + 360 },
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 21 })],
  });
}

function metaTable(rows) {
  const colW = [2000, 7360];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colW,
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          makeCell(label, { bold: true, shading: "F5F5F5", width: colW[0] }),
          makeCell(value, { width: colW[1] }),
        ],
      })
    ),
  });
}

function dataTable(headers, rows) {
  const colW = headers.map(() => Math.floor(9360 / headers.length));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colW,
    rows: [
      new TableRow({
        children: headers.map((h, i) =>
          makeCell(h, { bold: true, shading: "D5E8F0", width: colW[i] })
        ),
      }),
      ...rows.map(row =>
        new TableRow({
          children: row.map((cell, i) => makeCell(cell, { width: colW[i] })),
        })
      ),
    ],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ============================================================
// 文档内容
// ============================================================

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Microsoft YaHei", size: 21 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Microsoft YaHei", color: "2B579A" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Microsoft YaHei", color: "2B579A" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Microsoft YaHei", color: "333333" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
          { level: 2, format: LevelFormat.BULLET, text: "\u25AA", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [
    // ============================================================
    // 封面
    // ============================================================
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 3600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "知识管理工作台", font: "Microsoft YaHei", size: 56, bold: true, color: "E07B5A" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "产品需求文档（PRD）", font: "Microsoft YaHei", size: 36, bold: true, color: "333333" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: "Phase 2：AI 深度 + 知识网络", font: "Microsoft YaHei", size: 28, color: "5B8FA8" })],
        }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "版本：v1.0 | 状态：待评审 | 日期：2025-07-09", font: "Microsoft YaHei", size: 21, color: "888888" })],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "基于 Zettelkasten 渐进式笔记 + PARA 分类法 + DeepSeek AI", font: "Microsoft YaHei", size: 18, color: "AAAAAA", italics: true })],
        }),
      ],
    },

    // ============================================================
    // 修订记录
    // ============================================================
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E07B5A", space: 1 } },
              children: [new TextRun({ text: "知识管理工作台 · Phase 2 PRD", font: "Microsoft YaHei", size: 16, color: "999999" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "第 ", font: "Microsoft YaHei", size: 16, color: "999999" }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Microsoft YaHei", size: 16, color: "999999" }),
                new TextRun({ text: " 页", font: "Microsoft YaHei", size: 16, color: "999999" }),
              ],
            }),
          ],
        }),
      },
      children: [

        heading1("修订记录"),
        dataTable(
          ["版本", "日期", "修改内容", "修改人"],
          [
            ["v1.0", "2025-07-09", "初始创建，覆盖 Phase 2 全部需求", "产品负责人"],
          ]
        ),

        para(""),

        heading1("目录"),
        para("（请在 Word 中右键此处 → 更新域 → 更新整个目录）"),
        para(""),

        heading1("1. 项目背景"),

        heading2("1.1 Phase 1 回顾"),
        para("Phase 1（MVP）已完成基础 CRUD + 用户体系 + AI 周报，覆盖以下功能模块："),
        bulletItem("用户认证：注册、登录、退出、RLS 数据隔离"),
        bulletItem("闪念捕获：快速记录、批量整理为文献笔记"),
        bulletItem("笔记管理：文献笔记/永久笔记创建、编辑、筛选、删除、照片上传、成熟度标记"),
        bulletItem("PARA 分类：项目/领域/资源/归档四类管理、笔记关联与计数"),
        bulletItem("产出记录：五种类型产出、输出飞轮"),
        bulletItem("每周复盘：手动填写 + AI 流式周报 + 历史记录"),
        bulletItem("设置：API Key 配置、个人信息、数据导出"),
        para("Phase 1 验收通过率：100%（19/19 项）。"),

        heading2("1.2 现状与问题"),
        para("Phase 1 虽然功能完整，但缺少 PKM 工具最核心的两个能力："),
        bulletItem('知识连接：无双链、无图谱——笔记之间孤立，无法形成知识网络。Zettelkasten 的核心价值就是"笔记间的连接"，缺少双链等于缺少灵魂。'),
        bulletItem('AI 深度交互：AI 仅用于周报总结，未发挥全语料 RAG 能力——用户无法基于自己的知识库提问、无法用自然语言搜索。'),
        para("这两个能力也是简历中最亮眼的差异化技术点。"),

        heading2("1.3 竞品参考"),
        para("调研 11 款主流 PKM 工具（Notion / Obsidian / Roam Research / Logseq / Flomo / Heptabase / Capacities / 思源笔记 / 语雀 / Reflect / Mem），发现："),
        bulletItem("双链+图谱已成 PKM 标配（11 款中 9 款支持双链）"),
        bulletItem("AI 正从附加层走向原生架构（Mem/Reflect 全语料 AI，Notion AI 按页面工作）"),
        bulletItem("AI 原生 x Zettelkasten x 个人自用的轻量组合存在市场空白"),

        pageBreak(),

        heading1("2. 产品目标"),

        heading2("2.1 业务目标"),
        dataTable(
          ["目标", "描述", "衡量指标"],
          [
            ["知识连接", "笔记之间能建立双向链接", "双链创建成功率 100%"],
            ["知识可视化", "用户能看到笔记关系图谱", "图谱渲染 100 节点 < 2s"],
            ["语义检索", "支持自然语言搜索笔记", "搜索结果 Top-5 准确率 > 80%"],
            ["AI 问答", "能基于全库笔记回答问题", "引用溯源准确率 100%"],
            ["自动标签", "AI 自动为笔记打标签", "标签建议接受率 > 60%"],
          ]
        ),

        heading2("2.2 非目标（本期明确不做）"),
        bulletItem("PWA 离线支持（Phase 3）"),
        bulletItem("性能极致优化（Phase 3）"),
        bulletItem("移动端原生 App"),
        bulletItem("多用户协作"),

        heading1("3. 用户故事"),

        heading2("Epic 8：双向链接"),
        dataTable(
          ["ID", "用户故事", "优先级"],
          [
            ["US-8.1", "在笔记编辑器中输入 [[ 能搜索已有笔记并插入链接", "Must"],
            ["US-8.2", "点击笔记中的链接能跳转到对应笔记", "Must"],
            ["US-8.3", "每篇笔记底部显示\"反向链接\"（哪些笔记引用了这篇）", "Must"],
            ["US-8.4", "链接关系自动存储，编辑时实时更新", "Must"],
          ]
        ),

        heading2("Epic 9：知识图谱"),
        dataTable(
          ["ID", "用户故事", "优先级"],
          [
            ["US-9.1", "在 PARA 页看到笔记关系图谱，节点可拖拽", "Must"],
            ["US-9.2", "点击图谱节点跳转到对应笔记", "Must"],
            ["US-9.3", "图谱自动布局，支持缩放和平移", "Must"],
          ]
        ),

        heading2("Epic 10：语义搜索"),
        dataTable(
          ["ID", "用户故事", "优先级"],
          [
            ["US-10.1", "搜索框支持自然语言输入（如\"关于学习方法的笔记\"）", "Must"],
            ["US-10.2", "搜索结果按相关度排序，高亮匹配片段", "Must"],
            ["US-10.3", "笔记创建/更新时自动生成 Embedding", "Must"],
          ]
        ),

        heading2("Epic 11：RAG 问答"),
        dataTable(
          ["ID", "用户故事", "优先级"],
          [
            ["US-11.1", "在 AI 对话框输入问题，基于全库笔记回答", "Must"],
            ["US-11.2", "回答附带引用来源，点击跳转到原笔记", "Must"],
            ["US-11.3", "支持流式输出回答", "Must"],
          ]
        ),

        heading2("Epic 12：AI 自动标签"),
        dataTable(
          ["ID", "用户故事", "优先级"],
          [
            ["US-12.1", "为笔记批量生成标签建议", "Should"],
            ["US-12.2", "用户可选择接受/修改建议标签", "Should"],
          ]
        ),

        pageBreak(),

        heading1("4. 功能清单"),

        heading2("4.1 功能总览"),
        dataTable(
          ["模块", "功能", "优先级", "对应用户故事"],
          [
            ["双链", "编辑器 [[ 语法 + 笔记搜索弹窗", "Must", "US-8.1"],
            ["双链", "链接渲染 + 点击跳转", "Must", "US-8.2"],
            ["双链", "反向链接面板", "Must", "US-8.3"],
            ["双链", "链接关系自动存储（note_links 表）", "Must", "US-8.4"],
            ["图谱", "React Flow 节点关系图", "Must", "US-9.1"],
            ["图谱", "节点点击跳转笔记", "Must", "US-9.2"],
            ["图谱", "自动布局、缩放、平移", "Must", "US-9.3"],
            ["语义搜索", "全局搜索框 + 自然语言输入", "Must", "US-10.1"],
            ["语义搜索", "向量相似度排序 + 结果高亮", "Must", "US-10.2"],
            ["语义搜索", "笔记自动 Embedding（Edge Function）", "Must", "US-10.3"],
            ["RAG 问答", "AI 对话界面（Chat with Notes）", "Must", "US-11.1"],
            ["RAG 问答", "引用溯源 + 流式输出", "Must", "US-11.2,11.3"],
            ["自动标签", "AI 标签建议 + 批量应用", "Should", "US-12.1,12.2"],
          ]
        ),

        heading2("4.2 页面清单"),
        dataTable(
          ["页面", "变更类型", "说明"],
          [
            ["笔记编辑页", "修改", "编辑器支持 [[ 双链语法"],
            ["笔记详情页", "修改", "新增反向链接面板"],
            ["PARA 页", "修改", "新增[图谱视图] Tab（React Flow）"],
            ["全局导航", "修改", "新增 🔍 搜索入口 → 搜索面板"],
            ["AI 对话页", "新增", "Chat with Your Notes 界面"],
            ["设置页", "修改", "OpenAI Key 输入提示强化"],
          ]
        ),

        heading1("5. 详细需求（EARS 原则）"),

        para("本 PRD 遵循 EARS（Easy Approach to Requirements Syntax）原则撰写需求描述，用固定句式消除歧义：", { bold: true }),
        bulletItem(`Ubiquitous（始终约束）：系统始终满足的条件 —— \"The system shall...\"`),
        bulletItem(`Event-driven（事件触发）：某事件发生时的行为 —— \"When [event], the system shall...\"`),
        bulletItem(`Unwanted（异常处理）：异常情况时的行为 —— \"If [condition], then the system shall...\"`),
        bulletItem(`State-driven（状态驱动）：处于某状态时的行为 —— \"While [state], the system shall...\"`),
        bulletItem(`Optional（可选功能）：可选场景的行为 —— \"Where [feature], the system shall...\"`),

        heading2("5.1 双向链接"),

        heading3("REQ-LINK-01（Event-driven）"),
        para("When 用户在笔记编辑器中输入 [[，the system shall 弹出笔记搜索面板，支持输入关键词筛选已有笔记。"),

        heading3("REQ-LINK-02（Event-driven）"),
        para("When 用户从搜索结果中选择一条笔记，the system shall 在光标位置插入 [[笔记标题]] 格式的链接标记。"),

        heading3("REQ-LINK-03（Ubiquitous）"),
        para("The system shall 在笔记详情页将 [[笔记标题]] 渲染为可点击的蓝色链接。"),

        heading3("REQ-LINK-04（Event-driven）"),
        para("When 用户点击笔记中的 [[链接]]，the system shall 跳转到对应笔记的详情页。"),

        heading3("REQ-LINK-05（Event-driven）"),
        para("When 用户保存笔记，the system shall 解析内容中的 [[链接]]，在 note_links 表中创建/更新链接关系。"),

        heading3("REQ-LINK-06（Ubiquitous）"),
        para(`The system shall 在每篇笔记详情页底部显示\"反向链接\"面板，列出所有引用了当前笔记的其他笔记。`),

        heading3("REQ-LINK-07（Unwanted）"),
        para("If 链接目标笔记已被删除，then the system shall 将链接渲染为灰色失效样式，不显示跳转。"),

        heading2("5.2 知识图谱"),

        heading3("REQ-GRAPH-01（Ubiquitous）"),
        para(`The system shall 在 PARA 页新增\"图谱视图\" Tab，使用 React Flow 渲染所有笔记和链接关系。`),

        heading3("REQ-GRAPH-02（Ubiquitous）"),
        para("The system shall 将笔记渲染为节点（颜色按类型区分），链接关系渲染为边。"),

        heading3("REQ-GRAPH-03（Event-driven）"),
        para("When 用户点击图谱节点，the system shall 跳转到对应笔记详情页。"),

        heading3("REQ-GRAPH-04（Ubiquitous）"),
        para("The system shall 支持画布缩放（滚轮）和平移（拖拽），节点可自由拖拽重新布局。"),

        heading3("REQ-GRAPH-05（Unwanted）"),
        para(`If 图谱数据为空（无笔记或无链接），then the system shall 显示\"暂无知识连接\"空状态。`),

        heading2("5.3 语义搜索"),

        heading3("REQ-SEARCH-01（Ubiquitous）"),
        para("The system shall 在全局导航栏提供搜索入口（🔍 图标），点击展开搜索面板。"),

        heading3("REQ-SEARCH-02（Event-driven）"),
        para("When 用户输入搜索词并提交，the system shall 将查询文本向量化，通过 pgvector 余弦相似度检索 Top-10 相关笔记。"),

        heading3("REQ-SEARCH-03（Ubiquitous）"),
        para("The system shall 搜索结果按相似度降序排列，每条结果显示标题、核心观点片段、匹配关键词高亮。"),

        heading3("REQ-SEARCH-04（Event-driven）"),
        para("When 用户创建或更新笔记，the system shall 自动调用 Embedding API 生成向量并存入 note_embeddings 表。"),

        heading3("REQ-SEARCH-05（Unwanted）"),
        para(`If 搜索无结果（相似度均低于阈值），then the system shall 显示\"未找到相关笔记\"。`),

        heading3("REQ-SEARCH-06（Unwanted）"),
        para(`If OpenAI API Key 未配置，then the system shall 提示\"请先在设置中配置 OpenAI API Key\"。`),

        heading2("5.4 RAG 问答"),

        heading3("REQ-RAG-01（Event-driven）"),
        para("When 用户在 AI 对话框输入问题并发送，the system shall 执行 RAG 流程：问题向量化 → pgvector 检索 Top-5 → 拼接 Prompt → DeepSeek 流式生成。"),

        heading3("REQ-RAG-02（Ubiquitous）"),
        para("The system shall 在回答下方显示引用来源列表，每条引用标注笔记标题和匹配片段。"),

        heading3("REQ-RAG-03（Event-driven）"),
        para("When 用户点击引用来源，the system shall 跳转到对应笔记详情页。"),

        heading3("REQ-RAG-04（Ubiquitous）"),
        para("The system shall 以流式（SSE）方式输出 AI 回答，逐字显示。"),

        heading3("REQ-RAG-05（State-driven）"),
        para("While AI 回答正在生成，the system shall 显示加载动画，禁用发送按钮。"),

        heading3("REQ-RAG-06（Unwanted）"),
        para(`If 用户知识库无笔记数据，then the system shall 提示\"请先创建一些笔记，我才能帮你回答问题\"。`),

        heading2("5.5 AI 自动标签"),

        heading3("REQ-TAG-01（Optional）"),
        para(`Where 设置页配置了 DeepSeek API Key，the system shall 在笔记列表页提供\"AI 自动打标签\"按钮。`),

        heading3("REQ-TAG-02（Event-driven）"),
        para(`When 用户点击\"AI 自动打标签\"并选中一批笔记，the system shall 调用 DeepSeek 生成标签建议。`),

        heading3("REQ-TAG-03（Event-driven）"),
        para("When 用户确认标签建议，the system shall 批量更新笔记标签。"),

        pageBreak(),

        heading1("6. 流程说明"),

        heading2("6.1 双链创建流程"),
        para("用户在笔记编辑器输入 [[ → 弹出搜索面板 → 输入关键词筛选笔记 → 选择目标笔记 → 插入 [[笔记标题]] → 保存笔记 → 系统解析内容 → 更新 note_links 表 → 被引用笔记的反向链接自动更新"),

        heading2("6.2 RAG 问答流程"),
        para("用户输入问题 → 调用 OpenAI Embedding 向量化问题 → pgvector 余弦相似度检索 Top-5 → 拼接 Prompt（系统提示 + Top-5 笔记 + 用户问题） → DeepSeek 流式生成 → SSE 推送给前端 → 前端渲染 + 引用列表"),

        heading2("6.3 语义搜索流程"),
        para("用户输入搜索词 → OpenAI Embedding 向量化 → pgvector 余弦相似度检索 Top-10 → 按相关度排序 → 前端渲染结果 + 高亮匹配"),

        heading1("7. 交互说明"),

        heading2("7.1 新增页面流转"),
        para("全局导航栏新增 🔍 搜索图标和 💬 AI 对话入口。搜索面板以浮层形式展开，AI 对话以独立页面承载。"),

        heading2("7.2 双链交互"),
        bulletItem("输入 [[ 触发搜索面板（与 Notion/Obsidian 体验一致）"),
        bulletItem("搜索面板显示笔记标题列表，支持键盘上下选择、回车确认"),
        bulletItem("链接在阅读视图中渲染为蓝色下划线样式，hover 显示笔记预览卡片"),
        bulletItem("反向链接在笔记底部以列表形式展示，每条显示标题和关联片段"),

        heading2("7.3 图谱交互"),
        bulletItem("节点按笔记类型着色：文献=蓝色、永久=紫色、闪念=橙色"),
        bulletItem("节点大小按引用次数缩放：被引用越多节点越大"),
        bulletItem("默认使用力导向布局，用户可拖拽调整"),
        bulletItem("点击节点弹出预览卡片，双击跳转到笔记详情"),

        heading1("8. 边界场景与异常处理"),

        heading2("8.1 数据边界"),
        dataTable(
          ["场景", "处理方式"],
          [
            ["链接目标笔记被删除", "链接渲染为灰色失效样式"],
            ["图谱节点过多（> 500）", "仅显示前 500 个节点，提示用户使用搜索过滤"],
            ["Embedding API 调用超限", "笔记保存时不阻塞，Embedding 异步重试"],
            ["搜索词为空", "不发起请求，提示输入搜索词"],
          ]
        ),

        heading2("8.2 AI 异常"),
        dataTable(
          ["场景", "处理方式"],
          [
            ["OpenAI API Key 未配置", "提示用户先配置，跳转设置页"],
            ["DeepSeek API Key 未配置", "提示用户先配置"],
            ["RAG 检索无相关笔记", "提示\"未找到相关笔记，请尝试换个问法\""],
            ["AI 生成中断（网络/超时）", "显示已生成内容 + 重试按钮"],
          ]
        ),

        heading1("9. 验收标准"),

        dataTable(
          ["#", "验收项", "优先级"],
          [
            ["1", "编辑器输入 [[ 弹出搜索面板", "Must"],
            ["2", "搜索面板能按关键词筛选笔记", "Must"],
            ["3", "选择后插入 [[笔记标题]] 链接", "Must"],
            ["4", "链接渲染为蓝色可点击样式", "Must"],
            ["5", "点击链接跳转到对应笔记", "Must"],
            ["6", "保存笔记后 note_links 表有记录", "Must"],
            ["7", "笔记底部显示反向链接列表", "Must"],
            ["8", "删除笔记后反向链接不再显示", "Must"],
            ["9", "图谱页面渲染所有笔记节点和边", "Must"],
            ["10", "节点颜色按类型区分", "Must"],
            ["11", "点击节点跳转笔记", "Must"],
            ["12", "画布可缩放、平移、节点可拖拽", "Must"],
            ["13", "搜索框输入自然语言返回相关笔记", "Must"],
            ["14", "搜索结果按相关度排序", "Must"],
            ["15", "笔记创建后自动生成 Embedding", "Must"],
            ["16", "AI 对话框输入问题返回基于笔记的回答", "Must"],
            ["17", "回答附带引用来源", "Must"],
            ["18", "流式输出回答内容", "Must"],
            ["19", "引用可点击跳转原笔记", "Must"],
            ["20", "无笔记时 AI 提示友好", "Must"],
          ]
        ),

        heading1("10. 非功能性需求"),

        dataTable(
          ["指标", "要求"],
          [
            ["双链搜索响应", "< 200ms"],
            ["图谱渲染（100 节点）", "< 2s"],
            ["语义搜索（含 Embedding）", "< 1s"],
            ["RAG 首字延迟", "< 1.5s"],
            ["Embedding 异步", "不阻塞笔记保存"],
            ["新增依赖", "React Flow + OpenAI Embedding API"],
          ]
        ),

        heading1("11. 待确认问题"),

        dataTable(
          ["#", "问题", "影响范围", "建议方向"],
          [
            ["Q1", "双链语法用 [[双括号]] 还是 @提及 风格？", "编辑器实现", "建议 [[双括号]]，与 Obsidian/Roam 一致，用户认知成本低"],
            ["Q2", "Embedding 用 OpenAI 还是本地模型？", "成本/延迟", "建议 OpenAI text-embedding-3-small，1536 维，成本极低（$0.02/1M tokens）"],
            ["Q3", "图谱默认展示全量笔记还是按 PARA 分类？", "性能和 UX", "建议默认全量，提供分类筛选下拉框"],
            ["Q4", "RAG 问答页面放在导航栏还是独立入口？", "信息架构", "建议导航栏新增 💬 Tab"],
          ]
        ),

        pageBreak(),

        heading1("附录 A：产品经理思维速查"),

        para("在实践中遇到决策时，可以用以下思维框架：", { bold: true }),

        heading2("A.1 需求优先级判断：MoSCoW"),
        bulletItem("Must（必须）：没有就不能上线"),
        bulletItem("Should（应该）：很重要但可以等一版"),
        bulletItem("Could（可以）：锦上添花"),
        bulletItem("Won't（不做）：明确不做"),

        heading2("A.2 功能取舍：ROI 思维"),
        bulletItem("高价值 × 低成本 → 立刻做"),
        bulletItem("高价值 × 高成本 → 规划做（拆分迭代）"),
        bulletItem("低价值 × 低成本 → 有空做"),
        bulletItem("低价值 × 高成本 → 不做"),

        heading2("A.3 用户视角转换"),
        bulletItem(`错误："实现一个双链功能"`),
        bulletItem(`正确："作为一个用户，我希望能通过 [[ 快速引用已有笔记，以便建立知识连接"`),

        heading2("A.4 EARS 原则速查"),
        dataTable(
          ["类型", "句式", "适用场景"],
          [
            ["Ubiquitous", "The system shall...", "始终满足的约束"],
            ["Event-driven", "When [event], the system shall...", "事件触发的行为"],
            ["Unwanted", "If [condition], then the system shall...", "异常/故障处理"],
            ["State-driven", "While [state], the system shall...", "状态驱动的行为"],
            ["Optional", "Where [feature], the system shall...", "可选功能"],
          ]
        ),

        heading2("A.5 边界思考三问"),
        bulletItem("如果输入为空会怎样？"),
        bulletItem("如果网络断了会怎样？"),
        bulletItem("如果数据量很大（1000条）会怎样？"),

        heading2("A.6 验收思维"),
        bulletItem("正常流程能跑通吗？"),
        bulletItem("异常情况有提示吗？"),
        bulletItem("边界值不崩溃吗？"),
        bulletItem("别人看代码能理解吗？"),

        para(""),
        para(""),
        para("— 文档结束 —", { bold: true }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/workspace/知识管理工作台-PRD-Phase2-AI深度.docx", buffer);
  console.log("✅ DOCX 生成成功");
});
