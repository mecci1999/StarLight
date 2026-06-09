import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  NavigationGuardNext,
  RouteLocationNormalized
} from 'vue-router'
import { type } from '@tauri-apps/plugin-os'
import { mustGetHomeRouteMeta } from '@/app/navigation/homeRouteMeta'
import { getStoredUserInfo } from '@/services/authSession'

const getIsDesktop = () => {
  try {
    const osType = type()
    return osType === 'windows' || osType === 'linux' || osType === 'macos'
  } catch (e) {
    // 如果调用失败（例如在纯浏览器环境中），默认为 true（桌面端行为）
    console.warn('Failed to get OS type, defaulting to desktop:', e)
    return true
  }
}

/**! 创建窗口后再跳转页面就会导致样式没有生效所以不能使用懒加载路由的方式，有些页面需要快速响应的就不需要懒加载 */
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/loginWindow/index')
  },
  {
    path: '/tray',
    name: 'tray',
    component: () => import('@/views/trayWindow/index')
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/domains/admin/pages/OnboardingPage')
  },
  {
    path: '/mobile/onboarding-notice',
    name: 'mobile-onboarding-notice',
    component: () => import('@/mobile/views/OnboardingNotice')
  },
  {
    path: '/mobile/overview-v2',
    name: 'mobile-overview-v2',
    component: () => import('@/mobile/views/OverviewV2')
  },
  {
    path: '/mobile/services-v2',
    name: 'mobile-services-v2',
    component: () => import('@/mobile/views/ServicesV2')
  },
  {
    path: '/mobile/service-detail-v2/:serviceId',
    name: 'mobile-service-detail-v2',
    component: () => import('@/mobile/views/ServiceDetailV2')
  },
  {
    path: '/mobile/home',
    name: 'mobile-home',
    component: () => import('@/mobile/views/Home')
  },
  {
    path: '/mobile/login',
    name: 'mobile-login',
    component: () => import('@/views/loginWindow/index')
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/layout/index'),
    redirect: '/home/overview',
    children: [
      {
        path: 'overview',
        name: 'overview',
        meta: mustGetHomeRouteMeta('overview'),
        component: () => import('@/domains/overview/pages/OverviewPage')
      },
      {
        path: 'overview-v2',
        name: 'overview-v2',
        meta: mustGetHomeRouteMeta('overview-v2'),
        redirect: '/home/overview'
      },
      {
        path: 'services',
        name: 'services',
        meta: mustGetHomeRouteMeta('services'),
        component: () => import('@/domains/service/pages/ServiceCatalogPage')
      },
      {
        path: 'services/topology',
        name: 'services-topology',
        meta: mustGetHomeRouteMeta('services-topology'),
        component: () => import('@/domains/service/pages/TopologyPage')
      },
      {
        path: 'services-v2',
        name: 'services-v2',
        meta: mustGetHomeRouteMeta('services-v2'),
        redirect: '/home/services'
      },
      {
        path: 'services/:serviceId',
        name: 'service-detail',
        meta: mustGetHomeRouteMeta('service-detail'),
        component: () => import('@/domains/service/pages/ServiceDetailPage')
      },
      {
        path: 'service-detail-v2/:serviceId',
        name: 'service-detail-v2',
        meta: mustGetHomeRouteMeta('service-detail-v2'),
        redirect: (to) => ({
          path: `/home/services/${to.params.serviceId}`,
          query: to.query
        })
      },
      // 📋 服务总览模块
      {
        path: 'alerts-v2',
        name: 'alerts-v2',
        meta: mustGetHomeRouteMeta('alerts-v2'),
        redirect: '/home/alerts/inbox'
      },
      {
        path: 'logs-v2',
        name: 'logs-v2',
        meta: mustGetHomeRouteMeta('logs-v2'),
        redirect: '/home/investigate/logs'
      },
      {
        path: 'admin-billing-v2',
        name: 'admin-billing-v2',
        meta: mustGetHomeRouteMeta('admin-billing-v2'),
        component: () => import('@/domains/admin/pages/BillingPage')
      },
      {
        path: 'investigate/metrics',
        name: 'investigate-metrics',
        meta: mustGetHomeRouteMeta('investigate-metrics'),
        component: () => import('@/domains/metrics/pages/MetricsExplorerPage')
      },
      {
        path: 'investigate/metrics/catalog',
        name: 'metrics-catalog',
        meta: mustGetHomeRouteMeta('metrics-catalog'),
        component: () => import('@/domains/metrics/pages/MetricsCatalogPage')
      },
      {
        path: 'metrics-v2',
        name: 'metrics-v2',
        meta: mustGetHomeRouteMeta('metrics-v2'),
        redirect: '/home/investigate/metrics'
      },
      {
        path: 'settings',
        name: 'settings',
        meta: mustGetHomeRouteMeta('settings'),
        component: () => import('@/domains/settings/pages/SettingsPage')
      },
      {
        path: 'video-upscale',
        name: 'video-upscale',
        meta: mustGetHomeRouteMeta('video-upscale'),
        redirect: '/home/overview'
      },
      {
        path: 'admin/ingestion',
        name: 'admin-ingestion',
        meta: mustGetHomeRouteMeta('admin-ingestion'),
        component: () => import('@/domains/admin/pages/IngestionPage')
      },
      {
        path: 'admin-ingestion-v2',
        name: 'admin-ingestion-v2',
        meta: mustGetHomeRouteMeta('admin-ingestion-v2'),
        redirect: '/home/admin/ingestion'
      },
      {
        path: 'admin-onboarding-v2',
        name: 'admin-onboarding-v2',
        meta: mustGetHomeRouteMeta('admin-onboarding-v2'),
        component: () => import('@/domains/admin/pages/OnboardingPage')
      },
      {
        path: 'investigate/traces',
        name: 'investigate-traces',
        meta: mustGetHomeRouteMeta('investigate-traces'),
        component: () => import('@/domains/trace/pages/TraceExplorerPage')
      },
      {
        path: 'trace-v2',
        name: 'trace-v2',
        meta: mustGetHomeRouteMeta('trace-v2'),
        redirect: '/home/investigate/traces'
      },
      {
        path: 'service-overview',
        name: 'service-overview',
        meta: mustGetHomeRouteMeta('service-overview'),
        redirect: '/home/overview'
      },
      {
        path: 'service-topology',
        name: 'service-topology',
        meta: mustGetHomeRouteMeta('service-topology'),
        redirect: '/home/services/topology'
      },
      {
        path: 'service-list',
        name: 'service-list',
        meta: mustGetHomeRouteMeta('service-list'),
        redirect: '/home/services'
      },
      {
        path: 'instance-monitor',
        name: 'instance-monitor',
        meta: mustGetHomeRouteMeta('instance-monitor'),
        component: () => import('@/domains/service/pages/InstanceMonitorPage')
      },
      // 📊 性能监控模块
      {
        path: 'real-time-monitor',
        name: 'real-time-monitor',
        meta: mustGetHomeRouteMeta('real-time-monitor'),
        component: () => import('@/domains/overview/pages/RealtimeMonitorPage')
      },
      {
        path: 'metrics-analysis',
        name: 'metrics-analysis',
        meta: mustGetHomeRouteMeta('metrics-analysis'),
        redirect: '/home/investigate/metrics'
      },
      {
        path: 'custom-dashboard',
        name: 'custom-dashboard',
        meta: mustGetHomeRouteMeta('custom-dashboard'),
        redirect: '/home/overview'
      },
      // 🚨 告警管理模块
      {
        path: 'alert-list',
        name: 'alert-list',
        meta: mustGetHomeRouteMeta('alert-list'),
        redirect: '/home/alerts/inbox'
      },
      {
        path: 'alerts/inbox/:incidentId',
        name: 'alerts-inbox-incident',
        meta: mustGetHomeRouteMeta('alerts-inbox-incident'),
        component: () => import('@/domains/alerts/pages/AlertInboxPage')
      },
      {
        path: 'alerts/inbox',
        name: 'alerts-inbox',
        meta: mustGetHomeRouteMeta('alerts-inbox'),
        component: () => import('@/domains/alerts/pages/AlertInboxPage')
      },
      {
        path: 'alert-notifications',
        name: 'alert-notifications',
        meta: mustGetHomeRouteMeta('alert-notifications'),
        component: () => import('@/domains/alerts/pages/NotificationCenterPage')
      },
      {
        path: 'alert-rules',
        name: 'alert-rules',
        meta: mustGetHomeRouteMeta('alert-rules'),
        component: () => import('@/domains/alerts/pages/AlertRulesPage')
      },
      // 📝 日志中心模块
      {
        path: 'investigate/logs',
        name: 'investigate-logs',
        meta: mustGetHomeRouteMeta('investigate-logs'),
        component: () => import('@/domains/logs/pages/LogCenterPage')
      },
      {
        path: 'log-center',
        name: 'log-center',
        meta: mustGetHomeRouteMeta('log-center'),
        redirect: '/home/investigate/logs'
      },
      {
        path: 'service-logs',
        name: 'service-logs',
        meta: mustGetHomeRouteMeta('service-logs'),
        redirect: '/home/investigate/logs'
      },
      {
        path: 'exception-analysis',
        name: 'exception-analysis',
        meta: mustGetHomeRouteMeta('exception-analysis'),
        component: () => import('@/domains/logs/pages/ExceptionAnalysisPage')
      },
      // 🔁 调用链追踪模块
      {
        path: 'trace-explorer',
        name: 'trace-explorer',
        meta: mustGetHomeRouteMeta('trace-explorer'),
        redirect: '/home/investigate/traces'
      },
      // 💳 计费管理模块
      {
        path: 'billing',
        name: 'billing',
        meta: mustGetHomeRouteMeta('billing'),
        component: () => import('@/domains/admin/pages/BillingPage')
      }
    ]
  }
]

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const isDesktop = getIsDesktop()

  // 如果是桌面端
  if (isDesktop) {
    // 桌面端禁止访问移动端页面
    if (to.path.startsWith('/mobile')) {
      return next('/home')
    }
    // 注意：这里不要直接 return next()，否则会跳过后面的登录检查
  }

  // 移动端处理逻辑
  if (!isDesktop) {
    // 移动端禁止访问桌面端页面（除了login）
    if (!to.path.startsWith('/mobile') && to.path !== '/login') {
      // 如果尝试访问 /onboarding 或 /home，重定向到移动端对应页面
      if (to.path === '/onboarding') {
        return next('/mobile/onboarding-notice')
      }
      return next('/mobile/overview-v2')
    }
  }

  // 移除基于 Token 的前端路由拦截，转而依赖接口 401 状态码触发重登
  console.log(`[Router] Navigation to: ${to.path}`)

  // 兼容移动端和桌面端的登录页路径
  const isTrayPage = to.path === '/tray'
  const isCapturePage = to.path === '/capture'

  // Tray 和 Capture 页面不需要登录
  if (isTrayPage || isCapturePage) {
    return next()
  }

  // 已登录用户访问登录页时重定向到首页
  // 这里的 token 校验移除，改为在页面加载时通过 API 校验登录态
  // 如果已登录（API返回成功），则留在首页；如果未登录（API返回401），则跳转登录页
  // if (isLoginPage) {
  //   if (isDesktop) {
  //     return next('/home')
  //   } else {
  //     return next('/mobile/home')
  //   }
  // }

  // 移除“未登录用户强制跳转登录页”的逻辑，允许用户先进入页面，
  // 由页面内的 API 请求触发 401 拦截器，进而触发重登。
  // 这样可以解决 Cookie 不同步导致的误判问题。

  const isAdminRoute =
    to.path.startsWith('/home/admin') || to.path === '/home/admin-billing-v2' || to.path === '/home/billing'
  if (isAdminRoute && !getStoredUserInfo()?.isAdmin) {
    return next('/home')
  }

  next()
})

export default router
