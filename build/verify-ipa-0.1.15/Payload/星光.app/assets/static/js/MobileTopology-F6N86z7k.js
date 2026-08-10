import {
  p as e,
  a0 as o,
  aP as l,
  a2 as a,
  a1 as t,
  w as s,
  ac as i,
  b2 as r,
  aS as n,
  $ as c,
  ba as m,
  ai as d
} from './invariable-DewVS0br.js'
import { M as u } from './MobileButton-BKhxhz5A.js'
import { M as p } from './MobileCard-BxmuYclQ.js'
import { M as _ } from './MobileTag-ByR2jSPf.js'
import { M as g } from './MobileEmpty-BimvXy70.js'
import { M as v } from './MobileLoading-DlB38x7T.js'
import { M as y } from './MobileInput-OCuvcoNh.js'
import './MobileToast-CIN42EDh.js'
import { M as b } from './MobileSelect-BOALIWQn.js'
import { M as f } from './MobileStatistic-BuNMJvar.js'
import { l as h } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { S as w } from './ServiceHealthBadge-b4ePBNa-.js'
import { i as M, p as S } from './investigationContext-7xMjfbkf.js'
import './index-DFkcx8xz.js'
const j = e({
  name: 'MobileTopology',
  setup() {
    const e = c(),
      j = m(),
      $ = o(!1),
      k = o(!1),
      C = o({ nodes: [], edges: [] }),
      q = o(''),
      z = o(''),
      R = async () => {
        ;($.value = !0), (k.value = !1)
        try {
          const e = await h()
          C.value = {
            nodes: ((null == e ? void 0 : e.nodes) || []).map((e) => ({
              ...e,
              id: String((null == e ? void 0 : e.id) || (null == e ? void 0 : e.name) || ''),
              name: String((null == e ? void 0 : e.name) || (null == e ? void 0 : e.id) || '')
            })),
            edges: (null == e ? void 0 : e.edges) || []
          }
        } catch {
          k.value = !0
        } finally {
          $.value = !1
        }
      }
    l(() => {
      const e = S(j.query)
      e.serviceId && (q.value = e.serviceId), R()
    }),
      a(
        () => j.query,
        () => {
          const e = S(j.query)
          void 0 !== e.serviceId && (q.value = e.serviceId)
        }
      )
    const U = t(() => C.value.nodes.filter((e) => e.id && e.name).map((e) => ({ label: e.name, value: e.id }))),
      L = t(() => C.value.nodes.find((e) => e.id === q.value) ?? null),
      x = t(() => {
        if (!q.value) return []
        const e = C.value.edges.filter((e) => String(e.to) === q.value && String(e.from) !== q.value),
          o = new Map(C.value.nodes.map((e) => [e.id, e]))
        return e.map((e) => ({
          edge: e,
          node: o.get(String(e.from)) ?? { id: String(e.from), name: String(e.from), status: 'unknown' }
        }))
      }),
      D = t(() => {
        if (!q.value) return []
        const e = C.value.edges.filter((e) => String(e.from) === q.value && String(e.to) !== q.value),
          o = new Map(C.value.nodes.map((e) => [e.id, e]))
        return e.map((e) => ({
          edge: e,
          node: o.get(String(e.to)) ?? { id: String(e.to), name: String(e.to), status: 'unknown' }
        }))
      }),
      I = t(() => {
        const e = z.value.trim().toLowerCase()
        return e
          ? x.value.filter((o) => `${o.node.name} ${o.node.id} ${o.edge.protocol || ''}`.toLowerCase().includes(e))
          : x.value
      }),
      V = t(() => {
        const e = z.value.trim().toLowerCase()
        return e
          ? D.value.filter((o) => `${o.node.name} ${o.node.id} ${o.edge.protocol || ''}`.toLowerCase().includes(e))
          : D.value
      }),
      P = t(() => {
        const e = x.value,
          o = D.value
        return {
          totalUpstream: e.length,
          totalDownstream: o.length,
          healthyUpstream: e.filter((e) => 'healthy' === e.node.status || 'running' === e.node.status).length,
          healthyDownstream: o.filter((e) => 'healthy' === e.node.status || 'running' === e.node.status).length
        }
      }),
      T = (e, o = '') => ('number' != typeof e ? '--' : `${e}${o}`),
      B = (e) => {
        const o = String(e.status ?? '')
        return 'healthy' === o || 'running' === o
          ? 'healthy'
          : 'warning' === o || 'idle' === o || 'degraded' === o
            ? 'degraded'
            : 'critical' === o || 'error' === o || 'stopped' === o
              ? 'critical'
              : 'unknown'
      },
      O = (e) => {
        switch (B(e)) {
          case 'healthy':
            return 'success'
          case 'degraded':
            return 'warning'
          case 'critical':
            return 'danger'
          default:
            return 'default'
        }
      },
      E = (e) => {
        switch (B(e)) {
          case 'healthy':
            return '健康'
          case 'degraded':
            return '降级'
          case 'critical':
            return '异常'
          default:
            return '未知'
        }
      },
      H = (o, l) => {
        let a
        const { edge: t, node: r } = o,
          n = 'middleware' === r.type || 'database' === r.type || 'infrastructure' === r.layerName,
          c = t.protocol || r.protocol,
          m =
            'number' == typeof t.errorRate
              ? t.errorRate > 1
                ? t.errorRate
                : 100 * t.errorRate
              : 'number' == typeof r.errorRate
                ? r.errorRate > 1
                  ? r.errorRate
                  : 100 * r.errorRate
                : null
        return s(
          'div',
          {
            key: `${l}-${r.id}-${t.from}-${t.to}`,
            class: 'mobile-topology__card-wrapper',
            onClick: () => {
              var o
              ;(o = r.id) && o !== q.value && e.push({ path: `/mobile/service-detail-v2/${o}`, query: M(S(j.query)) })
            }
          },
          [
            s(
              p,
              { size: 'small', bordered: !1, class: 'mobile-topology__card' },
              {
                default: () => {
                  return [
                    s('div', { class: 'mobile-topology__card-content' }, [
                      s('div', { class: 'mobile-topology__card-main' }, [
                        s('div', { class: 'mobile-topology__card-title-row' }, [
                          s('span', { class: 'mobile-topology__card-name' }, [r.name]),
                          s(
                            _,
                            { size: 'small', plain: !0, type: O(r) },
                            ((e = a = E(r)),
                            'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !d(e))
                              ? a
                              : { default: () => [a] })
                          )
                        ]),
                        s('div', { class: 'mobile-topology__card-id' }, [r.id]),
                        s('div', { class: 'mobile-topology__card-meta' }, [
                          c &&
                            s('span', { class: 'mobile-topology__card-tag mobile-topology__card-tag--protocol' }, [c]),
                          n &&
                            s('span', { class: 'mobile-topology__card-tag mobile-topology__card-tag--infra' }, [
                              i('基础设施')
                            ]),
                          t.inferred &&
                            s('span', { class: 'mobile-topology__card-tag mobile-topology__card-tag--inferred' }, [
                              i('推断')
                            ])
                        ]),
                        s('div', { class: 'mobile-topology__card-metrics' }, [
                          s('div', { class: 'mobile-topology__card-metric' }, [
                            s('span', { class: 'mobile-topology__card-metric-label' }, [i('QPS')]),
                            s('span', { class: 'mobile-topology__card-metric-value' }, [T(t.qps ?? r.qps)])
                          ]),
                          s('div', { class: 'mobile-topology__card-metric' }, [
                            s('span', { class: 'mobile-topology__card-metric-label' }, [i('错误率')]),
                            s(
                              'span',
                              {
                                class: [
                                  'mobile-topology__card-metric-value',
                                  'number' == typeof m && m > 0 ? 'mobile-topology__card-metric-value--danger' : ''
                                ]
                              },
                              [T(m, '%')]
                            )
                          ]),
                          s('div', { class: 'mobile-topology__card-metric' }, [
                            s('span', { class: 'mobile-topology__card-metric-label' }, [i('P99')]),
                            s('span', { class: 'mobile-topology__card-metric-value' }, [T(t.p99 ?? r.latency, 'ms')])
                          ])
                        ])
                      ]),
                      s('div', { class: 'mobile-topology__card-arrow' }, [
                        s('svg', { width: '16', height: '16', viewBox: '0 0 16 16', fill: 'none' }, [
                          s(
                            'path',
                            {
                              d: 'M6 4L10 8L6 12',
                              stroke: 'currentColor',
                              'stroke-width': '1.5',
                              'stroke-linecap': 'round',
                              'stroke-linejoin': 'round'
                            },
                            null
                          )
                        ])
                      ])
                    ])
                  ]
                  var e
                }
              }
            )
          ]
        )
      }
    return () =>
      s('div', { class: 'mobile-topology' }, [
        s('div', { class: 'mobile-topology__header' }, [
          s('div', null, [
            s('h2', { class: 'mobile-topology__title' }, [i('服务拓扑')]),
            s('div', { class: 'mobile-topology__subtitle' }, [i('依赖关系与链路概览')])
          ]),
          s(
            u,
            {
              size: 'small',
              type: 'ghost',
              class: 'mobile-topology__refresh-action',
              onClick: R,
              icon: () => s(r, { size: 16 }, null)
            },
            { default: () => [i('刷新')] }
          )
        ]),
        $.value
          ? s('div', { class: 'mobile-topology__loading' }, [s(v, { loading: $.value, size: '48px' }, null)])
          : k.value
            ? s('div', { class: 'mobile-topology__error' }, [
                s('div', { class: 'mobile-topology__error-text' }, [i('数据加载失败，请检查网络连接后重试')]),
                s(u, { size: 'small', type: 'primary', onClick: R }, { default: () => [i('重试')] })
              ])
            : 0 === C.value.nodes.length
              ? s(
                  g,
                  { description: '暂无拓扑数据', class: 'mobile-topology__empty-state' },
                  {
                    default: () => [
                      s('div', { class: 'mobile-topology__empty-tip' }, [i('请确认服务注册中心是否正常运行')])
                    ]
                  }
                )
              : s(n, null, [
                  s('div', { class: 'mobile-topology__selector' }, [
                    s(
                      b,
                      {
                        modelValue: q.value,
                        'onUpdate:modelValue': (e) => {
                          q.value = e
                        },
                        options: U.value,
                        placeholder: '选择服务查看拓扑依赖',
                        clearable: !0
                      },
                      null
                    )
                  ]),
                  q.value &&
                    s(n, null, [
                      s('div', { class: 'mobile-topology__summary' }, [
                        s('div', { class: 'mobile-topology__summary-item mobile-topology__summary-item--total' }, [
                          s(f, { label: '上游', value: P.value.totalUpstream }, null)
                        ]),
                        s('div', { class: 'mobile-topology__summary-item mobile-topology__summary-item--total' }, [
                          s(f, { label: '下游', value: P.value.totalDownstream }, null)
                        ]),
                        s('div', { class: 'mobile-topology__summary-item mobile-topology__summary-item--healthy' }, [
                          s(f, { label: '健康', value: P.value.healthyUpstream + P.value.healthyDownstream }, null)
                        ])
                      ]),
                      s('div', { class: 'mobile-topology__search' }, [
                        s(
                          y,
                          {
                            modelValue: z.value,
                            'onUpdate:modelValue': (e) => {
                              z.value = e
                            },
                            placeholder: '搜索依赖服务名称或协议...',
                            clearable: !0
                          },
                          null
                        )
                      ]),
                      L.value &&
                        s('div', { class: 'mobile-topology__current-service' }, [
                          s(
                            p,
                            { size: 'small', bordered: !1, class: 'mobile-topology__current-card' },
                            {
                              default: () => [
                                s('div', { class: 'mobile-topology__current-content' }, [
                                  s('div', { class: 'mobile-topology__current-info' }, [
                                    s('div', { class: 'mobile-topology__current-name' }, [L.value.name]),
                                    s('div', { class: 'mobile-topology__current-id' }, [L.value.id])
                                  ]),
                                  s('div', { class: 'mobile-topology__current-badge' }, [
                                    s(w, { status: B(L.value), size: 'sm' }, null)
                                  ])
                                ])
                              ]
                            }
                          )
                        ]),
                      s('div', { class: 'mobile-topology__section' }, [
                        s('div', { class: 'mobile-topology__section-header' }, [
                          s('div', { class: 'mobile-topology__section-title' }, [
                            s(
                              'span',
                              {
                                class: 'mobile-topology__section-indicator mobile-topology__section-indicator--upstream'
                              },
                              null
                            ),
                            i('上游服务 (Upstream)')
                          ]),
                          s('span', { class: 'mobile-topology__section-count' }, [I.value.length, i(' 项')])
                        ]),
                        I.value.length > 0
                          ? s('div', { class: 'mobile-topology__list' }, [I.value.map((e) => H(e, 'upstream'))])
                          : s('div', { class: 'mobile-topology__section-empty' }, [
                              z.value.trim() ? '未找到匹配的上游依赖' : '暂无上游依赖 — 没有服务调用当前服务'
                            ])
                      ]),
                      s('div', { class: 'mobile-topology__section' }, [
                        s('div', { class: 'mobile-topology__section-header' }, [
                          s('div', { class: 'mobile-topology__section-title' }, [
                            s(
                              'span',
                              {
                                class:
                                  'mobile-topology__section-indicator mobile-topology__section-indicator--downstream'
                              },
                              null
                            ),
                            i('下游服务 (Downstream)')
                          ]),
                          s('span', { class: 'mobile-topology__section-count' }, [V.value.length, i(' 项')])
                        ]),
                        V.value.length > 0
                          ? s('div', { class: 'mobile-topology__list' }, [V.value.map((e) => H(e, 'downstream'))])
                          : s('div', { class: 'mobile-topology__section-empty' }, [
                              z.value.trim() ? '未找到匹配的下游依赖' : '暂无下游依赖 — 当前服务不调用其他服务'
                            ])
                      ])
                    ]),
                  !q.value &&
                    s('div', { class: 'mobile-topology__prompt' }, [
                      i('请在上方选择一个服务，查看其上游和下游依赖关系')
                    ])
                ])
      ])
  }
})
export { j as default }
