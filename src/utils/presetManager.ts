import type { PropValue } from '@/types'

export interface Preset {
  id: string
  name: string
  componentName: string
  props: Record<string, PropValue>
  createdAt: number
}

const STORAGE_KEY = 'component-doc-presets'

export const PRESET_EXPORT_VERSION = 1

export interface PresetExportData {
  version: number
  exportedAt: number
  presets: Preset[]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Preset[]
  } catch {
    return []
  }
}

export function savePresets(presets: Preset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch (e) {
    console.warn('保存预设失败:', e)
  }
}

export function getPresetsForComponent(componentName: string): Preset[] {
  return loadPresets().filter((p) => p.componentName === componentName)
}

export function addPreset(name: string, componentName: string, props: Record<string, PropValue>): Preset {
  const presets = loadPresets()
  const preset: Preset = {
    id: generateId(),
    name,
    componentName,
    props,
    createdAt: Date.now(),
  }
  presets.push(preset)
  savePresets(presets)
  return preset
}

export function deletePreset(presetId: string): void {
  const presets = loadPresets().filter((p) => p.id !== presetId)
  savePresets(presets)
}

export function updatePreset(presetId: string, updates: Partial<Pick<Preset, 'name' | 'props'>>): void {
  const presets = loadPresets().map((p) =>
    p.id === presetId ? { ...p, ...updates } : p
  )
  savePresets(presets)
}

export function exportPresetsToJson(presets: Preset[], componentName?: string): string {
  const target = componentName ? presets.filter((p) => p.componentName === componentName) : presets
  const data: PresetExportData = {
    version: PRESET_EXPORT_VERSION,
    exportedAt: Date.now(),
    presets: target,
  }
  return JSON.stringify(data, null, 2)
}

export function importPresetsFromJson(json: string): {
  success: boolean
  imported: Preset[]
  error?: string
} {
  try {
    let data: PresetExportData
    try {
      data = JSON.parse(json)
    } catch {
      const legacy = JSON.parse(json)
      if (Array.isArray(legacy)) {
        data = { version: 0, exportedAt: Date.now(), presets: legacy }
      } else {
        throw new Error('JSON 格式不正确')
      }
    }

    if (!data.presets || !Array.isArray(data.presets)) {
      return { success: false, imported: [], error: '缺少 presets 数组' }
    }

    const existing = loadPresets()
    const imported: Preset[] = []

    for (const p of data.presets) {
      if (!p.name || !p.componentName || !p.props) continue
      const newPreset: Preset = {
        id: generateId(),
        name: p.name,
        componentName: p.componentName,
        props: p.props,
        createdAt: p.createdAt || Date.now(),
      }
      existing.push(newPreset)
      imported.push(newPreset)
    }

    savePresets(existing)
    return { success: true, imported }
  } catch (e) {
    return { success: false, imported: [], error: (e as Error).message }
  }
}

export function downloadPresetFile(presets: Preset[], componentName: string): void {
  const json = exportPresetsToJson(presets, componentName)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${componentName}-presets-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
