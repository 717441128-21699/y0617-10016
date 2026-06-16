import React, { Component, useMemo, useRef, useState } from 'react'
import type { ComponentDoc, PropValue } from '@/types'
import { getComponentExport } from '@/utils/componentLoader'
import { safeConvertForRender, validatePropValue } from '@/utils/propUtils'

interface SandboxProps {
  component: ComponentDoc
  propsValues: Record<string, PropValue>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorKey: number
}

class SandboxErrorBoundary extends Component<
  { children: React.ReactNode; componentName: string; resetKey: number },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; componentName: string; resetKey: number }) {
    super(props)
    this.state = { hasError: false, error: null, errorKey: 0 }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorKey: Date.now() }
  }

  componentDidUpdate(prevProps: { resetKey: number }) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null })
    }
  }

  componentDidCatch(error: Error) {
    console.error(`[Sandbox] 组件 ${this.props.componentName} 渲染出错:`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            width: '100%',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
            ⚠️ 组件渲染出错
          </div>
          <div style={{ fontSize: '12px', color: '#7f1d1d', lineHeight: 1.5 }}>
            Props 值可能导致组件崩溃，修正后自动恢复。
          </div>
          {this.state.error && (
            <pre
              style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#1e1e1e',
                color: '#fca5a5',
                borderRadius: '4px',
                fontSize: '11px',
                overflowX: 'auto',
                lineHeight: 1.5,
                maxHeight: '120px',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export const Sandbox: React.FC<SandboxProps> = ({ component, propsValues }) => {
  const [loadError, setLoadError] = useState<string | null>(null)
  const [renderKey, setRenderKey] = useState(0)
  const lastValidPropsRef = useRef<Record<string, unknown> | null>(null)
  const hasAnyInvalidRef = useRef(false)

  const Component = useMemo(() => {
    setLoadError(null)
    try {
      const exp = getComponentExport(component)
      if (!exp) {
        setLoadError(`未找到组件导出 "${component.name}"`)
        return null
      }
      return exp
    } catch (e) {
      setLoadError(`加载组件失败: ${(e as Error).message}`)
      return null
    }
  }, [component])

  const processedProps = useMemo(() => {
    const result: Record<string, unknown> = {}
    let hasInvalid = false

    for (const prop of component.props) {
      const rawValue = propsValues[prop.name]
      if (rawValue === undefined) continue

      const validation = validatePropValue(rawValue, prop)
      if (!validation.valid) {
        hasInvalid = true
        continue
      }

      try {
        result[prop.name] = safeConvertForRender(rawValue, prop.type, prop.name)
      } catch (e) {
        console.warn(`[Sandbox] Props "${prop.name}" 转换失败，跳过:`, e)
        hasInvalid = true
      }
    }

    if (!hasInvalid && Object.keys(result).length > 0) {
      lastValidPropsRef.current = result
    }

    hasAnyInvalidRef.current = hasInvalid

    if (hasInvalid && lastValidPropsRef.current) {
      return lastValidPropsRef.current
    }

    return result
  }, [component, propsValues])

  useMemo(() => {
    if (!hasAnyInvalidRef.current) {
      setRenderKey((k) => k + 1)
    }
  }, [processedProps])

  const propsJson = useMemo(() => {
    const display: Record<string, PropValue> = {}
    for (const [key, value] of Object.entries(propsValues)) {
      if (value !== undefined) {
        display[key] = value
      }
    }
    return JSON.stringify(display, null, 2)
  }, [propsValues])

  const showingFallback = hasAnyInvalidRef.current && lastValidPropsRef.current !== null

  if (loadError) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#b91c1c',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>⚠️ 组件加载错误</div>
        <div style={{ fontSize: '13px' }}>{loadError}</div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#7f1d1d' }}>
          文件路径: <code style={{ fontFamily: 'ui-monospace, monospace' }}>{component.filePath}</code>
        </div>
      </div>
    )
  }

  if (!Component) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '14px',
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
        正在加载组件...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          border: '1px dashed #d1d5db',
          borderRadius: '8px',
          padding: '32px',
          backgroundColor: '#ffffff',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {showingFallback && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 10px',
              fontSize: '10px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '4px',
              fontWeight: 600,
              zIndex: 1,
            }}
          >
            ⚠️ Props 含非法值，显示上一次正常渲染
          </div>
        )}
        <SandboxErrorBoundary componentName={component.name} resetKey={renderKey}>
          <Component {...processedProps} />
        </SandboxErrorBoundary>
      </div>
      <div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          当前 Props
        </div>
        <pre
          style={{
            margin: 0,
            padding: '12px',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            overflowX: 'auto',
            lineHeight: 1.5,
          }}
        >
          {propsJson}
        </pre>
      </div>
    </div>
  )
}

export default Sandbox
