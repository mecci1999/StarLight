import e from './index-BRz3eDUI.js'
import {
  p as a,
  r as l,
  a0 as s,
  y as t,
  by as n,
  a1 as i,
  a3 as c,
  w as o,
  ag as p,
  ac as r,
  ar as d,
  av as u,
  ad as v,
  am as g,
  cM as _,
  cN as y,
  cL as m,
  aR as x,
  ci as f,
  ab as h,
  cz as b,
  cR as H,
  ce as w,
  a6 as S,
  dO as k,
  ch as M,
  al as z,
  cO as O,
  aC as Y,
  dP as D,
  dQ as U,
  dL as T,
  dE as B,
  B as L,
  j as C,
  ai as j
} from './invariable-DewVS0br.js'
import { P } from './PageHeader-OtleDOO-.js'
import { R as E } from './ResultTable-B_9U75PU.js'
const R = a({
  name: 'ExceptionAnalysisContent',
  setup() {
    const a = l(),
      R = s(!1),
      $ = s(null),
      G = s(null),
      I = s(!1),
      N = t({
        service: '',
        startTime: n().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        endTime: n().format('YYYY-MM-DD HH:mm:ss'),
        minOccurrences: 1,
        groupBy: 'message',
        sortBy: 'count',
        sortOrder: 'desc'
      }),
      A = t({ page: 1, pageSize: 20, total: 0, showSizePicker: !0, pageSizes: [10, 20, 50, 100] }),
      F = [
        { label: '错误消息', value: 'message' },
        { label: '异常类型', value: 'type' },
        { label: '服务名称', value: 'service' },
        { label: '堆栈位置', value: 'location' }
      ],
      K = [
        { label: '发生次数', value: 'count' },
        { label: '最近发生时间', value: 'lastOccurrence' },
        { label: '首次发生时间', value: 'firstOccurrence' },
        { label: '影响用户数', value: 'affectedUsers' }
      ],
      Q = [
        { label: '降序', value: 'desc' },
        { label: '升序', value: 'asc' }
      ],
      q = (e) => {
        ;(G.value = e), (I.value = !0)
      },
      J = [
        {
          title: '异常信息',
          key: 'message',
          ellipsis: { tooltip: !0 },
          render: (e) =>
            x('div', { class: 'exception-analysis-page__exception-cell', onClick: () => q(e) }, [
              x('div', { class: 'exception-analysis-page__exception-message' }, e.message),
              x('div', { class: 'exception-analysis-page__exception-type' }, e.type)
            ])
        },
        {
          title: '服务',
          key: 'service',
          width: 120,
          render: (e) => x(f, { size: 'small', type: 'info' }, () => e.service)
        },
        {
          title: '发生次数',
          key: 'count',
          width: 100,
          sorter: !0,
          render: (e) => x('div', { class: 'text-center font-medium' }, e.count.toLocaleString())
        },
        {
          title: '影响用户',
          key: 'affectedUsers',
          width: 100,
          render: (e) => {
            var a
            return x(
              'div',
              { class: 'text-center' },
              (null == (a = e.affectedUsers) ? void 0 : a.toLocaleString()) || '-'
            )
          }
        },
        {
          title: '趋势',
          key: 'trend',
          width: 120,
          render: (e) => {
            const a = e.trend
            if (!a) return '-'
            const l = a > 0
            return x(O, { size: 'small', align: 'center' }, () => [
              x(d, {
                component: T,
                color: l ? 'var(--color-danger-6)' : 'var(--color-success-6)',
                style: { transform: l ? 'none' : 'rotate(180deg)' }
              }),
              x(
                'span',
                { class: l ? 'exception-analysis-page__trend-text--up' : 'exception-analysis-page__trend-text--down' },
                `${l ? '+' : ''}${a.toFixed(1)}%`
              )
            ])
          }
        },
        {
          title: '首次发生',
          key: 'firstOccurrence',
          width: 150,
          render: (e) => n(e.firstOccurrence).format('MM-DD HH:mm')
        },
        {
          title: '最近发生',
          key: 'lastOccurrence',
          width: 150,
          render: (e) => n(e.lastOccurrence).format('MM-DD HH:mm')
        },
        {
          title: '操作',
          key: 'actions',
          width: 100,
          render: (e) =>
            x(O, { size: 'small' }, () => [
              x(
                B,
                { trigger: 'hover' },
                {
                  trigger: () => x(p, { size: 'small', type: 'primary', ghost: !0, onClick: () => q(e) }, () => '详情'),
                  default: () => '查看异常详情'
                }
              )
            ])
        }
      ],
      V = i(() => {
        var e
        return (null == (e = $.value) ? void 0 : e.exceptions.reduce((e, a) => e + a.count, 0)) || 0
      }),
      W = i(() => {
        var e
        return (null == (e = $.value) ? void 0 : e.exceptions.filter((e) => e.count >= 100).length) || 0
      }),
      X = i(() => {
        var e
        return new Set((null == (e = $.value) ? void 0 : e.exceptions.map((e) => e.service)) || []).size
      }),
      Z = i(() => [N.service, N.groupBy, N.sortBy, N.sortOrder, N.minOccurrences].filter(Boolean).length),
      ee = async (l = !0) => {
        var s, t, n
        l && (A.page = 1), (R.value = !0)
        try {
          const a = await e.logs.listExceptions({ ...N, page: A.page, pageSize: A.pageSize, timeRange: '24h' })
          ;($.value = {
            totalExceptions:
              (null == (s = null == a ? void 0 : a.items) ? void 0 : s.reduce((e, a) => e + Number(a.count || 0), 0)) ||
              0,
            total: (null == (t = null == a ? void 0 : a.items) ? void 0 : t.length) || 0,
            exceptions: (null == a ? void 0 : a.items) || [],
            exceptionStats: [],
            trend: [],
            hotServices: []
          }),
            (A.total = (null == (n = null == a ? void 0 : a.items) ? void 0 : n.length) || 0)
        } catch (i) {
          a.error('异常分析失败')
        } finally {
          R.value = !1
        }
      },
      ae = (e) => {
        ;(A.page = e), ee(!1)
      },
      le = (e) => {
        ;(A.pageSize = e), (A.page = 1), ee(!1)
      }
    return (
      c(() => {
        ee()
      }),
      () => {
        let e
        return o('div', { class: 'exception-analysis-page' }, [
          o(
            P,
            { title: '异常分析', subtitle: '按服务、错误类型和发生频次聚合异常，辅助定位高风险问题' },
            {
              actions: () =>
                o(
                  p,
                  { secondary: !0, type: 'primary', onClick: () => ee(!1), loading: R.value },
                  {
                    default: () => [
                      o(d, { component: u, class: 'exception-analysis-page__button-icon' }, null),
                      r('刷新分析')
                    ]
                  }
                )
            }
          ),
          o(v, null, {
            default: () => [
              o('div', { class: 'exception-analysis-page__body' }, [
                $.value &&
                  o(
                    g,
                    { bordered: !1, class: 'exception-analysis-page__card exception-analysis-page__card--summary' },
                    {
                      default: () => [
                        o(
                          _,
                          { cols: 4, xGap: 16, yGap: 16 },
                          {
                            default: () => [
                              o(y, null, {
                                default: () => [
                                  o(
                                    m,
                                    { label: '异常总数', value: V.value },
                                    {
                                      prefix: () => x(d, { component: L, color: 'var(--color-danger-6)' }),
                                      default: () =>
                                        o('div', { class: 'exception-analysis-page__stat-value' }, [V.value])
                                    }
                                  )
                                ]
                              }),
                              o(y, null, {
                                default: () => [
                                  o(
                                    m,
                                    { label: '严重异常', value: W.value },
                                    {
                                      prefix: () => x(d, { component: C, color: 'var(--color-warning-6)' }),
                                      default: () =>
                                        o(
                                          'div',
                                          {
                                            class:
                                              'exception-analysis-page__stat-value exception-analysis-page__stat-value--warning'
                                          },
                                          [W.value]
                                        )
                                    }
                                  )
                                ]
                              }),
                              o(y, null, {
                                default: () => [
                                  o(
                                    m,
                                    { label: '受影响服务', value: X.value },
                                    {
                                      default: () =>
                                        o('div', { class: 'exception-analysis-page__stat-value' }, [X.value])
                                    }
                                  )
                                ]
                              }),
                              o(y, null, {
                                default: () => {
                                  var e
                                  return [
                                    o(
                                      m,
                                      {
                                        label: '异常类型',
                                        value: (null == (e = $.value) ? void 0 : e.exceptions.length) || 0
                                      },
                                      {
                                        default: () => {
                                          var e
                                          return o('div', { class: 'exception-analysis-page__stat-value' }, [
                                            (null == (e = $.value) ? void 0 : e.exceptions.length) || 0
                                          ])
                                        }
                                      }
                                    )
                                  ]
                                }
                              })
                            ]
                          }
                        )
                      ]
                    }
                  ),
                o(
                  g,
                  { bordered: !1, class: 'exception-analysis-page__card exception-analysis-page__card--filters' },
                  {
                    default: () => [
                      o('div', { class: 'exception-analysis-page__filter-header' }, [
                        o('div', null, [
                          o('div', { class: 'exception-analysis-page__section-title' }, [r('分析条件')]),
                          o('div', { class: 'exception-analysis-page__section-desc' }, [
                            r('聚合方式决定异常归因粒度，建议先按错误消息查看，再收敛到服务或类型。')
                          ])
                        ]),
                        o(f, { bordered: !1, type: 'info' }, { default: () => [Z.value, r(' 个条件')] })
                      ]),
                      o('div', { class: 'exception-analysis-page__filter-grid' }, [
                        o('div', { class: 'exception-analysis-page__filter-row' }, [
                          o(
                            h,
                            {
                              value: N.service,
                              'onUpdate:value': (e) => (N.service = e),
                              placeholder: '服务名称',
                              clearable: !0,
                              class: 'exception-analysis-page__service-input'
                            },
                            null
                          ),
                          o(
                            b,
                            {
                              value: N.groupBy,
                              'onUpdate:value': (e) => (N.groupBy = e),
                              placeholder: '分组方式',
                              class: 'exception-analysis-page__select',
                              options: F
                            },
                            null
                          ),
                          o(
                            b,
                            {
                              value: N.sortBy,
                              'onUpdate:value': (e) => (N.sortBy = e),
                              placeholder: '排序字段',
                              class: 'exception-analysis-page__select',
                              options: K
                            },
                            null
                          ),
                          o(
                            b,
                            {
                              value: N.sortOrder,
                              'onUpdate:value': (e) => (N.sortOrder = e),
                              placeholder: '排序方向',
                              class: 'exception-analysis-page__select exception-analysis-page__select--compact',
                              options: Q
                            },
                            null
                          ),
                          o(
                            h,
                            {
                              value: N.minOccurrences,
                              'onUpdate:value': (e) => (N.minOccurrences = e),
                              placeholder: '最小次数',
                              class: 'exception-analysis-page__number-input'
                            },
                            null
                          )
                        ]),
                        o(
                          'div',
                          { class: 'exception-analysis-page__filter-row exception-analysis-page__filter-row--between' },
                          [
                            o('div', { class: 'exception-analysis-page__filter-group' }, [
                              o(
                                H,
                                {
                                  value: N.startTime,
                                  'onUpdate:value': (e) => (N.startTime = e),
                                  type: 'datetime',
                                  placeholder: '开始时间',
                                  format: 'yyyy-MM-dd HH:mm:ss',
                                  class: 'exception-analysis-page__date-input'
                                },
                                null
                              ),
                              o(
                                H,
                                {
                                  value: N.endTime,
                                  'onUpdate:value': (e) => (N.endTime = e),
                                  type: 'datetime',
                                  placeholder: '结束时间',
                                  format: 'yyyy-MM-dd HH:mm:ss',
                                  class: 'exception-analysis-page__date-input'
                                },
                                null
                              )
                            ]),
                            o('div', { class: 'exception-analysis-page__filter-group' }, [
                              o(
                                p,
                                { type: 'primary', onClick: () => ee(), loading: R.value },
                                {
                                  default: () => [
                                    o(d, { component: w, class: 'exception-analysis-page__button-icon' }, null),
                                    r('分析')
                                  ]
                                }
                              ),
                              o(
                                p,
                                { onClick: () => ee(!1) },
                                {
                                  default: () => [
                                    o(d, { component: u, class: 'exception-analysis-page__button-icon' }, null),
                                    r('刷新')
                                  ]
                                }
                              )
                            ])
                          ]
                        )
                      ])
                    ]
                  }
                ),
                o(
                  g,
                  {
                    bordered: !1,
                    class: 'exception-analysis-page__card exception-analysis-page__card--table',
                    contentStyle: { padding: 0 }
                  },
                  {
                    default: () => [
                      o('div', { class: 'exception-analysis-page__table-header' }, [
                        o('div', null, [
                          o('div', { class: 'exception-analysis-page__section-title' }, [r('异常列表')]),
                          o('div', { class: 'exception-analysis-page__section-desc' }, [
                            r('按发生次数、影响用户和最近时间排序，点击行查看堆栈与样本日志。')
                          ])
                        ]),
                        o(f, { bordered: !1 }, { default: () => [A.total, r(' 类异常')] })
                      ]),
                      o(
                        S,
                        { show: R.value },
                        {
                          default: () => {
                            var e
                            return [
                              (null == (e = $.value) ? void 0 : e.exceptions) && $.value.exceptions.length > 0
                                ? o('div', { class: 'exception-analysis-page__table-shell' }, [
                                    o(
                                      E,
                                      {
                                        columns: J,
                                        data: $.value.exceptions,
                                        bordered: !1,
                                        density: 'compact',
                                        rowKey: (e) => e.id || e.message || e.type
                                      },
                                      null
                                    ),
                                    o('div', { class: 'exception-analysis-page__table-footer' }, [
                                      o(
                                        k,
                                        {
                                          page: A.page,
                                          pageSize: A.pageSize,
                                          itemCount: A.total,
                                          showSizePicker: !0,
                                          pageSizes: A.pageSizes,
                                          onUpdatePage: ae,
                                          onUpdatePageSize: le
                                        },
                                        null
                                      )
                                    ])
                                  ])
                                : o('div', { class: 'exception-analysis-page__empty-state' }, [
                                    o(M, { description: '暂无异常数据' }, null)
                                  ])
                            ]
                          }
                        }
                      )
                    ]
                  }
                )
              ])
            ]
          }),
          o(
            z,
            {
              show: I.value,
              'onUpdate:show': (e) => (I.value = e),
              preset: 'card',
              title: '异常详情',
              bordered: !1,
              class: 'exception-analysis-page__modal',
              style: { width: 'min(1200px, 92vw)' }
            },
            {
              default: () => [
                G.value &&
                  o(
                    O,
                    { vertical: !0, size: 'large' },
                    {
                      default: () => {
                        return [
                          o('div', { class: 'exception-analysis-page__panel' }, [
                            o('h3', { class: 'exception-analysis-page__section-title' }, [r('基本信息')]),
                            o(
                              _,
                              { cols: 2, xGap: 16, yGap: 12 },
                              {
                                default: () => [
                                  o(y, null, {
                                    default: () => [
                                      o('div', { class: 'exception-analysis-page__field-label' }, [r('异常类型')]),
                                      o('div', { class: 'exception-analysis-page__field-value' }, [G.value.type])
                                    ]
                                  }),
                                  o(y, null, {
                                    default: () => [
                                      o('div', { class: 'exception-analysis-page__field-label' }, [r('服务名称')]),
                                      o(f, { type: 'info', bordered: !1 }, { default: () => [G.value.service] })
                                    ]
                                  }),
                                  o(y, null, {
                                    default: () => [
                                      o('div', { class: 'exception-analysis-page__field-label' }, [r('发生次数')]),
                                      o(
                                        'div',
                                        {
                                          class:
                                            'exception-analysis-page__emphasis exception-analysis-page__emphasis--danger'
                                        },
                                        [G.value.count.toLocaleString()]
                                      )
                                    ]
                                  }),
                                  o(y, null, {
                                    default: () => {
                                      var e
                                      return [
                                        o('div', { class: 'exception-analysis-page__field-label' }, [r('影响用户')]),
                                        o('div', { class: 'exception-analysis-page__field-value' }, [
                                          (null == (e = G.value.affectedUsers) ? void 0 : e.toLocaleString()) || '-'
                                        ])
                                      ]
                                    }
                                  }),
                                  o(y, null, {
                                    default: () => [
                                      o('div', { class: 'exception-analysis-page__field-label' }, [r('首次发生')]),
                                      o('div', null, [n(G.value.firstOccurrence).format('YYYY-MM-DD HH:mm:ss')])
                                    ]
                                  }),
                                  o(y, null, {
                                    default: () => [
                                      o('div', { class: 'exception-analysis-page__field-label' }, [r('最近发生')]),
                                      o('div', null, [n(G.value.lastOccurrence).format('YYYY-MM-DD HH:mm:ss')])
                                    ]
                                  })
                                ]
                              }
                            )
                          ]),
                          o('div', null, [
                            o('h3', { class: 'exception-analysis-page__section-title' }, [r('异常消息')]),
                            o('div', { class: 'exception-analysis-page__code-shell' }, [
                              o(
                                Y,
                                { code: G.value.message, language: 'text', class: 'exception-analysis-page__code' },
                                null
                              )
                            ])
                          ]),
                          G.value.stackTrace &&
                            o('div', null, [
                              o('h3', { class: 'exception-analysis-page__section-title' }, [r('堆栈跟踪')]),
                              o(
                                'div',
                                {
                                  class:
                                    'exception-analysis-page__code-shell exception-analysis-page__code-shell--muted'
                                },
                                [
                                  o(
                                    v,
                                    { style: { maxHeight: '400px' } },
                                    {
                                      default: () => [
                                        o(
                                          Y,
                                          {
                                            code: G.value.stackTrace,
                                            language: 'text',
                                            class: 'exception-analysis-page__code'
                                          },
                                          null
                                        )
                                      ]
                                    }
                                  )
                                ]
                              )
                            ]),
                          G.value.sampleLogs &&
                            G.value.sampleLogs.length > 0 &&
                            o('div', null, [
                              o('h3', { class: 'exception-analysis-page__section-title' }, [r('关联日志')]),
                              o(
                                D,
                                null,
                                ((a = e =
                                  G.value.sampleLogs.map((e, a) =>
                                    o(
                                      U,
                                      { key: a, title: `日志 ${a + 1} - ${n(e.timestamp).format('MM-DD HH:mm:ss')}` },
                                      {
                                        default: () => [
                                          o(
                                            'div',
                                            {
                                              class:
                                                'exception-analysis-page__panel exception-analysis-page__panel--compact'
                                            },
                                            [
                                              o(
                                                O,
                                                { vertical: !0, size: 'small' },
                                                {
                                                  default: () => [
                                                    o('div', { class: 'exception-analysis-page__meta-grid' }, [
                                                      o('div', null, [
                                                        o('span', { class: 'exception-analysis-page__meta-label' }, [
                                                          r('时间: ')
                                                        ]),
                                                        o('span', null, [
                                                          n(e.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
                                                        ])
                                                      ]),
                                                      o('div', null, [
                                                        o('span', { class: 'exception-analysis-page__meta-label' }, [
                                                          r('主机: ')
                                                        ]),
                                                        o('span', null, [e.hostname])
                                                      ]),
                                                      e.containerId &&
                                                        o('div', null, [
                                                          o('span', { class: 'exception-analysis-page__meta-label' }, [
                                                            r('容器: ')
                                                          ]),
                                                          o('span', null, [e.containerId])
                                                        ])
                                                    ]),
                                                    o('div', null, [
                                                      o(
                                                        'div',
                                                        {
                                                          class:
                                                            'exception-analysis-page__meta-label exception-analysis-page__meta-label--block'
                                                        },
                                                        [r('消息:')]
                                                      ),
                                                      o(
                                                        'div',
                                                        {
                                                          class:
                                                            'exception-analysis-page__code-shell exception-analysis-page__code-shell--muted'
                                                        },
                                                        [o(Y, { code: e.message, language: 'text' }, null)]
                                                      )
                                                    ]),
                                                    e.stack &&
                                                      o('div', null, [
                                                        o(
                                                          'div',
                                                          {
                                                            class:
                                                              'exception-analysis-page__meta-label exception-analysis-page__meta-label--block'
                                                          },
                                                          [r('堆栈:')]
                                                        ),
                                                        o(
                                                          'div',
                                                          {
                                                            class:
                                                              'exception-analysis-page__code-shell exception-analysis-page__code-shell--muted'
                                                          },
                                                          [
                                                            o(
                                                              v,
                                                              { style: { maxHeight: '200px' } },
                                                              {
                                                                default: () => [
                                                                  o(Y, { code: e.stack, language: 'text' }, null)
                                                                ]
                                                              }
                                                            )
                                                          ]
                                                        )
                                                      ])
                                                  ]
                                                }
                                              )
                                            ]
                                          )
                                        ]
                                      }
                                    )
                                  )),
                                'function' == typeof a ||
                                ('[object Object]' === Object.prototype.toString.call(a) && !j(a))
                                  ? e
                                  : { default: () => [e] })
                              )
                            ]),
                          G.value.hourlyTrend &&
                            G.value.hourlyTrend.length > 0 &&
                            o('div', null, [
                              o('h3', { class: 'exception-analysis-page__section-title' }, [r('24小时趋势')]),
                              o('div', { class: 'exception-analysis-page__trend-shell' }, [
                                o('div', { class: 'exception-analysis-page__trend-grid' }, [
                                  G.value.hourlyTrend.map((e, a) => {
                                    const l = Math.max(...G.value.hourlyTrend.map((e) => e.count)),
                                      s = l > 0 ? (e.count / l) * 100 : 0
                                    return o('div', { key: a, class: 'exception-analysis-page__trend-column' }, [
                                      o('div', { class: 'exception-analysis-page__trend-value' }, [e.count]),
                                      o(
                                        'div',
                                        {
                                          class: 'exception-analysis-page__trend-bar',
                                          style: { height: `${Math.max(s, 2)}%`, minHeight: '2px' }
                                        },
                                        null
                                      ),
                                      o('div', { class: 'exception-analysis-page__trend-time' }, [
                                        n(e.hour).format('HH:mm')
                                      ])
                                    ])
                                  })
                                ])
                              ])
                            ])
                        ]
                        var a
                      }
                    }
                  )
              ]
            }
          )
        ])
      }
    )
  }
})
export { R as E }
