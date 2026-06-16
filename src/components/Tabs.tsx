import React, { useState } from 'react'

/**
 * 标签页组件属性
 */
export interface TabsProps {
  /** 标签页配置列表 */
  tabs: Array<{
    key: string
    label: string
    content: React.ReactNode
  }>
  /** 默认激活的标签key */
  defaultActiveKey?: string
  /** 标签页切换回调 */
  onChange?: (key: string) => void
  /** 标签页类型 */
  type?: 'line' | 'card'
  /** 标签排列方式 */
  tabPosition?: 'top' | 'left'
}

/**
 * 多标签页切换组件
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultActiveKey,
  onChange,
  type = 'line',
  tabPosition = 'top',
}) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || tabs[0]?.key || '')

  const handleTabClick = (key: string) => {
    setActiveKey(key)
    onChange?.(key)
  }

  const activeTab = tabs.find((t) => t.key === activeKey)

  const tabListStyle: React.CSSProperties =
    tabPosition === 'left'
      ? { display: 'flex', flexDirection: 'column', borderRight: type === 'line' ? '1px solid #e5e7eb' : 'none' }
      : { display: 'flex', borderBottom: type === 'line' ? '1px solid #e5e7eb' : 'none', gap: type === 'card' ? '4px' : '0' }

  const isVertical = tabPosition === 'left'

  return (
    <div style={{ display: isVertical ? 'flex' : 'block' }}>
      <div style={tabListStyle}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey
          if (type === 'line') {
            return (
              <div
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                style={{
                  padding: isVertical ? '12px 20px' : '12px 20px',
                  cursor: 'pointer',
                  color: isActive ? '#3b82f6' : '#6b7280',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  borderRight: isVertical ? (isActive ? '2px solid #3b82f6' : '2px solid transparent') : undefined,
                  borderBottom: !isVertical ? (isActive ? '2px solid #3b82f6' : '2px solid transparent') : undefined,
                  marginBottom: isVertical ? 0 : '-1px',
                  marginRight: isVertical ? '-1px' : 0,
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </div>
            )
          }
          return (
            <div
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
                color: isActive ? '#111827' : '#6b7280',
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                backgroundColor: isActive ? '#ffffff' : '#f3f4f6',
                border: isActive ? '1px solid #e5e7eb' : '1px solid transparent',
                borderRadius: '6px 6px 0 0',
                position: 'relative',
                zIndex: isActive ? 1 : 0,
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </div>
          )
        })}
      </div>
      <div
        style={{
          padding: '20px',
          flex: 1,
          border: type === 'card' ? '1px solid #e5e7eb' : 'none',
          borderRadius: type === 'card' ? '0 6px 6px 6px' : '0',
          backgroundColor: '#ffffff',
        }}
      >
        {activeTab?.content}
      </div>
    </div>
  )
}

export default Tabs
