import type { ControlType, PropDefinition, PropValidation, PropValue } from '@/types'

export function parseUnionType(type: string): string[] | null {
  const unionStrs = type.match(/["']([^"']+)["']/g)
  if (unionStrs && unionStrs.length > 1) {
    return unionStrs.map((s) => s.slice(1, -1))
  }
  return null
}

export function isComplexType(type: string): boolean {
  return (
    type.includes('[]') ||
    type.includes('Array<') ||
    type.includes('{') ||
    type.includes('Record<') ||
    type.includes('Map<') ||
    type.includes('Set<') ||
    type.includes('Promise<') ||
    type.includes('ReactNode') ||
    type.includes('React.ReactNode') ||
    type.includes('ReactElement') ||
    type.includes('JSX.Element') ||
    type.includes('=>') ||
    type.includes('function')
  )
}

export function isFunctionType(type: string): boolean {
  return type.includes('=>') || type.includes('function')
}

export function isReactNodeType(type: string): boolean {
  return (
    type.includes('ReactNode') ||
    type.includes('React.ReactNode') ||
    type.includes('ReactElement') ||
    type.includes('JSX.Element')
  )
}

export function isArrayType(type: string): boolean {
  return type.includes('[]') || type.includes('Array<')
}

export function isObjectType(type: string): boolean {
  return (
    (type.includes('{') && type.includes('}')) ||
    type.includes('Record<') ||
    type.includes('Map<') ||
    type.includes('Set<')
  )
}

export function inferControlType(type: string): ControlType {
  const unionOptions = parseUnionType(type)
  if (unionOptions) return 'select'
  if (type === 'boolean') return 'boolean'
  if (type === 'number') return 'number'
  if (type === 'string') return 'text'
  if (isFunctionType(type)) return 'function'
  if (isComplexType(type)) return 'json'
  return 'text'
}

export function generateSampleValue(type: string): PropValue {
  const unionOptions = parseUnionType(type)
  if (unionOptions) return unionOptions[0]
  if (type === 'boolean') return false
  if (type === 'number') return 0
  if (type === 'string') return ''
  if (isFunctionType(type)) {
    return '__FUNCTION__'
  }
  if (isReactNodeType(type)) {
    return '示例文本节点'
  }
  if (isArrayType(type)) {
    if (type.includes('string[]') || type.includes('Array<string>')) {
      return JSON.stringify(['标签1', '标签2', '标签3'], null, 2)
    }
    if (type.includes('number[]') || type.includes('Array<number>')) {
      return JSON.stringify([1, 2, 3], null, 2)
    }
    return JSON.stringify(
      [
        { key: 'tab1', label: '标签页1', content: '内容1' },
        { key: 'tab2', label: '标签页2', content: '内容2' },
      ],
      null,
      2
    )
  }
  if (isObjectType(type)) {
    return JSON.stringify({ key: 'value' }, null, 2)
  }
  return ''
}

export function parseDefaultValue(defaultValue: string | undefined, type: string): PropValue {
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

  if (isArrayType(type) || isObjectType(type)) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2)
    } catch {
      return trimmed
    }
  }

  return trimmed
}

export function validatePropValue(
  value: PropValue,
  prop: PropDefinition
): PropValidation {
  if (value === undefined) {
    if (prop.required) {
      return { valid: false, error: '必填字段' }
    }
    return { valid: true }
  }

  const controlType = inferControlType(prop.type)

  if (controlType === 'json') {
    if (typeof value !== 'string') {
      return { valid: true }
    }
    if (value.trim() === '') {
      return { valid: false, error: 'JSON 不能为空' }
    }
    try {
      JSON.parse(value)
      return { valid: true }
    } catch (e) {
      return { valid: false, error: `JSON 格式错误: ${(e as Error).message}` }
    }
  }

  if (controlType === 'number') {
    if (typeof value === 'number' && isNaN(value)) {
      return { valid: false, error: '请输入有效数字' }
    }
  }

  return { valid: true }
}

export function safeConvertForRender(
  rawValue: PropValue,
  propType: string,
  propName: string
): unknown {
  if (rawValue === undefined) return undefined

  try {
    if (isFunctionType(propType)) {
      return (...args: unknown[]) => {
        console.log(`[${propName}] 回调触发，参数:`, args)
      }
    }

    if (isReactNodeType(propType)) {
      if (typeof rawValue === 'string') {
        return rawValue
      }
      return String(rawValue)
    }

    if (isArrayType(propType) || isObjectType(propType)) {
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue)
        } catch {
          return rawValue
        }
      }
      return rawValue
    }

    return rawValue
  } catch (e) {
    console.warn(`[safeConvert] 转换 ${propName} 失败:`, e)
    return undefined
  }
}
