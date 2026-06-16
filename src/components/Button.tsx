import React from 'react'

/**
 * 按钮组件属性
 */
export interface ButtonProps {
  /** 按钮显示的文字 */
  label: string
  /** 按钮点击事件 */
  onClick?: () => void
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否禁用按钮 */
  disabled?: boolean
  /** 是否显示加载状态 */
  loading?: boolean
  /** 自定义背景颜色 */
  backgroundColor?: string
  /** 按钮图标 */
  icon?: string
}

const variantStyles: Record<string, string> = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  danger: '#ef4444',
  success: '#22c55e',
}

const sizeStyles: Record<string, { padding: string; fontSize: string }> = {
  sm: { padding: '6px 12px', fontSize: '12px' },
  md: { padding: '10px 20px', fontSize: '14px' },
  lg: { padding: '14px 28px', fontSize: '16px' },
}

/**
 * 一个可自定义样式的按钮组件
 * 支持多种类型、尺寸和状态
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  backgroundColor,
  icon,
}) => {
  const sizeConfig = sizeStyles[size]
  const bgColor = backgroundColor || variantStyles[variant] || variantStyles.primary

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: sizeConfig.padding,
        fontSize: sizeConfig.fontSize,
        backgroundColor: disabled ? '#d1d5db' : bgColor,
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        fontWeight: 500,
      }}
    >
      {loading && <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>}
      {icon && !loading && <span>{icon}</span>}
      {label}
    </button>
  )
}

export default Button
