import { NAvatar, NButton, NCard, NForm, NFormItem, NInput, NTag } from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import PageHeader from '@/shared/layout/PageHeader'
import AvatarCropUploader from '@/shared/components/avatarCropUploader/AvatarCropUploader'
import { extractUpdatedUser, updateUserInfo } from '@/api/user'
import { getMetricsDatasetScopeLabel, getStoredUserInfo, persistStoredUserInfo } from '@/services/authSession'
import { canCacheAvatarSource, getCachedAvatarSource, resolveCachedAvatarSource } from '@/services/avatarCache'
import type { UserInfoType } from '@/types/userInfo'
import './ProfilePage.scss'

type StoredUserProfile = Partial<UserInfoType> & {
  nickname?: string
  meta?: Record<string, unknown> | string
  devices?: Record<string, unknown> | string
}

type ProfileMeta = {
  bio: string
  title: string
  company: string
  location: string
  website: string
}

const isRenderableAvatar = (avatar?: string) =>
  Boolean(
    avatar &&
      (/^(https?:)?\/\//.test(avatar) ||
        avatar.startsWith('/') ||
        avatar.startsWith('data:') ||
        avatar.startsWith('blob:'))
  )

const parseRecord = (value: unknown): Record<string, unknown> => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
    } catch {
      return {}
    }
  }
  return typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

const readMetaText = (meta: Record<string, unknown>, key: keyof ProfileMeta) => {
  const value = meta[key]
  return typeof value === 'string' ? value : ''
}

const buildProfileMeta = (user: StoredUserProfile): ProfileMeta => {
  const meta = parseRecord(user.meta)
  return {
    bio: readMetaText(meta, 'bio'),
    title: readMetaText(meta, 'title'),
    company: readMetaText(meta, 'company'),
    location: readMetaText(meta, 'location'),
    website: readMetaText(meta, 'website')
  }
}

