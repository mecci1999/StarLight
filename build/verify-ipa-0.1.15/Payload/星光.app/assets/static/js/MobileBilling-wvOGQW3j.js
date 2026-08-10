import './MobileToast-CIN42EDh.js'
import { M as l } from './MobileTag-ByR2jSPf.js'
import {
  p as e,
  a0 as a,
  a1 as i,
  aP as s,
  w as n,
  b9 as t,
  b2 as r,
  aT as u,
  ac as o,
  bW as c,
  bh as b,
  bB as m,
  bC as v,
  bT as d,
  ai as p
} from './invariable-DewVS0br.js'
import { b as _ } from './index-DFkcx8xz.js'
import { g, a as y, b as f, c as h, d as w } from './subscription-C610hAN0.js'
import { r as k } from './billingErrorState-CSlzjph-.js'
import './request-BiInMBwl.js'
const N = [
    {
      name: 'Free',
      price: 'CNY0',
      period: '/month',
      features: ['基础指标接入', '1 个 API Key', '社区支持'],
      value: 'free',
      color: 'gray'
    },
    {
      name: 'Pro',
      price: 'CNY99',
      period: '/month',
      features: ['更高指标写入额度', '多 API Key 管理', '告警与趋势分析'],
      value: 'pro',
      color: 'blue'
    },
    {
      name: 'Team',
      price: 'CNY299',
      period: '/month',
      features: ['团队级配额', '更长数据保留', '优先支持'],
      value: 'team',
      color: 'purple'
    }
  ],
  A = { maxMetricsPerMonth: '月度指标写入', maxCustomSchemas: '自定义 Schema', maxAppKeys: '活跃 API Key' },
  C = e({
    name: 'MobileBilling',
    setup() {
      const e = a('plans'),
        C = i(() => {
          var l
          return Boolean(null == (l = _()) ? void 0 : l.isAdmin)
        }),
        z = a([]),
        M = a(''),
        S = a('unknown'),
        E = a(!1),
        j = a(!1),
        P = a([]),
        x = a(!1),
        T = a(!1),
        q = a(!1),
        I = a(!1),
        O = a(0),
        R = a(null),
        $ = a([]),
        F = a(!1),
        U = a(!1),
        B = a(null),
        G = (l, e) => ('number' != typeof e ? '未知金额' : `${l || ''} ${e.toLocaleString()}`),
        K = (l) => ('number' == typeof l ? l.toLocaleString() : '未知'),
        X = async () => {
          var l, e, a, i, s
          ;(E.value = !0), (j.value = !1)
          try {
            const [n, t] = await Promise.allSettled([g(), y()])
            'fulfilled' === n.status &&
              (null == (e = null == (l = n.value) ? void 0 : l.plan) ? void 0 : e.name) &&
              ((M.value = n.value.plan.name),
              (S.value = (null == (a = n.value.subscription) ? void 0 : a.status) || 'unknown')),
              'fulfilled' === t.status && (null == (s = null == (i = t.value) ? void 0 : i.plans) ? void 0 : s.length)
                ? (z.value = ((l) => {
                    const e = ['gray', 'green', 'purple', 'blue', 'orange']
                    return [...l]
                      .sort((l, e) => {
                        const a = 'number' == typeof l.sortOrder ? l.sortOrder : Number.MAX_SAFE_INTEGER,
                          i = 'number' == typeof e.sortOrder ? e.sortOrder : Number.MAX_SAFE_INTEGER
                        return a !== i
                          ? a - i
                          : ('number' == typeof l.price ? l.price : Number.MAX_SAFE_INTEGER) -
                              ('number' == typeof e.price ? e.price : Number.MAX_SAFE_INTEGER)
                      })
                      .map((l, a) => {
                        return {
                          name: l.displayName || l.name.toUpperCase(),
                          price:
                            ((s = l),
                            'number' != typeof s.price
                              ? '未知'
                              : 0 === s.price
                                ? s.currency
                                  ? `${s.currency}0`
                                  : '未知币种 0'
                                : s.currency
                                  ? `${s.currency}${s.price}`
                                  : `未知币种 ${s.price}`),
                          period: l.billingCycle ? '/' + ('yearly' === l.billingCycle ? 'year' : 'month') : '',
                          features:
                            ((i = l),
                            Array.isArray(i.features)
                              ? i.features
                              : i.features && 'object' == typeof i.features
                                ? Object.entries(i.features)
                                    .filter(([, l]) => Boolean(l))
                                    .map(([l, e]) => ('string' == typeof e ? e : l))
                                : []),
                          value: l.name,
                          color: e[a % e.length]
                        }
                        var i, s
                      })
                  })(t.value.plans))
                : ((z.value = N), (j.value = 'fulfilled' !== t.status))
          } catch (n) {
            k('Mobile billing plans load failed:', n), (z.value = N), (j.value = !0)
          } finally {
            E.value = !1
          }
        },
        W = (l) =>
          l.map((l) => {
            var e
            return {
              id: l.id,
              date: (null == (e = l.createdAt) ? void 0 : e.slice(0, 10)) || '-',
              description: l.planName || l.billNumber,
              amount: G(l.currency, l.amount),
              status: l.status,
              downloadUrl: l.downloadUrl
            }
          }),
        Y = async () => {
          var l, e
          ;(x.value = !0), (q.value = !1), (I.value = !1)
          try {
            const [a, i] = await Promise.allSettled([
              f({ limit: 20, offset: 0 }),
              C.value ? h() : Promise.resolve(null)
            ])
            'fulfilled' === a.status
              ? ((P.value = W((null == (l = a.value) ? void 0 : l.bills) || [])),
                (O.value = Number((null == (e = a.value) ? void 0 : e.total) || P.value.length)))
              : ((P.value = []), (O.value = 0), (q.value = !0)),
              'fulfilled' === i.status && i.value && (R.value = i.value)
          } catch (a) {
            k('Mobile billing payment load failed:', a), (P.value = []), (O.value = 0), (q.value = !0)
          } finally {
            x.value = !1
          }
        },
        L = i(() => P.value.length < O.value),
        D = async () => {
          if (!T.value && L.value) {
            ;(T.value = !0), (I.value = !1)
            try {
              const l = await f({ limit: 20, offset: P.value.length }),
                e = new Set(P.value.map((l) => l.id)),
                a = W((null == l ? void 0 : l.bills) || []).filter((l) => !e.has(l.id))
              ;(P.value = [...P.value, ...a]), (O.value = Number((null == l ? void 0 : l.total) || P.value.length))
            } catch (l) {
              k('Mobile billing payment pagination failed:', l), (I.value = !0)
            } finally {
              T.value = !1
            }
          }
        },
        H = async () => {
          ;(F.value = !0), (U.value = !1)
          try {
            const l = await w()
            ;(B.value = (null == l ? void 0 : l.summary) || null),
              ($.value = ((null == l ? void 0 : l.quotas) || []).map((l) => ({
                type: l.type,
                label: A[l.type] || l.type,
                current: l.current,
                total: l.total
              })))
          } catch (l) {
            k('Mobile billing usage load failed:', l), ($.value = []), (U.value = !0)
          } finally {
            F.value = !1
          }
        },
        J = a(!1),
        Q = async () => {
          await Promise.all([X(), Y(), H()])
        },
        V = async () => {
          if (!J.value) {
            J.value = !0
            try {
              await Q()
            } finally {
              J.value = !1
            }
          }
        }
      s(Q)
      const Z = (l) => {
          e.value = l
        },
        ll = (l) => {
          switch (l) {
            case 'paid':
            case 'active':
              return 'success'
            case 'pending':
              return 'warning'
            case 'overdue':
              return 'danger'
            case 'cancelled':
              return 'default'
            default:
              return 'info'
          }
        },
        el = (l) => {
          switch (l) {
            case 'paid':
              return '已支付'
            case 'pending':
              return '待处理'
            case 'overdue':
              return '已逾期'
            case 'active':
              return '订阅中'
            case 'cancelled':
              return '已取消'
            default:
              return l
          }
        }
      return () =>
        n('div', { class: 'mobile-billing' }, [
          n('div', { class: 'mobile-billing__header' }, [
            n('div', null, [
              n('h2', { class: 'mobile-billing__title' }, [C.value ? '计费运营' : '我的订阅']),
              n('div', { class: 'mobile-billing__subtitle' }, [
                C.value ? '管理套餐、支付与用量' : '查看套餐、账单与配额'
              ])
            ]),
            n(
              t,
              { size: 'small', type: 'primary', plain: !0, loading: J.value, onClick: V, 'aria-label': '刷新计费数据' },
              { default: () => [n(r, { size: 18 }, null)] }
            )
          ]),
          n('div', { class: 'mobile-billing__tab-bar', role: 'tablist', 'aria-label': '计费信息' }, [
            n(
              'button',
              {
                type: 'button',
                class: ['mobile-billing__tab', 'plans' === e.value ? 'mobile-billing__tab--active' : ''],
                role: 'tab',
                'aria-selected': 'plans' === e.value,
                onClick: () => Z('plans')
              },
              [n(u, { size: 16 }, null), n('span', null, [o('套餐')])]
            ),
            n(
              'button',
              {
                type: 'button',
                class: ['mobile-billing__tab', 'payment' === e.value ? 'mobile-billing__tab--active' : ''],
                role: 'tab',
                'aria-selected': 'payment' === e.value,
                onClick: () => Z('payment')
              },
              [n(c, { size: 16 }, null), n('span', null, [o('支付')])]
            ),
            n(
              'button',
              {
                type: 'button',
                class: ['mobile-billing__tab', 'usage' === e.value ? 'mobile-billing__tab--active' : ''],
                role: 'tab',
                'aria-selected': 'usage' === e.value,
                onClick: () => Z('usage')
              },
              [n(b, { size: 16 }, null), n('span', null, [o('用量')])]
            )
          ]),
          n('div', { class: 'mobile-billing__content' }, [
            'plans' === e.value &&
              (E.value
                ? n('div', { class: 'mobile-billing__loading' }, [n(m, { size: '28px' }, null)])
                : j.value && 0 === z.value.length
                  ? n('div', { class: 'mobile-billing__error-state' }, [
                      n('div', { class: 'mobile-billing__error-content' }, [
                        n(v, { description: '套餐数据加载失败' }, null),
                        n(t, { size: 'small', type: 'primary', onClick: X }, { default: () => [o('重新加载')] })
                      ])
                    ])
                  : 0 === z.value.length
                    ? n('div', { class: 'mobile-billing__empty-state' }, [n(v, { description: '暂无可用套餐' }, null)])
                    : n('div', { class: 'mobile-billing__plans-list' }, [
                        z.value.map((e) =>
                          n(
                            'article',
                            {
                              key: e.value,
                              class: [
                                'mobile-billing__plan-card',
                                M.value === e.value ? 'mobile-billing__plan-card--current' : ''
                              ]
                            },
                            [
                              n('div', { class: 'mobile-billing__plan-header' }, [
                                n('div', { class: 'mobile-billing__plan-name-row' }, [
                                  n('span', { class: 'mobile-billing__plan-name' }, [e.name]),
                                  M.value === e.value &&
                                    n(l, { size: 'small', type: 'success' }, { default: () => [o('当前套餐')] })
                                ]),
                                n('div', { class: 'mobile-billing__plan-price' }, [
                                  n('span', { class: 'mobile-billing__plan-price-value' }, [e.price]),
                                  n('span', { class: 'mobile-billing__plan-price-period' }, [e.period])
                                ])
                              ]),
                              n('div', { class: 'mobile-billing__plan-features' }, [
                                e.features.map((l, e) =>
                                  n('div', { key: e, class: 'mobile-billing__plan-feature' }, [
                                    n('span', { class: 'mobile-billing__plan-feature-dot' }, null),
                                    n('span', null, [l])
                                  ])
                                )
                              ]),
                              n('div', { class: 'mobile-billing__plan-status' }, [
                                n(
                                  l,
                                  { size: 'small', type: ll(M.value === e.value ? S.value : 'pending') },
                                  { default: () => [M.value === e.value ? el(S.value) : '可订阅'] }
                                )
                              ])
                            ]
                          )
                        )
                      ])),
            'payment' === e.value &&
              (x.value
                ? n('div', { class: 'mobile-billing__loading' }, [n(m, { size: '28px' }, null)])
                : q.value && 0 === P.value.length
                  ? n('div', { class: 'mobile-billing__error-state' }, [
                      n('div', { class: 'mobile-billing__error-content' }, [
                        n(v, { description: '账单数据加载失败' }, null),
                        n(t, { size: 'small', type: 'primary', onClick: Y }, { default: () => [o('重新加载')] })
                      ])
                    ])
                  : 0 === P.value.length
                    ? n('div', { class: 'mobile-billing__empty-state' }, [n(v, { description: '暂无账单记录' }, null)])
                    : n('div', { class: 'mobile-billing__payment-section' }, [
                        C.value && R.value
                          ? n('div', { class: 'mobile-billing__admin-summary' }, [
                              n('div', { class: 'mobile-billing__summary-grid' }, [
                                n('div', { class: 'mobile-billing__summary-card' }, [
                                  n('div', { class: 'mobile-billing__summary-label' }, [o('活跃订阅')]),
                                  n('div', { class: 'mobile-billing__summary-value' }, [
                                    R.value.summary.activeSubscriptions
                                  ])
                                ]),
                                n('div', { class: 'mobile-billing__summary-card' }, [
                                  n('div', { class: 'mobile-billing__summary-label' }, [o('已确认收入')]),
                                  n('div', { class: 'mobile-billing__summary-value' }, [
                                    G(R.value.currency, R.value.summary.paidRevenue)
                                  ])
                                ]),
                                n('div', { class: 'mobile-billing__summary-card' }, [
                                  n('div', { class: 'mobile-billing__summary-label' }, [o('待收款')]),
                                  n('div', { class: 'mobile-billing__summary-value' }, [
                                    G(R.value.currency, R.value.summary.pendingRevenue)
                                  ])
                                ]),
                                n('div', { class: 'mobile-billing__summary-card' }, [
                                  n('div', { class: 'mobile-billing__summary-label' }, [o('逾期风险')]),
                                  n('div', { class: 'mobile-billing__summary-value' }, [
                                    G(R.value.currency, R.value.summary.overdueRevenue)
                                  ])
                                ])
                              ])
                            ])
                          : null,
                        n('div', { class: 'mobile-billing__payment-list' }, [
                          P.value.map((e) => {
                            let a
                            return n('article', { key: e.id, class: 'mobile-billing__payment-card' }, [
                              n('div', { class: 'mobile-billing__payment-card-header' }, [
                                n('div', { class: 'mobile-billing__payment-card-desc' }, [e.description]),
                                n(
                                  l,
                                  { size: 'small', type: ll(e.status) },
                                  ((i = a = el(e.status)),
                                  'function' == typeof i ||
                                  ('[object Object]' === Object.prototype.toString.call(i) && !p(i))
                                    ? a
                                    : { default: () => [a] })
                                )
                              ]),
                              n('div', { class: 'mobile-billing__payment-card-body' }, [
                                n('span', { class: 'mobile-billing__payment-card-amount' }, [e.amount]),
                                n('span', { class: 'mobile-billing__payment-card-date' }, [e.date])
                              ]),
                              e.downloadUrl &&
                                n(
                                  'a',
                                  {
                                    class: 'mobile-billing__receipt-link',
                                    href: e.downloadUrl,
                                    target: '_blank',
                                    rel: 'noreferrer'
                                  },
                                  [o('查看账单凭证')]
                                )
                            ])
                            var i
                          })
                        ]),
                        L.value &&
                          n('div', { class: 'mobile-billing__load-more' }, [
                            n(
                              t,
                              { size: 'small', type: 'primary', loading: T.value, onClick: D },
                              { default: () => [o('加载更多账单 ('), P.value.length, o('/'), O.value, o(')')] }
                            ),
                            I.value &&
                              n('p', { class: 'mobile-billing__load-more-error', role: 'alert' }, [
                                o('更多账单加载失败，请重试。')
                              ])
                          ])
                      ])),
            'usage' === e.value &&
              (F.value
                ? n('div', { class: 'mobile-billing__loading' }, [n(m, { size: '28px' }, null)])
                : U.value
                  ? n('div', { class: 'mobile-billing__error-state' }, [
                      n('div', { class: 'mobile-billing__error-content' }, [
                        n(v, { description: '用量数据加载失败' }, null),
                        n(t, { size: 'small', type: 'primary', onClick: H }, { default: () => [o('重新加载')] })
                      ])
                    ])
                  : 0 === $.value.length
                    ? n('div', { class: 'mobile-billing__empty-state' }, [n(v, { description: '暂无用量数据' }, null)])
                    : n('div', { class: 'mobile-billing__usage-section' }, [
                        B.value &&
                          n('div', { class: 'mobile-billing__usage-plan-badge' }, [
                            n(l, { type: 'info' }, { default: () => [B.value.planDisplayName || B.value.planName] }),
                            n('span', { class: 'mobile-billing__usage-expiry' }, [
                              o('到期时间：'),
                              B.value.expiresAt || '—'
                            ])
                          ]),
                        n('div', { class: 'mobile-billing__usage-quotas' }, [
                          $.value.map((e) => {
                            const a = (i = e).total ? Math.min(Math.round((i.current / i.total) * 100), 100) : 0
                            var i
                            return n('article', { key: e.type, class: 'mobile-billing__usage-quota-card' }, [
                              n('div', { class: 'mobile-billing__usage-quota-head' }, [
                                n('span', { class: 'mobile-billing__usage-quota-label' }, [e.label]),
                                n(
                                  l,
                                  { size: 'small', type: a >= 100 ? 'danger' : a >= 85 ? 'warning' : 'success' },
                                  { default: () => [a, o('%')] }
                                )
                              ]),
                              n('div', { class: 'mobile-billing__usage-quota-value' }, [
                                K(e.current),
                                o(' / '),
                                K(e.total)
                              ]),
                              n(
                                d,
                                {
                                  percentage: a,
                                  showPivot: !1,
                                  strokeWidth: '8px',
                                  color:
                                    a >= 100
                                      ? 'var(--color-danger-6)'
                                      : a >= 85
                                        ? 'var(--color-warning-6)'
                                        : 'var(--color-success-6)',
                                  trackColor: 'var(--color-fill-2)'
                                },
                                null
                              )
                            ])
                          })
                        ])
                      ]))
          ])
        ])
    }
  })
export { C as default }
