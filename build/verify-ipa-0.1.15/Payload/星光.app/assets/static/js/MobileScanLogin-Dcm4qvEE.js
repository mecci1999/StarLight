import { M as a } from './MobileButton-BKhxhz5A.js'
import './MobileToast-CIN42EDh.js'
import { M as l } from './MobileLoading-DlB38x7T.js'
import {
  p as e,
  a0 as s,
  a2 as i,
  a3 as n,
  Z as o,
  w as c,
  aR as t,
  ac as r,
  bZ as u,
  b_ as v,
  b$ as m,
  c0 as _,
  c1 as d,
  c2 as b,
  $ as g,
  c3 as f,
  c4 as p,
  aO as y,
  b0 as w,
  aZ as h,
  b6 as k
} from './invariable-DewVS0br.js'
import './request-BiInMBwl.js'
import { c as x, b as j, s as z } from './auth-CpdnJA9r.js'
import { r as C, b as M } from './index-DFkcx8xz.js'
import { M as T } from './MobileVantProvider-BmQB5FA8.js'
const E = e({
  name: 'MobileScanLogin',
  setup() {
    const e = g(),
      E = s(''),
      L = s('waiting'),
      Z = s('请将二维码置于框内扫描'),
      P = s(!1),
      Q = s(!1),
      R = s(!1)
    let $ = 0,
      q = !1,
      B = null,
      D = null
    i(
      Q,
      (a) => {
        document.documentElement.classList.toggle('mobile-camera-preview', a)
      },
      { flush: 'sync' }
    )
    const O = async () => {
        if (((q = !0), $++, Q.value)) {
          Q.value = !1
          try {
            await u()
          } catch (a) {}
        }
      },
      S = async () => {
        if (Q.value || P.value || 'waiting' !== L.value) return
        const a = ++$
        q = !1
        try {
          const l = await v()
          if (a !== $ || q) return
          const e = 'granted' === l ? l : await m()
          if (a !== $ || q) return
          if ('granted' !== e) return (R.value = !0), void (Z.value = '需要相机权限才能扫描二维码')
          if (((R.value = !1), (Z.value = '请将二维码置于框内扫描'), (Q.value = !0), await _(), a !== $ || q)) return
          const s = await d({ cameraDirection: 'back', formats: [b.QRCode], windowed: !0 })
          if (a !== $ || q) return
          ;(Q.value = !1),
            await (async (a) => {
              if (!((l = a) && l.length > 0)) return (L.value = 'error'), void (Z.value = '无效的二维码')
              var l
              A(), (E.value = a), await U()
            })(s.content.trim())
        } catch (l) {
          if (a !== $ || q) return
          const e = Q.value
          if (((Q.value = !1), e)) return void (Z.value = '未识别到二维码，请重试')
          ;(R.value = !0), (Z.value = '无法获取相机权限，请前往系统设置授权')
        }
      },
      U = async () => {
        P.value = !0
        try {
          await z({ code: E.value }),
            (L.value = 'scanned'),
            (Z.value = '已扫描，请确认是否登录此电脑'),
            (B = setTimeout(() => {
              'scanned' === L.value && ((L.value = 'expired'), (Z.value = '确认超时，二维码已过期'), A())
            }, 12e4))
        } catch {
          ;(L.value = 'error'), (Z.value = '扫码失败')
        } finally {
          P.value = !1
        }
      },
      V = async () => {
        if (E.value && !P.value && 'scanned' === L.value) {
          P.value = !0
          try {
            await x({ code: E.value }),
              A(),
              (L.value = 'confirmed'),
              (Z.value = '已确认，桌面端正在登录'),
              (D = setTimeout(() => {
                e.replace({ name: C(!1, M()) })
              }, 1500))
          } catch (a) {
            ;(L.value = 'error'), (Z.value = a instanceof Error ? a.message : '确认登录失败，请重试')
          } finally {
            P.value = !1
          }
        }
      },
      Y = async () => {
        if (!E.value || P.value || 'scanned' !== L.value) return
        let a = !1
        P.value = !0
        try {
          await j({ code: E.value }),
            A(),
            (L.value = 'waiting'),
            (Z.value = '已取消，请将二维码置于框内扫描'),
            (E.value = ''),
            (a = !0)
        } catch (l) {
          ;(L.value = 'error'), (Z.value = l instanceof Error ? l.message : '取消登录失败，请重试')
        } finally {
          P.value = !1
        }
        a && (await S())
      },
      A = () => {
        B && (clearTimeout(B), (B = null))
      },
      F = async () => {
        A(), await O(), e.back()
      },
      G = async () => {
        A(),
          await O(),
          (L.value = 'waiting'),
          (Z.value = '请将二维码置于框内扫描'),
          (E.value = ''),
          (R.value = !1),
          await S()
      },
      H = async () => {
        try {
          await f()
        } catch (a) {}
      }
    return (
      n(() => {
        S()
      }),
      o(() => {
        document.documentElement.classList.remove('mobile-camera-preview'), A(), O(), D && clearTimeout(D)
      }),
      () =>
        c(T, null, {
          default: () => [
            c('div', { class: ['mobile-scan-login', { 'mobile-scan-login--camera-active': Q.value }] }, [
              c('div', { class: 'mobile-scan-login__header' }, [
                c('button', { class: 'mobile-scan-login__back', type: 'button', onClick: F, 'aria-label': '返回' }, [
                  t(p, { size: 20, weight: 'bold', 'aria-hidden': !0 })
                ]),
                c('div', { class: 'mobile-scan-login__heading' }, [
                  c('span', { class: 'mobile-scan-login__eyebrow' }, [r('安全登录')]),
                  c('span', { class: 'mobile-scan-login__title' }, [r('扫码确认')])
                ]),
                c('div', { class: 'mobile-scan-login__header-spacer' }, null)
              ]),
              P.value
                ? c('div', { class: 'mobile-scan-login__loading' }, [
                    c(l, { size: 'large', loading: P.value, text: '正在扫描...' }, null)
                  ])
                : 'waiting' === L.value
                  ? c('div', { class: 'mobile-scan-login__scanner' }, [
                      c('div', { class: 'mobile-scan-login__scanner-copy' }, [
                        c('div', { class: 'mobile-scan-login__scanner-icon' }, [t(y, { size: 22, weight: 'duotone' })]),
                        c('h1', null, [r('扫描桌面端二维码')]),
                        c('p', null, [r('将取景框对准电脑上的登录二维码')])
                      ]),
                      c('div', { class: 'mobile-scan-login__scan-stage', 'aria-label': '二维码扫描取景框' }, [
                        c('div', { class: 'mobile-scan-login__scan-frame' }, [
                          c('i', { class: 'mobile-scan-login__corner mobile-scan-login__corner--top-left' }, null),
                          c('i', { class: 'mobile-scan-login__corner mobile-scan-login__corner--top-right' }, null),
                          c('i', { class: 'mobile-scan-login__corner mobile-scan-login__corner--bottom-left' }, null),
                          c('i', { class: 'mobile-scan-login__corner mobile-scan-login__corner--bottom-right' }, null),
                          c('div', { class: 'mobile-scan-login__scan-line' }, null)
                        ])
                      ]),
                      c('div', { class: 'mobile-scan-login__bottom-panel' }, [
                        c('div', { class: 'mobile-scan-login__hint' }, [
                          t(w, { size: 18, weight: 'fill' }),
                          c('span', null, [Z.value])
                        ]),
                        R.value
                          ? c(a, { type: 'primary', onClick: H }, { default: () => [r('前往设置授权')] })
                          : c(a, { type: 'primary', onClick: G }, { default: () => [r('重新打开相机')] })
                      ])
                    ])
                  : 'scanned' === L.value
                    ? c('div', { class: 'mobile-scan-login__result' }, [
                        c('div', { class: 'mobile-scan-login__status-icon is-scanned' }, [
                          t(w, { size: 48, color: 'var(--color-primary-6)' })
                        ]),
                        c('div', { class: 'mobile-scan-login__status-text' }, [Z.value]),
                        c('span', { class: 'mobile-scan-login__status-sub' }, [
                          r('请在移动端完成确认，桌面端会自动继续登录')
                        ]),
                        c('div', { class: 'mobile-scan-login__confirm-actions' }, [
                          c(a, { type: 'default', onClick: Y }, { default: () => [r('取消')] }),
                          c(a, { type: 'primary', onClick: V }, { default: () => [r('确认登录')] })
                        ])
                      ])
                    : 'confirmed' === L.value
                      ? c('div', { class: 'mobile-scan-login__result' }, [
                          c('div', { class: 'mobile-scan-login__status-icon is-success' }, [
                            t(w, { size: 48, color: 'var(--color-success-6)' })
                          ]),
                          c('div', { class: 'mobile-scan-login__status-text' }, [r('登录成功')]),
                          c('span', { class: 'mobile-scan-login__status-sub' }, [r('正在返回应用首页...')])
                        ])
                      : 'expired' === L.value
                        ? c('div', { class: 'mobile-scan-login__result' }, [
                            c('div', { class: 'mobile-scan-login__status-icon is-expired' }, [
                              t(h, { size: 48, color: 'var(--color-warning-6)' })
                            ]),
                            c('div', { class: 'mobile-scan-login__status-text' }, [Z.value]),
                            c(a, { type: 'primary', onClick: G }, { default: () => [r('重新扫码')] })
                          ])
                        : c('div', { class: 'mobile-scan-login__result' }, [
                            c('div', { class: 'mobile-scan-login__status-icon is-error' }, [
                              t(k, { size: 48, color: 'var(--color-danger-6)' })
                            ]),
                            c('div', { class: 'mobile-scan-login__status-text' }, [Z.value]),
                            c(a, { type: 'primary', onClick: G }, { default: () => [r('重试')] })
                          ])
            ])
          ]
        })
    )
  }
})
export { E as default }
