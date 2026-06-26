// ============================================================
// LinkableTextarea：支持双链 [[ 的文本输入框
// ============================================================
// 当用户输入 [[ 时弹出搜索面板，选择笔记后插入 [[标题]]
// 对应 PRD REQ-LINK-01~02

import { useState, useRef, useCallback } from 'react'
import { LinkSearchPanel } from './LinkSearchPanel'
import type { Note } from '@/types'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LinkableTextarea({ value, onChange, placeholder, className }: Props) {
  const [showPanel, setShowPanel] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // 检测 [[ 触发
    const cursorPos = e.target.selectionStart
    const textBefore = newValue.slice(0, cursorPos)
    const match = textBefore.match(/\[\[([^\]]*)$/)
    if (match) {
      // 显示搜索面板
      const textarea = textareaRef.current
      if (textarea) {
        const rect = textarea.getBoundingClientRect()
        setPanelPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        })
      }
      setShowPanel(true)
    } else {
      setShowPanel(false)
    }
  }, [onChange])

  const handleSelectNote = useCallback((note: Pick<Note, 'id' | 'title'>) => {
    // 找到最后一个 [[ 位置，替换为 [[标题]]
    const cursorPos = textareaRef.current?.selectionStart || value.length
    const textBefore = value.slice(0, cursorPos)
    const textAfter = value.slice(cursorPos)
    const lastBracket = textBefore.lastIndexOf('[[')
    if (lastBracket >= 0) {
      const newValue = textBefore.slice(0, lastBracket) + `[[${note.title}]]` + textAfter
      onChange(newValue)
    }
    setShowPanel(false)
    textareaRef.current?.focus()
  }, [value, onChange])

  // 当前 [[ 后面的搜索关键词
  const cursorPos = textareaRef.current?.selectionStart || value.length
  const textBefore = value.slice(0, cursorPos)
  const match = textBefore.match(/\[\[([^\]]*)$/)
  const searchKeyword = match ? match[1] : ''

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        className={className}
      />
      {showPanel && (
        <LinkSearchPanel
          keyword={searchKeyword}
          onSelect={handleSelectNote}
          onClose={() => setShowPanel(false)}
          position={panelPos}
        />
      )}
    </div>
  )
}
