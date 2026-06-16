import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentDoc, PropValue } from '@/types'
import { loadAllComponents, ComponentDocWithCategory } from '@/utils/componentLoader'
import { generateSampleValue, parseDefaultValue } from '@/utils/propUtils'
import { addHistoryRecord, type HistoryRecord } from '@/utils/historyManager'
import type { SharePackageData } from '@/utils/presetManager'
import { Sidebar } from '@/components/docs/Sidebar'
import { PropsTable } from '@/components/docs/PropsTable'
import { ControlPanel } from '@/components/docs/ControlPanel'
import { Sandbox } from '@/components/docs/Sandbox'
import { SourceViewer } from '@/components/docs/SourceViewer'
import { PresetPanel } from '@/components/docs/PresetPanel'
import { HistoryPanel } from '@/components/docs/HistoryPanel'
import { PropsDiffPanel, type DiffTarget } from '@/components/docs/PropsDiffPanel'

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

interface AppState {
  component: string | null
  props: Record<string, PropValue> | null
  presetName: string | null
  showSource: boolean
  highlightLine: number | null
}

function encodeStateToUrl(state: Partial<AppState>): string {
  const params = new URLSearchParams()
  if (state.component) params.set('c', state.component)
  if (state.props) {
    const serializable: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(state.props)) {
      if (value !== undefined) serializable[key] = value
    }
    if (Object.keys(serializable).length > 0) {
      try {
        params.set('p', btoa(unescape(encodeURIComponent(JSON.stringify(serializable)))))
      } catch {}
    }
  }
  if (state.presetName) params.set('pn', state.presetName)
  if (state.showSource) params.set('src', '1')
  if (state.highlightLine) params.set('ln', String(state.highlightLine))
  return params.toString()
}

interface DecodeResult {
  state: Partial<AppState>
  warnings: string[]
  errors: string[]
  applied: { component?: boolean; props?: boolean; preset?: boolean; source?: boolean; line?: boolean }
}

function decodeStateFromUrl(components: ComponentDocWithCategory[]): DecodeResult {
  const params = new URLSearchParams(window.location.search)
  const result: DecodeResult = {
    state: {},
    warnings: [],
    errors: [],
    applied: {},
  }
  const c = params.get('c')
  if (c) {
    const found = components.some((x) => x.name === c)
    if (found) {
      result.state.component = c
      result.applied.component = true
    } else {
      result.errors.push(`链接中的组件「${c}」在当前项目未找到`)
    }
  }
  const p = params.get('p')
  if (p) {
    try {
      result.state.props = JSON.parse(decodeURIComponent(escape(atob(p)))) as Record<string, PropValue>
      result.applied.props = true
    } catch {
      result.warnings.push('Props 参数解析失败，已忽略')
    }
  }
  const pn = params.get('pn')
  if (pn) {
    result.state.presetName = pn
    result.applied.preset = true
  }
  const src = params.get('src')
  if (src === '1') {
    result.state.showSource = true
    result.applied.source = true
  }
  const ln = params.get('ln')
  if (ln) {
    const num = parseInt(ln, 10)
    if (!isNaN(num)) {
      result.state.highlightLine = num
      result.applied.line = true
    } else {
      result.warnings.push('行号格式有误，已忽略')
    }
  }
  return result
}

interface RestoreBannerState {
  kind: 'success' | 'partial' | 'error'
  lines: string[]
  key: number
}

