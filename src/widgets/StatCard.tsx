import React from 'react'

/**
 * 统计卡片组件属性
 */
export interface StatCardProps {
  /** 统计标题 */
  title: string
  /** 统计数值 */
  value: number | string
  /** 图标 */
  icon?: React.ReactNode
  /** 较上期变化百分比 */
  changePercent?: number
  /** 数据趋势 */
  trend?: 'up' | 'down' | 'stable'
  /** 卡片前缀，如 ¥ $ % */
  prefix?: string
  /** 卡片后缀 */
  suffix?: string
  /** 卡片主题色 */
  theme?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  /** 点击事件 */
  onClick?: () => void
  /** 迷你图表数据 - 最近 7 天数据 */
  sparklineData?: number[]
  /** 底部说明文字 */
  footer?: string
}

const themeColors: Record<string, { bg: string; text: string; lightBg: string }> = {
  blue: { bg: '#3b82f6', text: '#1d4ed8', lightBg: '#eff6ff' },
  green: { bg: '#22c55e', text: '#15803d', lightBg: '#f0fdf4' },
  orange: { bg: '#f97316', text: '#c2410c', lightBg: '#fff7ed' },
  purple: { bg: '#a855f7', text: '#7e22ce', lightBg: '#faf5ff' },
  red: { bg: '#ef4444', text: '#b91c1c', lightBg: '#fef2f2' },
}

/**
 * 数据统计卡片组件
 * 用于展示关键指标，支持趋势指示和迷你图表
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  changePercent,
  trend = 'stable',
  prefix,
  suffix,
  theme = 'blue',
  onClick,
  sparklineData,
  footer,
}) => {
  const colors = themeColors[theme]

  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length === 0) return null
    const max = Math.max(...sparklineData)
    const min = Math.min(...sparklineData)
    const range = max - min || 1
    const width = 100
    const height = 30
    const points = sparklineData
      .map((v, i) => {
        const x = (i / (sparklineData.length - 1)) * width
        const y = height - ((v - min) / range) * height
        return `${x},${y}`
      })
      .join(' ')

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={colors.bg}
          strokeWidth="2"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        minWidth: '220px',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{title}</span>
        {icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: colors.lightBg,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
          {prefix && <span style={{ fontSize: '18px', color: '#6b7280' }}>{prefix}</span>}
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 400 }}>{suffix}</span>}
        </span>
      </div>

      {changePercent !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor:
                trend === 'up'
                  ? '#dcfce7'
                  : trend === 'down'
                  ? '#fee2e2'
                  : '#f3f4f6',
              color:
                trend === 'up'
                  ? '#15803d'
                  : trend === 'down'
                  ? '#b91c1c'
                  : '#6b7280',
            }}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(changePercent)}%
          </span>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>较上期</span>
        </div>
      )}

      {renderSparkline()}

      {footer && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#9ca3af' }}>
          {footer}
        </div>
      )}
    </div>
  )
}

export default StatCard
