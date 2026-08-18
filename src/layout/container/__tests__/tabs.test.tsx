// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ContainerTabs from '../tabs'

const routerPush = vi.hoisted(() => vi.fn())
const route = vi.hoisted(() => ({
  fullPath: '/home/services',
  path: '/home/services',
  query: {},
  meta: { title: '服务目录' },
  name: 'services'
}))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: routerPush })
}))

vi.mock('naive-ui', () => ({ NIcon: { template: '<span><slot /></span>' } }))

describe('ContainerTabs', () => {
  beforeEach(() => {
    routerPush.mockReset()
    route.fullPath = '/home/services'
    route.path = '/home/services'
    route.meta = { title: '服务目录' }
    route.name = 'services'
  })

  it('exposes the active page as an accessible tab with a separate close button', () => {
    const wrapper = mount(ContainerTabs)

    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('已打开页面')
    expect(wrapper.get('[role="tab"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[role="tab"]').text()).toBe('服务目录')
    expect(wrapper.get('.container-tabs__icon')).toBeTruthy()
    expect(wrapper.get('button[aria-label="关闭服务目录"]')).toBeTruthy()
  })

  it('opens the fallback page after closing the active tab', async () => {
    const wrapper = mount(ContainerTabs)

    await wrapper.get('button[aria-label="关闭服务目录"]').trigger('click')

    expect(routerPush).toHaveBeenCalledWith('/home/overview')
  })

  it('keeps middle-click closing behavior', async () => {
    const wrapper = mount(ContainerTabs)

    await wrapper.get('.container-tabs__tab').trigger('mouseup', { button: 1 })

    expect(routerPush).toHaveBeenCalledWith('/home/overview')
  })

  it('caches the routed desktop page instance inside the content RouterView', async () => {
    const source = await readFile(resolve(process.cwd(), 'src/layout/container/index.tsx'), 'utf8')

    expect(source).toContain('KeepAlive')
    expect(source).toContain('<RouterView>')
    expect(source).toMatch(/h\(\s*KeepAlive/)
    expect(source).toContain('key: route.fullPath')
  })
})
