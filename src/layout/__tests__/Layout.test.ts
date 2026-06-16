import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Layout top bar integration', () => {
  it('wires the home window label into WindowActionBar so the top-bar pin control is available', () => {
    const source = readFileSync(resolve(__dirname, '../index.tsx'), 'utf-8')

    expect(source).toContain('<WindowActionBar maxW={true} shrink={false} topWinLable="home" showSlot plain>')
  })

  it('keeps the layout body from expanding to wide route content', () => {
    const layoutStyles = readFileSync(resolve(__dirname, '../index.scss'), 'utf-8')
    const containerStyles = readFileSync(resolve(__dirname, '../container/index.scss'), 'utf-8')

    expect(layoutStyles).toContain('min-width: 0;')
    expect(layoutStyles).toContain('overflow: hidden;')
    expect(containerStyles).toContain('max-width: 100%;')
    expect(containerStyles).toContain('min-width: 0;')
    expect(containerStyles).toContain('.service-main')
    expect(containerStyles).toContain('display: flex;')
    expect(containerStyles).toContain('min-height: 0;')
  })
})
