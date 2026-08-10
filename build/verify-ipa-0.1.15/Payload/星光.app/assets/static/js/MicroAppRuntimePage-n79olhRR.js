import {
  p as e,
  r as t,
  a0 as a,
  a1 as n,
  a3 as o,
  cC as i,
  w as r,
  a6 as s,
  ch as l,
  dx as u,
  cv as c,
  c0 as d,
  dy as v,
  dz as p,
  ba as m
} from './invariable-DewVS0br.js'
import { i as w } from './microApps-BJHOuFrl.js'
import { l as h } from './index-DFkcx8xz.js'
import { c as f, b as g, d as y, e as b } from './localMicroAppStore-6ECFm6cb.js'
import './request-BiInMBwl.js'
const M = ['.n-message-container', '.n-popover', '.n-dropdown-menu'].join(','),
  x = e({
    name: 'MicroAppRuntimePage',
    setup() {
      const e = m(),
        x = t(),
        A = a(null),
        L = a(!1),
        E = a(''),
        S = a(''),
        _ = a(null),
        R = n(() => String(e.query.previewKey || '')),
        B = n(() => String(e.params.appId || ''))
      let C = null,
        j = null,
        z = 0
      const k = () => {
          z ||
            (z = window.requestAnimationFrame(() => {
              ;(z = 0),
                (async () => {
                  const e = A.value,
                    t = _.value
                  if (!e || !t) return
                  const a = e.getBoundingClientRect(),
                    n = Array.from(document.querySelectorAll(M)).reduce((e, t) => {
                      if (
                        !((e) => {
                          const t = e.getBoundingClientRect()
                          if (t.width <= 0 || t.height <= 0) return !1
                          const a = window.getComputedStyle(e)
                          return 'none' !== a.display && 'hidden' !== a.visibility && '0' !== a.opacity
                        })(t)
                      )
                        return e
                      const n = t.getBoundingClientRect(),
                        o = n.right > a.left && n.left < a.right,
                        i = n.bottom > a.top && n.top < a.bottom
                      return o && i ? Math.max(e, n.bottom) : e
                    }, a.top),
                    o = Math.max(a.top, a.bottom - 160),
                    i = Math.min(Math.max(a.top, n + 8), o)
                  await t.setPosition(new u(Math.round(a.left), Math.round(i))),
                    await t.setSize(new c(Math.max(1, Math.round(a.width)), Math.max(1, Math.round(a.bottom - i))))
                })()
            }))
        },
        I = async () => {
          const e = _.value
          ;(_.value = null), e && (await e.close().catch(() => {}))
        },
        q = async (e) => {
          if (!Boolean(window.__TAURI_INTERNALS__))
            return void (E.value = '当前环境不支持原生 Webview，请在 StarLight 桌面端中打开微应用。')
          await I(), await d()
          const t = A.value
          if (!t) return
          const a = t.getBoundingClientRect(),
            n = new URL(e),
            [o, i] = n.pathname.split('/').filter(Boolean)
          if (!o || !i) throw new Error('微应用运行地址缺少包身份')
          const r = `micro_app_${o}:${i}`,
            s = await v.getByLabel(r)
          s && (await s.close().catch(() => {}))
          const l = new v(p(), r, {
            url: e,
            x: Math.round(a.left),
            y: Math.round(a.top),
            width: Math.max(1, Math.round(a.width)),
            height: Math.max(1, Math.round(a.height)),
            focus: !0,
            incognito: Boolean(R.value),
            dragDropEnabled: !1,
            backgroundColor: '#ffffff'
          })
          ;(_.value = l),
            await l.once('tauri://created', () => {
              k()
            }),
            await l.once('tauri://error', (e) => {
              const t = 'string' == typeof e.payload && e.payload ? `：${e.payload}` : ''
              E.value = `微应用 Webview 创建失败${t}`
            })
        }
      return (
        o(() => {
          ;(C = new ResizeObserver(k)),
            A.value && C.observe(A.value),
            (j = new MutationObserver(k)),
            j.observe(document.body, {
              attributes: !0,
              attributeFilter: ['class', 'style'],
              childList: !0,
              subtree: !0
            }),
            window.addEventListener('resize', k),
            window.addEventListener('scroll', k, !0),
            document.addEventListener('click', k, !0),
            document.addEventListener('keydown', k, !0),
            (async () => {
              ;(L.value = !0), (E.value = '')
              try {
                if (R.value) {
                  const e = g(R.value)
                  return e
                    ? ((S.value = e.runtimeUrl), void (await q(e.runtimeUrl)))
                    : void (E.value = '预览内容已失效，请回到微应用页面重新预览。')
                }
                const e = await y(B.value)
                if (!e) return void (E.value = '该微应用尚未下载到本地，请先回到微应用列表下载。')
                const t = {
                  ...(await w({ appId: e.appId, version: e.version })),
                  endpoints: { exchangeSession: h.microAppExchangeSession, scopedApi: h.microAppScopedApi }
                }
                ;(S.value = await b(e, t)), await q(S.value)
              } catch (e) {
                ;(E.value = '微应用 Webview 加载失败，请确认包内容和访问权限。'), x.error(E.value)
              } finally {
                L.value = !1
              }
            })()
        }),
        i(() => {
          null == C || C.disconnect(),
            null == j || j.disconnect(),
            z && window.cancelAnimationFrame(z),
            window.removeEventListener('resize', k),
            window.removeEventListener('scroll', k, !0),
            document.removeEventListener('click', k, !0),
            document.removeEventListener('keydown', k, !0),
            R.value && f(R.value),
            I()
        }),
        () =>
          r('div', { class: 'micro-app-runtime', ref: A }, [
            L.value && r('div', { class: 'micro-app-runtime__state' }, [r(s, { size: 'large' }, null)]),
            E.value && r('div', { class: 'micro-app-runtime__state' }, [r(l, { description: E.value }, null)])
          ])
      )
    }
  })
export { x as default }
