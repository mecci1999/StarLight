import { h } from 'vue'
import {
  PhUser,
  PhMoon,
  PhQuestion,
  PhSignOut,
  PhPencilSimple,
  PhIdentificationCard,
  PhHardDrive,
  PhGear
} from '@phosphor-icons/vue'
import {
  MobileAvatar,
  MobileButton,
  MobileCard,
  MobileInput,
  MobileList,
  MobileListItem,
  MobileLoading,
  MobileProgress,
  MobileSelect,
  MobileSheet,
  MobileSwitch,
  MobileTag,
  MobileEmpty
} from '@/mobile/ui'
import {
  getStoredUserInfo,
  clearStoredAuthSession,
  persistStoredUserInfo,
  getMetricsDatasetScopeLabel
} from '@/services/authSession'
import { updateUserInfo, extractUpdatedUser } from '@/api/user'
import { useSettingStore } from '@/store/setting'
import { ThemeEnum } from '@/types/enums'
import AvatarCropUploader from '@/shared/components/avatarCropUploader/AvatarCropUploader'
import './MobileProfile.scss'

const TIMEZONE_OPTIONS = [
  { label: 'UTC-12:00', value: 'UTC-12' },
  { label: 'UTC-08:00 (太平洋)', value: 'UTC-8' },
  { label: 'UTC-05:00 (美东)', value: 'UTC-5' },
  { label: 'UTC+00:00 (伦敦)', value: 'UTC+0' },
  { label: 'UTC+01:00 (柏林)', value: 'UTC+1' },
  { label: 'UTC+03:00 (莫斯科)', value: 'UTC+3' },
  { label: 'UTC+05:30 (印度)', value: 'UTC+5.5' },
  { label: 'UTC+08:00 (北京)', value: 'UTC+8' },
  { label: 'UTC+09:00 (东京)', value: 'UTC+9' },
  { label: 'UTC+10:00 (悉尼)', value: 'UTC+10' }
]

const LOCALE_OPTIONS = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

function isRenderableAvatar(avatar?: string): boolean {
  if (!avatar) return false
  return (
    /^(https?:)?\/\//.test(avatar) || avatar.startsWith('/') || avatar.startsWith('data:') || avatar.startsWith('blob:')
  )
}

