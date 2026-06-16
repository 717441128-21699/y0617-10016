import type { PropValue } from '@/types'

export interface Preset {
  id: string
  name: string
  componentName: string
  props: Record<string, PropValue>
  createdAt: number
}

const STORAGE_KEY = 'component-doc-presets'

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
