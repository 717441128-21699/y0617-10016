import React, { useEffect, useState, useMemo } from 'react'
import type { ComponentDoc, PropValue } from '@/types'
import { getComponentModule } from '@/utils/componentLoader'

interface SandboxProps {
  component: ComponentDoc
  propsValues: Record<string, PropValue>
}

function convertValue(rawValue: PropValue, propType: string): unknown {
  if (rawValue === undefined) return undefined

  if (propType.includes('=>') || propType.includes('function')) {
    return () => {
      console.log('Function prop called')
    }
  }

  if (propType.includes('string[]') && typeof rawValue === 'string') {
    return rawValue.split(',').map((s) => s.trim())
  }

  if (propType.includes('ReactNode') || propType.includes('React.ReactNode')) {
    if (typeof rawValue === 'string') {
      return rawValue
    }
  }

  return rawValue
}

export const Sandbox: React.FC<SandboxProps> = ({ component, propsValues }) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setError(null)
    setComponent(null)

    getComponentModule(component)
      .then((mod) => {
        if (!mounted) return
        const defaultExport = mod.default || mod[component.defaultExportName] || Object.values(mod)[0]
        if (defaultExport) {
          setComponent(() => defaultExport as React.ComponentType<any>)
        } else {
          setError(`未找到组件导出: ${component.name}`)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(`加载组件失败: ${err.message}`)
        }
      })

    return () => {
      mounted = false
    }
  }, [component])

  const processedProps = useMemo(() => {
    const result: Record<string, unknown> = {}
    for (const prop of component.props) {
      if (propsValues[prop.name] !== undefined) {
        result[prop.name] = convertValue(propsValues[prop.name], prop.type)
      }
    }
    return result
  }, [component, propsValues])

  const propsJson = useMemo(() => {
    const display: Record<string, PropValue> = {}
    for (const [key, value] of Object.entries(propsValues)) {
      if (value !== undefined) {
        display[key] = value
      }
    }
    return JSON.stringify(display, null, 2)
  }, [propsValues])

  if (error) {
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
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>⚠️ 加载错误</div>
        <div style={{ fontSize: '13px' }}>{error}</div>
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
        }}
      >
        <Component {...processedProps} />
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
