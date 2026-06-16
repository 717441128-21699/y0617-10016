import type { ComponentDoc } from '@/types'
import { parseTsxSource } from './tsParser'

const modules = import.meta.glob('/src/components/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function extractFileName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1].replace(/\.(tsx|ts)$/, '')
}

function extractComponentName(path: string): string {
  return extractFileName(path)
}

export function loadAllComponents(): ComponentDoc[] {
  const docs: ComponentDoc[] = []

  for (const [filePath, sourceCode] of Object.entries(modules)) {
    const doc = parseTsxSource(filePath, sourceCode)
    if (doc && doc.props.length > 0) {
      docs.push(doc)
    } else {
      const fallbackName = extractComponentName(filePath)
      docs.push({
        name: fallbackName,
        filePath,
        props: [],
        sourceCode,
        description: '',
        defaultExportName: fallbackName,
      })
    }
  }

  return docs.sort((a, b) => a.name.localeCompare(b.name))
}

export function getComponentModule(component: ComponentDoc) {
  const normalizedPath = component.filePath.replace('/src/', '/src/')
  return import(/* @vite-ignore */ normalizedPath)
}
