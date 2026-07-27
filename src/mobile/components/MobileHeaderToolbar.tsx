import { Badge, Field, Image } from 'vant'
import { PhMagnifyingGlass, PhBell, PhScan } from '@phosphor-icons/vue'
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

    const handleOpenNotifications = () => {
      router.push('/mobile/notifications')
    }

    return () => (
      <div class="mobile-header-toolbar">
        <button
          type="button"
          class="mobile-header-toolbar__avatar-btn"
          onClick={toggleDrawer}
          aria-label="打开个人中心">
          {avatarSrc.value ? (
            <Image width="32" height="32" fit="cover" src={avatarSrc.value} round alt="用户头像" />
          ) : (
            <span class="mobile-header-toolbar__avatar-fallback" aria-hidden="true">
              {avatarFallback.value}
            </span>
          )}
        </button>

        <div class="mobile-header-toolbar__search">
          <Field
            modelValue={searchValue.value}
            placeholder="搜索服务、日志…"
            clearable
            onUpdate:modelValue={(value: string | number) => (searchValue.value = String(value))}
            onKeypress={handleSearchKey}
            aria-label="搜索服务、日志">
            {{ leftIcon: () => <PhMagnifyingGlass size={16} aria-hidden="true" /> }}
          </Field>
        </div>

        <div class="mobile-header-toolbar__actions">
          <button
            type="button"
            class="mobile-header-toolbar__action"
            onClick={handleOpenNotifications}
            aria-label={
              clientNotificationUnreadCount.value > 0
                ? `消息通知，有${clientNotificationUnreadCount.value}条未读`
                : '消息通知'
            }>
            <Badge
              content={clientNotificationUnreadCount.value || undefined}
              max={99}
              dot={clientNotificationUnreadCount.value > 0}>
              <PhBell size={20} aria-hidden="true" />
            </Badge>
          </button>

          <button type="button" class="mobile-header-toolbar__action" onClick={handleOpenScan} aria-label="扫一扫">
            <PhScan size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }
})
