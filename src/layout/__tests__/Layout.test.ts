import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Layout top bar integration', () => {
  it('wires the home window label into WindowActionBar so the top-bar pin control is available', () => {
    const source = readFileSync(resolve(__dirname, '../index.tsx'), 'utf-8')

    expect(source).toContain('<WindowActionBar maxW={true} shrink={false} topWinLable="home" showSlot plain>')
  })
})
