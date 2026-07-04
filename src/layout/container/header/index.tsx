import { NAvatar, NBadge, NButton, NDivider, NEmpty, NIcon, NInput, NPopover, NSpin, NTag } from 'naive-ui'
import {
  AlertCircleOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  LogOutOutline,
  NotificationsOutline,
  OptionsOutline,
  PersonCircleOutline,
  PulseOutline,
  RefreshOutline,
  SearchOutline,
  SettingsOutline,
  TimeOutline,
  WarningOutline
} from '@vicons/ionicons5'
import type { Component } from 'vue'
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '@/api/auth'
import { fetchNotifications, resendNotification } from '@/api/alerts'
import AvatarCropUploader from '@/shared/components/avatarCropUploader/AvatarCropUploader'
import {
  USER_INFO_CHANGED_EVENT,
  clearStoredAuthSession,
  getMetricsDatasetScopeLabel,
  getStoredUserInfo,
  persistStoredUserInfo
} from '@/services/authSession'
import { canCacheAvatarSource, getCachedAvatarSource, resolveCachedAvatarSource } from '@/services/avatarCache'
import type { NotificationItem } from '@/types/monitor'
import type { UserInfoType } from '@/types/userInfo'
import {
  didResendNotificationSucceed,
  getNextRetryCount,
  rollbackRetryCount
} from '@/domains/alerts/notificationCenterModel'
import { clearClientNotificationBadge, clientNotificationUnreadCount } from '@/services/clientNotifications'
import './index.scss'

type SearchTarget = {
  label: string
  description: string
  route: string
  keywordHint: string
}

type HeaderNotification = NotificationItem & {
  key: string
  alertLevel: '' | 'critical' | 'warning' | 'info'
}

type StoredUserProfile = Partial<UserInfoType> & {
  nickname?: string
}

const isRenderableAvatar = (avatar?: string) =>
  Boolean(
    avatar &&
      (/^(https?:)?\/\//.test(avatar) ||
        avatar.startsWith('/') ||
        avatar.startsWith('data:') ||
        avatar.startsWith('blob:'))
  )

const searchTargets: SearchTarget[] = [
  {
    label: '服务目录',
    description: '按服务名称、实例或负责人搜索',
    route: '/home/services',
    keywordHint: 'service'
  },
  {
    label: '指标分析',
    description: '搜索 CPU、内存、QPS、延迟等指标',
    route: '/home/investigate/metrics',
    keywordHint: 'metric'
  },
  {
    label: '日志中心',
    description: '定位 error、traceId 或业务关键字',
    route: '/home/investigate/logs',
    keywordHint: 'log'
  },
  {
    label: '告警收件箱',
    description: '检索告警、通知和规则状态',
    route: '/home/alerts/inbox',
    keywordHint: 'alert'
  }
]

