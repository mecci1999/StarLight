import {
  p as e,
  a0 as l,
  aP as r,
  a2 as a,
  a1 as s,
  w as i,
  ac as t,
  aR as o,
  aS as m,
  ba as c,
  b2 as n,
  b3 as u,
  ai as p
} from './invariable-DewVS0br.js'
import { M as d } from './MobileButton-BKhxhz5A.js'
import { M as v } from './MobileCard-BxmuYclQ.js'
import './MobileToast-CIN42EDh.js'
import { M as _ } from './MobileEmpty-BimvXy70.js'
import { M as b } from './MobileLoading-DlB38x7T.js'
import { M as y } from './MobileSelect-BOALIWQn.js'
import { f as x, j as h } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { d as f } from './index-DFkcx8xz.js'
import { L as k } from './LineChart-gPgXHJ75.js'
import { p as g } from './investigationContext-7xMjfbkf.js'
import './BaseChart-FGf3lmW3.js'
const j = [
    { key: '15m', label: '15分', value: '-15m' },
    { key: '1h', label: '1时', value: '-1h' },
    { key: '4h', label: '4时', value: '-4h' },
    { key: '1d', label: '1天', value: '-1d' },
    { key: '7d', label: '7天', value: '-7d' }
  ],
  C = (e) => j.some((l) => l.key === e),
  M = [
    {
      key: 'cpu',
      label: 'CPU',
      color: 'var(--color-primary-6)',
      dotClass: 'mobile-metrics-explorer__chart-dot--cpu',
      unit: '%'
    },
    {
      key: 'memory',
      label: '内存',
      color: 'var(--color-warning-6)',
      dotClass: 'mobile-metrics-explorer__chart-dot--memory',
      unit: '%'
    },
    {
      key: 'qps',
      label: 'QPS',
      color: 'var(--color-success-6)',
      dotClass: 'mobile-metrics-explorer__chart-dot--qps',
      unit: ''
    },
    {
      key: 'responseTime',
      label: '响应时间',
      color: 'var(--color-danger-6)',
      dotClass: 'mobile-metrics-explorer__chart-dot--response',
      unit: 'ms'
    }
  ],
  q = e({
    name: 'MobileMetricsExplorer',
    setup() {
      const e = c(),
        q = l(!1),
        z = l(!1),
        T = l(null),
        w = l([]),
        I = l(!1),
        P = l(null),
        S = l('1h'),
        $ = l(['cpu', 'memory', 'qps', 'responseTime']),
        U = async () => {
          I.value = !1
          try {
            const e = await x({ page: 1, pageSize: 200, scope: f() }),
              l = (null == e ? void 0 : e.items) || []
            w.value = l.map((e) => {
              var l, r
              return {
                label: (null == (l = e.identity) ? void 0 : l.name) || '-',
                value: (null == (r = e.identity) ? void 0 : r.id) || ''
              }
            })
          } catch {
            ;(w.value = []), (I.value = !0)
          }
        },
        L = async () => {
          ;(q.value = !0), (z.value = !1)
          try {
            if (!P.value) return void (T.value = null)
            const l = g(e.query),
              r = j.find((e) => e.key === S.value),
              a = await h({
                serviceId: P.value,
                ...(void 0 !== l.start && void 0 !== l.end
                  ? { startTime: l.start, endTime: l.end }
                  : { timeRange: l.range ? `-${l.range}` : null == r ? void 0 : r.value }),
                scope: f()
              })
            T.value = a
          } catch {
            ;(z.value = !0), (T.value = null)
          } finally {
            q.value = !1
          }
        }
      r(async () => {
        const l = g(e.query)
        l.serviceId && (P.value = l.serviceId), C(l.range) && (S.value = l.range), await U(), P.value && (await L())
      }),
        a(
          () => e.query,
          () => {
            const l = g(e.query)
            void 0 !== l.serviceId && (P.value = l.serviceId),
              C(l.range) && (S.value = l.range),
              (void 0 === l.serviceId && void 0 === l.range && void 0 === l.start) || L()
          }
        )
      const O = s(() => {
          if (!T.value) return { cpu: null, memory: null, qps: null, responseTime: null }
          const e = T.value.series,
            l = (e) => {
              var l, r
              if (!e || 0 === e.length || !(null == (r = null == (l = e[0]) ? void 0 : l.data) ? void 0 : r.length))
                return null
              const a = e[0].data.filter((e) => null !== e.value)
              return a.length > 0 ? a[a.length - 1].value : null
            }
          return { cpu: l(e.cpu), memory: l(e.memory), qps: l(e.qps), responseTime: l(e.responseTime) }
        }),
        V = (e, l) =>
          null == e ? '-' : '%' === l ? `${Math.round(e)}%` : 'ms' === l ? `${Math.round(e)}ms` : `${Math.round(e)}`,
        B = (e) => $.value.includes(e)
      return () => {
        let e
        return i('div', { class: 'mobile-metrics-explorer' }, [
          i('div', { class: 'mobile-metrics-explorer__header' }, [
            i('div', null, [i('h2', { class: 'mobile-metrics-explorer__title' }, [t('指标分析')])]),
            i(
              d,
              {
                size: 'small',
                type: 'primary',
                class: 'mobile-metrics-explorer__refresh-action',
                onClick: L,
                'aria-label': '刷新指标数据'
              },
              ((l = e = o(n, { size: 16 })),
              'function' == typeof l || ('[object Object]' === Object.prototype.toString.call(l) && !p(l))
                ? e
                : { default: () => [e] })
            )
          ]),
          i('div', { class: 'mobile-metrics-explorer__service-select' }, [
            i(
              y,
              {
                modelValue: P.value ?? '',
                'onUpdate:modelValue': (e) => {
                  ;(P.value = e), L()
                },
                options: w.value,
                placeholder: '选择服务',
                clearable: !0
              },
              null
            ),
            I.value &&
              i('div', { class: 'mobile-metrics-explorer__selector-error', role: 'alert' }, [
                i('span', null, [t('服务列表加载失败')]),
                i(d, { size: 'small', type: 'ghost', onClick: U }, { default: () => [t('重试')] })
              ])
          ]),
          i('div', { class: 'mobile-metrics-explorer__time-chips' }, [
            j.map((e) =>
              i(
                d,
                {
                  key: e.key,
                  size: 'small',
                  type: S.value === e.key ? 'primary' : 'default',
                  onClick: () => {
                    ;(S.value = e.key), L()
                  }
                },
                { default: () => [e.label] }
              )
            )
          ]),
          q.value
            ? i('div', { class: 'mobile-metrics-explorer__loading' }, [i(b, null, null)])
            : z.value
              ? i(
                  _,
                  { description: '数据加载失败，请检查网络连接后重试', class: 'mobile-metrics-explorer__error' },
                  {
                    default: () => [
                      i(d, { type: 'primary', size: 'small', onClick: L }, { default: () => [t('重新加载')] })
                    ]
                  }
                )
              : P.value
                ? T.value
                  ? i(m, null, [
                      i('div', { class: 'mobile-metrics-explorer__metrics-grid' }, [
                        i(
                          v,
                          { size: 'small', bordered: !1, class: 'mobile-metrics-explorer__metric-card' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-metrics-explorer__metric-header' }, [
                                i(
                                  'span',
                                  {
                                    class:
                                      'mobile-metrics-explorer__metric-dot mobile-metrics-explorer__metric-dot--cpu'
                                  },
                                  null
                                ),
                                i('span', { class: 'mobile-metrics-explorer__metric-name' }, [t('CPU')])
                              ]),
                              i('div', { class: 'mobile-metrics-explorer__metric-value' }, [V(O.value.cpu, '%')])
                            ]
                          }
                        ),
                        i(
                          v,
                          { size: 'small', bordered: !1, class: 'mobile-metrics-explorer__metric-card' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-metrics-explorer__metric-header' }, [
                                i(
                                  'span',
                                  {
                                    class:
                                      'mobile-metrics-explorer__metric-dot mobile-metrics-explorer__metric-dot--memory'
                                  },
                                  null
                                ),
                                i('span', { class: 'mobile-metrics-explorer__metric-name' }, [t('内存')])
                              ]),
                              i('div', { class: 'mobile-metrics-explorer__metric-value' }, [V(O.value.memory, '%')])
                            ]
                          }
                        ),
                        i(
                          v,
                          { size: 'small', bordered: !1, class: 'mobile-metrics-explorer__metric-card' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-metrics-explorer__metric-header' }, [
                                i(
                                  'span',
                                  {
                                    class:
                                      'mobile-metrics-explorer__metric-dot mobile-metrics-explorer__metric-dot--qps'
                                  },
                                  null
                                ),
                                i('span', { class: 'mobile-metrics-explorer__metric-name' }, [t('QPS')])
                              ]),
                              i('div', { class: 'mobile-metrics-explorer__metric-value' }, [V(O.value.qps, '')])
                            ]
                          }
                        ),
                        i(
                          v,
                          { size: 'small', bordered: !1, class: 'mobile-metrics-explorer__metric-card' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-metrics-explorer__metric-header' }, [
                                i(
                                  'span',
                                  {
                                    class:
                                      'mobile-metrics-explorer__metric-dot mobile-metrics-explorer__metric-dot--response'
                                  },
                                  null
                                ),
                                i('span', { class: 'mobile-metrics-explorer__metric-name' }, [t('响应时间')])
                              ]),
                              i('div', { class: 'mobile-metrics-explorer__metric-value' }, [
                                V(O.value.responseTime, 'ms')
                              ])
                            ]
                          }
                        )
                      ]),
                      i('div', { class: 'mobile-metrics-explorer__charts-section' }, [
                        i('div', { class: 'mobile-metrics-explorer__section-header' }, [
                          i('div', { class: 'mobile-metrics-explorer__section-title' }, [
                            o(u, { size: 16 }),
                            i('span', null, [t('趋势图表')])
                          ])
                        ]),
                        i('div', { class: 'mobile-metrics-explorer__metric-selector' }, [
                          M.map((e) =>
                            i(
                              d,
                              {
                                key: e.key,
                                size: 'small',
                                type: B(e.key) ? 'primary' : 'default',
                                onClick: () => {
                                  return (
                                    (l = e.key),
                                    void ($.value.indexOf(l) >= 0
                                      ? $.value.length > 1 && ($.value = $.value.filter((e) => e !== l))
                                      : ($.value = [...$.value, l]))
                                  )
                                  var l
                                }
                              },
                              { default: () => [e.label] }
                            )
                          )
                        ]),
                        i('div', { class: 'mobile-metrics-explorer__charts' }, [
                          M.filter((e) => B(e.key)).map((e) => {
                            const l = ((e) => {
                              if (!T.value) return []
                              const l = T.value.series[e]
                              return l && 0 !== l.length
                                ? (l[0].data || [])
                                    .filter((e) => null !== e.value)
                                    .map((e) => ({ timestamp: e.timestamp, value: e.value }))
                                : []
                            })(e.key)
                            return i(
                              v,
                              { key: e.key, size: 'small', bordered: !1, class: 'mobile-metrics-explorer__chart-card' },
                              {
                                default: () => [
                                  i('div', { class: 'mobile-metrics-explorer__chart-header' }, [
                                    i('div', { class: 'mobile-metrics-explorer__chart-title' }, [
                                      i('span', { class: ['mobile-metrics-explorer__chart-dot', e.dotClass] }, null),
                                      i('span', null, [e.label, t(' 趋势')])
                                    ])
                                  ]),
                                  i('div', { class: 'mobile-metrics-explorer__chart-body' }, [
                                    l.length > 0
                                      ? i(
                                          k,
                                          {
                                            data: l,
                                            color: e.color,
                                            height: '200px',
                                            variant: 'monitor',
                                            area: !0,
                                            loading: q.value
                                          },
                                          null
                                        )
                                      : i(
                                          _,
                                          {
                                            description: `暂无${e.label}数据`,
                                            class: 'mobile-metrics-explorer__empty-state'
                                          },
                                          null
                                        )
                                  ])
                                ]
                              }
                            )
                          })
                        ])
                      ])
                    ])
                  : i('div', { class: 'mobile-metrics-explorer__empty-state' }, [
                      i(_, { description: '暂无指标数据' }, null)
                    ])
                : i('div', { class: 'mobile-metrics-explorer__empty-state' }, [
                    i(_, { description: '请先选择服务' }, null)
                  ])
        ])
        var l
      }
    }
  })
export { q as default }
