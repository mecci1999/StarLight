import {
  p as e,
  r as a,
  a0 as l,
  ba as t,
  a1 as s,
  a3 as c,
  a2 as i,
  w as r,
  cO as n,
  ag as u,
  $ as o,
  ac as v,
  am as p,
  ab as d,
  cz as m,
  af as g,
  ci as y,
  a6 as _,
  ch as b,
  aq as h
} from './invariable-DewVS0br.js'
import { f, p as k } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { D as w } from './DetailDrawer-C1HE8GcD.js'
import { P as j } from './PageHeader-OtleDOO-.js'
import { d as z, i as C, b as $ } from './index-DFkcx8xz.js'
import { l as I, m as S, f as q, c as N, a as A } from './catalogModel-DEDthFal.js'
import { i as M } from './queryModel-CK1Nudco.js'
const P = [
    {
      key: 'traffic',
      label: '流量吞吐',
      description: 'QPS、请求量、连接数',
      accent: 'blue',
      matcher: (e) => /qps|throughput|request|traffic|connection|count|total/i.test(`${e.name} ${e.description}`)
    },
    {
      key: 'latency',
      label: '延迟耗时',
      description: '响应时间、P95、duration',
      accent: 'purple',
      matcher: (e) => /latency|duration|response|time|耗时|延迟/i.test(`${e.name} ${e.description}`)
    },
    {
      key: 'errors',
      label: '错误健康',
      description: '错误率、状态、异常',
      accent: 'red',
      matcher: (e) => /error|fail|exception|status|health|panic|错误|失败|异常/i.test(`${e.name} ${e.description}`)
    },
    {
      key: 'resources',
      label: '资源使用',
      description: 'CPU、内存、磁盘、网络',
      accent: 'green',
      matcher: (e) => /cpu|memory|mem|heap|disk|network|load|资源|内存/i.test(`${e.name} ${e.description}`)
    },
    {
      key: 'runtime',
      label: '运行时',
      description: '进程、GC、线程、实例',
      accent: 'orange',
      matcher: (e) => /process|runtime|gc|thread|instance|node|worker/i.test(`${e.name} ${e.description}`)
    },
    {
      key: 'business',
      label: '业务指标',
      description: '订单、任务、自定义埋点',
      accent: 'cyan',
      matcher: (e) => /business|order|payment|job|task|custom|业务|订单|任务/i.test(`${e.name} ${e.description}`)
    }
  ],
  U = (e) =>
    P.find((a) => a.matcher(e)) || {
      key: 'other',
      label: '其他指标',
      description: '暂未归类的指标',
      accent: 'gray',
      matcher: () => !0
    },
  D = (e) => {
    if (!e) return '暂无样例时间'
    const a = new Date(e)
    return Number.isNaN(a.getTime()) ? '暂无样例时间' : a.toLocaleString()
  },
  L = (e) => {
    if (!e || 'object' != typeof e) return null
    const a = e,
      l = a.identity && 'object' == typeof a.identity ? a.identity : null,
      t = null == l ? void 0 : l.name,
      s = null == l ? void 0 : l.id
    return 'string' == typeof t && 'string' == typeof s && t && s ? { label: t, value: s } : null
  },
  x = e({
    name: 'MetricsCatalogPage',
    setup() {
      const e = o(),
        x = t(),
        O = a(),
        T = l(!1),
        H = l(!1),
        R = l('empty'),
        B = l(''),
        E = l('system' === x.query.scope || 'tenant' === x.query.scope ? x.query.scope : z()),
        G = l([]),
        J = l([]),
        K = l(null),
        Q = l('all'),
        F = l({ keyword: '', type: '', unit: '', hasLabels: !1, serviceId: '' }),
        V = s(() =>
          [
            { label: '用户接入', value: 'tenant' },
            { label: 'Darwin 系统', value: 'system' }
          ].filter((e) => C(e.value, $()))
        ),
        W = s(() => {
          var e
          return (null == (e = G.value.find((e) => e.value === F.value.serviceId)) ? void 0 : e.label) || '全部服务'
        }),
        X = s(() => q(J.value, F.value)),
        Y = s(() => ('all' === Q.value ? X.value : X.value.filter((e) => U(e).key === Q.value))),
        Z = s(() => [{ label: '全部类型', value: '' }, ...N(J.value).map((e) => ({ label: e, value: e }))]),
        ee = s(() => [{ label: '全部单位', value: '' }, ...A(J.value).map((e) => ({ label: e, value: e }))]),
        ae = s(() => {
          const e = new Map()
          return (
            X.value.forEach((a) => {
              const l = U(a).key
              e.set(l, (e.get(l) || 0) + 1)
            }),
            [
              {
                key: 'all',
                label: '全部指标',
                description: '当前筛选下的完整集合',
                count: X.value.length,
                accent: 'black'
              },
              ...P.map((a) => ({
                key: a.key,
                label: a.label,
                description: a.description,
                count: e.get(a.key) || 0,
                accent: a.accent
              })),
              {
                key: 'other',
                label: '其他指标',
                description: '暂未归类的指标',
                count: e.get('other') || 0,
                accent: 'gray'
              }
            ].filter((e) => 'all' === e.key || e.count > 0)
          )
        }),
        le = s(() => ({
          total: J.value.length,
          visible: Y.value.length,
          labeled: J.value.filter((e) => e.labelNames.length > 0).length,
          services: new Set(J.value.flatMap((e) => e.sourceServices)).size,
          latestSeen: J.value.reduce(
            (e, a) => (a.lastSeenAt ? (e ? Math.max(e, a.lastSeenAt) : a.lastSeenAt) : e),
            null
          )
        })),
        te = s(() => (K.value ? U(K.value) : null)),
        se = s(() => {
          const e = K.value
          return e
            ? JSON.stringify(
                {
                  scope: E.value,
                  subject: F.value.serviceId
                    ? { type: 'service', id: F.value.serviceId, name: W.value }
                    : { type: e.subjectKinds.includes('service') ? 'service' : 'system' },
                  metricRef: e.name,
                  aggregation: e.allowedAggregations[0] || 'latest',
                  timeRange: '-15m',
                  visualizationHint: e.recommendation
                },
                null,
                2
              )
            : ''
        }),
        ce = async () => {
          try {
            const e = await f({ page: 1, pageSize: 200, scope: E.value })
            G.value = Array.isArray(null == e ? void 0 : e.items) ? e.items.map(L).filter(Boolean) : []
          } catch (e) {}
        },
        ie = async () => {
          ;(T.value = !0), (B.value = '')
          try {
            const e = await k({ serviceId: F.value.serviceId || void 0, scope: E.value }),
              a = I(e)
            ;(J.value = a.items),
              (R.value = a.source),
              (B.value = 'unsupported' === a.source ? '指标 schema 响应格式暂不受支持' : '')
          } catch (e) {
            ;(J.value = []), (R.value = 'unavailable'), (B.value = '指标 schema 暂时不可用，请稍后重试')
          } finally {
            T.value = !1
          }
        },
        re = (e) => {
          ;(K.value = e), (H.value = !0)
        },
        ne = (a) => {
          M(a.name)
            ? e.push({
                path: '/home/investigate/metrics',
                query: { serviceId: F.value.serviceId || void 0, scope: E.value, metric: a.name }
              })
            : O.warning('当前指标还不能直接映射到现有指标分析视图')
        },
        ue = (a) => {
          const l = S(a)
          l
            ? e.push({
                path: '/home/overview',
                query: {
                  prefillMetric: l.metric,
                  prefillType: l.type,
                  prefillTitle: a.description && '暂无描述' !== a.description ? a.description : a.name,
                  scope: E.value,
                  serviceId: F.value.serviceId || void 0,
                  startAdd: '1'
                }
              })
            : O.warning('当前指标还不能直接映射到现有面板卡片，请先到指标分析页查看')
        },
        oe = () => {
          ;(F.value.keyword = ''), (F.value.type = ''), (F.value.unit = ''), (F.value.hasLabels = !1), (Q.value = 'all')
        },
        ve = (e) =>
          r('div', { class: 'metrics-catalog-page__metric-meta' }, [
            r(y, { size: 'small', bordered: !1, type: 'info' }, { default: () => [e.type || 'unknown'] }),
            r(y, { size: 'small', bordered: !1 }, { default: () => [e.unit || '无单位'] }),
            r(y, { size: 'small', bordered: !1, type: 'success' }, { default: () => [e.recommendation] }),
            e.labelNames.length > 0
              ? r(
                  y,
                  { size: 'small', bordered: !1, type: 'warning' },
                  { default: () => [e.labelNames.length, v(' 个标签维度')] }
                )
              : null
          ]),
        pe = () => {
          var e
          const a = K.value
          return a
            ? r('div', { class: 'metrics-catalog-page__detail-panel' }, [
                r('div', { class: 'metrics-catalog-page__detail-hero' }, [
                  r('div', { class: 'metrics-catalog-page__detail-kicker' }, [
                    (null == (e = te.value) ? void 0 : e.label) || '指标详情'
                  ]),
                  r('div', { class: 'metrics-catalog-page__detail-title' }, [a.name]),
                  r('div', { class: 'metrics-catalog-page__detail-description' }, [a.description]),
                  ve(a)
                ]),
                r(h, { title: '标签维度' }, { default: () => (a.labelNames.length ? a.labelNames.join('、') : '无') }),
                r(
                  h,
                  { title: '样例标签值' },
                  {
                    default: () =>
                      Object.keys(a.sampleLabels).length
                        ? r('div', { class: 'metrics-catalog-page__sample-labels' }, [
                            Object.entries(a.sampleLabels).map(([e, a]) =>
                              r('div', { key: e, class: 'metrics-catalog-page__sample-label-row' }, [
                                r('strong', null, [e]),
                                r('span', null, [a.join('、')])
                              ])
                            )
                          ])
                        : '暂无样例标签值'
                  }
                ),
                r(
                  h,
                  { title: '查询预览' },
                  { default: () => r('pre', { class: 'metrics-catalog-page__query-code' }, [se.value]) }
                ),
                r(h, { title: '最近活跃情况' }, { default: () => D(a.lastSeenAt) })
              ])
            : null
        },
        de = () => {
          const e = K.value
          return e
            ? r(
                n,
                { justify: 'end' },
                {
                  default: () => [
                    r(u, { onClick: () => ne(e), disabled: !M(e.name) }, { default: () => [v('去指标分析')] }),
                    r(u, { type: 'primary', onClick: () => ue(e) }, { default: () => [v('创建卡片')] })
                  ]
                }
              )
            : null
        }
      return (
        c(async () => {
          await ce(), await ie()
        }),
        i(
          () => E.value,
          async () => {
            ;(F.value.serviceId = ''), (Q.value = 'all'), await ce(), await ie()
          }
        ),
        i(
          () => F.value.serviceId,
          async () => {
            ;(Q.value = 'all'), await ie()
          }
        ),
        i(
          () => Y.value,
          (e) => {
            e.length
              ? (K.value &&
                  e.some((e) => {
                    var a
                    return e.name === (null == (a = K.value) ? void 0 : a.name)
                  })) ||
                (K.value = e[0])
              : (K.value = null)
          },
          { immediate: !0 }
        ),
        () => {
          var a
          return r('div', { class: 'metrics-catalog-page' }, [
            r(
              j,
              { title: '指标目录', subtitle: '按范围、服务和指标家族快速定位可用指标，并直接进入分析或创建卡片。' },
              {
                actions: () =>
                  r(n, null, {
                    default: () => [
                      r(
                        u,
                        { onClick: () => e.push('/home/investigate/metrics') },
                        { default: () => [v('前往指标分析')] }
                      )
                    ]
                  })
              }
            ),
            r('section', { class: 'metrics-catalog-page__hero' }, [
              r('div', { class: 'metrics-catalog-page__hero-copy' }, [
                r('div', { class: 'metrics-catalog-page__eyebrow' }, [v('Metric Discovery')]),
                r('h2', null, [v('先锁定服务，再选择指标，最后确认标签维度。')]),
                r('p', null, [
                  v('当前范围为 '),
                  r('strong', null, ['system' === E.value ? 'Darwin 系统' : '用户接入']),
                  v('，服务为'),
                  ' ',
                  r('strong', null, [W.value]),
                  v('。目录会展示 schema 可识别的指标、推荐图表和查询预览。')
                ])
              ]),
              r('div', { class: 'metrics-catalog-page__hero-stats' }, [
                r('div', null, [r('span', null, [v('全部指标')]), r('strong', null, [le.value.total])]),
                r('div', null, [r('span', null, [v('当前结果')]), r('strong', null, [le.value.visible])]),
                r('div', null, [r('span', null, [v('标签覆盖')]), r('strong', null, [le.value.labeled])]),
                r('div', null, [r('span', null, [v('关联服务')]), r('strong', null, [le.value.services || '—'])])
              ])
            ]),
            r(
              p,
              { bordered: !1, class: 'metrics-catalog-page__filters' },
              {
                default: () => [
                  r('div', { class: 'metrics-catalog-page__filter-grid' }, [
                    r(
                      d,
                      {
                        value: F.value.keyword,
                        'onUpdate:value': (e) => (F.value.keyword = e),
                        class: 'metrics-catalog-page__search',
                        placeholder: '搜索指标名、描述、标签，例如 cpu / latency / service',
                        clearable: !0
                      },
                      null
                    ),
                    r(
                      m,
                      {
                        value: E.value,
                        'onUpdate:value': (e) => (E.value = e),
                        options: V.value,
                        placeholder: '指标范围',
                        class: 'metrics-catalog-page__select'
                      },
                      null
                    ),
                    r(
                      m,
                      {
                        value: F.value.serviceId,
                        'onUpdate:value': (e) => (F.value.serviceId = e),
                        options: [{ label: '全部服务', value: '' }, ...G.value],
                        placeholder: '选择服务',
                        clearable: !0,
                        disabled: 'schema' !== R.value,
                        class: 'metrics-catalog-page__select'
                      },
                      null
                    ),
                    r(
                      m,
                      {
                        value: F.value.type,
                        'onUpdate:value': (e) => (F.value.type = e),
                        options: Z.value,
                        placeholder: '类型',
                        class: 'metrics-catalog-page__select'
                      },
                      null
                    ),
                    r(
                      m,
                      {
                        value: F.value.unit,
                        'onUpdate:value': (e) => (F.value.unit = e),
                        options: ee.value,
                        placeholder: '单位',
                        class: 'metrics-catalog-page__select'
                      },
                      null
                    ),
                    r('label', { class: 'metrics-catalog-page__checkbox' }, [
                      r(g, { checked: F.value.hasLabels, 'onUpdate:checked': (e) => (F.value.hasLabels = e) }, null),
                      r('span', null, [v('只看带标签维度')])
                    ])
                  ]),
                  r('div', { class: 'metrics-catalog-page__hint-row' }, [
                    r(
                      n,
                      { size: 8, align: 'center' },
                      {
                        default: () => [
                          r(
                            y,
                            {
                              size: 'small',
                              bordered: !1,
                              type: 'schema' === R.value ? 'success' : 'unavailable' === R.value ? 'error' : 'warning'
                            },
                            {
                              default: () => [
                                'schema' === R.value
                                  ? '实时 schema 元数据'
                                  : 'unsupported' === R.value
                                    ? 'schema 响应暂不受支持'
                                    : 'unavailable' === R.value
                                      ? 'schema 暂不可用'
                                      : '暂无 schema 数据'
                              ]
                            }
                          ),
                          r('span', null, [le.value.visible, v(' 个匹配指标')]),
                          r('span', null, [v('最近样例：'), D(le.value.latestSeen)])
                        ]
                      }
                    ),
                    r(u, { text: !0, size: 'small', onClick: oe }, { default: () => [v('清空筛选')] })
                  ])
                ]
              }
            ),
            r('section', { class: 'metrics-catalog-page__workspace' }, [
              r('aside', { class: 'metrics-catalog-page__family-rail' }, [
                ae.value.map((e) =>
                  r(
                    'button',
                    {
                      key: e.key,
                      type: 'button',
                      class: [
                        'metrics-catalog-page__family-item',
                        `metrics-catalog-page__family-item--${e.accent}`,
                        Q.value === e.key ? 'metrics-catalog-page__family-item--active' : ''
                      ],
                      onClick: () => (Q.value = e.key)
                    },
                    [
                      r('span', null, [r('strong', null, [e.label]), r('small', null, [e.description])]),
                      r('em', null, [e.count])
                    ]
                  )
                )
              ]),
              r(
                p,
                { bordered: !1, class: 'metrics-catalog-page__metric-list' },
                {
                  default: () => [
                    T.value
                      ? r('div', { class: 'metrics-catalog-page__loading' }, [r(_, { size: 'large' }, null)])
                      : Y.value.length
                        ? r('div', { class: 'metrics-catalog-page__metric-grid' }, [
                            Y.value.map((e) => {
                              var a
                              const l = U(e),
                                t = (null == (a = K.value) ? void 0 : a.name) === e.name
                              return r(
                                'article',
                                {
                                  key: e.name,
                                  class: [
                                    'metrics-catalog-page__metric-card',
                                    `metrics-catalog-page__metric-card--${l.accent}`,
                                    t ? 'metrics-catalog-page__metric-card--active' : ''
                                  ],
                                  onClick: () => {
                                    return (a = e), void (K.value = a)
                                    var a
                                  }
                                },
                                [
                                  r('div', { class: 'metrics-catalog-page__metric-card-top' }, [
                                    r(y, { size: 'small', bordered: !1 }, { default: () => [l.label] }),
                                    r('span', null, [D(e.lastSeenAt)])
                                  ]),
                                  r(
                                    'button',
                                    {
                                      class: 'metrics-catalog-page__metric-name',
                                      type: 'button',
                                      onClick: () => re(e)
                                    },
                                    [e.name]
                                  ),
                                  r('p', null, [e.description]),
                                  ve(e),
                                  r('div', { class: 'metrics-catalog-page__metric-card-footer' }, [
                                    r('span', null, [e.sampleCount ? `${e.sampleCount} 个样例` : '暂无样例']),
                                    r(
                                      n,
                                      { size: 8 },
                                      {
                                        default: () => [
                                          r(
                                            u,
                                            {
                                              size: 'small',
                                              tertiary: !0,
                                              onClick: (a) => {
                                                a.stopPropagation(), ne(e)
                                              },
                                              disabled: !M(e.name)
                                            },
                                            { default: () => [v('分析')] }
                                          ),
                                          r(
                                            u,
                                            {
                                              size: 'small',
                                              type: 'primary',
                                              ghost: !0,
                                              onClick: (a) => {
                                                a.stopPropagation(), ue(e)
                                              }
                                            },
                                            { default: () => [v('创建卡片')] }
                                          )
                                        ]
                                      }
                                    )
                                  ])
                                ]
                              )
                            })
                          ])
                        : r(
                            b,
                            {
                              description:
                                B.value ||
                                ('empty' === R.value
                                  ? '当前还没有可用的指标 schema'
                                  : 'unsupported' === R.value
                                    ? '当前 schema 响应格式暂不受支持'
                                    : '未找到匹配的指标'),
                              class: 'metrics-catalog-page__empty-state'
                            },
                            null
                          )
                  ]
                }
              ),
              r('aside', { class: 'metrics-catalog-page__inspector' }, [
                K.value
                  ? r(
                      p,
                      { bordered: !1, class: 'metrics-catalog-page__inspector-card' },
                      {
                        default: () => [
                          r('div', { class: 'metrics-catalog-page__inspector-kicker' }, [v('Selected Metric')]),
                          r('h3', null, [K.value.name]),
                          r('p', null, [K.value.description]),
                          ve(K.value),
                          r('div', { class: 'metrics-catalog-page__inspector-section' }, [
                            r('span', null, [v('标签维度')]),
                            r('strong', null, [K.value.labelNames.length ? K.value.labelNames.join('、') : '无'])
                          ]),
                          r('div', { class: 'metrics-catalog-page__inspector-section' }, [
                            r('span', null, [v('支持聚合')]),
                            r('strong', null, [K.value.allowedAggregations.join('、') || 'latest'])
                          ]),
                          r('div', { class: 'metrics-catalog-page__inspector-section' }, [
                            r('span', null, [v('查询预览')]),
                            r('pre', { class: 'metrics-catalog-page__query-code' }, [se.value])
                          ]),
                          r(
                            n,
                            { vertical: !0, size: 10 },
                            {
                              default: () => [
                                r(
                                  u,
                                  { block: !0, type: 'primary', onClick: () => ue(K.value) },
                                  { default: () => [v('用这个指标创建卡片')] }
                                ),
                                r(
                                  u,
                                  { block: !0, onClick: () => ne(K.value), disabled: !M(K.value.name) },
                                  { default: () => [v('进入指标分析')] }
                                ),
                                r(
                                  u,
                                  { block: !0, tertiary: !0, onClick: () => re(K.value) },
                                  { default: () => [v('查看完整详情')] }
                                )
                              ]
                            }
                          )
                        ]
                      }
                    )
                  : r(
                      p,
                      {
                        bordered: !1,
                        class: 'metrics-catalog-page__inspector-card metrics-catalog-page__inspector-card--empty'
                      },
                      { default: () => [r(b, { description: '选择一个指标后，这里会展示标签、聚合和查询预览' }, null)] }
                    )
              ])
            ]),
            r(
              w,
              {
                show: H.value,
                title: (null == (a = K.value) ? void 0 : a.name) || '指标详情',
                width: 'md',
                'onUpdate:show': (e) => (H.value = e)
              },
              { default: pe, footer: de }
            )
          ])
        }
      )
    }
  })
export { x as default }
