import React, { useCallback, useEffect, useState } from 'react'
import type { ComponentDoc, PropValue } from '@/types'
import type { Preset } from '@/utils/presetManager'
import { addPreset, deletePreset, getPresetsForComponent } from '@/utils/presetManager'

interface PresetPanelProps {
  component: ComponentDoc
  currentProps: Record<string, PropValue>
  onLoadPreset: (props: Record<string, PropValue>) => void
}

export const PresetPanel: React.FC<PresetPanelProps> = ({
  component,
  currentProps,
  onLoadPreset,
}) => {
  const [presets, setPresets] = useState<Preset[]>([])
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  const refreshPresets = useCallback(() => {
    setPresets(getPresetsForComponent(component.name))
  }, [component.name])

  useEffect(() => {
    refreshPresets()
    setActivePresetId(null)
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
    if (activePresetId === id) setActivePresetId(null)
    refreshPresets()
  }

  const handleLoad = (preset: Preset) => {
    setActivePresetId(preset.id)
    onLoadPreset({ ...preset.props })
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
        </div>
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

      {presets.length === 0 ? (
        <div style={{ fontSize: '11px', color: '#9ca3af', padding: '4px 0' }}>
          暂无预设，调整 Props 后点击"保存当前"
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
