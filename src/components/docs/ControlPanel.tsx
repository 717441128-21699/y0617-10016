import React, { useMemo, useState } from 'react'
import type { ComponentDoc, PropValidation, PropValue } from '@/types'
import {
  generateSampleValue,
  inferControlType,
  isComplexType,
  isFunctionType,
  isReactNodeType,
  parseDefaultValue,
  parseUnionType,
  validatePropValue,
} from '@/utils/propUtils'

interface ControlPanelProps {
  component: ComponentDoc
  propsValues: Record<string, PropValue>
  onPropChange: (propName: string, value: PropValue) => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  component,
  propsValues,
  onPropChange,
}) => {
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({})

  const validations = useMemo(() => {
    const result: Record<string, PropValidation> = {}
    for (const prop of component.props) {
      const value = propsValues[prop.name]
      const validation = validatePropValue(value, prop)
      if (!validation.valid) {
        result[prop.name] = validation
      }
    }
    return result
  }, [component, propsValues])

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

  const handleJsonChange = (propName: string, rawValue: string) => {
    onPropChange(propName, rawValue)
    try {
      if (rawValue.trim() !== '') {
        JSON.parse(rawValue)
      }
      setJsonErrors((prev) => {
        const next = { ...prev }
        delete next[propName]
        return next
      })
    } catch (e) {
      setJsonErrors((prev) => ({
        ...prev,
        [propName]: (e as Error).message,
      }))
    }
  }

  const handleFillSample = (propName: string, type: string) => {
    const sample = generateSampleValue(type)
    const controlType = inferControlType(type)
    if (controlType === 'json') {
      handleJsonChange(propName, sample as string)
    } else {
      onPropChange(propName, sample)
    }
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
        const validation = validations[prop.name]
        const jsonError = jsonErrors[prop.name]
        const hasError = validation?.valid === false || !!jsonError
        const errorMsg = jsonError || validation?.error

        const complex = isComplexType(prop.type)
        const isFunc = isFunctionType(prop.type)
        const isNode = isReactNodeType(prop.type)

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
              {isFunc && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    backgroundColor: '#e0e7ff',
                    color: '#4338ca',
                    borderRadius: '999px',
                  }}
                >
                  函数
                </span>
              )}
              {isNode && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '999px',
                  }}
                >
                  ReactNode
                </span>
              )}
              {complex && !isFunc && !isNode && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    borderRadius: '999px',
                  }}
                >
                  JSON
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
                  border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
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
                  border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  backgroundColor: hasValue ? '#ffffff' : '#f9fafb',
                  outline: 'none',
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
                  placeholder={hasValue ? '' : `输入文本...`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
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

            {controlType === 'function' && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  borderRadius: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5b21b6', marginBottom: '4px' }}>
                  <span>⚡</span>
                  <strong>函数回调</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#7c3aed', lineHeight: 1.5 }}>
                  预览模式下自动注入安全回调，控制台会打印触发信息。
                </div>
                <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '4px' }}>
                  类型签名: <code style={{ fontFamily: 'ui-monospace, monospace' }}>{prop.type}</code>
                </div>
              </div>
            )}

            {controlType === 'json' && (
              <div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                  <button
                    onClick={() => handleFillSample(prop.name, prop.type)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    📝 填充示例值
                  </button>
                  {currentValue !== undefined && (
                    <button
                      onClick={() => {
                        onPropChange(prop.name, undefined)
                        setJsonErrors((prev) => {
                          const next = { ...prev }
                          delete next[prop.name]
                          return next
                        })
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      清除
                    </button>
                  )}
                  {prop.defaultValue && (
                    <button
                      onClick={() =>
                        handleJsonChange(
                          prop.name,
                          String(parseDefaultValue(prop.defaultValue, prop.type) ?? '')
                        )
                      }
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        backgroundColor: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      恢复默认
                    </button>
                  )}
                </div>
                <textarea
                  value={String(currentValue ?? '')}
                  onChange={(e) => handleJsonChange(prop.name, e.target.value)}
                  placeholder={hasValue ? '' : '请输入 JSON 格式数据...'}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '12px',
                    border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    backgroundColor: hasValue ? '#ffffff' : '#f9fafb',
                    outline: 'none',
                    minHeight: '100px',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
                {hasError && errorMsg && (
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#b91c1c',
                      lineHeight: 1.4,
                    }}
                  >
                    ⚠️ {errorMsg}
                  </div>
                )}
                {!hasError && hasValue && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      color: '#16a34a',
                    }}
                  >
                    ✓ JSON 格式正确
                  </div>
                )}
              </div>
            )}

            {controlType === 'textarea' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <textarea
                  value={String(currentValue ?? '')}
                  onChange={(e) => onPropChange(prop.name, e.target.value)}
                  placeholder={hasValue ? '' : '输入值...'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    backgroundColor: hasValue ? '#ffffff' : '#f9fafb',
                    outline: 'none',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                {currentValue !== undefined && (
                  <button
                    onClick={() => onPropChange(prop.name, undefined)}
                    style={{
                      alignSelf: 'flex-end',
                      padding: '4px 10px',
                      fontSize: '11px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
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
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ControlPanel
