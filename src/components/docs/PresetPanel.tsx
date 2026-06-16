import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentDoc, PropValue } from '@/types'
import type { Preset } from '@/utils/presetManager'
import {
  addPreset,
  deletePreset,
  downloadPresetFile,
  exportPresetsToJson,
  getPresetsForComponent,
  importPresetsFromJson,
  loadPresets,
} from '@/utils/presetManager'

interface PresetPanelProps {
  component: ComponentDoc
  currentProps: Record<string, PropValue>
  onLoadPreset: (props: Record<string, PropValue>, presetName: string) => void
}

export const PresetPanel: React.FC<PresetPanelProps> = ({
  component,
  currentProps,
  onLoadPreset,
}) => {
  const [presets, setPresets] = useState<Preset[]>([])
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [activePresetName, setActivePresetName] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState<{ success: boolean; msg: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshPresets = useCallback(() => {
    setPresets(getPresetsForComponent(component.name))
  }, [component.name])

  useEffect(() => {
    refreshPresets()
    setActivePresetId(null)
    setActivePresetName(null)
    setShowImportExport(false)
    setImportResult(null)
    setImportText('')
  }, [component.name, refreshPresets])

  const handleSave = () => {
    const name = presetName.trim()
    if (!name) return
    addPreset(name, component.name, { ...currentProps })
    setPresetName('')
    setShowSaveInput(false)
    refreshPresets()
  }

  const handleDelete = (id: string) => {
    deletePreset(id)
    if (activePresetId === id) {
      setActivePresetId(null)
      setActivePresetName(null)
    }
    refreshPresets()
  }

  const handleLoad = (preset: Preset) => {
    setActivePresetId(preset.id)
    setActivePresetName(preset.name)
    onLoadPreset({ ...preset.props }, preset.name)
  }

  const handleCopyJson = () => {
    const allPresets = loadPresets()
    const json = exportPresetsToJson(allPresets, component.name)
    navigator.clipboard.writeText(json).then(() => {
      setImportResult({ success: true, msg: '✅ 已复制到剪贴板' })
      setTimeout(() => setImportResult(null), 2000)
    })
  }

  const handleDownloadFile = () => {
    const allPresets = loadPresets()
    downloadPresetFile(allPresets, component.name)
  }

  const handleImportPaste = () => {
    const result = importPresetsFromJson(importText.trim())
    if (result.success) {
      setImportResult({ success: true, msg: `✅ 成功导入 ${result.imported.length} 个预设` })
      setImportText('')
      refreshPresets()
    } else {
      setImportResult({ success: false, msg: `❌ 导入失败: ${result.error || '未知错误'}` })
    }
    setTimeout(() => setImportResult(null), 3000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      setImportText(text)
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
            {showImportExport ? '收起' : '📤 导入/导出'}
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
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
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
            disabled={!presetName.trim()}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: presetName.trim() ? '#3b82f6' : '#e5e7eb',
              color: presetName.trim() ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              cursor: presetName.trim() ? 'pointer' : 'not-allowed',
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
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
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
            >
              📋 复制 JSON
            </button>
            <button
              onClick={handleDownloadFile}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              💾 下载 .json 文件
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              📂 选择文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="粘贴预设 JSON，或从文件导入..."
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              outline: 'none',
              minHeight: '60px',
              fontFamily: 'ui-monospace, monospace',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              只导入属于「{component.name}」的预设
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
                导入
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
                gap: '6px',
                padding: '6px 8px',
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
