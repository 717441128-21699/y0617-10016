import React from 'react'

/**
 * 卡片组件属性定义
 */
export interface CardProps {
  /** 卡片标题 */
  title: string
  /** 卡片描述文本 */
  description?: string
  /** 卡片图片地址 */
  image?: string
  /** 卡片底部操作按钮文字 */
  actionText?: string
  /** 操作按钮点击事件 */
  onAction?: () => void
  /** 是否显示边框阴影 */
  shadow?: boolean
  /** 是否可悬停放大 */
  hoverable?: boolean
  /** 卡片最大宽度(px) */
  maxWidth?: number
  /** 标签列表 */
  tags?: string[]
}

/**
 * 用于展示信息的卡片组件
 * 支持图片、标题、描述和操作区域
 */
export const Card: React.FC<CardProps> = ({
  title,
  description,
  image,
  actionText,
  onAction,
  shadow = true,
  hoverable = false,
  maxWidth = 320,
  tags = [],
}) => {
  return (
    <div
      style={{
        maxWidth: `${maxWidth}px`,
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: shadow ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        border: '1px solid #e5e7eb',
        transition: 'all 0.3s ease',
        transform: hoverable ? 'scale(1)' : undefined,
        cursor: hoverable ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = shadow
            ? '0 4px 12px rgba(0,0,0,0.1)'
            : 'none'
        }
      }}
    >
      {image && (
        <img
          src={image}
          alt={title}
          style={{ width: '100%', height: '180px', objectFit: 'cover' }}
        />
      )}
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          {title}
        </h3>
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  padding: '2px 8px',
                  fontSize: '12px',
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                  borderRadius: '999px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {description && (
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
            {description}
          </p>
        )}
        {actionText && (
          <button
            onClick={onAction}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  )
}

export default Card
