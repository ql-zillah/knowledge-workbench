// ============================================================
// CapturePage：闪念捕获页
// ============================================================
// 职责：
//   1. 快速记录闪念（触发句 + 我的观点）
//   2. 显示闪念列表
//   3. 选择多条闪念 → 整理为文献笔记
//   4. 删除闪念
//
// 对应 PRD：
//   REQ-CAP-01~08
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { FleetingNote } from '@/types'

export function CapturePage() {
  const navigate = useNavigate()

  // 表单状态
  const [triggerText, setTriggerText] = useState('')
  const [myView, setMyView] = useState('')
  const [saving, setSaving] = useState(false)

  // 闪念列表
  const [notes, setNotes] = useState<FleetingNote[]>([])
  const [loading, setLoading] = useState(true)

  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  // 加载闪念列表
  useEffect(() => {
    loadNotes()
  }, [])

  async function loadNotes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('fleeting_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('加载闪念失败:', error)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  // REQ-CAP-02：保存闪念
  async function handleSave() {
    // REQ-CAP-03：空内容校验
    if (!triggerText.trim()) {
      alert('请先写下触发内容')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('fleeting_notes')
      .insert({
        trigger_text: triggerText.trim(),
        my_view: myView.trim() || null,
        user_id: user?.id,
      })

    if (error) {
      // REQ-CAP-08：网络异常处理
      alert('保存失败，请检查网络')
    } else {
      // 清空表单 + 刷新列表
      setTriggerText('')
      setMyView('')
      await loadNotes()
    }
    setSaving(false)
  }

  // REQ-CAP-06：批量整理为文献笔记
  function handlePromote() {
    if (selectedIds.size === 0) return
    // 将选中的闪念内容拼接到 URL 参数中，传递给笔记新建页
    const selected = notes.filter(n => selectedIds.has(n.id))
    const combinedSource = selected.map(n => n.trigger_text).join('\n---\n')
    const combinedView = selected.map(n => n.my_view).filter(Boolean).join('\n---\n')
    navigate('/notes', {
      state: {
        mode: 'new',
        prefill: {
          type: 'literature',
          source: combinedSource,
          core_viewpoint: combinedView || '',
        }
      }
    })
  }

  // REQ-CAP-07：删除闪念
  async function handleDelete(id: string) {
    if (!confirm('确定删除这条闪念？')) return

    const { error } = await supabase
      .from('fleeting_notes')
      .delete()
      .eq('id', id)

    if (error) {
      alert('删除失败')
    } else {
      setNotes(notes.filter(n => n.id !== id))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // 切换选择
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">💡 闪念捕获</h1>
      <p className="text-sm text-text-secondary mb-6">
        3 秒内记录灵感，不让它溜走
      </p>

      {/* 快速捕获表单 */}
      <div className="card">
        <div className="space-y-3">
          <input
            value={triggerText}
            onChange={(e) => setTriggerText(e.target.value)}
            placeholder="触发句 / 原文摘录"
            className="form-input"
            onKeyDown={(e) => {
              // Ctrl/Cmd + Enter 快速保存
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave()
            }}
          />
          <input
            value={myView}
            onChange={(e) => setMyView(e.target.value)}
            placeholder="我的一个观点（选填）"
            className="form-input"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full justify-center"
          >
            {saving ? '保存中…' : '💾 保存闪念'}
          </button>
        </div>
      </div>

      {/* 闪念列表 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold">
          闪念列表
          {!loading && <span className="text-text-muted ml-2">({notes.length})</span>}
        </h2>
        {notes.length > 0 && (
          <button
            onClick={() => {
              setSelectMode(!selectMode)
              setSelectedIds(new Set())
            }}
            className="text-sm text-secondary hover:underline"
          >
            {selectMode ? '取消选择' : '批量整理'}
          </button>
        )}
      </div>

      {/* 批量操作栏 */}
      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-amber-light px-4 py-3 rounded-md mb-3">
          <span className="text-sm font-semibold text-amber">
            已选 {selectedIds.size} 条
          </span>
          <div className="flex gap-2">
            <button onClick={handlePromote} className="btn-primary text-xs">
              📝 整理为文献笔记
            </button>
          </div>
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <p className="text-text-muted text-sm">加载中…</p>
      ) : notes.length === 0 ? (
        <div className="card text-center py-12 text-text-muted">
          还没有闪念，开始记录吧 ✨
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`flex gap-3 items-start p-4 rounded-md border transition-all ${
                selectedIds.has(note.id)
                  ? 'border-amber bg-amber-light'
                  : 'border-border bg-[#FFFBF5] hover:shadow-card-hover'
              }`}
            >
              {/* 选择框 */}
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(note.id)}
                  onChange={() => toggleSelect(note.id)}
                  className="mt-1 w-4 h-4 accent-amber cursor-pointer"
                />
              )}

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{note.trigger_text}</p>
                {note.my_view && (
                  <p className="text-sm text-text-secondary mt-1">{note.my_view}</p>
                )}
                <p className="text-xs text-text-muted mt-2">
                  {new Date(note.created_at).toLocaleString('zh-CN')}
                </p>
              </div>

              {/* 删除按钮 */}
              {!selectMode && (
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-xs text-red-400 hover:text-red-600 hover:underline px-2 py-1 rounded hover:bg-red-50 transition-all"
                >
                  删除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
