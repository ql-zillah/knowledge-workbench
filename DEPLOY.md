# 知识管理工作台 · Phase 1 部署指南

## 当前项目状态

✅ 全部 7 个功能模块已实现
✅ TypeScript 类型检查零错误
✅ Vite 构建通过
✅ Supabase 数据库已就绪
✅ Supabase 密钥已验证有效
✅ AI 周报改为前端直接调用 DeepSeek（无需部署 Edge Function）

## 第一步：配置 Supabase Auth

1. 打开 Supabase Dashboard → **Authentication** → **Providers**
2. 确认 **Email** 已启用
3. 进入 **Authentication** → **Settings**（或 Policies）
4. **关闭 "Confirm email"**（这样注册后直接登录，不需要点确认邮件）
5. 如果想限制注册，可以开启 "Allow only specified emails"

---

## 第二步：部署前端到 Vercel

### 2.1 把代码推到 GitHub

由于你没有本地环境，用以下方式：

1. 在 GitHub 创建一个新仓库，比如 `knowledge-workbench`
2. 在仓库页面点击 **uploading an existing file**
3. 把 `knowledge-workbench` 目录下的所有文件拖拽上传（**不要上传 `node_modules` 和 `.env.local`**）
4. 确认 `.gitignore` 文件已上传（它会排除 node_modules 等）

### 2.2 在 Vercel 部署

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录
2. 点击 **Add New** → **Project**
3. 选择你刚创建的 `knowledge-workbench` 仓库
4. Framework Preset 选择 **Vite**
5. 在 **Environment Variables** 中添加：
   - `VITE_SUPABASE_URL` = `https://jpdgeqmpmujcyyofubga.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_4qOaR7BNHgqi5Lk1FtHHQw_EhdruMOi`
6. 点击 **Deploy**
7. 等待 1-2 分钟，部署完成后会给你一个 URL（如 `https://knowledge-workbench.vercel.app`）

---

## 第三步：验证功能

打开 Vercel 部署的 URL，依次验证：

| 验证项 | 操作 | 预期结果 |
|--------|------|---------|
| 注册 | 输入邮箱+密码注册 | 注册成功，进入闪念页 |
| 闪念捕获 | 输入触发句，保存 | 列表出现新闪念 |
| 写笔记 | 点击"写新笔记"，填写内容 | 保存成功，列表可见 |
| PARA 分类 | 添加分类项 | 四个区域正确显示 |
| 产出记录 | 记录一次产出 | 列表出现新记录 |
| 每周复盘 | 填写复盘内容 | 保存成功 |
| AI 周报 | 先在设置中配 DeepSeek Key，再生成周报 | 流式输出 AI 周报 |
| 设置 | 保存 API Key 和个人信息 | 保存成功，掩码显示 |
| 数据导出 | 点击导出 | 下载 JSON 文件 |
| 数据隔离 | 用另一个邮箱注册 | 看不到之前账号的数据 |

---

## 第四步：后续优化

Phase 1 上线后，可以继续：

- **Phase 2**：双链 + 知识图谱 + RAG 问答（简历最强亮点）
- **Phase 3**：PWA 离线 + 性能优化 + CI/CD

---

## 常见问题

### Q: 注册后没自动登录？
A: 检查 Supabase Dashboard → Authentication → Settings 中是否关闭了 "Confirm email"。

### Q: AI 周报生成失败？
A: 1) 确认在设置页保存了 DeepSeek API Key；2) 确认本周有笔记数据；3) 确认 DeepSeek API Key 有效。

### Q: 照片上传失败？
A: 确认 Supabase Storage 中 `note-photos` bucket 已创建（SQL 脚本已自动创建）。

### Q: 页面白屏？
A: 打开浏览器开发者工具（F12）→ Console，查看错误信息。最常见原因是环境变量没配。
