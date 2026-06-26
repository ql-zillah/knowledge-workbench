// ============================================================
// NotesPage：笔记管理页
// ============================================================
// 职责：
//   1. 创建文献笔记/永久笔记
//   2. 编辑、删除笔记
//   3. 按类型筛选
//   4. 照片上传
//   5. 成熟度标记
//   6. 从闪念捕获页跳转来时，自动填充预填内容
//
// 对应 PRD：REQ-NOTE-01~12
// ============================================================

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Note, NoteType, Maturity, ParaItem } from '@/types'

export function NotesPage() {
  const location = useLocation()

  // 视图状态：列表视图 / 编辑视图
  const [view, setView] = useState<'list' | 'edit'>('list')
  // 当前编辑的笔记（null 表示新建）
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  // 列表数据
  const [notes, setNotes] = useState<Note[]>([])
  const [filter, setFilter] = useState<'all' | NoteType>('all')
  const [loading, setLoading] = useState(true)

  // PARA 分类项（供笔记关联选择）
  const [paraItems, setParaItems] = useState<ParaItem[]>([])

  // 从闪念捕获页跳转来时，location.state 会携带预填数据
  // 对应 PRD REQ-CAP-06：批量整理为文献笔记
  const navState = location.state as {
    mode?: 'new'
    prefill?: Partial<Note>
  } | null

  useEffect(() => {
    loadNotes()
    loadParaItems()
    // 如果有预填数据，自动进入编辑模式
    if (navState?.mode === 'new' && navState.prefill) {
      setEditingNote(null)
      setView('edit')
    }
  }, [])

  async function loadNotes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('加载笔记失败:', error)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  async function loadParaItems() {
    const { data } = await supabase
      .from('para_items')
      .select('*')
      .order('category')
    setParaItems(data || [])
  }

  function handleNew() {
    setEditingNote(null)
    setView('edit')
  }

  function handleEdit(note: Note) {
    setEditingNote(note)
    setView('edit')
  }

  async function handleDelete(note: Note) {
    if (!confirm('确定删除这条笔记？')) return

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', note.id)

    if (error) {
      alert('删除失败')
    } else {
      setNotes(notes.filter(n => n.id !== note.id))
    }
  }

  // 保存成功后回到列表
  function handleSaved() {
    setView('list')
    loadNotes()
  }

  // 列表视图
  if (view === 'list') {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">📖 笔记管理</h1>
          <button onClick={handleNew} className="btn-primary text-sm">
            ✍️ 写新笔记
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-6">文献笔记 · 永久笔记</p>

        {/* 类型筛选 Tab */}
        <div className="flex gap-2 mb-5">
          {([
            { key: 'all', label: '全部' },
            { key: 'literature', label: '📖 文献笔记' },
            { key: 'permanent', label: '💎 永久笔记' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-primary-light text-primary'
                  : 'text-text-secondary hover:bg-[#F5F0E8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 笔记列表 */}
        {loading ? (
          <p className="text-text-muted text-sm">加载中…</p>
        ) : notes.length === 0 ? (
          <div className="card text-center py-12 text-text-muted">
            还没有笔记，点击「写新笔记」开始记录 ✨
          </div>
        ) : (
          <div className="space-y-3">
            {notes
              .filter(n => filter === 'all' || n.type === filter)
              .map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => handleEdit(note)}
                  onDelete={() => handleDelete(note)}
                />
              ))}
          </div>
        )}
      </div>
    )
  }

  // 编辑视图
  return (
    <NoteEditor
      note={editingNote}
      prefill={navState?.prefill}
      paraItems={paraItems}
      onSaved={handleSaved}
      onCancel={() => setView('list')}
    />
  )
}

// ============================================================
// NoteCard：笔记卡片
// ============================================================
const typeConfig: Record<NoteType, { label: string; bg: string; color: string }> = {
  literature: { label: '📖 文献', bg: 'bg-secondary-light', color: 'text-secondary' },
  permanent: { label: '💎 永久', bg: 'bg-purple-light', color: 'text-purple' },
  fleeting: { label: '💡 闪念', bg: 'bg-amber-light', color: 'text-amber' },
}

