import { NAvatar, NBadge, NButton, NIcon, NInput, NPopover } from 'naive-ui'
import { PhMagnifyingGlass, PhBell, PhScan, PhUser, PhGear, PhSignOut } from '@phosphor-icons/vue'
import { useRouter } from 'vue-router'
import { getStoredUserInfo } from '@/services/authSession'
import { clientNotificationUnreadCount } from '@/services/clientNotifications'
import { useDrawerToggle } from '@/mobile/layout/MobileLayout'
import type { UserInfoType } from '@/types/userInfo'
import './MobileHeaderToolbar.scss'

export default defineComponent({
  name: 'MobileHeaderToolbar',
  setup() {
    const router = useRouter()
    const toggleDrawer = useDrawerToggle()
    const searchValue = ref('')
    const userInfo = ref<Partial<UserInfoType>>(getStoredUserInfo() || {})

    const displayName = computed(() => userInfo.value.nickName || userInfo.value.email || '星光用户')
    const avatarSrc = computed(() => userInfo.value.avatar || '')
    const avatarFallback = computed(() => displayName.value.charAt(0))

    const handleSearch = () => {
      const kw = searchValue.value.trim()
      if (!kw) return
      const lower = kw.toLowerCase()
      if (/trace|span|链路/.test(lower)) {
        router.push({ path: '/mobile/trace-explorer', query: { keyword: kw } })
      } else if (/log|error|日志|错误/.test(lower)) {
        router.push({ path: '/mobile/log-center', query: { keyword: kw } })
      } else if (/alert|告警|通知/.test(lower)) {
        router.push({ path: '/mobile/alerts-inbox', query: { keyword: kw } })
      } else if (/metric|cpu|memory|指标|内存/.test(lower)) {
        router.push({ path: '/mobile/metrics-explorer', query: { keyword: kw } })
      } else {
        router.push({ path: '/mobile/services-v2', query: { keyword: kw } })
      }
    }

    const handleSearchKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch()
    }

    const handleOpenScan = () => {
      router.push('/mobile/scan-login')
    }

    const handleOpenProfile = () => {
      router.push('/mobile/profile')
    }

    const handleOpenNotifications = () => {
      router.push('/mobile/notifications')
    }

    const handleOpenSettings = () => {
      router.push('/mobile/settings')
    }

    const handleLogout = () => {
      router.replace('/mobile/login')
    }

    return () => (
      <div class="mobile-header-toolbar">
        <button type="button" class="mobile-header-toolbar__avatar-btn" onClick={toggleDrawer}>
          {avatarSrc.value ? (
            <NAvatar size={32} round src={avatarSrc.value} />
          ) : (
            <span class="mobile-header-toolbar__avatar-fallback">{avatarFallback.value}</span>
          )}
        </button>

        <div class="mobile-header-toolbar__search">
          <NInput
            size="small"
            value={searchValue.value}
            placeholder="搜索服务、日志…"
            onUpdate:value={(v: string) => (searchValue.value = v)}
            onKeydown={handleSearchKey}
            clearable>
            {{
              prefix: () => (
                <NIcon size={16}>
                  <PhMagnifyingGlass />
                </NIcon>
              )
            }}
          </NInput>
        </div>

        <div class="mobile-header-toolbar__actions">
          <NButton quaternary circle size="small" onClick={handleOpenNotifications} aria-label="消息通知">
            <NBadge
              value={clientNotificationUnreadCount.value || undefined}
              max={99}
              dot={clientNotificationUnreadCount.value > 0}>
              <NIcon size={20}>
                <PhBell />
              </NIcon>
            </NBadge>
          </NButton>

          <NButton quaternary circle size="small" onClick={handleOpenScan} aria-label="扫一扫">
            <NIcon size={20}>
              <PhScan />
            </NIcon>
          </NButton>
        </div>
      </div>
    )
  }
})
