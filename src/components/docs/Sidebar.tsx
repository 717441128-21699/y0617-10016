import React from 'react'
import type { ComponentDocWithCategory } from '@/utils/componentLoader'

interface SidebarProps {
  components: ComponentDocWithCategory[]
  activeComponent: string | null
  onSelect: (componentName: string) => void
}

const categoryIcons: Record<string, string> = {
  components: '📦',
  pages: '📄',
  widgets: '🧩',
  layouts: '📐',
  hooks: '🪝',
  utils: '🛠️',
}

export const Sidebar: React.FC<SidebarProps> = ({ components, activeComponent, onSelect }) => {
  const grouped = components.reduce<Record<string, ComponentDocWithCategory[]>>((acc, comp) => {
    if (!acc[comp.category]) {
      acc[comp.category] = []
    }
    acc[comp.category].push(comp)
    return acc
  }, {})

  const totalCount = components.length

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
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          zIndex: 1,
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
          共 {totalCount} 个组件 · {Object.keys(grouped).length} 个分类
        </p>
      </div>
      <nav style={{ padding: '8px', flex: 1 }}>
        {Object.entries(grouped).map(([category, comps]) => (
          <div key={category} style={{ marginBottom: '12px' }}>
            <div
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{categoryIcons[category] || '📁'}</span>
              {category}
              <span
                style={{
                  marginLeft: 'auto',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 600,
                }}
              >
                {comps.length}
              </span>
            </div>
            {comps.map((comp) => (
              <button
                key={comp.name}
                onClick={() => onSelect(comp.name)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px 8px 30px',
                  marginBottom: '1px',
                  fontSize: '13px',
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
                  {comp.name}
                </div>
                {comp.props.length > 0 && (
                  <div
                    style={{
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
          </div>
        ))}
      </nav>
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '11px',
          color: '#9ca3af',
          lineHeight: 1.5,
        }}
      >
        💡 将带 Props interface 的 .tsx 文件放入 src/ 下任意子目录即可自动识别
      </div>
    </aside>
  )
}

export default Sidebar
