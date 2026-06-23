// @vitest-environment jsdom
import { defineComponent, h, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContainerHeader from '../index'

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn()
}))

const apiMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  fetchNotifications: vi.fn(),
  resendNotification: vi.fn(),
  updateUserInfo: vi.fn(),
  updateUserAvatar: vi.fn(),
  uploadFile: vi.fn(),
  resolveUploadedFileUrl: vi.fn()
}))

const sessionMocks = vi.hoisted(() => ({
  clearStoredAuthSession: vi.fn(),
  getStoredUserInfo: vi.fn(),
  getMetricsDatasetScopeLabel: vi.fn(),
  persistStoredUserInfo: vi.fn()
}))

const avatarCacheMocks = vi.hoisted(() => ({
  canCacheAvatarSource: vi.fn(),
  getCachedAvatarSource: vi.fn(),
  resolveCachedAvatarSource: vi.fn(),
  putCachedAvatarSource: vi.fn()
}))

const messageMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => routerMock
}))

vi.mock('@/api/auth', () => ({
  logout: apiMocks.logout
}))

vi.mock('@/api/alerts', () => ({
  fetchNotifications: apiMocks.fetchNotifications,
  resendNotification: apiMocks.resendNotification
}))

vi.mock('@/api/file', () => ({
  uploadFile: apiMocks.uploadFile,
  resolveUploadedFileUrl: apiMocks.resolveUploadedFileUrl
}))

vi.mock('@/api/user', () => ({
  updateUserInfo: apiMocks.updateUserInfo,
  updateUserAvatar: apiMocks.updateUserAvatar,
  extractUpdatedUser: (response: { user?: Record<string, unknown> }) => response.user || response
}))

vi.mock('@/services/authSession', () => ({
  USER_INFO_CHANGED_EVENT: 'starlight:user-info-changed',
  clearStoredAuthSession: sessionMocks.clearStoredAuthSession,
  getStoredUserInfo: sessionMocks.getStoredUserInfo,
  getMetricsDatasetScopeLabel: sessionMocks.getMetricsDatasetScopeLabel,
  persistStoredUserInfo: sessionMocks.persistStoredUserInfo
}))

vi.mock('@/services/avatarCache', () => ({
  canCacheAvatarSource: avatarCacheMocks.canCacheAvatarSource,
  getCachedAvatarSource: avatarCacheMocks.getCachedAvatarSource,
  resolveCachedAvatarSource: avatarCacheMocks.resolveCachedAvatarSource,
  putCachedAvatarSource: avatarCacheMocks.putCachedAvatarSource
}))

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      name: `Stub${tag}`,
      props: ['class', 'ariaLabel'],
      setup(props, { slots }) {
        return () => h(tag, { class: props.class, 'aria-label': props.ariaLabel }, slots.default?.())
      }
    })

  return {
    NAvatar: defineComponent({
      name: 'StubAvatar',
      props: ['src', 'class'],
      setup(props, { slots }) {
        return () => h('span', { class: props.class, 'data-src': props.src || '' }, slots.default?.())
      }
    }),
    NBadge: defineComponent({
      name: 'StubBadge',
      props: ['value', 'dot', 'max'],
      setup(props, { slots }) {
        return () =>
          h(
            'span',
            { 'data-badge-value': props.value || '', 'data-badge-dot': String(Boolean(props.dot)) },
            slots.default?.()
          )
      }
    }),
    NButton: defineComponent({
      name: 'StubButton',
      props: ['ariaLabel', 'loading', 'disabled'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () =>
          h(
            'button',
            {
              'aria-label': props.ariaLabel,
              'data-loading': String(Boolean(props.loading)),
              disabled: props.disabled,
              onClick: () => emit('click')
            },
            slots.default?.()
          )
      }
    }),
    NDivider: passthrough('hr'),
    NEmpty: defineComponent({
      name: 'StubEmpty',
      props: ['description', 'class'],
      setup(props, { slots }) {
        return () => h('div', { class: props.class }, [props.description, slots.extra?.(), slots.default?.()])
      }
    }),
    NIcon: defineComponent({
      name: 'StubIcon',
      props: ['component', 'class'],
      setup(props, { slots }) {
        return () => h('span', { class: props.class }, slots.default?.() || (props.component ? 'icon' : undefined))
      }
    }),
    NForm: passthrough('form'),
    NFormItem: defineComponent({
      name: 'StubFormItem',
      props: ['label'],
      setup(props, { slots }) {
        return () => h('label', {}, [h('span', {}, props.label), slots.default?.()])
      }
    }),
    NInput: defineComponent({
      name: 'StubInput',
      props: ['value', 'placeholder', 'disabled', 'maxlength'],
      emits: ['update:value', 'keydown'],
      setup(props, { emit, slots }) {
        return () =>
          h('div', {}, [
            slots.prefix?.(),
            h('input', {
              value: props.value,
              placeholder: props.placeholder,
              disabled: props.disabled,
              maxlength: props.maxlength,
              onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value),
              onKeydown: (event: KeyboardEvent) => emit('keydown', event)
            }),
            slots.suffix?.()
          ])
      }
    }),
    NModal: defineComponent({
      name: 'StubModal',
      props: ['show', 'title', 'class'],
      setup(props, { slots }) {
        return () =>
          h(
            'section',
            { class: props.class, 'data-modal-title': props.title, 'data-show': String(Boolean(props.show)) },
            slots.default?.()
          )
      }
    }),
    NPopover: defineComponent({
      name: 'StubPopover',
      props: ['show'],
      emits: ['update:show'],
      setup(props, { emit, slots }) {
        return () =>
          h('div', { 'data-component': 'popover' }, [
            h('div', { onClick: () => emit('update:show', true) }, slots.trigger?.()),
            h('div', { 'data-popover-open': String(props.show ?? true) }, slots.default?.())
          ])
      }
    }),
    NSlider: defineComponent({
      name: 'StubSlider',
      props: ['value', 'min', 'max', 'step', 'disabled'],
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            type: 'range',
            value: props.value,
            min: props.min,
            max: props.max,
            step: props.step,
            disabled: props.disabled,
            onInput: (event: Event) => emit('update:value', Number((event.target as HTMLInputElement).value))
          })
      }
    }),
    NSpin: passthrough('span'),
    NTag: defineComponent({
      name: 'StubTag',
      props: ['type'],
      setup(props, { slots }) {
        return () => h('span', { 'data-tag-type': props.type || '' }, slots.default?.())
      }
    })
  }
})

