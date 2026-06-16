import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { PropValue } from '@/types'
import {
  addHistoryRecord,
  clearHistory,
  formatActionLabel,
  formatTimeAgo,
  getHistoryForComponent,
  loadHistory,
  type HistoryRecord,
} from '@/utils/historyManager'

interface HistoryPanelProps {
  componentName: string
  currentProps: Record<string, PropValue>
  onRestore: (props: Record<string, PropValue>, componentName: string) => void
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  componentName,
  currentProps,
  onRestore,
}) => {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const refresh = useCallback(() => {
    setRecords(getHistoryForComponent(componentName))
  }, [componentName])

  useEffect(() => {
    refresh()
  }, [componentName, isOpen, refresh])

  const handleRecordChange = useCallback((record: Omit<HistoryRecord, 'id' | 'timestamp'>) => {
    addHistoryRecord(record)
    if (isOpen) refresh()
  }, [isOpen, refresh])

  const handleClear = () => {
    clearHistory()
    refresh()
  }

  const handleRestore = (record: HistoryRecord) => {
    onRestore({ ...record.props }, record.componentName)
  }

  const allRecords = isOpen ? records : loadHistory().slice(0, 20)

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
            ({allRecords.length} 条)
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
            return (
              <button
                key={record.id}
                onClick={() => handleRestore(record)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  textAlign: 'left',
                  backgroundColor: '#fafafa',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#eff6ff'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#bfdbfe'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fafafa'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'
                }}
              >
                <span style={{ fontSize: '14px' }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, color }}>{label}</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                      · {record.componentName}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                    {record.presetName && <span>预设: {record.presetName} </span>}
                    {record.propName && (
                      <span>
                        Prop: <code style={{ fontFamily: 'ui-monospace, monospace' }}>{record.propName}</code>
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {formatTimeAgo(record.timestamp)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <HistoryRecorder
        componentName={componentName}
        currentProps={currentProps}
        onRecord={handleRecordChange}
      />
    </div>
  )
}

interface HistoryRecorderProps {
  componentName: string
  currentProps: Record<string, PropValue>
  onRecord: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => void
}

const HistoryRecorder: React.FC<HistoryRecorderProps> = ({
  componentName,
  currentProps,
  onRecord,
}) => {
  const lastComponentRef = useRef(componentName)
  const lastPropsRef = useRef(currentProps)
  const hasRecordedMountRef = useRef(false)

  useEffect(() => {
    if (!hasRecordedMountRef.current) {
      hasRecordedMountRef.current = true
      lastComponentRef.current = componentName
      lastPropsRef.current = currentProps
      return
    }

    if (componentName !== lastComponentRef.current) {
      onRecord({
        action: 'switch-component',
        componentName,
        props: { ...currentProps },
      })
      lastComponentRef.current = componentName
      lastPropsRef.current = currentProps
      return
    }

    const prevKeys = Object.keys(lastPropsRef.current)
    const currKeys = Object.keys(currentProps)
    if (prevKeys.length !== currKeys.length) {
      lastPropsRef.current = currentProps
      return
    }
    let changedKey: string | null = null
    for (const key of currKeys) {
      const prev = JSON.stringify(lastPropsRef.current[key])
      const curr = JSON.stringify(currentProps[key])
      if (prev !== curr) {
        changedKey = key
        break
      }
    }
    if (changedKey) {
      onRecord({
        action: 'change-prop',
        componentName,
        props: { ...currentProps },
        propName: changedKey,
        propValue: currentProps[changedKey],
      })
      lastPropsRef.current = currentProps
    }
  }, [componentName, currentProps, onRecord])

  return null
}

export default HistoryPanel
