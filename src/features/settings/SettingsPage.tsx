// ============================================================
// SettingsPage：设置页
// ============================================================
// 职责：
//   1. 配置 DeepSeek API Key 和 OpenAI API Key
//   2. 个人信息（称呼、目标、工具）
//   3. 数据导出
//
// 对应 PRD：REQ-SET-01~05
// ============================================================

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserSettings } from '@/types'

export function SettingsPage() {
  const [, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // API Key 输入
  const [deepseekKey, setDeepseekKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')

  // 个人信息
  const [nickname, setNickname] = useState('')
  const [mainGoal, setMainGoal] = useState('')
  const [currentTools, setCurrentTools] = useState('')

  const [savingKeys, setSavingKeys] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle()

    if (data) {
      setSettings(data)
      setNickname(data.nickname || '')
      setMainGoal(data.main_goal || '')
      setCurrentTools(data.current_tools || '')
      // API Key 以掩码显示
      if (data.deepseek_api_key) {
        setDeepseekKey(maskKey(data.deepseek_api_key))
      }
      if (data.openai_api_key) {
        setOpenaiKey(maskKey(data.openai_api_key))
      }
    } else if (error) {
      console.error('加载设置失败:', error)
    }
    setLoading(false)
  }

  function maskKey(key: string): string {
    if (key.length <= 8) return '****'
    return key.slice(0, 4) + '****' + key.slice(-4)
  }

  async function handleSaveKeys() {
    setSavingKeys(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 只有当输入和掩码不同时才更新（说明用户输入了新值）
    const updateData: Record<string, string | null> = {}
    if (deepseekKey && !deepseekKey.includes('****')) {
      updateData.deepseek_api_key = deepseekKey.trim()
    }
    if (openaiKey && !openaiKey.includes('****')) {
      updateData.openai_api_key = openaiKey.trim()
    }

    if (Object.keys(updateData).length === 0) {
      alert('未修改密钥')
      setSavingKeys(false)
      return
    }

    const { error } = await supabase
      .from('user_settings')
      .update({
        ...updateData,
      })
      .eq('user_id', user?.id)

    if (error) {
      alert('保存失败: ' + error.message)
    } else {
      alert('密钥已保存')
      await loadSettings()
    }
    setSavingKeys(false)
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('user_settings')
      .update({
        nickname: nickname.trim() || null,
        main_goal: mainGoal.trim() || null,
        current_tools: currentTools.trim() || null,
      })
      .eq('user_id', user?.id)

    if (error) {
      alert('保存失败: ' + error.message)
    } else {
      alert('个人信息已保存')
    }
    setSavingProfile(false)
  }

  // REQ-SET-05：数据导出
  async function handleExport() {
    setExporting(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 拉取所有数据
    const [notes, fleeting, outputs, reviews, paraItems] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', user?.id),
      supabase.from('fleeting_notes').select('*').eq('user_id', user?.id),
      supabase.from('outputs').select('*').eq('user_id', user?.id),
      supabase.from('reviews').select('*').eq('user_id', user?.id),
      supabase.from('para_items').select('*').eq('user_id', user?.id),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      user: { email: user?.email },
      notes: notes.data,
      fleeting_notes: fleeting.data,
      outputs: outputs.data,
      reviews: reviews.data,
      para_items: paraItems.data,
    }

    // 下载为 JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    setExporting(false)
  }

  if (loading) {
    return <p className="text-text-muted text-sm">加载中…</p>
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">⚙️ 设置</h1>
      <p className="text-sm text-text-secondary mb-6">配置 AI 密钥、查看个人信息、管理数据</p>

      {/* AI 配置 */}
      <div className="card">
        <h2 className="font-bold text-base mb-4">🤖 AI 周报配置</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              DeepSeek API Key
            </label>
            <input
              type="password"
              value={deepseekKey}
              onChange={e => setDeepseekKey(e.target.value)}
              placeholder="sk-..."
              className="form-input"
            />
            <p className="text-xs text-text-muted mt-1">
              用于 AI 周报生成。在
              <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener" className="text-secondary hover:underline mx-1">DeepSeek 平台</a>
              获取。
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              OpenAI API Key（Phase 2 语义搜索用）
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={e => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="form-input"
            />
          </div>

          <button onClick={handleSaveKeys} disabled={savingKeys} className="btn-primary">
            {savingKeys ? '保存中…' : '💾 保存密钥'}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-3">
          🔒 密钥保存在 Supabase 云端数据库中，通过 RLS 行级安全策略保护，仅你自己可访问。
        </p>
      </div>

      {/* 个人信息 */}
      <div className="card">
        <h2 className="font-bold text-base mb-4">👤 个人信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">称呼</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="你想被叫什么？"
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">当前阶段的主要目标</label>
            <textarea
              value={mainGoal}
              onChange={e => setMainGoal(e.target.value)}
              placeholder="你当前阶段想重点学什么/做什么？"
              className="form-textarea"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">当前使用的知识管理工具</label>
            <input
              value={currentTools}
              onChange={e => setCurrentTools(e.target.value)}
              placeholder="Obsidian, Notion, 本工作台..."
              className="form-input"
            />
          </div>
          <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary">
            {savingProfile ? '保存中…' : '💾 保存个人信息'}
          </button>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="card">
        <h2 className="font-bold text-base mb-4">📦 云端数据</h2>
        <p className="text-sm text-text-secondary mb-4">
          你的所有数据保存在 Supabase 云端数据库中，任何设备访问本页面都能看到同一份数据。
        </p>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary">
          {exporting ? '导出中…' : '📢 导出数据备份'}
        </button>
        <p className="text-xs text-text-muted mt-2">
          导出 JSON 格式备份文件，包含所有笔记、闪念、产出、复盘和分类数据。
        </p>
      </div>
    </div>
  )
}
