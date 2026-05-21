import 'uno.css'
import '@unocss/reset/eric-meyer.css' // 使用unoccs提供的浏览器默认样式重置文件
import vResize from '@/directives/v-resize'
import vSlide from '@/directives/v-slide'
import { pinia } from '@/store'
import router from '@/router'
import { createApp } from 'vue'
import App from './App'
import { AppException } from '@/common/exception'
import '@/styles/monitor.scss'

const app = createApp(App)
app.use(router).use(pinia).directive('resize', vResize).directive('slide', vSlide).mount('#app')
app.config.errorHandler = (error) => {
  if (error instanceof AppException) {
    window.$message.error(error.message)
    return
  }

  // Suppress ResizeObserver loop errors which are often benign in complex layouts
  if (error instanceof Error && error.message.includes('ResizeObserver loop')) {
    return
  }

  throw error
}

// Global error handler for unhandled promise rejections and other errors
window.addEventListener('error', (event) => {
  if (event.message.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation()
    return
  }
})

if (process.env.NODE_ENV === 'development') {
  // 打印项目版本信息
  import('@/utils/Console').then((module) => module.consolePrint())
}
