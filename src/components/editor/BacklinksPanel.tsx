// ============================================================
// BacklinksPanel：反向链接面板
// ============================================================
// 显示所有引用了当前笔记的其他笔记
// 对应 PRD REQ-LINK-06

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LinkedText } from './LinkedText'

interface Props {
  noteId: string
}

export function BacklinksPanel({ noteId }: Props) {
  const [backlinks, setBacklinks] = useState<Array<{
    id: string
    title: string
    core_viewpoint: string
    my_understanding: string | null
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBacklinks()
  }, [noteId])

  async function loadBacklinks() {
    setLoading(true)
    // 查询 note_links 中 target_note_id = 当前笔记 的记录
    const { data: links } = await supabase
      .from('note_links')
      .select('source_note_id')
      .eq('target_note_id', noteId)

    if (links && links.length > 0) {
      const sourceIds = links.map(l => l.source_note_id)
      const { data: notes } = await supabase
        .from('notes')
        .select('id, title, core_viewpoint, my_understanding')
        .in('id', sourceIds)
      setBacklinks(notes || [])
    } else {
      setBacklinks([])
    }
    setLoading(false)
  }

  if (loading) return null

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h4 className="text-xs font-semibold text-text-secondary mb-2">
        🔗 反向链接 ({backlinks.length})
      </h4>
      {backlinks.length === 0 ? (
        <p className="text-xs text-text-muted">暂无其他笔记引用此笔记</p>
      ) : (
        <div className="space-y-1.5">
          {backlinks.map(note => (
            <div key={note.id} className="text-xs p-2 rounded bg-[#FDFAF6] border border-border">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-note', { detail: { id: note.id } }))}
                className="font-semibold text-secondary hover:underline"
              >
                {note.title}
              </button>
              {note.core_viewpoint && (
                <LinkedText text={note.core_viewpoint.slice(0, 80) + (note.core_viewpoint.length > 80 ? '...' : '')} className="text-text-muted ml-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
