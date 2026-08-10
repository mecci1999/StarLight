import { describe, expect, it } from 'vitest'
import { getDefaultHomeSidebarModules, HOME_ROUTE_META_BY_NAME } from '../homeRouteMeta'

describe('homeRouteMeta', () => {
  it('exposes configuration-focused pages in the default sidebar', () => {
    const modules = getDefaultHomeSidebarModules()
    const moduleKeys = modules.map((item) => item.key)

    expect(moduleKeys).toContain('metrics-catalog')
    expect(moduleKeys).toContain('admin-onboarding')
    expect(moduleKeys).not.toContain('custom-dashboard')
    expect(HOME_ROUTE_META_BY_NAME['metrics-catalog'].visibility).toBe('sidebar')
    expect(HOME_ROUTE_META_BY_NAME['custom-dashboard'].visibility).toBe('hidden')
    expect(HOME_ROUTE_META_BY_NAME['custom-dashboard'].sidebarKey).toBe('service-overview')
    expect(HOME_ROUTE_META_BY_NAME.settings.title).toBe('应用设置')
    expect(HOME_ROUTE_META_BY_NAME.settings.visibility).toBe('hidden')
    expect(HOME_ROUTE_META_BY_NAME.settings.sidebarKey).toBe('admin-ingestion')
    expect(HOME_ROUTE_META_BY_NAME['admin-onboarding-v2'].title).toBe('SDK 接入向导')
    expect(HOME_ROUTE_META_BY_NAME['admin-onboarding-v2'].visibility).toBe('sidebar')
    expect(HOME_ROUTE_META_BY_NAME['admin-onboarding-v2'].sidebarKey).toBe('admin-onboarding')
  })
})
