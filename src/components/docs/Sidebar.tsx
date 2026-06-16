import React, { useMemo, useState } from 'react'
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

type FilterMode = 'all' | 'required' | 'optional'

export const Sidebar: React.FC<SidebarProps> = ({ components, activeComponent, onSelect }) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const categories = useMemo(() => {
    const cats = new Set(components.map((c) => c.category))
    return Array.from(cats).sort()
  }, [components])

  const filtered = useMemo(() => {
    let result = components

    if (search.trim()) {
      const lower = search.toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(lower))
    }

    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory)
    }

    if (filterMode === 'required') {
      result = result.filter((c) => c.props.some((p) => p.required))
    } else if (filterMode === 'optional') {
      result = result.filter((c) => c.props.length > 0 && c.props.every((p) => !p.required))
    }

    return result
  }, [components, search, selectedCategory, filterMode])

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ComponentDocWithCategory[]>>((acc, comp) => {
      if (!acc[comp.category]) acc[comp.category] = []
      acc[comp.category].push(comp)
      return acc
    }, {})
  }, [filtered])

  return (
    <aside
      style={{
        width: '280px',
        minWidth: '280px',
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
          padding: '16px 16px 12px',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          zIndex: 1,
        }}
      >
        <h1 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
          📚 组件文档
        </h1>

        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索组件名..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box',
              backgroundColor: search ? '#ffffff' : '#f9fafb',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              pointerEvents: 'none',
              color: '#9ca3af',
            }}
          >
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {(['all', 'required', 'optional'] as FilterMode[]).map((mode) => {
            const labels: Record<FilterMode, string> = { all: '全部', required: '有必填', optional: '全可选' }
            return (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  border: `1px solid ${filterMode === mode ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '999px',
                  backgroundColor: filterMode === mode ? '#eff6ff' : '#ffffff',
                  color: filterMode === mode ? '#1d4ed8' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: filterMode === mode ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {labels[mode]}
              </button>
            )
          })}
        </div>

        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                border: `1px solid ${selectedCategory === null ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '999px',
                backgroundColor: selectedCategory === null ? '#eff6ff' : '#ffffff',
                color: selectedCategory === null ? '#1d4ed8' : '#6b7280',
                cursor: 'pointer',
                fontWeight: selectedCategory === null ? 600 : 400,
              }}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  border: `1px solid ${selectedCategory === cat ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '999px',
                  backgroundColor: selectedCategory === cat ? '#eff6ff' : '#ffffff',
                  color: selectedCategory === cat ? '#1d4ed8' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: selectedCategory === cat ? 600 : 400,
                }}
              >
                {categoryIcons[cat] || '📁'} {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav style={{ padding: '8px', flex: 1 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
            没有匹配的组件
            {search && <div style={{ marginTop: '4px', fontSize: '12px' }}>搜索: "{search}"</div>}
          </div>
        ) : (
          Object.entries(grouped).map(([category, comps]) => (
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
              {comps.map((comp) => {
                const hasRequired = comp.props.some((p) => p.required)
                return (
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
                      {hasRequired && (
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            backgroundColor: activeComponent === comp.name ? 'rgba(255,255,255,0.25)' : '#fee2e2',
                            color: activeComponent === comp.name ? '#ffffff' : '#b91c1c',
                            borderRadius: '999px',
                            fontWeight: 600,
                          }}
                        >
                          必填
                        </span>
                      )}
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
                )
              })}
            </div>
          ))
        )}
      </nav>

      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '11px',
          color: '#9ca3af',
          lineHeight: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>显示 {filtered.length}/{components.length} 组件</span>
        <span>💡 src/ 下任意 .tsx 自动识别</span>
      </div>
    </aside>
  )
}

export default Sidebar