function parseRecord(value: unknown): Record<string, unknown> {
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

function readMetaText(meta: Record<string, unknown>, key: string): string {
  const value = meta[key]
  return typeof value === 'string' ? value : ''
}

function formatDateTime(value?: string) {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

export default defineComponent({
  name: 'MobileProfile',
  setup() {
    const router = useRouter()
    const message = useMessage()
    const settingStore = useSettingStore()
    const { themes } = storeToRefs(settingStore)
    const rawUser = getStoredUserInfo() || {}

    const showEditModal = ref(false)
    const saving = ref(false)
    const editForm = ref({
      nickName: (rawUser.nickName || rawUser.email || '') as string,
      bio: readMetaText(parseRecord(rawUser.meta), 'bio'),
      title: readMetaText(parseRecord(rawUser.meta), 'title'),
      company: readMetaText(parseRecord(rawUser.meta), 'company'),
      location: readMetaText(parseRecord(rawUser.meta), 'location'),
      website: readMetaText(parseRecord(rawUser.meta), 'website'),
      avatarUrl: (rawUser.avatar || '') as string,
      timezone: (rawUser.timezone || 'UTC+8') as string,
      locale: (rawUser.locale || 'zh-CN') as string
    })

    const userInfo = computed(() => ({
      nickName: rawUser.nickName || rawUser.email || '未登录',
      email: rawUser.email || '',
      avatar: rawUser.avatar || '',
      userId: rawUser.userId || '',
      isAdmin: rawUser.isAdmin || false,
      role: rawUser.isAdmin ? '管理员' : '普通用户',
      scopeLabel: getMetricsDatasetScopeLabel(rawUser),
      status: rawUser.status || 'active',
      source: rawUser.source || 'email',
      client: rawUser.client || 'mobile',
      lastActiveAt: formatDateTime(rawUser.lastActiveAt)
    }))

    const avatarUrl = computed(() => (isRenderableAvatar(userInfo.value.avatar) ? userInfo.value.avatar : undefined))
    const displayName = computed(() => userInfo.value.nickName || userInfo.value.email || '未登录')
    const displayEmail = computed(() => userInfo.value.email || '')

    const completionPercent = computed(() => {
      const items = [
        editForm.value.nickName,
        userInfo.value.avatar,
        editForm.value.bio,
        editForm.value.title,
        editForm.value.location
      ]
      return Math.round((items.filter(Boolean).length / items.length) * 100)
    })

    const isDark = computed(() => themes.value.content === ThemeEnum.DARK)
    const toggleTheme = (v: boolean) => {
      settingStore.setTheme(v ? ThemeEnum.DARK : ThemeEnum.LIGHT)
    }

    const openEditModal = () => {
      editForm.value = {
        nickName: (rawUser.nickName || rawUser.email || '') as string,
        bio: readMetaText(parseRecord(rawUser.meta), 'bio'),
        title: readMetaText(parseRecord(rawUser.meta), 'title'),
        company: readMetaText(parseRecord(rawUser.meta), 'company'),
        location: readMetaText(parseRecord(rawUser.meta), 'location'),
        website: readMetaText(parseRecord(rawUser.meta), 'website'),
        avatarUrl: (rawUser.avatar || '') as string,
        timezone: (rawUser.timezone || 'UTC+8') as string,
        locale: (rawUser.locale || 'zh-CN') as string
      }
      showEditModal.value = true
    }

    const closeEditModal = () => {
      showEditModal.value = false
    }

    const saveProfile = async () => {
      const userId = rawUser.userId
      if (!userId) {
        message.error('缺少用户信息，无法保存资料')
        return
      }
      const nickName = editForm.value.nickName.trim()
      if (!nickName) {
        message.error('昵称不能为空')
        return
      }
      saving.value = true
      try {
        const currentMeta = parseRecord(rawUser.meta)
        const nextMeta = {
          ...currentMeta,
          bio: editForm.value.bio.trim(),
          title: editForm.value.title.trim(),
          company: editForm.value.company.trim(),
          location: editForm.value.location.trim(),
          website: editForm.value.website.trim()
        }
        const avatar = editForm.value.avatarUrl.trim()
        const response = await updateUserInfo({
          userId,
          nickname: nickName,
          timezone: editForm.value.timezone,
          locale: editForm.value.locale,
          meta: nextMeta,
          ...(avatar ? { avatar } : {})
        })
        const updatedUser = extractUpdatedUser(response)
        persistStoredUserInfo({
          ...rawUser,
          ...updatedUser,
          nickName: updatedUser.nickName || nickName,
          timezone: editForm.value.timezone,
          locale: editForm.value.locale,
          meta: nextMeta,
          ...(avatar ? { avatar } : {})
        })
        // Refresh local reference
        Object.assign(rawUser, getStoredUserInfo() || {})
        message.success('个人资料已更新')
        closeEditModal()
      } finally {
        saving.value = false
      }
    }

    const handleLogout = () => {
      clearStoredAuthSession()
      router.push('/mobile/login')
    }

    const menuItems = [
      { icon: PhGear, label: '设置', onClick: () => router.push('/mobile/settings') },
      { icon: PhQuestion, label: '关于', onClick: () => window.$message.info('星光 Odyssey · 移动端 v0.1.0') }
    ]

    const adminMenuItems = [
      { icon: PhIdentificationCard, label: '计费管理', onClick: () => router.push('/mobile/billing') },
      { icon: PhHardDrive, label: '接入管理', onClick: () => router.push('/mobile/ingestion') },
      { icon: PhGear, label: '系统设置', onClick: () => router.push('/mobile/settings') }
    ]

    return () => (
      <div class="mobile-profile">
        <div class="mobile-profile__header">
          <MobileAvatar size={72} src={avatarUrl.value || ''} class="mobile-profile__avatar" alt={displayName.value}>
            {{
              fallback: () => h(PhUser, { size: 36 })
            }}
          </MobileAvatar>
          <div class="mobile-profile__name">{displayName.value}</div>
          <div class="mobile-profile__email">{displayEmail.value}</div>
          <MobileButton
            size="small"
            aria-label="编辑个人资料"
            class="mobile-profile__edit-btn"
            onClick={openEditModal}
            icon={() => h(PhPencilSimple)}
          />
        </div>

        {/* Profile Info Cards */}
        <div class="mobile-profile__info-cards">
          <div class="mobile-profile__info-row">
            <MobileTag type={userInfo.value.isAdmin ? 'warning' : 'info'} plain>
              {userInfo.value.role}
            </MobileTag>
            <MobileTag type="success" plain>
              {userInfo.value.scopeLabel}
            </MobileTag>
          </div>
          <div class="mobile-profile__completion">
            <div class="mobile-profile__completion-label">
              <span>资料完整度</span>
              <strong>{completionPercent.value}%</strong>
            </div>
            <MobileProgress
              percentage={completionPercent.value}
              color={completionPercent.value >= 80 ? 'var(--color-success-6)' : 'var(--color-warning-6)'}
              strokeWidth={18}
              showPivot={false}
            />
          </div>
          <div class="mobile-profile__meta-grid">
            <div class="mobile-profile__meta-item">
              <span class="mobile-profile__meta-label">账号状态</span>
              <MobileTag size="small" type={userInfo.value.status === 'active' ? 'success' : 'danger'} plain>
                {userInfo.value.status === 'active' ? '正常' : userInfo.value.status}
              </MobileTag>
            </div>
            <div class="mobile-profile__meta-item">
              <span class="mobile-profile__meta-label">注册来源</span>
              <span class="mobile-profile__meta-value">{userInfo.value.source}</span>
            </div>
            <div class="mobile-profile__meta-item">
              <span class="mobile-profile__meta-label">最后活跃</span>
              <span class="mobile-profile__meta-value">{userInfo.value.lastActiveAt}</span>
            </div>
            <div class="mobile-profile__meta-item">
              <span class="mobile-profile__meta-label">客户端</span>
              <span class="mobile-profile__meta-value">{userInfo.value.client}</span>
            </div>
          </div>
          <div class="mobile-profile__user-id">
            <span>用户 ID</span>
            <code>{userInfo.value.userId || '-'}</code>
          </div>
        </div>

        <MobileCard size="small" bordered={false} class="mobile-profile__card">
          <MobileList>
            <MobileListItem class="mobile-profile__list-item">
              {{
                icon: () => h(PhMoon, { size: 22, class: 'mobile-profile__menu-icon' }),
                extra: () => <MobileSwitch modelValue={isDark.value} onUpdate:modelValue={toggleTheme} />,
                default: () => <div class="mobile-profile__menu-label">深色模式</div>
              }}
            </MobileListItem>
            {menuItems.map((item) => (
              <MobileListItem key={item.label} class="mobile-profile__list-item" isLink onClick={item.onClick}>
                {{
                  icon: () => h(item.icon, { size: 22, class: 'mobile-profile__menu-icon' }),
                  default: () => <div class="mobile-profile__menu-label">{item.label}</div>
                }}
              </MobileListItem>
            ))}
          </MobileList>
        </MobileCard>

        {/* Admin Section */}
        {userInfo.value.isAdmin && (
          <MobileCard size="small" bordered={false} class="mobile-profile__card">
            <div class="mobile-profile__section-title">
              <span>管理</span>
            </div>
            <MobileList>
              {adminMenuItems.map((item) => (
                <MobileListItem key={item.label} class="mobile-profile__list-item" isLink onClick={item.onClick}>
                  {{
                    icon: () => h(item.icon, { size: 22, class: 'mobile-profile__menu-icon' }),
                    default: () => <div class="mobile-profile__menu-label">{item.label}</div>
                  }}
                </MobileListItem>
              ))}
            </MobileList>
          </MobileCard>
        )}

        <div class="mobile-profile__actions">
          <MobileButton
            block
            type="danger"
            size="large"
            onClick={handleLogout}
            class="mobile-profile__logout-btn"
            icon={() => h(PhSignOut)}>
            退出登录
          </MobileButton>
        </div>

        <div class="mobile-profile__version">星光 Odyssey v0.1.0</div>

        <MobileSheet
          show={showEditModal.value}
          onUpdate:show={(v: boolean) => {
            showEditModal.value = v
          }}
          title="编辑个人资料"
          position="bottom"
          class="mobile-profile__edit-modal">
          <div class="mobile-profile__edit-form">
            <div class="mobile-profile__form-section">
              <div class="mobile-profile__form-label">头像</div>
              <div class="mobile-profile__avatar-upload">
                <AvatarCropUploader
                  userId={userInfo.value.userId}
                  buttonLabel="上传新头像"
                  buttonSize="small"
                  onUploaded={({ avatar, user }: { avatar: string; user: any }) => {
                    editForm.value.avatarUrl = avatar
                    rawUser.avatar = avatar
                    persistStoredUserInfo(rawUser)
                  }}>
                  {{
                    default: ({ open, uploading }: { open: () => void; uploading: boolean }) => (
                      <div class="mobile-profile__avatar-preview" onClick={open}>
                        <MobileAvatar
                          size={64}
                          src={editForm.value.avatarUrl || userInfo.value.avatar || ''}
                          alt={displayName.value}>
                          {{
                            fallback: () => (
                              <span class="mobile-profile__avatar-text">{displayName.value.charAt(0)}</span>
                            )
                          }}
                        </MobileAvatar>
                        <div class="mobile-profile__avatar-overlay">
                          <span class="mobile-profile__avatar-overlay-text">
                            {uploading ? '上传中...' : '点击更换'}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                </AvatarCropUploader>
              </div>
            </div>

            <MobileInput
              label="头像链接"
              modelValue={editForm.value.avatarUrl}
              maxlength={512}
              placeholder="或直接输入头像图片 URL"
              onUpdate:modelValue={(value: string | number) => (editForm.value.avatarUrl = value as string)}
            />
            <MobileInput
              label="昵称"
              modelValue={editForm.value.nickName}
              maxlength={64}
              placeholder="请输入展示昵称"
              onUpdate:modelValue={(value: string | number) => (editForm.value.nickName = value as string)}
            />
            <MobileInput
              label="头衔"
              modelValue={editForm.value.title}
              maxlength={40}
              placeholder="例如：SRE / 产品负责人 / 独立开发者"
              onUpdate:modelValue={(value: string | number) => (editForm.value.title = value as string)}
            />
            <MobileInput
              label="公司 / 组织"
              modelValue={editForm.value.company}
              maxlength={64}
              placeholder="你的团队或组织"
              onUpdate:modelValue={(value: string | number) => (editForm.value.company = value as string)}
            />
            <MobileInput
              label="所在地"
              modelValue={editForm.value.location}
              maxlength={64}
              placeholder="例如：上海 / Singapore"
              onUpdate:modelValue={(value: string | number) => (editForm.value.location = value as string)}
            />
            <MobileInput
              label="个人链接"
              modelValue={editForm.value.website}
              maxlength={120}
              placeholder="https://example.com"
              onUpdate:modelValue={(value: string | number) => (editForm.value.website = value as string)}
            />
            <MobileSelect
              title="时区"
              modelValue={editForm.value.timezone}
              options={TIMEZONE_OPTIONS}
              placeholder="选择时区"
              onUpdate:modelValue={(value: string | number) => (editForm.value.timezone = value as string)}
            />
            <MobileSelect
              title="语言"
              modelValue={editForm.value.locale}
              options={LOCALE_OPTIONS}
              placeholder="选择语言"
              onUpdate:modelValue={(value: string | number) => (editForm.value.locale = value as string)}
            />
            <MobileInput
              label="个人简介"
              modelValue={editForm.value.bio}
              type="textarea"
              maxlength={160}
              placeholder="用一句话介绍你自己，方便团队成员快速识别。"
              onUpdate:modelValue={(value: string | number) => (editForm.value.bio = value as string)}
              autosize
            />
          </div>
          <div class="mobile-profile__edit-actions">
            <MobileButton onClick={closeEditModal} disabled={saving.value}>
              取消
            </MobileButton>
            <MobileButton type="primary" loading={saving.value} onClick={saveProfile}>
              保存
            </MobileButton>
          </div>
        </MobileSheet>
      </div>
    )
  }
})
