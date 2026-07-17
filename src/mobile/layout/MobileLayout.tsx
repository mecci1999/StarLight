import { RouterView } from 'vue-router'
import { NDrawer, NDrawerContent, NAvatar, NDivider, NBadge } from 'naive-ui'
import { PhSquaresFour, PhChartBar, PhStack, PhBell, PhUser, PhGear, PhSignOut } from '@phosphor-icons/vue'
import { getStoredUserInfo } from '@/services/authSession'
import { fetchOverviewSummary } from '@/api'
import { provide, type InjectionKey, type Ref } from 'vue'
import './MobileLayout.scss'

export const DRAWER_OPEN_KEY: InjectionKey<Ref<boolean>> = Symbol('drawerOpen')

export function useDrawerToggle() {
  const drawerOpen = inject(DRAWER_OPEN_KEY)
  return () => {
    drawerOpen!.value = !drawerOpen!.value
  }
}

const profileItems = [
  { label: '个人资料', icon: PhUser, path: '/mobile/profile' },
  { label: '设置', icon: PhGear, path: '/mobile/settings' }
]

export default defineComponent({
  name: 'MobileLayout',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const drawerOpen = ref(false)
    const userInfo = ref(getStoredUserInfo() || {})

    provide(DRAWER_OPEN_KEY, drawerOpen)
    const displayName = computed(() => userInfo.value.nickName || userInfo.value.email || '星光用户')
    const activeAlertCount = ref(0)

    onMounted(() => {
      fetchOverviewSummary({ scope: 'system' })
        .then((res: any) => {
          activeAlertCount.value = res?.totals?.activeIncidents || 0
        })
        .catch(() => {})
    })

    const tabs = [
      { label: '看板', icon: PhSquaresFour, path: '/mobile/overview-v2' },
      { label: '实时', icon: PhChartBar, path: '/mobile/realtime-monitor' },
      { label: '服务', icon: PhStack, path: '/mobile/services-v2' },
      { label: '告警', icon: PhBell, path: '/mobile/alerts-inbox' }
    ]

    const isActive = (path: string) => {
      if (path === '/mobile/alerts-inbox') return route.path.startsWith('/mobile/alerts') || route.path === path
      if (path === '/mobile/services-v2')
        return (
          route.path === path ||
          route.path.startsWith('/mobile/service-detail') ||
          route.path.startsWith('/mobile/topology') ||
          route.path.startsWith('/mobile/instance-monitor')
        )
      if (path === '/mobile/overview-v2')
        return (
          route.path === path ||
          route.path.startsWith('/mobile/log-center') ||
          route.path.startsWith('/mobile/exception-analysis') ||
          route.path.startsWith('/mobile/trace-explorer') ||
          route.path.startsWith('/mobile/metrics-explorer')
        )
      return route.path === path || route.path.startsWith(path + '/')
    }

    const toggleDrawer = () => {
      drawerOpen.value = !drawerOpen.value
    }

    const navigateTo = (path: string) => {
      router.push(path)
      drawerOpen.value = false
    }

    const handleLogout = () => {
      drawerOpen.value = false
      router.replace('/mobile/login')
    }

    return () => (
      <div class="mobile-layout">
        <main class="mobile-layout__content">
          <RouterView />
        </main>

        {/* Bottom tab bar — 4 tabs + avatar */}
        <nav class="mobile-layout__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              class={['mobile-layout__tab', isActive(tab.path) && 'mobile-layout__tab--active']}
              onClick={() => router.push(tab.path)}>
              {tab.path === '/mobile/alerts-inbox' ? (
                <NBadge value={activeAlertCount.value || undefined} max={99}>
                  <tab.icon size={24} />
                </NBadge>
              ) : (
                <tab.icon size={24} />
              )}
              <span class="mobile-layout__tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <NDrawer
          show={drawerOpen.value}
          onUpdate:show={(v: boolean) => (drawerOpen.value = v)}
          width={280}
          placement="left">
          <NDrawerContent title="个人中心" class="mobile-drawer">
            <div class="mobile-drawer__user" onClick={() => navigateTo('/mobile/profile')}>
              <NAvatar size={44} round src={userInfo.value.avatar || undefined}>
                {{ fallback: () => <span class="mobile-drawer__avatar-fallback">{displayName.value.charAt(0)}</span> }}
              </NAvatar>
              <div class="mobile-drawer__user-info">
                <div class="mobile-drawer__user-name">{displayName.value}</div>
                <div class="mobile-drawer__user-email">{userInfo.value.email || '未绑定'}</div>
              </div>
            </div>
            <NDivider />
            <div class="mobile-drawer__menu">
              {profileItems.map((item) => (
                <button
                  key={item.path}
                  class={['mobile-drawer__menu-item', route.path === item.path && 'mobile-drawer__menu-item--active']}
                  onClick={() => navigateTo(item.path)}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
              <button class="mobile-drawer__menu-item mobile-drawer__menu-item--danger" onClick={handleLogout}>
                <PhSignOut size={20} />
                <span>退出登录</span>
              </button>
            </div>
          </NDrawerContent>
        </NDrawer>
      </div>
    )
  }
})
