import {
  p as e,
  r as a,
  q as t,
  a0 as n,
  a1 as s,
  a3 as l,
  ba as r,
  a2 as i,
  w as o,
  am as u,
  ac as c,
  cz as v,
  aR as m,
  ci as p,
  cc as d,
  ag as g,
  cO as y
} from './invariable-DewVS0br.js'
import { f as _, k as f } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { u as b } from './useTimeStore-CVw7RN2Q.js'
import { d as h } from './index-DFkcx8xz.js'
import { P as w } from './PageHeader-OtleDOO-.js'
import { R as k } from './ResultTable-B_9U75PU.js'
import { T as R } from './TimeRangeBar-EdVcwx6f.js'
const T = e({
  name: 'InstanceMonitorPage',
  setup() {
    const e = r(),
      T = b(),
      j = a()
    t()
    const q = n(h()),
      z = n(''),
      P = n(!1),
      I = n([]),
      x = n([]),
      S = [
        {
          title: '实例ID',
          key: 'id',
          width: 200,
          render: (e) => o('span', { class: 'instance-monitor-page__mono-id' }, [e.id])
        },
        {
          title: '状态',
          key: 'status',
          width: 100,
          render: (e) =>
            e.status && 'unknown' !== e.status
              ? m(
                  p,
                  {
                    type: 'running' === e.status ? 'success' : 'error' === e.status ? 'error' : 'default',
                    size: 'small',
                    bordered: !1
                  },
                  { default: () => ('running' === e.status ? '运行中' : 'error' === e.status ? '异常' : '未知') }
                )
              : m(p, { type: 'default', size: 'small', bordered: !1 }, { default: () => '未知' })
        },
        { title: '节点', key: 'node', width: 150 },
        {
          title: 'CPU使用率',
          key: 'cpu',
          width: 120,
          render: (e) =>
            'number' != typeof e.cpu
              ? o('span', { class: 'instance-monitor-page__unknown-text' }, [c('未知')])
              : m(d, {
                  type: 'line',
                  percentage: e.cpu,
                  status: e.cpu > 80 ? 'error' : e.cpu > 60 ? 'warning' : 'success',
                  showIndicator: !1,
                  color:
                    e.cpu > 80
                      ? 'var(--color-danger-6)'
                      : e.cpu > 60
                        ? 'var(--color-warning-6)'
                        : 'var(--color-success-6)'
                })
        },
        {
          title: '内存使用率',
          key: 'memory',
          width: 120,
          render: (e) =>
            'number' != typeof e.memory
              ? o('span', { class: 'instance-monitor-page__unknown-text' }, [c('未知')])
              : m(d, {
                  type: 'line',
                  percentage: e.memory,
                  status: e.memory > 80 ? 'error' : e.memory > 60 ? 'warning' : 'success',
                  showIndicator: !1,
                  color:
                    e.memory > 80
                      ? 'var(--color-danger-6)'
                      : e.memory > 60
                        ? 'var(--color-warning-6)'
                        : 'var(--color-success-6)'
                })
        },
        {
          title: '启动时间',
          key: 'startTime',
          width: 180,
          render: (e) => o('span', { class: 'instance-monitor-page__unknown-text' }, [e.startTime || '未知'])
        },
        {
          title: '操作',
          key: 'actions',
          width: 180,
          render(e) {
            const a = () => j.info(`查看实例 ${e.id}`)
            return m(y, null, {
              default: () => [
                m(g, { size: 'tiny', secondary: !0, type: 'primary', onClick: a }, { default: () => '详情' })
              ]
            })
          }
        }
      ],
      U = n(!1),
      C = s(() => (U.value ? I.value.length : null)),
      L = s(() => (U.value ? I.value.filter((e) => 'running' === e.status).length : null)),
      $ = s(() => (U.value ? I.value.filter((e) => 'error' === e.status).length : null)),
      M = (e) => ('number' == typeof e ? e : '未知'),
      O = s(() => {
        const e = I.value.map((e) => e.cpu).filter((e) => 'number' == typeof e)
        if (!e.length) return '未知'
        const a = e.reduce((e, a) => e + a, 0)
        return Math.round((a / e.length) * 10) / 10 + '%'
      }),
      B = s(() => {
        var e
        return (null == (e = x.value.find((e) => e.value === z.value)) ? void 0 : e.label) || z.value
      }),
      D = s(() => [
        { key: 'total', label: '总实例数', value: M(C.value), hint: '当前服务发现到的实例总量', tone: 'default' },
        { key: 'running', label: '运行中', value: M(L.value), hint: '状态正常并可接收流量', tone: 'success' },
        { key: 'error', label: '异常', value: M($.value), hint: '需要优先排查的实例', tone: 'danger' },
        { key: 'cpu', label: '平均 CPU', value: O.value, hint: '仅统计上报 CPU 的实例', tone: 'primary' }
      ]),
      H = async () => {
        var e
        try {
          const a = await _({ page: 1, pageSize: 200, scope: q.value })
          ;(x.value = ((null == a ? void 0 : a.items) || []).map((e) => {
            var a, t
            return {
              label: null == (a = e.identity) ? void 0 : a.name,
              value: null == (t = e.identity) ? void 0 : t.id
            }
          })),
            (z.value && x.value.some((e) => e.value === z.value)) ||
              (z.value = (null == (e = x.value[0]) ? void 0 : e.value) || '')
        } catch (a) {
          j.error('加载服务列表失败'), (x.value = []), z.value || (z.value = '')
        }
      },
      K = async () => {
        if (!z.value) return (I.value = []), void (U.value = !1)
        P.value = !0
        try {
          ;(I.value = (await f(z.value, { scope: q.value })) || []), (U.value = !0)
        } catch (e) {
          j.error('加载实例失败'), (I.value = []), (U.value = !1)
        } finally {
          P.value = !1
        }
      }
    return (
      l(() => {
        e.query.timeRange && 'string' == typeof e.query.timeRange && T.setTimeRange(e.query.timeRange),
          e.query.serviceId && 'string' == typeof e.query.serviceId && (z.value = e.query.serviceId),
          H(),
          K()
      }),
      i(z, K),
      i(
        () => q.value,
        () => {
          ;(z.value = ''), H()
        }
      ),
      () =>
        o('div', { class: 'instance-monitor-page' }, [
          o(w, { title: '实例监控', subtitle: '监控服务实例的运行状态和资源使用情况' }, {}),
          o(
            R,
            {
              value: T.timeRange,
              live: T.isLive,
              options: T.timeOptions,
              'onUpdate:value': (e) => T.setTimeRange(e),
              'onUpdate:live': (e) => {
                ;(T.isLive = e), e && T.refreshTime()
              },
              onRefresh: () => {
                T.refreshTime(), K()
              }
            },
            null
          ),
          o('section', { class: 'instance-monitor-page__stats-grid', 'aria-label': '实例状态摘要' }, [
            D.value.map((e) =>
              o(
                'article',
                {
                  key: e.key,
                  class: ['instance-monitor-page__stat-card', `instance-monitor-page__stat-card--${e.tone}`]
                },
                [
                  o('div', { class: 'instance-monitor-page__stat-main' }, [
                    o('span', { class: 'instance-monitor-page__stat-label' }, [e.label]),
                    o('strong', { class: 'instance-monitor-page__stat-value' }, [e.value])
                  ]),
                  o('span', { class: 'instance-monitor-page__stat-hint' }, [e.hint])
                ]
              )
            )
          ]),
          o(
            u,
            { class: 'instance-monitor-page__table-card', bordered: !1, contentStyle: { padding: 0 } },
            {
              default: () => [
                o('div', { class: 'instance-monitor-page__table-header' }, [
                  o('div', { class: 'instance-monitor-page__table-header-content' }, [
                    o('div', null, [
                      o('h3', { class: 'instance-monitor-page__table-title' }, [c('实例列表')]),
                      o('p', { class: 'instance-monitor-page__table-desc' }, [
                        z.value ? `当前服务：${B.value}` : '请选择服务查看实例状态'
                      ])
                    ]),
                    o('label', { class: 'instance-monitor-page__service-filter' }, [
                      o('span', { class: 'instance-monitor-page__service-filter-label' }, [c('服务')]),
                      o(
                        v,
                        {
                          class: 'instance-monitor-page__service-select',
                          value: z.value,
                          'onUpdate:value': (e) => (z.value = e),
                          options: x.value,
                          filterable: !0,
                          clearable: !1,
                          placeholder: '选择服务'
                        },
                        null
                      )
                    ])
                  ])
                ]),
                o('div', { class: 'instance-monitor-page__table-scroll' }, [
                  o(
                    k,
                    {
                      class: 'instance-monitor-page__table',
                      loading: P.value,
                      columns: S,
                      data: I.value,
                      pagination: { pageSize: 10, showSizePicker: !0, pageSizes: [10, 20, 50] },
                      bordered: !1,
                      singleLine: !1,
                      rowKey: (e) => e.id,
                      rowClassName: 'instance-monitor-page__table-row',
                      scrollX: 1050
                    },
                    null
                  )
                ])
              ]
            }
          )
        ])
    )
  }
})
export { T as default }
