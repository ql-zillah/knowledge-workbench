// ============================================================
// OutputPage：产出记录页
// ============================================================
// 职责：记录知识输出（文章/费曼讲解/项目/汇报），形成"输出倒逼输入"飞轮
// 对应 PRD：REQ-OUT-01~05
// ============================================================

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Output, OutputType } from '@/types'

const outputTypeConfig: Record<OutputType, { label: string; icon: string }> = {
  article: { label: '文章/总结', icon: '📝' },
  feynman: { label: '费曼讲解', icon: '💬' },
  project: { label: '项目/代码', icon: '💻' },
  presentation: { label: '汇报/展示', icon: '📊' },
  other: { label: '其他', icon: '📌' },
}

export function OutputPage() {
  const [outputs, setOutputs] = useState<Output[]>([])
  const [loading, setLoading] = useState(true)

  // 表单状态
  const [type, setType] = useState<OutputType>('article')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reflection, setReflection] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadOutputs()
  }, [])

  async function loadOutputs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('outputs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('加载产出失败:', error)
    } else {
      setOutputs(data || [])
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!title.trim()) {
      alert('请填写标题')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('outputs')
      .insert({
        user_id: user?.id,
        type,
        title: title.trim(),
        description: description.trim() || null,
        reflection: reflection.trim() || null,
      })

    if (error) {
      alert('保存失败: ' + error.message)
    } else {
      // 清空表单
      setTitle('')
      setDescription('')
      setReflection('')
      setShowForm(false)
      await loadOutputs()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除这条产出记录？')) return

    const { error } = await supabase
      .from('outputs')
      .delete()
      .eq('id', id)

    if (error) {
      alert('删除失败')
    } else {
      setOutputs(outputs.filter(o => o.id !== id))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">🔮 产出飞轮</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          {showForm ? '收起' : '🎯 记录产出'}
        </button>
      </div>
      <p className="text-sm text-text-secondary mb-6">每一次输出都是理解的深化</p>

      {/* 记录表单 */}
      {showForm && (
        <div className="card space-y-4 mb-6">
          {/* 产出类型 */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">产出类型</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(outputTypeConfig) as OutputType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-md text-sm font-semibold border transition-all ${
                    type === t
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border text-text-secondary'
                  }`}
                >
                  {outputTypeConfig[t].icon} {outputTypeConfig[t].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">标题 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="这次产出的标题"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">简要描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="这次产出做了什么？"
              className="form-textarea"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">反思</label>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="这次产出有什么收获？下次可以怎么改进？"
              className="form-textarea"
            />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
            {saving ? '保存中…' : '💾 记录产出'}
          </button>
        </div>
      )}

      {/* 产出列表 */}
      {loading ? (
        <p className="text-text-muted text-sm">加载中…</p>
      ) : outputs.length === 0 ? (
        <div className="card text-center py-12 text-text-muted">
          还没有产出记录，开始输出吧 ✨
        </div>
      ) : (
        <div className="space-y-3">
          {outputs.map(output => {
            const config = outputTypeConfig[output.type]
            return (
              <div
                key={output.id}
                className="group bg-[#FDFAF6] border border-border rounded-md p-5 transition-all hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-xs font-semibold text-text-muted">{config.label}</span>
                    </div>
                    <h3 className="font-bold text-base mb-1">{output.title}</h3>
                    {output.description && (
                      <p className="text-sm text-text-secondary">{output.description}</p>
                    )}
                    {output.reflection && (
                      <div className="mt-2 p-3 bg-amber-light rounded-md">
                        <p className="text-xs font-semibold text-amber mb-1">💭 反思</p>
                        <p className="text-sm text-text-secondary">{output.reflection}</p>
                      </div>
                    )}
                    <p className="text-xs text-text-muted mt-3">
                      {new Date(output.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(output.id)}
                    className="text-xs text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100"
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