describe('ContainerHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerMock.push.mockResolvedValue(undefined)
    routerMock.replace.mockResolvedValue(undefined)
    apiMocks.logout.mockResolvedValue(undefined)
    apiMocks.fetchNotifications.mockResolvedValue([])
    apiMocks.resendNotification.mockResolvedValue(true)
    apiMocks.updateUserInfo.mockResolvedValue({ user: { nickname: 'Ops Lead', timezone: 'UTC+9', locale: 'en-US' } })
    apiMocks.updateUserAvatar.mockResolvedValue({ user: { avatar: 'http://127.0.0.1:6670/uploads/avatar.png' } })
    apiMocks.uploadFile.mockResolvedValue({ fileId: 'file-1' })
    apiMocks.resolveUploadedFileUrl.mockReturnValue('/avatar.png')
    sessionMocks.getStoredUserInfo.mockReturnValue({
      nickName: 'Ops Admin',
      email: 'ops@example.com',
      avatar: '',
      isAdmin: true
    })
    sessionMocks.getMetricsDatasetScopeLabel.mockReturnValue('Darwin 系统')
    sessionMocks.clearStoredAuthSession.mockImplementation(() => {})
    sessionMocks.persistStoredUserInfo.mockImplementation(() => {})
    avatarCacheMocks.canCacheAvatarSource.mockReturnValue(true)
    avatarCacheMocks.getCachedAvatarSource.mockReturnValue('')
    avatarCacheMocks.resolveCachedAvatarSource.mockImplementation((avatar: string) => Promise.resolve(avatar))
    avatarCacheMocks.putCachedAvatarSource.mockImplementation(() => {})
    window.$message = messageMock as unknown as typeof window.$message
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(), configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:avatar')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: ''
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,cropped-avatar')
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 900
        naturalHeight = 420
        onload: (() => void) | null = null
        onerror: (() => void) | null = null

        set src(_value: string) {
          this.onload?.()
        }
      }
    )
  })

  it('routes global search keywords to the matching investigation pages', async () => {
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    const input = wrapper.get('input[placeholder="搜索服务、日志、链路、指标或告警…"]')
    await input.setValue('trace abc')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/traces',
      query: { keyword: 'trace abc' }
    })

    await input.setValue('CPU usage')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/metrics',
      query: { keyword: 'CPU usage' }
    })

    await input.setValue('链路 abc')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/traces',
      query: { keyword: '链路 abc' }
    })

    await input.setValue('日志 error')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/logs',
      query: { keyword: '日志 error' }
    })

    await input.setValue('指标 cpu')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({
      path: '/home/investigate/metrics',
      query: { keyword: '指标 cpu' }
    })

    await input.setValue('gateway service')
    await input.trigger('keydown', { key: 'Enter' })

    expect(routerMock.push).toHaveBeenLastCalledWith({ path: '/home/services', query: { keyword: 'gateway service' } })
  })

  it('supports command-k focus without breaking the desktop drag-safe header shell', async () => {
    const wrapper = mount(ContainerHeader, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.get('.container-header').attributes('data-tauri-drag-region')).toBe('true')
    expect(wrapper.get('.header-search').classes()).toContain('no-drag')
    expect(wrapper.get('.header-actions').classes()).toContain('no-drag')

    const input = wrapper.get('input[placeholder="搜索服务、日志、链路、指标或告警…"]').element as HTMLInputElement
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    await nextTick()

    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('loads notification state, exposes failed retries, and refreshes after resend', async () => {
    apiMocks.fetchNotifications.mockResolvedValueOnce([
      {
        id: 'n1',
        sentAt: '2026-06-02 10:00',
        type: 'CPU 告警',
        service: 'gateway',
        channel: 'email',
        target: 'ops@example.com',
        status: 'failed',
        content: 'CPU too high',
        errorMessage: 'SMTP rejected',
        retryCount: 1
      }
    ])
    apiMocks.fetchNotifications.mockResolvedValueOnce([
      {
        id: 'n1',
        sentAt: '2026-06-02 10:01',
        type: 'CPU 告警',
        service: 'gateway',
        channel: 'email',
        target: 'ops@example.com',
        status: 'sent',
        content: 'delivered',
        retryCount: 2
      }
    ])

    const wrapper = mount(ContainerHeader)
    await flushPromises()

    expect(apiMocks.fetchNotifications).toHaveBeenCalledWith()
    expect(wrapper.text()).toContain('1 条失败，0 条发送中')
    expect(wrapper.text()).toContain('CPU 告警')
    expect(wrapper.text()).toContain('SMTP rejected')

    const resendButton = wrapper.findAll('button').find((button) => button.text() === '重发')
    expect(resendButton).toBeTruthy()
    await resendButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.resendNotification).toHaveBeenCalledWith('n1')
    expect(messageMock.success).toHaveBeenCalledWith('通知已重新发送')
    expect(wrapper.text()).toContain('最近通知状态正常')
  })

  it('keeps the notification popover actionable when loading fails', async () => {
    apiMocks.fetchNotifications.mockRejectedValue(new Error('network failed'))

    const wrapper = mount(ContainerHeader)
    await flushPromises()

    expect(wrapper.text()).toContain('通知状态暂不可用')
    expect(wrapper.text()).toContain('通知加载失败，请稍后重试。')
    expect(wrapper.text()).toContain('重新加载')
  })

  it('shows account context and routes avatar menu actions including logout', async () => {
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    expect(wrapper.text()).toContain('Ops Admin')
    expect(wrapper.text()).toContain('ops@example.com')
    expect(wrapper.text()).toContain('管理员')
    expect(wrapper.text()).toContain('Darwin 系统')

    const settingsButton = wrapper.findAll('button').find((button) => button.text().includes('应用设置'))
    expect(settingsButton).toBeTruthy()
    await settingsButton!.trigger('click')
    expect(routerMock.push).toHaveBeenLastCalledWith('/home/settings')

    const logoutButton = wrapper.findAll('button').find((button) => button.text().includes('退出登录'))
    expect(logoutButton).toBeTruthy()
    await logoutButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.logout).toHaveBeenCalled()
    expect(sessionMocks.clearStoredAuthSession).toHaveBeenCalled()
    expect(routerMock.replace).toHaveBeenCalledWith('/login')
  })

  it('refreshes header avatar when user info changes in the same window', async () => {
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    expect(wrapper.find('.header-avatar-button__avatar').attributes('data-src')).toBeUndefined()

    window.dispatchEvent(
      new CustomEvent('starlight:user-info-changed', {
        detail: {
          userId: 'user-1',
          nickName: 'Ops Admin',
          email: 'ops@example.com',
          avatar: 'https://starlight.example.com/uploads/avatar.webp',
          isAdmin: true
        }
      })
    )
    await flushPromises()

    expect(wrapper.find('.header-avatar-button__avatar').attributes('data-src')).toBe(
      'https://starlight.example.com/uploads/avatar.webp'
    )
    expect(avatarCacheMocks.resolveCachedAvatarSource).toHaveBeenCalledWith(
      'https://starlight.example.com/uploads/avatar.webp'
    )
  })

  it('uses a locally cached avatar source after resolving the remote avatar once', async () => {
    avatarCacheMocks.resolveCachedAvatarSource.mockResolvedValue('data:image/webp;base64,cached-avatar')
    sessionMocks.getStoredUserInfo.mockReturnValue({
      userId: 'user-1',
      nickName: 'Ops Admin',
      email: 'ops@example.com',
      avatar: '/uploads/avatar.webp',
      isAdmin: true
    })

    const wrapper = mount(ContainerHeader)
    await flushPromises()

    expect(wrapper.find('.header-avatar-button__avatar').attributes('data-src')).toBe(
      'data:image/webp;base64,cached-avatar'
    )
    expect(avatarCacheMocks.resolveCachedAvatarSource).toHaveBeenCalledWith('/uploads/avatar.webp')
  })

  it('opens profile page from avatar menu', async () => {
    sessionMocks.getStoredUserInfo.mockReturnValue({
      userId: 'user-1',
      nickName: 'Ops Admin',
      email: 'ops@example.com',
      avatar: '',
      isAdmin: true,
      timezone: 'UTC+8',
      locale: 'zh-CN'
    })
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    const editButton = wrapper.findAll('button').find((button) => button.text().includes('编辑个人资料'))
    expect(editButton).toBeTruthy()
    await editButton!.trigger('click')

    expect(routerMock.push).toHaveBeenLastCalledWith('/home/profile')
  })

  it('opens a cropper for non-square avatar images before uploading', async () => {
    sessionMocks.getStoredUserInfo.mockReturnValue({
      userId: 'user-1',
      nickName: 'Ops Admin',
      email: 'ops@example.com',
      avatar: '',
      isAdmin: true
    })
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    const file = new File(['avatar'], 'wide-avatar.png', { type: 'image/png' })
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.get('input[type="file"]').trigger('change')
    await flushPromises()

    expect(messageMock.error).not.toHaveBeenCalledWith(expect.stringContaining('头像必须是'))
    expect(wrapper.get('.avatar-crop-uploader__modal').attributes('data-show')).toBe('true')

    const saveButton = wrapper.findAll('button').find((button) => button.text().includes('保存头像'))
    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        scene: 'user-avatar',
        bizType: 'user',
        bizId: 'user-1',
        fileName: 'user-1-avatar.webp',
        mimeType: 'image/webp',
        fileBase64: 'cropped-avatar'
      })
    )
    expect(apiMocks.updateUserAvatar).toHaveBeenCalledWith({
      userId: 'user-1',
      avatar: '/avatar.png',
      avatarFileId: 'file-1'
    })
    expect(avatarCacheMocks.putCachedAvatarSource).toHaveBeenCalledWith(
      'http://127.0.0.1:6670/uploads/avatar.png',
      'data:image/webp;base64,cropped-avatar'
    )
    expect(sessionMocks.persistStoredUserInfo).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: 'http://127.0.0.1:6670/uploads/avatar.png' })
    )
  })

  it('rejects avatar source files that exceed the client-side size limit', async () => {
    sessionMocks.getStoredUserInfo.mockReturnValue({
      userId: 'user-1',
      nickName: 'Ops Admin',
      email: 'ops@example.com',
      avatar: '',
      isAdmin: true
    })
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    const file = new File(['avatar'], 'huge-avatar.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.get('input[type="file"]').trigger('change')
    await flushPromises()

    expect(messageMock.error).toHaveBeenCalledWith('头像原图不能超过 10.0 MB，请先选择体积更小的图片')
    expect(apiMocks.uploadFile).not.toHaveBeenCalled()
    expect(wrapper.get('.avatar-crop-uploader__modal').attributes('data-show')).toBe('false')
  })

  it('shows a friendly message when compressed avatar upload is still rejected as too large', async () => {
    sessionMocks.getStoredUserInfo.mockReturnValue({
      userId: 'user-1',
      nickName: 'Ops Admin',
      email: 'ops@example.com',
      avatar: '',
      isAdmin: true
    })
    apiMocks.uploadFile.mockRejectedValue(new Error('request entity too large'))
    const wrapper = mount(ContainerHeader)
    await flushPromises()

    const file = new File(['avatar'], 'wide-avatar.png', { type: 'image/png' })
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.get('input[type="file"]').trigger('change')
    await flushPromises()

    const saveButton = wrapper.findAll('button').find((button) => button.text().includes('保存头像'))
    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(messageMock.error).toHaveBeenCalledWith('头像压缩后仍过大，请换一张更小的图片')
    expect(apiMocks.updateUserAvatar).not.toHaveBeenCalled()
  })
})
