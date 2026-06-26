// ============================================================
// ReviewPage：每周知识复盘
// ============================================================
// 职责：
//   1. 周导航（上周/本周/下周）
//   2. 手动填写复盘（收获/关联/输出/下周方向）
//   3. AI 生成周报（SSE 流式输出）
//   4. 历史复盘记录
//
// 对应 PRD：REQ-REV-01~10
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Review } from '@/types'

// 获取某一天的所在周的周一和周日
function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay() // 0=周日, 1=周一...
  const diff = day === 0 ? -6 : 1 - day // 调整到周一
  const start = new Date(d)
  start.setDate(d.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 格式化日期范围显示
function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`
  return `${fmt(start)} - ${fmt(end)}`
}

export function ReviewPage() {
  const [currentWeek, setCurrentWeek] = useState(() => getWeekRange(new Date()))
  const [review, setReview] = useState<Partial<Review> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // AI 周报状态
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiError, setAiError] = useState('')

  // 历史复盘
  const [history, setHistory] = useState<Review[]>([])
  const aiAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    loadReview()
  }, [currentWeek])

  async function loadReview() {
    setLoading(true)
    setAiText('')

    const weekStart = formatDate(currentWeek.start)
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle()

    if (error) {
      console.error('加载复盘失败:', error)
    } else {
      setReview(data)
      if (data?.ai_summary) setAiText(data.ai_summary)
    }

    // 加载历史复盘列表
    const { data: historyData } = await supabase
      .from('reviews')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(10)
    setHistory(historyData || [])

    setLoading(false)
  }

  function changeWeek(delta: number) {
    const newStart = new Date(currentWeek.start)
    newStart.setDate(newStart.getDate() + delta * 7)
    const newEnd = new Date(newStart)
    newEnd.setDate(newStart.getDate() + 6)
    setCurrentWeek({ start: newStart, end: newEnd })
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      user_id: user?.id,
      week_start: formatDate(currentWeek.start),
      week_end: formatDate(currentWeek.end),
      key_takeaways: review?.key_takeaways || null,
      connections: review?.connections || null,
      output_summary: review?.output_summary || null,
      next_actions: review?.next_actions || null,
      ai_summary: aiText || null,
    }

    if (review?.id) {
      // 更新
      const { error } = await supabase
        .from('reviews')
        .update(payload)
        .eq('id', review.id)
      if (error) alert('保存失败: ' + error.message)
    } else {
      // 新建
      const { data, error } = await supabase
        .from('reviews')
        .insert(payload)
        .select()
        .single()
      if (error) {
        alert('保存失败: ' + error.message)
      } else {
        setReview(data)
      }
    }
    setSaving(false)
    await loadReview()
  }

  // REQ-REV-05~06：AI 周报生成
  // 方案说明：个人项目简化方案，前端直接调用 DeepSeek API
  // API Key 从用户设置中读取，不经过 Edge Function
  async function handleAiGenerate() {
    setAiGenerating(true)
    setAiError('')
    setAiText('')

    // 中断上一次请求
    aiAbortRef.current?.abort()
    aiAbortRef.current = new AbortController()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAiError('请先登��')
        setAiGenerating(false)
        return
      }

      // 1. 读取用户保存的 DeepSeek API Key
      const { data: settings } = await supabase
        .from('user_settings')
        .select('deepseek_api_key, nickname')
        .eq('user_id', user.id)
        .maybeSingle()

      const apiKey = settings?.deepseek_api_key
      if (!apiKey) {
        setAiError('请先在设置中配置 DeepSeek API Key')
        setAiGenerating(false)
        return
      }

      // 2. 查询本周数据
      const weekStartStr = formatDate(currentWeek.start)
      const weekEndStr = formatDate(currentWeek.end)
      const [notesRes, fleetingRes, outputsRes] = await Promise.all([
        supabase.from('notes').select('title, core_viewpoint, my_understanding, type, tags')
          .gte('created_at', weekStartStr).lte('created_at', weekEndStr + 'T23:59:59'),
        supabase.from('fleeting_notes').select('trigger_text, my_view')
          .gte('created_at', weekStartStr).lte('created_at', weekEndStr + 'T23:59:59'),
        supabase.from('outputs').select('title, type, description, reflection')
          .gte('created_at', weekStartStr).lte('created_at', weekEndStr + 'T23:59:59'),
      ])

      const notes = notesRes.data || []
      const fleeting = fleetingRes.data || []
      const outputs = outputsRes.data || []

      if (notes.length === 0 && fleeting.length === 0 && outputs.length === 0) {
        setAiError('本周暂无笔记数据，无法生成周报')
        setAiGenerating(false)
        return
      }

      // 3. 拼 Prompt
      const weekData = {
        闪念笔记: fleeting.map((f: any) => ({ 内容: f.trigger_text, 观点: f.my_view || '无' })),
        文献和永久笔记: notes.map((n: any) => ({
          标题: n.title, 核心观点: n.core_viewpoint, 我的理解: n.my_understanding || '无',
          类型: n.type, 标签: n.tags?.join(', ') || '无',
        })),
        产出记录: outputs.map((o: any) => ({
          标题: o.title, 类型: o.type, 描述: o.description || '无', 反思: o.reflection || '无',
        })),
      }

      const prompt = `你是用户的第二大脑助手，请基于用户本周的知识管理数据生成一份深度周报。

## 用户本周数据
${JSON.stringify(weekData, null, 2)}

## 周报要求
请按以下结构生成周报：

### 📊 本周知识主题聚类
将本周笔记按主题归类，识别核心学习方向。

### 💡 核心观点回顾
提炼本周最重要的 3-5 个观点。

### 🔗 知识关联发现
分析笔记之间可能存在但用户未注意到的关联。

### 📤 输出情况总结
评估本周的知识输出情况，输出是否充分。

### 🎯 下周建议方向
基于本周内容，给出 2-3 条下周行动建议。

请用简洁有洞察力的语言，避免空洞的套话。用 Markdown 格式输出。`

      // 4. 调用 DeepSeek API（流式）
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个知识管理助手，擅长从碎片化的笔记中发现模式、提炼洞察、给出可执行的建议。' },
            { role: 'user', content: prompt },
          ],
          stream: true,
          max_tokens: 2000,
        }),
        signal: aiAbortRef.current.signal,
      })

      if (!response.ok) {
        if (response.status === 401) throw new Error('API Key 无效，请检查设置')
        throw new Error(`生成失败 (${response.status})`)
      }

      // 5. 流式读取
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          // 解析 SSE 格式，提取 content
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  setAiText(prev => prev + content)
                }
              } catch {
                // 忽略不完整的 JSON
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : '生成失败'
      setAiError(message.includes('API Key')
        ? '请先在设置中配置有效的 DeepSeek API Key'
        : '生成失败，请检查 API Key 和网络'
      )
    } finally {
      setAiGenerating(false)
    }
  }

  const isThisWeek = () => {
    const thisWeek = getWeekRange(new Date())
    return formatDate(currentWeek.start) === formatDate(thisWeek.start)
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">📋 每周知识复盘</h1>
      <p className="text-sm text-text-secondary mb-6">AI 帮你生成深度复盘总结</p>

      {/* 周导航 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => changeWeek(-1)} className="btn-secondary text-sm">◀ 上周</button>
        <div className="text-center">
          <p className="font-bold text-base">{formatWeekRange(currentWeek.start, currentWeek.end)}</p>
          {!isThisWeek() && (
            <button onClick={() => setCurrentWeek(getWeekRange(new Date()))} className="text-xs text-secondary hover:underline mt-1">
              回到本周
            </button>
          )}
        </div>
        <button onClick={() => changeWeek(1)} className="btn-secondary text-sm">下周 ▶</button>
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">加载中…</p>
      ) : (
        <>
          {/* 手动填写区 */}
          <div className="card space-y-4">
            <h2 className="font-bold text-base">✍️ 手动填写</h2>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">🧠 本周核心收获</label>
              <textarea
                value={review?.key_takeaways || ''}
                onChange={e => setReview({ ...review, key_takeaways: e.target.value })}
                placeholder="本周学到的最重要的东西"
                className="form-textarea"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">🔗 本周发现的知识关联</label>
              <textarea
                value={review?.connections || ''}
                onChange={e => setReview({ ...review, connections: e.target.value })}
                placeholder="哪些知识之间产生了新的连接？"
                className="form-textarea"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">🎯 本周输出小结</label>
              <textarea
                value={review?.output_summary || ''}
                onChange={e => setReview({ ...review, output_summary: e.target.value })}
                placeholder="本周产出了什么？"
                className="form-textarea"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">🔮 下周调整方向</label>
              <textarea
                value={review?.next_actions || ''}
                onChange={e => setReview({ ...review, next_actions: e.target.value })}
                placeholder="下周想重点做什么？"
                className="form-textarea"
              />
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
              {saving ? '保存中…' : '💾 保存复盘'}
            </button>
          </div>

          {/* AI 周报区 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base">🤖 AI 周报总结</h2>
              <button
                onClick={handleAiGenerate}
                disabled={aiGenerating}
                className="btn-primary text-sm"
              >
                {aiGenerating ? '生成中…' : '🤖 生成周报'}
              </button>
            </div>

            {/* AI 输出区 */}
            {aiError && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md mb-3">{aiError}</p>
            )}

            {aiGenerating && !aiText && (
              <div className="flex items-center gap-2 text-text-muted text-sm py-8 justify-center">
                <span className="animate-pulse">🤖</span> AI 正在分析你的笔记…
              </div>
            )}

            {aiText && (
              <div className="bg-amber-light rounded-md p-4">
                <pre className="whitespace-pre-wrap text-sm text-text-main font-sans">{aiText}</pre>
              </div>
            )}

            {!aiText && !aiGenerating && !aiError && (
              <p className="text-sm text-text-muted py-4 text-center">
                点击「生成周报」，AI 会基于本周笔记自动生成复盘总结
              </p>
            )}
          </div>

          {/* 历史复盘 */}
          {history.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-base mb-4">📅 历史复盘</h2>
              <div className="space-y-2">
                {history.map(r => {
                  const start = new Date(r.week_start)
                  const end = new Date(r.week_end)
                  return (
                    <button
                      key={r.id}
                      onClick={() => setCurrentWeek(getWeekRange(new Date(r.week_start)))}
                      className="w-full text-left p-3 rounded-md bg-[#FDFAF6] border border-border hover:border-primary hover:bg-primary-light transition-all"
                    >
                      <span className="font-semibold text-sm">{formatWeekRange(start, end)}</span>
                      {r.key_takeaways && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-1">{r.key_takeaways}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
