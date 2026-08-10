var e,
  t,
  n,
  a,
  s,
  i,
  r,
  o,
  c,
  l,
  h = Object.defineProperty,
  w = (e) => {
    throw TypeError(e)
  },
  d = (e, t, n) =>
    ((e, t, n) => (t in e ? h(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n)))(
      e,
      'symbol' != typeof t ? t + '' : t,
      n
    ),
  p = (e, t, n) => t.has(e) || w('Cannot ' + n),
  m = (e, t, n) => (p(e, t, 'read from private field'), n ? n.call(e) : t.get(e)),
  g = (e, t, n) =>
    t.has(e) ? w('Cannot add the same private member more than once') : t instanceof WeakSet ? t.add(e) : t.set(e, n),
  u = (e, t, n, a) => (p(e, t, 'write to private field'), a ? a.call(e, n) : t.set(e, n), n)
import { u as f } from './useMitt-UjCuZB1B.js'
import { h as y, b as v, p as S, a as k, g as O, n as M, W } from './index-DFkcx8xz.js'
import { o as b, a0 as C, t as L, de as T, W as E, a4 as N, k as R } from './invariable-DewVS0br.js'
import I from './index-BRz3eDUI.js'
const P = b(y.USER, () => {
    const e = C({}),
      t = C(!1)
    return {
      userInfo: e,
      isSign: t,
      getUserDetailAction: (t) => {
        I.user
          .getUserInfo(t)
          .then((t) => {
            const n = {
              ...v(),
              ...e.value,
              ...t,
              isAdmin: 'boolean' == typeof (null == t ? void 0 : t.isAdmin) && t.isAdmin
            }
            ;(e.value = n), S(e.value)
          })
          .catch((e) => {})
      }
    }
  }),
  A = new Worker(new URL('/assets/fingerprint.worker-YJlH5EJ4.js', import.meta.url), { type: 'module' })
