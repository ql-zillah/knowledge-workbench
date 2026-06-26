// ============================================================
// AIChatPage：AI 对话页（语义搜索 + RAG 问答）
// ============================================================
// 职责：
//   1. 语义搜索：输入查询 → Embedding → pgvector 检索
//   2. RAG 问答：输入问题 → 检索 Top-5 → DeepSeek 生成回答
//   3. 引用溯源 + 流式输出
//
// 对应 PRD REQ-SEARCH-01~06, REQ-RAG-01~06

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'

type SearchResult = Pick<Note, 'id' | 'title' | 'core_viewpoint' | 'type'> & { similarity: number }

export function AIChatPage() {
  const [mode, setMode] = useState<'search' | 'chat'>('chat')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 搜索结果
  const [results, setResults] = useState<SearchResult[]>([])

  // 对话历史
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    citations?: SearchResult[]
  }>>([])
  const [streaming, setStreaming] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 获取 Embedding
  async function getEmbedding(text: string): Promise<number[] | null> {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('openai_api_key')
      .single()

    const apiKey = settings?.openai_api_key
    if (!apiKey) {
      setError('请先在设置中配置 OpenAI API Key')
      return null
    }

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    if (!res.ok) {
      setError('Embedding 失败，请检查 OpenAI API Key')
      return null
    }

    const data = await res.json()
    return data.data[0].embedding
  }

  // 语义搜索
  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    const embedding = await getEmbedding(query)
    if (!embedding) { setLoading(false); return }

    // pgvector 相似度检索
    const { data, error: searchError } = await supabase.rpc('match_notes', {
      query_embedding: embedding,
      match_count: 10,
    })

    if (searchError) {
      // RPC 不存在则用 SQL 函数
      console.error('RPC error:', searchError)
      setError('搜索失败，请确保 pgvector 扩展已安装')
    } else if (data) {
      setResults(data as SearchResult[])
    }
    setLoading(false)
  }

  // RAG 问答
  async function handleChat() {
    if (!query.trim()) return
    setError('')
    setStreaming('')

    const userMsg = { role: 'user' as const, content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')

    // 1. 获取 Embedding
    const embedding = await getEmbedding(query)
    if (!embedding) return

    // 2. 检索相关笔记
    const { data: relatedNotes } = await supabase.rpc('match_notes', {
      query_embedding: embedding,
      match_count: 5,
    })

    const citations: SearchResult[] = (relatedNotes || []) as SearchResult[]

    // 3. 读取 DeepSeek Key
    const { data: settings } = await supabase
      .from('user_settings')
      .select('deepseek_api_key')
      .single()

    const apiKey = settings?.deepseek_api_key
    if (!apiKey) {
      setError('请先在设置中配置 DeepSeek API Key')
      return
    }

    // 4. 拼接 Prompt
    const context = citations
      .map((n, i) => `[${i + 1}]《${n.title}》${n.core_viewpoint}`)
      .join('\n')

    const systemPrompt = citations.length > 0
      ? `你是用户的第二大脑。请基于以下笔记内容回答用户问题。如果笔记中没有相关信息，请诚实说明。\n\n相关笔记：\n${context}`
      : '你是用户的第二大脑。用户的知识库中暂无相关内容。请告知用户并给出建议。'

    // 5. DeepSeek 流式生成
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
          ],
          stream: true,
          max_tokens: 1500,
        }),
      })

      if (!res.ok) throw new Error('生成失败')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  fullContent += content
                  setStreaming(fullContent)
                }
              } catch { /* skip */ }
            }
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullContent,
        citations: citations.length > 0 ? citations : undefined,
      }])
      setStreaming('')
    } catch {
      setError('AI 生成失败，请检查 DeepSeek API Key')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'search') handleSearch()
    else handleChat()
  }

  function handleNavigateNote(id: string) {
    window.dispatchEvent(new CustomEvent('navigate-note', { detail: { id } }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">💬 AI 对话</h1>
        <div className="flex gap-1 p-0.5 bg-[#F5F0E8] rounded-lg">
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              mode === 'chat' ? 'bg-card text-primary shadow-sm' : 'text-text-secondary'
            }`}
          >
            💬 问答
          </button>
          <button
            onClick={() => setMode('search')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              mode === 'search' ? 'bg-card text-primary shadow-sm' : 'text-text-secondary'
            }`}
          >
            🔍 搜索
          </button>
        </div>
      </div>
      <p className="text-sm text-text-secondary mb-6">
        {mode === 'chat' ? '基于你的知识库回答问题' : '自然语言搜索你的笔记'}
      </p>

      {/* 搜索模式 */}
      {mode === 'search' && (
        <div>
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="例如：关于学习方法论的笔记..."
              className="form-input flex-1"
            />
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '搜索中…' : '搜索'}
            </button>
          </form>

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.id} className="card cursor-pointer hover:shadow-card-hover transition-all"
                  onClick={() => handleNavigateNote(r.id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-text-muted">
                      {r.type === 'literature' ? '📖' : r.type === 'permanent' ? '💎' : '💡'}
                    </span>
                    <h3 className="font-bold text-sm">{r.title}</h3>
                    <span className="text-xs text-text-muted ml-auto">
                      相关度: {(r.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2">{r.core_viewpoint}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 对话模式 */}
      {mode === 'chat' && (
        <div>
          {/* 对话历史 */}
          <div className="space-y-4 mb-4 min-h-[300px]">
            {messages.length === 0 && !streaming && (
              <div className="text-center py-16 text-text-muted">
                <p className="text-lg mb-2">🤖</p>
                <p>向你的第二大脑提问吧</p>
                <p className="text-xs mt-2">AI 会基于你的全部笔记来回答</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {/* 引用 */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-text-muted mb-1.5">📎 参考来源：</p>
                      {msg.citations.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleNavigateNote(c.id)}
                          className="block text-xs text-secondary hover:underline w-full text-left"
                        >
                          {c.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 流式输出 */}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-4 bg-card border border-border">
                  <p className="text-sm whitespace-pre-wrap">{streaming}</p>
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          {/* 输入框 */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="基于你的笔记问我任何问题..."
              className="form-input flex-1"
            />
            <button type="submit" disabled={!!streaming} className="btn-primary">
              发送
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
