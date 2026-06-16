import React from 'react'

/**
 * 数据表格列定义
 */
export interface DataTableColumn<T = any> {
  /** 列唯一标识 */
  key: string
  /** 列标题 */
  title: string
  /** 数据字段名 */
  dataIndex: keyof T
  /** 列宽 */
  width?: number
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 自定义渲染函数 */
  render?: (value: any, record: T, index: number) => React.ReactNode
  /** 是否可排序 */
  sortable?: boolean
}

/**
 * 数据表格组件属性
 */
export interface DataTableProps<T extends Record<string, any>> {
  /** 列配置 */
  columns: DataTableColumn<T>[]
  /** 表格数据 */
  dataSource: T[]
  /** 表格标题 */
  title?: string
  /** 行唯一 key 字段 */
  rowKey?: keyof T
  /** 是否显示斑马纹 */
  striped?: boolean
  /** 是否带边框 */
  bordered?: boolean
  /** 空状态描述 */
  emptyText?: string
  /** 分页配置 */
  pagination?: {
    pageSize: number
    current: number
    total: number
    onChange: (page: number) => void
  }
  /** 加载状态 */
  loading?: boolean
  /** 行点击事件 */
  onRowClick?: (record: T, index: number) => void
  /** 底部操作栏 */
  footer?: React.ReactNode
}

/**
 * 通用数据表格组件
 */
function DataTableInner<T extends Record<string, any>>(
  props: DataTableProps<T>
): React.ReactElement {
  const {
    columns,
    dataSource,
    title,
    rowKey = 'id' as keyof T,
    striped = true,
    bordered = false,
    emptyText = '暂无数据',
    pagination,
    loading = false,
    onRowClick,
    footer,
  } = props

  const displayData = pagination
    ? dataSource.slice(
        (pagination.current - 1) * pagination.pageSize,
        pagination.current * pagination.pageSize
      )
    : dataSource

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: bordered ? '1px solid #e5e7eb' : 'none',
        minWidth: '500px',
      }}
    >
      {title && (
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f3f4f6',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          {title}
        </div>
      )}

      <div style={{ overflowX: 'auto', position: 'relative' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            <span style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }}>⟳</span>
            加载中...
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    textAlign: col.align || 'left',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}
                >
                  {col.title}
                  {col.sortable && <span style={{ marginLeft: '4px' }}>↕</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '48px 16px',
                    textAlign: 'center',
                    color: '#9ca3af',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                  {emptyText}
                </td>
              </tr>
            ) : (
              displayData.map((record, index) => (
                <tr
                  key={String(record[rowKey]) ?? index}
                  onClick={() => onRowClick?.(record, index)}
                  style={{
                    backgroundColor: striped && index % 2 === 1 ? '#fafafa' : '#ffffff',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f0f9ff'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      striped && index % 2 === 1 ? '#fafafa' : '#ffffff'
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 16px',
                        textAlign: col.align || 'left',
                        borderBottom: '1px solid #f3f4f6',
                        color: '#374151',
                      }}
                    >
                      {col.render ? col.render(record[col.dataIndex], record, index) : String(record[col.dataIndex] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #f3f4f6',
          }}
        >
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            共 {pagination.total} 条，第 {pagination.current}/{totalPages || 1} 页
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: pagination.current <= 1 ? '#f3f4f6' : '#ffffff',
                color: pagination.current <= 1 ? '#9ca3af' : '#374151',
                cursor: pagination.current <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              上一页
            </button>
            <button
              disabled={pagination.current >= totalPages}
              onClick={() => pagination.onChange(pagination.current + 1)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: pagination.current >= totalPages ? '#f3f4f6' : '#ffffff',
                color: pagination.current >= totalPages ? '#9ca3af' : '#374151',
                cursor: pagination.current >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {footer && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6' }}>{footer}</div>
      )}
    </div>
  )
}

export const DataTable = DataTableInner as typeof DataTableInner

export default DataTable
