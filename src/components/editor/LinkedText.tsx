// ============================================================
// LinkedText：渲染 [[笔记标题]] 为可点击链接
// ============================================================
// 将文本中的 [[标题]] 解析为链接元素
// 对应 PRD REQ-LINK-03~04

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  text: string | null
  className?: string
}

// 缓存笔记标题到 ID 的映射
const titleCache: Record<string, string> = {}

export function LinkedText({ text, className }: Props) {
  const [resolvedLinks, setResolvedLinks] = useState<Record<string, string | null>>({})

  useEffect(() => {
    if (!text) return
    const matches = text.matchAll(/\[\[(.+?)\]\]/g)
    const titles = [...new Set([...matches].map(m => m[1].trim()))]

    const unresolved = titles.filter(t => !(t in titleCache) && !(t in resolvedLinks))
    if (unresolved.length === 0) return

    // 批量查询
    supabase
      .from('notes')
      .select('id, title')
      .in('title', unresolved)
      .then(({ data }) => {
        const map: Record<string, string | null> = {}
        unresolved.forEach(t => { map[t] = null })
        data?.forEach((n: { id: string; title: string }) => {
          map[n.title] = n.id
          titleCache[n.title] = n.id
        })
        setResolvedLinks(prev => ({ ...prev, ...map }))
      })
  }, [text])

  if (!text) return null

  // 分割文本，交替渲染普通文本和链接
  const parts = text.split(/(\[\[.+?\]\])/g)
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = part.match(/^\[\[(.+?)\]\]$/)
        if (match) {
          const title = match[1].trim()
          const noteId = resolvedLinks[title] ?? titleCache[title]
          if (noteId) {
            return (
              <a
                key={i}
                href={`/notes?id=${noteId}`}
                onClick={(e) => {
                  e.preventDefault()
                  // 跳转到笔记详情（后续可以改进为打开编辑模式）
                  window.dispatchEvent(new CustomEvent('navigate-note', { detail: { id: noteId } }))
                }}
                className="text-secondary underline hover:text-secondary-dark cursor-pointer"
              >
                {title}
              </a>
            )
          }
          // 链接失效（笔记已删除）
          return (
            <span key={i} className="text-text-muted line-through" title="笔记已删除">
              {title}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
