import React from 'react'
import type { ComponentDoc } from '@/types'

interface PropsTableProps {
  component: ComponentDoc
  onPropClick?: (line: number) => void
}

export const PropsTable: React.FC<PropsTableProps> = ({ component, onPropClick }) => {
  if (component.props.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#9ca3af',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px dashed #d1d5db',
        }}
      >
        该组件暂无 Props 定义
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                minWidth: '120px',
              }}
            >
              属性名
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                minWidth: '160px',
              }}
            >
              类型
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                minWidth: '80px',
              }}
            >
              必填
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                minWidth: '100px',
              }}
            >
              默认值
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              说明
            </th>
          </tr>
        </thead>
        <tbody>
          {component.props.map((prop) => (
            <tr
              key={prop.name}
              onClick={() => onPropClick?.(prop.line)}
              style={{
                cursor: onPropClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (onPropClick) {
                  ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f3f4f6'
                }
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'
              }}
            >
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                {prop.name}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <code
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: '12px',
                    padding: '2px 6px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    color: '#0550ae',
                  }}
                >
                  {prop.type}
                </code>
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {prop.required ? (
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      borderRadius: '999px',
                      fontWeight: 500,
                    }}
                  >
                    必填
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '999px',
                    }}
                  >
                    可选
                  </span>
                )}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontSize: '12px',
                  color: '#6b7280',
                }}
              >
                {prop.defaultValue || '-'}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  color: '#4b5563',
                  lineHeight: 1.5,
                }}
              >
                {prop.description || (
                  <span style={{ color: '#d1d5db' }}>暂无说明</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PropsTable
