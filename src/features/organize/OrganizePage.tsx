// ============================================================
// OrganizePage：PARA 知识分类页
// ============================================================
// 职责：
//   1. 展示 P/A/R/归档 四个分类区域
//   2. 每个分类下增删改查分类项
//   3. 显示每个分类的笔记数量
//
// 对应 PRD：REQ-PARA-01~06
// ============================================================

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { ParaItem, ParaCategory } from '@/types'
import { KnowledgeGraph } from './KnowledgeGraph'

// 分类配置
const categoryConfig: Record<ParaCategory, { label: string; icon: string; color: string; bg: string; desc: string }> = {
  project: { label: 'P · 项目', icon: '⚡', color: 'text-primary', bg: 'bg-primary-light', desc: '有截止日期的短期目标' },
  area: { label: 'A · 领域', icon: '📡', color: 'text-secondary', bg: 'bg-secondary-light', desc: '长期维护的责任领域' },
  resource: { label: 'R · 资源', icon: '📚', color: 'text-accent', bg: 'bg-accent-light', desc: '兴趣主题参考资料' },
  archive: { label: '归档', icon: '📦', color: 'text-text-muted', bg: 'bg-[#F5F0E8]', desc: '已完成或不再活跃' },
}

export function OrganizePage() {
  const [view, setView] = useState<'para' | 'graph'>('para')
  const [items, setItems] = useState<ParaItem[]>([])
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('para_items')
      .select('*')
      .order('sort_order')

    if (error) {
      console.error('加载分类失败:', error)
    } else {
      setItems(data || [])
      // 加载每个分类项的笔记数量
      const { data: notes } = await supabase
        .from('notes')
        .select('para_item_id')
      if (notes) {
        const counts: Record<string, number> = {}
        notes.forEach(n => {
          if (n.para_item_id) {
            counts[n.para_item_id] = (counts[n.para_item_id] || 0) + 1
          }
        })
        setNoteCounts(counts)
      }
    }
    setLoading(false)
  }

  async function handleAdd(category: ParaCategory) {
    const name = prompt('输入分类项名称：')
    if (!name?.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('para_items')
      .insert({
        user_id: user?.id,
        category,
        name: name.trim(),
      })

    if (error) {
      alert('添加失败: ' + error.message)
    } else {
      await loadItems()
    }
  }

  async function handleEdit(item: ParaItem) {
    const name = prompt('修改名称：', item.name)
    if (!name?.trim() || name === item.name) return

    const { error } = await supabase
      .from('para_items')
      .update({ name: name.trim() })
      .eq('id', item.id)

    if (error) {
      alert('修改失败')
    } else {
      await loadItems()
    }
  }

  async function handleDelete(item: ParaItem) {
    const count = noteCounts[item.id] || 0
    const msg = count > 0
      ? `该分类下有 ${count} 条笔记，删除后笔记将解绑分类。确认删除？`
      : '确认删除？'
    if (!confirm(msg)) return

    const { error } = await supabase
      .from('para_items')
      .delete()
      .eq('id', item.id)

    if (error) {
      alert('删除失败')
    } else {
      await loadItems()
    }
  }

  if (loading) {
    return <p className="text-text-muted text-sm">加载中…</p>
  }

  function handleNavigateNote(id: string) {
    // 通过事件通知 NotesPage 打开对应笔记
    window.dispatchEvent(new CustomEvent('navigate-note', { detail: { id } }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">🗂 PARA 知识分类</h1>
        {/* 视图切换 */}
        <div className="flex gap-1 p-0.5 bg-[#F5F0E8] rounded-lg">
          <button
            onClick={() => setView('para')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              view === 'para' ? 'bg-card text-primary shadow-sm' : 'text-text-secondary'
            }`}
          >
            📂 分类
          </button>
          <button
            onClick={() => setView('graph')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              view === 'graph' ? 'bg-card text-primary shadow-sm' : 'text-text-secondary'
            }`}
          >
            🕸️ 图谱
          </button>
        </div>
      </div>
      <p className="text-sm text-text-secondary mb-6">按「可操作性」分类，让知识井井有条</p>

      {view === 'graph' ? (
        <KnowledgeGraph onNavigateNote={handleNavigateNote} />
      ) : (
      <div className="space-y-5">
        {(['project', 'area', 'resource', 'archive'] as ParaCategory[]).map(category => {
          const config = categoryConfig[category]
          const categoryItems = items.filter(i => i.category === category)

          return (
            <div key={category} className="card">
              {/* 分类标题 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <h2 className={`font-bold ${config.color}`}>{config.label}</h2>
                  <span className="text-xs text-text-muted">{config.desc}</span>
                </div>
                <button
                  onClick={() => handleAdd(category)}
                  className="text-sm text-secondary hover:underline"
                >
                  + 添加
                </button>
              </div>

              {/* 分类项列表 */}
              {categoryItems.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">暂无分类项</p>
              ) : (
                <div className="space-y-2">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 rounded-md bg-[#FDFAF6] border border-border hover:shadow-card-hover transition-all"
                    >
                      <div className="flex-1">
                        <span className="font-semibold text-sm">{item.name}</span>
                        {item.description && (
                          <span className="text-xs text-text-muted ml-2">{item.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                          {noteCounts[item.id] || 0}
                        </span>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-xs text-secondary hover:underline"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-xs text-red-400 hover:text-red-600 hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
