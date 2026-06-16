import React from 'react'

/**
 * 输入框组件属性
 */
export interface InputProps {
  /** 输入框占位文本 */
  placeholder?: string
  /** 输入框当前值 */
  value?: string
  /** 值变化回调 */
  onChange?: (value: string) => void
  /** 输入框标签 */
  label?: string
  /** 输入框类型 */
  type?: 'text' | 'password' | 'email' | 'number' | 'textarea'
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示清除按钮 */
  showClear?: boolean
  /** 最大字符数 */
  maxLength?: number
  /** 是否显示字数统计 */
  showCount?: boolean
  /** 错误提示信息 */
  error?: string
  /** 前缀图标 */
  prefix?: string
}

/**
 * 支持多种类型的输入框组件
 */
export const Input: React.FC<InputProps> = ({
  placeholder = '请输入...',
  value = '',
  onChange,
  label,
  type = 'text',
  disabled = false,
  showClear = false,
  maxLength,
  showCount = false,
  error,
  prefix,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value
    if (maxLength !== undefined) {
      newValue = newValue.slice(0, maxLength)
    }
    onChange?.(newValue)
  }

  const handleClear = () => {
    onChange?.('')
  }

  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: prefix ? '10px 10px 10px 36px' : '10px 12px',
    fontSize: '14px',
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
    backgroundColor: disabled ? '#f9fafb' : '#ffffff',
    cursor: disabled ? 'not-allowed' : 'text',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
            }}
          >
            {prefix}
          </span>
        )}
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            style={{ ...baseStyle, minHeight: '100px', resize: 'vertical' }}
            onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
            onBlur={(e) => (e.target.style.borderColor = error ? '#ef4444' : '#d1d5db')}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            style={baseStyle}
            onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
            onBlur={(e) => (e.target.style.borderColor = error ? '#ef4444' : '#d1d5db')}
          />
        )}
        {showClear && value && !disabled && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '16px',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {error && <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>}
        {showCount && maxLength !== undefined && (
          <span
            style={{
              fontSize: '12px',
              color: value.length >= maxLength ? '#ef4444' : '#9ca3af',
              marginLeft: 'auto',
            }}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

export default Input
