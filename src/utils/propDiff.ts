import type { PropValue } from '@/types'

export interface PropDiffEntry {
  name: string
  oldValue: PropValue
  newValue: PropValue
  status: 'added' | 'removed' | 'changed'
  oldDisplay: string
  newDisplay: string
}

function displayValue(v: PropValue): string {
  if (v === undefined || v === null) return '—'
  try {
    if (typeof v === 'string') return v.length > 40 ? v.slice(0, 40) + '…' : v
    const s = JSON.stringify(v)
    return s.length > 40 ? s.slice(0, 40) + '…' : s
  } catch {
    return String(v)
  }
}

export function diffProps(
  oldProps: Record<string, PropValue> | undefined,
  newProps: Record<string, PropValue> | undefined
): PropDiffEntry[] {
  const a = oldProps ?? {}
  const b = newProps ?? {}
  const entries: PropDiffEntry[] = []
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))

  for (const key of keys) {
    const inA = key in a
    const inB = key in b
    if (inA && !inB) {
      entries.push({
        name: key,
        oldValue: a[key],
        newValue: undefined,
        status: 'removed',
        oldDisplay: displayValue(a[key]),
        newDisplay: '—',
      })
    } else if (!inA && inB) {
      entries.push({
        name: key,
        oldValue: undefined,
        newValue: b[key],
        status: 'added',
        oldDisplay: '—',
        newDisplay: displayValue(b[key]),
      })
    } else {
      const oldStr = JSON.stringify(a[key])
      const newStr = JSON.stringify(b[key])
      if (oldStr !== newStr) {
        entries.push({
          name: key,
          oldValue: a[key],
          newValue: b[key],
          status: 'changed',
          oldDisplay: displayValue(a[key]),
          newDisplay: displayValue(b[key]),
        })
      }
    }
  }

  return entries.sort((x, y) => x.name.localeCompare(y.name))
}

export function statusLabel(status: PropDiffEntry['status']): { label: string; color: string; bg: string } {
  switch (status) {
    case 'added':
      return { label: '+ 新增', color: '#047857', bg: '#ecfdf5' }
    case 'removed':
      return { label: '− 移除', color: '#b91c1c', bg: '#fef2f2' }
    case 'changed':
      return { label: '✱ 变更', color: '#b45309', bg: '#fffbeb' }
  }
}
