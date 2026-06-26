// ============================================================
// LinkSearchPanel：双链搜索弹窗
// ============================================================
// 当用户在编辑器中输入 [[ 时弹出，允许搜索并选择已有笔记
// 对应 PRD REQ-LINK-01~02

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'

interface Props {
  keyword: string
  onSelect: (note: Pick<Note, 'id' | 'title' | 'type'>) => void
  onClose: () => void
  position: { top: number; left: number }
}

export function LinkSearchPanel({ keyword, onSelect, onClose, position }: Props) {
  const [results, setResults] = useState<Pick<Note, 'id' | 'title' | 'type' | 'core_viewpoint'>[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    searchNotes()
  }, [keyword])

  async function searchNotes() {
    const query = supabase
      .from('notes')
      .select('id, title, type, core_viewpoint')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (keyword) {
      query.ilike('title', `%${keyword}%`)
    }

    const { data } = await query
    setResults(data || [])
    setSelectedIndex(0)
  }

  // 键盘导航
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [results, selectedIndex])

  // 点击外部关闭
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    setTimeout(() => document.addEventListener('click', handleClick), 100)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  if (results.length === 0) {
    return (
      <div
        ref={panelRef}
        className="absolute z-50 bg-card border border-border rounded-md shadow-card-hover p-4 w-72"
        style={{ top: position.top, left: position.left }}
      >
        <p className="text-xs text-text-muted">
          {keyword ? '未找到匹配笔记' : '暂无笔记'}
        </p>
      </div>
    )
  }

  const typeLabel: Record<string, string> = {
    literature: '📖',
    permanent: '💎',
    fleeting: '💡',
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-50 bg-card border border-border rounded-md shadow-card-hover overflow-hidden w-72"
      style={{ top: position.top, left: position.left }}
    >
      <div className="text-xs text-text-muted px-3 py-2 border-b border-border">
        链接到笔记
      </div>
      <div className="max-h-48 overflow-y-auto">
        {results.map((note, i) => (
          <button
            key={note.id}
            onClick={() => onSelect(note)}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              i === selectedIndex ? 'bg-primary-light' : 'hover:bg-[#F5F0E8]'
            }`}
          >
            <span>{typeLabel[note.type] || '📝'}</span>
            <span className="flex-1 truncate">{note.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
