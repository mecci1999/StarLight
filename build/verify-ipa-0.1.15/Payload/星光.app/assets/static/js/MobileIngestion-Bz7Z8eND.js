import { m as e } from './MobileToast-CIN42EDh.js'
import { M as i } from './MobileTag-ByR2jSPf.js'
import {
  p as a,
  a0 as s,
  a1 as l,
  aP as n,
  w as t,
  ac as o,
  b9 as r,
  b2 as c,
  b0 as u,
  aZ as m,
  bB as v,
  bC as d,
  b6 as _,
  a$ as p,
  ai as b
} from './invariable-DewVS0br.js'
import { m as g, n as y, g as f, o as h } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import './index-DFkcx8xz.js'
function k(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !b(e))
}
const w = a({
  name: 'MobileIngestion',
  setup() {
    const a = s(!1),
      b = s(!1),
      w = s([]),
      A = s(null),
      x = s(null),
      K = s(!1),
      z = s(''),
      j = s(''),
      C = l(() => {
        var e
        return (null == (e = A.value) ? void 0 : e.totalKeys) ?? w.value.length
      }),
      $ = l(() => {
        var e
        return (null == (e = A.value) ? void 0 : e.activeKeys) ?? w.value.filter((e) => !1 !== e.isActive).length
      }),
      T = l(() => {
        var e
        const i = null == (e = A.value) ? void 0 : e.expiredKeys
        return void 0 !== i
          ? i + (C.value - $.value - i)
          : w.value.filter((e) => 'expired' === e.status || !1 === e.isActive).length
      }),
      I = l(() => w.value.filter((e) => 'error' === e.status || 'revoked' === e.status).length),
      S = l(() => {
        var e
        return 'connected' === (null == (e = A.value) ? void 0 : e.status) || $.value > 0 ? 'connected' : 'pending'
      }),
      M = l(() => {
        var e
        return (null == (e = A.value) ? void 0 : e.lastActivityAt) || '暂无活动'
      }),
      N = async () => {
        ;(a.value = !0), (b.value = !1)
        try {
          const [e, i] = await Promise.all([g(), y()])
          ;(w.value = Array.isArray(e) ? e : []), (A.value = i || null)
        } catch {
          ;(b.value = !0), (w.value = []), (A.value = null)
        } finally {
          a.value = !1
        }
      }
    n(N)
    const P = (e) => {
        switch (e) {
          case 'active':
            return 'success'
          case 'expired':
            return 'warning'
          case 'error':
          case 'revoked':
            return 'danger'
          default:
            return 'default'
        }
      },
      B = (e) => {
        switch (e) {
          case 'active':
            return '活跃'
          case 'inactive':
            return '已停用'
          case 'expired':
            return '已过期'
          case 'error':
            return '异常'
          case 'revoked':
            return '已撤销'
          default:
            return e
        }
      },
      O = (e) => {
        x.value = x.value === e ? null : e
      },
      q = async () => {
        if (z.value.trim())
          try {
            await f({ name: z.value, description: j.value }),
              (z.value = ''),
              (j.value = ''),
              (K.value = !1),
              window.$message.success('AppKey 已生成'),
              await N()
          } catch {
            window.$message.error('生成 AppKey 失败')
          }
      },
      D = () => {
        const e = 'connected' === S.value
        return t('div', { class: 'mobile-ingestion__connection-badge' }, [
          t('span', { class: 'mobile-ingestion__connection-icon', 'aria-hidden': 'true' }, [
            t(e ? u : m, { size: 16 }, null)
          ]),
          t('span', null, [e ? '已接入' : '待接入'])
        ])
      }
    return () =>
      t('div', { class: 'mobile-ingestion' }, [
        t('header', { class: 'mobile-ingestion__header' }, [
          t('div', null, [
            t('h2', { class: 'mobile-ingestion__title' }, [o('接入管理')]),
            t('div', { class: 'mobile-ingestion__subtitle' }, [
              C.value,
              o(' 个接入源 · '),
              $.value,
              o(' 活跃 · '),
              M.value
            ])
          ]),
          t('div', { class: 'mobile-ingestion__header-actions' }, [
            t(
              r,
              { size: 'small', type: 'primary', plain: !0, onClick: () => (K.value = !K.value) },
              { default: () => [o('+ 生成')] }
            ),
            t(
              r,
              { size: 'small', type: 'primary', plain: !0, onClick: N, 'aria-label': '刷新接入数据' },
              { default: () => [t(c, { size: 18 }, null)] }
            )
          ])
        ]),
        !a.value && !b.value && D(),
        !a.value &&
          !b.value &&
          w.value.length > 0 &&
          t('div', { class: 'mobile-ingestion__summary-grid' }, [
            t('div', { class: 'mobile-ingestion__summary-card' }, [
              t('div', { class: 'mobile-ingestion__summary-label' }, [o('总接入源')]),
              t('div', { class: 'mobile-ingestion__summary-value' }, [C.value])
            ]),
            t('div', { class: 'mobile-ingestion__summary-card mobile-ingestion__summary-card--active' }, [
              t('div', { class: 'mobile-ingestion__summary-label' }, [o('活跃')]),
              t('div', { class: 'mobile-ingestion__summary-value' }, [$.value])
            ]),
            t('div', { class: 'mobile-ingestion__summary-card mobile-ingestion__summary-card--inactive' }, [
              t('div', { class: 'mobile-ingestion__summary-label' }, [o('非活跃')]),
              t('div', { class: 'mobile-ingestion__summary-value' }, [T.value])
            ]),
            t('div', { class: 'mobile-ingestion__summary-card mobile-ingestion__summary-card--error' }, [
              t('div', { class: 'mobile-ingestion__summary-label' }, [o('异常')]),
              t('div', { class: 'mobile-ingestion__summary-value' }, [I.value])
            ])
          ]),
        K.value
          ? t('section', { class: 'mobile-ingestion__generate-card' }, [
              t('div', { class: 'mobile-ingestion__generate-header' }, [
                t('span', { class: 'mobile-ingestion__generate-title' }, [o('生成 AppKey')]),
                t(
                  r,
                  {
                    size: 'small',
                    type: 'default',
                    plain: !0,
                    'aria-label': '关闭生成 AppKey 表单',
                    onClick: () => {
                      ;(K.value = !1), (z.value = ''), (j.value = '')
                    }
                  },
                  { default: () => [t(_, { size: 16 }, null)] }
                )
              ]),
              t('div', { class: 'mobile-ingestion__generate-body' }, [
                t(
                  'input',
                  {
                    class: 'mobile-ingestion__generate-input',
                    placeholder: '名称（例如：growth-service-prod）',
                    value: z.value,
                    onInput: (e) => {
                      z.value = e.target.value
                    }
                  },
                  null
                ),
                t(
                  'input',
                  {
                    class: 'mobile-ingestion__generate-input',
                    placeholder: '描述（可选）',
                    value: j.value,
                    onInput: (e) => {
                      j.value = e.target.value
                    }
                  },
                  null
                ),
                t(r, { size: 'small', type: 'primary', block: !0, onClick: q }, { default: () => [o('生成')] })
              ])
            ])
          : null,
        a.value
          ? t('div', { class: 'mobile-ingestion__loading' }, [t(v, { size: '28px' }, null)])
          : b.value
            ? t('div', { class: 'mobile-ingestion__error-state' }, [
                t('div', { class: 'mobile-ingestion__error-content' }, [
                  t(d, { description: '接入数据加载失败' }, null),
                  t(r, { size: 'small', type: 'primary', onClick: N }, { default: () => [o('重新加载')] })
                ])
              ])
            : 0 === w.value.length
              ? t('div', { class: 'mobile-ingestion__empty-state' }, [
                  t('div', { class: 'mobile-ingestion__empty-content' }, [
                    t(d, { description: '暂无接入源，请先生成 AppKey' }, null),
                    t(
                      r,
                      { size: 'small', type: 'primary', onClick: () => (K.value = !0) },
                      { default: () => [o('生成 AppKey')] }
                    )
                  ])
                ])
              : t('div', { class: 'mobile-ingestion__source-list' }, [
                  w.value.map((a, s) =>
                    ((a, s) => {
                      let l, n
                      const c =
                          'expired' === (v = a).status
                            ? 'expired'
                            : 'error' === v.status || 'revoked' === v.status
                              ? 'error'
                              : !1 === v.isActive
                                ? 'inactive'
                                : 'active',
                        u = a.appKey || a.keyName || a.name || `source-${s}`,
                        m = x.value === u
                      var v, d
                      return t(
                        'article',
                        {
                          class: ['mobile-ingestion__source-card', m ? 'mobile-ingestion__source-card--expanded' : ''],
                          role: 'button',
                          tabindex: '0',
                          'aria-expanded': m,
                          'aria-label': `${m ? '收起' : '展开'}接入源：${a.name || a.keyName || a.appKey || '-'}`,
                          onClick: () => O(u),
                          onKeydown: (e) => {
                            ;('Enter' !== e.key && ' ' !== e.key) || (e.preventDefault(), O(u))
                          }
                        },
                        [
                          t('div', { class: 'mobile-ingestion__source-card-inner' }, [
                            t('div', { class: 'mobile-ingestion__source-header' }, [
                              t('div', { class: 'mobile-ingestion__source-info' }, [
                                t('div', { class: 'mobile-ingestion__source-name' }, [
                                  a.name || a.keyName || a.appKey || '-'
                                ]),
                                t('div', { class: 'mobile-ingestion__source-meta' }, [
                                  t('span', { class: 'mobile-ingestion__source-key' }, [u])
                                ])
                              ]),
                              t('div', { class: 'mobile-ingestion__source-badges' }, [
                                t(i, { size: 'small', type: P(c) }, k((l = B(c))) ? l : { default: () => [l] }),
                                t(
                                  p,
                                  {
                                    class: [
                                      'mobile-ingestion__source-chevron',
                                      m ? 'mobile-ingestion__source-chevron--open' : ''
                                    ],
                                    size: 16
                                  },
                                  null
                                )
                              ])
                            ]),
                            t('div', { class: 'mobile-ingestion__source-detail-row' }, [
                              t('span', { class: 'mobile-ingestion__source-detail-label' }, [o('最近活动')]),
                              t('span', { class: 'mobile-ingestion__source-detail-value' }, [
                                ((d = a.lastUsed || a.createdAt), d ? d.replace('T', ' ').slice(0, 16) : '—')
                              ])
                            ]),
                            m &&
                              t('div', { class: 'mobile-ingestion__source-expanded' }, [
                                t('div', { class: 'mobile-ingestion__source-divider' }, null),
                                t('div', { class: 'mobile-ingestion__source-detail-grid' }, [
                                  t('div', { class: 'mobile-ingestion__source-detail-item' }, [
                                    t('span', { class: 'mobile-ingestion__source-detail-label' }, [o('来源标识')]),
                                    t('span', { class: 'mobile-ingestion__source-detail-value' }, [u])
                                  ]),
                                  a.appSecret &&
                                    t('div', { class: 'mobile-ingestion__source-detail-item' }, [
                                      t('span', { class: 'mobile-ingestion__source-detail-label' }, [o('AppSecret')]),
                                      t('span', { class: 'mobile-ingestion__source-detail-value' }, [
                                        a.appSecret.slice(0, 8),
                                        o('********')
                                      ])
                                    ]),
                                  t('div', { class: 'mobile-ingestion__source-detail-item' }, [
                                    t('span', { class: 'mobile-ingestion__source-detail-label' }, [o('状态')]),
                                    t(i, { size: 'small', type: P(c) }, k((n = B(c))) ? n : { default: () => [n] })
                                  ]),
                                  a.description &&
                                    t('div', { class: 'mobile-ingestion__source-detail-item' }, [
                                      t('span', { class: 'mobile-ingestion__source-detail-label' }, [o('描述')]),
                                      t('span', { class: 'mobile-ingestion__source-detail-value' }, [a.description])
                                    ])
                                ]),
                                'active' !== c &&
                                  'expired' !== c &&
                                  t('div', { class: 'mobile-ingestion__source-actions' }, [
                                    t(
                                      r,
                                      {
                                        size: 'small',
                                        type: 'default',
                                        class: 'mobile-ingestion__revoke-button',
                                        onClick: (i) => {
                                          i.stopPropagation(),
                                            (async (i) => {
                                              const a = i.keyId || i.id
                                              if (a)
                                                try {
                                                  await e.confirm({
                                                    title: '确认撤销',
                                                    message: `确定要撤销 AppKey「${i.name || i.keyName || a}」吗？此操作不可撤销。`,
                                                    confirmButtonText: '撤销',
                                                    cancelButtonText: '取消'
                                                  }),
                                                    await h({ keyId: String(a) }),
                                                    window.$message.success('AppKey 已撤销'),
                                                    await N()
                                                } catch (v) {
                                                  'cancel' !== v && window.$message.error('撤销 AppKey 失败')
                                                }
                                            })(a)
                                        }
                                      },
                                      {
                                        default: () => [
                                          t(_, { size: 14 }, null),
                                          t('span', { class: 'mobile-ingestion__source-action-label' }, [o('撤销')])
                                        ]
                                      }
                                    )
                                  ])
                              ])
                          ])
                        ]
                      )
                    })(a, s)
                  )
                ])
      ])
  }
})
export { w as default }
