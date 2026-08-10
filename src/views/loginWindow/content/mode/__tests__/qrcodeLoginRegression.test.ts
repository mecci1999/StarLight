import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const readQrLogin = () => readFile(new URL('../qrcode.tsx', import.meta.url), 'utf8')

describe('desktop QR login regressions', () => {
  it('uses the backend-required code parameter when polling status', async () => {
    const source = await readQrLogin()

    expect(source).toContain('api.getQRCodeStatus({ code: state.qrCodeKey })')
    expect(source).not.toContain('api.getQRCodeStatus({ key: state.qrCodeKey })')
  })

  it('stops polling after repeated status failures and exposes a refreshable error', async () => {
    const source = await readQrLogin()

    expect(source).toContain('statusFailureCount: 0')
    expect(source).toContain('state.statusFailureCount >= state.maxRetryCount')
    expect(source).toContain("state.statusText = '二维码状态更新失败，请刷新后重试'")
    expect(source).toContain('stopPolling()')
  })

  it('keeps an old polling response from overwriting a refreshed QR session', async () => {
    const source = await readQrLogin()

    expect(source).toContain('let qrSession = 0')
    expect(source).toContain('let pollRequestSession: number | null = null')
    expect(source).toContain('const session = ++qrSession')
    expect(source).toContain('if (session !== qrSession || !state.qrCodeKey || pollRequestSession === session) return')
    expect(source).toContain('if (session !== qrSession) return')
    expect(source).toContain('void checkQRStatus(session)')
  })

  it('keeps the QR stage contained and moves expired-state refresh into the QR module', async () => {
    const [component, styles, windowSource, loginStyles] = await Promise.all([
      readQrLogin(),
      readFile(new URL('../qrcode.scss', import.meta.url), 'utf8'),
      readFile(new URL('../../../index.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../../index.scss', import.meta.url), 'utf8')
    ])

    expect(component).not.toContain('class="login-qrcode" size={0} vertical={true} data-tauri-drag-region')
    expect(component).toContain('const QR_CODE_RASTER_SIZE = 168')
    expect(component).toContain('const QR_CODE_INTRINSIC_PADDING = 12')
    expect(component).toContain('size={QR_CODE_RASTER_SIZE}')
    expect(component).toContain('padding={QR_CODE_INTRINSIC_PADDING}')
    expect(component).toContain('class="login-qrcode__stage"')
    expect(component).toContain("'login-qrcode__qr-slot'")
    expect(component).toContain("'login-qrcode__qr-slot--obscured': isRefreshableStatus()")
    expect(component).toContain('class="login-qrcode__refresh-overlay"')
    expect(component).toContain('<NButton class="login-qrcode__refresh"')
    expect(styles).toContain('&__stage')
    expect(styles).toContain('flex: 0 0 242px')
    expect(styles).toContain('width: 242px')
    expect(styles).toContain('height: 242px')
    expect(styles).toContain('padding: 24px')
    expect(styles).toContain('&__qr-slot')
    expect(styles).toContain('max-width: 100%')
    expect(styles).toContain('max-height: 100%')
    expect(styles).toContain('box-sizing: content-box !important')
    expect(styles).toContain('filter: blur(5px)')
    expect(styles).toContain('&__refresh-overlay')
    expect(styles).not.toContain('overflow: hidden')
    expect(loginStyles).toContain('&:has(.login-qrcode)')
    expect(loginStyles).toContain('min-height: 358px')
    expect(windowSource).not.toContain('<main class="login-window" data-tauri-drag-region>')
  })

  it('shows the destination desktop window before closing the login window after QR success', async () => {
    const windowSource = await readFile(new URL('../../../../../hooks/useWindow.ts', import.meta.url), 'utf8')

    const showIndex = windowSource.indexOf('await webview.show()')
    const closeIndex = windowSource.indexOf('win?.close()')

    expect(showIndex).toBeGreaterThan(-1)
    expect(closeIndex).toBeGreaterThan(showIndex)
  })

  it('uses fresh server user state to resolve the QR-login landing route', async () => {
    const source = await readQrLogin()

    expect(source).toContain('if (loginUserId) {')
    expect(source).toContain('resolvedUserInfo = (await api.getUserInfo(loginUserId))')
    expect(source).toContain('isOnboardingCompleted: resolvedUserInfo?.isOnboardingCompleted')
    expect(source).toContain('(resolvedUserInfo as any)?.nickname')
  })
})
