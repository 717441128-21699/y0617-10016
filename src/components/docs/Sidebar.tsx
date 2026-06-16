import React from 'react'
import type { ComponentDoc } from '@/types'

interface SidebarProps {
  components: ComponentDoc[]
  activeComponent: string | null
  onSelect: (componentName: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ components, activeComponent, onSelect }) => {
  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        height: '100vh',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          📚 组件文档
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
          共 {components.length} 个组件
        </p>
      </div>
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {components.map((comp) => (
          <button
            key={comp.name}
            onClick={() => onSelect(comp.name)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              marginBottom: '2px',
              fontSize: '14px',
              color: activeComponent === comp.name ? '#ffffff' : '#374151',
              backgroundColor: activeComponent === comp.name ? '#3b82f6' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontWeight: activeComponent === comp.name ? 600 : 400,
            }}
            onMouseEnter={(e) => {
              if (activeComponent !== comp.name) {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f4f6'
              }
            }}
            onMouseLeave={(e) => {
              if (activeComponent !== comp.name) {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px' }}>📦</span>
              {comp.name}
            </div>
            {comp.props.length > 0 && (
              <div
                style={{
                  marginLeft: '22px',
                  marginTop: '2px',
                  fontSize: '11px',
                  color: activeComponent === comp.name ? '#bfdbfe' : '#9ca3af',
                }}
              >
                {comp.props.length} 个 Props
              </div>
            )}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
