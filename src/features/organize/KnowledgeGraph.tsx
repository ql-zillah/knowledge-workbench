// ============================================================
// KnowledgeGraph：知识图谱组件
// ============================================================
// 用 React Flow 渲染笔记关系图谱
// 对应 PRD REQ-GRAPH-01~05

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node, Edge, Controls, Background,
  useNodesState, useEdgesState, MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { supabase } from '@/lib/supabase'

interface Props {
  onNavigateNote: (id: string) => void
}

const typeColors: Record<string, string> = {
  literature: '#5B8FA8',
  permanent: '#9B7EC4',
  fleeting: '#D4952A',
}

export function KnowledgeGraph({ onNavigateNote }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    loadGraph()
  }, [])

  async function loadGraph() {
    setLoading(true)
    // 加载所有笔记
    const { data: notes } = await supabase
      .from('notes')
      .select('id, title, type')
      .order('updated_at', { ascending: false })

    // 加载所有链接
    const { data: links } = await supabase
      .from('note_links')
      .select('source_note_id, target_note_id')

    if (!notes || notes.length === 0) {
      setEmpty(true)
      setLoading(false)
      return
    }

    if (!links || links.length === 0) {
      // 有笔记但没链接
      const flowNodes: Node[] = notes.map((n, i) => ({
        id: n.id,
        data: { label: n.title },
        position: { x: Math.cos(i * 2 * Math.PI / notes.length) * 200 + 400, y: Math.sin(i * 2 * Math.PI / notes.length) * 200 + 300 },
        style: {
          background: typeColors[n.type] || '#999',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 'bold',
          maxWidth: 180,
        },
      }))
      setNodes(flowNodes)
      setEdges([])
      setEmpty(false)
      setLoading(false)
      return
    }

    // 构建节点
    const linkedIds = new Set<string>()
    links.forEach(l => { linkedIds.add(l.source_note_id); linkedIds.add(l.target_note_id) })

    const graphNotes = notes.filter(n => linkedIds.has(n.id))
    const others = notes.filter(n => !linkedIds.has(n.id))

    const allNodes = [...graphNotes, ...others]
    const flowNodes: Node[] = allNodes.map((n, i) => ({
      id: n.id,
      data: { label: n.title },
      position: {
        x: Math.cos(i * 2 * Math.PI / Math.max(allNodes.length, 1)) * 250 + 400,
        y: Math.sin(i * 2 * Math.PI / Math.max(allNodes.length, 1)) * 250 + 300,
      },
      style: {
        background: linkedIds.has(n.id) ? (typeColors[n.type] || '#999') : '#CCC',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: 'bold',
        maxWidth: 180,
      },
    }))

    // 构建边
    const flowEdges: Edge[] = links.map((l, i) => ({
      id: `e-${i}`,
      source: l.source_note_id,
      target: l.target_note_id,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#BBB' },
      style: { stroke: '#BBB', strokeWidth: 1.5 },
    }))

    setNodes(flowNodes)
    setEdges(flowEdges)
    setEmpty(false)
    setLoading(false)
  }

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    onNavigateNote(node.id)
  }, [onNavigateNote])

  if (loading) return <p className="text-text-muted text-sm py-8 text-center">加载图谱…</p>

  if (empty) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p className="text-lg mb-2">🕸️</p>
        <p>暂无知识连接</p>
        <p className="text-xs mt-2">开始写笔记并建立 [[双链]]，图谱会自动生成</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 500 }} className="border border-border rounded-md overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <Background color="#EDE4D8" gap={20} />
      </ReactFlow>
    </div>
  )
}
