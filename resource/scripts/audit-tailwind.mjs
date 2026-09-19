#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const projectRoot = resolve(import.meta.dirname, '..')
const defaultRoots = [
  'apps/web/src',
  'packages/theme-default/src',
  'packages/ui/src',
  'packages/runtime/src',
]

export function analyzeTailwindSources(sources, options = {}) {
  const longThreshold = options.longThreshold ?? 120
  const groups = []
  const files = new Map()

  for (const { file, source } of sources) {
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )
    const fileStats = { file, groups: 0, tokens: 0, longGroups: 0 }
    files.set(file, fileStats)
    visit(sourceFile)

    function visit(node) {
      if (ts.isJsxAttribute(node) && node.name.getText(sourceFile) === 'className') {
        for (const value of classStrings(node.initializer)) {
          const normalized = value.trim().replace(/\s+/g, ' ')
          if (!normalized) continue
          const tokens = normalized.split(' ')
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
          const group = {
            value: normalized,
            file,
            line,
            characters: normalized.length,
            tokens: tokens.length,
          }
          groups.push(group)
          fileStats.groups += 1
          fileStats.tokens += tokens.length
          if (normalized.length >= longThreshold) fileStats.longGroups += 1
        }
      }
      ts.forEachChild(node, visit)
    }
  }

  return summarize(groups, [...files.values()], options)
}

function classStrings(initializer) {
  if (!initializer) return []
  if (ts.isStringLiteral(initializer)) return [initializer.text]
  if (!ts.isJsxExpression(initializer) || !initializer.expression) return []

  const values = []
  collectClassValues(initializer.expression)
  return values

  function collectClassValues(node) {
    if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      values.push(node.text)
      return
    }
    if (ts.isTemplateExpression(node)) {
      if (node.head.text.trim()) values.push(node.head.text)
      for (const span of node.templateSpans) {
        if (span.literal.text.trim()) values.push(span.literal.text)
      }
      return
    }
    if (ts.isCallExpression(node)) {
      node.arguments.forEach(collectClassValues)
      return
    }
    if (ts.isConditionalExpression(node)) {
      collectClassValues(node.whenTrue)
      collectClassValues(node.whenFalse)
      return
    }
    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        collectClassValues(node.right)
        return
      }
      collectClassValues(node.left)
      collectClassValues(node.right)
      return
    }
    if (ts.isArrayLiteralExpression(node)) {
      node.elements.forEach(collectClassValues)
      return
    }
    if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) {
          if (ts.isStringLiteralLike(property.name)) values.push(property.name.text)
          else if (ts.isIdentifier(property.name)) values.push(property.name.text)
        }
      }
      return
    }
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node)
    ) {
      collectClassValues(node.expression)
    }
  }
}

function summarize(groups, files, options) {
  const minOccurrences = options.minOccurrences ?? 3
  const minTokens = options.minTokens ?? 4
  const longThreshold = options.longThreshold ?? 120
  const limit = options.limit ?? 20
  const repeatedMap = new Map()

  for (const group of groups) {
    if (group.tokens < minTokens) continue
    const entry = repeatedMap.get(group.value) ?? {
      value: group.value,
      occurrences: 0,
      tokens: group.tokens,
      locations: [],
    }
    entry.occurrences += 1
    entry.locations.push(`${group.file}:${group.line}`)
    repeatedMap.set(group.value, entry)
  }

  const repeatedCandidates = [...repeatedMap.values()]
    .filter((entry) => entry.occurrences >= minOccurrences)
    .sort((left, right) =>
      right.occurrences * right.tokens - left.occurrences * left.tokens ||
      right.occurrences - left.occurrences,
    )
  const repeated = repeatedCandidates.slice(0, limit)
  const longest = groups
    .filter((group) => group.characters >= longThreshold)
    .sort((left, right) => right.characters - left.characters)
    .slice(0, limit)
  const hotspots = files
    .filter((file) => file.groups > 0)
    .sort((left, right) => right.tokens - left.tokens)
    .slice(0, limit)

  return {
    summary: {
      files: files.filter((file) => file.groups > 0).length,
      groups: groups.length,
      tokens: groups.reduce((total, group) => total + group.tokens, 0),
      longGroups: groups.filter((group) => group.characters >= longThreshold).length,
      repeatedGroups: repeatedCandidates.length,
      thresholds: { longThreshold, minOccurrences, minTokens },
    },
    hotspots,
    repeated,
    longest,
  }
}

function collectFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...collectFiles(path))
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(path)
  }
  return files
}

function option(name, fallback) {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
}

function printText(report) {
  const { summary } = report
  console.log(`Tailwind audit: ${summary.files} files, ${summary.groups} class groups, ${summary.tokens} utility tokens`)
  console.log(`Long groups: ${summary.longGroups} (>= ${summary.thresholds.longThreshold} chars)`)
  console.log(`Repeated groups: ${summary.repeatedGroups} (>= ${summary.thresholds.minOccurrences} uses, >= ${summary.thresholds.minTokens} tokens)`)

  printSection('Hotspot files', report.hotspots, (item) =>
    `${item.tokens} tokens · ${item.groups} groups · ${item.longGroups} long · ${item.file}`,
  )
  printSection('Repeated class groups', report.repeated, (item) =>
    `${item.occurrences}× · ${item.tokens} tokens · ${item.value}\n    ${item.locations.join(', ')}`,
  )
  printSection('Longest class groups', report.longest, (item) =>
    `${item.characters} chars · ${item.file}:${item.line}\n    ${item.value}`,
  )
}

function printSection(title, items, format) {
  console.log(`\n${title}`)
  if (!items.length) {
    console.log('  none')
    return
  }
  items.forEach((item, index) => console.log(`${index + 1}. ${format(item)}`))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const requestedRoots = option('--root', '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const roots = (requestedRoots.length ? requestedRoots : defaultRoots).map((root) => resolve(projectRoot, root))
  const sources = roots.flatMap((root) =>
    collectFiles(root).map((file) => ({
      file: relative(projectRoot, file).replaceAll('\\', '/'),
      source: readFileSync(file, 'utf8'),
    })),
  )
  const report = analyzeTailwindSources(sources, {
    longThreshold: Number(option('--long-threshold', '120')),
    minOccurrences: Number(option('--min-occurrences', '3')),
    minTokens: Number(option('--min-tokens', '4')),
    limit: Number(option('--limit', '20')),
  })
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
  else printText(report)
}