const formatRelativeTime = (raw: string | undefined): string => {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  const now = Date.now()
  const diff = now - date.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const normalizeNotification = (item: Record<string, unknown>, index: number): HeaderNotification => {
  const rawStatus = String(item.status || '')
  const alertLevel = String(item.type || '')
  return {
    key: String(item.key || item.id || `notification-${index}`),
    serviceId: typeof item.serviceId === 'string' ? item.serviceId : undefined,
    sendTime: formatRelativeTime(String(item.sentAt || item.sendTime || '')),
    ruleName: String(item.ruleName || item.type || '系统通知'),
    service: String(item.service || '系统'),
    channel: String(item.channel || 'unknown'),
    recipient: String(item.recipient || item.target || '-'),
    status:
      rawStatus === 'sent' || rawStatus === 'delivered'
        ? 'success'
        : rawStatus === 'success' || rawStatus === 'failed' || rawStatus === 'pending'
          ? rawStatus
          : 'unknown',
    alertLevel:
      alertLevel === 'critical'
        ? 'critical'
        : alertLevel === 'warning'
          ? 'warning'
          : alertLevel === 'info'
            ? 'info'
            : '',
    retryCount: typeof item.retryCount === 'number' ? item.retryCount : 0,
    content: String(item.content || '暂无通知内容'),
    errorMessage: typeof item.errorMessage === 'string' ? item.errorMessage : ''
  }
}

const statusConfig: Record<
  HeaderNotification['status'],
  { label: string; type: 'success' | 'error' | 'warning' | 'default'; icon: Component }
> = {
  success: { label: '成功', type: 'success', icon: CheckmarkCircleOutline },
  failed: { label: '失败', type: 'error', icon: CloseCircleOutline },
  pending: { label: '发送中', type: 'warning', icon: TimeOutline },
  unknown: { label: '未知', type: 'default', icon: AlertCircleOutline }
}

const alertLevelIcons: Record<string, Component> = {
  critical: PulseOutline,
  warning: WarningOutline,
  info: NotificationsOutline
}

export default defineComponent({
  name: 'ContainerHeader',
  setup() {
    const router = useRouter()
    const searchValue = ref('')
    const showUserPopover = ref(false)
    const showNotificationPopover = ref(false)
    const notificationLoading = ref(false)
    const notificationError = ref('')
    const resendingKey = ref('')
    const notifications = ref<HeaderNotification[]>([])
    const storedUser = ref<StoredUserProfile>(getStoredUserInfo() || {})
    const renderedAvatar = ref('')

    const userInfo = computed(() => {
      const stored = storedUser.value
      return {
        userId: stored.userId || '',
        name: stored.nickName || stored.nickname || stored.email || '星光用户',
        email: stored.email || '未绑定邮箱',
        avatar: isRenderableAvatar(stored.avatar) ? stored.avatar || '' : '',
        role: stored.isAdmin ? '管理员' : '普通用户',
        scopeLabel: getMetricsDatasetScopeLabel(stored),
        timezone: stored.timezone || 'UTC+8',
        locale: stored.locale || 'zh-CN'
      }
    })

    const pendingCount = computed(() => notifications.value.filter((item) => item.status === 'pending').length)
    const failedCount = computed(() => notifications.value.filter((item) => item.status === 'failed').length)
    const unreadCount = computed(() =>
      Math.max(pendingCount.value + failedCount.value, clientNotificationUnreadCount.value)
    )
    const recentNotifications = computed(() => notifications.value.slice(0, 5))
    const notificationSummaryText = computed(() => {
      if (notificationLoading.value) return '正在同步通知状态…'
      if (notificationError.value) return '通知状态暂不可用'
      if (unreadCount.value) return `${failedCount.value} 条失败，${pendingCount.value} 条发送中`
      if (notifications.value.length) return '最近通知状态正常'
      return '暂无通知记录'
    })

    const navigateTo = (path: string, query?: Record<string, string>) => {
      router.push(query ? { path, query } : path)
    }

    const handleSearch = () => {
      const keyword = searchValue.value.trim()
      if (!keyword) return

      const lowerKeyword = keyword.toLowerCase()
      if (lowerKeyword.includes('trace') || lowerKeyword.includes('span') || lowerKeyword.includes('链路')) {
        navigateTo('/home/investigate/traces', { keyword })
        return
      }
      if (
        lowerKeyword.includes('log') ||
        lowerKeyword.includes('error') ||
        lowerKeyword.includes('日志') ||
        lowerKeyword.includes('错误')
      ) {
        navigateTo('/home/investigate/logs', { keyword })
        return
      }
      if (lowerKeyword.includes('alert') || lowerKeyword.includes('告警') || lowerKeyword.includes('通知')) {
        navigateTo('/home/alerts/inbox', { keyword })
        return
      }
      if (
        lowerKeyword.includes('metric') ||
        lowerKeyword.includes('cpu') ||
        lowerKeyword.includes('memory') ||
        lowerKeyword.includes('指标') ||
        lowerKeyword.includes('内存')
      ) {
        navigateTo('/home/investigate/metrics', { keyword })
        return
      }
      navigateTo('/home/services', { keyword })
    }

    const handleSearchKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter') handleSearch()
    }

    const focusSearchInput = () => {
      const input = document.querySelector<HTMLInputElement>('.header-search input')
      input?.focus()
      input?.select()
    }

    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        focusSearchInput()
      }
    }

    const refreshStoredUser = (user?: StoredUserProfile | null) => {
      const nextUser = user || getStoredUserInfo() || {}
      if (import.meta.env.DEV) {
        console.info('[AvatarSync][header:refreshStoredUser]', {
          source: user ? 'event' : 'storage',
          previousAvatar: storedUser.value.avatar,
          nextAvatar: nextUser.avatar,
          userId: nextUser.userId
        })
      }
      storedUser.value = nextUser
    }

    const handleUserInfoChanged = (event: Event) => {
      refreshStoredUser((event as CustomEvent<StoredUserProfile>).detail)
    }

    const handleUserStorageChanged = (event: StorageEvent) => {
      if (event.key === 'user') refreshStoredUser()
    }

    const loadNotifications = async () => {
      notificationLoading.value = true
      notificationError.value = ''
      try {
        const res = await fetchNotifications()
        notifications.value = (res || []).map((item, index) =>
          normalizeNotification(item as Record<string, unknown>, index)
        )
      } catch (error) {
        console.error('Failed to load header notifications:', error)
        notificationError.value = '通知加载失败，请稍后重试。'
        notifications.value = []
      } finally {
        notificationLoading.value = false
      }
    }

    const handleResend = async (notification: HeaderNotification) => {
      const previousStatus = notification.status
      const previousRetryCount = notification.retryCount
      notification.status = 'pending'
      notification.retryCount = getNextRetryCount(notification.retryCount)
      resendingKey.value = notification.key
      try {
        const result = await resendNotification(notification.key)
        if (!didResendNotificationSucceed(result)) throw new Error('notification resend rejected')
        window.$message.success('通知已重新发送')
        await loadNotifications()
      } catch (error) {
        console.error('Failed to resend notification:', error)
        notification.status = previousStatus
        notification.retryCount = rollbackRetryCount(notification.retryCount, previousRetryCount)
        window.$message.error('通知重发失败')
      } finally {
        resendingKey.value = ''
      }
    }

    const handleLogout = async () => {
      try {
        await logout()
      } catch (error) {
        console.error('Logout request failed:', error)
      }
      clearStoredAuthSession()
      showUserPopover.value = false
      await router.replace('/login')
    }

    const openProfilePage = () => {
      showUserPopover.value = false
      navigateTo('/home/profile')
    }

    const handleAvatarUploaded = ({ avatar, user }: { avatar: string; user: StoredUserProfile }) => {
      const nextAvatar = user.avatar || avatar
      storedUser.value = { ...storedUser.value, ...user, avatar: nextAvatar }
      if (import.meta.env.DEV) {
        console.info('[AvatarSync][header:onUploaded]', {
          emittedAvatar: avatar,
          userAvatar: user.avatar,
          nextAvatar,
          storedAvatar: storedUser.value.avatar,
          user
        })
      }
      persistStoredUserInfo(storedUser.value)
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

    const renderSearchPanel = () => (
      <div class="header-search-panel">
        <div class="header-search-panel__title">快速搜索入口</div>
        <div class="header-search-panel__list">
          {searchTargets.map((item) => (
            <button
              key={item.route}
              type="button"
              class="header-search-target"
              onClick={() =>
                navigateTo(item.route, searchValue.value.trim() ? { keyword: searchValue.value.trim() } : undefined)
              }>
              <span>
                <strong>{item.label}</strong>
                <em>{item.description}</em>
              </span>
              <kbd>{item.keywordHint}</kbd>
            </button>
          ))}
        </div>
      </div>
    )

    const renderNotificationItem = (item: HeaderNotification) => {
      const config = statusConfig[item.status]
      const StatusIcon = config.icon
      const alertLevelConfig =
        item.alertLevel === 'critical'
          ? { type: 'error' as const, label: '严重' }
          : item.alertLevel === 'warning'
            ? { type: 'warning' as const, label: '警告' }
            : item.alertLevel === 'info'
              ? { type: 'info' as const, label: '提示' }
              : null
      const AlertIcon = alertLevelConfig ? alertLevelIcons[item.alertLevel] || alertLevelIcons.info : StatusIcon
      const iconLevel = alertLevelConfig ? item.alertLevel : item.status
      return (
        <div class="header-notification-item" key={item.key}>
          <div class={[`header-notification-item__status`, `is-${iconLevel}`]}>
            <NIcon size={16} component={AlertIcon} />
          </div>
          <button
            type="button"
            class="header-notification-item__content"
            onClick={() => navigateTo('/home/alert-notifications', { keyword: item.ruleName })}>
            <span class="header-notification-item__title">{item.ruleName}</span>
            <span class="header-notification-item__meta">
              {item.service} · {item.channel} · {item.sendTime}
            </span>
            <span class="header-notification-item__text">{item.errorMessage || item.content}</span>
          </button>
          <div class="header-notification-item__actions">
            {alertLevelConfig ? (
              <NTag size="small" bordered={false} type={alertLevelConfig.type}>
                {alertLevelConfig.label}
              </NTag>
            ) : (
              <NTag size="small" bordered={false} type={config.type}>
                {config.label}
              </NTag>
            )}
            {item.status === 'failed' ? (
              <NButton
                size="tiny"
                secondary
                type="warning"
                loading={resendingKey.value === item.key}
                onClick={() => handleResend(item)}>
                重发
              </NButton>
            ) : null}
          </div>
        </div>
      )
    }

    const renderNotificationPopover = () => (
      <div class="header-notification-panel">
        <div class="header-notification-panel__head">
          <div>
            <strong>消息通知</strong>
            <span>{notificationSummaryText.value}</span>
          </div>
          <NButton quaternary circle size="small" onClick={loadNotifications} loading={notificationLoading.value}>
            <NIcon size={16}>
              <RefreshOutline />
            </NIcon>
          </NButton>
        </div>
        <NDivider class="header-popover-divider" />
        {notificationLoading.value ? (
          <div class="header-notification-panel__loading">
            <NSpin size="small" />
            <span>正在加载通知…</span>
          </div>
        ) : notificationError.value ? (
          <NEmpty description={notificationError.value} class="header-notification-panel__empty">
            {{
              extra: () => (
                <NButton size="small" type="primary" secondary onClick={loadNotifications}>
                  重新加载
                </NButton>
              )
            }}
          </NEmpty>
        ) : recentNotifications.value.length ? (
          <div class="header-notification-panel__list">{recentNotifications.value.map(renderNotificationItem)}</div>
        ) : (
          <NEmpty description="暂无通知记录" class="header-notification-panel__empty" />
        )}
        <NDivider class="header-popover-divider" />
        <div class="header-notification-panel__footer">
          <NButton size="small" secondary onClick={() => navigateTo('/home/alerts/inbox')}>
            告警收件箱
          </NButton>
          <NButton size="small" type="primary" onClick={() => navigateTo('/home/alert-notifications')}>
            查看全部通知
          </NButton>
        </div>
      </div>
    )

    const renderUserPopover = () => (
      <div class="header-user-popover">
        <div class="header-user-card">
          <AvatarCropUploader
            userId={userInfo.value.userId}
            disabled={!userInfo.value.userId}
            onUploaded={handleAvatarUploaded}>
            {{
              default: ({ open, uploading }: { open: () => void; uploading: boolean }) => (
                <button
                  type="button"
                  class="header-user-card__avatar-action"
                  onClick={open}
                  disabled={uploading || !userInfo.value.userId}>
                  {renderedAvatar.value ? (
                    <NAvatar
                      key={renderedAvatar.value}
                      size={46}
                      round
                      class="header-user-card__avatar"
                      src={renderedAvatar.value}
                      renderFallback={() => (
                        <span class="header-user-card__avatar header-user-card__avatar-fallback">
                          {userInfo.value.name.charAt(0)}
                        </span>
                      )}
                    />
                  ) : (
                    <span key={userInfo.value.name} class="header-user-card__avatar header-user-card__avatar-fallback">
                      {userInfo.value.name.charAt(0)}
                    </span>
                  )}
                  <span>{uploading ? '上传中' : '更换'}</span>
                </button>
              )
            }}
          </AvatarCropUploader>
          <div class="header-user-card__main">
            <div class="header-user-card__name">{userInfo.value.name}</div>
            <div class="header-user-card__email">{userInfo.value.email}</div>
            <div class="header-user-card__tags">
              <NTag size="small" bordered={false} type="info">
                {userInfo.value.role}
              </NTag>
              <NTag size="small" bordered={false} type="success">
                {userInfo.value.scopeLabel}
              </NTag>
            </div>
          </div>
        </div>
        <NDivider class="header-popover-divider" />
        <div class="header-user-menu" role="menu">
          <button type="button" class="header-user-menu__item" onClick={openProfilePage}>
            <span class="header-user-menu__icon">
              <NIcon size={17}>
                <PersonCircleOutline />
              </NIcon>
            </span>
            <span class="header-user-menu__copy">
              <strong>编辑个人资料</strong>
              <em>修改昵称、时区与语言偏好</em>
            </span>
          </button>
          <button type="button" class="header-user-menu__item" onClick={() => navigateTo('/home/settings')}>
            <span class="header-user-menu__icon">
              <NIcon size={17}>
                <SettingsOutline />
              </NIcon>
            </span>
            <span class="header-user-menu__copy">
              <strong>应用设置</strong>
              <em>主题、窗口、登录与启动偏好</em>
            </span>
          </button>
          <button type="button" class="header-user-menu__item" onClick={() => navigateTo('/home/alert-notifications')}>
            <span class="header-user-menu__icon">
              <NIcon size={17}>
                <NotificationsOutline />
              </NIcon>
            </span>
            <span class="header-user-menu__copy">
              <strong>通知历史</strong>
              <em>查看告警通知投递和重试记录</em>
            </span>
          </button>
          <button type="button" class="header-user-menu__item" onClick={() => navigateTo('/home/alert-rules')}>
            <span class="header-user-menu__icon">
              <NIcon size={17}>
                <OptionsOutline />
              </NIcon>
            </span>
            <span class="header-user-menu__copy">
              <strong>告警规则</strong>
              <em>管理阈值、渠道与触发策略</em>
            </span>
          </button>
        </div>
        <NDivider class="header-popover-divider" />
        <button type="button" class="header-user-menu__item header-user-menu__item--danger" onClick={handleLogout}>
          <span class="header-user-menu__icon">
            <NIcon size={17}>
              <LogOutOutline />
            </NIcon>
          </span>
          <span class="header-user-menu__copy">
            <strong>退出登录</strong>
            <em>清除本地会话并返回登录页</em>
          </span>
        </button>
      </div>
    )

    onMounted(() => {
      window.addEventListener('keydown', handleGlobalShortcut)
      window.addEventListener(USER_INFO_CHANGED_EVENT, handleUserInfoChanged)
      window.addEventListener('storage', handleUserStorageChanged)
      loadNotifications()
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleGlobalShortcut)
      window.removeEventListener(USER_INFO_CHANGED_EVENT, handleUserInfoChanged)
      window.removeEventListener('storage', handleUserStorageChanged)
    })

    return () => (
      <div class="container-header" data-tauri-drag-region>
        <div class="header-balance-zone" data-tauri-drag-region />

        <div class="header-search no-drag">
          <NPopover trigger="click" placement="bottom-start" displayDirective="show">
            {{
              trigger: () => (
                <div class="header-search__box">
                  <NInput
                    value={searchValue.value}
                    placeholder="搜索服务、日志、链路、指标或告警…"
                    onUpdate:value={(value: string) => (searchValue.value = value)}
                    onKeydown={handleSearchKey}>
                    {{
                      prefix: () => (
                        <NIcon size={17} class="header-search__icon">
                          <SearchOutline />
                        </NIcon>
                      ),
                      suffix: () => <kbd class="header-search__kbd">⌘K</kbd>
                    }}
                  </NInput>
                </div>
              ),
              default: renderSearchPanel
            }}
          </NPopover>
        </div>

        <div class="header-actions no-drag">
          <NPopover
            trigger="click"
            placement="bottom-end"
            displayDirective="show"
            show={showNotificationPopover.value}
            onUpdateShow={(value) => {
              showNotificationPopover.value = value
              if (value) {
                clearClientNotificationBadge()
                loadNotifications()
              }
            }}>
            {{
              trigger: () => (
                <div class="header-notification-trigger">
                  <NBadge value={unreadCount.value || undefined} max={99} dot={unreadCount.value > 0}>
                    <NButton quaternary class="header-icon-button header-icon-button--square" aria-label="消息通知">
                      <NIcon size={19}>
                        <NotificationsOutline />
                      </NIcon>
                    </NButton>
                  </NBadge>
                </div>
              ),
              default: renderNotificationPopover
            }}
          </NPopover>

          <NPopover
            trigger="click"
            placement="bottom-end"
            show={showUserPopover.value}
            onUpdateShow={(value) => (showUserPopover.value = value)}
            displayDirective="show">
            {{
              trigger: () => (
                <button type="button" class="header-avatar-button" aria-label="用户信息">
                  {renderedAvatar.value ? (
                    <NAvatar
                      key={renderedAvatar.value}
                      size={30}
                      round
                      class="header-avatar-button__avatar"
                      src={renderedAvatar.value}
                      renderFallback={() => (
                        <span class="header-avatar-button__avatar header-avatar-button__avatar-fallback">
                          {userInfo.value.name.charAt(0)}
                        </span>
                      )}
                    />
                  ) : (
                    <span
                      key={userInfo.value.name}
                      class="header-avatar-button__avatar header-avatar-button__avatar-fallback">
                      {userInfo.value.name.charAt(0)}
                    </span>
                  )}
                </button>
              ),
              default: renderUserPopover
            }}
          </NPopover>
        </div>
      </div>
    )
  }
})