const formatDateTime = (value?: string) => {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

export default defineComponent({
  name: 'ProfilePage',
  setup() {
    const saving = ref(false)
    const storedUser = ref<StoredUserProfile>(getStoredUserInfo() || {})
    const renderedAvatar = ref('')
    const initialMeta = buildProfileMeta(storedUser.value)
    const form = ref({
      nickName: storedUser.value.nickName || storedUser.value.nickname || storedUser.value.email || '',
      timezone: storedUser.value.timezone || 'UTC+8',
      locale: storedUser.value.locale || 'zh-CN',
      ...initialMeta
    })

    const userInfo = computed(() => ({
      userId: storedUser.value.userId || '',
      name: storedUser.value.nickName || storedUser.value.nickname || storedUser.value.email || '星光用户',
      email: storedUser.value.email || '未绑定邮箱',
      avatar: isRenderableAvatar(storedUser.value.avatar) ? storedUser.value.avatar || '' : '',
      role: storedUser.value.isAdmin ? '管理员' : '普通用户',
      scopeLabel: getMetricsDatasetScopeLabel(storedUser.value),
      status: storedUser.value.status || 'active',
      source: storedUser.value.source || 'email',
      client: storedUser.value.client || 'desktop',
      lastActiveAt: formatDateTime(storedUser.value.lastActiveAt)
    }))

    const deviceCount = computed(() => Object.keys(parseRecord(storedUser.value.devices)).length)
    const completionItems = computed(() => [
      form.value.nickName,
      renderedAvatar.value,
      form.value.bio,
      form.value.title,
      form.value.location
    ])
    const completionPercent = computed(() =>
      Math.round((completionItems.value.filter(Boolean).length / completionItems.value.length) * 100)
    )
    const profileMeta = computed(() => parseRecord(storedUser.value.meta))

    const persistProfile = (patch: StoredUserProfile) => {
      storedUser.value = { ...storedUser.value, ...patch }
      if (import.meta.env.DEV) {
        console.info('[AvatarSync][profile:persistProfile]', {
          patchAvatar: patch.avatar,
          nextAvatar: storedUser.value.avatar,
          userId: storedUser.value.userId
        })
      }
      persistStoredUserInfo(storedUser.value)
    }

    const saveProfile = async () => {
      const userId = userInfo.value.userId
      const nickName = form.value.nickName.trim()
      const timezone = form.value.timezone.trim()
      const locale = form.value.locale.trim()
      const nextMeta = {
        ...profileMeta.value,
        bio: form.value.bio.trim(),
        title: form.value.title.trim(),
        company: form.value.company.trim(),
        location: form.value.location.trim(),
        website: form.value.website.trim()
      }
      if (!userId) {
        window.$message.error('缺少用户信息，无法保存资料')
        return
      }
      if (!nickName) {
        window.$message.error('昵称不能为空')
        return
      }
      saving.value = true
      try {
        const response = await updateUserInfo({ userId, nickname: nickName, timezone, locale, meta: nextMeta })
        const updatedUser = extractUpdatedUser(response)
        persistProfile({
          ...updatedUser,
          nickName,
          nickname: updatedUser.nickName || updatedUser.nickname || nickName,
          timezone,
          locale,
          meta: nextMeta
        })
        window.$message.success('个人资料已更新')
      } finally {
        saving.value = false
      }
    }

    const resetProfileForm = () => {
      const nextMeta = buildProfileMeta(storedUser.value)
      form.value = {
        nickName: storedUser.value.nickName || storedUser.value.nickname || storedUser.value.email || '',
        timezone: storedUser.value.timezone || 'UTC+8',
        locale: storedUser.value.locale || 'zh-CN',
        ...nextMeta
      }
      window.$message.success('已恢复为上次保存的资料')
    }

    const handleAvatarUploaded = ({ avatar, user }: { avatar: string; user: StoredUserProfile }) => {
      const nextAvatar = user.avatar || avatar
      if (import.meta.env.DEV) {
        console.info('[AvatarSync][profile:onUploaded]', {
          emittedAvatar: avatar,
          userAvatar: user.avatar,
          nextAvatar,
          user
        })
      }
      persistProfile({ ...user, avatar: nextAvatar })
    }

    watch(
      () => userInfo.value.avatar,
      (avatar) => {
        if (!avatar) {
          renderedAvatar.value = ''
          return
        }
        const cachedAvatar = getCachedAvatarSource(avatar)
        renderedAvatar.value = cachedAvatar || (canCacheAvatarSource(avatar) ? '' : avatar)
        void resolveCachedAvatarSource(avatar).then((cachedAvatar) => {
          if (userInfo.value.avatar === avatar) renderedAvatar.value = cachedAvatar
        })
      },
      { immediate: true }
    )

    return () => (
      <div class="profile-page">
        <PageHeader title="个人资料" subtitle="管理你的头像、展示昵称和本地化偏好。" />

        <div class="profile-page__shell">
          <aside class="profile-page__aside">
            <NCard bordered={false} class="profile-page__identity-card">
              <div class="profile-page__identity-glow" />
              <AvatarCropUploader
                userId={userInfo.value.userId}
                disabled={!userInfo.value.userId}
                onUploaded={handleAvatarUploaded}>
                {{
                  default: ({ open, uploading }: { open: () => void; uploading: boolean }) => (
                    <>
                      <button
                        type="button"
                        class="profile-page__avatar-action"
                        onClick={open}
                        disabled={uploading || !userInfo.value.userId}>
                        <span class="profile-page__avatar-frame">
                          {renderedAvatar.value ? (
                            <NAvatar
                              key={renderedAvatar.value}
                              class="profile-page__avatar"
                              size={92}
                              round
                              src={renderedAvatar.value}
                              renderFallback={() => (
                                <span class="profile-page__avatar profile-page__avatar-fallback profile-page__avatar-fallback--large">
                                  {userInfo.value.name.charAt(0)}
                                </span>
                              )}
                            />
                          ) : (
                            <span
                              key={userInfo.value.name}
                              class="profile-page__avatar profile-page__avatar-fallback profile-page__avatar-fallback--large">
                              {userInfo.value.name.charAt(0)}
                            </span>
                          )}
                          {/* <span class="profile-page__avatar-status" aria-hidden="true" /> */}
                        </span>
                        <span class="profile-page__avatar-label">{uploading ? '上传中…' : '更换头像'}</span>
                      </button>
                      <div class="profile-page__avatar-controls">
                        <NButton
                          size="small"
                          type="primary"
                          secondary
                          loading={uploading}
                          disabled={!userInfo.value.userId}
                          onClick={open}>
                          上传新头像
                        </NButton>
                        <p>支持 10MB 内 PNG、JPG、WebP，保存前会自动压缩并裁剪。</p>
                      </div>
                    </>
                  )
                }}
              </AvatarCropUploader>
              <strong>{userInfo.value.name}</strong>
              <small>{form.value.title || '还没有设置个人头衔'}</small>
              <em>{userInfo.value.email}</em>
              <div class="profile-page__tags">
                <NTag bordered={false} type="info">
                  {userInfo.value.role}
                </NTag>
                <NTag bordered={false} type="success">
                  {userInfo.value.scopeLabel}
                </NTag>
              </div>
              <div class="profile-page__completion">
                <div>
                  <span>资料完整度</span>
                  <strong>{completionPercent.value}%</strong>
                </div>
                <i style={{ width: `${completionPercent.value}%` }} />
              </div>
              <div class="profile-page__identity-meta">
                <span>设备 {deviceCount.value || 1}</span>
                <span>{userInfo.value.client}</span>
                <span>{userInfo.value.status === 'active' ? '状态正常' : userInfo.value.status}</span>
              </div>
            </NCard>
          </aside>

          <main class="profile-page__content">
            <section class="profile-page__hero-card">
              <div>
                <span>Account Center</span>
                <h2>让这个账户更像“你”</h2>
                <p>补充展示资料、联系方式和本地化偏好，后续告警、协作和个人空间都可以复用这些信息。</p>
              </div>
              <div class="profile-page__hero-stats">
                <strong>{completionPercent.value}%</strong>
                <em>资料完整度</em>
              </div>
            </section>

            <NCard bordered={false} class="profile-page__card">
              <div class="profile-page__card-head">
                <span>Profile</span>
                <h2>公开展示资料</h2>
                <p>这些信息会用于客户端头像菜单、个人资料卡和后续协作场景。</p>
              </div>
              <div class="profile-page__avatar-preview">
                <span class="profile-page__avatar-preview-frame">
                  {renderedAvatar.value ? (
                    <NAvatar
                      key={renderedAvatar.value}
                      class="profile-page__avatar profile-page__avatar--preview"
                      size={72}
                      round
                      src={renderedAvatar.value}
                      renderFallback={() => (
                        <span class="profile-page__avatar profile-page__avatar-fallback profile-page__avatar-fallback--preview">
                          {userInfo.value.name.charAt(0)}
                        </span>
                      )}
                    />
                  ) : (
                    <span
                      key={userInfo.value.name}
                      class="profile-page__avatar profile-page__avatar-fallback profile-page__avatar-fallback--preview">
                      {userInfo.value.name.charAt(0)}
                    </span>
                  )}
                </span>
                <div>
                  <strong>当前头像</strong>
                  <p>
                    {userInfo.value.avatar
                      ? '头像已同步到本地会话，可在右上角菜单查看。'
                      : '还没有设置头像，上传后会在这里预览。'}
                  </p>
                </div>
              </div>
              <NForm labelPlacement="top" class="profile-page__form">
                <NFormItem label="昵称">
                  <NInput
                    value={form.value.nickName}
                    maxlength={64}
                    placeholder="请输入展示昵称"
                    onUpdate:value={(value: string) => (form.value.nickName = value)}
                  />
                </NFormItem>
                <NFormItem label="个人头衔">
                  <NInput
                    value={form.value.title}
                    maxlength={40}
                    placeholder="例如：SRE / 产品负责人 / 独立开发者"
                    onUpdate:value={(value: string) => (form.value.title = value)}
                  />
                </NFormItem>
                <NFormItem label="组织 / 公司">
                  <NInput
                    value={form.value.company}
                    maxlength={64}
                    placeholder="你的团队或组织"
                    onUpdate:value={(value: string) => (form.value.company = value)}
                  />
                </NFormItem>
                <NFormItem label="所在地">
                  <NInput
                    value={form.value.location}
                    maxlength={64}
                    placeholder="例如：上海 / Singapore"
                    onUpdate:value={(value: string) => (form.value.location = value)}
                  />
                </NFormItem>
                <NFormItem label="个人链接">
                  <NInput
                    value={form.value.website}
                    maxlength={120}
                    placeholder="https://example.com"
                    onUpdate:value={(value: string) => (form.value.website = value)}
                  />
                </NFormItem>
                <NFormItem label="个人简介">
                  <NInput
                    value={form.value.bio}
                    type="textarea"
                    maxlength={160}
                    placeholder="用一句话介绍你自己，方便团队成员快速识别。"
                    onUpdate:value={(value: string) => (form.value.bio = value)}
                  />
                </NFormItem>
              </NForm>
            </NCard>

            <NCard bordered={false} class="profile-page__card">
              <div class="profile-page__card-head">
                <span>Preferences</span>
                <h2>偏好与可达性</h2>
                <p>让客户端按你的地区、语言和账号状态展示更准确的信息。</p>
              </div>
              <NForm labelPlacement="top" class="profile-page__form profile-page__form--compact">
                <NFormItem label="登录邮箱">
                  <NInput value={userInfo.value.email} disabled placeholder="邮箱暂不支持在客户端修改" />
                </NFormItem>
                <NFormItem label="时区">
                  <NInput
                    value={form.value.timezone}
                    placeholder="UTC+8"
                    onUpdate:value={(value: string) => (form.value.timezone = value)}
                  />
                </NFormItem>
                <NFormItem label="语言">
                  <NInput
                    value={form.value.locale}
                    placeholder="zh-CN"
                    onUpdate:value={(value: string) => (form.value.locale = value)}
                  />
                </NFormItem>
              </NForm>
              <div class="profile-page__account-grid">
                <div>
                  <span>用户 ID</span>
                  <strong>{userInfo.value.userId || '-'}</strong>
                </div>
                <div>
                  <span>注册来源</span>
                  <strong>{userInfo.value.source}</strong>
                </div>
                <div>
                  <span>最近活跃</span>
                  <strong>{userInfo.value.lastActiveAt}</strong>
                </div>
                <div>
                  <span>客户端</span>
                  <strong>{userInfo.value.client}</strong>
                </div>
              </div>
              <div class="profile-page__actions">
                <NButton secondary disabled={saving.value} onClick={resetProfileForm}>
                  恢复修改
                </NButton>
                <NButton type="primary" loading={saving.value} onClick={saveProfile}>
                  保存资料
                </NButton>
              </div>
            </NCard>
          </main>
        </div>
      </div>
    )
  }
})
