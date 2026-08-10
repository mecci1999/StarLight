import {
  p as e,
  w as a,
  bB as t,
  a0 as i,
  a1 as l,
  aP as o,
  a2 as s,
  ac as n,
  aR as r,
  aS as c,
  b2 as m,
  bG as u,
  aY as d,
  aZ as v,
  bH as b,
  bg as _,
  bI as p,
  ai as y,
  ba as f
} from './invariable-DewVS0br.js'
import { M as g } from './MobileButton-BKhxhz5A.js'
import { M as k } from './MobileCard-BxmuYclQ.js'
import { M as h } from './MobileTag-ByR2jSPf.js'
import { M as w } from './MobileEmpty-BimvXy70.js'
import { M as C } from './MobileLoading-DlB38x7T.js'
import './MobileToast-CIN42EDh.js'
import { M } from './MobileProgress-CIjA5IVj.js'
import { M as j } from './MobileSelect-BOALIWQn.js'
import { M as z } from './MobileGrid-sIXQCLxa.js'
import { f as S, k as P } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { d as I } from './index-DFkcx8xz.js'
import { p as T } from './investigationContext-7xMjfbkf.js'
const x = e({
  name: 'MobileDataTable',
  props: {
    columns: { type: Array, default: () => [] },
    data: { type: Array, default: () => [] },
    loading: { type: Boolean, default: !1 },
    onRowClick: { type: Function, default: null }
  },
  setup: (e) => () =>
    a('div', { class: 'mobile-data-table' }, [
      e.loading
        ? a('div', { class: 'mobile-data-table__loading' }, [
            a(t, { size: '24px', color: 'var(--color-text-3)' }, null)
          ])
        : a('table', { class: 'mobile-data-table__table' }, [
            a('thead', { class: 'mobile-data-table__header' }, [
              a('tr', null, [e.columns.map((e) => a('th', { key: e.key }, [e.label]))])
            ]),
            a('tbody', { class: 'mobile-data-table__body' }, [
              e.data.map((t, i) =>
                a(
                  'tr',
                  {
                    key: i,
                    onClick: () => {
                      var a
                      return null == (a = e.onRowClick) ? void 0 : a.call(e, t, i)
                    },
                    style: { cursor: 'function' == typeof e.onRowClick ? 'pointer' : void 0 }
                  },
                  [
                    e.columns.map((e) =>
                      a('td', { key: e.key }, [e.render ? e.render(t[e.key], t, i) : String(t[e.key] ?? '')])
                    )
                  ]
                )
              )
            ])
          ])
    ])
})
function U(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !y(e))
}
const q = e({
  name: 'MobileInstanceMonitor',
  setup() {
    const e = f(),
      t = i(!1),
      y = i(!1),
      q = i([]),
      A = i([]),
      R = i(!1),
      B = i(null),
      L = i('card'),
      V = i('id'),
      W = i('asc'),
      D = async () => {
        R.value = !1
        try {
          const e = await S({ page: 1, pageSize: 200, scope: I() }),
            a = (null == e ? void 0 : e.items) || []
          A.value = a.map((e) => {
            var a, t
            return {
              label: (null == (a = e.identity) ? void 0 : a.name) || '-',
              value: (null == (t = e.identity) ? void 0 : t.id) || ''
            }
          })
        } catch {
          ;(A.value = []), (R.value = !0)
        }
      },
      G = async () => {
        ;(t.value = !0), (y.value = !1)
        try {
          if (!B.value) return void (q.value = [])
          const e = await P(B.value, { scope: I() })
          q.value = Array.isArray(e) ? e : []
        } catch {
          ;(y.value = !0), (q.value = [])
        } finally {
          t.value = !1
        }
      },
      O = l(() => {
        const e = [...q.value],
          a = 'asc' === W.value ? 1 : -1
        return (
          e.sort((e, t) => {
            const i = V.value
            if ('cpu' === i || 'memory' === i)
              return (('number' == typeof e[i] ? e[i] : 0) - ('number' == typeof t[i] ? t[i] : 0)) * a
            const l = (e[i] ?? '').toString().toLowerCase(),
              o = (t[i] ?? '').toString().toLowerCase()
            return l < o ? -1 * a : l > o ? 1 * a : 0
          }),
          e
        )
      }),
      Y = l(() => {
        const e = q.value.length
        return {
          total: e,
          running: q.value.filter((e) => 'running' === e.status).length,
          error: q.value.filter((e) => 'error' === e.status).length,
          avgCpu: e > 0 ? Math.round(q.value.reduce((e, a) => e + ('number' == typeof a.cpu ? a.cpu : 0), 0) / e) : 0
        }
      })
    o(async () => {
      const a = T(e.query)
      a.serviceId && (B.value = a.serviceId), await D(), B.value && (await G())
    }),
      s(
        () => e.query,
        () => {
          const a = T(e.query)
          void 0 !== a.serviceId && ((B.value = a.serviceId), G())
        }
      )
    const E = (e) => {
        switch (e) {
          case 'running':
            return 'success'
          case 'error':
            return 'danger'
          default:
            return 'default'
        }
      },
      F = (e) => {
        switch (e) {
          case 'running':
            return '运行中'
          case 'error':
            return '异常'
          default:
            return e || '未知'
        }
      },
      H = [
        {
          label: '实例ID',
          key: 'id',
          render: (e, t) => a('span', { class: 'mobile-instance-monitor__table-mono' }, [String(t.id ?? '-')])
        },
        {
          label: '状态',
          key: 'status',
          render(e, t) {
            let i
            const l = String(t.status ?? '')
            return a(h, { size: 'small', type: E(l) }, U((i = F(l))) ? i : { default: () => [i] })
          }
        },
        { label: '节点', key: 'node' },
        {
          label: 'CPU',
          key: 'cpu',
          render: (e) =>
            a('span', { class: 'mobile-instance-monitor__table-metric' }, ['number' == typeof e ? e : 0, n('%')])
        },
        {
          label: '内存',
          key: 'memory',
          render: (e) =>
            a('span', { class: 'mobile-instance-monitor__table-metric' }, ['number' == typeof e ? e : 0, n('%')])
        },
        {
          label: '启动时间',
          key: 'startTime',
          render: (e) => a('span', { class: 'mobile-instance-monitor__table-time' }, [String(e || '-')])
        }
      ]
    return () => {
      let e, i, l
      return a('div', { class: 'mobile-instance-monitor' }, [
        a('div', { class: 'mobile-instance-monitor__header' }, [
          a('div', null, [a('h2', { class: 'mobile-instance-monitor__title' }, [n('实例监控')])]),
          a('div', { class: 'mobile-instance-monitor__header-actions' }, [
            a(
              g,
              {
                size: 'small',
                type: 'primary',
                class: 'mobile-instance-monitor__refresh-action',
                onClick: G,
                'aria-label': '刷新实例数据'
              },
              U((e = r(m, { size: 16 }))) ? e : { default: () => [e] }
            )
          ])
        ]),
        a('div', { class: 'mobile-instance-monitor__service-select' }, [
          a(
            j,
            {
              modelValue: B.value ?? '',
              'onUpdate:modelValue': (e) => {
                ;(B.value = e ? String(e) : null), G()
              },
              options: A.value,
              placeholder: '选择服务',
              clearable: !0
            },
            null
          ),
          R.value &&
            a('div', { class: 'mobile-instance-monitor__selector-error', role: 'alert' }, [
              a('span', null, [n('服务列表加载失败')]),
              a(g, { size: 'small', type: 'ghost', onClick: D }, { default: () => [n('重试')] })
            ])
        ]),
        t.value
          ? a('div', { class: 'mobile-instance-monitor__loading' }, [a(C, { loading: !0, size: 'large' }, null)])
          : y.value
            ? a(
                w,
                { description: '数据加载失败', class: 'mobile-instance-monitor__error' },
                {
                  action: () => a(g, { type: 'primary', size: 'small', onClick: G }, { default: () => [n('重新加载')] })
                }
              )
            : B.value
              ? 0 === q.value.length
                ? a('div', { class: 'mobile-instance-monitor__empty-state' }, [
                    a(w, { description: '该服务暂无实例数据' }, null)
                  ])
                : a(c, null, [
                    a('div', { class: 'mobile-instance-monitor__stats' }, [
                      a(
                        z,
                        { cols: 2, gap: 'var(--spacing-2)' },
                        {
                          default: () => [
                            a('div', null, [
                              a('div', { class: 'mobile-instance-monitor__stat-card' }, [
                                a(
                                  'div',
                                  {
                                    class:
                                      'mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--total'
                                  },
                                  [r(u, { size: 18 })]
                                ),
                                a('div', { class: 'mobile-instance-monitor__stat-value' }, [Y.value.total]),
                                a('div', { class: 'mobile-instance-monitor__stat-label' }, [n('总实例')])
                              ])
                            ]),
                            a('div', null, [
                              a('div', { class: 'mobile-instance-monitor__stat-card' }, [
                                a(
                                  'div',
                                  {
                                    class:
                                      'mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--running'
                                  },
                                  [r(d, { size: 18 })]
                                ),
                                a('div', { class: 'mobile-instance-monitor__stat-value' }, [Y.value.running]),
                                a('div', { class: 'mobile-instance-monitor__stat-label' }, [n('运行中')])
                              ])
                            ]),
                            a('div', null, [
                              a('div', { class: 'mobile-instance-monitor__stat-card' }, [
                                a(
                                  'div',
                                  {
                                    class:
                                      'mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--error'
                                  },
                                  [r(v, { size: 18 })]
                                ),
                                a('div', { class: 'mobile-instance-monitor__stat-value' }, [Y.value.error]),
                                a('div', { class: 'mobile-instance-monitor__stat-label' }, [n('异常')])
                              ])
                            ]),
                            a('div', null, [
                              a('div', { class: 'mobile-instance-monitor__stat-card' }, [
                                a(
                                  'div',
                                  {
                                    class: 'mobile-instance-monitor__stat-icon mobile-instance-monitor__stat-icon--cpu'
                                  },
                                  [r(b, { size: 18 })]
                                ),
                                a('div', { class: 'mobile-instance-monitor__stat-value' }, [Y.value.avgCpu, n('%')]),
                                a('div', { class: 'mobile-instance-monitor__stat-label' }, [n('平均 CPU')])
                              ])
                            ])
                          ]
                        }
                      )
                    ]),
                    a('div', { class: 'mobile-instance-monitor__view-toggle' }, [
                      a('div', { class: 'mobile-instance-monitor__view-toggle-actions' }, [
                        a(
                          g,
                          {
                            type: 'card' === L.value ? 'primary' : 'default',
                            'aria-label': '卡片视图',
                            onClick: () => {
                              L.value = 'card'
                            }
                          },
                          U((i = r(_, { size: 16 }))) ? i : { default: () => [i] }
                        ),
                        a(
                          g,
                          {
                            type: 'table' === L.value ? 'primary' : 'default',
                            'aria-label': '表格视图',
                            onClick: () => {
                              L.value = 'table'
                            }
                          },
                          U((l = r(p, { size: 16 }))) ? l : { default: () => [l] }
                        )
                      ])
                    ]),
                    'card' === L.value
                      ? a('div', { class: 'mobile-instance-monitor__list' }, [
                          O.value.map((e) => {
                            let t
                            return a(
                              k,
                              { key: e.id, size: 'small', bordered: !1, class: 'mobile-instance-monitor__list-card' },
                              {
                                default: () => [
                                  a('div', { class: 'mobile-instance-monitor__card-header' }, [
                                    a('span', { class: 'mobile-instance-monitor__card-id' }, [e.id]),
                                    a(
                                      h,
                                      { size: 'small', type: E(e.status) },
                                      U((t = F(e.status))) ? t : { default: () => [t] }
                                    )
                                  ]),
                                  a('div', { class: 'mobile-instance-monitor__card-metrics' }, [
                                    a('div', { class: 'mobile-instance-monitor__metric-row' }, [
                                      a('span', { class: 'mobile-instance-monitor__metric-label' }, [n('CPU')]),
                                      a('div', { class: 'mobile-instance-monitor__metric-bar' }, [
                                        a(
                                          M,
                                          {
                                            percentage: e.cpu ?? 0,
                                            strokeWidth: 10,
                                            trackColor: 'var(--color-fill-2)',
                                            color: 'var(--color-primary-6)',
                                            showPivot: !1
                                          },
                                          null
                                        )
                                      ]),
                                      a('span', { class: 'mobile-instance-monitor__metric-value' }, [
                                        e.cpu ?? 0,
                                        n('%')
                                      ])
                                    ]),
                                    a('div', { class: 'mobile-instance-monitor__metric-row' }, [
                                      a('span', { class: 'mobile-instance-monitor__metric-label' }, [n('内存')]),
                                      a('div', { class: 'mobile-instance-monitor__metric-bar' }, [
                                        a(
                                          M,
                                          {
                                            percentage: e.memory ?? 0,
                                            strokeWidth: 10,
                                            trackColor: 'var(--color-fill-2)',
                                            color: 'var(--color-warning-6)',
                                            showPivot: !1
                                          },
                                          null
                                        )
                                      ]),
                                      a('span', { class: 'mobile-instance-monitor__metric-value' }, [
                                        e.memory ?? 0,
                                        n('%')
                                      ])
                                    ])
                                  ]),
                                  a('div', { class: 'mobile-instance-monitor__card-footer' }, [
                                    a('span', { class: 'mobile-instance-monitor__card-time' }, [
                                      n('节点: '),
                                      e.node || '-',
                                      n(' · 启动: '),
                                      e.startTime || '-'
                                    ])
                                  ])
                                ]
                              }
                            )
                          })
                        ])
                      : a('div', { class: 'mobile-instance-monitor__table-wrapper' }, [
                          a('div', { class: 'mobile-instance-monitor__table-header-row' }, [
                            H.map((e) => {
                              return a(
                                'div',
                                {
                                  key: e.key,
                                  class: 'mobile-instance-monitor__table-th',
                                  onClick: () => {
                                    return (
                                      (a = e.key),
                                      void (V.value === a
                                        ? (W.value = 'asc' === W.value ? 'desc' : 'asc')
                                        : ((V.value = a), (W.value = 'asc')))
                                    )
                                    var a
                                  }
                                },
                                [
                                  a('span', null, [
                                    e.label,
                                    ((t = e.key), V.value !== t ? '' : 'asc' === W.value ? ' ↑' : ' ↓')
                                  ])
                                ]
                              )
                              var t
                            })
                          ]),
                          a(
                            x,
                            {
                              class: 'mobile-instance-monitor__table',
                              columns: H,
                              data: O.value.map((e) => ({ ...e }))
                            },
                            null
                          )
                        ])
                  ])
              : a('div', { class: 'mobile-instance-monitor__empty-state' }, [
                  a(w, { description: '请先选择服务' }, null)
                ])
      ])
    }
  }
})
export { q as default }
