import 'uno.css'
import '@unocss/reset/eric-meyer.css' // 使用unoccs提供的浏览器默认样式重置文件
import vResize from '@/directives/v-resize'
import vSlide from '@/directives/v-slide'
import { pinia } from '@/store'
import router from '@/router'
import { createApp } from 'vue'
import App from './App'
import { AppException } from '@/common/exception'

const app = createApp(App)
app.use(router).use(pinia).directive('resize', vResize).directive('slide', vSlide).mount('#app')
app.config.errorHandler = (error) => {
  if (error instanceof AppException) {
    window.$message.error(error.message)
    return
  }

  throw error
}

if (process.env.NODE_ENV === 'development') {
  // 打印项目版本信息
  import('@/utils/Console').then((module) => module.consolePrint())
}