const App: React.FC = () => {
  const components: ComponentDocWithCategory[] = useMemo(() => loadAllComponents(), [])
  const decodedRef = useRef<DecodeResult | null>(null)
  decodedRef.current = decodedRef.current || decodeStateFromUrl(components)
  const urlState = decodedRef.current.state

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
  const [activePresetName, setActivePresetName] = useState<string | null>(urlState.presetName ?? null)
  const [showSource, setShowSource] = useState<boolean>(!!urlState.showSource)
  const [highlightLine, setHighlightLine] = useState<number | null>(urlState.highlightLine ?? null)
  const [diffTarget, setDiffTarget] = useState<DiffTarget | null>(null)
  const [restoreBanner, setRestoreBanner] = useState<RestoreBannerState | null>(null)
  const [historyExternal, setHistoryExternal] = useState<{
    type: 'add'
    action: HistoryRecord['action']
    payload?: Partial<HistoryRecord>
    seq: number
  } | null>(null)

  const urlSyncTimerRef = useRef<number | null>(null)
  const seqRef = useRef(0)

  useEffect(() => {
    const d = decodedRef.current
    if (!d) return
    const hasAny = d.applied.component || d.applied.props || d.applied.preset || d.applied.source || d.applied.line
    if (!hasAny && d.errors.length === 0 && d.warnings.length === 0) return
    const lines: string[] = []
    if (d.applied.component) {
      const compName = d.state.component || ''
      const extras: string[] = []
      if (d.applied.props) extras.push('Props 已还原')
      if (d.applied.preset) extras.push(`预设名: ${d.state.presetName}`)
      if (d.applied.source) extras.push(`源码面板: 打开${d.applied.line ? `, 高亮行 ${d.state.highlightLine}` : ''}`)
      if (d.applied.line && !d.applied.source) extras.push(`高亮行: ${d.state.highlightLine}`)
      lines.push(`✅ 成功打开组件「${compName}」${extras.length ? ` (${extras.join('，')})` : ''}`)
    } else if (!urlState.component) {
      lines.push('💡 无分享链接上下文，已展示默认组件')
    }
    for (const w of d.warnings) lines.push(`⚠️ ${w}`)
    for (const e of d.errors) lines.push(`❌ ${e}`)
    const kind: RestoreBannerState['kind'] = d.errors.length
      ? 'error'
      : d.warnings.length
      ? 'partial'
      : hasAny
      ? 'success'
      : 'partial'
    setRestoreBanner({ kind, lines, key: Date.now() })
  }, [])

  const activeComp = components.find((c) => c.name === activeComponent)

  const syncUrl = useCallback(() => {
    if (!activeComponent) return
    if (urlSyncTimerRef.current) clearTimeout(urlSyncTimerRef.current)
    urlSyncTimerRef.current = window.setTimeout(() => {
      const currentProps = propsValuesMap[activeComponent]
      const query = encodeStateToUrl({
        component: activeComponent,
        props: currentProps,
        presetName: activePresetName,
        showSource,
        highlightLine,
      })
      const newUrl = `${window.location.pathname}?${query}`
      window.history.replaceState(null, '', newUrl)
    }, 300)
  }, [activeComponent, propsValuesMap, activePresetName, showSource, highlightLine])

  useEffect(() => {
    syncUrl()
    return () => {
      if (urlSyncTimerRef.current) clearTimeout(urlSyncTimerRef.current)
    }
  }, [syncUrl])

  const triggerHistory = useCallback(
    (action: HistoryRecord['action'], payload: Partial<HistoryRecord>) => {
      seqRef.current += 1
      setHistoryExternal({ type: 'add', action, payload, seq: seqRef.current })
    },
    []
  )

  const handleSelectComponent = (name: string) => {
    const prev = activeComponent
    setActiveComponent(name)
    setShowSource(false)
    setHighlightLine(null)
    setActivePresetName(null)
    setDiffTarget(null)
    if (!propsValuesMap[name]) {
      const comp = components.find((c) => c.name === name)
      if (comp) {
        const nameStr: string = name
        setPropsValuesMap((prevMap) => ({
          ...prevMap,
          [nameStr]: initComponentDefaults(comp),
        }))
      }
    }
    if (prev && prev !== name) {
      triggerHistory('switch-component', {
        componentName: name,
        props: { ...(propsValuesMap[name] || {}) },
      })
    }
  }

  const handlePropChange = useCallback(
    (propName: string, value: PropValue) => {
      if (!activeComponent) return
      const compName: string = activeComponent
      setPropsValuesMap((prev) => ({
        ...prev,
        [compName]: {
          ...prev[compName],
          [propName]: value,
        },
      }))
      setActivePresetName(null)
    },
    [activeComponent]
  )

  const handlePropClick = (line: number) => {
    setHighlightLine(line)
    setShowSource(true)
  }

  const handleResetProps = () => {
    if (!activeComp) return
    const name: string = activeComp.name
    const defaults = initComponentDefaults(activeComp)
    setPropsValuesMap((prev) => ({
      ...prev,
      [name]: defaults,
    }))
    setActivePresetName(null)
    triggerHistory('reset-props', { componentName: name, props: defaults })
  }

  const handleLoadPreset = (props: Record<string, PropValue>, presetName: string) => {
    if (!activeComponent) return
    const name: string = activeComponent
    setPropsValuesMap((prev) => ({
      ...prev,
      [name]: { ...props },
    }))
    setActivePresetName(presetName)
    triggerHistory('load-preset', { componentName: name, props: { ...props }, presetName })
  }

  const handleRestoreFromHistory = (props: Record<string, PropValue>, componentName: string) => {
    if (!propsValuesMap[componentName]) {
      const comp = components.find((c) => c.name === componentName)
      if (comp) {
        setPropsValuesMap((prev) => ({
          ...prev,
          [componentName]: initComponentDefaults(comp),
        }))
      }
    }
    if (componentName !== activeComponent) {
      setActiveComponent(componentName)
      setShowSource(false)
      setHighlightLine(null)
    }
    setPropsValuesMap((prev) => ({
      ...prev,
      [componentName]: { ...props },
    }))
    setActivePresetName(null)
    setDiffTarget(null)
  }

  const handleRequestDiff = (target: DiffTarget) => {
    setDiffTarget(target)
  }

  const handleApplyDiffTarget = () => {
    if (!diffTarget) return
    handleRestoreFromHistory(diffTarget.props, activeComponent || diffTarget.meta?.componentName as string || diffTarget.label)
  }

  const handleImportApplyProps = (props: Record<string, PropValue>) => {
    if (!activeComponent) return
    setPropsValuesMap((prev) => ({
      ...prev,
      [activeComponent]: { ...props },
    }))
  }

  const handleImportSwitchComponent = (name: string) => {
    handleSelectComponent(name)
  }

  const handleImportApplyContext = (ctx: NonNullable<SharePackageData['context']>) => {
    if (ctx.presetName) setActivePresetName(ctx.presetName)
    if (ctx.showSource) setShowSource(true)
    if (ctx.highlightLine) setHighlightLine(ctx.highlightLine)
  }

  const handleCopyLink = () => {
    if (!activeComponent) return
    const currentProps = propsValuesMap[activeComponent]
    if (!currentProps) return
    const query = encodeStateToUrl({
      component: activeComponent,
      props: currentProps,
      presetName: activePresetName,
      showSource,
      highlightLine,
    })
    const fullUrl = `${window.location.origin}${window.location.pathname}?${query}`
    navigator.clipboard.writeText(fullUrl).then(
      () => {
        const btn = document.getElementById('copy-link-btn')
        if (btn) {
          btn.textContent = '✅ 已复制(含上下文)'
          setTimeout(() => {
            btn.textContent = '🔗 分享链接'
          }, 2200)
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
          position: 'relative',
        }}
      >
        {restoreBanner && (
          <div
            key={restoreBanner.key}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              padding: '10px 32px',
              fontSize: '12px',
              backgroundColor:
                restoreBanner.kind === 'success'
                  ? '#ecfdf5'
                  : restoreBanner.kind === 'error'
                  ? '#fef2f2'
                  : '#fffbeb',
              color:
                restoreBanner.kind === 'success'
                  ? '#065f46'
                  : restoreBanner.kind === 'error'
                  ? '#991b1b'
                  : '#92400e',
              borderBottom: `1px solid ${
                restoreBanner.kind === 'success'
                  ? '#a7f3d0'
                  : restoreBanner.kind === 'error'
                  ? '#fecaca'
                  : '#fde68a'
              }`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {restoreBanner.lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
              {restoreBanner.kind === 'error' && (
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                  💡 可继续从左侧列表选择组件浏览
                </div>
              )}
            </div>
            <button
              onClick={() => setRestoreBanner(null)}
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                backgroundColor: 'rgba(255,255,255,0.6)',
                color: 'inherit',
                border: `1px solid ${
                  restoreBanner.kind === 'success'
                    ? '#a7f3d0'
                    : restoreBanner.kind === 'error'
                    ? '#fecaca'
                    : '#fde68a'
                }`,
                borderRadius: '4px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              知道了
            </button>
          </div>
        )}

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
                top: restoreBanner ? '58px' : 0,
                zIndex: 10,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
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
                  {activePresetName && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        backgroundColor: '#ede9fe',
                        color: '#6d28d9',
                        borderRadius: '999px',
                        fontWeight: 600,
                      }}
                    >
                      🔖 {activePresetName}
                    </span>
                  )}
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
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
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
                  onClick={() => {
                    setShowSource(true)
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    backgroundColor: showSource ? '#eff6ff' : '#ffffff',
                    color: showSource ? '#1d4ed8' : '#374151',
                    border: `1px solid ${showSource ? '#bfdbfe' : '#d1d5db'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
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
                      activePresetName={activePresetName}
                      presetName={activePresetName}
                      showSource={showSource}
                      highlightLine={highlightLine}
                      onLoadPreset={handleLoadPreset}
                      onRequestDiff={handleRequestDiff}
                      onImportApplyProps={handleImportApplyProps}
                      onImportSwitchComponent={handleImportSwitchComponent}
                      onImportApplyContext={handleImportApplyContext}
                    />
                    {diffTarget && (
                      <PropsDiffPanel
                        title="参数变更对比"
                        target={diffTarget}
                        currentProps={propsValuesMap[activeComp.name] ?? {}}
                        onClose={() => setDiffTarget(null)}
                        onApplyTarget={handleApplyDiffTarget}
                      />
                    )}
                    <HistoryPanel
                      componentName={activeComp.name}
                      currentProps={propsValuesMap[activeComp.name] ?? {}}
                      onRestore={handleRestoreFromHistory}
                      onRequestDiff={(t) =>
                        handleRequestDiff({
                          label: t.label,
                          kind: t.kind,
                          props: t.props,
                          meta: { recordId: t.recordId, componentName: activeComp.name },
                        })
                      }
                      externalTrigger={historyExternal}
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
