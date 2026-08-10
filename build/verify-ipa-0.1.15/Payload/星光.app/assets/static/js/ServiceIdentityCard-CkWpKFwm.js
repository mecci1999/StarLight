import { B as e } from './BaseChart-FGf3lmW3.js'
import { p as t, a0 as a, a2 as i, a1 as r, w as n, ci as o, ac as d, cO as l, ai as s } from './invariable-DewVS0br.js'
import { S as c } from './ServiceHealthBadge-b4ePBNa-.js'
const u = t({
    name: 'ServiceTopology',
    props: {
      data: { type: Object, default: () => ({ nodes: [], edges: [] }) },
      height: { type: String, default: '600px' },
      loading: { type: Boolean, default: !1 },
      onNodeClick: { type: Function, default: void 0 },
      onNodeDblclick: { type: Function, default: void 0 },
      selectedNodeId: { type: String, default: '' },
      showLayerRegions: { type: Boolean, default: !0 },
      layerDefinitions: { type: Array, default: () => [] },
      refreshKey: { type: Number, default: 0 }
    },
    setup(t) {
      const o = a(!1)
      i(
        () => t.refreshKey,
        () => {
          o.value = !1
        }
      )
      const d = (e) => {
          const t =
            `${e.layerName || ''} ${e.type || ''} ${e.protocol || ''} ${e.id || ''} ${e.name || ''}`.toLowerCase()
          return t.includes('gateway') || t.includes('edge')
            ? 'gateway'
            : t.includes('infra') ||
                t.includes('database') ||
                t.includes('middleware') ||
                t.includes('storage') ||
                ['redis', 'mysql', 'kafka', 'influxdb', 'elasticsearch'].some((e) => t.includes(e))
              ? 'infrastructure'
              : 'service'
        },
        l = (e) =>
          'critical' === e.status || Number(e.errorRate || 0) > 0
            ? '#f53f3f'
            : e.inferred
              ? '#94a3b8'
              : 'manual-topology' === e.source
                ? '#ff7d00'
                : '#165dff',
        s = (e) =>
          String(e ?? '-')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;'),
        c = r(() => {
          const e = t.layerDefinitions.length
              ? t.layerDefinitions
              : [
                  { key: 'gateway', title: '接入层' },
                  { key: 'service', title: '服务应用层' },
                  { key: 'infrastructure', title: '基础设施层' }
                ],
            a = new Map(e.map((e, t) => [e.key, t])),
            i = new Map()
          t.data.nodes.forEach((e) => {
            const t = d(e),
              a = i.get(t) || []
            a.push(e), i.set(t, a)
          })
          const r = Math.max(1, ...Array.from(i.values()).map((e) => e.length)),
            n = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(1.4 * r)))),
            c = Math.max(1, Math.ceil(r / n)),
            u = Math.max(1180, 230 * n + 160),
            v = Math.max(620, e.length * Math.max(180, 116 * c + 92)) / Math.max(e.length, 1),
            p = t.showLayerRegions
              ? e.map((t, a) => {
                  return {
                    type: 'group',
                    silent: !0,
                    left: 0,
                    top: (a / e.length) * 100 + '%',
                    children: [
                      {
                        type: 'rect',
                        shape: { x: 0, y: 0, width: u, height: v - 10 },
                        style: {
                          fill:
                            ((i = t.key),
                            'gateway' === i
                              ? 'rgba(22, 93, 255, 0.08)'
                              : 'service' === i
                                ? 'rgba(0, 180, 42, 0.07)'
                                : 'infrastructure' === i
                                  ? 'rgba(255, 125, 0, 0.08)'
                                  : 'rgba(134, 144, 156, 0.08)'),
                          stroke: 'rgba(148, 163, 184, 0.18)',
                          lineWidth: 1
                        }
                      },
                      {
                        type: 'text',
                        style: {
                          x: 18,
                          y: 18,
                          text: `${t.title}${t.subtitle ? ` · ${t.subtitle}` : ''}`,
                          fill: 'rgba(71, 85, 105, 0.72)',
                          font: '600 13px sans-serif'
                        }
                      }
                    ]
                  }
                  var i
                })
              : [],
            m = t.data.nodes.map((r) => {
              const o = d(r),
                l = a.get(o) ?? Math.max(e.length - 1, 0),
                s = i.get(o) || [],
                c = Math.max(
                  s.findIndex((e) => e.id === r.id),
                  0
                ),
                p = Math.floor(c / n),
                m = c % n,
                y = Math.max(1, Math.ceil(s.length / n)),
                f = Math.min(n, s.length - p * n),
                g = (u / (f + 1)) * (m + 1),
                h = Math.min(112, Math.max(76, (v - 88) / Math.max(y, 1))),
                b = v * l + 72 + p * h
              return {
                id: r.id,
                name: r.name,
                symbol:
                  ((x = r.type),
                  'database' === x
                    ? 'rect'
                    : 'middleware' === x
                      ? 'diamond'
                      : 'gateway' === x
                        ? 'roundRect'
                        : 'infrastructure' === x
                          ? 'diamond'
                          : 'circle'),
                symbolSize: t.selectedNodeId === r.id ? 68 : 54,
                x: g,
                y: b,
                fixed: Boolean(r.editable),
                value: r.status,
                itemStyle: {
                  color:
                    ((w = r.status),
                    'running' === w || 'healthy' === w
                      ? '#00b42a'
                      : 'error' === w || 'critical' === w
                        ? '#f53f3f'
                        : 'warning' === w
                          ? '#ff7d00'
                          : '#86909c'),
                  borderColor: t.selectedNodeId === r.id ? '#165dff' : 'rgba(255, 255, 255, 0.9)',
                  borderWidth: t.selectedNodeId === r.id ? 4 : 2,
                  shadowBlur: t.selectedNodeId === r.id ? 18 : 8,
                  shadowColor: t.selectedNodeId === r.id ? 'rgba(22, 93, 255, 0.28)' : 'rgba(15, 23, 42, 0.12)'
                },
                label: {
                  show: !0,
                  position: 'bottom',
                  formatter: '{b}',
                  color: 'var(--color-text-1)',
                  fontSize: 12,
                  width: 128,
                  overflow: 'truncate',
                  fontWeight: t.selectedNodeId === r.id ? 700 : 500
                },
                useDirtyRect: !0,
                tooltip: { show: !0 }
              }
              var w, x
            }),
            y = new Set(m.map((e) => String(e.id))),
            f = t.data.edges
              .filter((e) => y.has(String(e.from ?? e.source)) && y.has(String(e.to ?? e.target)))
              .map((e) => ({
                source: String(e.from ?? e.source),
                target: String(e.to ?? e.target),
                label: {
                  show: !0,
                  formatter: () =>
                    ((e) => {
                      const t = []
                      return (
                        'number' == typeof e.qps && e.qps > 0 && t.push(`${e.qps} qps`),
                        'number' == typeof e.errorRate && e.errorRate > 0 && t.push(`${e.errorRate}% err`),
                        'number' == typeof e.p99 && e.p99 > 0 && t.push(`p99 ${e.p99}ms`),
                        t.length > 0 ? t.slice(0, 2).join(' · ') : e.inferred ? '推断关系' : e.protocol || ''
                      )
                    })(e),
                  color: 'var(--color-text-3)',
                  fontSize: 11,
                  backgroundColor: 'rgba(255, 255, 255, 0.82)',
                  borderRadius: 4,
                  padding: [2, 5]
                },
                lineStyle: {
                  color: l(e),
                  curveness: e.inferred ? 0.1 : 0.22,
                  type: e.inferred ? 'dashed' : 'solid',
                  width: 'critical' === e.status || Number(e.errorRate || 0) > 0 ? 3 : e.inferred ? 1.6 : 2.2,
                  opacity: e.inferred ? 0.58 : 0.86
                }
              }))
          return {
            graphic: p,
            tooltip: {
              trigger: 'item',
              confine: !0,
              borderWidth: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              textStyle: { color: '#fff' },
              formatter: (e) => {
                if ('node' === e.dataType) {
                  const i = t.data.nodes.find((t) => t.id === e.data.id)
                  return `\n                <div style="padding: 6px 8px; min-width: 180px;">\n                  <div style="font-weight: 700; margin-bottom: 8px;">${s(e.name)}</div>\n                <div>Status: <span style="color: ${s(e.color)}">${s((null == i ? void 0 : i.status) || 'unknown')}</span></div>\n                <div>Type: ${s((null == i ? void 0 : i.type) || 'service')}</div>\n                <div>Env: ${s(null == i ? void 0 : i.env)}</div>\n                <div>Cluster: ${s(null == i ? void 0 : i.cluster)}</div>\n                  <div>Instances: ${'number' == typeof (null == i ? void 0 : i.instances) ? i.instances : '-'}</div>\n                  <div>QPS: ${'number' == typeof (null == i ? void 0 : i.qps) ? i.qps : '-'}</div>\n                  <div>Latency: ${'number' == typeof (null == i ? void 0 : i.latency) ? `${i.latency}ms` : '-'}</div>\n                  <div>Error Rate: ${((a = null == i ? void 0 : i.errorRate), 'number' != typeof a ? '-' : `${a >= 0 && a <= 1 ? (100 * a).toFixed(2) : a.toFixed(2)}%`)}</div>\n                  <div style="margin-top: 8px; opacity: .76;">单击查看详情，双击进入服务页</div>\n                </div>\n              `
                }
                var a
                const i = t.data.edges.find(
                  (t) => String(t.from) === String(e.data.source) && String(t.to) === String(e.data.target)
                )
                return `\n              <div style="padding: 6px 8px; min-width: 180px;">\n                <div style="font-weight: 700; margin-bottom: 8px;">${s(e.data.source)} → ${s(e.data.target)}</div>\n                <div>Protocol: ${s(null == i ? void 0 : i.protocol)}</div>\n                <div>Source: telemetry</div>\n                <div>QPS: ${'number' == typeof (null == i ? void 0 : i.qps) ? i.qps : '-'}</div>\n                <div>Error Rate: ${'number' == typeof (null == i ? void 0 : i.errorRate) ? `${i.errorRate}%` : '-'}</div>\n                <div>P99: ${'number' == typeof (null == i ? void 0 : i.p99) ? `${i.p99}ms` : '-'}</div>\n              </div>\n            `
              }
            },
            series: [
              {
                type: 'graph',
                layout: t.showLayerRegions || o.value ? 'none' : 'force',
                animation: !1,
                coordinateSystem: void 0,
                data: m,
                links: f,
                roam: !0,
                scaleLimit: { min: 0.2, max: 4 },
                nodeScaleRatio: 0.4,
                draggable: !0,
                edgeSymbol: ['none', 'arrow'],
                edgeSymbolSize: [0, 12],
                label: { position: 'bottom', formatter: '{b}' },
                lineStyle: { color: '#165dff', curveness: 0.22, opacity: 0.86 },
                emphasis: { focus: 'adjacency', lineStyle: { width: 4 } },
                force:
                  t.showLayerRegions || o.value
                    ? void 0
                    : { repulsion: 1200, gravity: 0.08, friction: 0.65, edgeLength: [130, 220], layoutAnimation: !1 }
              }
            ]
          }
        }),
        u = (e) => {
          var a
          if ('node' !== (null == e ? void 0 : e.dataType)) return
          o.value = !0
          const i = t.data.nodes.find((t) => {
            var a
            return t.id === (null == (a = e.data) ? void 0 : a.id)
          })
          i && (null == (a = t.onNodeClick) || a.call(t, i))
        },
        v = (e) => {
          var a
          if ('node' !== (null == e ? void 0 : e.dataType)) return
          o.value = !0
          const i = t.data.nodes.find((t) => {
            var a
            return t.id === (null == (a = e.data) ? void 0 : a.id)
          })
          i && (null == (a = t.onNodeDblclick) || a.call(t, i))
        }
      return () =>
        n(e, { option: c.value, height: t.height, loading: t.loading, onChartClick: u, onChartDblclick: v }, null)
    }
  }),
  v = t({
    name: 'ServiceIdentityCard',
    props: { service: { type: Object, required: !0 }, compact: { type: Boolean, default: !1 } },
    emits: ['ownerClick', 'teamClick', 'tagClick'],
    setup:
      (e, { emit: t, slots: a }) =>
      () => {
        var i, r
        return n(
          'div',
          {
            class: [
              'service-identity-card',
              e.compact ? 'service-identity-card--compact' : 'service-identity-card--default'
            ]
          },
          [
            n('div', { class: 'service-identity-card__content' }, [
              n('div', { class: 'service-identity-card__main' }, [
                n('div', { class: 'service-identity-card__heading' }, [
                  n('h3', { class: 'service-identity-card__title' }, [e.service.displayName || e.service.name]),
                  n(c, { status: e.service.healthStatus || 'unknown', size: 'sm' }, null)
                ]),
                n('div', { class: 'service-identity-card__name' }, [e.service.name]),
                n('div', { class: 'service-identity-card__tags' }, [
                  e.service.owner &&
                    n(
                      'span',
                      { class: 'service-identity-card__tag-action', onClick: () => t('ownerClick', e.service.owner) },
                      [n(o, { size: 'small', bordered: !1 }, { default: () => [d('Owner: '), e.service.owner] })]
                    ),
                  e.service.team &&
                    n(
                      'span',
                      { class: 'service-identity-card__tag-action', onClick: () => t('teamClick', e.service.team) },
                      [n(o, { size: 'small', bordered: !1 }, { default: () => [d('Team: '), e.service.team] })]
                    ),
                  e.service.env &&
                    n(o, { size: 'small', bordered: !1 }, { default: () => [d('Env: '), e.service.env] }),
                  e.service.region &&
                    n(o, { size: 'small', bordered: !1 }, { default: () => [d('Region: '), e.service.region] }),
                  e.service.appKey &&
                    n(o, { size: 'small', bordered: !1 }, { default: () => [d('AppKey: '), e.service.appKey] }),
                  e.service.runtime &&
                    n(o, { size: 'small', bordered: !1 }, { default: () => [d('Runtime: '), e.service.runtime] }),
                  null == (i = e.service.tags)
                    ? void 0
                    : i.map((e) => {
                        return n(
                          'span',
                          { class: 'service-identity-card__tag-action', key: e, onClick: () => t('tagClick', e) },
                          [
                            n(
                              o,
                              { size: 'small', bordered: !1 },
                              ((a = e),
                              'function' == typeof a ||
                              ('[object Object]' === Object.prototype.toString.call(a) && !s(a))
                                ? e
                                : { default: () => [e] })
                            )
                          ]
                        )
                        var a
                      })
                ])
              ]),
              n(
                l,
                { vertical: !0, size: 'small', align: 'end', class: 'service-identity-card__links' },
                {
                  default: () => {
                    var t
                    return [
                      e.service.repoUrl &&
                        n('a', { class: 'service-identity-card__link', href: e.service.repoUrl, target: '_blank' }, [
                          d('仓库')
                        ]),
                      e.service.runbookUrl &&
                        n('a', { class: 'service-identity-card__link', href: e.service.runbookUrl, target: '_blank' }, [
                          d('Runbook')
                        ]),
                      null == (t = a.actions) ? void 0 : t.call(a)
                    ]
                  }
                }
              )
            ]),
            null == (r = a.footer) ? void 0 : r.call(a)
          ]
        )
      }
  })
export { u as S, v as a }
