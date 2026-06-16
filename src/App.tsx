import React, { useMemo, useState } from 'react'
import type { ComponentDoc, PropValue } from '@/types'
import { loadAllComponents } from '@/utils/componentLoader'
import { Sidebar } from '@/components/docs/Sidebar'
import { PropsTable } from '@/components/docs/PropsTable'
import { ControlPanel } from '@/components/docs/ControlPanel'
import { Sandbox } from '@/components/docs/Sandbox'
import { SourceViewer } from '@/components/docs/SourceViewer'

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

function initComponentDefaults(component: ComponentDoc): Record<string, PropValue> {
  const result: Record<string, PropValue> = {}
  for (const prop of component.props) {
    if (prop.defaultValue !== undefined) {
      result[prop.name] = parseDefaultValue(prop.defaultValue, prop.type)
    } else if (prop.required) {
      if (prop.type === 'string') {
        result[prop.name] = ''
      } else if (prop.type === 'number') {
        result[prop.name] = 0
      } else if (prop.type === 'boolean') {
        result[prop.name] = false
      } else if (prop.type.includes("'") && prop.type.includes('|')) {
        const match = prop.type.match(/["']([^"']+)["']/)
        if (match) {
          result[prop.name] = match[1]
        }
      }
    }
  }
  return result
}

const App: React.FC = () => {
  const components = useMemo(() => loadAllComponents(), [])
  const [activeComponent, setActiveComponent] = useState<string | null>(
    components[0]?.name ?? null
  )
  const [propsValuesMap, setPropsValuesMap] = useState<Record<string, Record<string, PropValue>>>(
    () => {
      const map: Record<string, Record<string, PropValue>> = {}
      for (const comp of components) {
        map[comp.name] = initComponentDefaults(comp)
      }
      return map
    }
  )
  const [showSource, setShowSource] = useState(false)
  const [highlightLine, setHighlightLine] = useState<number | null>(null)

  const activeComp = components.find((c) => c.name === activeComponent)

  const handleSelectComponent = (name: string) => {
    setActiveComponent(name)
    setShowSource(false)
    setHighlightLine(null)
  }

  const handlePropChange = (propName: string, value: PropValue) => {
    if (!activeComponent) return
    setPropsValuesMap((prev) => ({
      ...prev,
      [activeComponent]: {
        ...prev[activeComponent],
        [propName]: value,
      },
    }))
  }

  const handlePropClick = (line: number) => {
    setHighlightLine(line)
    setShowSource(true)
  }

  const handleResetProps = () => {
    if (!activeComp) return
    setPropsValuesMap((prev) => ({
      ...prev,
      [activeComponent]: initComponentDefaults(activeComp),
    }))
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#f9fafb',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <Sidebar
        components={components}
        activeComponent={activeComponent}
        onSelect={handleSelectComponent}
      />

      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {activeComp ? (
          <>
            <header
              style={{
                padding: '24px 32px',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    {activeComp.name}
                  </h2>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      borderRadius: '999px',
                      fontWeight: 500,
                    }}
                  >
                    {activeComp.props.length} Props
                  </span>
                </div>
                {activeComp.description && (
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: 1.6 }}>
                    {activeComp.description}
                  </p>
                )}
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                  📁 {activeComp.filePath}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowSource(true)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff')}
                >
                  📄 查看源码
                </button>
                <button
                  onClick={handleResetProps}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff')}
                >
                  ↺ 重置 Props
                </button>
              </div>
            </header>

            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <section>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>📋</span> Props 定义
                  <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af' }}>
                    点击行跳转至源码
                  </span>
                </h3>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <PropsTable component={activeComp} onPropClick={handlePropClick} />
                </div>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '24px' }}>
                <section>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#111827',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🎛️</span> Props 控制面板
                  </h3>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      padding: '20px',
                    }}
                  >
                    <ControlPanel
                      component={activeComp}
                      propsValues={propsValuesMap[activeComp.name] ?? {}}
                      onPropChange={handlePropChange}
                    />
                  </div>
                </section>

                <section>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#111827',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🖥️</span> 实时预览沙箱
                  </h3>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      padding: '20px',
                    }}
                  >
                    <Sandbox
                      component={activeComp}
                      propsValues={propsValuesMap[activeComp.name] ?? {}}
                    />
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
              color: '#9ca3af',
            }}
          >
            <div style={{ fontSize: '48px' }}>📚</div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#374151' }}>
              欢迎使用组件文档生成器
            </h2>
            <p style={{ margin: 0, fontSize: '14px' }}>
              从左侧列表选择一个组件开始查看
            </p>
          </div>
        )}
      </main>

      {showSource && activeComp && (
        <SourceViewer
          component={activeComp}
          highlightLine={highlightLine}
          onClose={() => {
            setShowSource(false)
            setHighlightLine(null)
          }}
        />
      )}
    </div>
  )
}

export default App
