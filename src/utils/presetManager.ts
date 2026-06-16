import type { PropValue } from '@/types'

export interface Preset {
  id: string
  name: string
  componentName: string
  props: Record<string, PropValue>
  createdAt: number
}

const STORAGE_KEY = 'component-doc-presets'

export const PRESET_EXPORT_VERSION = 2

export interface PresetExportData {
  version: number
  exportedAt: number
  presets: Preset[]
}

export interface SharePackageData {
  version: number
  exportedAt: number
  type: 'share-package'
  componentName: string
  context?: {
    presetName?: string | null
    showSource?: boolean
    highlightLine?: number | null
  }
  currentProps?: Record<string, PropValue>
  presets: Preset[]
}

export type ImportConflictStrategy = 'merge' | 'skip' | 'overwrite'

export interface ImportResult {
  success: boolean
  imported: Preset[]
  skipped: string[]
  overwritten: string[]
  error?: string
  packageInfo?: {
    componentName?: string
    presetCount: number
    hasCurrentProps: boolean
  }
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

export function exportSharePackage(opts: {
  componentName: string
  presets: Preset[]
  currentProps?: Record<string, PropValue>
  context?: {
    presetName?: string | null
    showSource?: boolean
    highlightLine?: number | null
  }
}): string {
  const pkg: SharePackageData = {
    version: PRESET_EXPORT_VERSION,
    exportedAt: Date.now(),
    type: 'share-package',
    componentName: opts.componentName,
    presets: opts.presets.filter((p) => p.componentName === opts.componentName),
    currentProps: opts.currentProps,
    context: opts.context,
  }
  return JSON.stringify(pkg, null, 2)
}

export function downloadShareFile(opts: {
  componentName: string
  presets: Preset[]
  currentProps?: Record<string, PropValue>
  context?: SharePackageData['context']
}): void {
  const json = exportSharePackage(opts)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.componentName}-share-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function extractPresetsFromJson(json: string): {
  ok: boolean
  presets: Preset[]
  packageInfo?: ImportResult['packageInfo']
  context?: SharePackageData['context']
  currentProps?: Record<string, PropValue>
  componentNameFromPkg?: string
  error?: string
} {
  try {
    const raw = JSON.parse(json)
    if (raw && raw.type === 'share-package') {
      const pkg = raw as SharePackageData
      return {
        ok: true,
        presets: Array.isArray(pkg.presets) ? pkg.presets : [],
        componentNameFromPkg: pkg.componentName,
        context: pkg.context,
        currentProps: pkg.currentProps,
        packageInfo: {
          componentName: pkg.componentName,
          presetCount: Array.isArray(pkg.presets) ? pkg.presets.length : 0,
          hasCurrentProps: !!pkg.currentProps && Object.keys(pkg.currentProps).length > 0,
        },
      }
    }
    if (Array.isArray(raw)) {
      return { ok: true, presets: raw, packageInfo: { presetCount: raw.length, hasCurrentProps: false } }
    }
    if (raw && Array.isArray(raw.presets)) {
      return { ok: true, presets: raw.presets, packageInfo: { presetCount: raw.presets.length, hasCurrentProps: false } }
    }
    return { ok: false, presets: [], error: '不支持的 JSON 格式' }
  } catch (e) {
    return { ok: false, presets: [], error: (e as Error).message }
  }
}

export function parseSharePackage(json: string): {
  ok: boolean
  error?: string
  componentName?: string
  presetNames: string[]
  presetCount: number
  hasCurrentProps: boolean
  conflictNames: string[]
  context?: SharePackageData['context']
  currentProps?: Record<string, PropValue>
} {
  const extracted = extractPresetsFromJson(json)
  if (!extracted.ok) {
    return { ok: false, error: extracted.error, presetNames: [], presetCount: 0, hasCurrentProps: false, conflictNames: [] }
  }
  const existing = loadPresets()
  const incomingNames = new Set<string>()
  const conflictNames: string[] = []
  for (const p of extracted.presets) {
    if (!p.name || !p.componentName || !p.props) continue
    incomingNames.add(`${p.componentName}::${p.name}`)
    const exists = existing.some(
      (e) => e.componentName === p.componentName && e.name === p.name
    )
    if (exists) conflictNames.push(p.name)
  }
  return {
    ok: true,
    componentName: extracted.componentNameFromPkg,
    presetNames: extracted.presets.map((p) => p.name).filter(Boolean),
    presetCount: extracted.presets.length,
    hasCurrentProps: !!extracted.currentProps && Object.keys(extracted.currentProps!).length > 0,
    conflictNames,
    context: extracted.context,
    currentProps: extracted.currentProps,
  }
}

export function importPresetsFromJson(
  json: string,
  strategy: ImportConflictStrategy = 'merge'
): ImportResult {
  const extracted = extractPresetsFromJson(json)
  if (!extracted.ok) {
    return { success: false, imported: [], skipped: [], overwritten: [], error: extracted.error }
  }

  const validPresets = extracted.presets.filter(
    (p) => p.name && p.componentName && p.props
  )

  const existing = loadPresets()
  const imported: Preset[] = []
  const skipped: string[] = []
  const overwritten: string[] = []

  for (const p of validPresets) {
    const conflictIdx = existing.findIndex(
      (e) => e.componentName === p.componentName && e.name === p.name
    )
    const hasConflict = conflictIdx !== -1

    if (hasConflict) {
      if (strategy === 'skip') {
        skipped.push(p.name)
        continue
      }
      if (strategy === 'overwrite') {
        const updated: Preset = { ...existing[conflictIdx], props: { ...p.props } }
        existing[conflictIdx] = updated
        overwritten.push(p.name)
        imported.push(updated)
        continue
      }
    }

    let finalName = p.name
    if (strategy === 'merge' && hasConflict) {
      let i = 2
      while (existing.some((e) => e.componentName === p.componentName && e.name === finalName)) {
        finalName = `${p.name} (${i++})`
      }
    }
    const newPreset: Preset = {
      id: generateId(),
      name: finalName,
      componentName: p.componentName,
      props: p.props,
      createdAt: p.createdAt || Date.now(),
    }
    existing.push(newPreset)
    imported.push(newPreset)
  }

  savePresets(existing)
  return {
    success: true,
    imported,
    skipped,
    overwritten,
    packageInfo: extracted.packageInfo,
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
