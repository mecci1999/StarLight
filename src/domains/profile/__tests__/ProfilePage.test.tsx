// @vitest-environment jsdom
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from '../pages/ProfilePage'

const apiMocks = vi.hoisted(() => ({
  updateUserInfo: vi.fn(),
  extractUpdatedUser: vi.fn((response: Record<string, unknown>) => response.user || response)
}))

const sessionMocks = vi.hoisted(() => ({
  getStoredUserInfo: vi.fn(),
  getMetricsDatasetScopeLabel: vi.fn(),
  persistStoredUserInfo: vi.fn()
}))

const avatarCacheMocks = vi.hoisted(() => ({
  canCacheAvatarSource: vi.fn(),
  getCachedAvatarSource: vi.fn(),
  resolveCachedAvatarSource: vi.fn()
}))

const messageMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}))

vi.mock('@/api/user', () => ({
  updateUserInfo: apiMocks.updateUserInfo,
  extractUpdatedUser: apiMocks.extractUpdatedUser
}))

vi.mock('@/services/authSession', () => ({
  getStoredUserInfo: sessionMocks.getStoredUserInfo,
  getMetricsDatasetScopeLabel: sessionMocks.getMetricsDatasetScopeLabel,
  persistStoredUserInfo: sessionMocks.persistStoredUserInfo
}))

vi.mock('@/services/avatarCache', () => ({
  canCacheAvatarSource: avatarCacheMocks.canCacheAvatarSource,
  getCachedAvatarSource: avatarCacheMocks.getCachedAvatarSource,
  resolveCachedAvatarSource: avatarCacheMocks.resolveCachedAvatarSource
}))

vi.mock('@/shared/layout/PageHeader', () => ({
  default: defineComponent({
    name: 'StubPageHeader',
    props: ['title', 'subtitle'],
    setup(props) {
      return () => h('header', {}, [h('h1', {}, props.title), h('p', {}, props.subtitle)])
    }
  })
}))

vi.mock('@/shared/components/avatarCropUploader/AvatarCropUploader', () => ({
  default: defineComponent({
    name: 'StubAvatarCropUploader',
    props: ['userId', 'disabled'],
    setup(_, { slots }) {
      return () =>
        h('div', { 'data-component': 'avatar-uploader' }, slots.default?.({ open: vi.fn(), uploading: false }))
    }
  })
}))

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      name: `Stub${tag}`,
      props: ['class'],
      setup(props, { slots }) {
        return () => h(tag, { class: props.class }, slots.default?.())
      }
    })

  return {
    NAvatar: defineComponent({
      name: 'StubAvatar',
      props: ['src', 'class'],
      setup(props) {
        return () => h('span', { class: props.class, 'data-src': props.src || '' })
      }
    }),
    NButton: defineComponent({
      name: 'StubButton',
      props: ['loading', 'disabled'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () => h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.())
      }
    }),
    NCard: passthrough('section'),
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
      props: ['value', 'placeholder', 'disabled', 'maxlength', 'type'],
      emits: ['update:value'],
      setup(props, { emit }) {
        return () =>
          h(props.type === 'textarea' ? 'textarea' : 'input', {
            value: props.value,
            placeholder: props.placeholder,
            disabled: props.disabled,
            maxlength: props.maxlength,
            onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
          })
      }
    }),
    NTag: passthrough('span')
  }
})

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionMocks.getStoredUserInfo.mockReturnValue({
      userId: 'user-1',
      email: 'ops@example.com',
      nickName: 'Ops Admin',
      avatar: '/uploads/avatar.webp',
      isAdmin: true,
      status: 'active',
      client: 'desktop',
      source: 'email',
      timezone: 'UTC+8',
      locale: 'zh-CN',
      meta: {
        bio: 'Old bio',
        title: 'SRE',
        company: 'StarLight',
        location: 'Shanghai',
        website: 'https://starlight.example.com',
        preserved: true
      }
    })
    sessionMocks.getMetricsDatasetScopeLabel.mockReturnValue('Darwin 系统')
    avatarCacheMocks.canCacheAvatarSource.mockReturnValue(true)
    avatarCacheMocks.getCachedAvatarSource.mockReturnValue('data:image/webp;base64,cached-avatar')
    avatarCacheMocks.resolveCachedAvatarSource.mockResolvedValue('data:image/webp;base64,cached-avatar')
    apiMocks.updateUserInfo.mockResolvedValue({ user: { userId: 'user-1' } })
    window.$message = messageMock as unknown as typeof window.$message
  })

  it('saves expanded profile fields into user meta and local session', async () => {
    const wrapper = mount(ProfilePage)
    await flushPromises()

    expect(wrapper.text()).toContain('让这个账户更像“你”')
    expect(wrapper.find('.profile-page__avatar').attributes('data-src')).toBe('data:image/webp;base64,cached-avatar')

    const inputs = wrapper.findAll('input, textarea')
    await inputs
      .find((input) => input.attributes('placeholder') === '例如：SRE / 产品负责人 / 独立开发者')!
      .setValue('平台负责人')
    await inputs.find((input) => input.attributes('placeholder') === '你的团队或组织')!.setValue('Darwin Lab')
    await inputs.find((input) => input.attributes('placeholder') === '例如：上海 / Singapore')!.setValue('杭州')
    await inputs
      .find((input) => input.attributes('placeholder') === 'https://example.com')!
      .setValue('https://darwin.example.com')
    await inputs
      .find((input) => input.attributes('placeholder') === '用一句话介绍你自己，方便团队成员快速识别。')!
      .setValue('负责可观测性体验')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '保存资料')!
      .trigger('click')
    await flushPromises()

    expect(apiMocks.updateUserInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        nickname: 'Ops Admin',
        timezone: 'UTC+8',
        locale: 'zh-CN',
        meta: expect.objectContaining({
          bio: '负责可观测性体验',
          title: '平台负责人',
          company: 'Darwin Lab',
          location: '杭州',
          website: 'https://darwin.example.com',
          preserved: true
        })
      })
    )
    expect(sessionMocks.persistStoredUserInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({ title: '平台负责人' })
      })
    )
    expect(messageMock.success).toHaveBeenCalledWith('个人资料已更新')
  })
})
