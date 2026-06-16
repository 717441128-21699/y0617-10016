import * as ts from 'typescript'
import type { ComponentDoc, PropDefinition } from '@/types'

function getJSDocComment(symbol: ts.Symbol, checker: ts.TypeChecker): string {
  const tags = symbol.getJsDocTags(checker)
  const comment = symbol.getDocumentationComment(checker)
  if (comment && comment.length > 0) {
    return comment.map((c) => c.text).join(' ')
  }
  if (tags.length > 0) {
    return tags.map((t) => `${t.name}: ${t.text?.map((t) => t.text).join(' ') ?? ''}`).join(' ')
  }
  return ''
}

function getDefaultValue(symbol: ts.Symbol): string | undefined {
  const declarations = symbol.getDeclarations()
  if (!declarations) return undefined
  for (const decl of declarations) {
    if (ts.isPropertySignature(decl)) {
      const propDecl = decl as ts.PropertySignature & { initializer?: ts.Expression }
      if (propDecl.initializer) {
        return propDecl.initializer.getText()
      }
    }
  }
  return undefined
}

function typeToString(type: ts.Type, checker: ts.TypeChecker): string {
  const typeStr = checker.typeToString(type)
  return typeStr
}

function parsePropsFromInterface(
  interfaceDecl: ts.InterfaceDeclaration,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): PropDefinition[] {
  const props: PropDefinition[] = []
  const type = checker.getTypeAtLocation(interfaceDecl)
  const properties = type.getProperties()

  for (const prop of properties) {
    const declarations = prop.getDeclarations()
    if (!declarations || declarations.length === 0) continue

    const decl = declarations[0]
    const propType = checker.getTypeOfSymbolAtLocation(prop, decl)

    const isRequired = !!(prop.getFlags() & ts.SymbolFlags.Optional) === false

    const lineAndChar = sourceFile.getLineAndCharacterOfPosition(decl.getStart())

    props.push({
      name: prop.getName(),
      type: typeToString(propType, checker),
      required: isRequired,
      description: getJSDocComment(prop, checker),
      defaultValue: getDefaultValue(prop),
      line: lineAndChar.line + 1,
    })
  }

  return props
}

function findComponentName(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  propsInterfaceName: string
): string {
  const baseName = propsInterfaceName.replace(/Props$/, '')
  if (baseName) return baseName

  let defaultExportName = ''
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isExportAssignment(node)) {
      defaultExportName = node.expression.getText()
    }
    if (ts.isExportDeclaration(node) && !node.exportClause) {
    }
  })
  if (defaultExportName) return defaultExportName

  const fileName = sourceFile.fileName.split('/').pop()?.replace(/\.(tsx|ts)$/, '') ?? 'Component'
  return fileName
}

export function parseTsxSource(filePath: string, sourceCode: string): ComponentDoc | null {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  const program = ts.createProgram([filePath], {
    jsx: ts.JsxEmit.React,
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  }, {
    getSourceFile: (fileName) => {
      if (fileName === filePath) return sourceFile
      return undefined
    },
    writeFile: () => {},
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => '',
    getNewLine: () => '\n',
    fileExists: (fileName) => fileName === filePath,
    readFile: (fileName) => (fileName === filePath ? sourceCode : undefined),
  })

  const checker = program.getTypeChecker()
  let componentDoc: ComponentDoc | null = null

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text
      if (interfaceName.endsWith('Props')) {
        const componentName = findComponentName(sourceFile, checker, interfaceName)
        const props = parsePropsFromInterface(node, checker, sourceFile)

        const symbol = checker.getSymbolAtLocation(node.name)
        let description = ''
        if (symbol) {
          const comment = symbol.getDocumentationComment(checker)
          description = comment.map((c) => c.text).join(' ')
        }

        let defaultExportName = componentName
        ts.forEachChild(sourceFile, (n) => {
          if (ts.isExportAssignment(n)) {
            defaultExportName = n.expression.getText()
          }
        })

        componentDoc = {
          name: componentName,
          filePath,
          props,
          sourceCode,
          description,
          defaultExportName,
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  ts.forEachChild(sourceFile, visit)
  return componentDoc
}
