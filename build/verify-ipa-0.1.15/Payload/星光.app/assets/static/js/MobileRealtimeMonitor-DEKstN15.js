import { M as l } from './MobileButton-BKhxhz5A.js'
import { M as e } from './MobileCard-BxmuYclQ.js'
import { M as a } from './MobileTag-ByR2jSPf.js'
import { M as i } from './MobileEmpty-BimvXy70.js'
import { M as s } from './MobileLoading-DlB38x7T.js'
import './MobileToast-CIN42EDh.js'
import { M as t } from './MobileSelect-BOALIWQn.js'
import {
  p as r,
  a0 as n,
  a1 as u,
  aP as c,
  aQ as o,
  Z as v,
  w as m,
  ac as d,
  bJ as _,
  bK as p,
  b2 as h,
  aS as y,
  aR as g,
  a$ as b,
  bL as f,
  aZ as k,
  b3 as w,
  bH as z,
  aW as j,
  ai as x
} from './invariable-DewVS0br.js'
import M from './index-BRz3eDUI.js'
import { L as C } from './LineChart-gPgXHJ75.js'
import { d as S } from './index-DFkcx8xz.js'
import './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import './logs-CT6hSV3d.js'
import './alerts-CIHfuoAx.js'
import './subscription-C610hAN0.js'
import './auth-CpdnJA9r.js'
import './user-CjErkjef.js'
import './microApps-BJHOuFrl.js'
import './BaseChart-FGf3lmW3.js'
function R(l) {
  return 'function' == typeof l || ('[object Object]' === Object.prototype.toString.call(l) && !x(l))
}
const $ = [
    { key: '15m', label: '15m' },
    { key: '1h', label: '1h' },
    { key: '4h', label: '4h' },
    { key: '1d', label: '1d' },
    { key: '7d', label: '7d' }
  ],
  A = (l) => {
    switch (l) {
      case 'healthy':
        return 'var(--color-success-6)'
      case 'warning':
        return 'var(--color-warning-6)'
      case 'critical':
        return 'var(--color-danger-6)'
      default:
        return 'var(--color-text-3)'
    }
  },
  U = (l) => {
    switch (l) {
      case 'healthy':
        return '正常'
      case 'warning':
        return '警告'
      case 'critical':
        return '严重'
      default:
        return '未知'
    }
  },
  q = r({
    name: 'MobileRealtimeMonitor',
    setup() {
      const r = n(S()),
        x = n(null),
        q = n(!1),
        I = n(''),
        P = n(!0),
        L = n('1h'),
        T = n([]),
        B = n({ cpu: null, memory: null, qps: null, latency: null, errorRate: null, connections: null }),
        O = n({ cpu: [], memory: [], latency: [] }),
        Q = n([])
      let V = null,
        E = !1,
        W = !1,
        Z = 0,
        D = 0
      const F = u(() => {
          var l
          return (null == (l = T.value.find((l) => l.id === x.value)) ? void 0 : l.name) || x.value || '选择服务'
        }),
        H = u(() => {
          const l = B.value.cpu
          return null === l ? 'unknown' : l > 80 ? 'critical' : l > 60 ? 'warning' : 'healthy'
        }),
        J = u(() => {
          const l = B.value.memory
          return null === l ? 'unknown' : l > 80 ? 'critical' : l > 60 ? 'warning' : 'healthy'
        }),
        K = u(() => {
          const l = B.value.latency
          return null === l ? 'unknown' : l > 150 ? 'critical' : l > 100 ? 'warning' : 'healthy'
        }),
        X = u(() => {
          const l = B.value.errorRate
          return null === l ? 'unknown' : l > 1 ? 'critical' : l > 0.5 ? 'warning' : 'healthy'
        }),
        Y = async () => {
          var l, e, a, i, s, t, n, u, c
          if (!x.value || W) return
          const o = ++Z
          ;(W = !0), (q.value = !0), (I.value = '')
          try {
            const [v, m, d, _] = await Promise.all([
              M.metrics.fetchServiceDetailSummary(x.value, { scope: r.value }),
              M.metrics.fetchServiceRuntime(x.value, { scope: r.value }),
              M.metrics.fetchOverviewIncidents({ timeRange: `-${L.value}`, scope: r.value }),
              M.metrics.fetchMetricsExplorer({ serviceId: x.value, scope: r.value })
            ])
            if (!E || o !== Z) return
            const p = (null == v ? void 0 : v.summary) || {}
            B.value = {
              cpu: p.cpu ?? null,
              memory: p.memory ?? null,
              qps: p.qps ?? null,
              latency: p.responseTime ?? null,
              errorRate: p.errorRate ?? null,
              connections: p.activeConnections ?? null
            }
            const h = (l) => {
              var e
              return (null == (e = null == l ? void 0 : l[0]) ? void 0 : e.data) || []
            }
            O.value = {
              cpu: h(null == (l = null == _ ? void 0 : _.series) ? void 0 : l.cpu),
              memory: h(null == (e = null == _ ? void 0 : _.series) ? void 0 : e.memory),
              latency: h(null == (a = null == _ ? void 0 : _.series) ? void 0 : a.responseTime)
            }
            const y = Array.isArray(d) ? d.filter((l) => !l.serviceId || l.serviceId === x.value).length : 0
            Q.value = [
              {
                label: '实例',
                status: (null == (i = null == m ? void 0 : m.instances) ? void 0 : i.length) ? 'healthy' : 'unknown',
                detail: `${(null == (s = null == m ? void 0 : m.instances) ? void 0 : s.length) || 0} 个`
              },
              {
                label: 'Metrics',
                status: (null == (t = null == m ? void 0 : m.ingestStatus) ? void 0 : t.metrics)
                  ? 'healthy'
                  : 'unknown',
                detail: (null == (n = null == m ? void 0 : m.ingestStatus) ? void 0 : n.metrics) ? '正常采集' : '无数据'
              },
              {
                label: 'Logs',
                status: (null == (u = null == m ? void 0 : m.ingestStatus) ? void 0 : u.logs) ? 'healthy' : 'unknown',
                detail: (null == (c = null == m ? void 0 : m.ingestStatus) ? void 0 : c.logs) ? '正常采集' : '无数据'
              },
              { label: '事件', status: y > 0 ? 'critical' : 'healthy', detail: `${y} 活跃` }
            ]
          } catch {
            if (!E || o !== Z) return
            ;(I.value = '数据加载失败'),
              (B.value = { cpu: null, memory: null, qps: null, latency: null, errorRate: null, connections: null }),
              (O.value = { cpu: [], memory: [], latency: [] }),
              (Q.value = [])
          } finally {
            ;(W = !1), (q.value = !1)
          }
        },
        G = () => {
          ;(Z += 1), (D += 1), V && (clearInterval(V), (V = null))
        },
        N = () => {
          G(), P.value && E && (V = setInterval(Y, 3e4))
        },
        ll = () => {
          ;(P.value = !P.value), P.value ? (Y(), N()) : G()
        }
      c(async () => {
        ;(E = !0),
          await (async () => {
            const l = ++D
            try {
              const e = await M.metrics.fetchCatalogServices({ page: 1, pageSize: 200, scope: r.value })
              if (!E || l !== D) return
              ;(T.value = ((null == e ? void 0 : e.items) || []).map((l) => {
                var e, a
                return {
                  id: null == (e = l.identity) ? void 0 : e.id,
                  name: null == (a = l.identity) ? void 0 : a.name
                }
              })),
                T.value.length && !x.value && (x.value = T.value[0].id)
            } catch {
              E && l === D && (T.value = [])
            }
          })(),
          E && (x.value && (await Y()), E && N())
      }),
        o(() => {
          ;(E = !1), G()
        }),
        v(() => {
          ;(E = !1), G()
        })
      const el = (l, e = '', a) => ('number' == typeof l ? (void 0 !== a ? l.toFixed(a) + e : l + e) : '--')
      return () => {
        let r, n, u
        return m('div', { class: 'realtime' }, [
          m('div', { class: 'realtime__header' }, [
            m('div', null, [
              m('h2', { class: 'realtime__title' }, [d('实时监控')]),
              m('p', { class: 'realtime__subtitle' }, [F.value])
            ]),
            m('div', { class: 'realtime__header-actions' }, [
              m(
                l,
                {
                  size: 'small',
                  type: P.value ? 'primary' : 'default',
                  onClick: ll,
                  class: P.value ? 'realtime__live-btn is-live' : 'realtime__live-btn',
                  icon: () => (P.value ? m(_, { size: 14 }, null) : m(p, { size: 14 }, null))
                },
                { default: () => [P.value ? '实时' : '暂停'] }
              ),
              m(
                l,
                {
                  size: 'small',
                  type: 'ghost',
                  onClick: Y,
                  class: 'realtime__refresh-btn',
                  'aria-label': '刷新数据',
                  icon: () => m(h, { size: 16 }, null)
                },
                null
              )
            ])
          ]),
          m('div', { class: 'realtime__controls' }, [
            m(
              t,
              {
                modelValue: x.value ?? '',
                'onUpdate:modelValue': (l) => {
                  ;(x.value = l), Y()
                },
                options: T.value.map((l) => ({ label: l.name, value: l.id })),
                placeholder: '选择服务'
              },
              null
            ),
            m('div', { class: 'realtime__time-chips' }, [
              $.map((e) =>
                m(
                  l,
                  {
                    key: e.key,
                    size: 'small',
                    type: L.value === e.key ? 'primary' : 'ghost',
                    onClick: () => {
                      ;(L.value = e.key), Y()
                    }
                  },
                  { default: () => [e.label] }
                )
              )
            ])
          ]),
          q.value && !B.value.cpu
            ? m('div', { class: 'realtime__loading' }, [m(s, { loading: q.value, size: '48px' }, null)])
            : I.value
              ? m('div', { class: 'realtime__error' }, [
                  m(
                    i,
                    { description: I.value },
                    { default: () => [m(l, { size: 'small', onClick: Y }, { default: () => [d('重试')] })] }
                  )
                ])
              : x.value
                ? m(y, null, [
                    m('div', { class: 'realtime__gauges' }, [
                      m('div', { class: 'realtime__gauge' }, [
                        m(
                          'div',
                          {
                            class: 'realtime__gauge-ring',
                            style: { '--pct': `${B.value.cpu ?? 0}`, '--color': A(H.value) }
                          },
                          [
                            m('svg', { viewBox: '0 0 120 120', class: 'realtime__gauge-svg' }, [
                              m(
                                'circle',
                                {
                                  cx: '60',
                                  cy: '60',
                                  r: '52',
                                  fill: 'none',
                                  stroke: 'var(--color-fill-2)',
                                  'stroke-width': '8'
                                },
                                null
                              ),
                              m(
                                'circle',
                                {
                                  cx: '60',
                                  cy: '60',
                                  r: '52',
                                  fill: 'none',
                                  stroke: 'currentColor',
                                  'stroke-width': '8',
                                  'stroke-linecap': 'round',
                                  'stroke-dasharray': ((B.value.cpu ?? 0) / 100) * 327 + ' 327',
                                  transform: 'rotate(-90 60 60)',
                                  class: 'realtime__gauge-arc'
                                },
                                null
                              )
                            ]),
                            m('div', { class: 'realtime__gauge-center' }, [
                              m('span', { class: 'realtime__gauge-value' }, [el(B.value.cpu, '', 1)]),
                              m('span', { class: 'realtime__gauge-unit' }, [d('%')])
                            ])
                          ]
                        ),
                        m('div', { class: 'realtime__gauge-label' }, [g(b, { size: 14 }), m('span', null, [d('CPU')])])
                      ]),
                      m('div', { class: 'realtime__gauge' }, [
                        m(
                          'div',
                          {
                            class: 'realtime__gauge-ring',
                            style: { '--pct': `${B.value.memory ?? 0}`, '--color': A(J.value) }
                          },
                          [
                            m('svg', { viewBox: '0 0 120 120', class: 'realtime__gauge-svg' }, [
                              m(
                                'circle',
                                {
                                  cx: '60',
                                  cy: '60',
                                  r: '52',
                                  fill: 'none',
                                  stroke: 'var(--color-fill-2)',
                                  'stroke-width': '8'
                                },
                                null
                              ),
                              m(
                                'circle',
                                {
                                  cx: '60',
                                  cy: '60',
                                  r: '52',
                                  fill: 'none',
                                  stroke: 'currentColor',
                                  'stroke-width': '8',
                                  'stroke-linecap': 'round',
                                  'stroke-dasharray': ((B.value.memory ?? 0) / 100) * 327 + ' 327',
                                  transform: 'rotate(-90 60 60)',
                                  class: 'realtime__gauge-arc'
                                },
                                null
                              )
                            ]),
                            m('div', { class: 'realtime__gauge-center' }, [
                              m('span', { class: 'realtime__gauge-value' }, [el(B.value.memory, '', 1)]),
                              m('span', { class: 'realtime__gauge-unit' }, [d('%')])
                            ])
                          ]
                        ),
                        m('div', { class: 'realtime__gauge-label' }, [g(f, { size: 14 }), m('span', null, [d('内存')])])
                      ])
                    ]),
                    m('div', { class: 'realtime__pills' }, [
                      m('div', { class: 'realtime__pill' }, [
                        m('div', { class: ['realtime__pill-icon', `realtime__pill-icon--${X.value}`] }, [
                          g(k, { size: 16 })
                        ]),
                        m('div', { class: 'realtime__pill-body' }, [
                          m('span', { class: 'realtime__pill-value' }, [el(B.value.errorRate, '%', 2)]),
                          m('span', { class: 'realtime__pill-label' }, [d('错误率')])
                        ])
                      ]),
                      m('div', { class: 'realtime__pill' }, [
                        m('div', { class: ['realtime__pill-icon', `realtime__pill-icon--${K.value}`] }, [
                          g(w, { size: 16 })
                        ]),
                        m('div', { class: 'realtime__pill-body' }, [
                          m('span', { class: 'realtime__pill-value' }, [el(B.value.latency, 'ms', 0)]),
                          m('span', { class: 'realtime__pill-label' }, [d('延迟')])
                        ])
                      ]),
                      m('div', { class: 'realtime__pill' }, [
                        m('div', { class: 'realtime__pill-icon realtime__pill-icon--healthy' }, [g(z, { size: 16 })]),
                        m('div', { class: 'realtime__pill-body' }, [
                          m('span', { class: 'realtime__pill-value' }, [el(B.value.qps)]),
                          m('span', { class: 'realtime__pill-label' }, [d('QPS')])
                        ])
                      ]),
                      m('div', { class: 'realtime__pill' }, [
                        m('div', { class: 'realtime__pill-icon realtime__pill-icon--healthy' }, [g(j, { size: 16 })]),
                        m('div', { class: 'realtime__pill-body' }, [
                          m('span', { class: 'realtime__pill-value' }, [el(B.value.connections)]),
                          m('span', { class: 'realtime__pill-label' }, [d('连接')])
                        ])
                      ])
                    ]),
                    m('div', { class: 'realtime__health' }, [
                      Q.value.map((l) =>
                        m('div', { key: l.label, class: 'realtime__health-item' }, [
                          m('div', { class: ['realtime__health-dot', `realtime__health-dot--${l.status}`] }, null),
                          m('span', { class: 'realtime__health-label' }, [l.label]),
                          m('span', { class: 'realtime__health-detail' }, [l.detail])
                        ])
                      )
                    ]),
                    m('div', { class: 'realtime__charts' }, [
                      m('div', { class: 'realtime__chart' }, [
                        m(
                          e,
                          { bordered: !1, size: 'small', class: 'realtime__chart-card' },
                          {
                            default: () => [
                              m('div', { class: 'realtime__chart-head' }, [
                                g(b, { size: 14 }),
                                m('span', null, [d('CPU')]),
                                m(
                                  a,
                                  {
                                    size: 'small',
                                    type:
                                      'healthy' === H.value ? 'success' : 'warning' === H.value ? 'warning' : 'danger'
                                  },
                                  R((r = U(H.value))) ? r : { default: () => [r] }
                                )
                              ]),
                              m(
                                C,
                                {
                                  data: O.value.cpu,
                                  title: '',
                                  height: '160px',
                                  area: !0,
                                  variant: 'monitor',
                                  yAxisUnit: '%',
                                  yAxisMax: 100
                                },
                                null
                              )
                            ]
                          }
                        )
                      ]),
                      m('div', { class: 'realtime__chart' }, [
                        m(
                          e,
                          { bordered: !1, size: 'small', class: 'realtime__chart-card' },
                          {
                            default: () => [
                              m('div', { class: 'realtime__chart-head' }, [
                                g(f, { size: 14 }),
                                m('span', null, [d('内存')]),
                                m(
                                  a,
                                  {
                                    size: 'small',
                                    type:
                                      'healthy' === J.value ? 'success' : 'warning' === J.value ? 'warning' : 'danger'
                                  },
                                  R((n = U(J.value))) ? n : { default: () => [n] }
                                )
                              ]),
                              m(
                                C,
                                {
                                  data: O.value.memory,
                                  title: '',
                                  height: '160px',
                                  area: !0,
                                  variant: 'monitor',
                                  yAxisUnit: '%',
                                  yAxisMax: 100
                                },
                                null
                              )
                            ]
                          }
                        )
                      ]),
                      m('div', { class: 'realtime__chart' }, [
                        m(
                          e,
                          { bordered: !1, size: 'small', class: 'realtime__chart-card' },
                          {
                            default: () => [
                              m('div', { class: 'realtime__chart-head' }, [
                                g(w, { size: 14 }),
                                m('span', null, [d('延迟')]),
                                m(
                                  a,
                                  {
                                    size: 'small',
                                    type:
                                      'healthy' === K.value ? 'success' : 'warning' === K.value ? 'warning' : 'danger'
                                  },
                                  R((u = U(K.value))) ? u : { default: () => [u] }
                                )
                              ]),
                              m(
                                C,
                                {
                                  data: O.value.latency,
                                  title: '',
                                  height: '160px',
                                  variant: 'monitor',
                                  yAxisUnit: 'ms'
                                },
                                null
                              )
                            ]
                          }
                        )
                      ])
                    ])
                  ])
                : m('div', { class: 'realtime__error' }, [m(i, { description: '请选择服务查看实时数据' }, null)])
        ])
      }
    }
  })
export { q as default }
