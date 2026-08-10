import { MobileButton, MobileLoading } from '@/mobile/ui'
import { h } from 'vue'
import { PhArrowLeft, PhCheckCircle, PhScan, PhWarningCircle, PhXCircle } from '@phosphor-icons/vue'
import {
  Format,
  cancel as cancelBarcodeScan,
  checkPermissions,
  openAppSettings,
  requestPermissions,
  scan
} from '@tauri-apps/plugin-barcode-scanner'
import * as api from '@/api'
import { useRouter } from 'vue-router'
import { getStoredUserInfo, resolveAuthLandingRoute } from '@/services/authSession'
import MobileVantProvider from '@/mobile/providers/MobileVantProvider'
import './MobileScanLogin.scss'

export default defineComponent({
  name: 'MobileScanLogin',
  setup() {
    const router = useRouter()
    const qrKey = ref('')
    const status = ref<'waiting' | 'scanned' | 'confirmed' | 'expired' | 'error'>('waiting')
    const statusText = ref('请将二维码置于框内扫描')
    const loading = ref(false)
    const scannerActive = ref(false)
    const permissionDenied = ref(false)
    let scannerSession = 0
    let scannerCancellationRequested = false
    let expiryTimer: ReturnType<typeof setTimeout> | null = null
    let redirectTimer: ReturnType<typeof setTimeout> | null = null

    watch(
      scannerActive,
      (active) => {
        document.documentElement.classList.toggle('mobile-camera-preview', active)
      },
      { flush: 'sync' }
    )

    const stopCameraScan = async () => {
      scannerCancellationRequested = true
      scannerSession++
      if (!scannerActive.value) return
      scannerActive.value = false
      try {
        await cancelBarcodeScan()
      } catch (error) {
        console.warn('Failed to cancel QR camera scan:', error)
      }
    }

    const isValidQRKey = (code: string) => code && code.length > 0

    const handleDecode = async (code: string) => {
      if (!isValidQRKey(code)) {
        status.value = 'error'
        statusText.value = '无效的二维码'
        return
      }
      clearPendingScan()
      qrKey.value = code
      await startScan()
    }

    const startCameraScan = async () => {
      if (scannerActive.value || loading.value || status.value !== 'waiting') return

      const session = ++scannerSession
      scannerCancellationRequested = false

      try {
        const permission = await checkPermissions()
        if (session !== scannerSession || scannerCancellationRequested) return
        const granted = permission === 'granted' ? permission : await requestPermissions()
        if (session !== scannerSession || scannerCancellationRequested) return
        if (granted !== 'granted') {
          permissionDenied.value = true
          statusText.value = '需要相机权限才能扫描二维码'
          return
        }

        permissionDenied.value = false
        statusText.value = '请将二维码置于框内扫描'
        scannerActive.value = true
        await nextTick()
        if (session !== scannerSession || scannerCancellationRequested) return
        const result = await scan({
          cameraDirection: 'back',
          formats: [Format.QRCode],
          windowed: true
        })
        if (session !== scannerSession || scannerCancellationRequested) return
        scannerActive.value = false
        await handleDecode(result.content.trim())
      } catch (error) {
        if (session !== scannerSession || scannerCancellationRequested) return
        const wasScanning = scannerActive.value
        scannerActive.value = false
        console.warn('QR camera scan did not complete:', error)
        if (wasScanning) {
          statusText.value = '未识别到二维码，请重试'
          return
        }

        permissionDenied.value = true
        statusText.value = '无法获取相机权限，请前往系统设置授权'
      }
    }

    const startScan = async () => {
      loading.value = true
      try {
        await api.scanQRcode({ code: qrKey.value })
        status.value = 'scanned'
        statusText.value = '已扫描，请确认是否登录此电脑'

        expiryTimer = setTimeout(
          () => {
            if (status.value === 'scanned') {
              status.value = 'expired'
              statusText.value = '确认超时，二维码已过期'
              clearPendingScan()
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

    const handleConfirm = async () => {
      if (!qrKey.value || loading.value || status.value !== 'scanned') return

      loading.value = true
      try {
        await api.confirmQRcode({ code: qrKey.value })
        clearPendingScan()
        status.value = 'confirmed'
        statusText.value = '已确认，桌面端正在登录'
        redirectTimer = setTimeout(() => {
          router.replace({ name: resolveAuthLandingRoute(false, getStoredUserInfo()) })
        }, 1500)
      } catch (error) {
        status.value = 'error'
        statusText.value = error instanceof Error ? error.message : '确认登录失败，请重试'
      } finally {
        loading.value = false
      }
    }

    const handleCancel = async () => {
      if (!qrKey.value || loading.value || status.value !== 'scanned') return

      let cancelled = false
      loading.value = true
      try {
        await api.cancelQRcode({ code: qrKey.value })
        clearPendingScan()
        status.value = 'waiting'
        statusText.value = '已取消，请将二维码置于框内扫描'
        qrKey.value = ''
        cancelled = true
      } catch (error) {
        status.value = 'error'
        statusText.value = error instanceof Error ? error.message : '取消登录失败，请重试'
      } finally {
        loading.value = false
      }
      if (cancelled) await startCameraScan()
    }

    const clearPendingScan = () => {
      if (expiryTimer) {
        clearTimeout(expiryTimer)
        expiryTimer = null
      }
    }

    const handleBack = async () => {
      clearPendingScan()
      await stopCameraScan()
      router.back()
    }

    const handleRetry = async () => {
      clearPendingScan()
      await stopCameraScan()
      status.value = 'waiting'
      statusText.value = '请将二维码置于框内扫描'
      qrKey.value = ''
      permissionDenied.value = false
      await startCameraScan()
    }

    const handleOpenSettings = async () => {
      try {
        await openAppSettings()
      } catch (error) {
        console.warn('Failed to open camera permission settings:', error)
      }
    }

    onMounted(() => {
      void startCameraScan()
    })

    onUnmounted(() => {
      document.documentElement.classList.remove('mobile-camera-preview')
      clearPendingScan()
      void stopCameraScan()
      if (redirectTimer) clearTimeout(redirectTimer)
    })

    return () => (
      <MobileVantProvider>
        <div class={['mobile-scan-login', { 'mobile-scan-login--camera-active': scannerActive.value }]}>
          <div class="mobile-scan-login__header">
            <button class="mobile-scan-login__back" type="button" onClick={handleBack} aria-label="返回">
              {h(PhArrowLeft, { size: 20, weight: 'bold', 'aria-hidden': true })}
            </button>
            <div class="mobile-scan-login__heading">
              <span class="mobile-scan-login__eyebrow">安全登录</span>
              <span class="mobile-scan-login__title">扫码确认</span>
            </div>
            <div class="mobile-scan-login__header-spacer" />
          </div>

          {loading.value ? (
            <div class="mobile-scan-login__loading">
              <MobileLoading size="large" loading={loading.value} text="正在扫描..." />
            </div>
          ) : status.value === 'waiting' ? (
            <div class="mobile-scan-login__scanner">
              <div class="mobile-scan-login__scanner-copy">
                <div class="mobile-scan-login__scanner-icon">{h(PhScan, { size: 22, weight: 'duotone' })}</div>
                <h1>扫描桌面端二维码</h1>
                <p>将取景框对准电脑上的登录二维码</p>
              </div>
              <div class="mobile-scan-login__scan-stage" aria-label="二维码扫描取景框">
                <div class="mobile-scan-login__scan-frame">
                  <i class="mobile-scan-login__corner mobile-scan-login__corner--top-left" />
                  <i class="mobile-scan-login__corner mobile-scan-login__corner--top-right" />
                  <i class="mobile-scan-login__corner mobile-scan-login__corner--bottom-left" />
                  <i class="mobile-scan-login__corner mobile-scan-login__corner--bottom-right" />
                  <div class="mobile-scan-login__scan-line" />
                </div>
              </div>
              <div class="mobile-scan-login__bottom-panel">
                <div class="mobile-scan-login__hint">
                  {h(PhCheckCircle, { size: 18, weight: 'fill' })}
                  <span>{statusText.value}</span>
                </div>
                {permissionDenied.value ? (
                  <MobileButton type="primary" onClick={handleOpenSettings}>
                    前往设置授权
                  </MobileButton>
                ) : (
                  <MobileButton type="primary" onClick={handleRetry}>
                    重新打开相机
                  </MobileButton>
                )}
              </div>
            </div>
          ) : status.value === 'scanned' ? (
            <div class="mobile-scan-login__result">
              <div class="mobile-scan-login__status-icon is-scanned">
                {h(PhCheckCircle, { size: 48, color: 'var(--color-primary-6)' })}
              </div>
              <div class="mobile-scan-login__status-text">{statusText.value}</div>
              <span class="mobile-scan-login__status-sub">请在移动端完成确认，桌面端会自动继续登录</span>
              <div class="mobile-scan-login__confirm-actions">
                <MobileButton type="default" onClick={handleCancel}>
                  取消
                </MobileButton>
                <MobileButton type="primary" onClick={handleConfirm}>
                  确认登录
                </MobileButton>
              </div>
            </div>
          ) : status.value === 'confirmed' ? (
            <div class="mobile-scan-login__result">
              <div class="mobile-scan-login__status-icon is-success">
                {h(PhCheckCircle, { size: 48, color: 'var(--color-success-6)' })}
              </div>
              <div class="mobile-scan-login__status-text">登录成功</div>
              <span class="mobile-scan-login__status-sub">正在返回应用首页...</span>
            </div>
          ) : status.value === 'expired' ? (
            <div class="mobile-scan-login__result">
              <div class="mobile-scan-login__status-icon is-expired">
                {h(PhWarningCircle, { size: 48, color: 'var(--color-warning-6)' })}
              </div>
              <div class="mobile-scan-login__status-text">{statusText.value}</div>
              <MobileButton type="primary" onClick={handleRetry}>
                重新扫码
              </MobileButton>
            </div>
          ) : (
            <div class="mobile-scan-login__result">
              <div class="mobile-scan-login__status-icon is-error">
                {h(PhXCircle, { size: 48, color: 'var(--color-danger-6)' })}
              </div>
              <div class="mobile-scan-login__status-text">{statusText.value}</div>
              <MobileButton type="primary" onClick={handleRetry}>
                重试
              </MobileButton>
            </div>
          )}
        </div>
      </MobileVantProvider>
    )
  }
})
