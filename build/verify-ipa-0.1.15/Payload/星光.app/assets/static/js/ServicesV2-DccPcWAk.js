import { M as e } from './MobileButton-BKhxhz5A.js'
import { M as l } from './MobileCard-BxmuYclQ.js'
import { M as a } from './MobileTag-ByR2jSPf.js'
import { M as s } from './MobileEmpty-BimvXy70.js'
import { M as i } from './MobileLoading-DlB38x7T.js'
import './MobileToast-CIN42EDh.js'
import { p as t, a0 as o, a1 as r, aP as n, w as v, ac as u, aS as c, $ as d, ba as m } from './invariable-DewVS0br.js'
import { f as p } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import './index-DFkcx8xz.js'
const y = t({
  name: 'MobileServicesV2',
  setup() {
    const t = d(),
      y = m(),
      b = o(!1),
      h = o(!1),
      _ = o(!1),
      f = o(!1),
      g = o([]),
      w = o(1),
      k = o(0),
      M = r(() => g.value.length < k.value),
      S = (e) =>
        e.map((e) => {
          var l, a, s, i, t, o, r, n, v
          return {
            id: null == (l = e.identity) ? void 0 : l.id,
            name: null == (a = e.identity) ? void 0 : a.name,
            owner: null == (s = e.identity) ? void 0 : s.owner,
            region: null == (i = e.identity) ? void 0 : i.region,
            version: null == (t = e.identity) ? void 0 : t.runtime,
            tags: (null == (o = e.identity) ? void 0 : o.tags) || [],
            health: null == (r = e.identity) ? void 0 : r.healthStatus,
            status:
              'healthy' === (null == (n = e.identity) ? void 0 : n.healthStatus)
                ? 'running'
                : 'unknown' === (null == (v = e.identity) ? void 0 : v.healthStatus)
                  ? 'unknown'
                  : 'error',
            qps: e.qps,
            latency: e.p95Latency,
            errorRate: e.errorRate,
            instances: e.instanceCount,
            lastDeploy: e.lastDeployAt,
            lastUpdate: e.lastUpdate || e.lastDeployAt || new Date().toISOString()
          }
        }),
      j = async () => {
        if (!h.value && M.value) {
          ;(h.value = !0), (_.value = !1)
          try {
            const e = w.value + 1,
              l = await p({ page: e, pageSize: 50, scope: 'system', keyword: y.query.keyword }),
              a = new Set(g.value.map((e) => e.id)),
              s = S((null == l ? void 0 : l.items) || []).filter((e) => !a.has(e.id))
            ;(g.value = [...g.value, ...s]),
              (w.value = e),
              (k.value = 'number' == typeof (null == l ? void 0 : l.total) ? l.total : g.value.length)
          } catch (e) {
            _.value = !0
          } finally {
            h.value = !1
          }
        }
      },
      $ = () =>
        (async (e) => {
          ;(b.value = !0), (f.value = !1), (_.value = !1)
          try {
            const l = { page: 1, pageSize: 50, scope: 'system' }
            e && (l.keyword = e)
            const a = await p(l),
              s = (null == a ? void 0 : a.items) || []
            ;(g.value = S(s)),
              (w.value = 1),
              (k.value = 'number' == typeof (null == a ? void 0 : a.total) ? a.total : s.length)
          } catch (l) {
            ;(g.value = []), (f.value = !0)
          } finally {
            b.value = !1
          }
        })(y.query.keyword)
    return (
      n($),
      () =>
        v('div', { class: 'mobile-services-v2' }, [
          v('div', { class: 'mobile-services-v2__header' }, [
            v('div', null, [
              v('h2', { class: 'mobile-services-v2__title' }, [u('服务目录')]),
              v('div', { class: 'mobile-services-v2__subtitle' }, [u('移动端摘要列表')])
            ]),
            v(
              e,
              { size: 'small', type: 'ghost', class: 'mobile-services-v2__refresh', onClick: $ },
              { default: () => [u('刷新')] }
            )
          ]),
          b.value
            ? v('div', { class: 'mobile-services-v2__loading' }, [v(i, { size: '32px' }, null)])
            : f.value
              ? v('div', { class: 'mobile-services-v2__state' }, [
                  v(
                    s,
                    { description: '服务目录加载失败，请检查网络后重试' },
                    {
                      default: () => [
                        v(e, { size: 'small', type: 'primary', onClick: $ }, { default: () => [u('重试')] })
                      ]
                    }
                  )
                ])
              : g.value.length
                ? v(c, null, [
                    v('div', { class: 'mobile-services-v2__list' }, [
                      g.value.map((s) =>
                        v(
                          l,
                          { key: s.id, size: 'small', bordered: !1, class: 'mobile-services-v2__card' },
                          {
                            default: () => [
                              v('div', { class: 'mobile-services-v2__card-content' }, [
                                v('div', { class: 'mobile-services-v2__card-main' }, [
                                  v('div', { class: 'mobile-services-v2__card-title' }, [s.name]),
                                  v(
                                    'div',
                                    {
                                      class: 'mobile-services-v2__card-meta',
                                      title: `Owner: ${s.owner || '-'} · 区域: ${s.region || '-'}`
                                    },
                                    [u('Owner: '), s.owner || '-', u(' · 区域: '), s.region || '-']
                                  ),
                                  v(
                                    'div',
                                    {
                                      class: 'mobile-services-v2__card-stats',
                                      title: `QPS ${s.qps ?? '未知'} · 延迟 ${s.latency ?? '未知'}${'number' == typeof s.latency ? 'ms' : ''} · 错误率 ${s.errorRate ?? '未知'}${'number' == typeof s.errorRate ? '%' : ''}`
                                    },
                                    [
                                      u('QPS '),
                                      s.qps ?? '未知',
                                      (s.qps, ''),
                                      u(' · 延迟 '),
                                      s.latency ?? '未知',
                                      'number' == typeof s.latency ? 'ms' : '',
                                      u(' · 错误率 '),
                                      s.errorRate ?? '未知',
                                      'number' == typeof s.errorRate ? '%' : ''
                                    ]
                                  )
                                ]),
                                v('div', { class: 'mobile-services-v2__card-actions' }, [
                                  v(
                                    a,
                                    {
                                      size: 'small',
                                      type:
                                        'healthy' === s.health
                                          ? 'success'
                                          : 'warning' === s.health
                                            ? 'warning'
                                            : 'unknown' === s.health
                                              ? 'default'
                                              : 'danger'
                                    },
                                    {
                                      default: () => [
                                        'healthy' === s.health
                                          ? '健康'
                                          : 'warning' === s.health
                                            ? '关注'
                                            : 'unknown' === s.health
                                              ? '未知'
                                              : '异常'
                                      ]
                                    }
                                  ),
                                  v(
                                    e,
                                    {
                                      size: 'small',
                                      type: 'ghost',
                                      class: 'mobile-services-v2__detail-button',
                                      onClick: () => t.push(`/mobile/service-detail-v2/${s.id}`)
                                    },
                                    { default: () => [u('详情')] }
                                  )
                                ])
                              ])
                            ]
                          }
                        )
                      )
                    ]),
                    M.value &&
                      v('div', { class: 'mobile-services-v2__load-more' }, [
                        v(
                          e,
                          { type: 'primary', loading: h.value, onClick: j },
                          { default: () => [u('加载更多服务 ('), g.value.length, u('/'), k.value, u(')')] }
                        ),
                        _.value &&
                          v('p', { class: 'mobile-services-v2__load-more-error' }, [u('加载更多服务失败，请重试。')])
                      ])
                  ])
                : v('div', { class: 'mobile-services-v2__state' }, [v(s, { description: '暂无服务数据' }, null)]),
          v('div', { class: 'mobile-services-v2__footer' }, [
            v(e, { block: !0, onClick: () => t.push('/mobile/overview-v2') }, { default: () => [u('返回概览')] })
          ])
        ])
    )
  }
})
export { y as default }
