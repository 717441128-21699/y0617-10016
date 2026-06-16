import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { PropValue } from '@/types'
import {
  addHistoryRecord,
  clearHistory,
  formatActionLabel,
  formatTimeAgo,
  loadHistory,
  type HistoryRecord,
} from '@/utils/historyManager'

interface HistoryPanelProps {
  componentName: string
  currentProps: Record<string, PropValue>
  onRestore: (props: Record<string, PropValue>, componentName: string) => void
  onRequestDiff: (target: { label: string; kind: 'history'; props: Record<string, PropValue>; recordId: string }) => void
  externalTrigger?: { type: 'add'; action: HistoryRecord['action']; payload?: Partial<HistoryRecord> } | null
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  componentName,
  currentProps,
  onRestore,
  onRequestDiff,
  externalTrigger,
}) => {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const lastExternalRef = useRef(externalTrigger)

  const refresh = useCallback(() => {
    setRecords(loadHistory())
  }, [])

  useEffect(() => {
    refresh()
  }, [componentName, isOpen, refresh])

  useEffect(() => {
    if (!externalTrigger || externalTrigger === lastExternalRef.current) return
    lastExternalRef.current = externalTrigger
    if (externalTrigger.type === 'add' && externalTrigger.payload) {
      addHistoryRecord({
        action: externalTrigger.action,
        componentName: externalTrigger.payload.componentName || componentName,
        props: externalTrigger.payload.props ? { ...externalTrigger.payload.props } : { ...currentProps },
        presetName: externalTrigger.payload.presetName,
        propName: externalTrigger.payload.propName,
        propValue: externalTrigger.payload.propValue,
      })
    }
    refresh()
  }, [externalTrigger, componentName, currentProps, refresh])

  const handleClear = () => {
    clearHistory()
    refresh()
  }

  const handleRestore = (record: HistoryRecord) => {
    onRestore({ ...record.props }, record.componentName)
  }

  const handleDiff = (record: HistoryRecord) => {
    const label = `${formatActionLabel(record.action).label} · ${formatTimeAgo(record.timestamp)}`
    onRequestDiff({ label, kind: 'history', props: { ...record.props }, recordId: record.id })
  }

  const allRecords = isOpen ? records : records.slice(0, 20)

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
          <span>🕘</span> 操作历史
          <span style={{ fontSize: '10px', fontWeight: 400, color: '#9ca3af' }}>
            ({records.length} 条)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleClear}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            清空
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              backgroundColor: isOpen ? '#eff6ff' : '#f3f4f6',
              color: isOpen ? '#1d4ed8' : '#6b7280',
              border: `1px solid ${isOpen ? '#bfdbfe' : '#e5e7eb'}`,
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isOpen ? '收起' : '展开全部'}
          </button>
        </div>
      </div>

      {allRecords.length === 0 ? (
        <div style={{ fontSize: '11px', color: '#9ca3af', padding: '8px 0' }}>
          暂无操作记录
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxHeight: isOpen ? '260px' : '140px',
            overflowY: 'auto',
          }}
        >
          {allRecords.map((record) => {
            const { label, icon, color } = formatActionLabel(record.action)
            const isCurrentComponent = record.componentName === componentName
            return (
              <div
                key={record.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  textAlign: 'left',
                  backgroundColor: isCurrentComponent ? '#fafafa' : '#f8fafc',
                  border: `1px solid ${isCurrentComponent ? '#e5e7eb' : '#e2e8f0'}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '13px', flexShrink: 0 }}>{icon}</span>
                <button
                  onClick={() => handleRestore(record)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: 0,
                  }}
                  title={`恢复至 ${record.componentName} · ${new Date(record.timestamp).toLocaleString()}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color }}>{label}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        backgroundColor: isCurrentComponent ? '#eff6ff' : '#f1f5f9',
                        color: isCurrentComponent ? '#1d4ed8' : '#475569',
                        borderRadius: '999px',
                        fontWeight: 500,
                      }}
                    >
                      {isCurrentComponent ? '📍当前组件' : `🔀 ${record.componentName}`}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                    {record.presetName && <span>预设: {record.presetName} · </span>}
                    {record.propName && (
                      <span>
                        Prop:{' '}
                        <code style={{ fontFamily: 'ui-monospace, monospace' }}>{record.propName}</code>
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleDiff(record)}
                  style={{
                    padding: '1px 5px',
                    fontSize: '10px',
                    color: '#4338ca',
                    backgroundColor: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    lineHeight: 1.5,
                    flexShrink: 0,
                  }}
                  title="与当前状态对比"
                >
                  🆚
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {formatTimeAgo(record.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <HistoryRecorder
        componentName={componentName}
        currentProps={currentProps}
        onRefresh={refresh}
      />
    </div>
  )
}

interface HistoryRecorderProps {
  componentName: string
  currentProps: Record<string, PropValue>
  onRefresh: () => void
}

const HistoryRecorder: React.FC<HistoryRecorderProps> = ({ componentName, currentProps, onRefresh }) => {
  const lastComponentRef = useRef<string | null>(null)
  const lastPropsSnapshotRef = useRef<string>('')
  const recordedKeysRef = useRef<Set<string>>(new Set())
  const skippedFirstRef = useRef(false)

  useEffect(() => {
    if (!skippedFirstRef.current) {
      skippedFirstRef.current = true
      lastComponentRef.current = componentName
      lastPropsSnapshotRef.current = JSON.stringify(currentProps)
      for (const k of Object.keys(currentProps)) recordedKeysRef.current.add(`${componentName}::${k}`)
      return
    }

    if (lastComponentRef.current !== null && componentName !== lastComponentRef.current) {
      addHistoryRecord({
        action: 'switch-component',
        componentName,
        props: { ...currentProps },
      })
      lastComponentRef.current = componentName
      lastPropsSnapshotRef.current = JSON.stringify(currentProps)
      onRefresh()
      return
    }

    const prev: Record<string, PropValue> = JSON.parse(lastPropsSnapshotRef.current || '{}')
    const prevKeys = Object.keys(prev)
    const currKeys = Object.keys(currentProps)
    let changedKey: string | null = null
    let changedValue: PropValue | undefined = undefined
    let isFirstSet = false

    for (const key of currKeys) {
      const p = JSON.stringify(prev[key])
      const c = JSON.stringify(currentProps[key])
      if (p !== c) {
        changedKey = key
        changedValue = currentProps[key]
        const marker = `${componentName}::${key}`
        if (!(key in prev) && !recordedKeysRef.current.has(marker)) {
          isFirstSet = true
        }
        recordedKeysRef.current.add(marker)
        break
      }
    }

    if (!changedKey && prevKeys.length !== currKeys.length) {
      for (const key of prevKeys) {
        if (!(key in currentProps)) {
          changedKey = key
          changedValue = undefined
          break
        }
      }
    }

    if (changedKey) {
      const last = loadHistory()[0]
      const isSamePropSameValue =
        last &&
        last.action === 'change-prop' &&
        last.componentName === componentName &&
        last.propName === changedKey &&
        JSON.stringify(last.propValue) === JSON.stringify(changedValue)
      if (!isSamePropSameValue) {
        addHistoryRecord({
          action: 'change-prop',
          componentName,
          props: { ...currentProps },
          propName: changedKey,
          propValue: changedValue,
        })
        if (isFirstSet) {
          onRefresh()
        }
      }
      lastPropsSnapshotRef.current = JSON.stringify(currentProps)
      onRefresh()
    }
  }, [componentName, currentProps, onRefresh])

  return null
}

export default HistoryPanel
