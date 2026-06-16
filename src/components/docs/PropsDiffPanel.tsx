import React from 'react'
import type { PropValue } from '@/types'
import { diffProps, statusLabel, type PropDiffEntry } from '@/utils/propDiff'

export interface DiffTarget {
  label: string
  kind: 'preset' | 'history'
  props: Record<string, PropValue>
  meta?: Record<string, unknown>
}

interface PropsDiffPanelProps {
  title: string
  target: DiffTarget | null
  currentProps: Record<string, PropValue>
  onClose: () => void
  onApplyTarget: () => void
}

export const PropsDiffPanel: React.FC<PropsDiffPanelProps> = ({
  title,
  target,
  currentProps,
  onClose,
  onApplyTarget,
}) => {
  if (!target) return null

  const diff: PropDiffEntry[] = diffProps(target.props, currentProps)
  const added = diff.filter((d) => d.status === 'added').length
  const removed = diff.filter((d) => d.status === 'removed').length
  const changed = diff.filter((d) => d.status === 'changed').length

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e7ff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(79,70,229,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4338ca' }}>
            🆚 {title}
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              backgroundColor: '#eef2ff',
              color: '#4338ca',
              borderRadius: '999px',
              fontWeight: 500,
            }}
          >
            与「{target.label}」对比
          </span>
          {changed > 0 && (
            <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 600 }}>
              变更 {changed}
            </span>
          )}
          {added > 0 && (
            <span style={{ fontSize: '10px', color: '#047857', fontWeight: 600 }}>
              +{added}
            </span>
          )}
          {removed > 0 && (
            <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 600 }}>
              −{removed}
            </span>
          )}
          {diff.length === 0 && (
            <span style={{ fontSize: '10px', color: '#047857', fontWeight: 600 }}>
              ✨ 完全一致
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onApplyTarget}
            style={{
              padding: '3px 10px',
              fontSize: '11px',
              backgroundColor: '#ede9fe',
              color: '#5b21b6',
              border: '1px solid #ddd6fe',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            🔙 应用目标
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      </div>

      {diff.length === 0 ? (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#ecfdf5',
            color: '#047857',
            fontSize: '12px',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          当前 Props 与目标完全一致，没有差异 🎉
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.4fr) minmax(0, 1.4fr)',
            gap: '6px',
            fontSize: '11px',
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: '#6b7280',
              padding: '6px 8px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            Prop 名称
          </div>
          <div
            style={{
              fontWeight: 600,
              color: '#6b7280',
              padding: '6px 8px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            目标值
          </div>
          <div
            style={{
              fontWeight: 600,
              color: '#6b7280',
              padding: '6px 8px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            当前值
          </div>
          {diff.map((d) => {
            const s = statusLabel(d.status)
            return (
              <React.Fragment key={d.name}>
                <div
                  style={{
                    padding: '6px 8px',
                    backgroundColor: s.bg,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 6px',
                      color: s.color,
                      backgroundColor: '#fff',
                      border: `1px solid ${s.color}22`,
                      borderRadius: '3px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {s.label}
                  </span>
                  <code
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '11px',
                      color: '#1f2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={d.name}
                  >
                    {d.name}
                  </code>
                </div>
                <div
                  style={{
                    padding: '6px 8px',
                    backgroundColor: '#fafafa',
                    borderRadius: '4px',
                    fontFamily: 'ui-monospace, monospace',
                    color: d.status === 'added' ? '#d1d5db' : '#111827',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={String(d.oldValue)}
                >
                  {d.oldDisplay}
                </div>
                <div
                  style={{
                    padding: '6px 8px',
                    backgroundColor: '#fafafa',
                    borderRadius: '4px',
                    fontFamily: 'ui-monospace, monospace',
                    color: d.status === 'removed' ? '#d1d5db' : '#111827',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={String(d.newValue)}
                >
                  {d.newDisplay}
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PropsDiffPanel
