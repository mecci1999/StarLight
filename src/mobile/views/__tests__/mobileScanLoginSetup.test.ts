import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('mobile QR scanner setup', () => {
  it('starts the native camera scanner and releases it when the page closes', async () => {
    const source = await readFile(new URL('../MobileScanLogin.tsx', import.meta.url), 'utf8')

    expect(source).toContain("from '@tauri-apps/plugin-barcode-scanner'")
    expect(source).toContain('requestPermissions()')
    expect(source).toContain("cameraDirection: 'back'")
    expect(source).toContain('formats: [Format.QRCode]')
    expect(source).toContain('windowed: true')
    expect(source).toContain("'mobile-scan-login--camera-active': scannerActive.value")
    expect(source).toContain('await nextTick()')
    expect(source).toContain("document.documentElement.classList.toggle('mobile-camera-preview', active)")
    expect(source).toContain('let scannerSession = 0')
    expect(source).toContain('let scannerCancellationRequested = false')
    expect(source).toContain('scannerCancellationRequested = true')
    expect(source).toContain('scannerSession++')
    expect(source).toContain('await handleDecode(result.content.trim())')
    expect(source).toContain('await cancelBarcodeScan()')
    expect(source).toContain('api.scanQRcode({ code: qrKey.value })')
    expect(source).toContain('api.confirmQRcode({ code: qrKey.value })')
    expect(source).toContain('api.cancelQRcode({ code: qrKey.value })')
    expect(source).not.toContain('api.getQRCodeStatus({ code: qrKey.value })')
    expect(source).toContain('请在移动端完成确认，桌面端会自动继续登录')
  })

  it('declares the iOS camera permission purpose', async () => {
    const infoPlist = await readFile(new URL('../../../../src-tauri/Info.ios.plist', import.meta.url), 'utf8')
    const capability = await readFile(
      new URL('../../../../src-tauri/capabilities/mobile.json', import.meta.url),
      'utf8'
    )

    expect(infoPlist).toContain('NSCameraUsageDescription')
    expect(capability).toContain('barcode-scanner:allow-scan')
    expect(capability).toContain('barcode-scanner:allow-cancel')
    expect(capability).toContain('barcode-scanner:allow-check-permissions')
    expect(capability).toContain('barcode-scanner:allow-request-permissions')
    expect(capability).toContain('barcode-scanner:allow-open-app-settings')
  })

  it('keeps the scanner frame centered and reserves visible space for the safe-area action panel', async () => {
    const styles = await readFile(new URL('../MobileScanLogin.scss', import.meta.url), 'utf8')

    expect(styles).toContain('height: 100dvh')
    expect(styles).toContain('grid-template-rows: auto minmax(0, 1fr) auto')
    expect(styles).toContain('width: min(272px, 68vw, 42dvh)')
    expect(styles).toContain('env(safe-area-inset-bottom, 0px)')
    expect(styles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(styles).toContain('max-width: 100%')
    expect(styles).toContain('min-width: 0')
    expect(styles).toContain('align-self: center')
    expect(styles).toContain('box-sizing: border-box')
    expect(styles).toContain('h1 {\n      color: #fff;')
  })
})
