import type { ComponentDoc } from '@/types'
import { parseTsxSource } from './tsParser'

const sourceModules = import.meta.glob('/src/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const componentModules = import.meta.glob('/src/**/*.tsx', {
  eager: true,
}) as Record<string, Record<string, unknown>>

const EXCLUDED_DIRS = ['/src/components/docs/', '/src/App.tsx', '/src/main.tsx']

function isExcluded(filePath: string): boolean {
  return EXCLUDED_DIRS.some((dir) => filePath.startsWith(dir))
}

function extractFileName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1].replace(/\.(tsx|ts)$/, '')
}

function extractFolderCategory(path: string): string {
  const parts = path.split('/')
  if (parts.length >= 3) {
    return parts[2]
  }
  return 'components'
}

export interface ComponentDocWithCategory extends ComponentDoc {
  category: string
}

export function loadAllComponents(): ComponentDocWithCategory[] {
  const docs: ComponentDocWithCategory[] = []

  for (const [filePath, sourceCode] of Object.entries(sourceModules)) {
    if (isExcluded(filePath)) continue

    const category = extractFolderCategory(filePath)
    const doc = parseTsxSource(filePath, sourceCode)

    if (doc && doc.props.length > 0) {
      docs.push({
        ...doc,
        category,
      })
    } else {
      const fallbackName = extractFileName(filePath)
      const hasExport = componentModules[filePath] && Object.keys(componentModules[filePath]).length > 0
      if (hasExport) {
        docs.push({
          name: fallbackName,
          filePath,
          props: [],
          sourceCode,
          description: '',
          defaultExportName: fallbackName,
          category,
        })
      }
    }
  }

  return docs.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.name.localeCompare(b.name)
  })
}

export function getComponentModule(component: ComponentDoc): Record<string, unknown> | undefined {
  return componentModules[component.filePath]
}

export function getComponentExport(component: ComponentDoc): React.ComponentType<any> | null {
  const mod = getComponentModule(component)
  if (!mod) return null

  const defaultExport = mod.default as React.ComponentType<any> | undefined
  if (defaultExport) return defaultExport

  const namedExport = mod[component.defaultExportName] as React.ComponentType<any> | undefined
  if (namedExport) return namedExport

  for (const value of Object.values(mod)) {
    if (typeof value === 'function') {
      return value as React.ComponentType<any>
    }
  }

  return null
}
