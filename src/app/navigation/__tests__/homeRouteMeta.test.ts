import { describe, expect, it } from 'vitest'
import { getDefaultHomeSidebarModules, HOME_ROUTE_META_BY_NAME } from '../homeRouteMeta'

describe('homeRouteMeta', () => {
  it('exposes configuration-focused pages in the default sidebar', () => {
    const modules = getDefaultHomeSidebarModules()
    const moduleKeys = modules.map((item) => item.key)

    expect(moduleKeys).toContain('metrics-catalog')
    expect(moduleKeys).toContain('custom-dashboard')
    expect(HOME_ROUTE_META_BY_NAME['metrics-catalog'].visibility).toBe('sidebar')
    expect(HOME_ROUTE_META_BY_NAME['custom-dashboard'].visibility).toBe('sidebar')
  })
})
