import {
  p as e,
  a0 as a,
  a1 as i,
  aP as s,
  w as l,
  ac as n,
  b9 as t,
  b2 as c,
  bB as o,
  bC as r,
  by as d,
  bD as y,
  bE as p,
  bw as m
} from './invariable-DewVS0br.js'
import './request-BiInMBwl.js'
import { l as _ } from './logs-CT6hSV3d.js'
import './index-DFkcx8xz.js'
const v = [
    { key: '1h', label: '1h' },
    { key: '4h', label: '4h' },
    { key: '1d', label: '1d' },
    { key: '7d', label: '7d' }
  ],
  b = { '1h': 1, '4h': 4, '1d': 24, '7d': 168 },
  u = [
    { key: 'critical', label: 'Critical' },
    { key: 'error', label: 'Error' },
    { key: 'warning', label: 'Warning' },
    { key: 'info', label: 'Info' }
  ]
function x(e) {
  const a = (e.type || '').toLowerCase()
  return a.includes('fatal') || a.includes('critical') || a.includes('panic')
    ? 'critical'
    : a.includes('error') || a.includes('exception')
      ? 'error'
      : a.includes('warn')
        ? 'warning'
        : 'info'
}
const h = e({
  name: 'MobileExceptionAnalysis',
  setup() {
    const e = a(!1),
      h = a(!1),
      f = a([]),
      k = a(new Set()),
      g = a('1d'),
      w = a(new Set(['critical', 'error', 'warning', 'info'])),
      C = i(() => {
        const e = f.value.filter((e) => w.value.has(x(e))),
          a = [],
          i = new Set()
        for (const s of ['critical', 'error', 'warning', 'info']) {
          const l = e.filter((e) => x(e) === s)
          l.length > 0 && (a.push({ severity: s, items: l }), i.add(s))
        }
        return a
      }),
      Y = async () => {
        ;(e.value = !0), (h.value = !1)
        try {
          const e = d(),
            a = await _({
              startTime: e.subtract(b[g.value], 'hour').format('YYYY-MM-DD HH:mm:ss'),
              endTime: e.format('YYYY-MM-DD HH:mm:ss')
            }),
            i = (null == a ? void 0 : a.items) || []
          f.value = Array.isArray(i) ? i : []
        } catch {
          h.value = !0
        } finally {
          e.value = !1
        }
      }
    s(Y)
    const z = (e) => {
        const a = new Set(k.value)
        a.has(e) ? a.delete(e) : a.add(e), (k.value = a)
      },
      D = i(() => {
        const e = { critical: 0, error: 0, warning: 0, info: 0 }
        for (const a of f.value) e[x(a)]++
        return e
      })
    return () =>
      l('div', { class: 'mobile-exception-analysis' }, [
        l('div', { class: 'mobile-exception-analysis__header' }, [
          l('div', null, [l('h2', { class: 'mobile-exception-analysis__title' }, [n('异常分析')])]),
          l(
            t,
            {
              size: 'small',
              type: 'primary',
              plain: !0,
              class: 'mobile-exception-analysis__refresh-action',
              onClick: Y,
              'aria-label': '刷新异常数据'
            },
            { default: () => [l(c, { size: 18 }, null)] }
          )
        ]),
        l('div', { class: 'mobile-exception-analysis__time-filter' }, [
          v.map((e) =>
            l(
              'button',
              {
                key: e.key,
                class: [
                  'mobile-exception-analysis__time-chip',
                  { 'mobile-exception-analysis__time-chip--active': g.value === e.key }
                ],
                onClick: () => {
                  return (a = e.key), void (g.value !== a && ((g.value = a), Y()))
                  var a
                }
              },
              [e.label]
            )
          )
        ]),
        l('div', { class: 'mobile-exception-analysis__severity-filter' }, [
          u.map((e) =>
            l(
              'button',
              {
                key: e.key,
                class: [
                  'mobile-exception-analysis__severity-chip',
                  `mobile-exception-analysis__severity-chip--${e.key}`,
                  { 'mobile-exception-analysis__severity-chip--inactive': !w.value.has(e.key) }
                ],
                onClick: () =>
                  ((e) => {
                    const a = new Set(w.value)
                    a.has(e) ? a.delete(e) : a.add(e), (w.value = a)
                  })(e.key)
              },
              [
                l('span', { class: 'mobile-exception-analysis__severity-chip-label' }, [e.label]),
                l('span', { class: 'mobile-exception-analysis__severity-chip-badge' }, [D.value[e.key]])
              ]
            )
          )
        ]),
        e.value
          ? l('div', { class: 'mobile-exception-analysis__loading' }, [l(o, { size: '32px' }, null)])
          : h.value
            ? l('div', { class: 'mobile-exception-analysis__error-state' }, [
                l('h3', null, [n('数据加载失败')]),
                l('p', null, [n('请检查网络连接后重试')]),
                l(t, { type: 'primary', size: 'small', onClick: Y }, { default: () => [n('重新加载')] })
              ])
            : 0 === f.value.length
              ? l('div', { class: 'mobile-exception-analysis__empty-state' }, [
                  l(r, { description: '暂无异常数据' }, null)
                ])
              : 0 === C.value.length
                ? l('div', { class: 'mobile-exception-analysis__empty-state' }, [
                    l(r, { description: '无匹配的异常数据' }, null)
                  ])
                : l('div', { class: 'mobile-exception-analysis__list' }, [
                    C.value.map((e) =>
                      l('div', { key: e.severity, class: 'mobile-exception-analysis__severity-group' }, [
                        l(
                          'div',
                          {
                            class: [
                              'mobile-exception-analysis__severity-header',
                              `mobile-exception-analysis__severity-header--${e.severity}`
                            ]
                          },
                          [
                            l('span', { class: 'mobile-exception-analysis__severity-header-label' }, [
                              'critical' === e.severity
                                ? '严重'
                                : 'error' === e.severity
                                  ? '错误'
                                  : 'warning' === e.severity
                                    ? '警告'
                                    : '信息'
                            ]),
                            l('span', { class: 'mobile-exception-analysis__severity-header-badge' }, [e.items.length])
                          ]
                        ),
                        e.items.map((e) => {
                          return l(
                            'div',
                            {
                              key: (a = e).id,
                              class: 'mobile-exception-analysis__card-wrapper',
                              role: 'button',
                              tabindex: '0',
                              'aria-expanded': k.value.has(a.id),
                              'aria-label': `查看异常详情：${a.message || '未知异常'}`,
                              onClick: () => z(a.id),
                              onKeydown: (e) => {
                                ;('Enter' !== e.key && ' ' !== e.key) || (e.preventDefault(), z(a.id))
                              }
                            },
                            [
                              l('section', { class: 'mobile-exception-analysis__list-card' }, [
                                l('div', { class: 'mobile-exception-analysis__card-header' }, [
                                  l('div', { class: 'mobile-exception-analysis__card-main' }, [
                                    l('div', { class: 'mobile-exception-analysis__card-message' }, [
                                      (a.message || '未知异常').length > 80
                                        ? (a.message || '').slice(0, 80) + '...'
                                        : a.message || '未知异常'
                                    ]),
                                    l('div', { class: 'mobile-exception-analysis__card-meta' }, [
                                      l(
                                        y,
                                        { size: 'medium', type: 'danger' },
                                        { default: () => [a.type || 'Unknown'] }
                                      ),
                                      l('span', { class: 'mobile-exception-analysis__card-count' }, [
                                        n('次数: '),
                                        a.count ?? 0
                                      ]),
                                      l('span', { class: 'mobile-exception-analysis__card-time' }, [
                                        a.lastOccurrence || '-'
                                      ])
                                    ])
                                  ]),
                                  l('div', { class: 'mobile-exception-analysis__card-expand' }, [
                                    k.value.has(a.id) ? l(p, { size: 18 }, null) : l(m, { size: 18 }, null)
                                  ])
                                ]),
                                k.value.has(a.id) &&
                                  l('div', { class: 'mobile-exception-analysis__card-detail' }, [
                                    l('div', { class: 'mobile-exception-analysis__detail-section' }, [
                                      l('div', { class: 'mobile-exception-analysis__detail-title' }, [n('完整消息')]),
                                      l('div', { class: 'mobile-exception-analysis__detail-content' }, [
                                        a.message || '-'
                                      ])
                                    ]),
                                    a.stackTrace &&
                                      l('div', { class: 'mobile-exception-analysis__detail-section' }, [
                                        l('div', { class: 'mobile-exception-analysis__detail-title' }, [n('堆栈跟踪')]),
                                        l('pre', { class: 'mobile-exception-analysis__detail-stack' }, [a.stackTrace])
                                      ]),
                                    l('div', { class: 'mobile-exception-analysis__detail-section' }, [
                                      l('div', { class: 'mobile-exception-analysis__detail-title' }, [n('其他信息')]),
                                      l('div', { class: 'mobile-exception-analysis__detail-meta' }, [
                                        l('span', null, [n('服务: '), a.service || '-']),
                                        l('span', null, [n('首次出现: '), a.firstOccurrence || '-']),
                                        void 0 !== a.affectedUsers &&
                                          l('span', null, [n('受影响用户: '), a.affectedUsers])
                                      ])
                                    ])
                                  ])
                              ])
                            ]
                          )
                          var a
                        })
                      ])
                    )
                  ])
      ])
  }
})
export { h as default }
