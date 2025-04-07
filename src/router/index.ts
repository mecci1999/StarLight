import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  NavigationGuardNext,
  RouteLocationNormalized
} from 'vue-router'
import { type } from '@tauri-apps/plugin-os'
import { getCookie } from '@/utils/cookie'

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
    component: () => import('@/layout/index')
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