const maturityConfig: Record<Maturity, { label: string; icon: string }> = {
  draft: { label: '草稿', icon: '📝' },
  refined: { label: '提炼', icon: '🔧' },
  mature: { label: '成熟', icon: '✅' },
}

function NoteCard({ note, onEdit, onDelete }: {
  note: Note
  onEdit: () => void
  onDelete: () => void
}) {
  const type = typeConfig[note.type]
  const maturity = maturityConfig[note.maturity]

  return (
    <div className="group bg-[#FDFAF6] border border-border rounded-md p-5 transition-all hover:shadow-card-hover">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${type.bg} ${type.color}`}>
          {type.label}
        </span>
        <span className="text-xs text-text-muted">{maturity.icon} {maturity.label}</span>
      </div>

      <h3 className="font-bold text-base mb-1.5">{note.title}</h3>
      <p className="text-sm text-text-secondary line-clamp-2">{note.core_viewpoint}</p>

      {/* 标签 */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-[#F5F0E8] rounded text-text-secondary">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-text-muted">
          {new Date(note.updated_at).toLocaleDateString('zh-CN')}
        </span>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-xs text-secondary hover:underline">编辑</button>
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 hover:underline">删除</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// NoteEditor：笔记编辑器
// ============================================================
function NoteEditor({ note, prefill, paraItems, onSaved, onCancel }: {
  note: Note | null
  prefill?: Partial<Note>
  paraItems: ParaItem[]
  onSaved: () => void
  onCancel: () => void
}) {
  // 表单状态
  // 如果是编辑已有笔记，用笔记数据初始化；如果是新建且有预填，用预填数据；否则用默认值
  const [type, setType] = useState<NoteType>(note?.type ?? prefill?.type ?? 'literature')
  const [title, setTitle] = useState(note?.title ?? '')
  const [coreViewpoint, setCoreViewpoint] = useState(note?.core_viewpoint ?? prefill?.core_viewpoint ?? '')
  const [myUnderstanding, setMyUnderstanding] = useState(note?.my_understanding ?? '')
  const [knowledgeLinks, setKnowledgeLinks] = useState(note?.knowledge_links ?? '')
  const [source, setSource] = useState(note?.source ?? prefill?.source ?? '')
  const [tags, setTags] = useState((note?.tags ?? []).join(', '))
  const [maturity, setMaturity] = useState<Maturity>(note?.maturity ?? 'draft')
  const [paraItemId, setParaItemId] = useState(note?.para_item_id ?? '')
  const [photos, setPhotos] = useState<string[]>(note?.photos ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // REQ-NOTE-04：照片上传与压缩
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    // REQ-NOTE-05：最多 9 张
    if (photos.length + files.length > 9) {
      alert('最多上传 9 张照片')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const newPhotos: string[] = []

    for (const file of Array.from(files)) {
      // 压缩图片
      const compressed = await compressImage(file, 1920, 0.8)
      if (!compressed) continue

      // 上传到 Supabase Storage
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('note-photos')
        .upload(fileName, compressed)

      if (uploadError) {
        console.error('上传失败:', uploadError)
        continue
      }

      // 获取签名 URL
      const { data: urlData } = supabase.storage
        .from('note-photos')
        .getPublicUrl(fileName)

      newPhotos.push(urlData.publicUrl)
    }

    setPhotos([...photos, ...newPhotos])
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  // 保存笔记
  async function handleSave() {
    // REQ-NOTE-07：必填项校验
    if (!title.trim()) {
      setError('请填写标题')
      return
    }
    if (!coreViewpoint.trim()) {
      setError('请填写核心观点')
      return
    }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean)

    const payload = {
      user_id: user?.id,
      type,
      title: title.trim(),
      core_viewpoint: coreViewpoint.trim(),
      my_understanding: myUnderstanding.trim() || null,
      knowledge_links: knowledgeLinks.trim() || null,
      source: type === 'literature' ? (source.trim() || null) : null,
      tags: tagArray,
      maturity,
      para_item_id: paraItemId || null,
      para_category: paraItems.find(p => p.id === paraItemId)?.category ?? null,
      photos,
    }

    if (note) {
      // 编辑
      const { error } = await supabase
        .from('notes')
        .update(payload)
        .eq('id', note.id)
      if (error) setError('保存失败: ' + error.message)
      else onSaved()
    } else {
      // 新建
      const { error } = await supabase
        .from('notes')
        .insert(payload)
      if (error) setError('保存失败: ' + error.message)
      else onSaved()
    }

    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          {note ? '编辑笔记' : '✍️ 写一条新笔记'}
        </h1>
        <button onClick={onCancel} className="text-sm text-text-secondary hover:underline">
          ← 返回列表
        </button>
      </div>

      <div className="card space-y-4">
        {/* 笔记类型 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">笔记类型</label>
          <div className="flex gap-2">
            {([
              { key: 'literature', label: '📖 文献笔记', desc: '阅读后的理解' },
              { key: 'permanent', label: '💎 永久笔记', desc: '自己的观点和框架' },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex-1 p-3 rounded-md text-sm font-semibold border transition-all ${
                  type === t.key
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-border hover:border-text-muted'
                }`}
              >
                <div>{t.label}</div>
                <div className="text-xs text-text-muted font-normal mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 标题 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">标题 *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="给这条笔记起个名字"
            className="form-input"
          />
        </div>

        {/* 核心观点 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            📌 核心观点（一句话概括）*
          </label>
          <input
            value={coreViewpoint}
            onChange={e => setCoreViewpoint(e.target.value)}
            placeholder="这条笔记最核心的一句话"
            className="form-input"
          />
        </div>

        {/* 我的理解 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            我的理解（用自己的话写）
          </label>
          <textarea
            value={myUnderstanding}
            onChange={e => setMyUnderstanding(e.target.value)}
            placeholder="用自己的话复述，不要照抄原文"
            className="form-textarea min-h-[120px]"
          />
        </div>

        {/* 知识关联 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            🔗 知识关联（和已有知识的联系）
          </label>
          <input
            value={knowledgeLinks}
            onChange={e => setKnowledgeLinks(e.target.value)}
            placeholder="这条笔记和哪些已有知识相关？"
            className="form-input"
          />
        </div>

        {/* 来源（仅文献笔记） */}
        {type === 'literature' && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">📎 来源</label>
            <textarea
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="书名、文章链接、作者等"
              className="form-textarea min-h-[60px]"
            />
          </div>
        )}

        {/* 标签 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            🏷️ 标签（用逗号分隔）
          </label>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="学习方法, 认知科学, ..."
            className="form-input"
          />
        </div>

        {/* PARA 分类 */}
        {paraItems.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">📂 PARA 分类</label>
            <select
              value={paraItemId}
              onChange={e => setParaItemId(e.target.value)}
              className="form-input cursor-pointer"
            >
              <option value="">不分类</option>
              {(['project', 'area', 'resource', 'archive'] as const).map(cat => {
                const items = paraItems.filter(p => p.category === cat)
                if (items.length === 0) return null
                const catLabel = { project: 'P·项目', area: 'A·领域', resource: 'R·资源', archive: '📦 归档' }
                return (
                  <optgroup key={cat} label={catLabel[cat]}>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>
        )}

        {/* 成熟度 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">成熟度</label>
          <div className="flex gap-2">
            {([
              { key: 'draft', label: '📝 草稿' },
              { key: 'refined', label: '🔧 提炼' },
              { key: 'mature', label: '✅ 成熟' },
            ] as const).map(m => (
              <button
                key={m.key}
                onClick={() => setMaturity(m.key)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold border transition-all ${
                  maturity === m.key
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-border text-text-secondary'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 照片上传 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            📷 笔记照片（手写笔记拍照上传）
          </label>
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div key={i} className="relative w-24 h-24 group">
                <img src={url} alt={`照片${i+1}`} className="w-full h-full object-cover rounded-md border border-border" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 9 && (
              <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary hover:bg-primary-light transition-all">
                <span className="text-2xl text-text-muted">+</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">支持多选，照片会自动压缩后保存。建议单张不超过 2MB。</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? '保存中…' : '💾 保存笔记'}
          </button>
          <button onClick={onCancel} className="btn-secondary">取消</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 图片压缩工具函数
// ============================================================
// 用 Canvas API 将图片压缩到指定尺寸和质量
// 对应 PRD REQ-NOTE-04：自动将照片压缩至单张不超过 2MB
async function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob | null> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality)
      }
      img.onerror = () => resolve(null)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}
