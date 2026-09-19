import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeTailwindSources } from './audit-tailwind.mjs'

test('reports repeated and long Tailwind class groups', () => {
  const repeated = 'flex items-center justify-between gap-3'
  const report = analyzeTailwindSources(
    [
      { file: 'one.tsx', source: `<div className="${repeated}" /><div className="${repeated}" />` },
      { file: 'two.tsx', source: `<main className={cn("${repeated}", active && "bg-muted")} />` },
    ],
    { minOccurrences: 3, minTokens: 4, longThreshold: 20 },
  )

  assert.equal(report.summary.files, 2)
  assert.equal(report.repeated[0]?.value, repeated)
  assert.equal(report.repeated[0]?.occurrences, 3)
  assert.equal(report.longest[0]?.characters, repeated.length)
})

test('ignores short class groups when finding extraction candidates', () => {
  const report = analyzeTailwindSources(
    [{ file: 'short.tsx', source: '<><span className="flex gap-2" /><span className="flex gap-2" /></>' }],
    { minOccurrences: 2, minTokens: 3 },
  )

  assert.equal(report.repeated.length, 0)
})

test('does not treat condition literals as class names', () => {
  const report = analyzeTailwindSources(
    [{ file: 'condition.tsx', source: '<div className={cn(status === "active" && "bg-primary text-primary-foreground")} />' }],
  )

  assert.equal(report.summary.groups, 1)
  assert.equal(report.longest.some((group) => group.value === 'active'), false)
})

test('reports the total repeated candidate count before output limiting', () => {
  const report = analyzeTailwindSources(
    [{
      file: 'limited.tsx',
      source: '<><div className="flex items-center gap-2" /><div className="flex items-center gap-2" /><div className="grid items-center gap-2" /><div className="grid items-center gap-2" /></>',
    }],
    { minOccurrences: 2, minTokens: 3, limit: 1 },
  )

  assert.equal(report.summary.repeatedGroups, 2)
  assert.equal(report.repeated.length, 1)
})
