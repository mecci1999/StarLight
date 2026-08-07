/**
 * 扫码登录
 */
import { useSettingStore } from '@/store/setting'
import { useNetwork } from '@vueuse/core'
import { NAvatar, NButton, NCheckbox, NFlex, NInput, NQrCode, NScrollbar, NSkeleton } from 'naive-ui'
import {
  getStoredUserInfo,
  getStoredAuthTokens,
  persistAuthTokens,
  syncAuthTokensToTauri,
  persistStoredUserInfo,
  resolveAuthLandingRoute
} from '@/services/authSession'

import * as api from '@/api'
import { QrCodeStatus } from '@/types/enums'
import { useWindow } from '@/hooks/useWindow'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { emit as emitTauri, listen } from '@tauri-apps/api/event'
import { type } from '@tauri-apps/plugin-os'
import { useRouter } from 'vue-router'
import type { UserInfoType } from '@/types/userInfo'
// 在文件顶部添加导入语句
import RefreshIcon from '@/assets/icons/refresh.svg'
import { useTauriListener } from '@/hooks/useTauriListener'
import './qrcode.scss'

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
    const { createWebviewWindow } = useWindow()
    const tauriListener = useTauriListener()

    const getIsDesktop = () => {
      try {
        const osType = type()
        return osType === 'windows' || osType === 'linux' || osType === 'macos'
      } catch (e) {
        return true
      }
    }

    const storedTokens = getStoredAuthTokens()
    const TOKEN = ref(storedTokens.accessToken)
    const REFRESH_TOKEN = ref(storedTokens.refreshToken)

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
        const response = (await api.getQRCodeKey()) as any

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
        const response = (await api.getQRCodeStatus({ key: state.qrCodeKey })) as any

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
              if (!props.protocol) {
                state.qrStatus = 'scanned'
                state.statusText = '请先阅读并同意服务协议与隐私保护指引后重新扫码'
                stopPolling()
                window.$message.warning('请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
                break
              }
              state.qrStatus = 'success'
              state.statusText = '登录成功'
              stopPolling()

              // 手动保存 Token
              const accessToken = response.token || response.accessToken || response.access_token
              const refreshToken = response.refreshToken || response.refresh_token

              persistAuthTokens({ accessToken, refreshToken })

              if (accessToken || refreshToken) {
                await syncAuthTokensToTauri({ accessToken, refreshToken })
              }

              // 处理登录成功逻辑
              const loginUserId = response.userInfo?.userId || response.userId || ''
              const cachedUserInfo = getStoredUserInfo()
              let resolvedUserInfo =
                (response.userInfo as Partial<UserInfoType> | undefined) ||
                (cachedUserInfo?.userId === loginUserId ? cachedUserInfo : undefined)
              if (!resolvedUserInfo?.userId && loginUserId) {
                try {
                  resolvedUserInfo = (await api.getUserInfo(loginUserId)) as Partial<UserInfoType>
                } catch (error) {
                  console.warn('扫码登录成功后刷新用户信息失败，将使用登录响应兜底信息。', error)
                }
              }

              if (loginUserId) {
                const storedUser = {
                  userId: resolvedUserInfo?.userId || loginUserId,
                  email: resolvedUserInfo?.email || '',
                  avatar: resolvedUserInfo?.avatar || 'star_1',
                  nickName:
                    resolvedUserInfo?.nickName || (resolvedUserInfo as any)?.nickname || resolvedUserInfo?.email || '',
                  client: resolvedUserInfo?.client || 'desktop',
                  isAdmin: resolvedUserInfo?.isAdmin || false,
                  status: resolvedUserInfo?.status || 'active',
                  lastActiveAt: resolvedUserInfo?.lastActiveAt || new Date().toISOString(),
                  isOnboardingCompleted: resolvedUserInfo?.isOnboardingCompleted
                }
                persistStoredUserInfo(storedUser)

                // 跳转到主页面或关闭登录窗口
                const isDesktop = getIsDesktop()
                const targetRoute = resolveAuthLandingRoute(isDesktop, storedUser)

                setTimeout(async () => {
                  if (isDesktop) {
                    const win = getCurrentWebviewWindow()
                    // 如果已经在主窗口（例如被踢出后的重新登录），直接路由跳转，不创建新窗口
                    if (win.label === 'StarLight' || win.label === 'home' || win.label === 'onboarding') {
                      router.push({ name: targetRoute })
                    } else {
                      const nextWin = await createWebviewWindow('StarLight', targetRoute, 1080, 720, 'login', true)
                      if (accessToken || refreshToken) {
                        await nextWin.emit('auth-token', { accessToken, refreshToken })
                      }
                    }
                  } else {
                    router.push({ name: targetRoute })
                  }
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
            <div class="login-qrcode__status-icon login-qrcode__status-icon--loading">
              <svg viewBox="0 0 24 24" fill="none">
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
            <div class="login-qrcode__status-icon login-qrcode__status-icon--scanned">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          )
        case 'expired':
          return (
            <div class="login-qrcode__status-icon login-qrcode__status-icon--expired" onClick={refreshQRCode}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" />
              </svg>
            </div>
          )
        case 'error':
          return (
            <div class="login-qrcode__status-icon login-qrcode__status-icon--error" onClick={refreshQRCode}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
              </svg>
            </div>
          )
        case 'success':
          return (
            <div class="login-qrcode__status-icon login-qrcode__status-icon--success">
              <svg viewBox="0 0 24 24" fill="currentColor">
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
          return 'login-qrcode__overlay--loading'
        case 'scanned':
          return 'login-qrcode__overlay--scanned'
        case 'expired':
          return 'login-qrcode__overlay--expired'
        case 'error':
          return 'login-qrcode__overlay--error'
        case 'success':
          return 'login-qrcode__overlay--success'
        default:
          return 'login-qrcode__overlay--waiting'
      }
    }

    // 获取状态文本颜色
    const getStatusTextColor = () => {
      switch (state.qrStatus) {
        case 'loading':
          return 'login-qrcode__overlay-text--loading'
        case 'scanned':
          return 'login-qrcode__overlay-text--scanned'
        case 'expired':
          return 'login-qrcode__overlay-text--expired'
        case 'error':
          return 'login-qrcode__overlay-text--error'
        case 'success':
          return 'login-qrcode__overlay-text--success'
        default:
          return 'login-qrcode__overlay-text--waiting'
      }
    }

    // 组件卸载时清除定时器
    onUnmounted(() => {
      stopPolling()
    })

    onMounted(async () => {
      tauriListener.addListener(
        listen('auth-token-request', async () => {
          const { accessToken, refreshToken } = getStoredAuthTokens()
          if (accessToken || refreshToken) {
            await syncAuthTokensToTauri({ accessToken, refreshToken })
          }
        })
      )
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
      <NFlex class="login-qrcode" size={0} vertical={true} data-tauri-drag-region>
        {/* 二维码 */}
        <div class="title login-qrcode__title">
          请打开
          <span class="login-qrcode__title-link">星光 App</span>
          扫一扫
        </div>
        {/* 二维码容器 */}
        <NFlex justify={'center'} class={'qrcode login-qrcode__panel'}>
          <div class="login-qrcode__panel-inner">
            {state.loading ? (
              // 占位图
              <div class="login-qrcode__placeholder">
                <div class="login-qrcode__placeholder-content">
                  <div class="login-qrcode__placeholder-spinner">
                    <svg class="login-qrcode__placeholder-spinner-icon" viewBox="0 0 24 24" fill="none">
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
                  <span class="login-qrcode__placeholder-text">正在生成二维码...</span>
                </div>
              </div>
            ) : (
              // 二维码
              <div
                class={[
                  'login-qrcode__canvas',
                  state.qrStatus === 'expired' || state.qrStatus === 'error' ? 'is-dimmed' : ''
                ]}>
                <NQrCode
                  size={200}
                  value={state.QRCode}
                  iconSrc="/logo.png"
                  errorCorrectionLevel={'H'}
                  class="login-qrcode__qr"
                />
                {/* 二维码边框装饰 */}
                <div class="login-qrcode__canvas-frame"></div>
              </div>
            )}

            {/* 二维码状态覆盖层 */}
            {state.qrStatus !== 'waiting' && !state.loading && (
              <div class={['login-qrcode__overlay', getStatusClass()]}>
                <div class="login-qrcode__overlay-content">
                  {getStatusIcon()}
                  {state.statusText && (
                    <div class={['login-qrcode__overlay-text', getStatusTextColor()]}>{state.statusText}</div>
                  )}
                  {(state.qrStatus === 'expired' || state.qrStatus === 'error') && (
                    <div onClick={refreshQRCode} class="login-qrcode__refresh">
                      <img src={RefreshIcon} class="login-qrcode__refresh-icon" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </NFlex>

        {/* 网络状态提示 */}
        {!isOnline.value && (
          <div class="login-qrcode__network-error">
            <div class="login-qrcode__network-error-content">
              <svg class="login-qrcode__network-error-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span class="login-qrcode__network-error-text">网络连接异常，请检查网络设置</span>
            </div>
          </div>
        )}
      </NFlex>
    )
  }
})
