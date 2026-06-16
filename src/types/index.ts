export interface PropDefinition {
  name: string
  type: string
  required: boolean
  description: string
  defaultValue?: string
  line: number
}

export interface ComponentDoc {
  name: string
  filePath: string
  props: PropDefinition[]
  sourceCode: string
  description?: string
  defaultExportName: string
}

export type PropValue = string | number | boolean | undefined

export interface ComponentPropsState {
  [componentName: string]: {
    [propName: string]: PropValue
  }
}
