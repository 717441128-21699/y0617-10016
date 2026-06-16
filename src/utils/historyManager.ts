import type { PropValue } from '@/types'

export type HistoryActionType = 'switch-component' | 'change-prop' | 'load-preset' | 'reset-props'

export interface HistoryRecord {
  id: string
  timestamp: number
  action: HistoryActionType
  componentName: string
  props: Record<string, PropValue>
  presetName?: string
  propName?: string
  propValue?: PropValue
}

const STORAGE_KEY = 'component-doc-history'
const MAX_RECORDS = 50

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryRecord[]
  } catch {
    return []
  }
}

export function saveHistory(records: HistoryRecord[]): void {
  try {
    const trimmed = records.slice(0, MAX_RECORDS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    console.warn('保存历史记录失败:', e)
  }
}

export function addHistoryRecord(record: Omit<HistoryRecord, 'id' | 'timestamp'>): HistoryRecord {
  const history = loadHistory()
  const newRecord: HistoryRecord = {
    id: generateId(),
    timestamp: Date.now(),
    ...record,
  }
  history.unshift(newRecord)
  saveHistory(history)
  return newRecord
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getHistoryForComponent(componentName: string): HistoryRecord[] {
  return loadHistory().filter((r) => r.componentName === componentName)
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}秒前`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}天前`
  return new Date(timestamp).toLocaleDateString()
}

export function formatActionLabel(action: HistoryActionType): { label: string; icon: string; color: string } {
  switch (action) {
    case 'switch-component':
      return { label: '切换组件', icon: '🔄', color: '#6b7280' }
    case 'change-prop':
      return { label: '修改Props', icon: '✏️', color: '#3b82f6' }
    case 'load-preset':
      return { label: '加载预设', icon: '🔖', color: '#8b5cf6' }
    case 'reset-props':
      return { label: '重置Props', icon: '↺', color: '#f59e0b' }
  }
}
