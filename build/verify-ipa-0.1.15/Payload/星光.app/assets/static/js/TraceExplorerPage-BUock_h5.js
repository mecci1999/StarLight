import {
  p as e,
  r as a,
  a0 as l,
  a1 as r,
  a2 as t,
  a3 as s,
  ba as i,
  w as u,
  ag as o,
  ar as n,
  av as c,
  cM as v,
  cN as p,
  am as d,
  ac as m,
  ch as _,
  ci as g,
  ab as f,
  ce as x,
  cz as y,
  by as w,
  cP as h,
  cQ as b,
  a6 as T,
  $ as k,
  ai as I
} from './invariable-DewVS0br.js'
import { P as S } from './PageHeader-OtleDOO-.js'
import { R as j } from './ResultTable-B_9U75PU.js'
import { T as C } from './TimeRangeBar-EdVcwx6f.js'
import { B as $ } from './BarChart-BD7y_EJr.js'
import { f as R } from './metrics-uVJcD6zf.js'
import { u as q } from './useTimeStore-CVw7RN2Q.js'
import { b as M } from './index-DFkcx8xz.js'
import { s as U, g as z } from './trace-CcV2hmWD.js'
import './BaseChart-FGf3lmW3.js'
import './request-BiInMBwl.js'
function B(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !I(e))
}
const O = e({
  name: 'TraceExplorerPage',
  setup() {
    var e
    const I = i(),
      O = k(),
      P = q(),
      H = a(),
      L = Boolean(null == (e = M()) ? void 0 : e.isAdmin) ? 'darwin-app' : 'microservice',
      A = l(!1),
      D = l([]),
      E = l(null),
      N = l(!1),
      G = l(null),
      K = l(''),
      F = l(null),
      Q = l(null),
      V = l(null),
      W = l(null),
      Y = l(null),
      J = l([]),
      X = l({}),
      Z = (e) => {
        const a = String(e || '').trim()
        return a.startsWith('system:') ? a.slice(7) : a
      },
      ee = async () => {
        try {
          const e = await R({ page: 1, pageSize: 200, scope: 'darwin-app' === L ? 'system' : 'tenant' }),
            a = Array.isArray(null == e ? void 0 : e.items) ? e.items : []
          ;(J.value = a
            .filter((e) => {
              var a
              return !Y.value || (null == (a = e.identity) ? void 0 : a.env) === Y.value
            })
            .map((e) => {
              var a, l, r, t
              return {
                label: (null == (a = e.identity) ? void 0 : a.name) || (null == (l = e.identity) ? void 0 : l.id),
                value: Z((null == (r = e.identity) ? void 0 : r.name) || (null == (t = e.identity) ? void 0 : t.id))
              }
            })),
            (X.value = Object.fromEntries(
              a.map((e) => {
                var a, l, r
                return [
                  Z((null == (a = e.identity) ? void 0 : a.name) || (null == (l = e.identity) ? void 0 : l.id)),
                  (null == (r = e.identity) ? void 0 : r.env) || ''
                ]
              })
            ))
        } catch (e) {
          ;(J.value = []), (X.value = {})
        }
      },
      ae = r(() => [
        { label: '全部操作', value: '' },
        ...Array.from(new Set(D.value.map((e) => e.name).filter(Boolean))).map((e) => ({ label: e, value: e }))
      ]),
      le = r(() => [
        { label: '全部环境', value: '' },
        ...Array.from(new Set(Object.values(X.value).filter(Boolean))).map((e) => ({ label: e, value: e }))
      ]),
      re = [
        { label: '全部耗时', value: '' },
        { label: '0-50ms', value: '0-50' },
        { label: '50-100ms', value: '50-100' },
        { label: '100-250ms', value: '100-250' },
        { label: '250-500ms', value: '250-500' },
        { label: '500ms+', value: '500+' }
      ],
      te = [
        { label: '正常', value: 'ok' },
        { label: '异常', value: 'error' }
      ],
      se = (e, a) => {
        var l
        return (null == (l = e.find((e) => e.value === a)) ? void 0 : l.label) || a || ''
      },
      ie = async () => {
        A.value = !0
        try {
          const e = await U({
              startTime: P.startTime,
              endTime: P.endTime,
              service: Z(F.value) || void 0,
              traceId: K.value.trim() || void 0,
              operation: V.value || void 0,
              limit: 100,
              originType: L
            }),
            a = new Map()
          e.forEach((e) => {
            var l
            ;(!a.has(e.traceId) || (!e.parentId && (null == (l = a.get(e.traceId)) ? void 0 : l.parentId))) &&
              a.set(e.traceId, e)
          }),
            (D.value = Array.from(a.values()))
        } catch (e) {
          H.error('加载链路数据失败')
        } finally {
          A.value = !1
        }
      }
    t(
      () => [P.startTime, P.endTime, F.value, Q.value, Y.value],
      () => {
        ee(), ie()
      }
    ),
      s(() => {
        I.query.timeRange && 'string' == typeof I.query.timeRange && P.setTimeRange(I.query.timeRange)
        const e = 'string' == typeof I.query.service ? I.query.service : I.query.serviceId
        'string' == typeof e && (F.value = Z(e)), ee(), ie()
      })
    const ue = r(() => {
        let e = D.value
        if (K.value) {
          const a = K.value.toLowerCase()
          e = e.filter(
            (e) =>
              e.traceId.toLowerCase().includes(a) ||
              e.service.toLowerCase().includes(a) ||
              e.name.toLowerCase().includes(a)
          )
        }
        return (
          Q.value && (e = e.filter((e) => e.status === Q.value)),
          Y.value && (e = e.filter((e) => X.value[e.service] === Y.value)),
          V.value && (e = e.filter((e) => e.name === V.value)),
          W.value &&
            (e = e.filter((e) =>
              '0-50' === W.value
                ? e.duration >= 0 && e.duration < 50
                : '50-100' === W.value
                  ? e.duration >= 50 && e.duration < 100
                  : '100-250' === W.value
                    ? e.duration >= 100 && e.duration < 250
                    : '250-500' === W.value
                      ? e.duration >= 250 && e.duration < 500
                      : '500+' !== W.value || e.duration >= 500
            )),
          e.sort((e, a) => a.startTime - e.startTime)
        )
      }),
      oe = r(() => {
        const e = ue.value.length,
          a = ue.value.filter((e) => 'ok' === e.status).length,
          l = ue.value.filter((e) => 'ok' !== e.status).length,
          r = e ? Math.round(ue.value.reduce((e, a) => e + a.duration, 0) / e) : 0
        return {
          total: e,
          success: a,
          failed: l,
          slow: ue.value.filter((e) => e.duration >= 500).length,
          avgDuration: r
        }
      }),
      ne = r(() => (ue.value.length ? ue.value.reduce((e, a) => (a.duration > e.duration ? a : e)) : null)),
      ce = r(() =>
        oe.value.total
          ? oe.value.failed > 0
            ? '优先处理异常链路，并从详情抽屉跳转关联日志定位根因。'
            : oe.value.slow > 0
              ? `发现 ${oe.value.slow} 条超过 500ms 的慢链路，建议检查耗时最长操作。`
              : '当前筛选范围内链路状态稳定，可继续缩小服务或操作范围排查。'
          : '当前时间范围内暂无链路样本。'
      ),
      ve = r(() =>
        [
          K.value.trim() ? `关键词：${K.value.trim()}` : '',
          F.value ? `服务：${se(J.value, F.value)}` : '',
          Q.value ? `状态：${se(te, Q.value)}` : '',
          Y.value ? `环境：${Y.value}` : '',
          V.value ? `操作：${V.value}` : '',
          W.value ? `耗时：${se(re, W.value)}` : ''
        ].filter(Boolean)
      ),
      pe = () => {
        ;(K.value = ''), (F.value = null), (Q.value = null), (V.value = null), (W.value = null), (Y.value = null), ie()
      },
      de = () => {
        const e = ne.value
        e && xe(e.traceId)
      },
      me = r(() =>
        [
          { name: '0-50ms', min: 0, max: 50 },
          { name: '50-100ms', min: 50, max: 100 },
          { name: '100-250ms', min: 100, max: 250 },
          { name: '250-500ms', min: 250, max: 500 },
          { name: '500ms+', min: 500, max: Number.POSITIVE_INFINITY }
        ].map((e) => ({
          name: e.name,
          value: ue.value.filter((a) => a.duration >= e.min && a.duration < e.max).length
        }))
      ),
      _e = [
        { title: '开始时间', key: 'startTime', render: (e) => w(e.startTime).format('HH:mm:ss.SSS') },
        {
          title: '服务',
          key: 'service',
          render: (e) => u(g, { size: 'small', type: 'info', bordered: !1 }, { default: () => [e.service] })
        },
        { title: '操作', key: 'name' },
        { title: '耗时', key: 'duration', render: (e) => `${e.duration}ms` },
        {
          title: '状态',
          key: 'status',
          render: (e) =>
            u(
              g,
              { type: 'ok' === e.status ? 'success' : 'error', size: 'small', bordered: !1 },
              { default: () => ['ok' === e.status ? '正常' : '异常'] }
            )
        },
        {
          title: 'Trace ID',
          key: 'traceId',
          render: (e) =>
            u(
              'span',
              {
                class: 'trace-explorer-page__link-button',
                onClick: (a) => {
                  a.stopPropagation(), xe(e.traceId)
                }
              },
              [e.traceId]
            )
        }
      ],
      ge = l([]),
      fe = l(!1),
      xe = async (e) => {
        ;(E.value = e), (N.value = !0), (G.value = null), (fe.value = !0)
        try {
          const a = await z(e, { startTime: P.startTime, endTime: P.endTime, originType: L })
          ge.value = a.sort((e, a) => e.startTime - a.startTime)
        } catch (a) {
          H.error('加载链路详情失败')
        } finally {
          fe.value = !1
        }
      },
      ye = r(() => ge.value.find((e) => !e.parentId) || ge.value[0]),
      we = r(() => {
        if (0 === ge.value.length) return 0
        const e = ge.value.map((e) => e.startTime + e.duration),
          a = Math.min(...ge.value.map((e) => e.startTime))
        return Math.max(...e) - a
      }),
      he = r(() => {
        const e = new Set(ge.value.map((e) => e.service)),
          a = ge.value.filter((e) => 'ok' !== e.status).length
        return { spanCount: ge.value.length, serviceCount: e.size, failed: a }
      }),
      be = (e) => {
        const a = e.span.startTime - e.rootStart,
          l = we.value || 1,
          r = Math.max(0, (a / l) * 100),
          t = Math.max((e.span.duration / l) * 100, 0.5)
        return u('div', { class: 'trace-explorer-page__waterfall-row', onClick: () => (G.value = e.span) }, [
          u('div', { class: 'trace-explorer-page__waterfall-service' }, [
            u(
              'div',
              { style: { marginLeft: 16 * e.depth + 'px' }, class: 'trace-explorer-page__waterfall-service-inner' },
              [
                u(
                  'div',
                  {
                    class: [
                      'trace-explorer-page__waterfall-dot',
                      'ok' === e.span.status
                        ? 'trace-explorer-page__waterfall-dot--ok'
                        : 'trace-explorer-page__waterfall-dot--error'
                    ]
                  },
                  null
                ),
                u('span', { class: 'trace-explorer-page__waterfall-service-name', title: e.span.service }, [
                  e.span.service
                ])
              ]
            )
          ]),
          u('div', { class: 'trace-explorer-page__waterfall-main' }, [
            u('div', { class: 'trace-explorer-page__waterfall-axis' }, [
              u('div', { class: 'trace-explorer-page__waterfall-axis-line' }, null)
            ]),
            u(
              'div',
              {
                class: [
                  'trace-explorer-page__waterfall-bar',
                  'ok' === e.span.status
                    ? 'trace-explorer-page__waterfall-bar--ok'
                    : 'trace-explorer-page__waterfall-bar--error'
                ],
                style: { '--waterfall-left': `${r}%`, '--waterfall-width': `${t}%` }
              },
              [
                u(
                  'span',
                  {
                    class: [
                      'trace-explorer-page__waterfall-label',
                      'ok' === e.span.status ? '' : 'trace-explorer-page__waterfall-label--error'
                    ]
                  },
                  [
                    e.span.name,
                    m(' '),
                    u('span', { class: 'trace-explorer-page__waterfall-duration' }, [m('('), e.span.duration, m('ms)')])
                  ]
                )
              ]
            )
          ])
        ])
      },
      Te = (e, a = 0, l = 0) => {
        const r = ge.value.filter((a) => a.parentId === e).sort((e, a) => e.startTime - a.startTime)
        if (0 === a && 0 === r.length && ge.value.length > 0) {
          const e = new Set(ge.value.map((e) => e.id))
          return ge.value
            .filter((a) => !a.parentId || !e.has(a.parentId))
            .flatMap((e) => [u(be, { span: e, depth: 0, rootStart: e.startTime }, null), ...Te(e.id, 1, e.startTime)])
        }
        return r.flatMap((e) => [u(be, { span: e, depth: a, rootStart: l }, null), ...Te(e.id, a + 1, l)])
      }
    return () => {
      let e
      return u('div', { class: 'trace-explorer-page' }, [
        u(
          S,
          { title: '链路追踪', subtitle: '检索并分析分布式链路' },
          {
            actions: () =>
              u(
                o,
                { secondary: !0, type: 'primary', onClick: ie, loading: A.value },
                { icon: () => u(n, null, { default: () => [u(c, null, null)] }), default: () => '刷新链路' }
              )
          }
        ),
        u(
          C,
          {
            value: P.timeRange,
            live: P.isLive,
            options: P.timeOptions,
            'onUpdate:value': (e) => {
              P.setTimeRange(e), ie()
            },
            'onUpdate:live': (e) => {
              ;(P.isLive = e), e && P.refreshTime(), ie()
            },
            onRefresh: () => {
              P.refreshTime(), ie()
            }
          },
          null
        ),
        u('section', { class: 'trace-explorer-page__overview-grid' }, [
          u(
            v,
            { cols: 4, xGap: 16, yGap: 16, class: 'trace-explorer-page__summary-grid' },
            B(
              (e = [
                { label: '链路总数', value: oe.value.total, tone: 'total', hint: '去重后的 Trace 数' },
                { label: '正常链路', value: oe.value.success, tone: 'success', hint: '状态为 ok' },
                { label: '异常链路', value: oe.value.failed, tone: 'danger', hint: '需要优先排查' },
                { label: '平均耗时', value: `${oe.value.avgDuration}ms`, tone: 'latency', hint: '当前筛选均值' }
              ].map((e) =>
                u(
                  p,
                  { key: e.label },
                  {
                    default: () => [
                      u(
                        d,
                        {
                          bordered: !1,
                          class: ['trace-explorer-page__summary-card', `trace-explorer-page__summary-card--${e.tone}`]
                        },
                        {
                          default: () => [
                            u('div', { class: 'trace-explorer-page__summary-topline' }, [
                              u('span', { class: 'trace-explorer-page__summary-label' }, [e.label]),
                              u('span', { class: 'trace-explorer-page__summary-pulse' }, null)
                            ]),
                            u('div', { class: 'trace-explorer-page__summary-value' }, [e.value]),
                            u('div', { class: 'trace-explorer-page__summary-hint' }, [e.hint])
                          ]
                        }
                      )
                    ]
                  }
                )
              ))
            )
              ? e
              : { default: () => [e] }
          ),
          u(
            d,
            { class: 'trace-explorer-page__distribution-card', bordered: !1 },
            {
              default: () => [
                u('div', { class: 'trace-explorer-page__distribution-header' }, [
                  u('div', null, [
                    u('div', { class: 'trace-explorer-page__distribution-note' }, [m('耗时分布')]),
                    u('div', { class: 'trace-explorer-page__distribution-desc' }, [ce.value])
                  ]),
                  ne.value
                    ? u('button', { class: 'trace-explorer-page__slowest-link', onClick: de }, [
                        m('最慢 '),
                        ne.value.duration,
                        m('ms')
                      ])
                    : null
                ]),
                me.value.some((e) => e.value > 0)
                  ? u($, { data: me.value, height: '220px', variant: 'monitor' }, null)
                  : u(_, { description: '暂无耗时分布数据', class: 'trace-explorer-page__empty-state' }, null)
              ]
            }
          )
        ]),
        u('section', { class: 'trace-explorer-page__table-card' }, [
          u('div', { class: 'trace-explorer-page__table-header' }, [
            u('div', null, [
              u('div', { class: 'trace-explorer-page__section-title' }, [m('链路检索')]),
              u('div', { class: 'trace-explorer-page__section-desc' }, [
                m('按 Trace ID、服务、操作、状态和耗时范围定位慢链路与异常链路。')
              ])
            ]),
            u(
              g,
              { bordered: !1, type: oe.value.failed > 0 ? 'error' : 'success' },
              { default: () => [oe.value.failed > 0 ? `${oe.value.failed} 条异常` : '全部正常'] }
            )
          ]),
          u('div', { class: 'trace-explorer-page__filters' }, [
            u(
              f,
              {
                value: K.value,
                'onUpdate:value': (e) => (K.value = e),
                placeholder: '搜索链路 ID',
                class: 'trace-explorer-page__input-wide',
                onKeyup: (e) => 'Enter' === e.key && ie()
              },
              { prefix: () => u(n, { component: x }, null) }
            ),
            u(
              y,
              {
                value: F.value,
                'onUpdate:value': (e) => (F.value = e),
                options: J.value,
                placeholder: '服务',
                clearable: !0,
                class: 'trace-explorer-page__select-service'
              },
              null
            ),
            u(
              y,
              {
                value: Q.value,
                'onUpdate:value': (e) => (Q.value = e),
                options: te,
                placeholder: '状态',
                clearable: !0,
                class: 'trace-explorer-page__select-status'
              },
              null
            ),
            u(
              y,
              {
                value: Y.value,
                'onUpdate:value': (e) => (Y.value = e),
                options: le.value,
                placeholder: '环境',
                clearable: !0,
                class: 'trace-explorer-page__select-env'
              },
              null
            ),
            u(
              y,
              {
                value: V.value,
                'onUpdate:value': (e) => (V.value = e),
                options: ae.value,
                placeholder: '操作',
                clearable: !0,
                class: 'trace-explorer-page__select-operation'
              },
              null
            ),
            u(
              y,
              {
                value: W.value,
                'onUpdate:value': (e) => (W.value = e),
                options: re,
                placeholder: '耗时',
                clearable: !0,
                class: 'trace-explorer-page__select-duration'
              },
              null
            ),
            u(
              o,
              { secondary: !0, type: 'primary', onClick: ie, loading: A.value },
              { icon: () => u(n, null, { default: () => [u(c, null, null)] }) }
            ),
            u(o, { quaternary: !0, onClick: pe, disabled: 0 === ve.value.length }, { default: () => [m('重置筛选')] })
          ]),
          u('div', { class: 'trace-explorer-page__filter-strip' }, [
            ve.value.length > 0
              ? ve.value.map((e) =>
                  u(g, { key: e, size: 'small', bordered: !1, type: 'info' }, B(e) ? e : { default: () => [e] })
                )
              : u('span', { class: 'trace-explorer-page__filter-placeholder' }, [
                  m('未设置筛选条件，展示当前时间范围内全部链路。')
                ])
          ]),
          u('div', { class: 'trace-explorer-page__table-shell' }, [
            u(
              j,
              {
                columns: _e,
                data: ue.value,
                loading: A.value,
                maxHeight: 'max(360px, calc(100vh - 520px))',
                flexHeight: !1,
                'row-class-name': 'trace-explorer-page__row-hover',
                rowKey: (e) => e.traceId,
                rowProps: (e) => ({ onClick: () => xe(e.traceId) }),
                class: 'trace-explorer-page__table'
              },
              null
            )
          ])
        ]),
        u(
          h,
          { show: N.value, 'onUpdate:show': (e) => (N.value = e), width: 800, placement: 'right' },
          {
            default: () => [
              u(
                b,
                { title: `链路：${E.value}`, closable: !0 },
                {
                  default: () => [
                    fe.value
                      ? u('div', { class: 'trace-explorer-page__drawer-loading' }, [u(T, { size: 'large' }, null)])
                      : ge.value.length > 0 && ye.value
                        ? u('div', { class: 'trace-explorer-page__drawer-shell' }, [
                            u('div', { class: 'trace-explorer-page__drawer-overview' }, [
                              u('div', null, [
                                u('span', { class: 'trace-explorer-page__drawer-overview-label' }, [m('总耗时')]),
                                u('strong', null, [we.value, m('ms')])
                              ]),
                              u('div', null, [
                                u('span', { class: 'trace-explorer-page__drawer-overview-label' }, [m('Span')]),
                                u('strong', null, [he.value.spanCount])
                              ]),
                              u('div', null, [
                                u('span', { class: 'trace-explorer-page__drawer-overview-label' }, [m('服务')]),
                                u('strong', null, [he.value.serviceCount])
                              ]),
                              u('div', null, [
                                u('span', { class: 'trace-explorer-page__drawer-overview-label' }, [m('异常')]),
                                u(
                                  'strong',
                                  {
                                    class:
                                      he.value.failed > 0
                                        ? 'trace-explorer-page__status-error'
                                        : 'trace-explorer-page__status-ok'
                                  },
                                  [he.value.failed]
                                )
                              ])
                            ]),
                            u('div', { class: 'trace-explorer-page__drawer-scale' }, [
                              u('div', { class: 'trace-explorer-page__drawer-scale-service' }, [m('服务 / 操作')]),
                              u('div', { class: 'trace-explorer-page__drawer-scale-main' }, [
                                u(
                                  'div',
                                  {
                                    class:
                                      'trace-explorer-page__drawer-scale-edge trace-explorer-page__drawer-scale-edge--left'
                                  },
                                  [m('0ms')]
                                ),
                                u(
                                  'div',
                                  {
                                    class:
                                      'trace-explorer-page__drawer-scale-edge trace-explorer-page__drawer-scale-edge--right'
                                  },
                                  [we.value, m('ms')]
                                )
                              ])
                            ]),
                            u('div', { class: 'trace-explorer-page__drawer-tree' }, [
                              Te(void 0, 0, ye.value.startTime)
                            ]),
                            G.value &&
                              u('div', { class: 'trace-explorer-page__drawer-detail' }, [
                                u('h4', { class: 'trace-explorer-page__drawer-title' }, [G.value.name, m(' 详情')]),
                                u('div', { class: 'trace-explorer-page__drawer-grid' }, [
                                  u('div', null, [
                                    m('服务：'),
                                    u('span', { class: 'trace-explorer-page__mono-value' }, [G.value.service])
                                  ]),
                                  u('div', null, [
                                    m('耗时：'),
                                    u('span', { class: 'trace-explorer-page__mono-value' }, [G.value.duration, m('ms')])
                                  ]),
                                  u('div', null, [
                                    m('开始时间：'),
                                    u('span', { class: 'trace-explorer-page__mono-value' }, [
                                      w(G.value.startTime).format('HH:mm:ss.SSS')
                                    ])
                                  ]),
                                  u('div', null, [
                                    m('状态：'),
                                    u(
                                      'span',
                                      {
                                        class:
                                          'ok' === G.value.status
                                            ? 'trace-explorer-page__status-ok'
                                            : 'trace-explorer-page__status-error'
                                      },
                                      [G.value.status]
                                    )
                                  ])
                                ]),
                                u('div', { class: 'trace-explorer-page__drawer-actions' }, [
                                  u(
                                    o,
                                    {
                                      secondary: !0,
                                      type: 'primary',
                                      onClick: () => {
                                        var e
                                        O.push({
                                          path: '/home/investigate/logs',
                                          query: {
                                            service: (null == (e = G.value) ? void 0 : e.service) || F.value || void 0,
                                            keyword: E.value || void 0,
                                            timeRange: P.timeRange
                                          }
                                        })
                                      }
                                    },
                                    { default: () => [m('查看关联日志')] }
                                  )
                                ]),
                                G.value.tags &&
                                  Object.keys(G.value.tags).length > 0 &&
                                  u('div', { class: 'trace-explorer-page__drawer-actions' }, [
                                    u('h5', { class: 'trace-explorer-page__drawer-title' }, [m('Tags')]),
                                    u('div', { class: 'trace-explorer-page__drawer-tags' }, [
                                      Object.entries(G.value.tags).map(([e, a]) =>
                                        u(
                                          g,
                                          { key: e, size: 'small', bordered: !1 },
                                          { default: () => [e, m(': '), String(a)] }
                                        )
                                      )
                                    ])
                                  ])
                              ])
                          ])
                        : u(
                            _,
                            { description: 'No trace details found', class: 'trace-explorer-page__drawer-empty' },
                            null
                          )
                  ]
                }
              )
            ]
          }
        )
      ])
    }
  }
})
export { O as default }
