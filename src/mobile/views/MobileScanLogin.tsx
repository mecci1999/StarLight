import { NButton, NResult, NSpin, NIcon, NFlex } from 'naive-ui'
import { PhWarningCircle, PhCheckCircle, PhXCircle, PhArrowsClockwise } from '@phosphor-icons/vue'
import * as api from '@/api'
import { QrCodeStatus } from '@/types/enums'
import { useRouter } from 'vue-router'
import {
  getStoredAuthTokens,
  persistAuthTokens,
  syncAuthTokensToTauri,
  getStoredUserInfo,
  persistStoredUserInfo,
  resolveAuthLandingRoute
} from '@/services/authSession'
import type { UserInfoType } from '@/types/userInfo'
import './MobileScanLogin.scss'

export default defineComponent({
  name: 'MobileScanLogin',
  setup() {
    const router = useRouter()
    const qrKey = ref('')
    const qrCodeId = ref('')
    const status = ref<'waiting' | 'scanned' | 'confirmed' | 'expired' | 'error'>('waiting')
    const statusText = ref('请将二维码置于框内扫描')
    const loading = ref(false)
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const isValidQRKey = (code: string) => code && code.length > 0

    const handleDecode = (code: string) => {
      stopPolling()
      qrKey.value = code
      startScan()
    }

    const startScan = async () => {
      loading.value = true
      try {
        const res = (await api.scanQRcode({ key: qrKey.value })) as any
        qrCodeId.value = res?.id || ''
        status.value = 'scanned'
        statusText.value = '已扫描，请在桌面端确认登录'

        pollTimer = setInterval(async () => {
          try {
            const pollRes = (await api.getQRCodeStatus({ key: qrKey.value })) as any
            switch (pollRes?.status) {
              case QrCodeStatus.CONFIRMED:
                status.value = 'confirmed'
                statusText.value = '登录确认成功'
                stopPolling()
                handleLoginSuccess(pollRes)
                break
              case QrCodeStatus.EXPIRED:
                status.value = 'expired'
                statusText.value = '二维码已过期'
                stopPolling()
                break
              case QrCodeStatus.CANCELLED:
                status.value = 'expired'
                statusText.value = '登录已取消'
                stopPolling()
                break
              default:
                break
            }
          } catch {
            stopPolling()
            status.value = 'error'
            statusText.value = '状态查询失败'
          }
        }, 2000)

        setTimeout(
          () => {
            if (status.value === 'scanned') {
              status.value = 'expired'
              statusText.value = '确认超时，二维码已过期'
              stopPolling()
            }
          },
          2 * 60 * 1000
        )

        const timeoutTimer = setTimeout(
          () => {
            if (status.value === 'scanned') {
              status.value = 'expired'
              statusText.value = '确认超时，二维码已过期'
              stopPolling()
            }
          },
          2 * 60 * 1000
        )
      } catch {
        status.value = 'error'
        statusText.value = '扫码失败'
      } finally {
        loading.value = false
      }
    }

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    const handleLoginSuccess = async (response: any) => {
      const accessToken =
        response.token || response.accessToken || response.access_token || getStoredAuthTokens().accessToken
      const refreshToken = response.refreshToken || response.refresh_token || getStoredAuthTokens().refreshToken
      persistAuthTokens({ accessToken, refreshToken })
      syncAuthTokensToTauri({ accessToken, refreshToken }).catch(() => {})

      const userId = response.userInfo?.userId || response.userId || ''
      const cached = getStoredUserInfo()
      let resolved =
        (response.userInfo as Partial<UserInfoType> | undefined) || (cached?.userId === userId ? cached : undefined)
      if (!resolved?.userId && userId) {
        try {
          resolved = (await api.getUserInfo(userId)) as Partial<UserInfoType>
        } catch {}
      }

      const userInfo: UserInfoType = {
        userId: resolved?.userId || userId,
        email: resolved?.email || '',
        avatar: resolved?.avatar || 'star_1',
        nickName: resolved?.nickName || (resolved as any)?.nickname || resolved?.email || '',
        client: 'mobile',
        isAdmin: resolved?.isAdmin || false,
        status: resolved?.status || 'active',
        lastActiveAt: new Date().toISOString()
      }
      persistStoredUserInfo(userInfo)

      setTimeout(() => {
        router.push({ name: 'mobile-overview-v2' })
      }, 1500)
    }

    const handleBack = () => {
      stopPolling()
      router.back()
    }

    const handleRetry = () => {
      status.value = 'waiting'
      statusText.value = '请将二维码置于框内扫描'
      qrKey.value = ''
      qrCodeId.value = ''
    }

    onUnmounted(() => {
      stopPolling()
    })

    return () => (
      <div class="mobile-scan-login">
        <div class="mobile-scan-login__header">
          <NButton quaternary onClick={handleBack} aria-label="返回">
            ← 返回
          </NButton>
          <span class="mobile-scan-login__title">扫一扫登录</span>
          <div style="width: 48px" />
        </div>

        {loading.value ? (
          <div class="mobile-scan-login__loading">
            <NSpin size="large" />
            <span>正在扫描...</span>
          </div>
        ) : status.value === 'waiting' ? (
          <div class="mobile-scan-login__scanner">
            <div class="mobile-scan-login__scan-frame">
              <div class="mobile-scan-login__scan-line" />
            </div>
            <div class="mobile-scan-login__hint">
              <NIcon size={18}>
                <PhCheckCircle />
              </NIcon>
              <span>将桌面端二维码放入框内，自动识别</span>
            </div>
          </div>
        ) : status.value === 'scanned' ? (
          <NFlex vertical align="center" gap={16} class="mobile-scan-login__result">
            <div class="mobile-scan-login__status-icon is-scanned">
              <NIcon size={48} color="var(--color-primary-6)">
                <PhCheckCircle />
              </NIcon>
            </div>
            <div class="mobile-scan-login__status-text">{statusText.value}</div>
            <span class="mobile-scan-login__status-sub">请在桌面端确认登录</span>
          </NFlex>
        ) : status.value === 'confirmed' ? (
          <NFlex vertical align="center" gap={16} class="mobile-scan-login__result">
            <div class="mobile-scan-login__status-icon is-success">
              <NIcon size={48} color="var(--color-success-6)">
                <PhCheckCircle />
              </NIcon>
            </div>
            <div class="mobile-scan-login__status-text">登录成功</div>
            <span class="mobile-scan-login__status-sub">正在跳转...</span>
          </NFlex>
        ) : status.value === 'expired' ? (
          <NFlex vertical align="center" gap={16} class="mobile-scan-login__result">
            <div class="mobile-scan-login__status-icon is-expired">
              <NIcon size={48} color="var(--color-warning-6)">
                <PhWarningCircle />
              </NIcon>
            </div>
            <div class="mobile-scan-login__status-text">{statusText.value}</div>
            <NButton type="primary" onClick={handleRetry}>
              重新扫码
            </NButton>
          </NFlex>
        ) : (
          <NFlex vertical align="center" gap={16} class="mobile-scan-login__result">
            <div class="mobile-scan-login__status-icon is-error">
              <NIcon size={48} color="var(--color-danger-6)">
                <PhXCircle />
              </NIcon>
            </div>
            <div class="mobile-scan-login__status-text">{statusText.value}</div>
            <NButton type="primary" onClick={handleRetry}>
              重试
            </NButton>
          </NFlex>
        )}
      </div>
    )
  }
})
