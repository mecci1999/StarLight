/**
 * 扫码登录
 */
import { useSettingStore } from '@/store/setting'
import { useNetwork } from '@vueuse/core'
import { NAvatar, NButton, NCheckbox, NFlex, NInput, NQrCode, NScrollbar, NSkeleton } from 'naive-ui'
import { getCookie } from '@/utils/Cookie'
import api from '@/api'
import { QrCodeStatus } from '@/types/enums'
// 在文件顶部添加导入语句
import RefreshIcon from '@/assets/icons/refresh.svg'

export default defineComponent({
  name: 'LoginWindowContentQRCode',
  props: {
    protocol: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { slots }) {
    // 网络连接是否正常
    const { isOnline } = useNetwork()
    const settingStore = useSettingStore()
    const { login } = storeToRefs(settingStore)

    const TOKEN = ref(getCookie('ACCESS_TOKEN'))
    const REFRESH_TOKEN = ref(getCookie('REFRESH_TOKEN'))

    const router = useRouter()

    const state = reactive({
      loading: false, // 二维码加载状态
      QRCode: '', // 二维码内容
      qrStatus: 'loading' as 'loading' | 'waiting' | 'scanned' | 'expired' | 'success' | 'error', // 二维码状态
      statusText: '正在生成二维码...', // 状态文本
      qrCodeKey: '', // 二维码key
      pollingTimer: null as NodeJS.Timeout | null, // 轮询定时器
      retryCount: 0, // 重试次数
      maxRetryCount: 3, // 最大重试次数
      expirationTimer: null as NodeJS.Timeout | null, // 添加过期定时器引用
      retryTimer: null as NodeJS.Timeout | null // 添加重试定时器引用
    })

    // 生成二维码
    const generateQRCode = async () => {
      try {
        state.loading = true
        state.qrStatus = 'loading'
        state.statusText = '正在生成二维码...'

        // 调用API获取二维码key
        const response = await api.getLoginQrCode()

        if (response) {
          // 生成二维码内容，这里使用key作为二维码内容
          state.QRCode = response.code
          state.qrCodeKey = response.code
          state.qrStatus = 'waiting'
          state.statusText = ''
          state.retryCount = 0

          // 开始轮询检查扫码状态
          startPolling()
        } else {
          throw new Error('获取二维码失败')
        }
      } catch (error) {
        console.error('生成二维码失败:', error)
        state.qrStatus = 'error'
        state.statusText = '生成二维码失败，请重试'
        state.retryCount++

        // 如果重试次数未达到上限，3秒后自动重试
        if (state.retryCount < state.maxRetryCount) {
          // 清除之前的重试定时器
          if (state.retryTimer) {
            clearTimeout(state.retryTimer)
            state.retryTimer = null
          }

          state.retryTimer = setTimeout(() => {
            generateQRCode()
          }, 3000)
        }
      } finally {
        state.loading = false
      }
    }

    // 检查扫码状态
    const checkQRStatus = async () => {
      if (!state.qrCodeKey) return

      try {
        const response = await api.qrcodeStatus(state.qrCodeKey)

        if (response) {
          const status = response.status

          switch (status) {
            case QrCodeStatus.PENDING:
              state.qrStatus = 'waiting'
              state.statusText = ''
              break
            case QrCodeStatus.SCANNED:
              state.qrStatus = 'scanned'
              state.statusText = '已扫描，请在手机上确认'
              break
            case QrCodeStatus.CONFIRMED:
              state.qrStatus = 'success'
              state.statusText = '登录成功'
              stopPolling()

              // 处理登录成功逻辑
              if (response.userInfo?.userId) {
                // 这里可以根据需要处理用户信息
                // 可能需要调用其他API获取完整的登录token

                // 跳转到主页面或关闭登录窗口
                setTimeout(() => {
                  // 这里根据你的路由配置进行跳转
                  router.push('/home')
                }, 1000)
              }
              break
            case QrCodeStatus.EXPIRED:
              state.qrStatus = 'expired'
              state.statusText = '二维码已过期，点击刷新'
              stopPolling()
              break
            case QrCodeStatus.CANCELLED:
              state.qrStatus = 'waiting'
              state.statusText = '已取消，请重新扫描'
              break
            default:
              break
          }
        }
      } catch (error) {
        console.error('检查扫码状态失败:', error)
      }
    }

    // 开始轮询
    const startPolling = () => {
      stopPolling() // 先清除之前的定时器
      state.pollingTimer = setInterval(() => {
        checkQRStatus()
      }, 2000) // 每2秒检查一次

      // 清除之前的过期定时器
      if (state.expirationTimer) {
        clearTimeout(state.expirationTimer)
        state.expirationTimer = null
      }

      // 设置二维码过期时间（5分钟）
      state.expirationTimer = setTimeout(
        () => {
          if (state.qrStatus === 'waiting' || state.qrStatus === 'scanned') {
            state.qrStatus = 'expired'
            state.statusText = '二维码已过期，点击刷新'
            stopPolling()
          }
        },
        2 * 60 * 1000
      )
    }

    // 停止轮询
    const stopPolling = () => {
      if (state.pollingTimer) {
        clearInterval(state.pollingTimer)
        state.pollingTimer = null
      }
    }

    // 清除所有定时器
    const clearAllTimers = () => {
      // 清除轮询定时器
      if (state.pollingTimer) {
        clearInterval(state.pollingTimer)
        state.pollingTimer = null
      }

      // 清除过期定时器
      if (state.expirationTimer) {
        clearTimeout(state.expirationTimer)
        state.expirationTimer = null
      }

      // 清除重试定时器
      if (state.retryTimer) {
        clearTimeout(state.retryTimer)
        state.retryTimer = null
      }
    }

    // 组件卸载时清除所有定时器
    onUnmounted(() => {
      clearAllTimers()
    })

    // 刷新二维码
    const refreshQRCode = () => {
      stopPolling()
      generateQRCode()
    }

    // 获取状态图标
    const getStatusIcon = () => {
      switch (state.qrStatus) {
        case 'loading':
          return (
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-3">
              <svg class="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-dasharray="31.416"
                  stroke-dashoffset="31.416"
                  opacity="0.3"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-dasharray="31.416"
                  stroke-dashoffset="23.562"
                  stroke-linecap="round"
                />
              </svg>
            </div>
          )
        case 'scanned':
          return (
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-3 animate-pulse">
              <svg class="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          )
        case 'expired':
          return (
            <div
              class="flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 mb-3 cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={refreshQRCode}>
              <svg class="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" />
              </svg>
            </div>
          )
        case 'error':
          return (
            <div
              class="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-3 cursor-pointer hover:bg-red-100 transition-colors"
              onClick={refreshQRCode}>
              <svg class="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
              </svg>
            </div>
          )
        case 'success':
          return (
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-3 animate-bounce">
              <svg class="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          )
        default:
          return null
      }
    }

    // 获取状态样式类
    const getStatusClass = () => {
      switch (state.qrStatus) {
        case 'loading':
          return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
        case 'scanned':
          return 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
        case 'expired':
          return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
        case 'error':
          return 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
        case 'success':
          return 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
        default:
          return 'bg-white'
      }
    }

    // 获取状态文本颜色
    const getStatusTextColor = () => {
      switch (state.qrStatus) {
        case 'loading':
          return 'text-blue-600'
        case 'scanned':
          return 'text-green-600'
        case 'expired':
          return 'text-orange-600'
        case 'error':
          return 'text-red-600'
        case 'success':
          return 'text-green-600'
        default:
          return 'text-gray-600'
      }
    }

    // 组件卸载时清除定时器
    onUnmounted(() => {
      stopPolling()
    })

    onMounted(async () => {
      // 检查网络连接
      if (!isOnline.value) {
        state.qrStatus = 'error'
        state.statusText = '网络连接异常，请检查网络'
        return
      }

      // 生成二维码
      await generateQRCode()
    })

    return () => (
      <NFlex class="ma text-center h-full" size={0} vertical={true} data-tauri-drag-region>
        {/* 二维码 */}
        <div class="title text-14px color-[--color-text-1] mt-4px">
          请打开
          <span class={'color-[--color-primary-6] hover:color-[--color-primary-5] cursor-pointer ml-6px mr-6px'}>
            星光 App
          </span>
          扫一扫
        </div>
        {/* 二维码容器 */}
        <NFlex justify={'center'} class={'qrcode mt-20px relative'}>
          <div class="relative">
            {state.loading ? (
              // 占位图
              <div class="flex items-center justify-center w-[224px] h-[224px] rounded-xl bg-gray-50">
                <div class="text-center">
                  <div class="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50">
                    <svg class="w-6 h-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-dasharray="31.416"
                        stroke-dashoffset="31.416"
                        opacity="0.3"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-dasharray="31.416"
                        stroke-dashoffset="23.562"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <span class="text-sm text-gray-500">正在生成二维码...</span>
                </div>
              </div>
            ) : (
              // 二维码
              <div
                class={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 w-[224px] h-[224px] ${
                  state.qrStatus === 'expired' || state.qrStatus === 'error' ? 'filter blur-sm opacity-60' : ''
                }`}>
                <NQrCode
                  size={200}
                  value={state.QRCode}
                  iconSrc="/logo.png"
                  errorCorrectionLevel={'H'}
                  class="rounded-xl"
                />
                {/* 二维码边框装饰 */}
                <div class="absolute inset-0 rounded-xl border-2 border-white shadow-lg pointer-events-none"></div>
              </div>
            )}

            {/* 二维码状态覆盖层 */}
            {state.qrStatus !== 'waiting' && !state.loading && (
              <div
                class={`absolute inset-0 flex items-center justify-center rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${getStatusClass()}`}>
                <div class="text-center flex flex-col items-center justify-center max-w-xs">
                  {getStatusIcon()}
                  {state.statusText && (
                    <div class={`text-sm font-medium mb-3 ${getStatusTextColor()}`}>{state.statusText}</div>
                  )}
                  {(state.qrStatus === 'expired' || state.qrStatus === 'error') && (
                    // 然后在刷新按钮处使用
                    <div
                      onClick={refreshQRCode}
                      class="flex items-center justify-center rounded-full bg-primary hover:bg-primary-hover cursor-pointer transition-colors">
                      <img src={RefreshIcon} class="size-32px animate-pulse filter invert brightness-200" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 扫描状态指示器 */}
            {/* {state.qrStatus === 'waiting' && !state.loading && (
              <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div class="flex items-center space-x-1 px-3 py-1 bg-white rounded-full shadow-md border">
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span class="text-xs text-gray-600">等待扫描</span>
                </div>
              </div>
            )} */}
          </div>
        </NFlex>

        {/* 网络状态提示 */}
        {!isOnline.value && (
          <div class="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center justify-center text-red-600">
              <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span class="text-sm">网络连接异常，请检查网络设置</span>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {/* <div class="mt-6 px-4">
          <div class="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3">
            <div class="flex items-center justify-center mb-2">
              <svg class="w-4 h-4 mr-1 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>使用星光App扫描二维码即可快速登录</span>
            </div>
            <div class="text-center text-gray-400">
              二维码有效期为5分钟
            </div>
          </div>
        </div> */}
      </NFlex>
    )
  }
})
