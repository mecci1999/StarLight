import {
  p as e,
  a1 as i,
  a0 as a,
  aP as t,
  a2 as l,
  w as n,
  ac as o,
  aR as s,
  bt as c,
  bu as r,
  bv as u,
  ba as m,
  b2 as d,
  bw as v,
  ai as f
} from './invariable-DewVS0br.js'
import { M as _ } from './MobileButton-BKhxhz5A.js'
import { M as b } from './MobileCard-BxmuYclQ.js'
import { M as p } from './MobileTag-ByR2jSPf.js'
import { M as y } from './MobileEmpty-BimvXy70.js'
import { M as h } from './MobileLoading-DlB38x7T.js'
import { M as g } from './MobileInput-OCuvcoNh.js'
import { m as k } from './MobileToast-CIN42EDh.js'
import { k as w, l as C } from './alerts-CIHfuoAx.js'
import { d as M } from './index-DFkcx8xz.js'
import { p as j, r as z } from './investigationContext-7xMjfbkf.js'
import { g as E, d as N, r as T } from './notificationCenterModel-BUEljd8S.js'
import './request-BiInMBwl.js'
function x(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !f(e))
}
const I = (e) => {
    if (!e) return '-'
    const i = new Date(e)
    if (Number.isNaN(i.getTime())) return e
    const a = Date.now() - i.getTime()
    return a < 6e4
      ? '刚刚'
      : a < 36e5
        ? `${Math.floor(a / 6e4)}分钟前`
        : a < 864e5
          ? `${Math.floor(a / 36e5)}小时前`
          : a < 6048e5
            ? `${Math.floor(a / 864e5)}天前`
            : i.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  },
  W = [
    { label: '全部', value: '' },
    { label: 'Email', value: 'Email' },
    { label: 'Webhook', value: 'Webhook' },
    { label: '站内通知', value: 'InApp' }
  ],
  $ = [
    { label: '全部状态', value: '' },
    { label: '成功', value: 'success' },
    { label: '失败', value: 'failed' },
    { label: '待发送', value: 'pending' }
  ],
  q = { Email: u, email: u, Webhook: r, webhook: r, InApp: c },
  A = { Email: 'info', email: 'info', Webhook: 'warning', webhook: 'warning', InApp: 'success' },
  D = { Email: 'Email', email: 'Email', Webhook: 'Webhook', webhook: 'Webhook', InApp: '站内通知' },
  L = { success: 'success', failed: 'danger', pending: 'warning' },
  V = { success: '成功', failed: '失败', pending: '发送中' },
  B = e({
    name: 'MobileNotificationCenter',
    setup() {
      const e = m(),
        c = i(() => M()),
        r = a(''),
        f = a(''),
        B = a(''),
        O = a(!1),
        P = a(''),
        S = a([]),
        U = a([]),
        F = a(15),
        K = a(null),
        R = i(() => U.value.slice(0, F.value)),
        X = i(() => U.value.length > F.value),
        Y = i(() => U.value.filter((e) => 'success' === e.status).length),
        Z = i(() => U.value.filter((e) => 'failed' === e.status).length),
        G = i(() => U.value.filter((e) => 'pending' === e.status).length),
        H = i(() => {
          const e = U.value.length
          return e ? `${((Y.value / e) * 100).toFixed(1)}%` : '0%'
        }),
        J = () => {
          ;(U.value = S.value.filter((e) => {
            if (f.value && e.channel !== f.value) return !1
            if (B.value && e.status !== B.value) return !1
            if (r.value) {
              const i = r.value.toLowerCase()
              if (![e.ruleName, e.service, e.recipient, e.content].filter(Boolean).join(' ').toLowerCase().includes(i))
                return !1
            }
            return !0
          })),
            (F.value = 15),
            (K.value = null)
        },
        Q = async () => {
          ;(O.value = !0), (P.value = '')
          try {
            const i = j(e.query),
              a = z(i),
              t = await w({
                keyword: i.keyword || '',
                channel: '',
                status: '',
                ...(i.serviceId ? { serviceId: i.serviceId } : {}),
                ...(a ? { startTime: a.start, endTime: a.end } : {}),
                scope: c.value
              })
            ;(S.value = (t || []).map((e, i) => ({
              key: e.id || `notification-${i}`,
              sendTime: I(e.sentAt || e.sendTime),
              ruleName: e.type || e.ruleName || '系统通知',
              service: e.service || '系统',
              channel: e.channel,
              recipient: e.target || e.recipient || '-',
              status: 'sent' === e.status || 'delivered' === e.status ? 'success' : e.status,
              retryCount: e.retryCount || 0,
              content: e.content,
              errorMessage: e.errorMessage || ''
            }))),
              J()
          } catch (i) {
            ;(S.value = []), (U.value = []), (P.value = '通知历史加载失败，请检查告警服务或稍后重试。')
          } finally {
            O.value = !1
          }
        },
        ee = (e) => {
          K.value = K.value === e ? null : e
        },
        ie = async (e) => {
          const i = e.status,
            a = e.retryCount
          ;(e.status = 'pending'), (e.retryCount = E(e.retryCount))
          try {
            const i = await C(e.key)
            if (!N(i)) throw new Error('notification resend rejected')
            await Q(), k.success('重发成功')
          } catch (t) {
            ;(e.status = i || 'failed'), (e.retryCount = T(e.retryCount, a)), k.error('重发失败')
          }
        },
        ae = async () => {
          const e = U.value.filter((e) => 'failed' === e.status)
          if (e.length) {
            for (const i of e) await ie(i)
            await Q()
          } else k.info('当前没有可重发的失败通知')
        },
        te = () => {
          F.value = Math.min(F.value + 15, U.value.length)
        }
      return (
        t(() => {
          const i = j(e.query)
          void 0 !== i.keyword && (r.value = i.keyword), Q()
        }),
        l(
          () => e.query,
          () => {
            const i = j(e.query)
            void 0 !== i.keyword && (r.value = i.keyword),
              (void 0 === i.keyword && void 0 === i.serviceId && void 0 === i.range && void 0 === i.start) || Q()
          }
        ),
        l(
          () => [r.value, f.value, B.value],
          () => {
            J()
          }
        ),
        () => {
          let e
          return n('div', { class: 'mobile-notification-center' }, [
            n('header', { class: 'mobile-notification-center__header' }, [
              n('h2', { class: 'mobile-notification-center__title' }, [o('通知历史')]),
              n('div', { class: 'mobile-notification-center__header-actions' }, [
                n(
                  _,
                  {
                    size: 'small',
                    onClick: Q,
                    class: 'mobile-notification-center__refresh-btn',
                    loading: O.value,
                    icon: () => s(d, { size: 16 })
                  },
                  null
                )
              ])
            ]),
            n('div', { class: 'mobile-notification-center__summary-grid' }, [
              [
                { label: '总计', value: U.value.length, tone: 'total' },
                { label: '成功', value: Y.value, tone: 'success' },
                { label: '失败', value: Z.value, tone: 'danger' },
                { label: '成功率', value: H.value, tone: 'primary' }
              ].map((e) =>
                n(
                  b,
                  { key: e.label, size: 'small', bordered: !1, class: 'mobile-notification-center__summary-card' },
                  {
                    default: () => [
                      n(
                        'div',
                        {
                          class: `mobile-notification-center__summary-value mobile-notification-center__summary-value--${e.tone}`
                        },
                        [e.value]
                      ),
                      n('div', { class: 'mobile-notification-center__summary-label' }, [e.label])
                    ]
                  }
                )
              )
            ]),
            n('div', { class: 'mobile-notification-center__search' }, [
              n(
                g,
                {
                  modelValue: r.value,
                  'onUpdate:modelValue': (e) => {
                    r.value = e
                  },
                  placeholder: '搜索通知内容',
                  clearable: !0,
                  class: 'mobile-notification-center__search-input'
                },
                null
              )
            ]),
            n('div', { class: 'mobile-notification-center__filters' }, [
              n('div', { class: 'mobile-notification-center__chip-row' }, [
                W.map((e) => {
                  const i = f.value === e.value
                  return n(
                    _,
                    {
                      key: e.value,
                      size: 'small',
                      type: i ? 'primary' : 'ghost',
                      onClick: () => {
                        f.value = e.value
                      }
                    },
                    { default: () => [e.label] }
                  )
                })
              ]),
              n('div', { class: 'mobile-notification-center__chip-row' }, [
                $.map((e) => {
                  const i = B.value === e.value
                  return n(
                    _,
                    {
                      key: e.value,
                      size: 'small',
                      type: i ? 'primary' : 'ghost',
                      onClick: () => {
                        B.value = e.value
                      }
                    },
                    { default: () => [e.label] }
                  )
                })
              ])
            ]),
            Z.value > 0 &&
              n('div', { class: 'mobile-notification-center__action-bar' }, [
                n('div', { class: 'mobile-notification-center__action-stats' }, [
                  n(p, { type: 'danger', size: 'small', plain: !1 }, { default: () => [o('失败 '), Z.value] }),
                  n(p, { type: 'warning', size: 'small', plain: !1 }, { default: () => [o('等待中 '), G.value] })
                ]),
                n(_, { size: 'small', type: 'danger', onClick: ae }, { default: () => [o('批量重发')] })
              ]),
            O.value
              ? n('div', { class: 'mobile-notification-center__loading' }, [n(h, { size: 'large', loading: !0 }, null)])
              : P.value
                ? n('div', { class: 'mobile-notification-center__error' }, [
                    n(
                      y,
                      { description: P.value },
                      {
                        default: () => [
                          n(
                            _,
                            { size: 'small', onClick: Q, class: 'mobile-notification-center__retry-btn' },
                            { default: () => [o('重试')] }
                          )
                        ]
                      }
                    )
                  ])
                : 0 === U.value.length
                  ? n('div', { class: 'mobile-notification-center__empty' }, [
                      n(y, { description: '暂无通知记录' }, null),
                      n('p', { class: 'mobile-notification-center__empty-hint' }, [
                        r.value || f.value || B.value ? '调整筛选条件可能找到更多结果' : '暂无告警通知，系统运行正常'
                      ])
                    ])
                  : n('div', { class: 'mobile-notification-center__list-wrapper' }, [
                      n(
                        b,
                        { size: 'small', bordered: !1, class: 'mobile-notification-center__list-card' },
                        x(
                          (e = R.value.map((e) => {
                            const i = K.value === e.key,
                              a = A[e.channel] || 'default',
                              t = D[e.channel] || e.channel,
                              l = L[e.status] || 'default',
                              c = V[e.status] || e.status
                            return n(
                              'div',
                              {
                                key: e.key,
                                class: [
                                  'mobile-notification-center__item',
                                  i && 'mobile-notification-center__item--expanded'
                                ]
                              },
                              [
                                n(
                                  'div',
                                  {
                                    class: 'mobile-notification-center__item-row',
                                    role: 'button',
                                    tabindex: '0',
                                    'aria-expanded': i,
                                    'aria-label': `${i ? '收起' : '展开'}通知：${e.ruleName}`,
                                    onClick: () => ee(e.key),
                                    onKeydown: (i) => {
                                      ;('Enter' !== i.key && ' ' !== i.key) || (i.preventDefault(), ee(e.key))
                                    }
                                  },
                                  [
                                    n('div', { class: 'mobile-notification-center__item-icon' }, [
                                      s(q[e.channel] || u, { size: 18 })
                                    ]),
                                    n('div', { class: 'mobile-notification-center__item-body' }, [
                                      n('div', { class: 'mobile-notification-center__item-top' }, [
                                        n('span', { class: 'mobile-notification-center__item-rule' }, [e.ruleName]),
                                        n('span', { class: 'mobile-notification-center__item-time' }, [e.sendTime])
                                      ]),
                                      n('div', { class: 'mobile-notification-center__item-meta' }, [
                                        n('span', { class: 'mobile-notification-center__item-content' }, [e.content])
                                      ]),
                                      n('div', { class: 'mobile-notification-center__item-tags' }, [
                                        n(p, { size: 'small', type: a, plain: !1 }, x(t) ? t : { default: () => [t] }),
                                        n(p, { size: 'small', type: l, plain: !1 }, x(c) ? c : { default: () => [c] }),
                                        n('span', { class: 'mobile-notification-center__item-service' }, [e.service])
                                      ])
                                    ]),
                                    s(v, {
                                      size: 16,
                                      class: [
                                        'mobile-notification-center__expand-icon',
                                        i && 'mobile-notification-center__expand-icon--open'
                                      ]
                                    })
                                  ]
                                ),
                                i &&
                                  n('div', { class: 'mobile-notification-center__detail-panel' }, [
                                    n('div', { class: 'mobile-notification-center__detail-grid' }, [
                                      n('div', { class: 'mobile-notification-center__detail-item' }, [
                                        n('span', { class: 'mobile-notification-center__detail-label' }, [
                                          o('发送时间')
                                        ]),
                                        n('span', { class: 'mobile-notification-center__detail-value' }, [e.sendTime])
                                      ]),
                                      n('div', { class: 'mobile-notification-center__detail-item' }, [
                                        n('span', { class: 'mobile-notification-center__detail-label' }, [
                                          o('通知渠道')
                                        ]),
                                        n('span', { class: 'mobile-notification-center__detail-value' }, [t])
                                      ]),
                                      n('div', { class: 'mobile-notification-center__detail-item' }, [
                                        n('span', { class: 'mobile-notification-center__detail-label' }, [
                                          o('发送状态')
                                        ]),
                                        n(p, { size: 'small', type: l, plain: !1 }, x(c) ? c : { default: () => [c] })
                                      ]),
                                      n('div', { class: 'mobile-notification-center__detail-item' }, [
                                        n('span', { class: 'mobile-notification-center__detail-label' }, [
                                          o('重试次数')
                                        ]),
                                        n('span', { class: 'mobile-notification-center__detail-value' }, [
                                          e.retryCount || 0
                                        ])
                                      ]),
                                      n('div', { class: 'mobile-notification-center__detail-item' }, [
                                        n('span', { class: 'mobile-notification-center__detail-label' }, [
                                          o('服务名称')
                                        ]),
                                        n('span', { class: 'mobile-notification-center__detail-value' }, [e.service])
                                      ]),
                                      n('div', { class: 'mobile-notification-center__detail-item' }, [
                                        n('span', { class: 'mobile-notification-center__detail-label' }, [o('接收人')]),
                                        n('span', { class: 'mobile-notification-center__detail-value' }, [e.recipient])
                                      ]),
                                      n(
                                        'div',
                                        {
                                          class:
                                            'mobile-notification-center__detail-item mobile-notification-center__detail-item--full'
                                        },
                                        [
                                          n('span', { class: 'mobile-notification-center__detail-label' }, [
                                            o('通知内容')
                                          ]),
                                          n('span', { class: 'mobile-notification-center__detail-value' }, [
                                            e.content || '无'
                                          ])
                                        ]
                                      ),
                                      e.errorMessage &&
                                        n(
                                          'div',
                                          {
                                            class:
                                              'mobile-notification-center__detail-item mobile-notification-center__detail-item--full'
                                          },
                                          [
                                            n('span', { class: 'mobile-notification-center__detail-label' }, [
                                              o('错误信息')
                                            ]),
                                            n(
                                              'span',
                                              {
                                                class:
                                                  'mobile-notification-center__detail-value mobile-notification-center__detail-value--error'
                                              },
                                              [e.errorMessage]
                                            )
                                          ]
                                        )
                                    ]),
                                    'failed' === e.status &&
                                      n('div', { class: 'mobile-notification-center__detail-actions' }, [
                                        n(
                                          _,
                                          { size: 'small', type: 'danger', onClick: () => ie(e) },
                                          { default: () => [o('重新发送')] }
                                        )
                                      ])
                                  ])
                              ]
                            )
                          }))
                        )
                          ? e
                          : { default: () => [e] }
                      ),
                      X.value &&
                        n('div', { class: 'mobile-notification-center__load-more' }, [
                          n(
                            _,
                            { type: 'ghost', onClick: te },
                            { default: () => [o('加载更多 ('), U.value.length - F.value, o(' 条)')] }
                          )
                        ])
                    ])
          ])
        }
      )
    }
  })
export { B as default }
