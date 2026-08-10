import {
  p as e,
  a1 as a,
  a0 as t,
  ba as l,
  a3 as n,
  a2 as i,
  w as s,
  ab as r,
  cz as o,
  ag as c,
  ac as u,
  cM as d,
  cN as v,
  am as p,
  cO as f,
  ci as y,
  a6 as g,
  ch as m,
  dn as b,
  dp as h,
  aR as _,
  ai as w
} from './invariable-DewVS0br.js'
import { P as k } from './PageHeader-OtleDOO-.js'
import { R as x } from './ResultTable-B_9U75PU.js'
import { D as C } from './DetailDrawer-C1HE8GcD.js'
import { k as j, l as N } from './alerts-CIHfuoAx.js'
import { d as z } from './index-DFkcx8xz.js'
import { g as I, d as $, r as q } from './notificationCenterModel-BUEljd8S.js'
import './request-BiInMBwl.js'
const M = (e) => {
    if (!e) return '-'
    const a = new Date(e)
    if (Number.isNaN(a.getTime())) return e
    const t = Date.now() - a.getTime()
    return t < 6e4
      ? '刚刚'
      : t < 36e5
        ? `${Math.floor(t / 6e4)}分钟前`
        : t < 864e5
          ? `${Math.floor(t / 36e5)}小时前`
          : t < 6048e5
            ? `${Math.floor(t / 864e5)}天前`
            : a.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  },
  E = e({
    name: 'NotificationCenterPage',
    setup() {
      const e = l(),
        E = a(() => z()),
        T = t(''),
        D = t(''),
        P = t(''),
        S = t(e.query.serviceId),
        W = t(!1),
        L = t(null),
        U = t(!1),
        A = t(''),
        O = t([]),
        R = t([]),
        H = () => {
          R.value = O.value.filter((e) => {
            if (D.value && e.channel !== D.value) return !1
            if (P.value && e.status !== P.value) return !1
            if (T.value) {
              const a = T.value.toLowerCase()
              if (![e.ruleName, e.service, e.recipient, e.content].filter(Boolean).join(' ').toLowerCase().includes(a))
                return !1
            }
            return !0
          })
        },
        B = async () => {
          ;(U.value = !0), (A.value = '')
          try {
            const e = await j({ keyword: '', channel: '', status: '', serviceId: S.value, scope: E.value })
            ;(O.value = (e || []).map((e, a) => ({
              key: e.id || `notification-${a}`,
              sendTime: M(e.sentAt || e.sendTime),
              ruleName: e.type || e.ruleName || '系统通知',
              service: e.service || '系统',
              channel: e.channel,
              recipient: e.target || e.recipient || '-',
              status: 'sent' === e.status || 'delivered' === e.status ? 'success' : e.status,
              retryCount: e.retryCount || 0,
              content: e.content,
              errorMessage: e.errorMessage || ''
            }))),
              H()
          } catch (e) {
            ;(O.value = []), (R.value = []), (A.value = '通知历史加载失败，请检查告警服务或稍后重试。')
          } finally {
            U.value = !1
          }
        },
        F = a(() => R.value.filter((e) => 'success' === e.status).length),
        G = a(() => R.value.filter((e) => 'failed' === e.status).length),
        K = a(() => R.value.filter((e) => 'pending' === e.status).length)
      a(() => R.value.filter((e) => 'failed' === e.status))
      const J = a(() => {
          const e = new Map()
          return (
            O.value.forEach((a) => {
              e.set(a.channel, (e.get(a.channel) || 0) + 1)
            }),
            V.slice(1).map((a) => ({ channel: a.value, label: a.label, count: e.get(a.value) || 0 }))
          )
        }),
        Q = a(() => {
          const e = R.value.length
          return e ? `${((F.value / e) * 100).toFixed(1)}%` : '0%'
        })
      n(() => {
        e.query.serviceId && 'string' == typeof e.query.serviceId && (S.value = e.query.serviceId), B()
      }),
        i(
          () => [T.value, D.value, P.value],
          () => {
            H()
          }
        ),
        i(
          () => e.query.serviceId,
          () => {
            ;(S.value = 'string' == typeof e.query.serviceId ? e.query.serviceId : void 0), B()
          }
        )
      const V = [
          { label: '全部渠道', value: '' },
          { label: 'Email', value: 'Email' },
          { label: 'Webhook', value: 'Webhook' },
          { label: '站内通知', value: 'InApp' }
        ],
        X = [
          { label: '全部状态', value: '' },
          { label: '发送成功', value: 'success' },
          { label: '发送失败', value: 'failed' },
          { label: '发送中', value: 'pending' }
        ],
        Y = [
          { title: '发送时间', key: 'sendTime', width: 140 },
          {
            title: '通知内容',
            key: 'content',
            width: 360,
            ellipsis: { tooltip: !0 },
            render: (e) =>
              s('div', { class: 'notification-center-page__content-cell' }, [
                s('strong', null, [e.ruleName]),
                s('span', null, [e.content])
              ])
          },
          { title: '服务', key: 'service', width: 120 },
          {
            title: '渠道',
            key: 'channel',
            width: 100,
            render(e) {
              const a = {
                Email: { type: 'info', text: 'Email' },
                email: { type: 'info', text: 'Email' },
                Webhook: { type: 'warning', text: 'Webhook' },
                webhook: { type: 'warning', text: 'Webhook' },
                InApp: { type: 'success', text: '站内通知' }
              }[e.channel] || { type: 'default', text: e.channel || '未知' }
              return _(y, { type: a.type, size: 'small', bordered: !1 }, { default: () => a.text })
            }
          },
          {
            title: '状态',
            key: 'status',
            width: 80,
            render(e) {
              const a = {
                success: { type: 'success', text: '成功' },
                failed: { type: 'error', text: '失败' },
                pending: { type: 'warning', text: '发送中' }
              }[e.status] || { type: 'default', text: e.status || '未知' }
              return _(y, { type: a.type, size: 'small', bordered: !1 }, { default: () => a.text })
            }
          },
          {
            title: '操作',
            key: 'actions',
            width: 160,
            render: (e) =>
              s('div', { class: 'notification-center-page__table-actions' }, [
                s(
                  c,
                  { size: 'small', type: 'primary', secondary: !0, onClick: () => Z(e) },
                  { default: () => [u('详情')] }
                ),
                'failed' === e.status
                  ? s(
                      c,
                      { size: 'small', type: 'warning', secondary: !0, onClick: () => ee(e) },
                      { default: () => [u('重发')] }
                    )
                  : null
              ])
          }
        ],
        Z = (e) => {
          ;(L.value = e), (W.value = !0)
        },
        ee = async (e) => {
          const a = e.status,
            t = e.retryCount
          ;(e.status = 'pending'), (e.retryCount = I(e.retryCount))
          try {
            const a = await N(e.key)
            if (!$(a)) throw new Error('notification resend rejected')
            await B(), window.$message.success('重发成功')
          } catch (l) {
            ;(e.status = a || 'failed'), (e.retryCount = q(e.retryCount, t)), window.$message.error('重发失败')
          }
        },
        ae = async () => {
          const e = R.value.filter((e) => 'failed' === e.status)
          if (e.length) {
            for (const a of e) await ee(a)
            await B()
          } else window.$message.info('当前没有可重发的失败通知')
        }
      return () => {
        let e
        return s('div', { class: 'notification-center-page' }, [
          s(k, { title: '通知历史', subtitle: '告警触发后的通知记录与投递结果' }, null),
          s('section', { class: 'notification-center-page__toolbar-card' }, [
            s('div', { class: 'notification-center-page__toolbar-primary' }, [
              s(
                r,
                {
                  value: T.value,
                  'onUpdate:value': (e) => (T.value = e),
                  placeholder: '搜索通知内容',
                  clearable: !0,
                  style: { width: '200px' },
                  onClear: B
                },
                null
              ),
              s(
                o,
                {
                  value: D.value,
                  'onUpdate:value': (e) => (D.value = e),
                  options: V,
                  placeholder: '渠道',
                  style: { width: '120px' }
                },
                null
              ),
              s(
                o,
                {
                  value: P.value,
                  'onUpdate:value': (e) => (P.value = e),
                  options: X,
                  placeholder: '状态',
                  style: { width: '110px' }
                },
                null
              )
            ]),
            s('div', { class: 'notification-center-page__toolbar-secondary' }, [
              s(c, { loading: U.value, onClick: B }, { default: () => [u('刷新')] })
            ])
          ]),
          s(
            d,
            { cols: 4, xGap: 16, class: 'notification-center-page__summary-grid' },
            ((a = e =
              [
                { label: '总通知数', value: R.value.length },
                { label: '发送成功', value: F.value },
                { label: '发送失败', value: G.value },
                { label: '成功率', value: Q.value }
              ].map((e) =>
                s(
                  v,
                  { key: e.label },
                  {
                    default: () => [
                      s(
                        p,
                        { bordered: !1, class: 'notification-center-page__summary-card' },
                        {
                          default: () => [
                            s('div', { class: 'notification-center-page__summary-label' }, [e.label]),
                            s('div', { class: 'notification-center-page__summary-value' }, [e.value])
                          ]
                        }
                      )
                    ]
                  }
                )
              )),
            'function' == typeof a || ('[object Object]' === Object.prototype.toString.call(a) && !w(a))
              ? e
              : { default: () => [e] })
          ),
          s(
            p,
            { bordered: !1, class: 'notification-center-page__action-card' },
            {
              default: () => [
                s('div', { class: 'notification-center-page__action-row' }, [
                  s('div', { class: 'notification-center-page__action-copy' }, [
                    s('div', { class: 'notification-center-page__action-title' }, [u('通知操作')]),
                    s('div', { class: 'notification-center-page__action-desc' }, [
                      u('对当前筛选范围内的失败通知进行批量重发。')
                    ])
                  ]),
                  s(
                    f,
                    { class: 'notification-center-page__action-buttons' },
                    {
                      default: () => [
                        s(
                          c,
                          { type: 'primary', onClick: ae, disabled: 0 === G.value },
                          { default: () => [u('批量重发失败通知')] }
                        ),
                        s(y, { type: 'info', bordered: !1 }, { default: () => [u('待发送：'), K.value] }),
                        s(
                          y,
                          { type: G.value > 0 ? 'error' : 'success', bordered: !1 },
                          { default: () => [u('失败：'), G.value] }
                        )
                      ]
                    }
                  )
                ])
              ]
            }
          ),
          s('section', { class: 'notification-center-page__table-card' }, [
            s('div', { class: 'notification-center-page__table-header' }, [
              s('div', null, [
                s('div', { class: 'notification-center-page__section-title' }, [u('通知清单')]),
                s('div', { class: 'notification-center-page__section-desc' }, [
                  u('渠道汇总：'),
                  J.value
                    .filter((e) => e.count > 0)
                    .map((e) => `${e.label}（${e.count}）`)
                    .join(' · ') || '暂无'
                ])
              ])
            ]),
            U.value
              ? s('div', { class: 'notification-center-page__table-loading' }, [s(g, { size: 'large' }, null)])
              : A.value
                ? s(
                    m,
                    { description: A.value, class: 'notification-center-page__empty-state' },
                    {
                      extra: () =>
                        s(c, { type: 'primary', secondary: !0, onClick: B }, { default: () => [u('重试加载')] })
                    }
                  )
                : s('div', { class: 'notification-center-page__table-shell' }, [
                    s(
                      x,
                      {
                        class: 'notification-center-page__table',
                        loading: !1,
                        columns: Y,
                        data: R.value,
                        pagination: { pageSize: 10, showSizePicker: !0, pageSizes: [10, 20, 50] },
                        bordered: !1,
                        singleLine: !1,
                        flexHeight: !1,
                        rowKey: (e) => e.key
                      },
                      null
                    )
                  ])
          ]),
          s(
            C,
            {
              show: W.value,
              title: '通知详情',
              width: 'md',
              'onUpdate:show': (e) => {
                W.value = e
              }
            },
            {
              default: () => [
                L.value &&
                  s(
                    b,
                    { column: 1, bordered: !0 },
                    {
                      default: () => [
                        s(h, { label: '发送时间' }, { default: () => [L.value.sendTime] }),
                        s(h, { label: '告警规则' }, { default: () => [L.value.ruleName] }),
                        s(h, { label: '服务' }, { default: () => [L.value.service] }),
                        s(h, { label: '通知渠道' }, { default: () => [L.value.channel] }),
                        s(h, { label: '发送状态' }, { default: () => [L.value.status] }),
                        s(h, { label: '通知内容' }, { default: () => [L.value.content] })
                      ]
                    }
                  )
              ]
            }
          )
        ])
        var a
      }
    }
  })
export { E as default }
