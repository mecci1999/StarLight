import {
  p as e,
  a0 as a,
  a1 as l,
  aP as r,
  a2 as t,
  w as s,
  ac as i,
  aR as o,
  aS as c,
  ba as n,
  b2 as u,
  aU as d,
  b3 as p,
  aZ as v,
  bF as m,
  aL as _,
  ai as b
} from './invariable-DewVS0br.js'
import { M as x } from './MobileButton-BKhxhz5A.js'
import { M as f } from './MobileCard-BxmuYclQ.js'
import { M as w } from './MobileTag-ByR2jSPf.js'
import { M as h } from './MobileEmpty-BimvXy70.js'
import { M as y } from './MobileLoading-DlB38x7T.js'
import { M as g } from './MobileInput-OCuvcoNh.js'
import './MobileToast-CIN42EDh.js'
import { M as k } from './MobileSheet-BNn0TOks.js'
import { M } from './MobileSelect-BOALIWQn.js'
import { M as z } from './MobileGrid-sIXQCLxa.js'
import { s as C, g as j } from './trace-CcV2hmWD.js'
import { f as T } from './metrics-uVJcD6zf.js'
import { r as I, p as S } from './investigationContext-7xMjfbkf.js'
import './request-BiInMBwl.js'
import './index-DFkcx8xz.js'
function N(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !b(e))
}
const A = e({
  name: 'MobileTraceExplorer',
  setup() {
    const e = n(),
      b = a(!1),
      A = a(!1),
      V = a([]),
      q = a(''),
      D = a(null),
      U = a(null),
      E = a(null),
      L = a(''),
      $ = a([]),
      O = a(20),
      P = l(() => O.value < Q.value.length),
      W = a(!1),
      Z = a(!1),
      B = a(!1),
      F = a([]),
      G = a(null),
      K = a(''),
      R = [
        { label: '全部状态', value: '' },
        { label: '正常', value: 'ok' },
        { label: '异常', value: 'error' }
      ],
      X = [
        { label: '全部耗时', value: '' },
        { label: '快 (<100ms)', value: 'fast' },
        { label: '中 (100-500ms)', value: 'medium' },
        { label: '慢 (500ms-1s)', value: 'slow' },
        { label: '非常慢 (>1s)', value: 'very-slow' }
      ],
      Y = (e) => {
        const a = String(e || '').trim()
        return a.startsWith('system:') ? a.slice(7) : a
      },
      H = (e) => 'object' == typeof e && null !== e && !Array.isArray(e),
      J = async () => {
        ;(b.value = !0), (A.value = !1)
        try {
          const a = await C(
              (() => {
                const a = S(e.query),
                  l = { limit: 100 },
                  r = q.value.trim()
                r && (32 === r.length || 16 === r.length ? (l.traceId = r) : (l.service = r)),
                  D.value && (l.service = Y(D.value)),
                  a.serviceName && (l.service = a.serviceName)
                const t = I(a)
                return t && ((l.startTime = t.start), (l.endTime = t.end)), l
              })()
            ),
            l = Array.isArray(a) ? a : [],
            r = new Map()
          l.forEach((e) => {
            var a
            ;(!r.has(e.traceId) || (!e.parentId && (null == (a = r.get(e.traceId)) ? void 0 : a.parentId))) &&
              r.set(e.traceId, e)
          }),
            (V.value = Array.from(r.values()).sort((e, a) => (a.startTime ?? 0) - (e.startTime ?? 0))),
            (O.value = 20)
        } catch {
          A.value = !0
        } finally {
          b.value = !1
        }
      }
    r(() => {
      const a = S(e.query)
      a.serviceName && (D.value = a.serviceName),
        (async () => {
          try {
            const e = await T({ page: 1, pageSize: 200, scope: 'tenant' }),
              a = H(e) && Array.isArray(e.items) ? e.items : []
            $.value = a.flatMap((e) => {
              if (!H(e) || !H(e.identity)) return []
              const a = e.identity.id,
                l = e.identity.name,
                r = 'string' == typeof l ? l : 'string' == typeof a ? a : ''
              return r ? [{ label: r, value: Y(r) }] : []
            })
          } catch {
            $.value = []
          }
        })(),
        J()
    }),
      t(
        () => e.query,
        () => {
          const a = S(e.query)
          void 0 !== a.serviceName && (D.value = a.serviceName),
            (void 0 === a.serviceName && void 0 === a.range && void 0 === a.start) || J()
        }
      )
    const Q = l(() => {
        let e = V.value
        if ((U.value && (e = e.filter((e) => e.status === U.value)), L.value.trim())) {
          const a = L.value.trim().toLowerCase()
          e = e.filter((e) => (e.name || '').toLowerCase().includes(a))
        }
        return (
          E.value &&
            (e = e.filter((e) => {
              const a = e.duration ?? 0
              switch (E.value) {
                case 'fast':
                  return a < 100
                case 'medium':
                  return a >= 100 && a < 500
                case 'slow':
                  return a >= 500 && a < 1e3
                case 'very-slow':
                  return a >= 1e3
                default:
                  return !0
              }
            })),
          e
        )
      }),
      ee = l(() => Q.value.slice(0, O.value)),
      ae = () => {
        O.value = Math.min(O.value + 20, Q.value.length)
      },
      le = () => {
        ;(D.value = null), (U.value = null), (E.value = null), (L.value = ''), (q.value = ''), J()
      },
      re = l(() => D.value || U.value || E.value || L.value.trim()),
      te = l(() => {
        const e = Q.value.length
        return {
          total: e,
          healthy: Q.value.filter((e) => 'ok' === e.status).length,
          errorCount: Q.value.filter((e) => 'ok' !== e.status).length,
          avgDuration: e > 0 ? Math.round(Q.value.reduce((e, a) => e + (a.duration ?? 0), 0) / e) : 0
        }
      }),
      se = (e) => ('ok' === e ? '正常' : 'error' === e ? '异常' : e || '未知'),
      ie = async (a) => {
        ;(K.value = a), (W.value = !0), (G.value = null), (Z.value = !0), (B.value = !1)
        try {
          const l = I(S(e.query)),
            r = await j(a, l ? { startTime: l.start, endTime: l.end } : void 0)
          F.value = r.sort((e, a) => (e.startTime ?? 0) - (a.startTime ?? 0))
        } catch {
          ;(F.value = []), (B.value = !0)
        } finally {
          Z.value = !1
        }
      },
      oe = l(() => {
        const e = new Set(F.value.map((e) => e.service)),
          a = F.value.filter((e) => 'ok' !== e.status).length
        return { spanCount: F.value.length, serviceCount: e.size, failed: a }
      }),
      ce = l(() => F.value.find((e) => !e.parentId) || F.value[0]),
      ne = l(() => {
        if (0 === F.value.length) return 0
        const e = F.value.map((e) => (e.startTime ?? 0) + (e.duration ?? 0)),
          a = F.value.map((e) => e.startTime ?? 0)
        return Math.max(...e) - Math.min(...a)
      }),
      ue = (e) => {
        if (!e) return '-'
        const a = new Date(e)
        return a.toLocaleTimeString('zh-CN', { hour12: !1 }) + '.' + String(a.getMilliseconds()).padStart(3, '0')
      }
    return () => {
      let e
      return s('div', { class: 'mobile-trace-explorer' }, [
        s('div', { class: 'mobile-trace-explorer__header' }, [
          s('div', null, [s('h2', { class: 'mobile-trace-explorer__title' }, [i('链路追踪')])]),
          s(
            x,
            {
              size: 'small',
              type: 'primary',
              class: 'mobile-trace-explorer__refresh-action',
              onClick: J,
              loading: b.value,
              'aria-label': '刷新链路数据'
            },
            N((e = o(u, { size: 16 }))) ? e : { default: () => [e] }
          )
        ]),
        s('div', { class: 'mobile-trace-explorer__stats' }, [
          s(
            z,
            { cols: 4, gap: 'var(--spacing-2)' },
            {
              default: () => [
                s('div', null, [
                  s('div', { class: 'mobile-trace-explorer__stat-card' }, [
                    s('div', { class: 'mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--total' }, [
                      o(d, { size: 16 })
                    ]),
                    s('div', { class: 'mobile-trace-explorer__stat-value' }, [te.value.total]),
                    s('div', { class: 'mobile-trace-explorer__stat-label' }, [i('总数')])
                  ])
                ]),
                s('div', null, [
                  s('div', { class: 'mobile-trace-explorer__stat-card' }, [
                    s('div', { class: 'mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--healthy' }, [
                      o(d, { size: 16 })
                    ]),
                    s('div', { class: 'mobile-trace-explorer__stat-value' }, [te.value.healthy]),
                    s('div', { class: 'mobile-trace-explorer__stat-label' }, [i('正常')])
                  ])
                ]),
                s('div', null, [
                  s('div', { class: 'mobile-trace-explorer__stat-card' }, [
                    s('div', { class: 'mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--duration' }, [
                      o(p, { size: 16 })
                    ]),
                    s('div', { class: 'mobile-trace-explorer__stat-value' }, [te.value.avgDuration, i('ms')]),
                    s('div', { class: 'mobile-trace-explorer__stat-label' }, [i('平均耗时')])
                  ])
                ]),
                s('div', null, [
                  s('div', { class: 'mobile-trace-explorer__stat-card' }, [
                    s('div', { class: 'mobile-trace-explorer__stat-icon mobile-trace-explorer__stat-icon--error' }, [
                      o(v, { size: 16 })
                    ]),
                    s('div', { class: 'mobile-trace-explorer__stat-value' }, [te.value.errorCount]),
                    s('div', { class: 'mobile-trace-explorer__stat-label' }, [i('异常')])
                  ])
                ])
              ]
            }
          )
        ]),
        s('div', { class: 'mobile-trace-explorer__filters' }, [
          s('div', { class: 'mobile-trace-explorer__filter-header' }, [
            s('div', { class: 'mobile-trace-explorer__filter-header-left' }, [
              o(m, { size: 14 }),
              s('span', null, [i('筛选')])
            ]),
            re.value ? s(x, { size: 'small', onClick: le }, { default: () => [i('重置')] }) : null
          ]),
          s('div', { class: 'mobile-trace-explorer__filter-body' }, [
            s(
              M,
              {
                modelValue: D.value ?? '',
                'onUpdate:modelValue': (e) => {
                  D.value = e ? String(e) : null
                },
                options: $.value,
                placeholder: '选择服务',
                clearable: !0,
                class: 'mobile-trace-explorer__filter-select'
              },
              null
            ),
            s('div', { class: 'mobile-trace-explorer__filter-chips' }, [
              R.map((e) =>
                s(
                  'button',
                  {
                    key: e.value,
                    class: [
                      'mobile-trace-explorer__filter-chip',
                      U.value === e.value
                        ? 'mobile-trace-explorer__filter-chip--active'
                        : U.value
                          ? 'mobile-trace-explorer__filter-chip--dimmed'
                          : ''
                    ],
                    onClick: () => {
                      U.value = U.value === e.value ? null : e.value
                    }
                  },
                  [e.label]
                )
              )
            ]),
            s('div', { class: 'mobile-trace-explorer__filter-chips' }, [
              X.map((e) =>
                s(
                  'button',
                  {
                    key: e.value,
                    class: [
                      'mobile-trace-explorer__filter-chip',
                      E.value === e.value
                        ? 'mobile-trace-explorer__filter-chip--active'
                        : E.value
                          ? 'mobile-trace-explorer__filter-chip--dimmed'
                          : ''
                    ],
                    onClick: () => {
                      E.value = E.value === e.value ? null : e.value
                    }
                  },
                  [e.label]
                )
              )
            ]),
            s(
              g,
              {
                modelValue: L.value,
                'onUpdate:modelValue': (e) => {
                  L.value = String(e)
                },
                placeholder: '按操作名称过滤...',
                clearable: !0,
                class: 'mobile-trace-explorer__filter-input'
              },
              { prefix: () => o(_, { size: 14 }) }
            )
          ])
        ]),
        s('div', { class: 'mobile-trace-explorer__search' }, [
          s(
            g,
            {
              modelValue: q.value,
              'onUpdate:modelValue': (e) => {
                const a = String(e),
                  l = q.value.length > 0 && 0 === a.length
                ;(q.value = a), l && J()
              },
              placeholder: '搜索 Trace ID 或服务名...',
              clearable: !0,
              onEnter: J
            },
            { prefix: () => o(_, { size: 14 }) }
          ),
          q.value.trim()
            ? s(
                x,
                {
                  size: 'small',
                  class: 'mobile-trace-explorer__search-btn',
                  onClick: () => {
                    J()
                  }
                },
                { default: () => [i('搜索')] }
              )
            : null
        ]),
        b.value
          ? s('div', { class: 'mobile-trace-explorer__loading' }, [s(y, { loading: !0, size: 'large' }, null)])
          : A.value
            ? s(
                h,
                { description: '数据加载失败', class: 'mobile-trace-explorer__error' },
                {
                  action: () => s(x, { type: 'primary', size: 'small', onClick: J }, { default: () => [i('重新加载')] })
                }
              )
            : s(c, null, [
                0 === ee.value.length
                  ? s('div', { class: 'mobile-trace-explorer__empty-state' }, [
                      s(h, { description: '暂无链路数据' }, null)
                    ])
                  : s(c, null, [
                      s('div', { class: 'mobile-trace-explorer__list' }, [
                        ee.value.map((e) => {
                          let a
                          return s(
                            'div',
                            {
                              key: e.id || e.traceId,
                              class: 'mobile-trace-explorer__list-card-wrapper',
                              role: 'button',
                              tabindex: '0',
                              'aria-label': `查看链路详情：${e.traceId || e.name || '未知链路'}`,
                              onClick: () => ie(e.traceId)
                            },
                            [
                              s(
                                f,
                                { size: 'small', bordered: !1, class: 'mobile-trace-explorer__list-card' },
                                {
                                  default: () => {
                                    return [
                                      s('div', { class: 'mobile-trace-explorer__card-header' }, [
                                        s('span', { class: 'mobile-trace-explorer__card-time' }, [ue(e.startTime)]),
                                        s('div', { class: 'mobile-trace-explorer__card-header-right' }, [
                                          s(
                                            w,
                                            {
                                              size: 'small',
                                              type:
                                                ((l = e.status),
                                                'ok' === l ? 'success' : 'error' === l ? 'danger' : 'default')
                                            },
                                            N((a = se(e.status))) ? a : { default: () => [a] }
                                          )
                                        ])
                                      ]),
                                      s('div', { class: 'mobile-trace-explorer__card-main' }, [
                                        s('div', { class: 'mobile-trace-explorer__card-service' }, [e.service || '-']),
                                        s('div', { class: 'mobile-trace-explorer__card-operation' }, [e.name || '-'])
                                      ]),
                                      s('div', { class: 'mobile-trace-explorer__card-footer' }, [
                                        s('span', { class: 'mobile-trace-explorer__card-duration' }, [
                                          i('耗时: '),
                                          e.duration ?? '-',
                                          i('ms')
                                        ]),
                                        s('span', { class: 'mobile-trace-explorer__card-trace-id' }, [
                                          e.traceId ? e.traceId.slice(0, 16) + '...' : '-'
                                        ])
                                      ])
                                    ]
                                    var l
                                  }
                                }
                              )
                            ]
                          )
                        })
                      ]),
                      P.value
                        ? s('div', { class: 'mobile-trace-explorer__pagination' }, [
                            s(
                              x,
                              { block: !0, size: 'small', onClick: ae, class: 'mobile-trace-explorer__load-more' },
                              { default: () => [i('加载更多 ('), O.value, i('/'), Q.value.length, i(')')] }
                            )
                          ])
                        : null
                    ]),
                s(
                  k,
                  {
                    show: W.value,
                    'onUpdate:show': (e) => {
                      e ? (W.value = !0) : ((W.value = !1), (G.value = null), (F.value = []))
                    },
                    position: 'bottom',
                    class: 'mobile-trace-explorer__drawer',
                    title: '链路详情 - ' + (K.value ? K.value.slice(0, 16) + '...' : '')
                  },
                  {
                    default: () => [
                      Z.value
                        ? s('div', { class: 'mobile-trace-explorer__drawer-loading' }, [
                            s(y, { loading: !0, size: 'medium' }, null)
                          ])
                        : F.value.length > 0 && ce.value
                          ? s('div', { class: 'mobile-trace-explorer__drawer-content' }, [
                              s('div', { class: 'mobile-trace-explorer__drawer-meta' }, [
                                s('div', { class: 'mobile-trace-explorer__drawer-meta-item' }, [
                                  s('span', { class: 'mobile-trace-explorer__drawer-meta-label' }, [i('总耗时')]),
                                  s('strong', null, [ne.value, i('ms')])
                                ]),
                                s('div', { class: 'mobile-trace-explorer__drawer-meta-item' }, [
                                  s('span', { class: 'mobile-trace-explorer__drawer-meta-label' }, [i('Span')]),
                                  s('strong', null, [oe.value.spanCount])
                                ]),
                                s('div', { class: 'mobile-trace-explorer__drawer-meta-item' }, [
                                  s('span', { class: 'mobile-trace-explorer__drawer-meta-label' }, [i('服务')]),
                                  s('strong', null, [oe.value.serviceCount])
                                ]),
                                s('div', { class: 'mobile-trace-explorer__drawer-meta-item' }, [
                                  s('span', { class: 'mobile-trace-explorer__drawer-meta-label' }, [i('异常')]),
                                  s(
                                    'strong',
                                    {
                                      class:
                                        oe.value.failed > 0
                                          ? 'mobile-trace-explorer__drawer-meta-error'
                                          : 'mobile-trace-explorer__drawer-meta-ok'
                                    },
                                    [oe.value.failed]
                                  )
                                ])
                              ]),
                              s('div', { class: 'mobile-trace-explorer__drawer-spans' }, [
                                F.value.map((e) => {
                                  var a, l, r
                                  return s(
                                    'div',
                                    {
                                      key: e.id,
                                      class: [
                                        'mobile-trace-explorer__drawer-span',
                                        (null == (a = G.value) ? void 0 : a.id) === e.id
                                          ? 'mobile-trace-explorer__drawer-span--selected'
                                          : ''
                                      ],
                                      onClick: () => {
                                        var a
                                        G.value = (null == (a = G.value) ? void 0 : a.id) === e.id ? null : e
                                      },
                                      role: 'button',
                                      tabindex: '0',
                                      'aria-expanded': (null == (l = G.value) ? void 0 : l.id) === e.id,
                                      'aria-label': `查看 Span 详情：${e.name || e.service || e.id}`,
                                      onKeydown: (a) => {
                                        var l
                                        ;('Enter' !== a.key && ' ' !== a.key) ||
                                          (a.preventDefault(),
                                          (G.value = (null == (l = G.value) ? void 0 : l.id) === e.id ? null : e))
                                      }
                                    },
                                    [
                                      s('div', { class: 'mobile-trace-explorer__drawer-span-header' }, [
                                        s(
                                          'div',
                                          {
                                            class: [
                                              'mobile-trace-explorer__drawer-span-dot',
                                              'ok' === e.status
                                                ? 'mobile-trace-explorer__drawer-span-dot--ok'
                                                : 'mobile-trace-explorer__drawer-span-dot--error'
                                            ]
                                          },
                                          null
                                        ),
                                        s('span', { class: 'mobile-trace-explorer__drawer-span-service' }, [e.service]),
                                        s('span', { class: 'mobile-trace-explorer__drawer-span-duration' }, [
                                          e.duration,
                                          i('ms')
                                        ])
                                      ]),
                                      s('div', { class: 'mobile-trace-explorer__drawer-span-name' }, [e.name]),
                                      (null == (r = G.value) ? void 0 : r.id) === e.id
                                        ? s('div', { class: 'mobile-trace-explorer__drawer-span-detail' }, [
                                            s('div', { class: 'mobile-trace-explorer__drawer-span-field' }, [
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-label' }, [
                                                i('Trace ID')
                                              ]),
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-value' }, [
                                                e.traceId
                                              ])
                                            ]),
                                            s('div', { class: 'mobile-trace-explorer__drawer-span-field' }, [
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-label' }, [
                                                i('服务')
                                              ]),
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-value' }, [
                                                e.service
                                              ])
                                            ]),
                                            s('div', { class: 'mobile-trace-explorer__drawer-span-field' }, [
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-label' }, [
                                                i('操作')
                                              ]),
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-value' }, [
                                                e.name
                                              ])
                                            ]),
                                            s('div', { class: 'mobile-trace-explorer__drawer-span-field' }, [
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-label' }, [
                                                i('耗时')
                                              ]),
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-value' }, [
                                                e.duration,
                                                i('ms')
                                              ])
                                            ]),
                                            s('div', { class: 'mobile-trace-explorer__drawer-span-field' }, [
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-label' }, [
                                                i('状态')
                                              ]),
                                              s(
                                                'span',
                                                {
                                                  class: [
                                                    'mobile-trace-explorer__drawer-span-field-value',
                                                    'ok' === e.status
                                                      ? 'mobile-trace-explorer__drawer-span-field-value--ok'
                                                      : 'mobile-trace-explorer__drawer-span-field-value--error'
                                                  ]
                                                },
                                                [e.status]
                                              )
                                            ]),
                                            s('div', { class: 'mobile-trace-explorer__drawer-span-field' }, [
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-label' }, [
                                                i('开始时间')
                                              ]),
                                              s('span', { class: 'mobile-trace-explorer__drawer-span-field-value' }, [
                                                ue(e.startTime)
                                              ])
                                            ])
                                          ])
                                        : null
                                    ]
                                  )
                                })
                              ])
                            ])
                          : B.value
                            ? s(
                                h,
                                { description: '链路详情加载失败', class: 'mobile-trace-explorer__drawer-empty' },
                                {
                                  action: () =>
                                    s(
                                      x,
                                      { type: 'primary', size: 'small', onClick: () => ie(K.value) },
                                      { default: () => [i('重试')] }
                                    )
                                }
                              )
                            : s(h, { description: '暂无链路详情', class: 'mobile-trace-explorer__drawer-empty' }, null)
                    ]
                  }
                )
              ])
      ])
    }
  }
})
export { A as default }
