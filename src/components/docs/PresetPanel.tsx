import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentDoc, PropValue } from '@/types'
import type { Preset, ImportConflictStrategy, ImportResult, SharePackageData } from '@/utils/presetManager'
import {
  addPreset,
  deletePreset,
  downloadPresetFile,
  downloadShareFile,
  exportPresetsToJson,
  exportSharePackage,
  getPresetsForComponent,
  importPresetsFromJson,
  loadPresets,
  parseSharePackage,
} from '@/utils/presetManager'

interface PresetPanelProps {
  component: ComponentDoc
  currentProps: Record<string, PropValue>
  activePresetName: string | null
  presetName: string | null
  showSource: boolean
  highlightLine: number | null
  onLoadPreset: (props: Record<string, PropValue>, presetName: string) => void
  onRequestDiff: (target: { label: string; kind: 'preset'; props: Record<string, PropValue> }) => void
  onImportApplyProps: (props: Record<string, PropValue>) => void
  onImportSwitchComponent: (name: string) => void
  onImportApplyContext: (ctx: NonNullable<SharePackageData['context']>) => void
}

export const PresetPanel: React.FC<PresetPanelProps> = ({
  component,
  currentProps,
  activePresetName,
  presetName,
  showSource,
  highlightLine,
  onLoadPreset,
  onRequestDiff,
  onImportApplyProps,
  onImportSwitchComponent,
  onImportApplyContext,
}) => {
  const [presets, setPresets] = useState<Preset[]>([])
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [presetNameInput, setPresetNameInput] = useState('')
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState<{ success: boolean; msg: string; detail?: ImportResult } | null>(null)
  const [strategy, setStrategy] = useState<ImportConflictStrategy>('merge')
  const [preview, setPreview] = useState<ReturnType<typeof parseSharePackage> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshPresets = useCallback(() => {
    setPresets(getPresetsForComponent(component.name))
  }, [component.name])

  useEffect(() => {
    refreshPresets()
    setActivePresetId(null)
    setShowImportExport(false)
    setImportResult(null)
    setImportText('')
    setPreview(null)
  }, [component.name, refreshPresets])

  useEffect(() => {
    const found = presets.find((p) => p.name === activePresetName)
    setActivePresetId(found ? found.id : null)
  }, [activePresetName, presets])

  const handleSave = () => {
    const name = presetNameInput.trim()
    if (!name) return
    addPreset(name, component.name, { ...currentProps })
    setPresetNameInput('')
    setShowSaveInput(false)
    refreshPresets()
  }

  const handleDelete = (id: string) => {
    deletePreset(id)
    if (activePresetId === id) setActivePresetId(null)
    refreshPresets()
  }

  const handleLoad = (preset: Preset) => {
    setActivePresetId(preset.id)
    onLoadPreset({ ...preset.props }, preset.name)
  }

  const handlePreview = (text: string) => {
    setImportText(text)
    if (text.trim()) {
      setPreview(parseSharePackage(text.trim()))
    } else {
      setPreview(null)
    }
    setImportResult(null)
  }

  const handleCopyJson = () => {
    const allPresets = loadPresets()
    const json = exportPresetsToJson(allPresets, component.name)
    navigator.clipboard.writeText(json).then(() => {
      setImportResult({ success: true, msg: '✅ 预设 JSON 已复制到剪贴板' })
      setTimeout(() => setImportResult(null), 2000)
    })
  }

  const handleCopySharePackage = () => {
    const allPresets = loadPresets()
    const json = exportSharePackage({
      componentName: component.name,
      presets: allPresets,
      currentProps: { ...currentProps },
      context: { presetName, showSource, highlightLine },
    })
    navigator.clipboard.writeText(json).then(() => {
      setImportResult({ success: true, msg: '✅ 分享包(含上下文)已复制' })
      setTimeout(() => setImportResult(null), 2500)
    })
  }

  const handleDownloadPresets = () => {
    const allPresets = loadPresets()
    downloadPresetFile(allPresets, component.name)
  }

  const handleDownloadShare = () => {
    const allPresets = loadPresets()
    downloadShareFile({
      componentName: component.name,
      presets: allPresets,
      currentProps: { ...currentProps },
      context: { presetName, showSource, highlightLine },
    })
  }

  const handleImportPaste = () => {
    const text = importText.trim()
    if (!text) return
    if (preview && preview.ok) {
      if (preview.componentName && preview.componentName !== component.name) {
        onImportSwitchComponent(preview.componentName)
      }
      if (preview.currentProps) {
        onImportApplyProps({ ...preview.currentProps })
      }
      if (preview.context) {
        onImportApplyContext(preview.context)
      }
    }
    const result = importPresetsFromJson(text, strategy)
    if (result.success) {
      const parts = [`✅ 导入 ${result.imported.length} 个预设`]
      if (result.skipped.length) parts.push(`跳过 ${result.skipped.length}`)
      if (result.overwritten.length) parts.push(`覆盖 ${result.overwritten.length}`)
      setImportResult({ success: true, msg: parts.join('，'), detail: result })
      setImportText('')
      setPreview(null)
      refreshPresets()
    } else {
      setImportResult({ success: false, msg: `❌ 导入失败: ${result.error || '未知错误'}` })
    }
    setTimeout(() => setImportResult(null), 4000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      handlePreview(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (component.props.length === 0) return null

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          <span>🔖</span> 预设配置
          {activePresetName && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
                borderRadius: '999px',
                fontWeight: 500,
              }}
              title={`当前预设: ${activePresetName}`}
            >
              {activePresetName}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => {
              setShowImportExport(!showImportExport)
              setImportResult(null)
            }}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {showImportExport ? '收起' : '📤 协作/分享'}
          </button>
          <button
            onClick={() => setShowSaveInput(!showSaveInput)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {showSaveInput ? '取消' : '+ 保存当前'}
          </button>
        </div>
      </div>

      {showSaveInput && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input
            type="text"
            value={presetNameInput}
            onChange={(e) => setPresetNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="输入预设名称..."
            autoFocus
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSave}
            disabled={!presetNameInput.trim()}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: presetNameInput.trim() ? '#3b82f6' : '#e5e7eb',
              color: presetNameInput.trim() ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              cursor: presetNameInput.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 500,
            }}
          >
            保存
          </button>
        </div>
      )}

      {showImportExport && (
        <div
          style={{
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#fafafa',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>📦 导出</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopyJson}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="仅预设"
            >
              📋 预设 JSON
            </button>
            <button
              onClick={handleDownloadPresets}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="仅预设"
            >
              💾 预设文件
            </button>
            <button
              onClick={handleCopySharePackage}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                backgroundColor: '#ede9fe',
                color: '#5b21b6',
                border: '1px solid #ddd6fe',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              title="包含：当前参数、预设组、查看上下文"
            >
              🚀 复制分享包
            </button>
            <button
              onClick={handleDownloadShare}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                backgroundColor: '#ede9fe',
                color: '#5b21b6',
                border: '1px solid #ddd6fe',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              title="包含：当前参数、预设组、查看上下文"
            >
              📁 下载分享包
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              📂 导入文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {preview && preview.ok && (
            <div
              style={{
                marginBottom: '8px',
                padding: '8px 10px',
                backgroundColor: preview.conflictNames.length ? '#fffbeb' : '#f0fdf4',
                border: `1px solid ${preview.conflictNames.length ? '#fde68a' : '#bbf7d0'}`,
                borderRadius: '6px',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>
                  <b>组件:</b>{' '}
                  <code style={{ color: '#1d4ed8' }}>{preview.componentName || '(未指定)'}</code>
                </span>
                <span>
                  <b>预设:</b> {preview.presetCount} 个
                  {preview.conflictNames.length > 0 && (
                    <span style={{ color: '#b45309' }}>
                      {' '}（重名 {preview.conflictNames.length}:{' '}
                      {preview.conflictNames.slice(0, 3).join(', ')}
                      {preview.conflictNames.length > 3 ? '...' : ''}）
                    </span>
                  )}
                </span>
                <span>
                  <b>当前参数快照:</b> {preview.hasCurrentProps ? '✅ 有' : '无'}
                </span>
                {preview.context && (
                  <span>
                    <b>上下文:</b>
                    {preview.context.presetName && ` 预设=${preview.context.presetName}`}
                    {preview.context.showSource && ` 源码面板=开`}
                    {preview.context.highlightLine && ` 高亮行=${preview.context.highlightLine}`}
                  </span>
                )}
              </div>
            </div>
          )}

          <textarea
            value={importText}
            onChange={(e) => handlePreview(e.target.value)}
            placeholder="粘贴预设 JSON 或分享包..."
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              outline: 'none',
              minHeight: '56px',
              fontFamily: 'ui-monospace, monospace',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {(['merge', 'skip', 'overwrite'] as ImportConflictStrategy[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    backgroundColor: strategy === s ? '#dbeafe' : '#ffffff',
                    color: strategy === s ? '#1d4ed8' : '#374151',
                    border: `1px solid ${strategy === s ? '#93c5fd' : '#d1d5db'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: strategy === s ? 600 : 400,
                  }}
                  title={
                    s === 'merge'
                      ? '重名自动加后缀(2)(3)... 全部保留'
                      : s === 'skip'
                      ? '重名直接跳过不导入'
                      : '重名用导入内容覆盖现有'
                  }
                >
                  {s === 'merge' ? '➕ 合并(重名加后缀)' : s === 'skip' ? '⏭️ 跳过(保留现有)' : '♻️ 覆盖(用导入的)'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {importResult && (
                <span
                  style={{
                    fontSize: '11px',
                    color: importResult.success ? '#16a34a' : '#dc2626',
                  }}
                >
                  {importResult.msg}
                </span>
              )}
              <button
                onClick={handleImportPaste}
                disabled={!importText.trim()}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  backgroundColor: importText.trim() ? '#16a34a' : '#e5e7eb',
                  color: importText.trim() ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: importText.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                }}
              >
                导入并还原
              </button>
            </div>
          </div>
        </div>
      )}

      {presets.length === 0 ? (
        <div style={{ fontSize: '11px', color: '#9ca3af', padding: '4px 0' }}>
          暂无预设，调整 Props 后点击「+ 保存当前」
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
          {presets.map((preset) => (
            <div
              key={preset.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                backgroundColor: activePresetId === preset.id ? '#eff6ff' : '#f9fafb',
                border: `1px solid ${activePresetId === preset.id ? '#bfdbfe' : '#e5e7eb'}`,
                borderRadius: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <button
                onClick={() => handleLoad(preset)}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: activePresetId === preset.id ? 600 : 400,
                  color: activePresetId === preset.id ? '#1d4ed8' : '#374151',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={preset.name}
              >
                {preset.name}
              </button>
              <button
                onClick={() =>
                  onRequestDiff({ label: `预设「${preset.name}」`, kind: 'preset', props: { ...preset.props } })
                }
                style={{
                  padding: '1px 5px',
                  fontSize: '10px',
                  color: '#4338ca',
                  backgroundColor: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  lineHeight: 1.5,
                }}
                title="与当前 Props 对比差异"
              >
                🆚
              </button>
              <span style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                {new Date(preset.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDelete(preset.id)}
                style={{
                  padding: '2px 4px',
                  fontSize: '12px',
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
                title="删除预设"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PresetPanel
