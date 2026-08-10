import { M as e } from './MobileButton-BKhxhz5A.js'
import { M as l } from './MobileCard-BxmuYclQ.js'
import { M as a } from './MobileTag-ByR2jSPf.js'
import { M as s } from './MobileEmpty-BimvXy70.js'
import { M as i } from './MobileLoading-DlB38x7T.js'
import { M as t } from './MobileInput-OCuvcoNh.js'
import { m as o } from './MobileToast-CIN42EDh.js'
import { M as r } from './MobileSheet-BNn0TOks.js'
import { M as n } from './MobileSelect-BOALIWQn.js'
import { M as u, a as v } from './MobileListItem-Dy-C6Gku.js'
import {
  p as c,
  a1 as d,
  a0 as b,
  aP as m,
  a2 as p,
  Z as _,
  w as f,
  ac as g,
  aR as y,
  ba as x,
  bb as h,
  $ as k,
  bc as w,
  b2 as I,
  aL as z,
  b6 as C,
  bd as M,
  b0 as j,
  be as U,
  ai as T
} from './invariable-DewVS0br.js'
import { f as L, a as P, b as R, r as V, s as q, c as $ } from './alerts-CIHfuoAx.js'
import { f as N } from './metrics-uVJcD6zf.js'
import { u as S } from './useTimeStore-CVw7RN2Q.js'
import { d as E } from './index-DFkcx8xz.js'
import { MOBILE_ALERT_BADGE_REFRESH_KEY as D } from './MobileLayout-Cm40AytQ.js'
import { p as O, r as A, i as B } from './investigationContext-7xMjfbkf.js'
import './request-BiInMBwl.js'
import './MobileVantProvider-BmQB5FA8.js'
function F(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !T(e))
}
function Y(e) {
  const l = Date.now(),
    a = new Date(e).getTime()
  if (Number.isNaN(a)) return e
  const s = l - a,
    i = Math.floor(s / 1e3)
  if (i < 60) return '刚刚'
  const t = Math.floor(i / 60)
  if (t < 60) return `${t}分钟前`
  const o = Math.floor(t / 60)
  if (o < 24) return `${o}小时前`
  const r = Math.floor(o / 24)
  return r < 30 ? `${r}天前` : `${Math.floor(r / 30)}个月前`
}
const Z = [
    { label: '最近 15 分钟', value: '15m' },
    { label: '最近 1 小时', value: '1h' },
    { label: '最近 4 小时', value: '4h' },
    { label: '最近 1 天', value: '1d' },
    { label: '最近 2 天', value: '2d' },
    { label: '最近 7 天', value: '7d' }
  ],
  G = [
    { label: '严重', value: 'critical' },
    { label: '警告', value: 'warning' },
    { label: '提示', value: 'info' }
  ],
  H = (e) => 'custom' !== e,
  K = (e) => !0 === e || ('object' == typeof e && !0 === e.success),
  W = c({
    name: 'MobileAlertsInbox',
    setup() {
      const c = x(),
        T = k(),
        W = S(),
        X = d(() => E()),
        J = h(D),
        Q = b(!0),
        ee = b(!1),
        le = b([]),
        ae = b([]),
        se = b(''),
        ie = b([]),
        te = b(''),
        oe = b(''),
        re = b(''),
        ne = b(H(W.timeRange) ? W.timeRange : ''),
        ue = b([{ label: '全部服务', value: '' }]),
        ve = b([{ label: '全部处理人', value: '' }]),
        ce = b(null),
        de = b(!1),
        be = b(null),
        me = b({ assigneeUserId: '' }),
        pe = b(!1),
        _e = b(null),
        fe = b(null),
        ge = b(null),
        ye = b(15)
      let xe = 0
      const he = d(() => ae.value.filter((e) => 'active' === e.status).length),
        ke = d(() => ae.value.filter((e) => 'resolved' === e.status).length),
        we = d(() => ae.value.filter((e) => 'suppressed' === e.status).length),
        Ie = d(() => le.value.slice(0, ye.value)),
        ze = d(() => le.value.length > ye.value),
        Ce = d(() => (re.value.trim().toLowerCase() ? le.value.length : null)),
        Me = d(() => {
          const e = []
          if (te.value) {
            const l =
              { active: '活跃', pending: '等待持续时间', resolved: '已解决', suppressed: '已静默' }[te.value] ||
              te.value
            e.push({ key: 'status', label: '状态', value: l })
          }
          if (se.value) {
            const l = ue.value.find((e) => e.value === se.value)
            e.push({ key: 'service', label: '服务', value: (null == l ? void 0 : l.label) || se.value })
          }
          if (
            (ie.value.length > 0 && e.push({ key: 'level', label: '级别', value: ie.value.map(Le).join('、') }),
            oe.value)
          ) {
            const l = ve.value.find((e) => e.value === oe.value)
            e.push({ key: 'assignee', label: '处理人', value: (null == l ? void 0 : l.label) || oe.value })
          }
          return re.value.trim() && e.push({ key: 'keyword', label: '关键词', value: re.value.trim() }), e
        }),
        je = d(() => Me.value.length > 0),
        Ue = () => {
          ;(se.value = ''), (ie.value = []), (te.value = ''), (oe.value = ''), (re.value = '')
        },
        Te = (e) => {
          switch (e) {
            case 'critical':
              return 'danger'
            case 'warning':
              return 'warning'
            case 'info':
              return 'info'
            default:
              return 'default'
          }
        },
        Le = (e) => {
          switch (e) {
            case 'critical':
              return '严重'
            case 'warning':
              return '警告'
            case 'info':
              return '提示'
            default:
              return e
          }
        },
        Pe = (e) => {
          switch (e) {
            case 'active':
              return '活跃'
            case 'pending':
              return '等待持续时间'
            case 'resolved':
              return '已解决'
            case 'suppressed':
              return '已静默'
            default:
              return e
          }
        },
        Re = (e) => {
          switch (e) {
            case 'active':
              return 'danger'
            case 'resolved':
              return 'success'
            case 'suppressed':
            default:
              return 'default'
            case 'pending':
              return 'warning'
          }
        },
        Ve = (e) => {
          let l = e
          return (
            (a = l),
            (l = se.value ? a.filter((e) => e.serviceId === se.value) : a),
            (l = ((e) => (0 === ie.value.length ? e : e.filter((e) => ie.value.includes(e.level))))(l)),
            (l = ((e) => (te.value ? e.filter((e) => e.status === te.value) : e))(l)),
            (l = ((e) => {
              const l = re.value.trim().toLowerCase()
              return l
                ? e.filter(
                    (e) =>
                      (e.message || '').toLowerCase().includes(l) ||
                      (e.service || '').toLowerCase().includes(l) ||
                      (e.id || '').toLowerCase().includes(l)
                  )
                : e
            })(l)),
            (l = ((e) =>
              oe.value
                ? '__unassigned__' === oe.value
                  ? e.filter((e) => !e.assigneeUserId)
                  : e.filter((e) => e.assigneeUserId === oe.value)
                : e)(l)),
            l
          )
          var a
        },
        qe = () => {
          if (!ge.value) return
          const e = le.value.find((e) => e.id === ge.value)
          e && ((fe.value = e.id), (ce.value = e), (ge.value = null))
        },
        $e = async () => {
          const e = ++xe,
            l = X.value,
            a = O(c.query),
            s = A(a),
            i = (null == s ? void 0 : s.start) ?? W.startTime,
            t = (null == s ? void 0 : s.end) ?? W.endTime
          ;(Q.value = !0), (ee.value = !1)
          try {
            const a = await L({ scope: l, startTime: i, endTime: t })
            if (e !== xe) return
            ;(ae.value = Array.isArray(a) ? a : []), (le.value = Ve(ae.value)), (ye.value = 15), qe()
          } catch (o) {
            if (e !== xe) return
            ee.value = !0
          } finally {
            e === xe && (Q.value = !1)
          }
        },
        Ne = (e) => {
          ;(ne.value = e), W.setTimeRange(e)
        },
        Se = () => {
          ye.value = Math.min(ye.value + 15, le.value.length)
        },
        Ee = async () => {
          if (!be.value) return
          const e = ve.value.find((e) => e.value === me.value.assigneeUserId)
          try {
            const l = await P(be.value.id, {
              assigneeUserId: me.value.assigneeUserId || '',
              assigneeName: (me.value.assigneeUserId && (null == e ? void 0 : e.label)) || ''
            })
            if (!K(l)) return void o.error('更新告警处理人失败')
            ;(de.value = !1), await $e(), await (null == J ? void 0 : J()), o.success('告警处理人已更新')
          } catch {
            o.error('更新告警处理人失败')
          }
        },
        De = (e, l) => {
          ;(_e.value = { type: e, alert: l }), (pe.value = !0)
        },
        Oe = async () => {
          if (!_e.value) return
          const { type: e, alert: l } = _e.value
          try {
            const a = 'acknowledge' === e ? await R(l.id) : 'resolve' === e ? await V(l.id) : await q(l.id)
            if (!K(a)) return void o.error('操作未完成，请稍后重试')
            ;(pe.value = !1), (_e.value = null), await $e(), await (null == J ? void 0 : J())
            const s = { acknowledge: '告警已确认', resolve: '告警已解决', suppress: '告警已静默' }
            o.success(s[e])
          } catch {
            o.error('操作失败，请重试')
          }
        },
        Ae = d(() =>
          _e.value ? { acknowledge: '确认告警', resolve: '解决告警', suppress: '静默告警' }[_e.value.type] : ''
        ),
        Be = d(() =>
          _e.value
            ? {
                acknowledge: '确认已收到此告警通知？',
                resolve: '确认将此告警标记为已解决？',
                suppress: '确认静默此告警？静默后不会重复通知。'
              }[_e.value.type]
            : ''
        ),
        Fe = () => {
          const e = ae.value
          if (0 === e.length) return void o.warning('暂无告警数据可导出')
          const l = e.map((e) =>
              [
                e.id,
                e.time,
                e.service || '-',
                e.level,
                `"${(e.message || '').replace(/"/g, '""')}"`,
                e.status,
                e.assigneeName || '未指派'
              ].join(',')
            ),
            a = '\ufeff' + ['ID', '时间', '服务', '等级', '消息', '状态', '处理人'].join(',') + '\n' + l.join('\n'),
            s = new Blob([a], { type: 'text/csv;charset=utf-8;' }),
            i = URL.createObjectURL(s),
            t = document.createElement('a')
          ;(t.href = i),
            (t.download = `alerts_${new Date().toISOString().slice(0, 10)}.csv`),
            t.click(),
            URL.revokeObjectURL(i),
            o.success('告警数据已导出')
        },
        Ye = (e, l, a = !1) => {
          if (a && !e.serviceId) return
          const s = new Date(e.time).getTime(),
            i = 9e5
          T.push({
            path: l,
            query: B({
              ...(e.serviceId ? { serviceId: e.serviceId } : {}),
              ...(e.service ? { serviceName: e.service } : {}),
              ...(Number.isFinite(s) ? { start: Math.max(1, s - i), end: s + i } : {}),
              ...(e.message ? { keyword: e.message } : {}),
              incidentId: e.id
            })
          })
        }
      m(() => {
        const e = (e) => ('string' == typeof e ? e : ''),
          l = O(c.query)
        ;(re.value = l.keyword ?? e(c.query.keyword)),
          (ge.value = l.incidentId ?? e(c.query.incidentId) ?? null),
          (async () => {
            try {
              const e = await N({ page: 1, pageSize: 200, scope: X.value }),
                l = (null == e ? void 0 : e.items) || []
              ue.value = [
                { label: '全部服务', value: '' },
                ...l.map((e) => {
                  var l, a, s
                  return {
                    label: (null == (l = e.identity) ? void 0 : l.name) || (null == (a = e.identity) ? void 0 : a.id),
                    value: (null == (s = e.identity) ? void 0 : s.id) || ''
                  }
                })
              ]
            } catch (e) {}
          })(),
          (async () => {
            try {
              const e = await $()
              ve.value = [
                { label: '全部处理人', value: '' },
                { label: '未指派', value: '__unassigned__' },
                ...e.map((e) => ({ label: e.nickname, value: e.userId }))
              ]
            } catch (e) {}
          })(),
          $e(),
          null == J || J()
      }),
        p(
          () => [W.startTime, W.endTime],
          () => $e()
        ),
        p(
          () => W.timeRange,
          (e) => {
            ne.value = H(e) ? e : ''
          }
        ),
        p(
          () => [c.query.keyword, c.query.incidentId],
          ([e, l]) => {
            const a = O(c.query)
            ;(re.value = a.keyword ?? ('string' == typeof e ? e : '')),
              (ge.value = a.incidentId ?? ('string' == typeof l ? l : null)),
              qe()
          }
        ),
        p(
          () => c.query,
          () => {
            const e = O(c.query)
            void 0 !== e.serviceId && (se.value = e.serviceId),
              void 0 !== e.keyword && (re.value = e.keyword),
              void 0 !== e.incidentId && (ge.value = e.incidentId),
              (void 0 === e.serviceId &&
                void 0 === e.keyword &&
                void 0 === e.incidentId &&
                void 0 === e.range &&
                void 0 === e.start) ||
                $e()
          }
        ),
        p(
          () => [se.value, ie.value, te.value, oe.value],
          () => {
            ;(le.value = Ve(ae.value)), (ye.value = 15), qe()
          },
          { deep: !0 }
        )
      let Ze = null
      return (
        p(re, () => {
          Ze && clearTimeout(Ze),
            (Ze = setTimeout(() => {
              ;(le.value = Ve(ae.value)), (ye.value = 15), qe()
            }, 300))
        }),
        _(() => {
          Ze && clearTimeout(Ze)
        }),
        () => {
          let o
          return f('div', { class: 'mobile-alerts-inbox' }, [
            f('header', { class: 'mobile-alerts-inbox__header' }, [
              f('h2', { class: 'mobile-alerts-inbox__title' }, [g('告警收件箱')]),
              f('div', { class: 'mobile-alerts-inbox__header-actions' }, [
                f(
                  e,
                  {
                    size: 'small',
                    type: 'ghost',
                    onClick: Fe,
                    class: 'mobile-alerts-inbox__export-btn',
                    icon: () => y(w, { size: 16 })
                  },
                  null
                ),
                f(
                  e,
                  {
                    size: 'small',
                    type: 'ghost',
                    onClick: $e,
                    class: 'mobile-alerts-inbox__refresh-btn',
                    loading: Q.value,
                    icon: () => y(I, { size: 16 })
                  },
                  null
                )
              ])
            ]),
            f('div', { class: 'mobile-alerts-inbox__summary-grid' }, [
              [
                { label: '总计', value: ae.value.length, tone: 'default' },
                { label: '活跃', value: he.value, tone: 'danger' },
                { label: '已解决', value: ke.value, tone: 'success' },
                { label: '已静默', value: we.value, tone: 'muted' }
              ].map((e, a) =>
                f(
                  l,
                  { key: a, size: 'small', bordered: !1, class: 'mobile-alerts-inbox__summary-card' },
                  {
                    default: () => [
                      f(
                        'div',
                        { class: `mobile-alerts-inbox__summary-value mobile-alerts-inbox__summary-value--${e.tone}` },
                        [e.value]
                      ),
                      f('div', { class: 'mobile-alerts-inbox__summary-label' }, [e.label])
                    ]
                  }
                )
              )
            ]),
            f('div', { class: 'mobile-alerts-inbox__filters' }, [
              f('section', { class: 'mobile-alerts-inbox__filter-group', 'aria-label': '范围筛选' }, [
                f('span', { class: 'mobile-alerts-inbox__filter-label' }, [g('范围')]),
                f('div', { class: 'mobile-alerts-inbox__filter-controls' }, [
                  f(
                    n,
                    {
                      modelValue: ne.value,
                      'onUpdate:modelValue': [(e) => (ne.value = e), Ne],
                      options: Z,
                      placeholder: 'custom' === W.timeRange ? '自定义时间' : '时间范围',
                      class: 'mobile-alerts-inbox__time-select'
                    },
                    null
                  ),
                  f(
                    n,
                    {
                      modelValue: se.value,
                      'onUpdate:modelValue': (e) => (se.value = e),
                      options: ue.value,
                      placeholder: '全部服务',
                      clearable: !0,
                      class: 'mobile-alerts-inbox__service-select'
                    },
                    null
                  )
                ])
              ]),
              f('section', { class: 'mobile-alerts-inbox__filter-group', 'aria-label': '生命周期筛选' }, [
                f('span', { class: 'mobile-alerts-inbox__filter-label' }, [g('生命周期')]),
                f('div', { class: 'mobile-alerts-inbox__chip-row' }, [
                  [
                    { label: '全部', value: '' },
                    { label: '活跃', value: 'active' },
                    { label: '待处理', value: 'pending' },
                    { label: '已解决', value: 'resolved' },
                    { label: '已静默', value: 'suppressed' }
                  ].map((l) => {
                    const a = te.value === l.value
                    return f(
                      e,
                      {
                        key: l.value,
                        size: 'small',
                        type: a ? 'primary' : 'ghost',
                        'aria-pressed': a,
                        onClick: () => (te.value = l.value)
                      },
                      { default: () => [l.label] }
                    )
                  })
                ])
              ]),
              f('section', { class: 'mobile-alerts-inbox__filter-group', 'aria-label': '严重程度筛选' }, [
                f('span', { class: 'mobile-alerts-inbox__filter-label' }, [g('严重程度')]),
                f('div', { class: 'mobile-alerts-inbox__chip-row' }, [
                  G.map((l) => {
                    const a = ie.value.includes(l.value)
                    return f(
                      e,
                      {
                        key: l.value,
                        size: 'small',
                        type: a ? 'primary' : 'ghost',
                        'aria-pressed': a,
                        onClick: () => {
                          const e = ie.value.indexOf(l.value)
                          e >= 0 ? ie.value.splice(e, 1) : ie.value.push(l.value)
                        }
                      },
                      { default: () => [l.label] }
                    )
                  })
                ])
              ])
            ]),
            f('div', { class: 'mobile-alerts-inbox__advanced-filters' }, [
              f('span', { class: 'mobile-alerts-inbox__filter-label' }, [g('高级')]),
              f('div', { class: 'mobile-alerts-inbox__search-row' }, [
                f(
                  t,
                  {
                    modelValue: re.value,
                    'onUpdate:modelValue': (e) => (re.value = e),
                    placeholder: '搜索告警内容、服务…',
                    clearable: !0,
                    class: 'mobile-alerts-inbox__search-input',
                    leftIcon: () => y(z, { size: 16 })
                  },
                  null
                ),
                f(
                  n,
                  {
                    modelValue: oe.value,
                    'onUpdate:modelValue': (e) => (oe.value = e),
                    options: ve.value,
                    placeholder: '全部处理人',
                    clearable: !0,
                    class: 'mobile-alerts-inbox__assignee-select'
                  },
                  null
                )
              ])
            ]),
            je.value &&
              f('div', { class: 'mobile-alerts-inbox__active-filters' }, [
                Me.value.map((l) =>
                  f('div', { key: l.key, class: 'mobile-alerts-inbox__filter-chip' }, [
                    f('span', { class: 'mobile-alerts-inbox__filter-chip-label' }, [l.label, g(':')]),
                    f('span', { class: 'mobile-alerts-inbox__filter-chip-value' }, [l.value]),
                    f(
                      e,
                      {
                        size: 'small',
                        type: 'ghost',
                        class: 'mobile-alerts-inbox__filter-chip-close',
                        icon: () => y(C, { size: 14 }),
                        onClick: (e) => {
                          var a
                          e.stopPropagation(),
                            'service' === (a = l.key) && (se.value = ''),
                            'level' === a && (ie.value = []),
                            'status' === a && (te.value = ''),
                            'assignee' === a && (oe.value = ''),
                            'keyword' === a && (re.value = '')
                        }
                      },
                      null
                    )
                  ])
                ),
                f(
                  e,
                  { size: 'small', type: 'ghost', class: 'mobile-alerts-inbox__filter-clear-all', onClick: Ue },
                  { default: () => [g('清除全部')] }
                )
              ]),
            null !== Ce.value &&
              f('div', { class: 'mobile-alerts-inbox__search-result-count' }, [
                g('找到 '),
                f('strong', null, [Ce.value]),
                g(' 条结果')
              ]),
            Q.value
              ? f('div', { class: 'mobile-alerts-inbox__loading' }, [f(i, { loading: Q.value, size: '36px' }, null)])
              : ee.value
                ? f('div', { class: 'mobile-alerts-inbox__error' }, [
                    f(s, { description: '加载失败，请重试' }, null),
                    f(
                      e,
                      { size: 'small', onClick: $e, class: 'mobile-alerts-inbox__retry-btn' },
                      { default: () => [g('重试')] }
                    )
                  ])
                : 0 === le.value.length
                  ? f('div', { class: 'mobile-alerts-inbox__empty' }, [
                      f(
                        s,
                        { description: je.value ? '没有匹配当前筛选条件的告警' : '暂无告警数据' },
                        {
                          default: () => [
                            je.value &&
                              f(
                                e,
                                { size: 'small', type: 'default', onClick: Ue },
                                { default: () => [g('清除筛选条件')] }
                              )
                          ]
                        }
                      ),
                      f('p', { class: 'mobile-alerts-inbox__empty-hint' }, [
                        je.value ? '清除或调整筛选条件后可查看当前时间范围内的告警' : '暂无告警，系统运行正常'
                      ])
                    ])
                  : f('div', { class: 'mobile-alerts-inbox__list-wrapper' }, [
                      f(
                        l,
                        { size: 'small', bordered: !1, class: 'mobile-alerts-inbox__list-card' },
                        {
                          default: () => [
                            f(
                              u,
                              null,
                              F(
                                (o = Ie.value.map((l) => {
                                  let s, i, t
                                  const o = fe.value === l.id
                                  return f(
                                    v,
                                    { key: l.id },
                                    {
                                      default: () => [
                                        f(
                                          'div',
                                          {
                                            class: [
                                              'mobile-alerts-inbox__card',
                                              `mobile-alerts-inbox__card--${l.level}`
                                            ],
                                            onClick: () => {
                                              return (
                                                (e = l.id),
                                                (fe.value = fe.value === e ? null : e),
                                                void (fe.value && (ce.value = le.value.find((l) => l.id === e) || null))
                                              )
                                              var e
                                            }
                                          },
                                          [
                                            f(
                                              'div',
                                              {
                                                class: [
                                                  'mobile-alerts-inbox__card-accent',
                                                  `mobile-alerts-inbox__card-accent--${l.level}`
                                                ]
                                              },
                                              null
                                            ),
                                            f('div', { class: 'mobile-alerts-inbox__card-header' }, [
                                              f('span', { class: 'mobile-alerts-inbox__card-service' }, [l.service]),
                                              f('div', { class: 'mobile-alerts-inbox__card-tags' }, [
                                                f(
                                                  a,
                                                  { size: 'small', type: Te(l.level) },
                                                  F((s = Le(l.level))) ? s : { default: () => [s] }
                                                ),
                                                f(
                                                  a,
                                                  { size: 'small', type: Re(l.status) },
                                                  F((i = Pe(l.status))) ? i : { default: () => [i] }
                                                )
                                              ])
                                            ]),
                                            f('div', { class: 'mobile-alerts-inbox__card-msg' }, [
                                              l.message || '无详情'
                                            ]),
                                            f('div', { class: 'mobile-alerts-inbox__card-meta' }, [
                                              f('span', { class: 'mobile-alerts-inbox__card-time' }, [Y(l.time)]),
                                              'active' === l.status &&
                                                f('div', { class: 'mobile-alerts-inbox__card-actions' }, [
                                                  f(
                                                    e,
                                                    {
                                                      size: 'small',
                                                      type: 'primary',
                                                      class: 'mobile-alerts-inbox__card-action-btn',
                                                      onClick: (e) => {
                                                        return (a = l), e.stopPropagation(), void De('acknowledge', a)
                                                        var a
                                                      }
                                                    },
                                                    { default: () => [g('确认')] }
                                                  ),
                                                  f(
                                                    e,
                                                    {
                                                      size: 'small',
                                                      type: 'default',
                                                      class: 'mobile-alerts-inbox__card-action-btn',
                                                      onClick: (e) => {
                                                        return (a = l), e.stopPropagation(), void De('resolve', a)
                                                        var a
                                                      }
                                                    },
                                                    { default: () => [g('解决')] }
                                                  )
                                                ])
                                            ]),
                                            o &&
                                              f('div', { class: 'mobile-alerts-inbox__detail-panel' }, [
                                                f('div', { class: 'mobile-alerts-inbox__detail-grid' }, [
                                                  f('div', { class: 'mobile-alerts-inbox__detail-item' }, [
                                                    f('span', { class: 'mobile-alerts-inbox__detail-label' }, [
                                                      g('状态')
                                                    ]),
                                                    f(
                                                      a,
                                                      { size: 'small', type: Re(l.status) },
                                                      F((t = Pe(l.status))) ? t : { default: () => [t] }
                                                    )
                                                  ]),
                                                  f('div', { class: 'mobile-alerts-inbox__detail-item' }, [
                                                    f('span', { class: 'mobile-alerts-inbox__detail-label' }, [
                                                      g('处理人')
                                                    ]),
                                                    f('span', { class: 'mobile-alerts-inbox__detail-value' }, [
                                                      l.assigneeName || '未指派'
                                                    ])
                                                  ]),
                                                  f('div', { class: 'mobile-alerts-inbox__detail-item' }, [
                                                    f('span', { class: 'mobile-alerts-inbox__detail-label' }, [
                                                      g('时间')
                                                    ]),
                                                    f('span', { class: 'mobile-alerts-inbox__detail-value' }, [
                                                      l.time
                                                        ? new Date(l.time).toLocaleString('zh-CN', { hour12: !1 })
                                                        : '-'
                                                    ])
                                                  ]),
                                                  l.duration &&
                                                    f('div', { class: 'mobile-alerts-inbox__detail-item' }, [
                                                      f('span', { class: 'mobile-alerts-inbox__detail-label' }, [
                                                        g('持续时间')
                                                      ]),
                                                      f('span', { class: 'mobile-alerts-inbox__detail-value' }, [
                                                        l.duration
                                                      ])
                                                    ]),
                                                  f(
                                                    'div',
                                                    {
                                                      class:
                                                        'mobile-alerts-inbox__detail-item mobile-alerts-inbox__detail-item--full'
                                                    },
                                                    [
                                                      f('span', { class: 'mobile-alerts-inbox__detail-label' }, [
                                                        g('告警内容')
                                                      ]),
                                                      f('span', { class: 'mobile-alerts-inbox__detail-value' }, [
                                                        l.message || '无'
                                                      ])
                                                    ]
                                                  )
                                                ]),
                                                f('div', { class: 'mobile-alerts-inbox__detail-actions' }, [
                                                  'active' === l.status &&
                                                    f(
                                                      e,
                                                      {
                                                        size: 'small',
                                                        type: 'primary',
                                                        icon: () => y(M, { size: 16 }),
                                                        onClick: (e) => {
                                                          e.stopPropagation(), De('acknowledge', l)
                                                        }
                                                      },
                                                      { default: () => [g('确认')] }
                                                    ),
                                                  'active' === l.status &&
                                                    f(
                                                      e,
                                                      {
                                                        size: 'small',
                                                        type: 'default',
                                                        icon: () => y(j, { size: 16 }),
                                                        onClick: (e) => {
                                                          e.stopPropagation(), De('resolve', l)
                                                        }
                                                      },
                                                      { default: () => [g('解决')] }
                                                    ),
                                                  'active' === l.status &&
                                                    f(
                                                      e,
                                                      {
                                                        size: 'small',
                                                        type: 'default',
                                                        icon: () => y(C, { size: 16 }),
                                                        onClick: (e) => {
                                                          e.stopPropagation(), De('suppress', l)
                                                        }
                                                      },
                                                      { default: () => [g('静默')] }
                                                    ),
                                                  f(
                                                    e,
                                                    {
                                                      size: 'small',
                                                      type: 'ghost',
                                                      icon: () => y(U, { size: 16 }),
                                                      onClick: (e) => {
                                                        var a
                                                        e.stopPropagation(),
                                                          (a = l),
                                                          (be.value = a),
                                                          (me.value.assigneeUserId = a.assigneeUserId || ''),
                                                          (de.value = !0)
                                                      }
                                                    },
                                                    { default: () => [g('指派')] }
                                                  ),
                                                  l.service &&
                                                    f(
                                                      e,
                                                      {
                                                        size: 'small',
                                                        type: 'ghost',
                                                        onClick: (e) => {
                                                          e.stopPropagation(), Ye(l, '/mobile/log-center')
                                                        }
                                                      },
                                                      { default: () => [g('查日志')] }
                                                    ),
                                                  l.service &&
                                                    f(
                                                      e,
                                                      {
                                                        size: 'small',
                                                        type: 'ghost',
                                                        onClick: (e) => {
                                                          e.stopPropagation(), Ye(l, '/mobile/trace-explorer')
                                                        }
                                                      },
                                                      { default: () => [g('查链路')] }
                                                    ),
                                                  l.serviceId &&
                                                    f(
                                                      e,
                                                      {
                                                        size: 'small',
                                                        type: 'ghost',
                                                        onClick: (e) => {
                                                          e.stopPropagation(),
                                                            Ye(l, `/mobile/service-detail-v2/${l.serviceId}`, !0)
                                                        }
                                                      },
                                                      { default: () => [g('服务详情')] }
                                                    )
                                                ])
                                              ])
                                          ]
                                        )
                                      ]
                                    }
                                  )
                                }))
                              )
                                ? o
                                : { default: () => [o] }
                            )
                          ]
                        }
                      ),
                      ze.value &&
                        f('div', { class: 'mobile-alerts-inbox__load-more' }, [
                          f(
                            e,
                            { type: 'primary', onClick: Se },
                            { default: () => [g('加载更多 ('), le.value.length - ye.value, g(' 条)')] }
                          )
                        ])
                    ]),
            f(
              r,
              { show: de.value, 'onUpdate:show': (e) => (de.value = e), position: 'bottom', title: '指派告警处理人' },
              {
                default: () => [
                  f('div', { class: 'mobile-alerts-inbox__assign-form' }, [
                    f('div', { class: 'mobile-alerts-inbox__assign-label' }, [g('处理人')]),
                    f(
                      n,
                      {
                        modelValue: me.value.assigneeUserId,
                        'onUpdate:modelValue': (e) => (me.value.assigneeUserId = e),
                        options: ve.value.filter((e) => '' !== e.value && '__unassigned__' !== e.value),
                        clearable: !0,
                        placeholder: '选择处理人'
                      },
                      null
                    )
                  ]),
                  f('div', { class: 'mobile-alerts-inbox__sheet-actions' }, [
                    f(e, { block: !0, onClick: () => (de.value = !1) }, { default: () => [g('取消')] }),
                    f(e, { block: !0, type: 'primary', onClick: Ee }, { default: () => [g('保存')] })
                  ])
                ]
              }
            ),
            f(
              r,
              { show: pe.value, 'onUpdate:show': (e) => (pe.value = e), position: 'bottom', title: Ae.value },
              {
                default: () => {
                  var l
                  return [
                    f('div', { class: 'mobile-alerts-inbox__confirm-content' }, [Be.value]),
                    f('div', { class: 'mobile-alerts-inbox__sheet-actions' }, [
                      f(e, { block: !0, onClick: () => (pe.value = !1) }, { default: () => [g('取消')] }),
                      f(
                        e,
                        {
                          block: !0,
                          type: 'suppress' === (null == (l = _e.value) ? void 0 : l.type) ? 'danger' : 'primary',
                          onClick: Oe
                        },
                        { default: () => [g('确认')] }
                      )
                    ])
                  ]
                }
              }
            )
          ])
        }
      )
    }
  })
export { W as default }
