import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('logs route', () => {
  it('routes investigate logs to the full log center with realtime stream', () => {
    const routerSource = readFileSync(resolve(__dirname, '../index.ts'), 'utf8')

    expect(routerSource).toContain("path: 'investigate/logs'")
    expect(routerSource).toContain("component: () => import('@/domains/logs/pages/LogCenterPage')")
  })
})
