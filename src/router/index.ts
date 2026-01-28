import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  NavigationGuardNext,
  RouteLocationNormalized
} from 'vue-router'
import { type } from '@tauri-apps/plugin-os'
import { getCookie } from '@/utils/Cookie'

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
    component: () => import('@/views/homeWindow/onboarding/index')
  },
  {
    path: '/mobile/onboarding-notice',
    name: 'mobile-onboarding-notice',
    component: () => import('@/mobile/views/OnboardingNotice')
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
    redirect: '/home/service-overview',
    children: [
      // 📋 服务总览模块
      {
        path: 'service-overview',
        name: 'service-overview',
        component: () => import('@/views/homeWindow/service/topology')
      },
      // 📊 性能监控模块
      {
        path: 'real-time-monitor',
        name: 'real-time-monitor',
        component: () => import('@/views/homeWindow/monitor/realtime')
      },
      {
        path: 'metrics-analysis',
        name: 'metrics-analysis',
        component: () => import('@/views/homeWindow/monitor/metrics')
      },
      {
        path: 'custom-dashboard',
        name: 'custom-dashboard',
        component: () => import('@/views/homeWindow/monitor/dashboard')
      },
      // 🚨 告警管理模块
      {
        path: 'alert-list',
        name: 'alert-list',
        component: () => import('@/views/homeWindow/alert/list')
      },
      {
        path: 'alert-rules',
        name: 'alert-rules',
        component: () => import('@/views/homeWindow/alert/rules')
      },
      // {
      //   path: 'notification-history',
      //   name: 'notification-history',
      //   component: () => import('@/views/homeWindow/alert/history')
      // },
      // 📝 日志中心模块
      {
        path: 'log-center',
        name: 'log-center',
        component: () => import('@/views/homeWindow/log/index')
      },
      {
        path: 'service-logs',
        name: 'service-logs',
        component: () => import('@/views/homeWindow/log/service')
      },
      {
        path: 'exception-analysis',
        name: 'exception-analysis',
        component: () => import('@/views/homeWindow/log/exception')
      },
      // 🔁 调用链追踪模块
      {
        path: 'trace-explorer',
        name: 'trace-explorer',
        component: () => import('@/views/homeWindow/monitor/trace')
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
      return next('/mobile/home')
    }
  }

  // 仅从 Cookie 获取登录态
  const token = getCookie('ACCESS_TOKEN')

  console.log(`[Router] Navigation to: ${to.path}, Token exists: ${!!token}`)

  // 兼容移动端和桌面端的登录页路径
  const isLoginPage = to.path === '/login' || to.path === '/mobile/login'
  const isTrayPage = to.path === '/tray'
  const isCapturePage = to.path === '/capture'

  // Tray 和 Capture 页面不需要登录
  if (isTrayPage || isCapturePage) {
    return next()
  }

  // 已登录用户访问登录页时重定向到首页
  if (isLoginPage && token) {
    if (isDesktop) {
      return next('/home')
    } else {
      return next('/mobile/home')
    }
  }

  // 未登录用户访问非登录页时重定向到登录页
  if (!isLoginPage && !token) {
    if (isDesktop) {
      return next('/login')
    } else {
      return next('/mobile/login')
    }
  }

  next()
})

export default router
