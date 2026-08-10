import { p as e, a0 as l, aP as i, a2 as a, w as s, ac as t, aS as n, $ as r, ba as v } from './invariable-DewVS0br.js'
import { M as o } from './MobileButton-BKhxhz5A.js'
import { M as u } from './MobileCard-BxmuYclQ.js'
import { M as c } from './MobileTag-ByR2jSPf.js'
import { M as d } from './MobileEmpty-BimvXy70.js'
import { M as m } from './MobileLoading-DlB38x7T.js'
import './MobileToast-CIN42EDh.js'
import { i as b } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { p as _, i as p } from './investigationContext-7xMjfbkf.js'
import './index-DFkcx8xz.js'
const h = e({
  name: 'MobileServiceDetailV2',
  setup() {
    const e = v(),
      h = r(),
      f = l(!1),
      y = l(!1),
      g = l(null),
      k = l({
        cpu: null,
        memory: null,
        qps: null,
        responseTime: null,
        errorRate: null,
        activeConnections: null,
        instances: null
      })
    let w = 0
    const C = async () => {
        const l = ++w,
          i = String(e.params.serviceId || '')
        ;(f.value = !0), (y.value = !1)
        try {
          const a = _(e.query),
            s = await b(i, a.range ? { timeRange: `-${a.range}` } : void 0)
          if (l !== w) return
          const t = null == s ? void 0 : s.identity,
            n = null == s ? void 0 : s.summary
          ;(g.value = t
            ? {
                id: t.id,
                name: t.name,
                owner: t.owner,
                region: t.region,
                version: (null == n ? void 0 : n.version) ?? t.runtime,
                tags: t.tags || [],
                health: t.healthStatus,
                status: 'healthy' === t.healthStatus ? 'running' : 'unknown' === t.healthStatus ? 'unknown' : 'error',
                instances: (null == n ? void 0 : n.instances) ?? null,
                qps: (null == n ? void 0 : n.qps) ?? null,
                latency: (null == n ? void 0 : n.responseTime) ?? null,
                errorRate: (null == n ? void 0 : n.errorRate) ?? null,
                lastUpdate: new Date().toISOString()
              }
            : null),
            (k.value = {
              cpu: (null == n ? void 0 : n.cpu) ?? null,
              memory: (null == n ? void 0 : n.memory) ?? null,
              qps: (null == n ? void 0 : n.qps) ?? null,
              responseTime: (null == n ? void 0 : n.responseTime) ?? null,
              errorRate: (null == n ? void 0 : n.errorRate) ?? null,
              activeConnections: (null == n ? void 0 : n.activeConnections) ?? null,
              instances: (null == n ? void 0 : n.instances) ?? null
            })
        } catch (a) {
          if (l !== w) return
          ;(g.value = null), (y.value = !0)
        } finally {
          l === w && (f.value = !1)
        }
      },
      M = (e, l = '') => ('number' == typeof e ? `${e}${l}` : '未知')
    i(C),
      a(
        () => e.params.serviceId,
        () => {
          C()
        }
      ),
      a(
        () => e.query,
        () => {
          C()
        }
      )
    const j = (l, i = {}) => {
      const a = _(e.query),
        s = String(e.params.serviceId || '')
      h.push({ path: l, query: p({ ...a, serviceId: s, ...i }) })
    }
    return () =>
      s('div', { class: 'mobile-service-detail-v2' }, [
        s('div', { class: 'mobile-service-detail-v2__header' }, [
          s('div', null, [
            s('h2', { class: 'mobile-service-detail-v2__title' }, [t('服务详情')]),
            s('div', { class: 'mobile-service-detail-v2__subtitle' }, [t('移动端 service-first 摘要详情')])
          ]),
          s(
            o,
            { size: 'small', type: 'ghost', class: 'mobile-service-detail-v2__refresh', onClick: C },
            { default: () => [t('刷新')] }
          )
        ]),
        f.value
          ? s('div', { class: 'mobile-service-detail-v2__loading' }, [s(m, { size: '32px' }, null)])
          : y.value
            ? s('div', { class: 'mobile-service-detail-v2__state' }, [
                s(
                  d,
                  { description: '服务详情加载失败，请检查网络后重试' },
                  {
                    default: () => [
                      s(o, { size: 'small', type: 'primary', onClick: C }, { default: () => [t('重试')] })
                    ]
                  }
                )
              ])
            : g.value
              ? s(n, null, [
                  s(
                    u,
                    { size: 'small', bordered: !1, class: 'mobile-service-detail-v2__identity' },
                    {
                      default: () => [
                        s('div', { class: 'mobile-service-detail-v2__identity-content' }, [
                          s('div', { class: 'mobile-service-detail-v2__identity-main' }, [
                            s('div', { class: 'mobile-service-detail-v2__identity-title' }, [g.value.name]),
                            s('div', { class: 'mobile-service-detail-v2__identity-meta' }, [
                              t('Owner: '),
                              g.value.owner || '-',
                              t(' · 区域: '),
                              g.value.region || '-'
                            ]),
                            s('div', { class: 'mobile-service-detail-v2__identity-submeta' }, [
                              t('版本: '),
                              g.value.version || '-',
                              t(' · 实例数: '),
                              M(k.value.instances)
                            ])
                          ]),
                          s(
                            c,
                            {
                              size: 'small',
                              type:
                                'healthy' === g.value.health
                                  ? 'success'
                                  : 'warning' === g.value.health
                                    ? 'warning'
                                    : 'unknown' === g.value.health
                                      ? 'default'
                                      : 'danger'
                            },
                            {
                              default: () => [
                                'healthy' === g.value.health
                                  ? '健康'
                                  : 'warning' === g.value.health
                                    ? '关注'
                                    : 'unknown' === g.value.health
                                      ? '未知'
                                      : '异常'
                              ]
                            }
                          )
                        ])
                      ]
                    }
                  ),
                  s('div', { class: 'mobile-service-detail-v2__stats-grid' }, [
                    [
                      { label: 'QPS', value: M(k.value.qps) },
                      { label: '响应时间', value: M(k.value.responseTime, 'ms') },
                      { label: '错误率', value: M(k.value.errorRate, '%') },
                      { label: '活跃连接', value: M(k.value.activeConnections) }
                    ].map((e) =>
                      s(
                        u,
                        { key: e.label, size: 'small', bordered: !1, class: 'mobile-service-detail-v2__stat-card' },
                        {
                          default: () => [
                            s('div', { class: 'mobile-service-detail-v2__stat-label' }, [e.label]),
                            s('div', { class: 'mobile-service-detail-v2__stat-value' }, [e.value])
                          ]
                        }
                      )
                    )
                  ]),
                  s(
                    u,
                    { size: 'small', bordered: !1, class: 'mobile-service-detail-v2__runtime-card' },
                    {
                      default: () => [
                        s('h3', { class: 'mobile-service-detail-v2__runtime-title' }, [t('运行摘要')]),
                        s('div', { class: 'mobile-service-detail-v2__runtime-grid' }, [
                          s('div', { class: 'mobile-service-detail-v2__runtime-block' }, [
                            s('div', { class: 'mobile-service-detail-v2__runtime-label' }, [t('CPU')]),
                            s('div', { class: 'mobile-service-detail-v2__runtime-value' }, [M(k.value.cpu, '%')])
                          ]),
                          s('div', { class: 'mobile-service-detail-v2__runtime-block' }, [
                            s('div', { class: 'mobile-service-detail-v2__runtime-label' }, [t('内存')]),
                            s('div', { class: 'mobile-service-detail-v2__runtime-value' }, [M(k.value.memory, '%')])
                          ])
                        ])
                      ]
                    }
                  ),
                  s('div', { class: 'mobile-service-detail-v2__footer' }, [
                    s(
                      o,
                      { size: 'small', onClick: () => j('/mobile/metrics-explorer') },
                      { default: () => [t('查看指标')] }
                    ),
                    s(
                      o,
                      { size: 'small', onClick: () => j('/mobile/instance-monitor') },
                      { default: () => [t('查看实例')] }
                    ),
                    g.value.name &&
                      s(n, null, [
                        s(
                          o,
                          {
                            size: 'small',
                            onClick: () => {
                              var e
                              return j('/mobile/log-center', { serviceName: null == (e = g.value) ? void 0 : e.name })
                            }
                          },
                          { default: () => [t('查看日志')] }
                        ),
                        s(
                          o,
                          {
                            size: 'small',
                            onClick: () => {
                              var e
                              return j('/mobile/trace-explorer', {
                                serviceName: null == (e = g.value) ? void 0 : e.name
                              })
                            }
                          },
                          { default: () => [t('查看链路')] }
                        )
                      ])
                  ])
                ])
              : s('div', { class: 'mobile-service-detail-v2__state' }, [s(d, { description: '未找到对应服务' }, null)]),
        s('div', { class: 'mobile-service-detail-v2__footer' }, [
          s(o, { block: !0, onClick: () => h.push('/mobile/services-v2') }, { default: () => [t('返回服务目录')] })
        ])
      ])
  }
})
export { h as default }
