import React, { useEffect, useRef } from 'react'
import type { ComponentDoc } from '@/types'

interface SourceViewerProps {
  component: ComponentDoc
  highlightLine: number | null
  onClose: () => void
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  component,
  highlightLine,
  onClose,
}) => {
  const linesRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const lines = component.sourceCode.split('\n')

  useEffect(() => {
    if (highlightLine !== null && lineRefs.current.has(highlightLine)) {
      const lineEl = lineRefs.current.get(highlightLine)
      lineEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightLine])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '80vh',
          backgroundColor: '#1e1e1e',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#2d2d2d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #3e3e3e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px' }}>📄</span>
            <span style={{ color: '#d4d4d4', fontSize: '13px', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
              {component.filePath}
            </span>
            {highlightLine !== null && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  borderRadius: '999px',
                  fontWeight: 500,
                }}
              >
                第 {highlightLine} 行
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div
          ref={linesRef}
          style={{
            overflow: 'auto',
            flex: 1,
          }}
        >
          {lines.map((line, index) => {
            const lineNum = index + 1
            const isHighlighted = lineNum === highlightLine
            return (
              <div
                key={lineNum}
                ref={(el) => {
                  if (el) lineRefs.current.set(lineNum, el)
                }}
                style={{
                  display: 'flex',
                  backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  transition: 'background-color 0.3s ease',
                  boxShadow: isHighlighted ? 'inset 3px 0 0 #3b82f6' : 'none',
                }}
              >
                <div
                  style={{
                    padding: '2px 12px',
                    color: '#6b7280',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: '12px',
                    textAlign: 'right',
                    minWidth: '50px',
                    userSelect: 'none',
                    backgroundColor: '#252526',
                    borderRight: '1px solid #3e3e3e',
                  }}
                >
                  {lineNum}
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '2px 12px',
                    flex: 1,
                    color: '#d4d4d4',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: '12px',
                    whiteSpace: 'pre',
                    overflowX: 'auto',
                    lineHeight: 1.6,
                  }}
                >
                  {line || ' '}
                </pre>
              </div>
            )
          })}
        </div>
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#2d2d2d',
            borderTop: '1px solid #3e3e3e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          <span>共 {lines.length} 行</span>
          <span>点击任意 Props 表格行可跳转到对应源码</span>
        </div>
      </div>
    </div>
  )
}

export default SourceViewer
