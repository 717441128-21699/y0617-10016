import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentDoc, PropValue } from '@/types'
import { loadAllComponents, ComponentDocWithCategory } from '@/utils/componentLoader'
import { generateSampleValue, parseDefaultValue } from '@/utils/propUtils'
import { Sidebar } from '@/components/docs/Sidebar'
import { PropsTable } from '@/components/docs/PropsTable'
import { ControlPanel } from '@/components/docs/ControlPanel'
import { Sandbox } from '@/components/docs/Sandbox'
import { SourceViewer } from '@/components/docs/SourceViewer'
import { PresetPanel } from '@/components/docs/PresetPanel'

function initComponentDefaults(component: ComponentDoc): Record<string, PropValue> {
  const result: Record<string, PropValue> = {}
  for (const prop of component.props) {
    if (prop.defaultValue !== undefined) {
      result[prop.name] = parseDefaultValue(prop.defaultValue, prop.type)
    } else if (prop.required) {
      result[prop.name] = generateSampleValue(prop.type)
    }
  }
  return result
}

function encodePropsToUrl(componentName: string, props: Record<string, PropValue>): string {
  const params = new URLSearchParams()
  params.set('c', componentName)
  const serializable: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) {
      serializable[key] = value
    }
  }
  if (Object.keys(serializable).length > 0) {
    try {
      params.set('p', btoa(unescape(encodeURIComponent(JSON.stringify(serializable)))))
    } catch {
      // skip
    }
  }
  return params.toString()
}

function decodePropsFromUrl(): { component: string | null; props: Record<string, PropValue> | null } {
  const params = new URLSearchParams(window.location.search)
  const component = params.get('c')
  const propsStr = params.get('p')
  if (!component) return { component: null, props: null }
  if (!propsStr) return { component, props: null }
  try {
    const decoded = JSON.parse(decodeURIComponent(escape(atob(propsStr))))
    return { component, props: decoded as Record<string, PropValue> }
  } catch {
    return { component, props: null }
  }
}

const App: React.FC = () => {
  const components: ComponentDocWithCategory[] = useMemo(() => loadAllComponents(), [])
  const urlState = useMemo(() => decodePropsFromUrl(), [])

  const [activeComponent, setActiveComponent] = useState<string | null>(
    urlState.component || components[0]?.name || null
  )
  const [propsValuesMap, setPropsValuesMap] = useState<Record<string, Record<string, PropValue>>>(
    () => {
      const map: Record<string, Record<string, PropValue>> = {}
      for (const comp of components) {
        if (urlState.component === comp.name && urlState.props) {
          map[comp.name] = { ...initComponentDefaults(comp), ...urlState.props }
        } else {
          map[comp.name] = initComponentDefaults(comp)
        }
      }
      return map
    }
  )
  const [showSource, setShowSource] = useState(false)
  const [highlightLine, setHighlightLine] = useState<number | null>(null)

  const urlSyncTimerRef = useRef<number | null>(null)

  const activeComp = components.find((c) => c.name === activeComponent)

  useEffect(() => {
    if (!activeComponent) return
    const currentProps = propsValuesMap[activeComponent]
    if (!currentProps) return

    if (urlSyncTimerRef.current) {
      clearTimeout(urlSyncTimerRef.current)
    }
    urlSyncTimerRef.current = window.setTimeout(() => {
      const queryString = encodePropsToUrl(activeComponent, currentProps)
      const newUrl = `${window.location.pathname}?${queryString}`
      window.history.replaceState(null, '', newUrl)
    }, 300)

    return () => {
      if (urlSyncTimerRef.current) {
        clearTimeout(urlSyncTimerRef.current)
      }
    }
  }, [activeComponent, propsValuesMap])

  const handleSelectComponent = (name: string) => {
    setActiveComponent(name)
    setShowSource(false)
    setHighlightLine(null)
    if (!propsValuesMap[name]) {
      const comp = components.find((c) => c.name === name)
      if (comp) {
        const nameStr: string = name
        setPropsValuesMap((prev) => ({
          ...prev,
          [nameStr]: initComponentDefaults(comp),
        }))
      }
    }
  }

  const handlePropChange = useCallback((propName: string, value: PropValue) => {
    if (!activeComponent) return
    const compName: string = activeComponent
    setPropsValuesMap((prev) => ({
      ...prev,
      [compName]: {
        ...prev[compName],
        [propName]: value,
      },
    }))
  }, [activeComponent])

  const handlePropClick = (line: number) => {
    setHighlightLine(line)
    setShowSource(true)
  }

  const handleResetProps = () => {
    if (!activeComp) return
    const name: string = activeComp.name
    setPropsValuesMap((prev) => ({
      ...prev,
      [name]: initComponentDefaults(activeComp),
    }))
  }

  const handleLoadPreset = (props: Record<string, PropValue>) => {
    if (!activeComponent) return
    const name: string = activeComponent
    setPropsValuesMap((prev) => ({
      ...prev,
      [name]: { ...props },
    }))
  }

  const handleCopyLink = () => {
    if (!activeComponent) return
    const currentProps = propsValuesMap[activeComponent]
    if (!currentProps) return
    const queryString = encodePropsToUrl(activeComponent, currentProps)
    const fullUrl = `${window.location.origin}${window.location.pathname}?${queryString}`
    navigator.clipboard.writeText(fullUrl).then(
      () => {
        const btn = document.getElementById('copy-link-btn')
        if (btn) {
          btn.textContent = '✅ 已复制'
          setTimeout(() => {
            btn.textContent = '🔗 分享链接'
          }, 2000)
        }
      },
      () => {}
    )
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
                position: 'sticky',
                top: 0,
                zIndex: 10,
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
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      fontWeight: 600,
                    }}
                  >
                    {activeComp.category}
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
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  id="copy-link-btn"
                  onClick={handleCopyLink}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff')}
                >
                  🔗 分享链接
                </button>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
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

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '24px' }}>
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
                      maxHeight: 'calc(100vh - 320px)',
                      overflowY: 'auto',
                    }}
                  >
                    <PresetPanel
                      component={activeComp}
                      currentProps={propsValuesMap[activeComp.name] ?? {}}
                      onLoadPreset={handleLoadPreset}
                    />
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
