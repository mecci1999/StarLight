import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  NavigationGuardNext,
  RouteLocationNormalized
} from 'vue-router'
import { type } from '@tauri-apps/plugin-os'

const isDesktop = computed(() => {
  return type() === 'windows' || type() === 'linux' || type() === 'macos'
})

/**! 创建窗口后再跳转页面就会导致样式没有生效所以不能使用懒加载路由的方式，有些页面需要快速响应的就不需要懒加载 */
const routes: Array<RouteRecordRaw> = []

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // 如果是桌面端，直接放行
  if (isDesktop.value) {
    return next()
  }

  next()
})

export default router
