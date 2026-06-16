import React from 'react'
import type { ComponentDoc, PropValue } from '@/types'

interface ControlPanelProps {
  component: ComponentDoc
  propsValues: Record<string, PropValue>
  onPropChange: (propName: string, value: PropValue) => void
}

function parseUnionType(type: string): string[] | null {
  const match = type.match(/^["']([^"']+)["'](\s*\|\s*["']([^"']+)["'])*$/)
  if (match) {
    return type.split('|').map((t) => t.trim().replace(/["']/g, ''))
  }
  return null
}

function inferControlType(type: string): 'text' | 'number' | 'boolean' | 'select' | 'textarea' {
  const unionOptions = parseUnionType(type)
  if (unionOptions) return 'select'
  if (type === 'boolean') return 'boolean'
  if (type === 'number') return 'number'
  if (type === 'string' || type.includes('string')) return 'text'
  if (type.includes('ReactNode') || type.includes('React.ReactNode')) return 'textarea'
  if (type.includes('=>') || type.includes('function')) return 'text'
  if (type.includes('[]')) return 'textarea'
  return 'text'
}

function parseDefaultValue(defaultValue: string | undefined, type: string): PropValue {
  if (defaultValue === undefined) return undefined
  const trimmed = defaultValue.trim()

  if (trimmed === "''" || trimmed === '""') return ''
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false

  const num = Number(trimmed)
  if (!isNaN(num)) return num

  if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  component,
  propsValues,
  onPropChange,
}) => {
  if (component.props.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '13px',
        }}
      >
        暂无可调参数
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {component.props.map((prop) => {
        const currentValue = propsValues[prop.name]
        const controlType = inferControlType(prop.type)
        const unionOptions = parseUnionType(prop.type)

        const hasValue = currentValue !== undefined

        return (
          <div key={prop.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {prop.name}
              </label>
              {prop.required && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    borderRadius: '999px',
                  }}
                >
                  必填
                </span>
              )}
            </div>
            {prop.description && (
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                {prop.description}
              </p>
            )}

            {controlType === 'select' && unionOptions && (
              <select
                value={String(currentValue ?? '')}
                onChange={(e) => onPropChange(prop.name, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: hasValue ? '#ffffff' : '#f9fafb',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">-- 未设置 --</option>
                {unionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {controlType === 'boolean' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onPropChange(prop.name, true)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentValue === true ? '#3b82f6' : '#ffffff',
                    color: currentValue === true ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontWeight: currentValue === true ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  true
                </button>
                <button
                  onClick={() => onPropChange(prop.name, false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentValue === false ? '#3b82f6' : '#ffffff',
                    color: currentValue === false ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontWeight: currentValue === false ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  false
                </button>
                <button
                  onClick={() => onPropChange(prop.name, undefined)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {controlType === 'number' && (
              <input
                type="number"
                value={Number(currentValue ?? 0)}
                onChange={(e) => onPropChange(prop.name, Number(e.target.value))}
                placeholder={hasValue ? '' : '输入数字...'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: hasValue ? '#ffffff' : '#f9fafb',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {controlType === 'textarea' && (
              <textarea
                value={String(currentValue ?? '')}
                onChange={(e) => onPropChange(prop.name, e.target.value)}
                placeholder={hasValue ? '' : '输入值...'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: hasValue ? '#ffffff' : '#f9fafb',
                  outline: 'none',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {controlType === 'text' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={String(currentValue ?? '')}
                  onChange={(e) => onPropChange(prop.name, e.target.value)}
                  placeholder={hasValue ? '' : `输入 ${prop.type}...`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: hasValue ? '#ffffff' : '#f9fafb',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {currentValue !== undefined && (
                  <button
                    onClick={() => onPropChange(prop.name, undefined)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280',
                      cursor: 'pointer',
                    }}
                  >
                    清除
                  </button>
                )}
              </div>
            )}

            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                类型: {prop.type}
              </span>
              {prop.defaultValue && (
                <button
                  onClick={() =>
                    onPropChange(prop.name, parseDefaultValue(prop.defaultValue, prop.type))
                  }
                  style={{
                    fontSize: '11px',
                    color: '#3b82f6',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  恢复默认: {prop.defaultValue}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ControlPanel
