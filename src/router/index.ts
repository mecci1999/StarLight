import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  NavigationGuardNext,
  RouteLocationNormalized
} from 'vue-router'
import { type } from '@tauri-apps/plugin-os'
import { getCookie } from '@/utils/Cookie'

const isDesktop = computed(() => {
  return type() === 'windows' || type() === 'linux' || type() === 'macos'
})

/**! 创建窗口后再跳转页面就会导致样式没有生效所以不能使用懒加载路由的方式，有些页面需要快速响应的就不需要懒加载 */
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/loginWindow/index')
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/layout/index'),
    redirect: '/home/service-topology',
    children: [
      // 📋 服务总览模块
      {
        path: 'service-topology',
        name: 'service-topology',
        component: () => import('@/views/homeWindow/service/topology')
      },
      {
        path: 'service-list',
        name: 'service-list',
        component: () => import('@/views/homeWindow/service/list')
      },
      {
        path: 'instance-monitor',
        name: 'instance-monitor',
        component: () => import('@/views/homeWindow/service/instance')
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
      // {
      //   path: 'slow-analysis',
      //   name: 'slow-analysis',
      //   component: () => import('@/views/homeWindow/tracing/slow')
      // },
      // // ⚙️ 配置管理模块
      // {
      //   path: 'config-center',
      //   name: 'config-center',
      //   component: () => import('@/views/homeWindow/config/center')
      // },
      // {
      //   path: 'config-list',
      //   name: 'config-list',
      //   component: () => import('@/views/homeWindow/config/list')
      // },
      // {
      //   path: 'config-history',
      //   name: 'config-history',
      //   component: () => import('@/views/homeWindow/config/history')
      // },
      // // 🧱 服务注册模块
      // {
      //   path: 'registry-view',
      //   name: 'registry-view',
      //   component: () => import('@/views/homeWindow/registry/view')
      // },
      // {
      //   path: 'service-registry',
      //   name: 'service-registry',
      //   component: () => import('@/views/homeWindow/registry/service')
      // },
      // // 👥 用户权限模块
      // {
      //   path: 'user-management',
      //   name: 'user-management',
      //   component: () => import('@/views/homeWindow/user/management')
      // },
      // {
      //   path: 'team-collaboration',
      //   name: 'team-collaboration',
      //   component: () => import('@/views/homeWindow/user/team')
      // },
      // {
      //   path: 'role-management',
      //   name: 'role-management',
      //   component: () => import('@/views/homeWindow/user/role')
      // },
      // // 🔧 系统设置模块
      // {
      //   path: 'data-source',
      //   name: 'data-source',
      //   component: () => import('@/views/homeWindow/system/datasource')
      // },
      // {
      //   path: 'plugin-management',
      //   name: 'plugin-management',
      //   component: () => import('@/views/homeWindow/system/plugin')
      // },
      // {
      //   path: 'system-settings',
      //   name: 'system-settings',
      //   component: () => import('@/views/homeWindow/system/settings')
      // },
      // // 📂 审计事件模块
      // {
      //   path: 'audit-logs',
      //   name: 'audit-logs',
      //   component: () => import('@/views/homeWindow/audit/logs')
      // },
      // {
      //   path: 'system-events',
      //   name: 'system-events',
      //   component: () => import('@/views/homeWindow/audit/events')
      // },
      // // 🧪 测试调试模块
      // {
      //   path: 'api-testing',
      //   name: 'api-testing',
      //   component: () => import('@/views/homeWindow/testing/api')
      // },
      // {
      //   path: 'mock-service',
      //   name: 'mock-service',
      //   component: () => import('@/views/homeWindow/testing/mock')
      // },
      // {
      //   path: 'debug-tools',
      //   name: 'debug-tools',
      //   component: () => import('@/views/homeWindow/testing/debug')
      // }
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
  // 如果是桌面端，直接放行
  if (isDesktop.value) {
    return next()
  }

  // 从cookie中获取ACCESS_TOKEN
  const token = getCookie('ACCESS_TOKEN')
  const isLoginPage = to.path === '/mobile/login'

  // 已登录用户访问登录页时重定向到首页
  if (isLoginPage && token) {
    return next('/mobile/home')
  }

  // 未登录用户访问非登录页时重定向到登录页
  if (!isLoginPage && !token) {
    return next('/mobile/login')
  }

  next()
})

export default router