let D = null
const J = new Worker(new URL('/assets/webSocket.worker-BNNU-oH3.js', import.meta.url), { type: 'module' })
let U = !1
const j = new ((l = class {
  constructor() {
    g(this, o),
      g(this, e, 100),
      g(this, t, []),
      g(this, n, !1),
      g(this, a, new Map()),
      g(this, s, null),
      d(this, 'initConnect', async () => {
        const { accessToken: e } = O(),
          t = await (async () =>
            D ||
            ((D = (async () => {
              performance.now()
              try {
                const t = localStorage.getItem('deviceFingerprint')
                if (t) {
                  const { fingerprint: e, timestamp: n } = JSON.parse(t)
                  if (Date.now() - n < 864e5) return performance.now(), e
                }
                performance.now()
                let n = 'unknown'
                try {
                  n = await L()
                } catch (e) {}
                const a = {
                    platform: n,
                    screenSize: `${window.screen.width}x${window.screen.height}`,
                    pixelRatio: window.devicePixelRatio,
                    colorDepth: window.screen.colorDepth,
                    hardwareConcurrency: navigator.hardwareConcurrency || void 0,
                    deviceMemory: navigator.deviceMemory,
                    language: navigator.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                  },
                  s = (performance.now(), performance.now(), await T.load()),
                  i = await s.get({ debug: !1 }),
                  r =
                    (performance.now(),
                    performance.now(),
                    await new Promise((e) => {
                      const t = (n) => {
                        const { type: a, fingerprint: s } = n.data
                        'fingerprintGenerated' === a && (A.removeEventListener('message', t), e(s))
                      }
                      A.addEventListener('message', t),
                        A.postMessage({ type: 'generateFingerprint', deviceInfo: a, browserFingerprint: i.visitorId })
                    }))
                return (
                  performance.now(),
                  r &&
                    localStorage.setItem(
                      'deviceFingerprint',
                      JSON.stringify({ fingerprint: r, timestamp: Date.now() })
                    ),
                  performance.now(),
                  r
                )
              } catch (t) {
                return performance.now(), ''
              } finally {
                D = null
              }
            })()),
            D))(),
          n = localStorage.getItem('webSocketClientId'),
          a = t || n || crypto.randomUUID()
        t || n || localStorage.setItem('webSocketClientId', a),
          J.postMessage(JSON.stringify({ type: 'initWS', value: { token: e || null, clientId: a } }))
      }),
      d(this, 'ensureConnected', async () => {
        m(this, n) || (await this.initConnect())
      }),
      d(this, 'onWorkerMsg', async (e) => {
        const t = JSON.parse(e.data)
        switch (t.type) {
          case M.MESSAGE:
            await this.onMessage(t.value), U && (await R('ws-message', t.value))
            break
          case M.OPEN:
            m(this, r).call(this)
            break
          case M.CLOSE:
          case M.ERROR:
            m(this, i).call(this)
            break
          case M.WS_ERROR:
            f.emit(W.NO_INTERNET, t.value),
              t.value.msg.includes('连接失败次数过多') && f.emit('wsReconnectFailed', t.value)
            break
          case 'connectionStateChange': {
            const { state: e } = t.value
            f.emit('wsConnectionStateChange', e), U && (await R('ws-state-change', e))
            break
          }
        }
      }),
      g(this, i, () => {
        u(this, n, !1)
      }),
      g(this, r, () => {
        u(this, n, !0),
          setTimeout(() => {
            if (P().isSign) {
              for (const e of m(this, t)) this.send(e)
              u(this, t, [])
            }
          }, 500)
      }),
      d(this, 'send', (a) => {
        var s, i, r
        U
          ? m(this, n)
            ? ((s = this), (i = o), (r = c), p(s, i, 'access private method'), r).call(this, a)
            : (m(this, t).length >= m(this, e) && m(this, t).shift(), m(this, t).push(a))
          : R('ws-send', a)
      }),
      d(this, 'onMessage', async (e) => {
        try {
          const t = JSON.parse(e)
          switch ((f.emit('wsRawMessage', t), t.type)) {
            case W.TOPOLOGY_SNAPSHOT:
              f.emit(W.TOPOLOGY_SNAPSHOT, t.data)
              break
            case W.TOPOLOGY_DELTA:
              f.emit(W.TOPOLOGY_DELTA, t.data)
          }
        } catch (t) {
          return
        }
      }),
      this.initialize()
  }
  async initialize() {
    await this.initWindowType(),
      U && (await this.initConnect(), J.addEventListener('message', this.onWorkerMsg), this.initMainWindowListeners())
  }
  async initWindowType() {
    const e = E.getCurrent()
    ;(U = 'home' === e.label), U || (await this.initChildWindowListeners())
  }
  async initChildWindowListeners() {
    u(this, s, k()),
      m(this, s).addListener(
        N('ws-message', (e) => {
          this.onMessage(e.payload)
        })
      ),
      m(this, s).addListener(
        N('ws-state-change', (e) => {
          const t = e.payload
          f.emit('wsConnectionStateChange', t)
        })
      )
  }
  async initMainWindowListeners() {
    u(this, s, k()),
      m(this, s).addListener(
        N('ws-send', (e) => {
          this.send(e.payload)
        })
      )
  }
  get isConnected() {
    return m(this, n)
  }
  destroy() {
    var e
    J.postMessage(JSON.stringify({ type: 'clearReconnectTimer' })),
      J.terminate(),
      u(this, t, []),
      m(this, a).clear(),
      u(this, n, !1),
      null == (e = m(this, s)) || e.cleanup()
  }
}),
(e = new WeakMap()),
(t = new WeakMap()),
(n = new WeakMap()),
(a = new WeakMap()),
(s = new WeakMap()),
(i = new WeakMap()),
(r = new WeakMap()),
(o = new WeakSet()),
(c = function (e) {
  J.postMessage(`{"type":"message","value":${'string' == typeof e ? e : JSON.stringify(e)}}`)
}),
l)()
export { j as w }
