import { RouterView } from 'vue-router'
import { Badge, Image, Popup } from 'vant'
import { PhSquaresFour, PhChartBar, PhStack, PhBell, PhUser, PhGear, PhSignOut } from '@phosphor-icons/vue'
import { getPreferredMetricsDatasetScope, getStoredUserInfo } from '@/services/authSession'
import { fetchAlerts } from '@/api/alerts'
import { useTimeStore } from '@/store/useTimeStore'
import type { MetricsDatasetScope } from '@/api/metrics'
import { h, KeepAlive, onErrorCaptured, provide, inject, type Component, type InjectionKey, type Ref } from 'vue'
import MobileVantProvider from '@/mobile/providers/MobileVantProvider'
import './MobileLayout.scss'

export const DRAWER_OPEN_KEY: InjectionKey<Ref<boolean>> = Symbol('drawerOpen')
export const MOBILE_ALERT_BADGE_REFRESH_KEY: InjectionKey<() => Promise<void>> = Symbol('mobileAlertBadgeRefresh')

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
    const routeContentError = ref(false)
    const userInfo = ref(getStoredUserInfo() || {})
    const timeStore = useTimeStore()

    provide(DRAWER_OPEN_KEY, drawerOpen)
    const displayName = computed(() => userInfo.value.nickName || userInfo.value.email || '星光用户')
    const activeAlertCount = ref(0)
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())
    let badgeRequestId = 0

    const refreshActiveAlertCount = async () => {
      const requestId = ++badgeRequestId
      try {
        const alerts = await fetchAlerts({
          scope: datasetScope.value,
          startTime: timeStore.startTime,
          endTime: timeStore.endTime
        })
        if (requestId === badgeRequestId) {
          activeAlertCount.value = alerts.filter((alert) => alert.status === 'active').length
        }
      } catch (error) {
        console.error('Failed to refresh mobile alert badge:', error)
      }
    }

    provide(MOBILE_ALERT_BADGE_REFRESH_KEY, refreshActiveAlertCount)

    onMounted(refreshActiveAlertCount)

    watch(() => [timeStore.startTime, timeStore.endTime], refreshActiveAlertCount)
    watch(
      () => route.fullPath,
      () => {
        routeContentError.value = false
      }
    )

    onErrorCaptured((error) => {
      console.error('Failed to render mobile route content:', error)
      routeContentError.value = true
      return false
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

    const navigateTo = (path: string) => {
      router.replace(path)
      drawerOpen.value = false
    }

    const handleLogout = () => {
      drawerOpen.value = false
      router.replace('/mobile/login')
    }

    return () => (
      <MobileVantProvider>
        <div class="mobile-layout">
          <main class="mobile-layout__content">
            {routeContentError.value ? (
              <section class="mobile-layout__content-error" role="alert">
                <h1>页面暂时无法显示</h1>
                <p>请切换到其他标签页后重试。</p>
              </section>
            ) : (
              h(RouterView, null, {
                default: ({ Component }: { Component: Component | undefined }) =>
                  Component
                    ? h(KeepAlive, null, {
                        default: () => h(Component)
                      })
                    : null
              })
            )}
          </main>

          {/* Bottom tab bar — 4 tabs + avatar */}
          <nav class="mobile-layout__tabs">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                class={['mobile-layout__tab', isActive(tab.path) && 'mobile-layout__tab--active']}
                aria-label={tab.label}
                aria-current={isActive(tab.path) ? 'page' : undefined}
                onClick={() => router.replace(tab.path)}>
                {tab.path === '/mobile/alerts-inbox' ? (
                  <Badge content={activeAlertCount.value || undefined} max={99} class="mobile-layout__tab-badge">
                    <tab.icon size={24} />
                  </Badge>
                ) : (
                  <tab.icon size={24} />
                )}
                <span class="mobile-layout__tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>

          <Popup
            show={drawerOpen.value}
            onUpdate:show={(show: boolean) => (drawerOpen.value = show)}
            position="left"
            class="mobile-drawer-popup"
            closeable
            closeIcon="cross"
            aria-label="个人中心">
            {{
              default: () => (
                <aside class="mobile-drawer" aria-label="个人中心导航">
                  <header class="mobile-drawer__header">
                    <h2 class="mobile-drawer__title">个人中心</h2>
                  </header>
                  <div class="mobile-drawer__content">
                    <button
                      type="button"
                      class="mobile-drawer__user"
                      onClick={() => navigateTo('/mobile/profile')}
                      aria-label={`打开${displayName.value}的个人资料`}>
                      {userInfo.value.avatar ? (
                        <Image
                          width="44"
                          height="44"
                          fit="cover"
                          src={userInfo.value.avatar}
                          class="mobile-drawer__avatar"
                          round
                          alt="用户头像"
                        />
                      ) : (
                        <span class="mobile-drawer__avatar-fallback" aria-hidden="true">
                          {displayName.value.charAt(0)}
                        </span>
                      )}
                      <span class="mobile-drawer__user-info">
                        <span class="mobile-drawer__user-name">{displayName.value}</span>
                        <span class="mobile-drawer__user-email">{userInfo.value.email || '未绑定'}</span>
                      </span>
                    </button>
                    <div class="mobile-drawer__divider" role="separator" />
                    <div class="mobile-drawer__menu">
                      {profileItems.map((item) => (
                        <button
                          type="button"
                          key={item.path}
                          class={[
                            'mobile-drawer__menu-item',
                            route.path === item.path && 'mobile-drawer__menu-item--active'
                          ]}
                          onClick={() => navigateTo(item.path)}
                          aria-current={route.path === item.path ? 'page' : undefined}>
                          <item.icon size={20} aria-hidden="true" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        class="mobile-drawer__menu-item mobile-drawer__menu-item--danger"
                        onClick={handleLogout}>
                        <PhSignOut size={20} aria-hidden="true" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </div>
                </aside>
              )
            }}
          </Popup>
        </div>
      </MobileVantProvider>
    )
  }
})
