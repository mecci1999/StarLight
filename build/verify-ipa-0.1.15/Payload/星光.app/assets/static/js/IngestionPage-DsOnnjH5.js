import {
  p as e,
  r as a,
  a0 as l,
  a3 as t,
  a1 as s,
  w as i,
  ac as n,
  ag as o,
  $ as u,
  cM as c,
  cN as p,
  am as d,
  cL as r,
  dn as v,
  dp as g,
  ch as y,
  aA as _,
  aB as m,
  cF as f,
  cG as h,
  ab as b,
  a6 as K,
  cO as k,
  ci as A,
  al as w,
  az as S
} from './invariable-DewVS0br.js'
import { m as j, n as x, g as C, v as N, o as I } from './metrics-uVJcD6zf.js'
import { P as U } from './PageHeader-OtleDOO-.js'
import './request-BiInMBwl.js'
import './index-DFkcx8xz.js'
const G = e({
  name: 'AdminIngestionPage',
  setup() {
    const e = u(),
      G = a(),
      L = l(!1),
      P = l([]),
      $ = l(null),
      q = l(!1),
      z = l(''),
      D = l(''),
      B = l('nodejs'),
      E = l(''),
      J = l('default'),
      T = l({ name: '', description: '' }),
      V = l({ appKey: '', appSecret: '' }),
      F = async () => {
        L.value = !0
        try {
          const [e, a] = await Promise.all([j(), x()])
          ;(P.value = Array.isArray(e) ? e : []), ($.value = a)
        } catch (e) {
          ;(P.value = []), ($.value = null)
        } finally {
          L.value = !1
        }
      }
    t(F)
    const H = s(() => {
        var e
        return (null == (e = $.value) ? void 0 : e.totalKeys) ?? P.value.length
      }),
      M = s(() => {
        var e
        return (null == (e = $.value) ? void 0 : e.activeKeys) ?? P.value.filter((e) => !1 !== e.isActive).length
      }),
      O = s(() => {
        var e
        return (null == (e = $.value) ? void 0 : e.expiredKeys) ?? P.value.filter((e) => 'expired' === e.status).length
      }),
      Q = s(() => {
        var e, a
        return (
          z.value ||
          (null == (e = P.value[0]) ? void 0 : e.appKey) ||
          (null == (a = P.value[0]) ? void 0 : a.keyName) ||
          '请先生成 AppKey'
        )
      }),
      R = s(() => {
        var e
        return 'connected' === (null == (e = $.value) ? void 0 : e.status) || M.value > 0 ? 'connected' : 'pending'
      }),
      W = s(() => ('connected' === R.value ? '已接入' : '待接入')),
      X = s(() => {
        var e
        return (null == (e = $.value) ? void 0 : e.lastActivityAt) || '暂无活动'
      }),
      Y = s(() => ({
        nodejs: `const StarLight = require('@starlight/node-sdk')\n\nStarLight.init({\n  appKey: '${Q.value}',\n  serviceName: 'my-service',\n  endpoint: 'https://api.your-starlight-domain.com'\n})\n`,
        go: `import "github.com/starlight/go-sdk"\n\nfunc main() {\n  config := starlight.Config{\n    AppKey: "${Q.value}",\n    ServiceName: "my-service",\n    Endpoint: "https://api.your-starlight-domain.com",\n  }\n\n  starlight.Init(config)\n  defer starlight.Close()\n}\n`,
        java: `import com.starlight.sdk.StarLight;\n\npublic class App {\n  public static void main(String[] args) {\n    StarLight.init(\n      "${Q.value}",\n      "my-service",\n      "https://api.your-starlight-domain.com"\n    );\n  }\n}\n`
      })),
      Z = async () => {
        const e = Y.value[B.value]
        try {
          await S(e), G.success('接入代码已复制')
        } catch (a) {
          navigator.clipboard
            .writeText(e)
            .then(() => {
              G.success('接入代码已复制')
            })
            .catch(() => {
              G.error('复制失败')
            })
        }
      },
      ee = async () => {
        const e = await C({ name: T.value.name, description: T.value.description })
        ;(z.value = (null == e ? void 0 : e.appKey) || ''),
          (D.value = (null == e ? void 0 : e.appSecret) || ''),
          (q.value = !1),
          (T.value = { name: '', description: '' }),
          G.success('AppKey 已生成'),
          await F()
      },
      ae = async () => {
        const e = await N({ appKey: V.value.appKey, appSecret: V.value.appSecret })
        ;(J.value = (null == e ? void 0 : e.valid) ? 'success' : 'default'),
          (E.value = (null == e ? void 0 : e.valid)
            ? 'AppKey 验证成功，可继续接入验证。'
            : '验证请求已执行，请检查接入状态。'),
          G.success((null == e ? void 0 : e.valid) ? 'AppKey 验证成功' : 'AppKey 验证完成'),
          await F()
      }
    return () =>
      i('div', { class: 'ingestion-page' }, [
        i(U, { title: '接入管理', subtitle: '管理服务端 SDK 凭证、接入状态与验证流程' }, null),
        i('section', { class: 'ingestion-page__hero' }, [
          i('div', { class: 'ingestion-page__hero-main' }, [
            i('div', { class: 'ingestion-page__eyebrow' }, [n('SDK Ingestion')]),
            i('h2', { class: 'ingestion-page__hero-title' }, [n('让 Java、Go、Node.js 微服务稳定上报到星光')]),
            i('p', { class: 'ingestion-page__hero-desc' }, [
              n('统一管理 AppKey、复制初始化代码，并在同一页面完成凭证验证与接入状态巡检。')
            ])
          ]),
          i('div', { class: 'ingestion-page__hero-actions' }, [
            i(
              o,
              { type: 'primary', onClick: () => e.push('/home/admin-onboarding-v2') },
              { default: () => [n('接入向导')] }
            ),
            i(o, { secondary: !0, onClick: () => (q.value = !0) }, { default: () => [n('生成 AppKey')] })
          ])
        ]),
        i(
          c,
          { cols: 3, xGap: 16, yGap: 16, responsive: 'screen', class: 'ingestion-page__stats-grid' },
          {
            default: () => [
              i(p, null, {
                default: () => [
                  i(
                    d,
                    { bordered: !1, class: 'ingestion-page__stat-card' },
                    {
                      default: () => [
                        i('div', { class: 'ingestion-page__stat-kicker' }, [n('凭证规模')]),
                        i(r, { label: 'AppKey 总数', value: H.value }, null)
                      ]
                    }
                  )
                ]
              }),
              i(p, null, {
                default: () => [
                  i(
                    d,
                    { bordered: !1, class: 'ingestion-page__stat-card' },
                    {
                      default: () => [
                        i('div', { class: 'ingestion-page__stat-kicker' }, [n('当前可用')]),
                        i(r, { label: '可用凭证', value: M.value }, null)
                      ]
                    }
                  )
                ]
              }),
              i(p, null, {
                default: () => [
                  i(
                    d,
                    { bordered: !1, class: 'ingestion-page__stat-card ingestion-page__stat-card--status' },
                    {
                      default: () => [
                        i('div', { class: 'ingestion-page__stat-kicker' }, [n('接入状态')]),
                        i(r, { label: '健康状态', value: W.value }, null)
                      ]
                    }
                  )
                ]
              })
            ]
          }
        ),
        i('div', { class: 'ingestion-page__content-grid' }, [
          i('div', { class: 'ingestion-page__main-stack' }, [
            i(
              d,
              { bordered: !1, class: 'ingestion-page__section-card', title: '接入状态概览' },
              {
                default: () => [
                  $.value
                    ? i(
                        v,
                        { column: 2, bordered: !0 },
                        {
                          default: () => [
                            i(g, { label: '总 AppKey' }, { default: () => [$.value.totalKeys] }),
                            i(g, { label: '可用凭证' }, { default: () => [$.value.activeKeys] }),
                            i(g, { label: '已过期' }, { default: () => [O.value] }),
                            i(g, { label: '当前状态' }, { default: () => [W.value] }),
                            i(g, { label: '最近活动' }, { default: () => [X.value] })
                          ]
                        }
                      )
                    : i('div', { class: 'ingestion-page__empty-state' }, [
                        i(y, { description: '暂无接入状态数据', class: 'ingestion-page__list-empty' }, null)
                      ])
                ]
              }
            ),
            z.value || D.value
              ? i(
                  d,
                  { bordered: !1, class: 'ingestion-page__section-card', title: '最近生成的凭证' },
                  {
                    default: () => [
                      i(
                        v,
                        { column: 1, bordered: !0 },
                        {
                          default: () => [
                            i(g, { label: 'AppKey' }, { default: () => [z.value || '-'] }),
                            i(g, { label: 'AppSecret' }, { default: () => [D.value || '-'] })
                          ]
                        }
                      )
                    ]
                  }
                )
              : null,
            i(
              d,
              { bordered: !1, class: 'ingestion-page__section-card', title: '接入指引' },
              {
                default: () => [
                  i('div', { class: 'ingestion-page__header-row' }, [
                    i('div', { class: 'ingestion-page__section-note' }, [
                      n('选择运行时语言，复用当前 AppKey 生成初始化代码。复制后放入服务启动入口即可完成 SDK 初始化。')
                    ]),
                    i(o, { secondary: !0, onClick: Z }, { default: () => [n('复制代码')] })
                  ]),
                  i(
                    _,
                    { type: 'line', value: B.value, onUpdateValue: (e) => (B.value = e) },
                    {
                      default: () => [
                        i(
                          m,
                          { name: 'nodejs', tab: 'Node.js' },
                          {
                            default: () => [
                              i('pre', { class: 'ingestion-page__code-block' }, [i('code', null, [Y.value.nodejs])])
                            ]
                          }
                        ),
                        i(
                          m,
                          { name: 'go', tab: 'Go' },
                          {
                            default: () => [
                              i('pre', { class: 'ingestion-page__code-block' }, [i('code', null, [Y.value.go])])
                            ]
                          }
                        ),
                        i(
                          m,
                          { name: 'java', tab: 'Java' },
                          {
                            default: () => [
                              i('pre', { class: 'ingestion-page__code-block' }, [i('code', null, [Y.value.java])])
                            ]
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            ),
            i('div', { id: 'ingestion-verification-panel' }, [
              i(
                d,
                { bordered: !1, class: 'ingestion-page__section-card', title: '接入验证' },
                {
                  default: () => [
                    i('div', { class: 'ingestion-page__section-note' }, [
                      n('使用当前 AppKey / Secret 验证接入状态，确认服务端配置已经生效。')
                    ]),
                    i(f, null, {
                      default: () => [
                        i(
                          h,
                          { label: 'AppKey' },
                          {
                            default: () => [
                              i(
                                b,
                                {
                                  value: V.value.appKey,
                                  'onUpdate:value': (e) => (V.value.appKey = e),
                                  placeholder: '请输入 AppKey'
                                },
                                {
                                  suffix: () =>
                                    i(
                                      o,
                                      {
                                        text: !0,
                                        type: 'primary',
                                        onClick: () => {
                                          V.value.appKey = String(Q.value || '')
                                        }
                                      },
                                      { default: () => [n('使用当前值')] }
                                    )
                                }
                              )
                            ]
                          }
                        ),
                        i(
                          h,
                          { label: 'AppSecret' },
                          {
                            default: () => [
                              i(
                                b,
                                {
                                  value: V.value.appSecret,
                                  'onUpdate:value': (e) => (V.value.appSecret = e),
                                  placeholder: '请输入 AppSecret',
                                  type: 'password'
                                },
                                null
                              )
                            ]
                          }
                        )
                      ]
                    }),
                    i('div', { class: 'ingestion-page__verify-row' }, [
                      i(
                        'div',
                        {
                          class: [
                            'ingestion-page__status-text',
                            'success' === J.value
                              ? 'ingestion-page__status-text--success'
                              : 'ingestion-page__status-text--muted'
                          ]
                        },
                        [E.value || '尚未执行验证']
                      ),
                      i(o, { type: 'primary', onClick: ae }, { default: () => [n('立即验证')] })
                    ])
                  ]
                }
              )
            ])
          ]),
          i('aside', { class: 'ingestion-page__side-stack' }, [
            i(
              d,
              { bordered: !1, class: 'ingestion-page__section-card', title: '快速入口' },
              {
                default: () => [
                  i('div', { class: 'ingestion-page__quick-actions' }, [
                    i(
                      o,
                      { type: 'primary', secondary: !0, onClick: () => e.push('/home/admin-onboarding-v2') },
                      { default: () => [n('接入向导')] }
                    ),
                    i(o, { secondary: !0, onClick: () => (q.value = !0) }, { default: () => [n('生成 AppKey')] }),
                    i(
                      o,
                      {
                        secondary: !0,
                        onClick: () => {
                          var e
                          null == (e = document.getElementById('ingestion-verification-panel')) ||
                            e.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      },
                      { default: () => [n('验证凭证')] }
                    ),
                    i(o, { secondary: !0, onClick: () => e.push('/home/overview') }, { default: () => [n('面板首页')] })
                  ])
                ]
              }
            ),
            i(
              d,
              { bordered: !1, class: 'ingestion-page__list-card', title: 'AppKey 列表' },
              {
                default: () => [
                  L.value
                    ? i('div', { class: 'ingestion-page__list-loading' }, [i(K, { size: 'large' }, null)])
                    : P.value.length
                      ? i('div', { class: 'ingestion-page__list-stack' }, [
                          P.value.map((e, a) =>
                            i(
                              'div',
                              { key: e.appKey || e.keyName || e.name || a, class: 'ingestion-page__list-item' },
                              [
                                i('div', { class: 'ingestion-page__list-copy' }, [
                                  i('div', { class: 'ingestion-page__list-title' }, [e.name || e.keyName || e.appKey]),
                                  i('div', { class: 'ingestion-page__list-meta' }, [e.appKey || e.keyName || '-'])
                                ]),
                                i(
                                  k,
                                  { align: 'center' },
                                  {
                                    default: () => [
                                      i(
                                        A,
                                        {
                                          type:
                                            'expired' === e.status
                                              ? 'warning'
                                              : !1 === e.isActive
                                                ? 'default'
                                                : 'success',
                                          bordered: !1
                                        },
                                        {
                                          default: () => [
                                            'expired' === e.status ? '已过期' : !1 === e.isActive ? '已停用' : '可用'
                                          ]
                                        }
                                      ),
                                      i(
                                        o,
                                        {
                                          size: 'small',
                                          secondary: !0,
                                          type: 'error',
                                          onClick: () =>
                                            (async (e) => {
                                              await I({ keyId: e.id }), G.success('AppKey 已删除'), await F()
                                            })(e)
                                        },
                                        { default: () => [n('撤销')] }
                                      )
                                    ]
                                  }
                                )
                              ]
                            )
                          )
                        ])
                      : i(
                          y,
                          { description: '暂无 AppKey，请先完成接入向导', class: 'ingestion-page__list-empty' },
                          null
                        )
                ]
              }
            )
          ])
        ]),
        i(
          w,
          {
            show: q.value,
            'onUpdate:show': (e) => (q.value = e),
            preset: 'card',
            title: '生成 AppKey',
            style: { width: '520px' }
          },
          {
            default: () => [
              i(f, null, {
                default: () => [
                  i(
                    h,
                    { label: '名称' },
                    {
                      default: () => [
                        i(
                          b,
                          {
                            value: T.value.name,
                            'onUpdate:value': (e) => (T.value.name = e),
                            placeholder: '例如：growth-service-prod'
                          },
                          null
                        )
                      ]
                    }
                  ),
                  i(
                    h,
                    { label: '描述' },
                    {
                      default: () => [
                        i(
                          b,
                          {
                            value: T.value.description,
                            'onUpdate:value': (e) => (T.value.description = e),
                            placeholder: '可选描述'
                          },
                          null
                        )
                      ]
                    }
                  )
                ]
              }),
              i('div', { class: 'ingestion-page__modal-actions' }, [
                i(o, { onClick: () => (q.value = !1) }, { default: () => [n('取消')] }),
                i(o, { type: 'primary', onClick: ee }, { default: () => [n('生成')] })
              ])
            ]
          }
        )
      ])
  }
})
export { G as default }
