import {
  p as e,
  w as a,
  am as t,
  r as l,
  ba as i,
  a0 as r,
  a1 as u,
  a3 as s,
  a2 as n,
  ag as o,
  $ as v,
  ac as d,
  cO as m,
  cz as p,
  cR as c,
  ab as y,
  ch as g,
  a6 as h,
  cM as f,
  cN as x,
  by as b
} from './invariable-DewVS0br.js'
import { f as w, q, j as R } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { P as S } from './PageHeader-OtleDOO-.js'
import { T as j } from './TimeRangeBar-EdVcwx6f.js'
import { u as _ } from './useTimeStore-CVw7RN2Q.js'
import { L as T } from './LineChart-gPgXHJ75.js'
import { B as M } from './BarChart-BD7y_EJr.js'
import { R as U } from './ResultTable-B_9U75PU.js'
import { d as A } from './index-DFkcx8xz.js'
import { r as L, P as k, b as C, h as I, a as P } from './queryModel-CK1Nudco.js'
import './BaseChart-FGf3lmW3.js'
const $ = e({
    name: 'TableResultPanel',
    props: {
      columns: { type: Array, required: !0 },
      data: { type: Array, required: !0 },
      rowKey: { type: Function, required: !0 }
    },
    setup: (e) => () =>
      a(
        t,
        { title: '表格结果', bordered: !1, headerStyle: { padding: '16px 0' } },
        {
          default: () => [
            a(U, { columns: e.columns, data: e.data, rowKey: e.rowKey, pagination: { pageSize: 20 } }, null)
          ]
        }
      )
  }),
  O = e({
    name: 'MetricsExplorerPage',
    setup() {
      const e = i(),
        U = v(),
        O = _(),
        B = l(),
        D = 'system' === e.query.scope || 'tenant' === e.query.scope ? e.query.scope : A(),
        z = r(D),
        E = r(null),
        K = r('string' == typeof e.query.metric ? e.query.metric : null),
        N = r(null),
        G = r('line'),
        H = r(!1),
        J = r(null),
        Q = r([]),
        F = r([]),
        V = r(''),
        W = u(() => Q.value.map((e) => ({ label: e.name, value: e.id }))),
        X = u(() =>
          J.value
            ? [
                ...(J.value.series.cpu || []).map((e) => ({ metric: e.name || 'CPU', points: e.data || [] })),
                ...(J.value.series.memory || []).map((e) => ({ metric: e.name || '内存', points: e.data || [] })),
                ...(J.value.series.qps || []).map((e) => ({ metric: e.name || 'QPS', points: e.data || [] })),
                ...(J.value.series.responseTime || []).map((e) => ({
                  metric: e.name || '响应时间',
                  points: e.data || []
                }))
              ].flatMap((e) => e.points.map((a) => ({ metric: e.metric, timestamp: a.timestamp, value: a.value })))
            : []
        ),
        Y = (e) =>
          e
            .filter((e) => 'number' == typeof e.value)
            .map((e) => ({ name: b(e.timestamp).format('HH:mm'), value: e.value })),
        Z = u(() => {
          const e = X.value[0]
          return (e ? Object.keys(e) : ['metric', 'timestamp', 'value']).map((e) =>
            'timestamp' === e
              ? { title: '时间', key: e, render: (e) => new Date(e.timestamp).toLocaleString() }
              : 'metric' === e
                ? { title: '指标', key: e }
                : { title: '值', key: e }
          )
        }),
        ee = 'starlight_metrics_saved_views',
        ae = async () => {
          try {
            const a = await w({ page: 1, pageSize: 200, scope: z.value })
            ;(Q.value = ((null == a ? void 0 : a.items) || []).map((e) => {
              var a, t
              return { id: null == (a = e.identity) ? void 0 : a.id, name: null == (t = e.identity) ? void 0 : t.name }
            })),
              !E.value && Q.value.length && (E.value = String(e.query.serviceId || Q.value[0].id))
          } catch (a) {}
        },
        te = () => {
          var e, a
          const t = (null == (e = N.value) ? void 0 : e[1]) || O.endTime || Date.now(),
            l = (null == (a = N.value) ? void 0 : a[0]) || O.startTime || t - 36e5,
            i = Math.max(6e4, t - l),
            r = Math.round(i / 6e4)
          if (r < 60) return `-${r}m`
          const u = Math.round(r / 60)
          return u < 24 ? `-${u}h` : `-${Math.round(u / 24)}d`
        },
        le = () => {
          const e = V.value.trim() || `视图 ${F.value.length + 1}`
          F.value.unshift({
            key: `${Date.now()}`,
            name: e,
            serviceId: E.value,
            dateRange: N.value,
            timeRange: O.timeRange
          }),
            'undefined' != typeof localStorage && localStorage.setItem(ee, JSON.stringify(F.value)),
            (V.value = ''),
            B.success('已保存视图')
        },
        ie = () => {
          if (!X.value.length) return void B.warning('当前没有可导出的数据')
          const e = [['metric', 'timestamp', 'value'].join(',')]
          X.value.forEach((a) => {
            e.push([a.metric, a.timestamp, a.value].map((e) => JSON.stringify(e)).join(','))
          })
          const a = new Blob([e.join('\n')], { type: 'text/csv;charset=utf-8;' }),
            t = URL.createObjectURL(a),
            l = document.createElement('a')
          ;(l.href = t),
            (l.download = `metrics-export-${Date.now()}.csv`),
            document.body.appendChild(l),
            l.click(),
            document.body.removeChild(l),
            URL.revokeObjectURL(t),
            B.success('导出成功')
        },
        re = async () => {
          H.value = !0
          try {
            const e = C({
                scope: z.value,
                serviceId: E.value || void 0,
                timeRange: te(),
                refreshGenerationId: `${Date.now()}`,
                metricRef: K.value
              }),
              a = await q(e)
            if (!I(a)) throw new Error('v2 query gateway returned no usable card results')
            J.value = P(a)
          } catch (e) {
            try {
              const e = await R({ serviceId: E.value || void 0, timeRange: te(), scope: z.value })
              J.value = e
            } catch (a) {
              J.value = null
            }
          } finally {
            H.value = !1
          }
        }
      return (
        s(async () => {
          e.query.timeRange && 'string' == typeof e.query.timeRange && O.setTimeRange(e.query.timeRange),
            e.query.serviceId && 'string' == typeof e.query.serviceId && (E.value = e.query.serviceId),
            e.query.metric && 'string' == typeof e.query.metric && (K.value = e.query.metric),
            await ae(),
            (() => {
              if ('undefined' != typeof localStorage)
                try {
                  const e = localStorage.getItem(ee)
                  F.value = e ? JSON.parse(e) : []
                } catch (e) {}
            })(),
            await re()
        }),
        n(
          () => z.value,
          async () => {
            ;(E.value = null), await ae(), await re()
          }
        ),
        () =>
          a('div', { class: 'metrics-explorer-page' }, [
            a(
              S,
              { title: '指标分析', subtitle: '历史趋势、热力与对比分析' },
              {
                actions: () =>
                  a(
                    o,
                    { onClick: () => U.push({ path: '/home/investigate/metrics/catalog', query: { scope: z.value } }) },
                    { default: () => [d('浏览指标目录')] }
                  )
              }
            ),
            a(
              j,
              {
                value: O.timeRange,
                live: O.isLive,
                options: O.timeOptions,
                'onUpdate:value': (e) => {
                  O.setTimeRange(e), re()
                },
                'onUpdate:live': (e) => {
                  ;(O.isLive = e), e && O.refreshTime(), re()
                },
                onRefresh: () => {
                  O.refreshTime(), re()
                }
              },
              null
            ),
            a(
              t,
              { class: 'metrics-explorer-page__toolbar', bordered: !1 },
              {
                default: () => [
                  a(m, null, {
                    default: () => [
                      a(
                        p,
                        {
                          value: E.value,
                          'onUpdate:value': (e) => (E.value = e),
                          options: W.value,
                          style: { width: '200px' },
                          placeholder: '选择服务',
                          disabled: 0 === W.value.length
                        },
                        null
                      ),
                      a(
                        c,
                        {
                          value: N.value,
                          'onUpdate:value': (e) => (N.value = e),
                          type: 'datetimerange',
                          clearable: !0,
                          style: { width: '300px' }
                        },
                        null
                      ),
                      a(
                        p,
                        {
                          value: G.value,
                          'onUpdate:value': (e) => (G.value = e),
                          options: [
                            { label: '折线模式', value: 'line' },
                            { label: '柱状模式', value: 'bar' },
                            { label: '面积模式', value: 'area' },
                            { label: '表格模式', value: 'table' }
                          ],
                          style: { width: '160px' }
                        },
                        null
                      ),
                      a(
                        y,
                        {
                          value: V.value,
                          'onUpdate:value': (e) => (V.value = e),
                          placeholder: '保存当前视图名称',
                          style: { width: '220px' }
                        },
                        null
                      ),
                      a(o, { type: 'primary', onClick: re, disabled: !E.value }, { default: () => [d('查询')] }),
                      a(o, { onClick: le, disabled: !E.value }, { default: () => [d('保存视图')] }),
                      a(o, { onClick: ie }, { default: () => [d('导出')] })
                    ]
                  })
                ]
              }
            ),
            a(
              t,
              { class: 'metrics-explorer-page__saved-views', bordered: !1 },
              {
                default: () => [
                  a('div', { class: 'metrics-explorer-page__saved-note' }, [d('已保存视图')]),
                  F.value.length
                    ? a('div', { class: 'metrics-explorer-page__saved-actions' }, [
                        F.value.map((e) =>
                          a(
                            o,
                            {
                              secondary: !0,
                              onClick: () => {
                                ;(E.value = e.serviceId),
                                  e.timeRange && O.setTimeRange(e.timeRange),
                                  (N.value = e.dateRange),
                                  (K.value = null),
                                  re()
                              }
                            },
                            { default: () => [e.name] }
                          )
                        )
                      ])
                    : a(g, { description: '暂无已保存视图', class: 'metrics-explorer-page__empty-state' }, null)
                ]
              }
            ),
            a(
              t,
              { bordered: !1, class: 'metrics-explorer-page__content' },
              {
                default: () => [
                  H.value
                    ? a('div', { class: 'metrics-explorer-page__loading' }, [a(h, { size: 'large' }, null)])
                    : null,
                  !H.value &&
                    !J.value &&
                    a(
                      g,
                      { description: '暂无数据，请选择应用后查询', class: 'metrics-explorer-page__empty-state' },
                      null
                    ),
                  J.value
                    ? 'table' === G.value
                      ? a($, { columns: Z.value, data: X.value, rowKey: (e) => `${e.metric}-${e.timestamp}` }, null)
                      : a(
                          f,
                          { cols: 2, xGap: 16, yGap: 16 },
                          {
                            default: () => [
                              K.value && 'cpu' !== L(K.value)
                                ? null
                                : a(x, null, {
                                    default: () => [
                                      a(
                                        t,
                                        {
                                          title: 'CPU 使用率趋势',
                                          bordered: !1,
                                          headerStyle: { padding: '16px 0' },
                                          contentStyle: { padding: 0 }
                                        },
                                        {
                                          default: () => {
                                            var e, t
                                            return [
                                              'bar' === G.value
                                                ? a(
                                                    M,
                                                    {
                                                      data: Y(
                                                        (null == (t = null == (e = J.value.series.cpu) ? void 0 : e[0])
                                                          ? void 0
                                                          : t.data) || []
                                                      ),
                                                      height: '280px',
                                                      variant: 'monitor',
                                                      yAxisMin: k.value.min,
                                                      yAxisMax: k.value.max,
                                                      yAxisUnit: k.value.unit
                                                    },
                                                    null
                                                  )
                                                : a(
                                                    T,
                                                    {
                                                      series: J.value.series.cpu,
                                                      title: '',
                                                      height: '280px',
                                                      area: 'area' === G.value,
                                                      variant: 'monitor',
                                                      showLegend: !0,
                                                      yAxisMin: k.value.min,
                                                      yAxisMax: k.value.max,
                                                      yAxisUnit: k.value.unit
                                                    },
                                                    null
                                                  )
                                            ]
                                          }
                                        }
                                      )
                                    ]
                                  }),
                              K.value && 'memory' !== L(K.value)
                                ? null
                                : a(x, null, {
                                    default: () => [
                                      a(
                                        t,
                                        {
                                          title: '内存使用率趋势',
                                          bordered: !1,
                                          headerStyle: { padding: '16px 0' },
                                          contentStyle: { padding: 0 }
                                        },
                                        {
                                          default: () => {
                                            var e, t
                                            return [
                                              'bar' === G.value
                                                ? a(
                                                    M,
                                                    {
                                                      data: Y(
                                                        (null ==
                                                        (t = null == (e = J.value.series.memory) ? void 0 : e[0])
                                                          ? void 0
                                                          : t.data) || []
                                                      ),
                                                      height: '280px',
                                                      variant: 'monitor',
                                                      yAxisMin: k.value.min,
                                                      yAxisMax: k.value.max,
                                                      yAxisUnit: k.value.unit
                                                    },
                                                    null
                                                  )
                                                : a(
                                                    T,
                                                    {
                                                      series: J.value.series.memory,
                                                      title: '',
                                                      height: '280px',
                                                      area: 'area' === G.value,
                                                      variant: 'monitor',
                                                      showLegend: !0,
                                                      yAxisMin: k.value.min,
                                                      yAxisMax: k.value.max,
                                                      yAxisUnit: k.value.unit
                                                    },
                                                    null
                                                  )
                                            ]
                                          }
                                        }
                                      )
                                    ]
                                  }),
                              K.value && 'qps' !== L(K.value)
                                ? null
                                : a(x, null, {
                                    default: () => [
                                      a(
                                        t,
                                        {
                                          title: 'QPS 趋势',
                                          bordered: !1,
                                          headerStyle: { padding: '16px 0' },
                                          contentStyle: { padding: 0 }
                                        },
                                        {
                                          default: () => {
                                            var e, t
                                            return [
                                              'bar' === G.value
                                                ? a(
                                                    M,
                                                    {
                                                      data: Y(
                                                        (null == (t = null == (e = J.value.series.qps) ? void 0 : e[0])
                                                          ? void 0
                                                          : t.data) || []
                                                      ),
                                                      height: '280px',
                                                      variant: 'monitor'
                                                    },
                                                    null
                                                  )
                                                : a(
                                                    T,
                                                    {
                                                      series: J.value.series.qps,
                                                      title: '',
                                                      height: '280px',
                                                      area: 'area' === G.value,
                                                      variant: 'monitor',
                                                      showLegend: !0
                                                    },
                                                    null
                                                  )
                                            ]
                                          }
                                        }
                                      )
                                    ]
                                  }),
                              K.value && 'responseTime' !== L(K.value)
                                ? null
                                : a(x, null, {
                                    default: () => [
                                      a(
                                        t,
                                        {
                                          title: '响应时间趋势',
                                          bordered: !1,
                                          headerStyle: { padding: '16px 0' },
                                          contentStyle: { padding: 0 }
                                        },
                                        {
                                          default: () => {
                                            var e, t
                                            return [
                                              'bar' === G.value
                                                ? a(
                                                    M,
                                                    {
                                                      data: Y(
                                                        (null ==
                                                        (t = null == (e = J.value.series.responseTime) ? void 0 : e[0])
                                                          ? void 0
                                                          : t.data) || []
                                                      ),
                                                      height: '280px',
                                                      variant: 'monitor'
                                                    },
                                                    null
                                                  )
                                                : a(
                                                    T,
                                                    {
                                                      series: J.value.series.responseTime,
                                                      title: '',
                                                      height: '280px',
                                                      area: 'area' === G.value,
                                                      variant: 'monitor',
                                                      showLegend: !0
                                                    },
                                                    null
                                                  )
                                            ]
                                          }
                                        }
                                      )
                                    ]
                                  }),
                              K.value && 'requestStats' !== L(K.value)
                                ? null
                                : a(
                                    x,
                                    { span: 2 },
                                    {
                                      default: () => [
                                        a(
                                          t,
                                          { title: '请求统计', bordered: !1, headerStyle: { padding: '16px 0' } },
                                          {
                                            default: () => [
                                              a(
                                                M,
                                                { data: J.value.requestStats, height: '260px', variant: 'monitor' },
                                                null
                                              )
                                            ]
                                          }
                                        )
                                      ]
                                    }
                                  )
                            ]
                          }
                        )
                    : null
                ]
              }
            )
          ])
      )
    }
  })
export { O as default }
