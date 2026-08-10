import {
  p as e,
  a1 as l,
  w as a,
  am as i,
  cz as t,
  cA as r,
  ag as n,
  ac as s,
  ci as u,
  cB as o,
  ai as v,
  a0 as d,
  a3 as c,
  cC as p,
  ab as m,
  cD as g,
  af as y,
  r as f,
  a2 as w,
  c0 as _,
  aS as b,
  cE as h,
  ch as q,
  al as k,
  cF as S,
  cG as z,
  cH as R,
  cI as M,
  ba as x,
  $,
  cJ as A,
  cK as C,
  a6 as P,
  cL as O,
  ap as U,
  ao as L
} from './invariable-DewVS0br.js'
import {
  h as j,
  s as I,
  p as E,
  r as T,
  q as B,
  f as D,
  a as V,
  b as N,
  c as K,
  d as F,
  e as J,
  t as H,
  u as Q
} from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { e as W, u as G } from './alerts-CIHfuoAx.js'
import { P as X } from './PageHeader-OtleDOO-.js'
import { T as Y } from './TimeRangeBar-EdVcwx6f.js'
import { S as Z } from './ServiceHealthBadge-b4ePBNa-.js'
import { R as ee } from './ResultTable-B_9U75PU.js'
import {
  g as le,
  n as ae,
  c as ie,
  d as te,
  e as re,
  h as ne,
  o as se,
  i as ue,
  j as oe,
  a as ve,
  m as de,
  k as ce,
  f as pe,
  G as me,
  P as ge,
  l as ye,
  p as fe,
  q as we,
  r as _e
} from './queryNumberDisplay-tHOniZKI.js'
import { D as be } from './DetailDrawer-C1HE8GcD.js'
import { u as he } from './useTimeStore-CVw7RN2Q.js'
import { B as qe } from './BarChart-BD7y_EJr.js'
import { L as ke } from './LineChart-gPgXHJ75.js'
import { d as Se, i as ze, j as Re, b as Me } from './index-DFkcx8xz.js'
import { l as xe, f as $e } from './catalogModel-DEDthFal.js'
import { n as Ae } from './queryModel-CK1Nudco.js'
import './BaseChart-FGf3lmW3.js'
const Ce = e({
  name: 'PanelToolbar',
  props: {
    panel: { type: Object, required: !0 },
    panelOptions: { type: Array, required: !0 },
    capabilities: { type: Array, required: !0 },
    canRestore: { type: Boolean, default: !1 },
    canEdit: { type: Boolean, default: !0 },
    editMode: { type: Boolean, default: !1 },
    largeScreenMode: { type: Boolean, default: !1 }
  },
  emits: [
    'toggle-edit',
    'save-default',
    'add-widget',
    'change-panel',
    'duplicate-panel',
    'rename-panel',
    'delete-panel',
    'restore-panel',
    'toggle-large-screen',
    'export-cards',
    'import-cards'
  ],
  setup(e, { emit: u }) {
    const o = l(() => e.panelOptions.map((e) => ({ label: e.name, value: e.id }))),
      v = l(() => {
        const l = [
          { label: '导出当前卡片配置', key: 'export-cards' },
          { label: '导入卡片配置', key: 'import-cards', disabled: !e.canEdit },
          { label: '创建用户面板副本', key: 'duplicate' }
        ]
        return (
          'user' === e.panel.kind &&
            (l.push({ label: '重命名当前面板', key: 'rename' }),
            e.canRestore && l.push({ label: '恢复面板初始版本', key: 'restore' }),
            l.push({ label: '删除当前面板', key: 'delete' })),
          l
        )
      }),
      d = (e) => {
        'duplicate' === e && u('duplicate-panel'),
          'rename' === e && u('rename-panel'),
          'restore' === e && u('restore-panel'),
          'delete' === e && u('delete-panel'),
          'export-cards' === e && u('export-cards'),
          'import-cards' === e && u('import-cards')
      }
    return () =>
      a(
        i,
        { bordered: !1, class: 'panel-toolbar' },
        {
          default: () => [
            a('div', { class: 'panel-toolbar__content' }, [
              a('div', { class: 'panel-toolbar__main' }, [
                a('div', { class: 'panel-toolbar__title-row' }, [
                  e.panelOptions.length > 1
                    ? a('div', { class: 'panel-toolbar__panel-picker' }, [
                        a(t, { value: e.panel.id, options: o.value, onUpdateValue: (e) => u('change-panel', e) }, null)
                      ])
                    : a('div', { class: 'panel-toolbar__title' }, [e.panel.name])
                ]),
                a('div', { class: 'panel-toolbar__description' }, [e.panel.description])
              ]),
              a('div', { class: 'panel-toolbar__actions' }, [
                a('div', { class: 'panel-toolbar__buttons' }, [
                  a(
                    r,
                    {
                      trigger: 'click',
                      options: v.value,
                      menuProps: () => ({ class: 'panel-toolbar__action-menu' }),
                      onSelect: d
                    },
                    { default: () => [a(n, { secondary: !0 }, { default: () => [s('面板操作')] })] }
                  ),
                  a(n, { secondary: !0, onClick: () => u('save-default') }, { default: () => [s('保存默认视角')] }),
                  a(
                    n,
                    { secondary: !0, disabled: !e.canEdit, onClick: () => u('toggle-edit') },
                    { default: () => [e.editMode ? '完成编辑' : '编辑面板'] }
                  ),
                  a(
                    n,
                    {
                      secondary: !e.largeScreenMode,
                      type: e.largeScreenMode ? 'warning' : 'primary',
                      ghost: e.largeScreenMode,
                      onClick: () => u('toggle-large-screen')
                    },
                    { default: () => [e.largeScreenMode ? '退出大屏模式' : '大屏模式'] }
                  ),
                  e.editMode && e.canEdit
                    ? a(n, { type: 'primary', onClick: () => u('add-widget') }, { default: () => [s('添加组件')] })
                    : null
                ])
              ])
            ])
          ]
        }
      )
  }
})
function Pe(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !v(e))
}
const Oe = {
    'query-card': '开放查询卡',
    'metric-summary': '指标摘要',
    'risk-service': '风险服务',
    incident: '事件列表',
    'ingest-status': '接入状态',
    trend: '趋势图',
    'quick-pivot': '快捷入口',
    'darwin-infra-summary': '资源摘要',
    'darwin-infra-trend': '资源趋势',
    'darwin-instance-table': '实例资源'
  },
  Ue = { metrics: '指标', logs: '日志', traces: '链路', alerts: '告警', serviceCatalog: '服务目录', ingestion: '接入' },
  Le = e({
    name: 'PanelWidgetCard',
    props: {
      widget: { type: Object, required: !0 },
      editMode: { type: Boolean, default: !1 },
      panelEditable: { type: Boolean, default: !0 }
    },
    emits: ['configure', 'remove', 'resize', 'reorder-pointerdown'],
    setup(e, { emit: l, slots: t }) {
      const r = ['S', 'M', 'L']
      return () => {
        let v
        return a(
          i,
          { bordered: !0, class: 'panel-widget-card' },
          {
            default: () => {
              var i
              return [
                a('div', { class: 'panel-widget-card__header' }, [
                  a('div', { class: 'panel-widget-card__main' }, [
                    a('div', { class: 'panel-widget-card__title-row' }, [
                      a('div', { class: 'panel-widget-card__title' }, [e.widget.title]),
                      a('div', { class: 'panel-widget-card__meta' }, [
                        a(
                          u,
                          { size: 'small', bordered: !1, type: e.widget.future ? 'warning' : 'default' },
                          { default: () => [Oe[e.widget.kind]] }
                        ),
                        a(
                          u,
                          { size: 'small', bordered: !1, type: 'info' },
                          { default: () => [Ue[e.widget.capability]] }
                        ),
                        (e.widget.tags || []).map((e) =>
                          a(
                            u,
                            { key: e, size: 'small', bordered: !1, type: 'success', class: 'panel-widget-card__tag' },
                            Pe(e) ? e : { default: () => [e] }
                          )
                        )
                      ])
                    ]),
                    a('div', { class: 'panel-widget-card__description' }, [e.widget.description])
                  ]),
                  e.editMode && e.panelEditable
                    ? a('div', { class: 'panel-widget-card__controls' }, [
                        a('div', { class: 'panel-widget-card__control-hint' }, [
                          a(
                            u,
                            { size: 'small', bordered: !1 },
                            { default: () => [s('拖拽排序 · span '), le(e.widget.size), s('/12')] }
                          )
                        ]),
                        a(
                          'div',
                          {
                            class: 'panel-widget-card__control-row panel-widget-card__control-row--handle',
                            onPointerdown: (e) => l('reorder-pointerdown', e)
                          },
                          [
                            a(
                              n,
                              { size: 'small', secondary: !0, class: 'panel-widget-card__drag-handle' },
                              { default: () => [s('拖拽排序')] }
                            )
                          ]
                        ),
                        a('div', { class: 'panel-widget-card__control-row' }, [
                          a(
                            o,
                            { size: 'small' },
                            Pe(
                              (v = r.map((i) =>
                                a(
                                  n,
                                  {
                                    key: i,
                                    type: e.widget.size === i ? 'primary' : 'default',
                                    secondary: e.widget.size !== i,
                                    onClick: () => l('resize', i)
                                  },
                                  Pe(i) ? i : { default: () => [i] }
                                )
                              ))
                            )
                              ? v
                              : { default: () => [v] }
                          )
                        ]),
                        a('div', { class: 'panel-widget-card__actions' }, [
                          a(
                            n,
                            { size: 'small', quaternary: !0, onClick: () => l('configure') },
                            { default: () => [s('编辑')] }
                          ),
                          a(
                            n,
                            { size: 'small', quaternary: !0, type: 'error', onClick: () => l('remove') },
                            { default: () => [s('删除组件')] }
                          )
                        ])
                      ])
                    : null
                ]),
                a('div', { class: 'panel-widget-card__content' }, [null == (i = t.default) ? void 0 : i.call(t)])
              ]
            }
          }
        )
      }
    }
  }),
  je = e({
    name: 'OverviewAnalyticsWidgetEditor',
    props: {
      show: { type: Boolean, required: !0 },
      mode: { type: String, required: !0 },
      draft: { type: Object, required: !0 },
      widgetTypeOptions: { type: Array, required: !0 },
      tagOptions: { type: Array, default: () => [] },
      granularityOptions: { type: Array, required: !0 },
      timeRangeOptions: { type: Array, required: !0 },
      metricOptions: { type: Array, required: !0 },
      comparisonOptions: { type: Array, required: !0 },
      sizeOptions: { type: Array, required: !0 },
      visualizationOptions: { type: Array, required: !0 },
      allowSmallSize: { type: Boolean, default: !1 },
      showTimeSettings: { type: Boolean, default: !0 },
      showMetricSelector: { type: Boolean, default: !0 },
      metricSelectorMultiple: { type: Boolean, default: !0 },
      showComparisonSelector: { type: Boolean, default: !0 },
      showDisplayOptions: { type: Boolean, default: !0 },
      showVisualizationOptions: { type: Boolean, default: !0 },
      confirmLoading: { type: Boolean, default: !1 },
      settingsSectionTitle: { type: String, default: '专项设置' },
      settingsSectionDescription: { type: String, default: '补充当前卡片专属的数据来源和展示限制。' }
    },
    emits: ['update:show', 'update:draft', 'kind-change', 'confirm'],
    setup(e, { emit: r, slots: o }) {
      const v = d(null),
        f = d(500),
        w = d('undefined' == typeof window ? 1440 : window.innerWidth),
        _ = d('settings'),
        b = d(!1),
        h = l(() => e.draft.editor),
        q = l(() => {
          var l
          return (
            (null == (l = e.visualizationOptions.find((e) => e.value === h.value.visualization)) ? void 0 : l.label) ||
            h.value.visualization
          )
        }),
        k = l(() => (w.value <= 980 ? 'compact' : w.value <= 1280 ? 'stacked' : 'split')),
        S = l(() => ('split' === k.value ? 'xl' : 'lg')),
        z = l(() => [
          `is-mode-${k.value}`,
          `is-size-${e.draft.size.toLowerCase()}`,
          `is-visualization-${h.value.visualization}`
        ]),
        R = () => {
          ;(w.value = window.innerWidth), 'compact' !== k.value && (_.value = 'settings')
        },
        M = (e) => {
          r('update:show', e), e || ((_.value = 'settings'), x())
        },
        x = () => {
          ;(b.value = !1), window.removeEventListener('pointermove', $), window.removeEventListener('pointerup', x)
        },
        $ = (e) => {
          const l = v.value
          if (!l || 'split' !== k.value) return
          const a = l.getBoundingClientRect(),
            i = e.clientX - a.left,
            t = Math.min(720, a.width - 620 - 12 - 32)
          f.value = Math.min(Math.max(i, 460), t)
        },
        A = (e) => {
          'split' === k.value &&
            (e.preventDefault(),
            (b.value = !0),
            window.addEventListener('pointermove', $),
            window.addEventListener('pointerup', x))
        }
      c(() => {
        R(), window.addEventListener('resize', R)
      }),
        p(() => {
          window.removeEventListener('resize', R), x()
        })
      const C = (e) => {
          r('update:draft', e)
        },
        P = (e) => {
          const l = Array.isArray(e) ? e : e ? [e] : []
          C({ tags: ae(l) })
        },
        O = (l) => {
          var a
          r('update:draft', {
            editor: {
              ...e.draft.editor,
              ...l,
              display: { ...((null == (a = e.draft.editor) ? void 0 : a.display) || {}), ...(l.display || {}) }
            }
          })
        },
        U = (e) => {
          var l
          ;(l = e.target) instanceof Element &&
            Boolean(l.closest('input, textarea, [contenteditable="true"], .n-input, .n-input-number, .n-select')) &&
            e.stopPropagation()
        },
        L = () => {
          var l
          const t = null == (l = o.settings) ? void 0 : l.call(o)
          return !t || (Array.isArray(t) && !t.length)
            ? null
            : a(
                i,
                { bordered: !1, class: 'overview-analytics-editor__section-card' },
                {
                  default: () => [
                    a('div', { class: 'overview-analytics-editor__section-header' }, [
                      a('div', null, [
                        a('div', { class: 'overview-analytics-editor__section-title' }, [e.settingsSectionTitle]),
                        a('div', { class: 'overview-analytics-editor__section-description' }, [
                          e.settingsSectionDescription
                        ])
                      ])
                    ]),
                    a('div', { class: 'overview-analytics-editor__custom-settings' }, [t])
                  ]
                }
              )
        }
      return () =>
        a(
          be,
          { show: e.show, title: 'create' === e.mode ? '添加卡片' : '编辑卡片', width: S.value, 'onUpdate:show': M },
          {
            default: () =>
              a('div', { class: 'overview-analytics-editor', onKeydown: U }, [
                'compact' === k.value
                  ? a('div', { class: 'overview-analytics-editor__compact-switcher' }, [
                      a(
                        'button',
                        {
                          type: 'button',
                          class: ['overview-analytics-editor__compact-tab', 'settings' === _.value ? 'is-active' : ''],
                          onClick: () => (_.value = 'settings')
                        },
                        [s('设置')]
                      ),
                      a(
                        'button',
                        {
                          type: 'button',
                          class: ['overview-analytics-editor__compact-tab', 'preview' === _.value ? 'is-active' : ''],
                          onClick: () => (_.value = 'preview')
                        },
                        [s('预览')]
                      )
                    ])
                  : null,
                a(
                  'div',
                  {
                    ref: v,
                    class: ['overview-analytics-editor__layout', `is-${k.value}`, b.value ? 'is-dragging' : ''],
                    style: 'split' === k.value ? { '--editor-form-width': `${f.value}px` } : void 0
                  },
                  [
                    'compact' !== k.value || 'settings' === _.value
                      ? a('div', { class: 'overview-analytics-editor__form-column' }, [
                          a(
                            i,
                            { bordered: !1, class: 'overview-analytics-editor__section-card' },
                            {
                              default: () => [
                                a('div', { class: 'overview-analytics-editor__section-header' }, [
                                  a('div', null, [
                                    a('div', { class: 'overview-analytics-editor__section-title' }, [s('基础信息')]),
                                    a('div', { class: 'overview-analytics-editor__section-description' }, [
                                      s('保留当前卡片来源类型，同时补齐名称、卡片描述与说明。')
                                    ])
                                  ])
                                ]),
                                a('div', { class: 'overview-analytics-editor__field-grid' }, [
                                  a('label', { class: 'overview-analytics-editor__field' }, [
                                    a('span', { class: 'overview-analytics-editor__label' }, [s('组件名称')]),
                                    a(
                                      m,
                                      {
                                        value: e.draft.title,
                                        placeholder: '请输入组件名称',
                                        'onUpdate:value': (e) => C({ title: e })
                                      },
                                      null
                                    )
                                  ]),
                                  a('label', { class: 'overview-analytics-editor__field' }, [
                                    a('span', { class: 'overview-analytics-editor__label' }, [s('组件类型')]),
                                    a(
                                      t,
                                      {
                                        value: e.draft.kind,
                                        options: e.widgetTypeOptions,
                                        disabled: 'update' === e.mode,
                                        onUpdateValue: (e) => r('kind-change', e)
                                      },
                                      null
                                    )
                                  ])
                                ]),
                                a(
                                  'label',
                                  { class: 'overview-analytics-editor__field overview-analytics-editor__field--full' },
                                  [
                                    a('span', { class: 'overview-analytics-editor__label' }, [s('卡片描述')]),
                                    a(
                                      m,
                                      {
                                        type: 'textarea',
                                        autosize: { minRows: 2, maxRows: 4 },
                                        value: e.draft.description,
                                        placeholder: '用于展示在卡片头部的描述文案',
                                        'onUpdate:value': (e) => C({ description: e })
                                      },
                                      null
                                    )
                                  ]
                                ),
                                a(
                                  'label',
                                  { class: 'overview-analytics-editor__field overview-analytics-editor__field--full' },
                                  [
                                    a('span', { class: 'overview-analytics-editor__label' }, [s('卡片标签')]),
                                    a(
                                      t,
                                      {
                                        value: e.draft.tags || [],
                                        multiple: !0,
                                        filterable: !0,
                                        tag: !0,
                                        clearable: !0,
                                        maxTagCount: 'responsive',
                                        options: e.tagOptions,
                                        placeholder: '输入后回车创建标签，例如：核心服务、CPU、告警',
                                        onUpdateValue: P
                                      },
                                      null
                                    ),
                                    a('span', { class: 'overview-analytics-editor__hint' }, [
                                      s('标签只用于当前前端面板筛选，不会触发额外接口请求。')
                                    ])
                                  ]
                                ),
                                a(
                                  'label',
                                  { class: 'overview-analytics-editor__field overview-analytics-editor__field--full' },
                                  [
                                    a('span', { class: 'overview-analytics-editor__label' }, [s('备注')]),
                                    a(
                                      m,
                                      {
                                        type: 'textarea',
                                        autosize: { minRows: 3, maxRows: 5 },
                                        value: h.value.notes || '',
                                        placeholder: '用于补充当前卡片的筛选说明或排查提示',
                                        'onUpdate:value': (e) => O({ notes: e })
                                      },
                                      null
                                    )
                                  ]
                                )
                              ]
                            }
                          ),
                          e.showTimeSettings
                            ? a(
                                i,
                                { bordered: !1, class: 'overview-analytics-editor__section-card' },
                                {
                                  default: () => [
                                    a('div', { class: 'overview-analytics-editor__section-header' }, [
                                      a('div', null, [
                                        a('div', { class: 'overview-analytics-editor__section-title' }, [
                                          s('时间与数据')
                                        ]),
                                        a('div', { class: 'overview-analytics-editor__section-description' }, [
                                          s('时间粒度决定可选时间范围，显示指标决定预览内容。')
                                        ])
                                      ])
                                    ]),
                                    a('div', { class: 'overview-analytics-editor__field-grid' }, [
                                      a('label', { class: 'overview-analytics-editor__field' }, [
                                        a('span', { class: 'overview-analytics-editor__label' }, [s('时间粒度')]),
                                        a(
                                          t,
                                          {
                                            value: h.value.timeGranularity,
                                            options: e.granularityOptions,
                                            onUpdateValue: (e) => O({ timeGranularity: e })
                                          },
                                          null
                                        )
                                      ]),
                                      a('label', { class: 'overview-analytics-editor__field' }, [
                                        a('span', { class: 'overview-analytics-editor__label' }, [s('时间范围')]),
                                        a(
                                          t,
                                          {
                                            value: h.value.timeRange,
                                            options: e.timeRangeOptions,
                                            onUpdateValue: (e) => O({ timeRange: e })
                                          },
                                          null
                                        )
                                      ])
                                    ]),
                                    e.showComparisonSelector
                                      ? a(
                                          'label',
                                          {
                                            class:
                                              'overview-analytics-editor__field overview-analytics-editor__field--full'
                                          },
                                          [
                                            a('span', { class: 'overview-analytics-editor__label' }, [
                                              s('过去时间范围对比')
                                            ]),
                                            a(
                                              t,
                                              {
                                                value: h.value.compareEnabled ? h.value.compareWindow : null,
                                                clearable: !0,
                                                options: e.comparisonOptions,
                                                placeholder: '可选，默认不启用对比',
                                                onUpdateValue: (e) =>
                                                  O({
                                                    compareEnabled: Boolean(e),
                                                    compareWindow: e || 'previous-period'
                                                  })
                                              },
                                              null
                                            )
                                          ]
                                        )
                                      : null,
                                    e.showMetricSelector
                                      ? a(
                                          'label',
                                          {
                                            class:
                                              'overview-analytics-editor__field overview-analytics-editor__field--full'
                                          },
                                          [
                                            a('span', { class: 'overview-analytics-editor__label' }, [s('显示指标')]),
                                            a(
                                              t,
                                              {
                                                value: e.metricSelectorMultiple
                                                  ? h.value.displayedMetrics
                                                  : h.value.displayedMetrics[0] || null,
                                                multiple: e.metricSelectorMultiple,
                                                maxTagCount: e.metricSelectorMultiple ? 'responsive' : void 0,
                                                options: e.metricOptions,
                                                placeholder: '选择要展示的指标',
                                                onUpdateValue: (l) =>
                                                  O({
                                                    displayedMetrics: e.metricSelectorMultiple ? l || [] : l ? [l] : []
                                                  })
                                              },
                                              null
                                            )
                                          ]
                                        )
                                      : null
                                  ]
                                }
                              )
                            : null,
                          L(),
                          a(
                            i,
                            { bordered: !1, class: 'overview-analytics-editor__section-card' },
                            {
                              default: () => [
                                a('div', { class: 'overview-analytics-editor__section-header' }, [
                                  a('div', null, [
                                    a('div', { class: 'overview-analytics-editor__section-title' }, [s('展示设置')]),
                                    a('div', { class: 'overview-analytics-editor__section-description' }, [
                                      s('紧凑型卡片支持 S 尺寸；内容较密集的列表与状态卡会自动保持至少 M。')
                                    ])
                                  ])
                                ]),
                                e.showVisualizationOptions
                                  ? a('div', { class: 'overview-analytics-editor__type-grid' }, [
                                      e.visualizationOptions.map((e) => {
                                        const l = h.value.visualization === e.value
                                        return a(
                                          'button',
                                          {
                                            key: e.value,
                                            type: 'button',
                                            class: ['overview-analytics-editor__type-card', l ? 'is-active' : ''],
                                            onClick: () => O({ visualization: e.value })
                                          },
                                          [
                                            a('div', { class: 'overview-analytics-editor__type-card-top' }, [
                                              a('span', { class: 'overview-analytics-editor__type-label' }, [e.label]),
                                              l
                                                ? a(
                                                    u,
                                                    { size: 'small', type: 'success', bordered: !1 },
                                                    { default: () => [s('当前')] }
                                                  )
                                                : null
                                            ]),
                                            e.description
                                              ? a('div', { class: 'overview-analytics-editor__type-description' }, [
                                                  e.description
                                                ])
                                              : null
                                          ]
                                        )
                                      })
                                    ])
                                  : null,
                                a('div', { class: 'overview-analytics-editor__size-grid' }, [
                                  e.sizeOptions.map((l) => {
                                    const i = e.draft.size === l.value,
                                      t = 'S' === l.value && !e.allowSmallSize
                                    return a(
                                      'button',
                                      {
                                        key: l.value,
                                        type: 'button',
                                        disabled: t,
                                        class: [
                                          'overview-analytics-editor__size-card',
                                          i ? 'is-active' : '',
                                          t ? 'is-disabled' : ''
                                        ],
                                        onClick: () => {
                                          t || C({ size: l.value })
                                        }
                                      },
                                      [
                                        a(
                                          'div',
                                          {
                                            class: `overview-analytics-editor__size-visual overview-analytics-editor__size-visual--${l.value.toLowerCase()}`
                                          },
                                          null
                                        ),
                                        a('div', { class: 'overview-analytics-editor__size-copy' }, [
                                          a('div', { class: 'overview-analytics-editor__size-title' }, [l.label]),
                                          a('div', { class: 'overview-analytics-editor__size-description' }, [
                                            t ? '当前卡片内容较密集，最小为 M' : l.description || '适配当前布局'
                                          ])
                                        ])
                                      ]
                                    )
                                  })
                                ]),
                                e.showDisplayOptions
                                  ? a(
                                      'label',
                                      {
                                        class: 'overview-analytics-editor__field overview-analytics-editor__field--full'
                                      },
                                      [
                                        a('span', { class: 'overview-analytics-editor__label' }, [s('同时显示')]),
                                        a(
                                          g,
                                          {
                                            value: [
                                              ...(h.value.display.showTotal ? ['showTotal'] : []),
                                              ...(h.value.display.showAverage ? ['showAverage'] : []),
                                              ...(h.value.display.showPreviousPeriod ? ['showPreviousPeriod'] : []),
                                              ...(h.value.display.showSamePeriod ? ['showSamePeriod'] : [])
                                            ],
                                            onUpdateValue: (e) => {
                                              const l = e
                                              O({
                                                display: {
                                                  showTotal: l.includes('showTotal'),
                                                  showAverage: l.includes('showAverage'),
                                                  showPreviousPeriod: l.includes('showPreviousPeriod'),
                                                  showSamePeriod: l.includes('showSamePeriod')
                                                }
                                              })
                                            }
                                          },
                                          {
                                            default: () => [
                                              a(
                                                'div',
                                                {
                                                  class:
                                                    'overview-analytics-editor__choice-list overview-analytics-editor__choice-list--compact'
                                                },
                                                [
                                                  [
                                                    { value: 'showTotal', label: '合计', description: '显示统计总量' },
                                                    {
                                                      value: 'showAverage',
                                                      label: '均值',
                                                      description: '显示平均水平'
                                                    },
                                                    {
                                                      value: 'showPreviousPeriod',
                                                      label: '环比上期',
                                                      description: '显示上一周期对比'
                                                    },
                                                    {
                                                      value: 'showSamePeriod',
                                                      label: '同比时间范围',
                                                      description: '显示同类时间窗口对比'
                                                    }
                                                  ].map((e) =>
                                                    a(
                                                      'label',
                                                      { key: e.value, class: 'overview-analytics-editor__check-tile' },
                                                      [
                                                        a(y, { value: e.value }, null),
                                                        a('div', null, [
                                                          a(
                                                            'div',
                                                            { class: 'overview-analytics-editor__check-title' },
                                                            [e.label]
                                                          ),
                                                          a(
                                                            'div',
                                                            { class: 'overview-analytics-editor__check-description' },
                                                            [e.description]
                                                          )
                                                        ])
                                                      ]
                                                    )
                                                  )
                                                ]
                                              )
                                            ]
                                          }
                                        )
                                      ]
                                    )
                                  : null
                              ]
                            }
                          )
                        ])
                      : null,
                    'split' === k.value
                      ? a('div', { class: 'overview-analytics-editor__splitter', onPointerdown: A }, null)
                      : null,
                    'compact' !== k.value || 'preview' === _.value
                      ? a('div', { class: 'overview-analytics-editor__preview-column' }, [
                          a(
                            i,
                            { bordered: !1, class: 'overview-analytics-editor__preview-card' },
                            {
                              default: () => {
                                var l
                                return [
                                  a('div', { class: 'overview-analytics-editor__preview-header' }, [
                                    a('div', null, [
                                      a('div', { class: 'overview-analytics-editor__section-title' }, [s('实时预览')]),
                                      a('div', { class: 'overview-analytics-editor__section-description' }, [
                                        s(
                                          '预览画布会根据当前尺寸与展示方式自动调整，让卡片形态更接近面板中的真实占位。'
                                        )
                                      ])
                                    ]),
                                    a(u, { size: 'small', bordered: !1, type: 'info' }, { default: () => [q.value] })
                                  ]),
                                  a('div', { class: 'overview-analytics-editor__preview-meta' }, [
                                    a('span', null, [e.draft.title || '未命名卡片']),
                                    a('span', null, [e.draft.size, s(' 卡片')]),
                                    a('span', null, [h.value.timeRange]),
                                    a('span', null, [h.value.displayedMetrics.length || 0, s(' 项指标')])
                                  ]),
                                  a('div', { class: 'overview-analytics-editor__preview-body' }, [
                                    a('div', { class: ['overview-analytics-editor__preview-canvas', ...z.value] }, [
                                      a('div', { class: 'overview-analytics-editor__preview-widget' }, [
                                        a('div', { class: 'overview-analytics-editor__preview-widget-header' }, [
                                          a('div', { class: 'overview-analytics-editor__preview-widget-main' }, [
                                            a('div', { class: 'overview-analytics-editor__preview-widget-title' }, [
                                              e.draft.title || '未命名卡片'
                                            ]),
                                            a('div', { class: 'overview-analytics-editor__preview-widget-subtitle' }, [
                                              e.draft.description ||
                                                `${e.draft.size} 卡片 · ${q.value} · ${h.value.timeRange}`
                                            ])
                                          ]),
                                          a(u, { size: 'small', bordered: !1 }, { default: () => [e.draft.size] })
                                        ]),
                                        a('div', { class: 'overview-analytics-editor__preview-widget-content' }, [
                                          null == (l = o.preview) ? void 0 : l.call(o)
                                        ])
                                      ])
                                    ])
                                  ])
                                ]
                              }
                            }
                          )
                        ])
                      : null
                  ]
                )
              ]),
            footer: () =>
              a('div', { class: 'overview-analytics-editor__footer' }, [
                a(n, { disabled: e.confirmLoading, onClick: () => M(!1) }, { default: () => [s('取消')] }),
                a(
                  n,
                  { type: 'primary', loading: e.confirmLoading, onClick: () => r('confirm') },
                  { default: () => ['create' === e.mode ? '添加卡片' : '保存配置'] }
                )
              ])
          }
        )
    }
  })
function Ie(e, l) {
  if (!l.length) return e
  const a = new Map(e.map((e) => [e.id, e])),
    i = l.map((e) => a.get(e)).filter((e) => Boolean(e))
  let t = 0
  return e.map((e) => {
    if (!l.includes(e.id)) return e
    const a = i[t]
    return (t += 1), a || e
  })
}
const Ee = ['latest', 'avg', 'sum', 'max', 'p95'],
  Te = ['number', 'line', 'bar', 'table', 'donut'],
  Be = ['sdk', 'darwin-event', 'auto'],
  De = ['system', 'service', 'instance'],
  Ve = (e) => Boolean(e) && 'object' == typeof e && !Array.isArray(e),
  Ne = (e) => {
    return !(
      !Ve(e) ||
      ('tenant' !== e.scope && 'system' !== e.scope) ||
      'string' != typeof e.metricRef ||
      !Ee.includes(e.aggregation) ||
      'string' != typeof e.timeRange ||
      !Ve(e.subject) ||
      !De.includes(e.subject.type) ||
      (e.sourceKind && !Be.includes(e.sourceKind)) ||
      (e.visualizationHint && !Te.includes(e.visualizationHint)) ||
      (e.calculation &&
        ((l = e.calculation),
        !Ve(l) ||
          'ratio' !== l.type ||
          !Ve(l.numerator) ||
          'string' != typeof l.numerator.metricRef ||
          !Ve(l.denominator) ||
          'string' != typeof l.denominator.metricRef ||
          (l.numerator.aggregation && !Ee.includes(l.numerator.aggregation)) ||
          (l.denominator.aggregation && !Ee.includes(l.denominator.aggregation)) ||
          (void 0 !== l.scale && 'number' != typeof l.scale) ||
          (void 0 !== l.unit && 'string' != typeof l.unit))) ||
      (e.display &&
        !((e) => {
          if (!Ve(e)) return !1
          if (void 0 !== e.value) {
            if (!Ve(e.value)) return !1
            const { min: l, max: a, unit: i } = e.value
            if (void 0 !== l && 'number' != typeof l) return !1
            if (void 0 !== a && 'number' != typeof a) return !1
            if (void 0 !== i && 'string' != typeof i) return !1
          }
          if (void 0 === e.yAxis) return !0
          if (!Ve(e.yAxis)) return !1
          const { min: l, max: a, unit: i } = e.yAxis
          return !(
            (void 0 !== l && 'number' != typeof l) ||
            (void 0 !== a && 'number' != typeof a) ||
            (void 0 !== i && 'string' != typeof i)
          )
        })(e.display)) ||
      (e.alert &&
        !((e) => {
          if (!Ve(e)) return !1
          if ('boolean' != typeof e.enabled) return !1
          if (void 0 !== e.operator && !['>', '<', '=', '>=', '<='].includes(String(e.operator))) return !1
          if (void 0 !== e.threshold && 'number' != typeof e.threshold) return !1
          if (void 0 !== e.unit && 'string' != typeof e.unit) return !1
          if (void 0 !== e.duration && 'number' != typeof e.duration) return !1
          if (void 0 !== e.level && !['critical', 'warning', 'info'].includes(String(e.level))) return !1
          if (void 0 !== e.channels && !Array.isArray(e.channels)) return !1
          if (void 0 !== e.rules) {
            if (!Array.isArray(e.rules)) return !1
            if (
              !e.rules.every(
                (e) =>
                  !(
                    !Ve(e) ||
                    !['critical', 'warning', 'info'].includes(String(e.level)) ||
                    !['>', '<', '=', '>=', '<='].includes(String(e.operator)) ||
                    'number' != typeof e.threshold ||
                    (void 0 !== e.unit && 'string' != typeof e.unit) ||
                    (void 0 !== e.duration && 'number' != typeof e.duration) ||
                    (void 0 !== e.channels && !Array.isArray(e.channels))
                  )
              )
            )
              return !1
          }
          return !(e.enabled && void 0 === e.threshold && !Array.isArray(e.rules))
        })(e.alert)) ||
      !((e) =>
        !(
          void 0 !== e &&
          'previous-period' !== e &&
          'same-period' !== e &&
          (!Ve(e) ||
            (void 0 !== e.enabled && 'boolean' != typeof e.enabled) ||
            !['previous-period', 'previous-day', 'previous-week'].includes(String(e.mode)) ||
            (void 0 !== e.display && !['relative', 'absolute', 'both'].includes(String(e.display))) ||
            (void 0 !== e.directionality &&
              !['increase_better', 'decrease_better', 'neutral'].includes(String(e.directionality))))
        ))(e.compare)
    )
    var l
  },
  Ke = (e) => {
    if (!e.trim()) return { query: null, issues: ['请先粘贴或输入 QuerySpec JSON'] }
    try {
      const l = ((e) => {
        var l
        if (Ne(e)) return e
        if (!Ve(e)) return null
        const a = e
        if (Ne(a.query)) return a.query
        if (Ne(null == (l = a.config) ? void 0 : l.query)) return a.config.query
        const i = e.queryspec
        return Ne(i) ? i : Ve(i) && Ne(i.query) ? i.query : null
      })(JSON.parse(e))
      return l
        ? { query: l, issues: [] }
        : {
            query: null,
            issues: ['JSON 中未找到有效的 QuerySpec；请提供 QuerySpec、{ query } 或 { config: { query } }']
          }
    } catch {
      return { query: null, issues: ['JSON 格式不正确，请检查括号、逗号和引号'] }
    }
  }
function Fe(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !v(e))
}
const Je = 'starlight_overview_panel_state_v5',
  He = 'starlight_overview_default_view_v5',
  Qe = 'starlight_overview_auto_refresh_v1',
  We = { service: null },
  Ge = [
    { label: '请求趋势', value: 'requests' },
    { label: '错误趋势', value: 'errors' },
    { label: '延迟趋势', value: 'latency' }
  ],
  Xe = [
    { label: 'S', value: 'S' },
    { label: 'M', value: 'M' },
    { label: 'L', value: 'L' }
  ],
  Ye = [
    { label: '关闭', value: 'off' },
    { label: '自动', value: 'auto' },
    { label: '15 秒', value: '15s' },
    { label: '30 秒', value: '30s' },
    { label: '1 分钟', value: '1m' },
    { label: '5 分钟', value: '5m' }
  ],
  Ze = (e) => Ye.some((l) => l.value === e),
  el = [
    { label: '小时', value: 'hour' },
    { label: '天', value: 'day' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' }
  ],
  ll = {
    hour: [
      { label: '最近 1 分钟', value: '1m' },
      { label: '最近 5 分钟', value: '5m' },
      { label: '最近 10 分钟', value: '10m' },
      { label: '最近 15 分钟', value: '15m' },
      { label: '最近 30 分钟', value: '30m' },
      { label: '最近 1 小时', value: '1h' },
      { label: '最近 4 小时', value: '4h' },
      { label: '最近 6 小时', value: '6h' },
      { label: '最近 12 小时', value: '12h' }
    ],
    day: [
      { label: '最近 1 天', value: '1d' },
      { label: '最近 2 天', value: '2d' },
      { label: '最近 7 天', value: '7d' }
    ],
    week: [
      { label: '最近 7 天', value: '7d' },
      { label: '最近 14 天', value: '14d' }
    ],
    month: [
      { label: '最近 14 天', value: '14d' },
      { label: '最近 30 天', value: '30d' }
    ]
  },
  al = {
    line: { label: '线图', description: '适合展示时序变化趋势。' },
    bar: { label: '柱图', description: '适合展示分段对比与时间切片。' },
    donut: { label: '环图', description: '适合展示当前指标占比。' },
    cumulative: { label: '累计图', description: '适合观察随时间累积的变化。' },
    table: { label: '表格', description: '适合查看明细与多指标对照。' },
    number: { label: '数值', description: '突出当前值与关键对比信息。' }
  },
  il = [
    { label: '环比上期', value: 'previous-period', description: '与上一等长周期进行对比。' },
    { label: '同比时间范围', value: 'same-period', description: '对照同类时间窗口查看趋势变化。' }
  ],
  tl = [
    { label: '上一周期', value: 'previous-period' },
    { label: '昨天同一时间', value: 'previous-day' },
    { label: '上周同一时间', value: 'previous-week' }
  ],
  rl = [
    { label: '百分比', value: 'relative' },
    { label: '绝对差值', value: 'absolute' },
    { label: '两者都显示', value: 'both' }
  ],
  nl = [
    { label: '上升更好', value: 'increase_better' },
    { label: '下降更好', value: 'decrease_better' },
    { label: '仅展示趋势', value: 'neutral' }
  ],
  sl = [
    { label: '百分比 (%)', value: '%' },
    { label: '毫秒 (ms)', value: 'ms' },
    { label: '请求数 (request)', value: 'request' },
    { label: '次数 (count)', value: 'count' },
    { label: '无单位', value: '' }
  ],
  ul = [
    { label: '大于 >', value: '>' },
    { label: '大于等于 >=', value: '>=' },
    { label: '小于 <', value: '<' },
    { label: '小于等于 <=', value: '<=' },
    { label: '等于 =', value: '=' }
  ],
  ol = [
    { label: '警告', value: 'warning' },
    { label: '严重', value: 'critical' },
    { label: '提示', value: 'info' }
  ],
  vl = [
    { label: 'Email', value: 'Email' },
    { label: 'Webhook', value: 'Webhook' },
    { label: '站内通知', value: 'InApp' }
  ],
  dl = {
    'query-card': ['自定义查询', '指标'],
    'metric-summary': ['指标', '摘要', '总览'],
    'risk-service': ['服务', '风险', '健康', '稳定性', '异常排查'],
    incident: ['告警', '事件', '稳定性', '异常排查'],
    'ingest-status': ['接入', '状态', '采集', '健康'],
    trend: ['指标', '趋势', '流量', '性能'],
    'quick-pivot': ['导航', '服务', '快捷入口'],
    'darwin-infra-summary': ['资源', '摘要', '资源水位', '容量'],
    'darwin-infra-trend': ['资源', '趋势', '资源水位', '容量'],
    'darwin-instance-table': ['资源', '实例', '资源水位', '容量']
  },
  cl = {
    requests: ['流量', '吞吐'],
    errors: ['稳定性', '错误', '异常排查'],
    latency: ['性能', '延迟'],
    'service-count': ['服务', '总览'],
    'healthy-services': ['健康', '服务'],
    'active-alerts': ['告警', '稳定性', '异常排查'],
    'total-requests': ['流量', '吞吐'],
    'error-rate': ['稳定性', '错误', '异常排查'],
    'p95-latency': ['性能', '延迟'],
    'ingest-success-rate': ['采集', '健康'],
    cpu: ['资源水位', 'CPU', '容量'],
    memory: ['资源水位', '内存', '容量']
  },
  pl = { metrics: '指标', logs: '日志', traces: '链路', alerts: '告警', serviceCatalog: '服务', ingestion: '接入' },
  ml = [
    '总览',
    '健康',
    '性能',
    '延迟',
    '流量',
    '吞吐',
    '稳定性',
    '错误',
    '异常排查',
    '告警',
    '事件',
    '服务',
    '接入',
    '采集',
    '资源',
    '资源水位',
    '容量',
    '实例',
    'CPU',
    '内存',
    '指标',
    '趋势',
    '摘要',
    '自定义查询',
    '快捷入口',
    '导航',
    '状态',
    '风险',
    '日志',
    '链路'
  ],
  gl = ae([...ml, ...Object.values(dl).flat(), ...Object.values(cl).flatMap((e) => e || []), ...Object.values(pl)]),
  yl = (e) => {
    const l = ne(e).displayedMetrics || []
    return l.length
      ? l
      : 'metric-summary' === e.kind
        ? [e.config.metricKey]
        : 'trend' === e.kind || 'darwin-infra-summary' === e.kind || 'darwin-infra-trend' === e.kind
          ? [e.config.metric]
          : 'darwin-instance-table' === e.kind
            ? ['cpu', 'memory']
            : 'ingest-status' === e.kind
              ? ['ingest-success-rate']
              : 'incident' === e.kind
                ? ['active-alerts']
                : 'risk-service' === e.kind
                  ? ['healthy-services', 'error-rate', 'p95-latency']
                  : []
  },
  fl = (e) => ae([...(dl[e.kind] || []), ...yl(e).flatMap((e) => cl[e] || []), pl[e.capability], ...(e.tags || [])]),
  wl = {
    requests: { label: '请求趋势', color: '#165dff' },
    errors: { label: '错误趋势', color: '#f53f3f' },
    latency: { label: '延迟趋势', color: '#722ed1', unit: 'ms' },
    'service-count': { label: '服务总数', color: '#165dff' },
    'healthy-services': { label: '健康服务数', color: '#00b42a' },
    'active-alerts': { label: '活跃告警', color: '#f53f3f' },
    'total-requests': { label: '请求总量', color: '#165dff' },
    'error-rate': { label: '全局错误率', color: '#ff7d00', unit: '%' },
    'p95-latency': { label: 'P95 延迟', color: '#722ed1', unit: 'ms' },
    'ingest-success-rate': { label: 'Ingest 成功率', color: '#00b42a', unit: '%' },
    cpu: { label: 'CPU 使用率', color: 'var(--color-primary-6)', unit: '%' },
    memory: { label: '内存使用率', color: 'var(--color-success-6)', unit: '%' }
  },
  _l = [
    { label: 'Info', value: 'info' },
    { label: 'Warning', value: 'warning' },
    { label: 'Critical', value: 'critical' }
  ],
  bl = [
    { label: 'Metrics', value: 'metrics' },
    { label: 'Logs', value: 'logs' },
    { label: 'Traces', value: 'traces' },
    { label: 'Alerts', value: 'alerts' }
  ],
  hl = [
    { label: 'Metrics', value: 'metrics' },
    { label: 'Logs', value: 'logs' },
    { label: 'Traces', value: 'traces' }
  ],
  ql = [
    { label: '服务目录', value: 'services' },
    { label: '服务拓扑', value: 'topology' },
    { label: 'Trace Explorer', value: 'traces' },
    { label: 'Logs Explorer', value: 'logs' },
    { label: 'Alert Inbox', value: 'alerts' },
    { label: '接入管理', value: 'admin-ingestion' }
  ]
function kl(e) {
  return JSON.parse(JSON.stringify(e))
}
const Sl = (e) => null !== e && 'object' == typeof e && !Array.isArray(e),
  zl = (e) => ({ ...e, editable: 'user' === e.kind }),
  Rl = (e) => (e.length ? e.reduce((e, l) => e + l, 0) / e.length : 0),
  Ml = (e, l = '', a = 1) => {
    const i = Number(e.toFixed(a))
    return `${i > 0 ? '+' : ''}${i}${l}`
  },
  xl = (e, l = '', a = !1) => {
    if (e.length < 2) return '对比数据不足'
    const i = Math.max(1, Math.floor(e.length / 2)),
      t = Rl(e.slice(0, i)),
      r = Rl(e.slice(i))
    if (0 === t && 0 === r) return '较前序持平'
    if (0 === t) return `较前序新增 ${r.toFixed(l ? 1 : 0)}${l}`
    const n = Number((((r - t) / t) * 100).toFixed(1))
    return `较前序${0 === n ? '持平' : n > 0 ? (a ? '下降' : '上升') : a ? '上升' : '下降'} ${Math.abs(n)}%`
  },
  $l = (e, l = '', a = !1) => {
    if (e.length < 2) return { baseline: '对比数据不足', delta: '—', mom: '等待趋势', deltaDirection: 'flat' }
    const i = Math.max(1, Math.floor(e.length / 2)),
      t = Rl(e.slice(0, i)),
      r = Rl(e.slice(i)),
      n = r - t
    return {
      baseline: `${t.toFixed(l ? 1 : 0)}${l}`,
      delta: 0 === t && 0 === r ? '0' : 0 === t ? `+${r.toFixed(l ? 1 : 0)}${l}` : Ml(n, l, l ? 1 : 0),
      mom: xl(e, l, a).replace('较前序', ''),
      deltaDirection: 0 === n ? 'flat' : n > 0 ? 'up' : 'down'
    }
  },
  Al = (e) => {
    switch (e) {
      case 'services':
        return '/home/services'
      case 'topology':
        return '/home/services/topology'
      case 'traces':
        return '/home/investigate/traces'
      case 'logs':
        return '/home/investigate/logs'
      case 'alerts':
        return '/home/alerts/inbox'
      case 'admin-ingestion':
        return '/home/admin/ingestion'
      default:
        return '/home/overview'
    }
  },
  Cl = (e) => {
    var l, a
    return null == (l = 'query-card' === (a = e).kind ? a.config : null) ? void 0 : l.query
  },
  Pl = e({
    name: 'OverviewPageV2',
    setup() {
      const e = x(),
        r = $(),
        o = he(),
        v = f(),
        le = (() => {
          const e = [oe()].map((e) => zl({ ...e, widgets: e.widgets.map((e) => re(e)) }))
          return { panels: e, baselines: Object.fromEntries(e.map((e) => [e.id, fe(e)])) }
        })(),
        be = l(() => {
          var e
          return Boolean(null == (e = Me()) ? void 0 : e.isAdmin)
        }),
        Pe = d(Se()),
        Oe = d({ ...We }),
        Ue = d(!1),
        Ee = d([]),
        Te = d({
          serviceCount: null,
          healthyServices: null,
          activeAlerts: null,
          errorRate: null,
          p95Latency: null,
          totalRequests: null
        }),
        Be = d([]),
        De = d(null),
        Ve = d({ highRiskServices: [], recentDegradedServices: [] }),
        Ne = d({
          overall: { requests: [], errors: [], latency: [] },
          env: { requests: [], errors: [], latency: [] },
          team: { requests: [], errors: [], latency: [] }
        }),
        dl = d({}),
        cl = d({}),
        pl = d({}),
        yl = d({ catalog: !1, summary: !1, incidents: !1, ingest: !1 }),
        Ml = d([]),
        xl = d('empty'),
        Pl = d({ keyword: '', type: '', unit: '', hasLabels: !1, serviceId: '' }),
        Ol = d(le.panels),
        Ul = d(le.baselines),
        Ll = d('user-overview'),
        jl = d(!1),
        Il = d(!1),
        El = d(!1),
        Tl = d(!1),
        Bl = d('create'),
        Dl = d(ie('metric-summary')),
        Vl = d(!1),
        Nl = d(!1),
        Kl = d(!1),
        Fl = d(null),
        Jl = d(''),
        Hl = d(''),
        Ql = d(!1),
        Wl = d(''),
        Gl = d(''),
        Xl = d('queryspec-json'),
        Yl = d(null),
        Zl = d(!1),
        ea = d('off'),
        la = d(null),
        aa = d(0),
        ia = d('undefined' == typeof document || 'visible' === document.visibilityState),
        ta = d('duplicate'),
        ra = d(''),
        na = d(!0),
        sa = d(null),
        ua = d(null),
        oa = new Map(),
        va = new Map(),
        da = { inFlightKey: '', inFlightPromise: null, latestToken: 0, lastCompletedKey: '', lastCompletedAt: 0 },
        ca = d(null),
        pa = d(null),
        ma = () => {
          v.warning('大屏模式仅用于监控展示，请退出大屏模式后再进行编辑或配置操作')
        },
        ga = async () => {
          Il.value = !1
          try {
            document.fullscreenElement && (await document.exitFullscreen())
          } catch (e) {}
        },
        ya = () => {
          Il.value
            ? ga()
            : (async () => {
                ;(Il.value = !0), (jl.value = !1), (El.value = !1), (Nl.value = !1), Fi()
                try {
                  document.fullscreenElement || (await document.documentElement.requestFullscreen())
                } catch (e) {}
              })()
        },
        fa = async () => {
          try {
            const e = await j(He, null)
            return (
              !!e &&
              (e.panelId && (Ll.value = e.panelId),
              e.scope && (Oe.value = e.scope),
              e.timeRange && o.setTimeRange(e.timeRange),
              e.datasetScope && !be.value && (Pe.value = e.datasetScope),
              !0)
            )
          } catch (e) {
            return !1
          }
        },
        wa = (e) => ze(e.scope, Me()) && Re(e.sourceKind || 'auto', Me()),
        _a = async () => {
          var e
          try {
            const l = await j(Je, null)
            if (!(null == (e = null == l ? void 0 : l.panels) ? void 0 : e.length)) return !1
            const a = l.panels.map((e) =>
              zl({
                ...e,
                widgets: (e.widgets || [])
                  .map((e) => re(e))
                  .filter((e) => {
                    if ('query-card' !== e.kind) return !0
                    const l = Cl(e)
                    return Boolean(l && wa(l))
                  })
              })
            )
            if (!a.length) return !1
            const i = l.baselines
              ? Object.fromEntries(
                  Object.entries(l.baselines).map(([e, l]) => [
                    e,
                    {
                      ...l,
                      widgets: (l.widgets || [])
                        .map((e) => re(e))
                        .filter((e) => {
                          if ('query-card' !== e.kind) return !0
                          const l = Cl(e)
                          return Boolean(l && wa(l))
                        })
                    }
                  ])
                )
              : {}
            return (Ol.value = a), (Ul.value = i), !0
          } catch (l) {
            return !1
          }
        },
        ba = async () => {
          try {
            const e = await j(Qe, null)
            return !(!e || !Ze(e.autoRefresh) || ((ea.value = e.autoRefresh), 0))
          } catch (e) {
            return !1
          }
        },
        ha = l(() => Ol.value.find((e) => e.id === Ll.value) || Ol.value[0]),
        qa = l(() => o.timeOptions),
        ka = l(() => [
          {
            key: 'metrics',
            label: 'Metrics',
            available: !0,
            frontendReady: !0,
            note: '支持查询驱动的指标卡片与资源视图。'
          },
          {
            key: 'serviceCatalog',
            label: 'Service Catalog',
            available: !0,
            frontendReady: !0,
            note: '支持风险服务与快捷入口卡片。'
          },
          { key: 'alerts', label: 'Alerts', available: !0, frontendReady: !0, note: '支持事件列表卡片。' },
          { key: 'ingestion', label: 'Ingestion', available: !0, frontendReady: !0, note: '支持接入状态卡片。' }
        ]),
        Sa = l(() => new Map(ka.value.map((e) => [e.key, e]))),
        za = l(() => {
          var e
          return Boolean(null == (e = ha.value) ? void 0 : e.editable)
        }),
        Ra = d(''),
        Ma = l(() => {
          var e
          return ((null == (e = ha.value) ? void 0 : e.widgets) || []).filter((e) => {
            const l = Sa.value.get(e.capability)
            return Boolean((null == l ? void 0 : l.available) && l.frontendReady)
          })
        }),
        xa = l(() => {
          const e = new Map()
          return (
            Ma.value.forEach((l) => {
              fl(l).forEach((l) => {
                e.set(l, (e.get(l) || 0) + 1)
              })
            }),
            Array.from(e.entries())
              .sort(([e, l], [a, i]) => i - l || e.localeCompare(a))
              .map(([e, l]) => ({ tag: e, count: l }))
          )
        }),
        $a = l(() => {
          const e = new Set(gl)
          return (
            Ma.value.forEach((l) => {
              ae(l.tags).forEach((l) => e.add(l))
            }),
            Array.from(e)
              .sort((e, l) => {
                const a = ml.indexOf(e),
                  i = ml.indexOf(l)
                return a >= 0 || i >= 0 ? (a < 0 ? 1 : i < 0 ? -1 : a - i) : e.localeCompare(l)
              })
              .map((e) => ({ label: e, value: e }))
          )
        }),
        Aa = l(() => {
          var e
          return (null == (e = xa.value.find((e) => e.tag === Ra.value)) ? void 0 : e.count) || 0
        }),
        Ca = l(() => (Ra.value ? Ma.value.filter((e) => fl(e).includes(Ra.value)) : Ma.value))
      w(xa, (e) => {
        Ra.value && (e.some((e) => e.tag === Ra.value) || (Ra.value = ''))
      })
      const Pa = l(() => ne(Dl.value)),
        Oa = l(() => {
          switch (o.timeRange) {
            case '15m':
            case '1h':
              return 15e3
            case '4h':
            case '1d':
              return 6e4
            case '2d':
              return 3e5
            default:
              return null
          }
        }),
        Ua = l(() =>
          !o.isLive || !ia.value || aa.value >= 3 || 'off' === ea.value
            ? null
            : 'auto' === ea.value
              ? Oa.value
              : '15s' === ea.value
                ? 15e3
                : '30s' === ea.value
                  ? 3e4
                  : '1m' === ea.value
                    ? 6e4
                    : 3e5
        ),
        La = l(() => {
          if (!o.isLive) return '实时模式关闭后，自动刷新暂停。'
          if (!ia.value) return '页面当前不可见，自动刷新已暂停。'
          if (aa.value >= 3) return '连续刷新失败，自动刷新已暂停，请手动刷新后恢复。'
          if ('off' === ea.value) return '自动刷新已关闭，可继续使用手动刷新。'
          if ('auto' === ea.value && !Oa.value) return '当前时间范围较长，自动模式下已暂停自动刷新。'
          const e = Ua.value || Oa.value
          if (!e) return '当前不会自动刷新。'
          const l = e >= 6e4 ? e / 6e4 + ' 分钟' : e / 1e3 + ' 秒'
          return 'auto' === ea.value ? `自动刷新将按建议频率每 ${l} 更新一次。` : `自动刷新已开启：每 ${l} 更新一次。`
        }),
        ja = l(() => _e(Dl.value.kind).map((e) => ({ value: e, label: al[e].label, description: al[e].description })))
      l(() => Rt.value)
      const Ia = l(() => ll[Pa.value.timeGranularity]),
        Ea = [
          { value: 'cpu', label: 'CPU 使用率' },
          { value: 'memory', label: '内存使用率' }
        ],
        Ta = l(() => Dl.value.config.query),
        Ba = l(() => Pa.value.queryEditMode || 'form-builder'),
        Da = l(() => Ke(Gl.value).query || Ta.value),
        Va = l(() => Ee.value.map((e) => ({ label: e.name, value: e.id }))),
        Na = l(() =>
          [
            { label: '用户接入', value: 'tenant' },
            { label: 'Darwin 系统', value: 'system' }
          ].filter((e) => ze(e.value, Me()))
        ),
        Ka = l(() =>
          [
            { label: '自动判断', value: 'auto' },
            { label: '用户接入指标', value: 'sdk' },
            { label: 'Darwin 系统指标', value: 'darwin-event' }
          ].filter((e) => Re(e.value, Me()))
        ),
        Fa = [
          { label: '最新值', value: 'latest' },
          { label: '平均值', value: 'avg' },
          { label: '求和', value: 'sum' },
          { label: '最大值', value: 'max' },
          { label: 'P95', value: 'p95' }
        ],
        Ja = [
          { label: '数值卡', value: 'number' },
          { label: '折线图', value: 'line' },
          { label: '柱状图', value: 'bar' },
          { label: '环图', value: 'donut' },
          { label: '表格', value: 'table' }
        ],
        Ha = [
          { label: '全局系统', value: 'system' },
          { label: '指定服务', value: 'service' }
        ],
        Qa = l(() => {
          var e
          return $e(Ml.value, {
            ...Pl.value,
            serviceId: Pl.value.serviceId || (null == (e = Ta.value.subject) ? void 0 : e.id) || ''
          })
        }),
        Wa = l(() => Qa.value.find((e) => e.name === Ta.value.metricRef) || null),
        Ga = l(() => {
          const e = Qa.value,
            l = new Set(e.flatMap((e) => e.labelNames)),
            a = new Set(e.flatMap((e) => e.sourceServices))
          return {
            total: e.length,
            system: e.filter((e) => e.scope.includes('system')).length,
            darwin: e.filter((e) => 'darwin-event' === e.sourceKind || 'mixed' === e.sourceKind).length,
            labels: l.size,
            services: a.size
          }
        }),
        Xa = l(() => Qa.value.map((e) => ({ label: `${e.name} · ${e.description}`, value: e.name }))),
        Ya = l(() =>
          Wa.value
            ? Fa.filter((e) => {
                var l
                return null == (l = Wa.value) ? void 0 : l.allowedAggregations.includes(e.value)
              })
            : Fa
        ),
        Za = l(() => Ja),
        ei = l(
          () =>
            Pa.value.displayedMetrics[0] ||
            ('metric-summary' === Dl.value.kind
              ? Dl.value.config.metricKey
              : 'trend' === Dl.value.kind
                ? Dl.value.config.metric
                : null)
        ),
        li = l(() => {
          const e = Dl.value.kind
          if ('query-card' === e) return []
          if ('metric-summary' === e) {
            const e = [
                { value: 'service-count', label: '服务总数' },
                { value: 'healthy-services', label: '健康服务数' },
                { value: 'active-alerts', label: '活跃告警' },
                { value: 'total-requests', label: '请求总量' },
                { value: 'error-rate', label: '全局错误率' },
                { value: 'p95-latency', label: 'P95 延迟' },
                { value: 'ingest-success-rate', label: 'Ingest 成功率' }
              ],
              l = ei.value
            return l && !e.some((e) => e.value === l) && wl[l] ? [{ value: l, label: wl[l].label }, ...e] : e
          }
          return 'trend' === e
            ? Ge.map((e) => ({ value: e.value, label: e.label }))
            : 'risk-service' === e
              ? [
                  { value: 'service-count', label: '服务数量' },
                  { value: 'error-rate', label: '错误率' },
                  { value: 'p95-latency', label: '延迟变化' }
                ]
              : 'ingest-status' === e
                ? [
                    { value: 'ingest-success-rate', label: '成功率' },
                    { value: 'total-requests', label: '采集总量' }
                  ]
                : 'incident' === e
                  ? [{ value: 'active-alerts', label: '活跃事件' }]
                  : 'quick-pivot' === e
                    ? [{ value: 'service-count', label: '可用入口' }]
                    : 'darwin-infra-summary' === e || 'darwin-infra-trend' === e
                      ? Ea
                      : []
        }),
        ai = l(() => ['metric-summary', 'trend', 'darwin-infra-summary', 'darwin-infra-trend'].includes(Dl.value.kind)),
        ii = l(() => {
          return 'metric-summary' === (e = Dl.value.kind)
            ? [
                {
                  key: 'service-count',
                  displayedMetrics: ['service-count'],
                  label: '服务总数',
                  title: '服务总数',
                  description: '展示当前范围内的服务总量。',
                  recommendation: 'number',
                  configPatch: { metricKey: 'service-count' }
                },
                {
                  key: 'healthy-services',
                  displayedMetrics: ['healthy-services'],
                  label: '健康服务数',
                  title: '健康服务数',
                  description: '展示当前范围内的健康服务数量。',
                  recommendation: 'number',
                  configPatch: { metricKey: 'healthy-services' }
                },
                {
                  key: 'active-alerts',
                  displayedMetrics: ['active-alerts'],
                  label: '活跃告警',
                  title: '活跃告警',
                  description: '展示当前范围内的活跃告警数量。',
                  recommendation: 'number',
                  configPatch: { metricKey: 'active-alerts' }
                },
                {
                  key: 'total-requests',
                  displayedMetrics: ['total-requests'],
                  label: '请求总量',
                  title: '请求总量',
                  description: '展示当前范围内的请求总量，适合快速查看整体吞吐。',
                  unit: 'request',
                  recommendation: 'number',
                  configPatch: { metricKey: 'total-requests' }
                },
                {
                  key: 'error-rate',
                  displayedMetrics: ['error-rate'],
                  label: '全局错误率',
                  title: '全局错误率',
                  description: '展示当前范围内的整体错误率，适合快速定位异常。',
                  unit: '%',
                  recommendation: 'number',
                  configPatch: { metricKey: 'error-rate' }
                },
                {
                  key: 'p95-latency',
                  displayedMetrics: ['p95-latency'],
                  label: 'P95 延迟',
                  title: 'P95 延迟',
                  description: '展示当前范围内的 P95 延迟，适合观察性能风险。',
                  unit: 'ms',
                  recommendation: 'number',
                  configPatch: { metricKey: 'p95-latency' }
                },
                {
                  key: 'ingest-success-rate',
                  displayedMetrics: ['ingest-success-rate'],
                  label: 'Ingest 成功率',
                  title: 'Ingest 成功率',
                  description: '展示当前范围内的采集成功率。',
                  unit: '%',
                  recommendation: 'number',
                  configPatch: { metricKey: 'ingest-success-rate' }
                }
              ]
            : 'trend' === e
              ? [
                  {
                    key: 'requests',
                    displayedMetrics: ['requests'],
                    label: '请求趋势',
                    title: '请求趋势',
                    description: '按时间展示请求量变化趋势，适合观察流量波动。',
                    unit: 'request',
                    recommendation: 'line',
                    configPatch: { metric: 'requests' }
                  },
                  {
                    key: 'errors',
                    displayedMetrics: ['errors'],
                    label: '错误趋势',
                    title: '错误趋势',
                    description: '按时间展示错误量变化趋势，适合定位异常时间段。',
                    unit: 'error',
                    recommendation: 'line',
                    configPatch: { metric: 'errors' }
                  },
                  {
                    key: 'latency',
                    displayedMetrics: ['latency'],
                    label: '延迟趋势',
                    title: '延迟趋势',
                    description: '按时间展示延迟变化趋势，适合观察性能劣化。',
                    unit: 'ms',
                    recommendation: 'line',
                    configPatch: { metric: 'latency' }
                  }
                ]
              : 'darwin-infra-summary' === e
                ? [
                    {
                      key: 'cpu',
                      displayedMetrics: ['cpu'],
                      label: 'CPU 使用率',
                      title: 'CPU 使用率',
                      description: '展示 Darwin 服务或全局视角下的 CPU 当前值。',
                      unit: '%',
                      recommendation: 'number',
                      configPatch: { metric: 'cpu' }
                    },
                    {
                      key: 'memory',
                      displayedMetrics: ['memory'],
                      label: '内存使用率',
                      title: '内存使用率',
                      description: '展示 Darwin 服务或全局视角下的内存当前值。',
                      unit: '%',
                      recommendation: 'number',
                      configPatch: { metric: 'memory' }
                    }
                  ]
                : 'darwin-infra-trend' === e
                  ? [
                      {
                        key: 'cpu',
                        displayedMetrics: ['cpu'],
                        label: 'CPU 使用率',
                        title: 'CPU 使用率趋势',
                        description: '展示 Darwin 服务或全局视角下的 CPU 趋势变化。',
                        unit: '%',
                        recommendation: 'line',
                        configPatch: { metric: 'cpu' }
                      },
                      {
                        key: 'memory',
                        displayedMetrics: ['memory'],
                        label: '内存使用率',
                        title: '内存使用率趋势',
                        description: '展示 Darwin 服务或全局视角下的内存趋势变化。',
                        unit: '%',
                        recommendation: 'line',
                        configPatch: { metric: 'memory' }
                      }
                    ]
                  : []
          var e
        }),
        ti = l(() => {
          const e = Hl.value.trim().toLowerCase()
          return e
            ? ii.value.filter((l) =>
                [l.label, l.title, l.description, l.unit || ''].join(' ').toLowerCase().includes(e)
              )
            : ii.value
        })
      l(() => {
        const e = new Set()
        return (
          Ca.value.forEach((l) => {
            if ('trend' === l.kind) {
              const a = l
              e.add(a.config.groupBy || 'overall')
            }
          }),
          e.add('overall'),
          Array.from(e)
        )
      })
      const ri = () => {
          Il.value
            ? ma()
            : I(He, { panelId: Ll.value, timeRange: o.timeRange, scope: Oe.value, datasetScope: Pe.value })
                .then(() => {
                  v.success('已保存默认视角')
                })
                .catch((e) => {
                  v.error('保存默认视角失败')
                })
        },
        ni = (e, l = Ul.value) => {
          const a = e.map((e) => ({ ...zl(e), widgets: e.widgets.map((e) => re(e)) })),
            i = Object.fromEntries(
              Object.entries(l).map(([e, l]) => [e, { ...zl(l), widgets: l.widgets.map((e) => re(e)) }])
            )
          ;(Ol.value = a), (Ul.value = i), I(Je, { panels: a, baselines: i }).catch((e) => {})
        },
        si = () => {
          la.value && (clearInterval(la.value), (la.value = null))
        },
        ui = () => {
          ;(ia.value = 'visible' === document.visibilityState), ia.value && Ua.value && (o.refreshTime(), tt())
        },
        oi = () => {
          si()
          const e = Ua.value
          e &&
            (la.value = setInterval(() => {
              o.refreshTime(), tt()
            }, e))
        },
        vi = (e) => {
          if (!ha.value) return
          const l = Ol.value.map((l) => (l.id === ha.value.id ? e(kl(l)) : l))
          ni(l)
        },
        di = async () => {
          if (!ha.value) return
          const e = ha.value.widgets || []
          if (!e.length) return void v.warning('当前看板没有可导出的卡片')
          const l = {
              type: 'starlight-overview-cards',
              version: 1,
              exportedAt: new Date().toISOString(),
              panel: { id: ha.value.id, name: ha.value.name },
              widgets: e.map((e) => re(kl(e)))
            },
            a = `starlight-${ha.value.name.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '') || 'overview'}-cards.json`
          if (Boolean(window.__TAURI_INTERNALS__)) {
            try {
              const i = await R({ defaultPath: a, filters: [{ name: 'StarLight 看板卡片配置', extensions: ['json'] }] })
              if (!i) return void v.info('已取消导出卡片配置')
              await M(i, JSON.stringify(l, null, 2)), v.success(`已导出 ${e.length} 张卡片配置：${i}`)
            } catch (n) {
              v.error('导出卡片配置失败，请重新选择保存位置后再试')
            }
            return
          }
          const i = new Blob([JSON.stringify(l, null, 2)], { type: 'application/json;charset=utf-8' }),
            t = URL.createObjectURL(i),
            r = document.createElement('a')
          ;(r.href = t),
            (r.download = a),
            document.body.appendChild(r),
            r.click(),
            r.remove(),
            URL.revokeObjectURL(t),
            v.success(`已开始下载 ${e.length} 张卡片配置：${a}`)
        },
        ci = () => {
          var e
          Il.value ? ma() : za.value && (null == (e = ua.value) || e.click())
        },
        pi = (e) =>
          Sl(e) &&
          'string' == typeof e.id &&
          'string' == typeof e.title &&
          'string' == typeof e.description &&
          'string' == typeof e.kind &&
          se.some((l) => l.kind === e.kind) &&
          'string' == typeof e.size &&
          ['S', 'M', 'L'].includes(e.size) &&
          'string' == typeof e.capability &&
          Sl(e.config),
        mi = (e) => {
          var l
          const a = e.target,
            i = null == (l = a.files) ? void 0 : l[0]
          ;(a.value = ''),
            i &&
              (async (e) => {
                if (za.value && !Il.value)
                  try {
                    const a =
                      ((l = JSON.parse(await e.text())),
                      (Array.isArray(l) ? l : Sl(l) && Array.isArray(l.widgets) ? l.widgets : [])
                        .filter(pi)
                        .map((e) => re(e))
                        .filter((e) => {
                          if ('query-card' !== e.kind) return !0
                          const l = Cl(e)
                          return Boolean(l && wa(l))
                        }))
                    if (!a.length) return void v.warning('未找到可导入的卡片配置')
                    const i = await Ii(a)
                    vi((e) => ({ ...e, widgets: i.widgets.map((e) => kl(e)) })),
                      (Ra.value = ''),
                      i.failedCount > 0
                        ? v.warning(`已导入 ${a.length} 张卡片配置，${i.failedCount} 张卡片的告警规则同步失败`)
                        : i.persistedCount > 0
                          ? v.success(`已导入 ${a.length} 张卡片配置，并同步 ${i.persistedCount} 条告警规则`)
                          : v.success(`已导入 ${a.length} 张卡片配置`),
                      await _(),
                      rt()
                  } catch (l) {
                    v.error('导入失败，请确认文件是有效的看板卡片 JSON')
                  }
                var l
              })(i)
        },
        gi = (e) => {
          const l = Me(),
            a = ze(e.scope, l) ? e.scope : Se(l),
            i = e.sourceKind || 'auto',
            t = Re(i, l) ? i : 'auto'
          return { ...e, scope: a, sourceKind: t }
        },
        yi = (e) => {
          const l = re(e),
            a = 'query-card' === l.kind ? { ...l, config: { query: gi(l.config.query) } } : l,
            i = ne(a),
            t = ll[i.timeGranularity],
            r = t.some((e) => e.value === i.timeRange)
          return {
            ...a,
            size: 'S' !== a.size || te(a) ? a.size : 'M',
            editor: { ...i, timeRange: r ? i.timeRange : t[0].value }
          }
        },
        fi = (e) => {
          var l, a
          const i = ne(Dl.value),
            t = { ...Dl.value, ...e, config: { ...Dl.value.config, ...(e.config || {}) } },
            r = null == (a = null == (l = e.editor) ? void 0 : l.displayedMetrics) ? void 0 : a[0]
          r &&
            !e.config &&
            ('metric-summary' === t.kind && (t.config = { ...t.config, metricKey: r }),
            'trend' === t.kind && (t.config = { ...t.config, metric: r })),
            (Dl.value = yi(t))
          const n = ne(Dl.value)
          'query-card' === Dl.value.kind &&
            'query-statement' === Ba.value &&
            n.timeRange !== i.timeRange &&
            Si((e) => ({ ...e, timeRange: `-${n.timeRange}` }))
        },
        wi = (e) => {
          fi({ config: { query: { ...Ta.value, ...e } } })
        },
        _i = (e) => {
          var l
          wi({
            display: {
              ...(Ta.value.display || {}),
              value: { ...((null == (l = Ta.value.display) ? void 0 : l.value) || {}), ...e }
            }
          })
        },
        bi = (e) =>
          'string' == typeof e
            ? {
                enabled: !0,
                mode: 'same-period' === e ? 'previous-day' : 'previous-period',
                display: 'relative',
                directionality: 'neutral'
              }
            : {
                enabled: !1 !== (null == e ? void 0 : e.enabled),
                mode: (null == e ? void 0 : e.mode) || 'previous-period',
                display: (null == e ? void 0 : e.display) || 'relative',
                directionality: (null == e ? void 0 : e.directionality) || 'neutral'
              },
        hi = (e) => {
          wi({ compare: { ...bi(Ta.value.compare), ...e } })
        },
        qi = (e) => {
          var l, a, i, t
          wi({
            alert: {
              enabled: !1,
              operator: '>',
              threshold: 0,
              unit:
                (null == (a = null == (l = Ta.value.display) ? void 0 : l.value) ? void 0 : a.unit) ||
                (null == (t = null == (i = Ta.value.display) ? void 0 : i.yAxis) ? void 0 : t.unit) ||
                '',
              duration: 5,
              level: 'warning',
              channels: ['Email'],
              ...(Ta.value.alert || {}),
              ...e
            }
          })
        },
        ki = (e) => {
          ;(Gl.value = JSON.stringify({ type: 'queryspec', version: 1, query: e }, null, 2)),
            (Yl.value = null),
            (Fl.value = null),
            (Jl.value = '')
        },
        Si = (e) => {
          const l = Ke(Gl.value)
          ki(e(l.query || Ta.value))
        },
        zi = (e) => {
          Si((l) => {
            var a
            return {
              ...l,
              display: {
                ...(l.display || {}),
                value: { ...((null == (a = l.display) ? void 0 : a.value) || {}), ...e }
              }
            }
          })
        },
        Ri = (e) => {
          Si((l) => ({ ...l, compare: { ...bi(l.compare), ...e } }))
        },
        Mi = (e) => {
          Si((l) => {
            var a, i, t, r
            return {
              ...l,
              alert: {
                enabled: !1,
                operator: '>',
                threshold: 0,
                unit:
                  (null == (i = null == (a = l.display) ? void 0 : a.value) ? void 0 : i.unit) ||
                  (null == (r = null == (t = l.display) ? void 0 : t.yAxis) ? void 0 : r.unit) ||
                  '',
                duration: 5,
                level: 'warning',
                channels: ['Email'],
                ...(l.alert || {}),
                ...e
              }
            }
          })
        },
        xi = (e) => {
          var l, a, i, t, r
          return (
            (null == (l = e.alert) ? void 0 : l.unit) ||
            (null == (i = null == (a = e.display) ? void 0 : a.value) ? void 0 : i.unit) ||
            (null == (r = null == (t = e.display) ? void 0 : t.yAxis) ? void 0 : r.unit) ||
            ''
          )
        },
        $i = (e, l) => {
          var a, i, t, r, n, s, u
          const o = xi(e),
            v = l.map((l) => {
              var a, i
              return {
                ...l,
                enabled: l.enabled ?? !0,
                operator: l.operator || (null == (a = e.alert) ? void 0 : a.operator) || '>',
                unit: l.unit ?? o,
                duration: l.duration || 5,
                channels: (null == (i = l.channels) ? void 0 : i.length) ? l.channels : ['Email'],
                level: l.level || 'warning'
              }
            }),
            d = v.find((e) => 'warning' === e.level) || v[0]
          return {
            enabled: v.some((e) => !1 !== e.enabled),
            operator: (null == d ? void 0 : d.operator) || (null == (a = e.alert) ? void 0 : a.operator) || '>',
            threshold: (null == d ? void 0 : d.threshold) ?? (null == (i = e.alert) ? void 0 : i.threshold) ?? 0,
            unit: (null == d ? void 0 : d.unit) ?? o,
            duration: (null == d ? void 0 : d.duration) || (null == (t = e.alert) ? void 0 : t.duration) || 5,
            level: (null == d ? void 0 : d.level) || (null == (r = e.alert) ? void 0 : r.level) || 'warning',
            channels: (null == (n = null == d ? void 0 : d.channels) ? void 0 : n.length)
              ? d.channels
              : (null == (u = null == (s = e.alert) ? void 0 : s.channels) ? void 0 : u.length)
                ? e.alert.channels
                : ['Email'],
            rules: v
          }
        },
        Ai = (e) => {
          var l, a, i, t, r
          const n = xi(e),
            s = (null == (l = e.alert) ? void 0 : l.duration) || 5,
            u = (null == (i = null == (a = e.alert) ? void 0 : a.channels) ? void 0 : i.length)
              ? e.alert.channels
              : ['Email'],
            o = (Array.isArray(null == (t = e.alert) ? void 0 : t.rules) ? e.alert.rules : [])
              .filter((e) => 'number' == typeof e.threshold && Number.isFinite(e.threshold))
              .map((l) => {
                var a, i
                return {
                  ...l,
                  enabled: l.enabled ?? !0,
                  operator: l.operator || (null == (a = e.alert) ? void 0 : a.operator) || '>',
                  unit: l.unit ?? n,
                  duration: l.duration || s,
                  channels: (null == (i = l.channels) ? void 0 : i.length) ? l.channels : u,
                  level: l.level || 'warning'
                }
              })
          return o.length
            ? o
            : (null == (r = e.alert) ? void 0 : r.enabled) &&
                'number' == typeof e.alert.threshold &&
                Number.isFinite(e.alert.threshold)
              ? [
                  {
                    ruleId: e.alert.ruleId,
                    enabled: e.alert.enabled ?? !0,
                    level: e.alert.level || 'warning',
                    operator: e.alert.operator || '>',
                    threshold: e.alert.threshold,
                    unit: n,
                    duration: s,
                    channels: u
                  }
                ]
              : ((e) => {
                  var l, a, i
                  const t = xi(e),
                    r =
                      'number' == typeof (null == (l = e.alert) ? void 0 : l.threshold)
                        ? e.alert.threshold
                        : '%' === t
                          ? 85
                          : 80,
                    n = '%' === t ? Math.min(100, r || 85) : r,
                    s = '%' === t ? Math.min(100, Math.max(n + 10, 95)) : n + 10
                  return [
                    {
                      level: 'warning',
                      operator: (null == (a = e.alert) ? void 0 : a.operator) || '>',
                      threshold: n,
                      unit: t,
                      duration: 5,
                      channels: ['Email']
                    },
                    {
                      level: 'critical',
                      operator: (null == (i = e.alert) ? void 0 : i.operator) || '>',
                      threshold: s,
                      unit: t,
                      duration: 3,
                      channels: ['Email']
                    }
                  ]
                })(e)
        },
        Ci = (e, l) => {
          const a = 'query-statement' === l ? Da.value : Ta.value,
            i = e ? $i(a, Ai(a)) : { enabled: e }
          'query-statement' === l ? Mi(i) : qi(i)
        },
        Pi = (e, l, a) => {
          const i = 'query-statement' === e ? Da.value : Ta.value,
            t = [...Ai(i)],
            r = t[l]
          if (!r) return
          t[l] = { ...r, ...a }
          const n = $i(i, t)
          'query-statement' === e ? Mi(n) : qi(n)
        },
        Oi = (e, l) => {
          const i = Ai(e)
          return a('div', { class: 'overview-page__query-alert-rules-editor' }, [
            i.map((e, r) => {
              const o = Ui[e.level]
              return a('div', { class: 'overview-page__query-alert-rule-row', key: e.ruleId || `${l}-${r}` }, [
                a('div', { class: 'overview-page__query-alert-rule-title' }, [
                  a(
                    u,
                    { size: 'small', bordered: !1, type: (null == o ? void 0 : o.tagType) || 'warning' },
                    { default: () => [(null == o ? void 0 : o.label) || e.level] }
                  ),
                  a('span', null, [s('阈值 '), r + 1]),
                  !1 === e.enabled
                    ? a(u, { size: 'small', bordered: !1, type: 'default' }, { default: () => [s('已停用')] })
                    : null,
                  a(
                    n,
                    {
                      size: 'tiny',
                      quaternary: !0,
                      type: 'error',
                      disabled: i.length <= 1,
                      onClick: () =>
                        ((e, l) => {
                          const a = 'query-statement' === e ? Da.value : Ta.value,
                            i = Ai(a)
                          if (i.length <= 1) return
                          const t = i.filter((e, a) => a !== l),
                            r = $i(a, t)
                          'query-statement' === e ? Mi(r) : qi(r)
                        })(l, r)
                    },
                    { default: () => [s('删除')] }
                  )
                ]),
                a('div', { class: 'overview-page__query-alert-rule-fields' }, [
                  a('label', { class: 'overview-page__query-alert-rule-field' }, [
                    a('span', null, [s('状态')]),
                    a(C, { value: !1 !== e.enabled, onUpdateValue: (e) => Pi(l, r, { enabled: e }) }, null)
                  ]),
                  a('label', { class: 'overview-page__query-alert-rule-field' }, [
                    a('span', null, [s('级别')]),
                    a(t, { value: e.level, options: ol, onUpdateValue: (e) => Pi(l, r, { level: e }) }, null)
                  ]),
                  a('label', { class: 'overview-page__query-alert-rule-field' }, [
                    a('span', null, [s('条件')]),
                    a(t, { value: e.operator, options: ul, onUpdateValue: (e) => Pi(l, r, { operator: e }) }, null)
                  ]),
                  a('label', { class: 'overview-page__query-alert-rule-field' }, [
                    a('span', null, [s('阈值')]),
                    a(
                      A,
                      {
                        value: e.threshold ?? null,
                        placeholder: 'critical' === e.level ? '例如 95' : '例如 85',
                        onUpdateValue: (e) => Pi(l, r, { threshold: 'number' == typeof e ? e : 0 })
                      },
                      null
                    )
                  ]),
                  a('label', { class: 'overview-page__query-alert-rule-field' }, [
                    a('span', null, [s('持续(分钟)')]),
                    a(A, { value: e.duration ?? 5, min: 1, onUpdateValue: (e) => Pi(l, r, { duration: e || 5 }) }, null)
                  ]),
                  a(
                    'label',
                    { class: 'overview-page__query-alert-rule-field overview-page__query-alert-rule-field--wide' },
                    [
                      a('span', null, [s('通知渠道')]),
                      a(
                        t,
                        {
                          value: e.channels || ['Email'],
                          options: vl,
                          multiple: !0,
                          placeholder: '通知渠道',
                          onUpdateValue: (e) => Pi(l, r, { channels: e.length ? e : ['Email'] })
                        },
                        null
                      )
                    ]
                  )
                ])
              ])
            }),
            a('div', { class: 'overview-page__query-alert-rule-actions' }, [
              a(
                n,
                {
                  size: 'small',
                  type: 'primary',
                  onClick: () =>
                    ((e) => {
                      const l = 'query-statement' === e ? Da.value : Ta.value,
                        a = Ai(l),
                        i = xi(l),
                        t = a.reduce(
                          (e, l) => ('number' == typeof l.threshold ? Math.max(e, l.threshold) : e),
                          '%' === i ? 75 : 0
                        ),
                        r = [
                          ...a,
                          {
                            level: 'warning',
                            operator: '>',
                            threshold: '%' === i ? Math.min(100, t + 10) : t + 10,
                            unit: i,
                            duration: 5,
                            channels: ['Email']
                          }
                        ],
                        n = $i(l, r)
                      'query-statement' === e ? Mi(n) : qi(n)
                    })(l)
                },
                { default: () => [s('添加阈值')] }
              )
            ]),
            a('div', { class: 'overview-page__query-alert-rule-caption' }, [
              s('可同时配置多条阈值，例如警告阈值提前关注、严重阈值立即处理；图表与告警规则会同步使用这些阈值。')
            ])
          ])
        },
        Ui = {
          critical: { label: '严重', tagType: 'error', color: 'var(--color-danger-6)' },
          warning: { label: '警告', tagType: 'warning', color: 'var(--color-warning-6)' },
          info: { label: '提示', tagType: 'info', color: 'var(--color-primary-6)' }
        },
        Li = { critical: 3, warning: 2, info: 1 },
        ji = async (e, l, a) => {
          const i = ((e, l) => {
            const a = Ae(l.alert, { includeDisabled: !0 })
            return a.length
              ? a.map((a) => {
                  var i, t, r, n, s, u
                  return {
                    ...(a.ruleId ? { id: a.ruleId } : {}),
                    name: `${e} ${(null == (i = Ui[a.level]) ? void 0 : i.label) || a.level}阈值告警`,
                    service: ('service' === l.subject.type && l.subject.id) || 'all',
                    metric: l.metricRef,
                    operator: a.operator,
                    threshold: a.threshold,
                    unit:
                      a.unit ||
                      (null == (r = null == (t = l.display) ? void 0 : t.value) ? void 0 : r.unit) ||
                      (null == (s = null == (n = l.display) ? void 0 : n.yAxis) ? void 0 : s.unit) ||
                      '',
                    duration: a.duration || 5,
                    level: a.level || 'warning',
                    enabled: !0,
                    channels: (null == (u = a.channels) ? void 0 : u.length) ? a.channels : ['Email']
                  }
                })
              : []
          })(e, l)
          return i.length
            ? Promise.all(
                i.map((e) => {
                  if (null == a ? void 0 : a.createNew) {
                    const { id: l, ...a } = e
                    return W(a)
                  }
                  return e.id ? G({ ...e, id: e.id }) : W(e)
                })
              )
            : []
        },
        Ii = async (e) => {
          let l = 0,
            a = 0
          return {
            widgets: await Promise.all(
              e.map(async (e) => {
                const i = kl(e)
                if ('query-card' !== i.kind) return i
                const t = Cl(i)
                if (!t || !Ae(t.alert, { includeDisabled: !0 }).length) return i
                try {
                  const e = await ji(i.title, t, { createNew: !0 })
                  ;(l += e.length),
                    ((e, l) => {
                      var a
                      if (!l.length) return
                      const i = Ae(e.alert, { includeDisabled: !0 }).map((e, a) => {
                          var i
                          return { ...e, ruleId: (null == (i = l[a]) ? void 0 : i.id) || e.ruleId }
                        }),
                        t = e.alert
                      e.alert = {
                        enabled: (null == t ? void 0 : t.enabled) ?? !0,
                        operator: (null == t ? void 0 : t.operator) || '>',
                        threshold: (null == t ? void 0 : t.threshold) ?? 0,
                        unit: null == t ? void 0 : t.unit,
                        duration: null == t ? void 0 : t.duration,
                        level: null == t ? void 0 : t.level,
                        channels: null == t ? void 0 : t.channels,
                        ruleId: null == (a = i[0]) ? void 0 : a.ruleId,
                        rules: i
                      }
                    })(t, e)
                } catch (r) {
                  a += 1
                }
                return i
              })
            ),
            persistedCount: l,
            failedCount: a
          }
        },
        Ei = (e) => {
          var l, a, i, t
          const r = e.allowedAggregations.includes(Ta.value.aggregation)
              ? Ta.value.aggregation
              : e.allowedAggregations[0] || 'avg',
            n = e.recommendedVisualizations.includes(Ta.value.visualizationHint || 'line')
              ? Ta.value.visualizationHint
              : e.recommendedVisualizations[0] || 'line',
            s = e.scope.includes(Ta.value.scope) ? Ta.value.scope : e.scope[0] || 'tenant',
            u = 'mixed' === e.sourceKind || 'auto' === e.sourceKind ? Ta.value.sourceKind || 'auto' : e.sourceKind,
            o = e.subjectKinds.includes((null == (l = Ta.value.subject) ? void 0 : l.type) || 'system')
              ? Ta.value.subject || { type: 'system' }
              : { type: e.subjectKinds[0] || 'system' },
            v = '%' === e.unit || e.name.toLowerCase().includes('cpu') || e.name.toLowerCase().includes('percent')
          if (
            (wi({
              metricRef: e.name,
              aggregation: r,
              visualizationHint: n,
              scope: s,
              sourceKind: u,
              subject: o,
              display: {
                ...(Ta.value.display || {}),
                value: v
                  ? { min: 0, max: 100, unit: '%' }
                  : {
                      ...((null == (a = Ta.value.display) ? void 0 : a.value) || {}),
                      unit:
                        e.unit ||
                        (null == (t = null == (i = Ta.value.display) ? void 0 : i.value) ? void 0 : t.unit) ||
                        ''
                    }
              }
            }),
            'query-statement' === Ba.value)
          ) {
            const l = {
              ...Ta.value,
              metricRef: e.name,
              aggregation: r,
              visualizationHint: n,
              scope: s,
              sourceKind: u,
              subject: o
            }
            Gl.value = JSON.stringify({ type: 'queryspec', version: 1, query: l }, null, 2)
          }
        },
        Ti = (e) => {
          fi({ editor: { ...Pa.value, queryEditMode: e } }),
            (Fl.value = null),
            (Jl.value = ''),
            (Yl.value = null),
            'query-statement' === e &&
              (Gl.value = JSON.stringify({ type: 'queryspec', version: 1, query: Ta.value }, null, 2))
        },
        Bi = (e) => {
          ;(Dl.value = yi(ie(e, ka.value))),
            'query-card' === e &&
              (Gl.value = JSON.stringify({ type: 'queryspec', version: 1, query: Dl.value.config.query }, null, 2))
        },
        Di = (e) => {
          const l = yi(e),
            a = ne(l),
            i = a.displayedMetrics[0]
          if ('metric-summary' === l.kind) {
            const e = l.config.metricKey,
              t = i || e
            return yi({ ...l, config: { ...l.config, metricKey: t }, editor: { ...a, displayedMetrics: t ? [t] : [] } })
          }
          if ('trend' === l.kind) {
            const e = l.config.metric,
              t = i || e
            return yi({ ...l, config: { ...l.config, metric: t }, editor: { ...a, displayedMetrics: t ? [t] : [] } })
          }
          if ('darwin-infra-summary' === l.kind) {
            const e = l.config.metric,
              t = i || e
            return yi({ ...l, config: { ...l.config, metric: t }, editor: { ...a, displayedMetrics: t ? [t] : [] } })
          }
          if ('darwin-infra-trend' === l.kind) {
            const e = l.config.metric,
              t = i || e
            return yi({ ...l, config: { ...l.config, metric: t }, editor: { ...a, displayedMetrics: t ? [t] : [] } })
          }
          return l
        },
        Vi = () => {
          if (Il.value) return void ma()
          if (!za.value) return
          const e = se.find((e) => {
            const l = Sa.value.get(e.capability)
            return e.frontendReady && (null == l ? void 0 : l.available)
          })
          Bi((null == e ? void 0 : e.kind) || 'metric-summary'), (Bl.value = 'create'), (El.value = !0)
        },
        Ni = () => {
          if (Vl.value || !za.value || '1' !== e.query.startAdd) return
          const l = 'string' == typeof e.query.prefillMetric ? e.query.prefillMetric : ''
          if (!l) return
          const a = Ml.value.find((e) => e.name === l)
          if (!a && 'empty' === xl.value) return
          ;(Vl.value = !0), Bi('query-card')
          const i =
              'string' == typeof e.query.prefillTitle && e.query.prefillTitle.trim()
                ? e.query.prefillTitle.trim()
                : (null == a ? void 0 : a.description) && '暂无描述' !== a.description
                  ? a.description
                  : l,
            t = 'string' == typeof e.query.prefillType ? e.query.prefillType : '',
            r =
              'stat' === t
                ? 'number'
                : 'distribution' === t
                  ? 'bar'
                  : (null == a ? void 0 : a.recommendedVisualizations[0]) || 'line'
          fi({ title: i, editor: { ...Pa.value, queryEditMode: 'form-builder', visualization: r } }),
            a ? Ei(a) : wi({ metricRef: l }),
            (Bl.value = 'create'),
            (El.value = !0)
        },
        Ki = async () => {
          var e, l, a, i, t
          if (Il.value) ma()
          else if (!Tl.value && za.value) {
            Tl.value = !0
            try {
              if (
                'query-card' === Dl.value.kind &&
                'query-statement' === Ba.value &&
                !(() => {
                  const e = Ke(Gl.value)
                  return e.query
                    ? (fi({
                        config: { query: e.query },
                        editor: {
                          ...Pa.value,
                          queryEditMode: 'query-statement',
                          timeRange: String(e.query.timeRange || '-1h').replace(/^-/, ''),
                          visualization: e.query.visualizationHint || Pa.value.visualization
                        }
                      }),
                      (Yl.value = { valid: !0, issues: ['QuerySpec 已应用，可继续预览或保存。'], supported: !1 }),
                      (Fl.value = null),
                      (Jl.value = ''),
                      !0)
                    : ((Yl.value = { valid: !1, issues: e.issues, supported: !1 }), !1)
                })()
              )
                return
              const n = Di(Dl.value),
                s = ((e) => {
                  var l, a, i, t
                  if (!e.title.trim()) return '请输入组件标题'
                  if (
                    ['metric-summary', 'trend', 'darwin-infra-summary', 'darwin-infra-trend'].includes(e.kind) &&
                    !(null == (a = null == (l = e.editor) ? void 0 : l.displayedMetrics) ? void 0 : a[0])
                  )
                    return '请先选择一个指标'
                  if ('query-card' === e.kind) {
                    const l = Cl(e)
                    if (!(null == l ? void 0 : l.metricRef)) return '请先填写指标标识'
                    if (!ze(l.scope || Pe.value, Me())) return '当前用户无权访问该数据范围'
                    if (!Re(l.sourceKind || 'auto', Me())) return '当前用户无权使用该数据来源'
                    if (
                      'system' !== (null == (i = l.subject) ? void 0 : i.type) &&
                      !(null == (t = l.subject) ? void 0 : t.id)
                    )
                      return '请先选择目标服务或实例'
                  }
                  return 'darwin-instance-table' !== e.kind || e.config.serviceId ? '' : '请先选择目标服务'
                })(n)
              if (s) return void v.warning(s)
              if ('query-card' === n.kind) {
                const e = Cl(n)
                if (e) {
                  const l = await T(e, e.scope || Pe.value)
                  if (!l.valid) return void v.warning(l.issues[0] || '当前查询配置未通过校验')
                }
              }
              const u = Di(n)
              if ('query-card' === u.kind) {
                const n = Cl(u)
                if (!n) return
                const s =
                    'update' === Bl.value
                      ? null == (e = ha.value)
                        ? void 0
                        : e.widgets.find((e) => e.id === u.id)
                      : null,
                  o = 'query-card' === (null == s ? void 0 : s.kind) ? Ae(null == (l = Cl(s)) ? void 0 : l.alert) : []
                if (o.length && (null == (a = n.alert) ? void 0 : a.enabled)) {
                  const e = Ae(n.alert, { includeDisabled: !0 }).map((e) => {
                      var l
                      return {
                        ...e,
                        ruleId: e.ruleId || (null == (l = o.find((l) => l.level === e.level)) ? void 0 : l.ruleId)
                      }
                    }),
                    l = n.alert
                  n.alert = {
                    enabled: (null == l ? void 0 : l.enabled) ?? !0,
                    operator: (null == l ? void 0 : l.operator) || '>',
                    threshold: (null == l ? void 0 : l.threshold) ?? 0,
                    unit: null == l ? void 0 : l.unit,
                    duration: null == l ? void 0 : l.duration,
                    level: null == l ? void 0 : l.level,
                    channels: null == l ? void 0 : l.channels,
                    ruleId: null == (i = e[0]) ? void 0 : i.ruleId,
                    rules: e
                  }
                }
                try {
                  const e = await ji(u.title, n)
                  if (e.length) {
                    const l = Ae(n.alert, { includeDisabled: !0 }).map((l, a) => {
                        var i
                        return { ...l, ruleId: (null == (i = e[a]) ? void 0 : i.id) || l.ruleId }
                      }),
                      a = n.alert
                    n.alert = {
                      enabled: (null == a ? void 0 : a.enabled) ?? !0,
                      operator: (null == a ? void 0 : a.operator) || '>',
                      threshold: (null == a ? void 0 : a.threshold) ?? 0,
                      unit: null == a ? void 0 : a.unit,
                      duration: null == a ? void 0 : a.duration,
                      level: null == a ? void 0 : a.level,
                      channels: null == a ? void 0 : a.channels,
                      ruleId: null == (t = l[0]) ? void 0 : t.ruleId,
                      rules: l
                    }
                  }
                } catch (r) {
                  v.warning('卡片会继续保存，但告警规则创建失败，请稍后到告警规则页补建')
                }
              }
              'create' === Bl.value
                ? (vi((e) => ({ ...e, widgets: [...e.widgets, kl(u)] })), v.success('组件已添加到当前面板'))
                : (vi((e) => ({ ...e, widgets: e.widgets.map((e) => (e.id === u.id ? kl(u) : e)) })),
                  v.success('组件配置已更新')),
                (El.value = !1),
                rt()
            } finally {
              Tl.value = !1
            }
          }
        },
        Fi = () => {
          ;(ca.value = null), (pa.value = null)
        },
        Ji = () => {
          window.removeEventListener('pointermove', Gi),
            window.removeEventListener('pointerup', Xi),
            window.removeEventListener('pointercancel', Xi)
        },
        Hi = (e) => ('S' === e ? 'span 3' : 'M' === e ? 'span 6' : '1 / -1'),
        Qi = () => {
          const e = sa.value
          if (!e) return
          const l = Ca.value
            .map((e) => {
              const l = va.get(e.id) || null,
                a = oa.get(e.id) || null
              return l && a ? { shell: l, gridItem: a } : null
            })
            .filter((e) => Boolean(e))
          if (!l.length) return
          if (
            (e.style.removeProperty('grid-auto-rows'),
            l.forEach(({ gridItem: e }) => {
              e.style.removeProperty('grid-row-end'), e.style.removeProperty('min-height')
            }),
            'undefined' == typeof window || window.innerWidth <= 960)
          )
            return
          const a = window.getComputedStyle(e),
            i = Number.parseFloat(a.rowGap || a.gap || '16') || 16
          ;(e.style.gridAutoRows = '1px'),
            l.forEach(({ shell: e, gridItem: l }) => {
              const a = e.getBoundingClientRect().height,
                t = Math.max(1, Math.ceil((a + i) / (1 + i)))
              ;(l.style.gridRowEnd = `span ${t}`), (l.style.minHeight = 1 * t + (t - 1) * i + 'px')
            })
        },
        Wi = () => {
          Qi()
        },
        Gi = (e) => {
          const l = ca.value
          if (!l || e.pointerId !== l.pointerId) return
          const a = { ...l, currentX: e.clientX, currentY: e.clientY },
            i = Math.hypot(a.currentX - a.startX, a.currentY - a.startY)
          ;(a.active = l.active || i > 6),
            (ca.value = a),
            a.active &&
              (pa.value = ((e, l) => {
                var a, i, t
                const r = document.elementsFromPoint(e, l).find((e) => {
                    var l
                    return null == (l = null == e ? void 0 : e.closest) ? void 0 : l.call(e, '[data-widget-id]')
                  }),
                  n =
                    (null == (i = null == (a = null == r ? void 0 : r.closest) ? void 0 : a.call(r, '[data-widget-id]'))
                      ? void 0
                      : i.getAttribute('data-widget-id')) ||
                    (null ==
                    (t = Array.from(va.entries())
                      .map(([e, l]) => ({ widgetId: e, rect: l.getBoundingClientRect() }))
                      .sort(
                        (a, i) =>
                          Math.hypot(e - (a.rect.left + a.rect.width / 2), l - (a.rect.top + a.rect.height / 2)) -
                          Math.hypot(e - (i.rect.left + i.rect.width / 2), l - (i.rect.top + i.rect.height / 2))
                      )[0])
                      ? void 0
                      : t.widgetId) ||
                    ''
                if (!n) return null
                const s = va.get(n)
                if (!s) return null
                const u = s.getBoundingClientRect(),
                  o = Ca.value.find((e) => e.id === n),
                  v =
                    'L' === (null == o ? void 0 : o.size) || l < u.top || l > u.bottom
                      ? l < u.top + u.height / 2
                        ? 'before'
                        : 'after'
                      : e < u.left + u.width / 2
                        ? 'before'
                        : 'after'
                return { targetId: n, placement: v }
              })(e.clientX, e.clientY))
        },
        Xi = (e) => {
          const l = ca.value
          var a, i, t
          l &&
            e.pointerId === l.pointerId &&
            (l.active &&
              pa.value &&
              ((a = l.dragId),
              (i = pa.value.targetId),
              (t = pa.value.placement),
              a &&
                i &&
                a !== i &&
                vi((e) => {
                  const l = Ca.value.map((e) => e.id),
                    r = (function (e, l, a, i) {
                      if (!l || !a || l === a) return e
                      const t = [...e],
                        r = t.indexOf(l),
                        n = t.indexOf(a)
                      if (-1 === r || -1 === n) return e
                      const [s] = t.splice(r, 1),
                        u = 'before' === i ? n : n + 1,
                        o = r < u ? u - 1 : u
                      return t.splice(o, 0, s), t
                    })(l, a, i, t)
                  return r === l ? e : { ...e, widgets: Ie(e.widgets, r) }
                })),
            Ji(),
            Fi())
        },
        Yi = () => {
          var e
          Il.value
            ? ma()
            : ((ta.value = 'duplicate'),
              (ra.value = `${(null == (e = ha.value) ? void 0 : e.name) || '面板'} 副本`),
              (Nl.value = !0))
        },
        Zi = () => {
          var e
          Il.value
            ? ma()
            : 'user' === (null == (e = ha.value) ? void 0 : e.kind) &&
              ((ta.value = 'rename'), (ra.value = ha.value.name), (Nl.value = !0))
        },
        et = () => {
          var e
          if (Il.value) return void ma()
          const l = ra.value.trim()
          if (l) {
            if ('duplicate' === ta.value) {
              const a = ue(l, (null == (e = ha.value) ? void 0 : e.widgets) || []),
                i = { ...Ul.value, [a.id]: kl(a) }
              ni([...Ol.value, a], i), (Ll.value = a.id), v.success('已创建用户面板')
            } else vi((e) => ({ ...e, name: l })), v.success('已更新面板名称')
            Nl.value = !1
          } else v.warning('请输入面板名称')
        },
        lt = () => {
          var e
          if (Il.value) return void ma()
          if ('user' !== (null == (e = ha.value) ? void 0 : e.kind)) return
          const l = Ol.value.filter((e) => {
              var l
              return e.id !== (null == (l = ha.value) ? void 0 : l.id)
            }),
            a = { ...Ul.value }
          if ((delete a[ha.value.id], !l.length)) {
            const e = oe()
            l.push(e), (a[e.id] = kl(e))
          }
          ;(Ll.value = l[0].id), ni(l, a), v.success('已删除用户面板')
        },
        at = () => {
          var e
          if (Il.value) return void ma()
          const l = Ul.value[(null == (e = ha.value) ? void 0 : e.id) || '']
          if (!l || !ha.value) return void v.warning('当前面板没有可恢复的基线')
          const a = Ol.value.map((e) => {
            var a
            return e.id === (null == (a = ha.value) ? void 0 : a.id) ? kl(l) : e
          })
          ni(a), v.success('user' === ha.value.kind ? '已恢复到用户面板初始版本' : '已恢复到模板初始定义'), rt()
        },
        it = () =>
          JSON.stringify({
            panelId: Ll.value,
            scope: Pe.value,
            service: Oe.value.service || '',
            timeRange: o.timeRange,
            widgets: Ca.value.map((e) => ({ id: e.id, kind: e.kind, size: e.size, config: e.config, editor: e.editor }))
          }),
        tt = async () => {
          if (da.inFlightPromise) return da.inFlightPromise
          const { requests: e, cards: l } = ve({
            widgets: Ca.value,
            scope: Pe.value,
            scopedServiceName: Oe.value.service,
            services: Ee.value,
            refreshGenerationId: `${Date.now()}`,
            autoRefresh: !0
          })
          if (!l.length) return rt({ silent: !0 })
          const a = da.latestToken + 1
          return (
            (da.latestToken = a),
            (da.inFlightKey = `query-cards:${it()}`),
            (da.inFlightPromise = Promise.all(e.map((e) => B(e)))
              .then(async (e) => {
                a === da.latestToken &&
                  ((pl.value = de(e.flatMap((e) => (null == e ? void 0 : e.items) || []))),
                  (aa.value = 0),
                  await _(),
                  Qi(),
                  oi())
              })
              .catch((e) => {
                a === da.latestToken && (aa.value += 1)
              })
              .finally(() => {
                da.latestToken === a && ((da.inFlightKey = ''), (da.inFlightPromise = null))
              })),
            da.inFlightPromise
          )
        },
        rt = (e = {}) => {
          const l = it(),
            a = Date.now()
          if (!e.force && da.inFlightPromise && da.inFlightKey === l) return da.inFlightPromise
          if (!e.force && da.lastCompletedKey === l && a - da.lastCompletedAt < 1500) return Promise.resolve()
          const i = da.latestToken + 1
          return (
            (da.latestToken = i),
            (da.inFlightKey = l),
            (da.inFlightPromise = (async (e, l = {}) => {
              const a = Boolean(l.silent)
              a || (Ue.value = !0)
              try {
                const l = 'custom' === (i = o.timeRange) ? void 0 : `-${i}`,
                  a = Ca.value,
                  t = (e) => {
                    var l, a, i
                    return {
                      requests: Array.isArray(null == e ? void 0 : e.requests)
                        ? e.requests
                        : Array.isArray(null == (l = null == e ? void 0 : e.series) ? void 0 : l.requests)
                          ? e.series.requests
                          : [],
                      errors: Array.isArray(null == e ? void 0 : e.errors)
                        ? e.errors
                        : Array.isArray(null == (a = null == e ? void 0 : e.series) ? void 0 : a.errors)
                          ? e.series.errors
                          : [],
                      latency: Array.isArray(null == e ? void 0 : e.latency)
                        ? e.latency
                        : Array.isArray(null == (i = null == e ? void 0 : e.series) ? void 0 : i.latency)
                          ? e.series.latency
                          : []
                    }
                  },
                  r = a.some((e) => {
                    if ('trend' === e.kind) {
                      const l = e.config.groupBy
                      return 'overall' === l || !l
                    }
                    return [
                      'metric-summary',
                      'query-card',
                      'darwin-infra-summary',
                      'darwin-infra-trend',
                      'darwin-instance-table'
                    ].includes(e.kind)
                  }),
                  n = a.some((e) => 'trend' === e.kind && 'env' === e.config.groupBy),
                  s = a.some((e) => 'trend' === e.kind && 'team' === e.config.groupBy),
                  u = a.some((e) => 'risk-service' === e.kind),
                  v = a.some((e) => 'incident' === e.kind),
                  d = a.some((e) => 'ingest-status' === e.kind),
                  c = a.some((e) =>
                    [
                      'query-card',
                      'metric-summary',
                      'trend',
                      'darwin-infra-summary',
                      'darwin-infra-trend',
                      'darwin-instance-table'
                    ].includes(e.kind)
                  ),
                  p = D({ keyword: Oe.value.service || void 0, page: 1, pageSize: 100, scope: Pe.value }),
                  m = Promise.all([
                    V({ timeRange: l, scope: Pe.value }),
                    r ? N({ timeRange: l, groupBy: 'overall', scope: Pe.value }) : Promise.resolve(null),
                    n ? N({ timeRange: l, groupBy: 'env', scope: Pe.value }) : Promise.resolve(null),
                    s ? N({ timeRange: l, groupBy: 'team', scope: Pe.value }) : Promise.resolve(null),
                    u ? K({ scope: Pe.value }) : Promise.resolve(null),
                    d ? F({ scope: Pe.value }) : Promise.resolve(null),
                    v ? J({ timeRange: l, scope: Pe.value }) : Promise.resolve([])
                  ]),
                  g = await p,
                  y = ((null == g ? void 0 : g.items) || []).map((e) => {
                    var l, a, i, t, r, n, s, u, o, v, d
                    return {
                      id: null == (l = e.identity) ? void 0 : l.id,
                      name: null == (a = e.identity) ? void 0 : a.name,
                      owner: null == (i = e.identity) ? void 0 : i.owner,
                      team: null == (t = e.identity) ? void 0 : t.team,
                      env: null == (r = e.identity) ? void 0 : r.env,
                      region: null == (n = e.identity) ? void 0 : n.region,
                      version: null == (s = e.identity) ? void 0 : s.runtime,
                      tags: (null == (u = e.identity) ? void 0 : u.tags) || [],
                      health: null == (o = e.identity) ? void 0 : o.healthStatus,
                      status:
                        'healthy' === (null == (v = e.identity) ? void 0 : v.healthStatus)
                          ? 'running'
                          : 'unknown' === (null == (d = e.identity) ? void 0 : d.healthStatus)
                            ? 'unknown'
                            : 'error',
                      qps: e.qps,
                      latency: e.p95Latency,
                      errorRate: e.errorRate,
                      instances: e.instanceCount,
                      lastDeploy: e.lastDeployAt
                    }
                  })
                if (e !== da.latestToken) return
                Ee.value = y
                const f = Array.from(
                    new Set(
                      a
                        .filter(
                          (e) =>
                            ('metric-summary' === e.kind || 'trend' === e.kind) &&
                            !ce({ widget: e, scope: Pe.value, scopedServiceName: Oe.value.service, services: y })
                              .supported
                        )
                        .map((e) => ne(e).timeRange)
                    )
                  ),
                  w = o.timeRange,
                  _ = ((e) => {
                    const l = e.visibleWidgetRanges.filter((l) => l !== e.pageWidgetRange),
                      a = l.flatMap((e) => ['overall', 'env', 'team'].map((l) => ({ range: e, groupBy: l })))
                    return { summaryFetchRanges: l, trendFetchPairs: a }
                  })({ visibleWidgetRanges: f, pageWidgetRange: w }),
                  b = Promise.all([
                    c
                      ? Promise.all(
                          _.summaryFetchRanges.map(async (e) => {
                            var l
                            return [
                              e,
                              (null == (l = await V({ timeRange: `-${e}`, scope: Pe.value })) ? void 0 : l.totals) || {}
                            ]
                          })
                        )
                      : Promise.resolve([]),
                    c
                      ? Promise.all(
                          _.trendFetchPairs
                            .filter(({ groupBy: e }) => ('overall' === e ? r : 'env' === e ? n : s))
                            .map(async ({ range: e, groupBy: l }) => [
                              `${e}:${l}`,
                              t(await N({ timeRange: `-${e}`, groupBy: l, scope: Pe.value }))
                            ])
                        )
                      : Promise.resolve([])
                  ]),
                  { requests: h, cards: q } = ve({
                    widgets: a,
                    scope: Pe.value,
                    scopedServiceName: Oe.value.service,
                    services: y,
                    refreshGenerationId: `${Date.now()}`
                  }),
                  k =
                    q.length && c
                      ? Promise.all(h.map((e) => B(e))).then((e) =>
                          de(e.flatMap((e) => (null == e ? void 0 : e.items) || []))
                        )
                      : Promise.resolve({}),
                  [S, z, R, M, x, $, A] = await m
                if (e !== da.latestToken) return
                const C = (null == S ? void 0 : S.totals) || {}
                ;(Te.value = {
                  serviceCount: C.serviceCount ?? null,
                  healthyServices: C.healthyServices ?? null,
                  activeAlerts: C.activeIncidents ?? null,
                  errorRate: C.errorRate ?? null,
                  p95Latency: C.p95Latency ?? null,
                  totalRequests: C.totalRequests ?? null
                }),
                  (Be.value = Array.isArray(A) ? A : []),
                  (De.value = $ || null),
                  (Ve.value = {
                    highRiskServices: Array.isArray(null == x ? void 0 : x.highRiskServices) ? x.highRiskServices : [],
                    recentDegradedServices: Array.isArray(null == x ? void 0 : x.recentDegradedServices)
                      ? x.recentDegradedServices
                      : []
                  }),
                  (Ne.value = { overall: t(z || {}), env: t(R || {}), team: t(M || {}) })
                const [P, O] = await b
                if (e !== da.latestToken) return
                const U = [[w, C], ...P],
                  L = [
                    ...['overall', 'env', 'team']
                      .filter((e) => ('overall' === e ? r : 'env' === e ? n : s))
                      .map((e) => [`${w}:${e}`, t('overall' === e ? z || {} : 'env' === e ? R || {} : M || {})]),
                    ...O
                  ]
                ;(dl.value = Object.fromEntries(L)),
                  (cl.value = Object.fromEntries(
                    U.map(([e, l]) => [
                      e,
                      {
                        serviceCount: l.serviceCount ?? null,
                        activeIncidents: l.activeIncidents ?? null,
                        totalRequests: l.totalRequests ?? null,
                        errorRate: l.errorRate ?? null,
                        p95Latency: l.p95Latency ?? null
                      }
                    ])
                  ))
                const j = await k
                if (e !== da.latestToken) return
                ;(pl.value = j), (yl.value = { catalog: !0, summary: !0, incidents: !1, ingest: !1 }), (aa.value = 0)
              } catch (t) {
                if (e !== da.latestToken) return
                aa.value += 1
              } finally {
                if (e !== da.latestToken) return
                a || (Ue.value = !1), await _(), Qi(), oi()
              }
              var i
            })(i, e).finally(() => {
              da.latestToken === i &&
                ((da.lastCompletedKey = l),
                (da.lastCompletedAt = Date.now()),
                (da.inFlightKey = ''),
                (da.inFlightPromise = null))
            })),
            da.inFlightPromise
          )
        },
        nt = l(() => Ne.value.overall),
        st = l(() => new Map(Ee.value.map((e) => [e.id || e.name, e]))),
        ut = l(() => {
          var e, l, a
          const i =
              'number' == typeof Te.value.healthyServices
                ? Te.value.healthyServices
                : Ee.value.filter((e) => 'healthy' === e.health).length,
            t = 'number' == typeof Te.value.serviceCount ? Te.value.serviceCount : null,
            r = 'number' == typeof Te.value.activeAlerts ? Te.value.activeAlerts : null,
            n = 'number' == typeof Te.value.errorRate ? Te.value.errorRate : null,
            s = 'number' == typeof Te.value.p95Latency ? Te.value.p95Latency : null,
            u = 'number' == typeof Te.value.totalRequests ? Te.value.totalRequests : null,
            v = 'number' == typeof t && t > 0 ? Math.round((i / Math.max(t, 1)) * 100) : null,
            d = Be.value.length,
            c = nt.value.requests.map((e) => e.value).filter((e) => 'number' == typeof e),
            p = nt.value.latency.map((e) => e.value).filter((e) => 'number' == typeof e),
            m = nt.value.requests
              .map((e, l) => {
                var a
                const i = e.value,
                  t = null == (a = nt.value.errors[l]) ? void 0 : a.value
                return 'number' != typeof i || 'number' != typeof t || i <= 0 ? null : (t / i) * 100
              })
              .filter((e) => null !== e),
            g = De.value
              ? [
                  null == (e = De.value.metrics) ? void 0 : e.status,
                  null == (l = De.value.logs) ? void 0 : l.status,
                  null == (a = De.value.traces) ? void 0 : a.status
                ].filter((e) => 'string' == typeof e)
              : [],
            y = g.filter((e) => 'healthy' === e).length,
            f = g.length,
            w = 'number' == typeof t ? Math.max(t - i, 0) : null,
            _ =
              'number' == typeof r && 'number' == typeof t && t > 0
                ? `${(r / Math.max(t, 1)).toFixed(1)}/服务`
                : '等待服务基线',
            b = $l(c),
            h = $l(m, '%', !0),
            q = $l(p, 'ms', !0)
          return [
            {
              key: 'service-count',
              label: '服务总数',
              value: Te.value.serviceCount ?? '未知',
              baseline: `健康 ${i}`,
              delta: `待关注 ${'number' == typeof w ? w : '未知'}`,
              mom: 'number' == typeof v ? `健康率 ${v}%` : '等待健康分布',
              deltaDirection: 'number' == typeof w && w > 0 ? 'up' : 'flat'
            },
            {
              key: 'healthy-services',
              label: '健康服务数',
              value: i,
              baseline: `总数 ${Te.value.serviceCount ?? '未知'}`,
              delta: `待关注 ${'number' == typeof w ? w : '未知'}`,
              mom: 'number' == typeof v ? `占比 ${v}%` : '等待健康分布',
              deltaDirection: 'number' == typeof w && w > 0 ? 'down' : 'flat'
            },
            {
              key: 'active-alerts',
              label: '活跃告警',
              value: Te.value.activeAlerts ?? '未知',
              baseline: `事件 ${d}`,
              delta: `活跃 ${Te.value.activeAlerts ?? '未知'}`,
              mom: 0 === d && 0 === r ? '当前无关键事件' : 'number' == typeof r ? _ : '等待事件数据',
              deltaDirection: 'number' == typeof r && r > 0 ? 'up' : 'flat',
              route: { path: '/home/alerts/inbox', query: { status: 'active', timeRange: o.timeRange } }
            },
            { key: 'total-requests', label: '请求总量', value: null === u ? '未知' : u, ...b },
            {
              key: 'error-rate',
              label: '全局错误率',
              value: null === n ? '未知' : `${n}%`,
              ...h,
              route: { path: '/home/investigate/metrics', query: { timeRange: o.timeRange } }
            },
            {
              key: 'p95-latency',
              label: 'P95 延迟',
              value: null === s ? '未知' : `${s}ms`,
              ...q,
              route: { path: '/home/investigate/traces', query: { timeRange: o.timeRange } }
            },
            {
              key: 'ingest-success-rate',
              label: 'ingest 成功率',
              value: 3 === f ? `${Math.round((y / 3) * 100)}%` : '未知',
              baseline: `已知 ${f}/3`,
              delta: `异常 ${3 === f ? Math.max(3 - y, 0) : '未知'}`,
              mom: f ? `正常 ${y}/${f}` : '等待 ingest 状态',
              deltaDirection: 3 === f && Math.max(3 - y, 0) > 0 ? 'down' : 'flat',
              route: { path: '/home/admin/ingestion', query: { timeRange: o.timeRange } }
            }
          ]
        }),
        ot = l(() => new Map(ut.value.map((e) => [e.key, e]))),
        vt = (e, l = '') => ('number' == typeof e || ('string' == typeof e && e.length > 0) ? `${e}${l}` : '未知'),
        dt = (e) => {
          const l =
              'number' == typeof e.absoluteDelta ? `${e.absoluteDelta > 0 ? '+' : ''}${we(e.absoluteDelta)}` : '—',
            a =
              'number' == typeof e.relativeDelta
                ? `${e.relativeDelta > 0 ? '+' : ''}${e.relativeDelta.toFixed(1)}%`
                : '—'
          return 'absolute' === e.display ? l : 'both' === e.display ? `${a} · ${l}` : a
        },
        ct = (e) => {
          const l = 'number' == typeof e.baselineValue ? `基线 ${we(e.baselineValue)}` : '暂无基线数据',
            a = 'number' == typeof e.absoluteDelta ? `差值 ${we(e.absoluteDelta)}` : '暂无差值',
            i = 'number' == typeof e.relativeDelta ? `变化 ${e.relativeDelta.toFixed(1)}%` : '暂无变化率'
          return `${e.label}，${l}，${a}，${i}`
        },
        pt = (e) => {
          if (!e) return null
          const l = 'neutral' === e.sentiment ? e.direction : e.sentiment,
            i =
              'up' === e.direction
                ? 'M2.75 11.25L6.25 7.75L9.25 9.75L13.25 4.75'
                : 'down' === e.direction
                  ? 'M2.75 4.75L6.25 8.25L9.25 6.25L13.25 11.25'
                  : 'M2.75 8H13.25'
          return a(
            'div',
            {
              class: [
                'overview-page__query-number-trend',
                `overview-page__query-number-trend--${e.sentiment}`,
                `overview-page__query-number-trend--${e.direction}`,
                `overview-page__query-number-trend--tone-${l}`
              ],
              title: ct(e),
              'aria-label': ct(e)
            },
            [
              a(
                'svg',
                { class: 'overview-page__query-number-trend-icon', viewBox: '0 0 16 16', 'aria-hidden': 'true' },
                [
                  a('path', { d: i }, null),
                  a(
                    'circle',
                    {
                      cx: '13.25',
                      cy: 'down' === e.direction ? '11.25' : 'up' === e.direction ? '4.75' : '8',
                      r: '1.35'
                    },
                    null
                  )
                ]
              ),
              a('span', { class: 'overview-page__query-number-trend-value' }, [dt(e)])
            ]
          )
        },
        mt = (e, l) => {
          var a, i
          const t = null == (a = null == e ? void 0 : e.display) ? void 0 : a.value,
            r = null == (i = null == e ? void 0 : e.display) ? void 0 : i.yAxis,
            n = l && 'unit' in l ? l.unit : ''
          return {
            min: (null == t ? void 0 : t.min) ?? (null == r ? void 0 : r.min),
            max: (null == t ? void 0 : t.max) ?? (null == r ? void 0 : r.max),
            unit: (null == t ? void 0 : t.unit) ?? (null == r ? void 0 : r.unit) ?? n ?? ''
          }
        },
        gt = (e) =>
          Ae(null == e ? void 0 : e.alert).map((l) => {
            var a, i, t, r, n, s
            return {
              value: l.threshold,
              label: (null == (a = Ui[l.level]) ? void 0 : a.label) || '阈值',
              unit:
                l.unit ||
                (null == (t = null == (i = null == e ? void 0 : e.display) ? void 0 : i.value) ? void 0 : t.unit) ||
                (null == (n = null == (r = null == e ? void 0 : e.display) ? void 0 : r.yAxis) ? void 0 : n.unit) ||
                '',
              level: l.level,
              color: null == (s = Ui[l.level]) ? void 0 : s.color
            }
          }),
        yt = (e) => {
          if ('query-card' !== e.kind) return null
          const l = e.config.query,
            i = Ae(l.alert)
          return i.length
            ? a('div', { class: 'overview-page__widget-alert-summary' }, [
                i.map((e) => {
                  var i, t, r, n, o
                  const v = (null == (i = e.channels) ? void 0 : i.length) ? e.channels.join('、') : 'Email',
                    d = Ui[e.level]
                  return a('span', { class: 'overview-page__widget-alert-rule', key: `${e.level}-${e.threshold}` }, [
                    a(
                      u,
                      { size: 'small', bordered: !1, type: (null == d ? void 0 : d.tagType) || 'warning' },
                      { default: () => [(null == d ? void 0 : d.label) || e.level] }
                    ),
                    a('span', null, [
                      e.operator,
                      s(' '),
                      e.threshold,
                      e.unit ||
                        (null == (r = null == (t = l.display) ? void 0 : t.value) ? void 0 : r.unit) ||
                        (null == (o = null == (n = l.display) ? void 0 : n.yAxis) ? void 0 : o.unit) ||
                        '',
                      s('，持续'),
                      ' ',
                      e.duration || 5,
                      s(' 分钟，通知 '),
                      v
                    ])
                  ])
                })
              ])
            : null
        },
        ft = (e, l) => {
          var i, t, r, n, s, u
          const o = pl.value[e.id],
            v = ('query-card' === e.kind ? e.config.query : null) || l,
            d = mt(v, o),
            c = gt(v),
            p = (l) => a('div', { class: 'overview-page__query-card-body' }, [yt(e), l])
          if (!o)
            return p(a(q, { description: `${e.title} 当前暂无查询结果。`, class: 'overview-page__future-empty' }, null))
          if ('number' === o.kind) {
            const l = ((e, l) => {
                if ('number' != typeof l || !Number.isFinite(l)) return null
                const a = Ae(null == e ? void 0 : e.alert).filter((e) => {
                  return (
                    (a = l),
                    (i = e),
                    !(!Number.isFinite(a) || !Number.isFinite(i.threshold)) &&
                      ('>' === i.operator
                        ? a > i.threshold
                        : '>=' === i.operator
                          ? a >= i.threshold
                          : '<' === i.operator
                            ? a < i.threshold
                            : '<=' === i.operator
                              ? a <= i.threshold
                              : a === i.threshold)
                  )
                  var a, i
                })
                return a.length ? a.sort((e, l) => Li[l.level] - Li[e.level])[0].level : null
              })(v, o.value),
              t = 'number' == typeof o.value ? pe(o.value, d.unit) : null
            return p(
              'donut' === (null == (i = e.editor) ? void 0 : i.visualization)
                ? a(
                    me,
                    {
                      value: 'number' == typeof o.value ? o.value : 0,
                      min: d.min ?? 0,
                      max: d.max ?? 100,
                      unit: d.unit || '%',
                      color: 'var(--color-primary-6)',
                      height: 'L' === e.size ? '260px' : '220px',
                      loading: Ue.value
                    },
                    null
                  )
                : a('div', { class: 'overview-page__query-number-card' }, [
                    a('div', { class: 'overview-page__query-number-accent' }, null),
                    a('div', { class: 'overview-page__query-number-value-row' }, [
                      a('div', { class: 'overview-page__query-number-primary' }, [
                        a(
                          'strong',
                          {
                            class: [
                              'overview-page__query-number-value',
                              l ? `overview-page__query-number-value--${l}` : ''
                            ]
                          },
                          [t ? t.value : (o.value ?? '未知')]
                        ),
                        (null == t ? void 0 : t.unit) || d.unit
                          ? a('span', { class: 'overview-page__query-number-unit' }, [
                              (null == t ? void 0 : t.unit) || d.unit
                            ])
                          : null
                      ]),
                      pt(o.compare)
                    ]),
                    a('div', { class: 'overview-page__query-number-meta' }, [
                      a('span', null, [(null == v ? void 0 : v.metricRef) || 'QuerySpec']),
                      a('span', null, [(null == v ? void 0 : v.aggregation) || 'latest'])
                    ])
                  ])
            )
          }
          if ('timeseries' === o.kind)
            return p(
              'bar' === (null == (t = e.editor) ? void 0 : t.visualization)
                ? a(
                    qe,
                    {
                      data: ((null == (n = null == (r = o.series) ? void 0 : r[0]) ? void 0 : n.points) || [])
                        .filter((e) => 'number' == typeof e.value)
                        .map((e) => ({
                          name: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          value: Number(e.value)
                        })),
                      height: 'L' === e.size ? '260px' : '220px',
                      variant: 'monitor',
                      yAxisMin: d.min,
                      yAxisMax: d.max,
                      yAxisUnit: d.unit
                    },
                    null
                  )
                : a(
                    ke,
                    {
                      series: (o.series || []).map((e) => ({ name: e.name, data: e.points })),
                      title: '',
                      height: 'L' === e.size ? '260px' : '220px',
                      area: 'line' === (null == (s = e.editor) ? void 0 : s.visualization),
                      variant: 'monitor',
                      mutedGrid: !0,
                      showLegend: !0,
                      yAxisMin: d.min,
                      yAxisMax: d.max,
                      yAxisUnit: d.unit,
                      thresholdLines: c
                    },
                    null
                  )
            )
          if ('distribution' === o.kind) {
            const l = ((e, l) => {
              const a = ('query-card' === e.kind && e.config.excludeDistributionItems) || []
              if (!a.length) return l.items || []
              const i = new Set(a.map((e) => e.trim()).filter(Boolean))
              return i.size ? (l.items || []).filter((e) => !i.has(e.name)) : l.items || []
            })(e, o)
            return p(
              'donut' === (null == (u = e.editor) ? void 0 : u.visualization)
                ? a(ge, { data: l, height: 'L' === e.size ? '260px' : '220px', variant: 'monitor' }, null)
                : a(qe, { data: l, height: 'L' === e.size ? '260px' : '220px', variant: 'monitor' }, null)
            )
          }
          return 'table' === o.kind
            ? p(
                a(
                  ee,
                  {
                    columns: (o.columns || []).map((e) => ({ title: e.label, key: e.key })),
                    data: o.rows || [],
                    density: 'compact',
                    flexHeight: !1
                  },
                  null
                )
              )
            : p(a(q, { description: `${e.title} 当前暂无查询结果。`, class: 'overview-page__future-empty' }, null))
        },
        wt = (e) => wl[e],
        _t = (e) =>
          'requests' === e || 'errors' === e || 'latency' === e
            ? e
            : 'total-requests' === e
              ? 'requests'
              : 'error-rate' === e
                ? 'errors'
                : 'p95-latency' === e
                  ? 'latency'
                  : null,
        bt = (e, l, a = 'overall') => {
          const i = _t(e)
          if (!i) return []
          const t = (l ? dl.value[`${l}:${a}`] : null) || Ne.value[a] || Ne.value.overall
          return 'errors' === i ? t.errors : 'latency' === i ? t.latency : t.requests
        },
        ht = (e, l) => {
          const a = l ? cl.value[l] : null
          if (a) {
            if ('service-count' === e) return a.serviceCount ?? 0
            if ('active-alerts' === e) return a.activeIncidents ?? 0
            if ('total-requests' === e) return a.totalRequests ?? 0
            if ('error-rate' === e) return a.errorRate ?? 0
            if ('p95-latency' === e) return a.p95Latency ?? 0
          }
          if ('healthy-services' === e) return Te.value.healthyServices ?? 0
          if ('ingest-success-rate' === e) {
            const e = ['metrics', 'logs', 'traces'].filter((e) => {
                var l
                return null == (l = De.value) ? void 0 : l[e]
              }).length,
              l = ['metrics', 'logs', 'traces'].filter((e) => {
                var l, a
                return 'healthy' === (null == (a = null == (l = De.value) ? void 0 : l[e]) ? void 0 : a.status)
              }).length
            return e ? Math.round((l / e) * 100) : 0
          }
          const i = l ? null : ot.value.get(e)
          if (i) return Number(String(i.value).replace(/[^0-9.\-]/g, '')) || 0
          const t = [...bt(e, l)].reverse().find((e) => 'number' == typeof e.value)
          return (null == t ? void 0 : t.value) ?? 0
        },
        qt = (e, l) => {
          var a
          const i = (null == (a = wt(e)) ? void 0 : a.unit) || ''
          return '%' === i
            ? `${l.toFixed(1)}%`
            : 'ms' === i
              ? `${Math.round(l)}ms`
              : Math.abs(l) >= 1e3
                ? `${l.toFixed(0)}`
                : `${l.toFixed(i ? 1 : 0)}${i}`
        },
        kt = (e) => {
          let l = 0
          return e.map((e) => ((l += 'number' == typeof e.value ? e.value : 0), { ...e, value: l }))
        },
        St = (e) => {
          const l = ne(e).notes
          return l ? a('div', { class: 'overview-page__editor-note' }, [s('备注：'), l]) : null
        },
        zt = (e) => {
          const l = ce({ widget: e, scope: Pe.value, scopedServiceName: Oe.value.service, services: Ee.value })
          if (l.supported) return ft(e, l.query)
          switch (e.kind) {
            case 'metric-summary':
              return ((e) =>
                ((e) => {
                  const l = ne(e),
                    i = l.timeRange,
                    t = (l.displayedMetrics.length ? l.displayedMetrics : [e.config.metricKey])
                      .filter((e) => Boolean(e))
                      .map((e) => {
                        var l
                        return {
                          key: e,
                          label: (null == (l = wt(e)) ? void 0 : l.label) || e,
                          value: ht(e, i),
                          series: bt(e, i)
                        }
                      })
                  if (!t.length)
                    return a(q, { description: '当前指标不可用', class: 'overview-page__metric-empty' }, null)
                  const r = t.some((e) => e.series.length > 0)
                  return 'bar' === l.visualization
                    ? a('div', null, [
                        a(
                          qe,
                          {
                            data: t.map((e) => ({ name: e.label, value: Number(e.value) || 0 })),
                            height: 'L' === e.size ? '260px' : '220px'
                          },
                          null
                        ),
                        St(e)
                      ])
                    : 'donut' === l.visualization
                      ? a('div', null, [
                          a(
                            ge,
                            {
                              data: t.map((e) => ({ name: e.label, value: Number(e.value) || 0 })),
                              height: 'L' === e.size ? '260px' : '220px',
                              variant: 'monitor'
                            },
                            null
                          ),
                          St(e)
                        ])
                      : a('div', { class: 'overview-page__metric-summary-grid' }, [
                          t.map((e) =>
                            a('div', { key: e.key, class: 'overview-page__metric-summary-item' }, [
                              a('div', { class: 'overview-page__metric-summary-label' }, [e.label]),
                              a('div', { class: 'overview-page__metric-summary-value' }, [
                                qt(e.key, Number(e.value) || 0)
                              ]),
                              a('div', { class: 'overview-page__metric-summary-extra' }, [
                                r && l.display.showTotal
                                  ? a('span', null, [
                                      s('合计：'),
                                      qt(
                                        e.key,
                                        e.series.reduce((e, l) => e + ('number' == typeof l.value ? l.value : 0), 0) ||
                                          Number(e.value) ||
                                          0
                                      )
                                    ])
                                  : null,
                                r && l.display.showAverage
                                  ? a('span', null, [
                                      s('均值：'),
                                      qt(
                                        e.key,
                                        Rl(e.series.map((e) => e.value).filter((e) => 'number' == typeof e)) ||
                                          Number(e.value) ||
                                          0
                                      )
                                    ])
                                  : null
                              ])
                            ])
                          ),
                          St(e)
                        ])
                })(e))(e)
            case 'trend':
              return ((e) =>
                ((e) => {
                  const l = ne(e),
                    i = l.timeRange,
                    t = e.config.groupBy || 'overall',
                    r = (l.displayedMetrics.length ? l.displayedMetrics : [e.config.metric])
                      .filter((e) => Boolean(e))
                      .map((e) => _t(e))
                      .filter((e) => Boolean(e)),
                    n = r.map((e) => {
                      const a = wt(e),
                        r = bt(e, i, t)
                      return { name: a.label, color: a.color, data: 'cumulative' === l.visualization ? kt(r) : r }
                    })
                  if (!n.length || !n.some((e) => e.data.length))
                    return a(q, { description: '暂无趋势数据', class: 'overview-page__trend-empty' }, null)
                  if ('bar' === l.visualization)
                    return a('div', null, [
                      a('div', { class: 'overview-page__trend-tags' }, [
                        a(u, { size: 'small', bordered: !1 }, Fe(t) ? t : { default: () => [t] })
                      ]),
                      a(
                        qe,
                        {
                          series: n.map((e) => ({
                            name: e.name,
                            color: e.color,
                            data: e.data
                              .filter((e) => 'number' == typeof e.value)
                              .map((e) => ({ name: new Date(e.timestamp).toLocaleTimeString(), value: e.value }))
                          })),
                          height: 'L' === e.size ? '260px' : '220px'
                        },
                        null
                      ),
                      St(e)
                    ])
                  if ('table' === l.visualization) {
                    const l = n[0].data.slice(-6).map((e, l) => ({
                      timestamp: e.timestamp,
                      values: n.map((e) => {
                        var a
                        return (null == (a = e.data[l]) ? void 0 : a.value) ?? 0
                      })
                    }))
                    return a('div', { class: 'overview-page__table-shell' }, [
                      a('table', { class: 'overview-page__data-table' }, [
                        a('thead', null, [
                          a('tr', null, [a('th', null, [s('时间')]), n.map((e) => a('th', { key: e.name }, [e.name]))])
                        ]),
                        a('tbody', null, [
                          l.map((e) =>
                            a('tr', { key: e.timestamp }, [
                              a('td', null, [new Date(e.timestamp).toLocaleString()]),
                              e.values.map((l, i) => a('td', { key: `${e.timestamp}-${i}` }, [qt(r[i], l)]))
                            ])
                          )
                        ])
                      ]),
                      St(e)
                    ])
                  }
                  return a('div', null, [
                    a('div', { class: 'overview-page__trend-tags' }, [
                      a(u, { size: 'small', bordered: !1 }, Fe(t) ? t : { default: () => [t] })
                    ]),
                    a(
                      ke,
                      { series: n, height: 'L' === e.size ? '260px' : '220px', area: 'cumulative' === l.visualization },
                      null
                    ),
                    St(e)
                  ])
                })(e))(e)
            case 'risk-service':
              return ((e) => {
                const l = (
                  ((i = e).config.tags || []).includes('degraded')
                    ? Ve.value.recentDegradedServices
                    : Ve.value.highRiskServices
                )
                  .filter((e) => {
                    const l = st.value.get(e.serviceId) || st.value.get(e.service)
                    return !(
                      (i.config.team && (null == l ? void 0 : l.team) !== i.config.team) ||
                      (i.config.env && (null == l ? void 0 : l.env) !== i.config.env) ||
                      ((i.config.tags || []).some((e) => !['high-risk', 'degraded'].includes(e)) &&
                        l &&
                        (i.config.tags || [])
                          .filter((e) => !['high-risk', 'degraded'].includes(e))
                          .some((e) => !(l.tags || []).includes(e)))
                    )
                  })
                  .slice(0, i.config.limit || 6)
                var i
                return l.length
                  ? a('div', { class: 'overview-page__stack-list' }, [
                      l.map((e) =>
                        a(
                          'div',
                          {
                            key: e.serviceId,
                            class: 'overview-page__risk-card',
                            onClick: () =>
                              r.push({
                                path: `/home/services/${e.serviceId}`,
                                query: { timeRange: o.timeRange, scope: Pe.value }
                              })
                          },
                          [
                            a('div', null, [
                              a('div', { class: 'overview-page__risk-title' }, [e.service]),
                              a('div', { class: 'overview-page__risk-meta' }, [
                                s('Health '),
                                e.healthStatus || 'unknown',
                                s(' · 错误率 '),
                                vt(e.errorRate, '%'),
                                s(' · 延迟变化'),
                                ' ',
                                'number' == typeof e.latencyDelta && e.latencyDelta > 0 ? '+' : '',
                                vt(e.latencyDelta, 'ms')
                              ]),
                              a('div', { class: 'overview-page__risk-submeta' }, [
                                s('活跃事件 '),
                                vt(e.activeIncidentCount)
                              ])
                            ]),
                            a(
                              Z,
                              {
                                status:
                                  'healthy' === e.healthStatus
                                    ? 'healthy'
                                    : 'warning' === e.healthStatus
                                      ? 'degraded'
                                      : 'unknown' === e.healthStatus
                                        ? 'unknown'
                                        : 'muted' === e.healthStatus
                                          ? 'muted'
                                          : 'unknown',
                                size: 'sm'
                              },
                              null
                            )
                          ]
                        )
                      )
                    ])
                  : a(q, { description: '暂无符合条件的风险服务', class: 'overview-page__list-empty' }, null)
              })(e)
            case 'incident':
              return ((e) => {
                const l =
                  ((i = e),
                  Be.value
                    .filter((e) => {
                      var l, a
                      const t = 'string' == typeof e.severity ? e.severity : null,
                        r = 'string' == typeof e.source ? e.source : null
                      return !(
                        !(
                          !(null == (l = i.config.severity) ? void 0 : l.length) ||
                          (t && i.config.severity.includes(t))
                        ) ||
                        !(!(null == (a = i.config.source) ? void 0 : a.length) || (r && i.config.source.includes(r))) ||
                        (i.config.env && e.env && e.env !== i.config.env)
                      )
                    })
                    .slice(0, i.config.limit || 5))
                var i
                return l.length
                  ? a('div', { class: 'overview-page__stack-list' }, [
                      l.map((e) =>
                        a(
                          'div',
                          {
                            key: e.id,
                            class: 'overview-page__incident-card',
                            onClick: () =>
                              r.push({
                                path: `/home/alerts/inbox/${e.id}`,
                                query: { serviceId: e.serviceId || void 0, timeRange: o.timeRange }
                              })
                          },
                          [
                            a('div', { class: 'overview-page__incident-header' }, [
                              a('div', null, [
                                a('div', { class: 'overview-page__incident-title' }, [e.title]),
                                a('div', { class: 'overview-page__incident-meta' }, [e.summary || '暂无摘要'])
                              ]),
                              a(
                                Z,
                                {
                                  status:
                                    'critical' === e.severity
                                      ? 'critical'
                                      : 'warning' === e.severity
                                        ? 'degraded'
                                        : 'unknown',
                                  size: 'sm'
                                },
                                null
                              )
                            ])
                          ]
                        )
                      )
                    ])
                  : a(q, { description: '暂无符合筛选条件的事件', class: 'overview-page__list-empty' }, null)
              })(e)
            case 'ingest-status':
              return ((e) => {
                if (!De.value)
                  return a(q, { description: '暂无采集状态数据', class: 'overview-page__ingest-empty' }, null)
                const l = (
                  (null == (t = (i = e).config.source) ? void 0 : t.length)
                    ? i.config.source
                    : ['metrics', 'logs', 'traces']
                ).map((e) => {
                  var l
                  return {
                    key: e,
                    label: `${e[0].toUpperCase()}${e.slice(1)} 采集`,
                    item: null == (l = De.value) ? void 0 : l[e]
                  }
                })
                var i, t
                return a('div', { class: 'overview-page__ingest-grid' }, [
                  l.map((e) => {
                    var l, i, t
                    return a('div', { key: e.key, class: 'overview-page__ingest-card' }, [
                      a('div', { class: 'overview-page__ingest-card-label' }, [e.label]),
                      a('div', { class: 'overview-page__ingest-card-header' }, [
                        a('div', { class: 'overview-page__ingest-card-value' }, [
                          vt(null == (l = e.item) ? void 0 : l.value)
                        ]),
                        a(
                          Z,
                          {
                            status:
                              'healthy' === (null == (i = e.item) ? void 0 : i.status)
                                ? 'healthy'
                                : 'warning' === (null == (t = e.item) ? void 0 : t.status)
                                  ? 'degraded'
                                  : 'unknown',
                            size: 'sm'
                          },
                          null
                        )
                      ])
                    ])
                  }),
                  a('div', { class: 'overview-page__ingest-summary' }, [
                    a('div', { class: 'overview-page__ingest-summary-grid' }, [
                      a('div', null, [s('丢弃：'), vt(De.value.dropped)]),
                      a('div', null, [s('延迟：'), vt(De.value.delayed)]),
                      a('div', null, [s('失败：'), vt(De.value.failed)])
                    ])
                  ])
                ])
              })(e)
            case 'quick-pivot':
              return ((e) => {
                const l = (e.config.links || []).filter(
                  (e) => !1 !== e.visible && !('admin-ingestion' === e.key && !be.value)
                )
                return l.length
                  ? a('div', { class: 'overview-page__pivot-grid' }, [
                      l.map((e) =>
                        a(
                          'div',
                          {
                            key: e.key,
                            class: 'overview-page__pivot-card',
                            onClick: () =>
                              r.push({ path: Al(e.key), query: { timeRange: o.timeRange, scope: Pe.value } })
                          },
                          [
                            a('div', { class: 'overview-page__pivot-title' }, [ye(e.key)]),
                            a('div', { class: 'overview-page__pivot-desc' }, [s('从 Overview 快速进入对应调查链路。')])
                          ]
                        )
                      )
                    ])
                  : a(q, { description: '当前没有可见快捷入口', class: 'overview-page__pivot-empty' }, null)
              })(e)
            default:
              return a(
                q,
                { description: `${e.title} 当前暂无可显示数据。`, class: 'overview-page__future-empty' },
                null
              )
          }
        }
      l(() => ut.value.map((e) => ({ label: e.label, value: e.key })))
      const Rt = l(() =>
        se
          .filter((e) => {
            const l = Sa.value.get(e.capability)
            return (null == l ? void 0 : l.available) && e.frontendReady
          })
          .map((e) => ({ label: `${e.label} · ${e.description}`, value: e.kind }))
      )
      l(() => se.find((e) => e.kind === Dl.value.kind) || se[0])
      const Mt = l(() => Dl.value.config),
        xt = l(() => Dl.value.config),
        $t = l(() => Dl.value.config),
        At = l(() => Dl.value.config),
        Ct = l(() => Dl.value.config),
        Pt = l(() => Dl.value.config),
        Ot = l(() => Dl.value.config),
        Ut = l(() => Dl.value.config),
        Lt = l(() => Dl.value.config)
      c(async () => {
        document.addEventListener('visibilitychange', ui),
          window.addEventListener('resize', Wi),
          (na.value = !0),
          await Promise.all([fa(), _a(), ba()]),
          await _(),
          Qi(),
          (na.value = !1),
          rt(),
          Vl.value ||
            '1' !== e.query.startAdd ||
            E({ scope: Pe.value, serviceId: 'string' == typeof e.query.serviceId ? e.query.serviceId : void 0 })
              .then((e) => {
                const l = xe(e)
                ;(Ml.value = l.items), (xl.value = l.source), Ni()
              })
              .catch(() => {
                ;(Ml.value = []), (xl.value = 'unavailable'), Ni()
              })
      }),
        p(() => {
          document.removeEventListener('visibilitychange', ui),
            window.removeEventListener('resize', Wi),
            si(),
            Ji(),
            Fi()
        }),
        w(
          () => [o.timeRange, Ll.value],
          () => {
            na.value || rt()
          }
        ),
        w(
          () => Pe.value,
          () => {
            na.value || rt()
          }
        ),
        w(
          () => [ea.value, o.isLive, o.timeRange, ia.value],
          () => {
            oi()
          }
        ),
        w(
          () => jl.value,
          (e) => {
            e || (Ji(), Fi())
          }
        ),
        w(
          () => za.value,
          (e) => {
            !e && jl.value && (jl.value = !1), e && Ni()
          }
        ),
        w(
          () => [Ml.value.length, xl.value, e.query.startAdd, e.query.prefillMetric],
          () => Ni()
        ),
        w(
          () => Ca.value.map((e) => `${e.id}:${e.size}`).join('|') + `:${jl.value}:${Ue.value}`,
          async () => {
            await _(), Qi()
          }
        ),
        w(
          () => El.value,
          (e) => {
            var l
            e
              ? 'query-card' === Dl.value.kind &&
                E({ scope: Pe.value, serviceId: (null == (l = Ta.value.subject) ? void 0 : l.id) || void 0 })
                  .then((e) => {
                    const l = xe(e)
                    ;(Ml.value = l.items), (xl.value = l.source)
                  })
                  .catch(() => {
                    ;(Ml.value = []), (xl.value = 'unavailable')
                  })
              : (It(), (Hl.value = ''))
          }
        ),
        w(
          () => Dl.value.kind,
          () => {
            ;(Hl.value = ''), 'query-card' !== Dl.value.kind && (Ml.value = [])
          }
        )
      const jt = () => {
          var e, l, i, t, r, n
          if (Kl.value)
            return a('div', { class: 'overview-page__editor-query-loading' }, [a(P, { size: 'small' }, null)])
          if (Jl.value) return a(q, { description: Jl.value, class: 'overview-page__editor-query-empty' }, null)
          if (!Fl.value)
            return a(
              q,
              { description: '点击“预览查询”后查看当前卡片数据效果', class: 'overview-page__editor-query-empty' },
              null
            )
          if ('number' === Fl.value.kind)
            return 'donut' === (null == (e = Et.value.query) ? void 0 : e.visualizationHint)
              ? a(
                  me,
                  {
                    value: 'number' == typeof Fl.value.value ? Fl.value.value : 0,
                    color: 'var(--color-primary-6)',
                    height: '220px',
                    loading: Kl.value
                  },
                  null
                )
              : a(O, { label: Dl.value.title || '当前值', value: Fl.value.value ?? '未知' }, null)
          if ('timeseries' === Fl.value.kind) {
            const e = mt(Et.value.query, Fl.value),
              n = gt(Et.value.query)
            return 'bar' === (null == (l = Et.value.query) ? void 0 : l.visualizationHint)
              ? a(
                  qe,
                  {
                    data: ((null == (t = null == (i = Fl.value.series) ? void 0 : i[0]) ? void 0 : t.points) || [])
                      .filter((e) => 'number' == typeof e.value)
                      .map((e) => ({
                        name: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        value: e.value
                      })),
                    height: '220px',
                    variant: 'monitor',
                    yAxisMin: e.min,
                    yAxisMax: e.max,
                    yAxisUnit: e.unit
                  },
                  null
                )
              : a(
                  ke,
                  {
                    series: (Fl.value.series || []).map((e) => ({ name: e.name, data: e.points })),
                    title: '',
                    height: '220px',
                    area: 'line' === (null == (r = Et.value.query) ? void 0 : r.visualizationHint),
                    variant: 'monitor',
                    mutedGrid: !0,
                    showLegend: !0,
                    yAxisMin: e.min,
                    yAxisMax: e.max,
                    yAxisUnit: e.unit,
                    thresholdLines: n
                  },
                  null
                )
          }
          if ('distribution' === Fl.value.kind)
            return 'bar' === (null == (n = Et.value.query) ? void 0 : n.visualizationHint)
              ? a(qe, { data: Fl.value.items || [], height: '220px', variant: 'monitor' }, null)
              : a(ge, { data: Fl.value.items || [], height: '220px', variant: 'monitor' }, null)
          if ('table' === Fl.value.kind) {
            let e
            return a(
              L,
              null,
              Fe(
                (e = (Fl.value.rows || [])
                  .slice(0, 5)
                  .map((e, l) => a(U, { key: `${l}` }, { default: () => [a('div', null, [JSON.stringify(e)])] })))
              )
                ? e
                : { default: () => [e] }
            )
          }
          return a(q, { description: '当前预览结果暂不支持直接展示', class: 'overview-page__editor-query-empty' }, null)
        },
        It = () => {
          ;(Kl.value = !1),
            (Fl.value = null),
            (Jl.value = ''),
            (Ql.value = !1),
            (Wl.value = ''),
            (Gl.value = ''),
            (Xl.value = 'queryspec-json'),
            (Yl.value = null),
            (Zl.value = !1)
        },
        Et = l(() => {
          if ('query-card' === Dl.value.kind && 'query-statement' === Ba.value) {
            const e = Ke(Gl.value)
            return e.query
              ? { supported: !0, query: e.query }
              : { supported: !1, reason: e.issues[0] || 'QuerySpec JSON 未通过解析' }
          }
          return ce({ widget: yi(Dl.value), scope: Pe.value, scopedServiceName: Oe.value.service, services: Ee.value })
        }),
        Tt = l(() => JSON.stringify(Et.value))
      w(
        () => [El.value, Dl.value.id, Ba.value],
        () => {
          El.value &&
            'query-card' === Dl.value.kind &&
            !Gl.value.trim() &&
            (Gl.value = JSON.stringify({ type: 'queryspec', version: 1, query: Ta.value }, null, 2))
        }
      ),
        w(
          () => Tt.value,
          () => {
            ;(Fl.value = null), (Jl.value = ''), (Yl.value = null), (Wl.value = '')
          }
        )
      const Bt = async () => {
          const e = Et.value,
            l = Tt.value
          ;(Kl.value = !0), (Jl.value = '')
          try {
            if (!e.supported || !e.query)
              return (Fl.value = null), void (Jl.value = e.reason || '当前卡片暂不支持查询预览')
            const a = await H(e.query, e.query.scope || Pe.value)
            if (l !== Tt.value) return
            ;(Fl.value = a.data || null),
              a.data ||
                (Jl.value = a.supported
                  ? '预览接口已返回，但当前没有可展示的数据'
                  : '当前环境未提供专用预览接口，已尝试查询网关回退')
          } catch (a) {
            if (l !== Tt.value) return
            ;(Fl.value = null), (Jl.value = '预览失败，请稍后重试')
          } finally {
            Kl.value = !1
          }
        },
        Dt = async () => {
          const e = Et.value,
            l = Tt.value
          Zl.value = !0
          try {
            if (!e.supported || !e.query)
              return (
                (Yl.value = { valid: !1, issues: [e.reason || '当前卡片暂不支持脚本模式'], supported: !1 }),
                (Wl.value = JSON.stringify(
                  { type: 'queryspec', version: 1, widgetKind: Dl.value.kind, reason: e.reason || 'unsupported' },
                  null,
                  2
                )),
                void (Xl.value = 'queryspec-json')
              )
            const [a, i] = await Promise.all([T(e.query, Pe.value), Q(e.query, Pe.value)])
            if (l !== Tt.value) return
            ;(Yl.value = { valid: a.valid, issues: a.issues, supported: a.supported }),
              (Wl.value = i.script),
              (Xl.value = i.language)
          } catch (a) {
            if (l !== Tt.value) return
            ;(Yl.value = { valid: !1, issues: ['脚本校验失败，请稍后重试'], supported: !1 }),
              (Wl.value = e.query ? JSON.stringify({ type: 'queryspec', query: e.query }, null, 2) : ''),
              (Xl.value = 'queryspec-json')
          } finally {
            Zl.value = !1
          }
        },
        Vt = () => {
          if ('query-card' !== Dl.value.kind)
            return void (Yl.value = { valid: !1, issues: ['只有开放查询卡支持应用 QuerySpec JSON'], supported: !1 })
          const e = Ke(Wl.value)
          e.query
            ? (fi({
                config: { query: e.query },
                editor: {
                  ...Pa.value,
                  timeRange: String(e.query.timeRange || '-1h').replace(/^-/, ''),
                  visualization: e.query.visualizationHint || Pa.value.visualization
                }
              }),
              (Wl.value = JSON.stringify({ type: 'queryspec', version: 1, query: e.query }, null, 2)),
              (Xl.value = 'queryspec-json'),
              (Yl.value = { valid: !0, issues: ['JSON 配置已应用到开放查询卡，可继续预览或保存。'], supported: !1 }),
              (Fl.value = null),
              (Jl.value = ''),
              v.success('JSON 配置已应用'))
            : (Yl.value = { valid: !1, issues: e.issues, supported: !1 })
        },
        Nt = () => {
          var e, l, i
          const t = Et.value
          return a('div', { class: 'overview-page__editor-query-assist' }, [
            a('div', { class: 'overview-page__editor-query-panel' }, [
              a('div', { class: 'overview-page__editor-query-header' }, [
                a('div', null, [
                  a('div', { class: 'overview-page__editor-query-title' }, [s('单卡预览')]),
                  a('div', { class: 'overview-page__editor-query-subtitle' }, [
                    s('通过查询网关预览当前卡片配置对应的数据形态。')
                  ])
                ]),
                a(
                  n,
                  { size: 'small', type: 'primary', ghost: !0, onClick: Bt, loading: Kl.value },
                  { default: () => [s('预览查询')] }
                )
              ]),
              t.supported || Kl.value || Jl.value
                ? a('div', { class: 'overview-page__editor-query-preview-body' }, [jt()])
                : a(
                    q,
                    {
                      description: t.supported
                        ? '点击“预览查询”后查看当前卡片数据效果'
                        : t.reason || '当前卡片暂不支持查询预览',
                      class: 'overview-page__editor-query-empty'
                    },
                    null
                  )
            ]),
            be.value
              ? a('div', { class: 'overview-page__editor-query-panel' }, [
                  a('div', { class: 'overview-page__editor-query-header' }, [
                    a('div', null, [
                      a('div', { class: 'overview-page__editor-query-title' }, [s('高级模式')]),
                      a('div', { class: 'overview-page__editor-query-subtitle' }, [
                        s('管理员可编辑 QuerySpec JSON，应用后会回填开放查询卡配置。')
                      ])
                    ]),
                    a(
                      n,
                      { size: 'small', onClick: () => (Ql.value = !Ql.value) },
                      { default: () => [Ql.value ? '收起高级模式' : '展开高级模式'] }
                    )
                  ]),
                  Ql.value
                    ? a('div', { class: 'overview-page__editor-script-body' }, [
                        a('div', { class: 'overview-page__editor-script-actions' }, [
                          a(
                            n,
                            { size: 'small', type: 'primary', ghost: !0, onClick: Dt, loading: Zl.value },
                            { default: () => [s('编译并校验')] }
                          ),
                          'query-card' === Dl.value.kind
                            ? a(n, { size: 'small', ghost: !0, onClick: Vt }, { default: () => [s('应用 JSON 配置')] })
                            : null
                        ]),
                        a('div', { class: 'overview-page__editor-script-status-row' }, [
                          a(
                            u,
                            {
                              size: 'small',
                              bordered: !1,
                              type: (null == (e = Yl.value) ? void 0 : e.valid) ? 'success' : 'warning'
                            },
                            {
                              default: () => {
                                var e
                                return [(null == (e = Yl.value) ? void 0 : e.valid) ? '校验通过' : '待校验 / 存在问题']
                              }
                            }
                          ),
                          Yl.value
                            ? a(
                                u,
                                { size: 'small', bordered: !1, type: Yl.value.supported ? 'info' : 'default' },
                                { default: () => [Yl.value.supported ? '服务端校验' : '本地校验回退'] }
                              )
                            : null
                        ]),
                        (null == (i = null == (l = Yl.value) ? void 0 : l.issues) ? void 0 : i.length)
                          ? a('div', { class: 'overview-page__editor-script-issues' }, [
                              Yl.value.issues.map((e) => a('div', { key: e }, [e]))
                            ])
                          : null,
                        a(
                          m,
                          {
                            type: 'textarea',
                            autosize: { minRows: 8, maxRows: 14 },
                            value: Wl.value,
                            'onUpdate:value': (e) => (Wl.value = e),
                            placeholder: '可粘贴 QuerySpec、{ query } 或 { config: { query } }，再点击“应用 JSON 配置”'
                          },
                          null
                        ),
                        a('div', { class: 'overview-page__editor-script-language' }, [s('当前语言：'), Xl.value])
                      ])
                    : null
                ])
              : null
          ])
        },
        Kt = () => {
          const e = yi(Dl.value),
            l = { preview: () => (Et.value.supported ? jt() : zt(e)) },
            i = Et.value.supported
          return (
            (l.settings = () => {
              var e, l, r, o, v, d, c, p, f, w, _, h, k, S, z, R, M, x, $, P, O
              return a(b, null, [
                'darwin-infra-summary' === Dl.value.kind
                  ? a('div', { class: 'overview-page__darwin-settings-grid' }, [
                      a('label', { class: 'overview-page__darwin-settings-field' }, [
                        a('span', null, [s('资源指标')]),
                        a(
                          t,
                          {
                            value: Ot.value.metric,
                            options: Ea,
                            onUpdateValue: (e) =>
                              fi({ config: { ...Ot.value, metric: e }, editor: { ...Pa.value, displayedMetrics: [e] } })
                          },
                          null
                        )
                      ]),
                      a('label', { class: 'overview-page__darwin-settings-field' }, [
                        a('span', null, [s('目标服务')]),
                        a(
                          t,
                          {
                            value: Ot.value.serviceId || null,
                            clearable: !0,
                            options: Va.value,
                            placeholder: '未选择时跟随 Darwin 全局视角',
                            onUpdateValue: (e) => fi({ config: { ...Ot.value, serviceId: e || void 0 } })
                          },
                          null
                        )
                      ])
                    ])
                  : 'darwin-infra-trend' === Dl.value.kind
                    ? a('div', { class: 'overview-page__darwin-settings-grid' }, [
                        a('label', { class: 'overview-page__darwin-settings-field' }, [
                          a('span', null, [s('资源指标')]),
                          a(
                            t,
                            {
                              value: Ut.value.metric,
                              options: Ea,
                              onUpdateValue: (e) =>
                                fi({
                                  config: { ...Ut.value, metric: e },
                                  editor: { ...Pa.value, displayedMetrics: [e] }
                                })
                            },
                            null
                          )
                        ]),
                        a('label', { class: 'overview-page__darwin-settings-field' }, [
                          a('span', null, [s('目标服务')]),
                          a(
                            t,
                            {
                              value: Ut.value.serviceId || null,
                              clearable: !0,
                              options: Va.value,
                              placeholder: '未选择时跟随 Darwin 全局视角',
                              onUpdateValue: (e) => fi({ config: { ...Ut.value, serviceId: e || void 0 } })
                            },
                            null
                          )
                        ])
                      ])
                    : 'darwin-instance-table' === Dl.value.kind
                      ? a('div', { class: 'overview-page__darwin-settings-grid' }, [
                          a('label', { class: 'overview-page__darwin-settings-field' }, [
                            a('span', null, [s('目标服务')]),
                            a(
                              t,
                              {
                                value: Lt.value.serviceId || null,
                                options: Va.value,
                                placeholder: '请选择要查看实例资源的服务',
                                onUpdateValue: (e) => fi({ config: { ...Lt.value, serviceId: e || void 0 } })
                              },
                              null
                            )
                          ]),
                          a('label', { class: 'overview-page__darwin-settings-field' }, [
                            a('span', null, [s('排序方式')]),
                            a(
                              t,
                              {
                                value: Lt.value.sortBy || 'cpu',
                                options: Ea,
                                onUpdateValue: (e) => fi({ config: { ...Lt.value, sortBy: e } })
                              },
                              null
                            )
                          ]),
                          a(
                            'label',
                            {
                              class: 'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                            },
                            [
                              a('span', null, [s('实例上限')]),
                              a(
                                A,
                                {
                                  value: Lt.value.limit || 6,
                                  min: 3,
                                  max: 20,
                                  onUpdateValue: (e) => fi({ config: { ...Lt.value, limit: e || 6 } })
                                },
                                null
                              )
                            ]
                          )
                        ])
                      : null,
                'query-card' === Dl.value.kind
                  ? a('div', { class: 'overview-page__query-builder-flow' }, [
                      a('div', { class: 'overview-page__query-mode-grid' }, [
                        a(
                          'button',
                          {
                            type: 'button',
                            class: ['overview-page__query-mode-card', 'form-builder' === Ba.value ? 'is-active' : ''],
                            onClick: () => Ti('form-builder')
                          },
                          [
                            a('span', { class: 'overview-page__query-mode-kicker' }, [s('Guided')]),
                            a('strong', null, [s('表单组装')]),
                            a('span', null, [s('按指标、对象、聚合和分组一步步生成开放查询卡。')]),
                            a('em', null, [s('适合新用户和标准监控卡片')])
                          ]
                        ),
                        a(
                          'button',
                          {
                            type: 'button',
                            class: [
                              'overview-page__query-mode-card',
                              'overview-page__query-mode-card--code',
                              'query-statement' === Ba.value ? 'is-active' : ''
                            ],
                            onClick: () => Ti('query-statement')
                          },
                          [
                            a('span', { class: 'overview-page__query-mode-kicker' }, [s('QuerySpec')]),
                            a('strong', null, [s('查询语句')]),
                            a('span', null, [s('直接粘贴完整 QuerySpec JSON，保存时不会被表单反向改写。')]),
                            a('em', null, [s('适合专业用户、复杂查询和复制已有配置')])
                          ]
                        )
                      ]),
                      'form-builder' === Ba.value
                        ? a(b, null, [
                            a('div', { class: 'overview-page__query-builder-step' }, [
                              a('div', { class: 'overview-page__query-builder-step-header' }, [
                                a('span', null, [s('1')]),
                                a('div', null, [
                                  a('div', { class: 'overview-page__editor-query-title' }, [s('选择指标与查询范围')]),
                                  a('div', { class: 'overview-page__editor-query-subtitle' }, [
                                    s('先决定查什么，再选择数据集和目标对象。')
                                  ])
                                ])
                              ]),
                              a('div', { class: 'overview-page__darwin-settings-grid' }, [
                                a(
                                  'label',
                                  {
                                    class:
                                      'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                                  },
                                  [
                                    a('span', null, [s('指标标识')]),
                                    a(
                                      t,
                                      {
                                        value: Ta.value.metricRef,
                                        options: Xa.value,
                                        filterable: !0,
                                        clearable: !0,
                                        placeholder: 'schema' === xl.value ? '选择一个指标' : '例如 service.cpu.usage',
                                        onUpdateValue: (e) => wi({ metricRef: e || '' })
                                      },
                                      null
                                    )
                                  ]
                                ),
                                a('label', { class: 'overview-page__darwin-settings-field' }, [
                                  a('span', null, [s('数据范围')]),
                                  a(
                                    t,
                                    {
                                      value: Ta.value.scope,
                                      options: Na.value,
                                      onUpdateValue: (e) => wi({ scope: e })
                                    },
                                    null
                                  )
                                ]),
                                a('label', { class: 'overview-page__darwin-settings-field' }, [
                                  a('span', null, [s('数据来源')]),
                                  a(
                                    t,
                                    {
                                      value: Ta.value.sourceKind,
                                      options: Ka.value,
                                      onUpdateValue: (e) => wi({ sourceKind: e || 'auto' })
                                    },
                                    null
                                  )
                                ]),
                                a('label', { class: 'overview-page__darwin-settings-field' }, [
                                  a('span', null, [s('目标对象')]),
                                  a(
                                    t,
                                    {
                                      value: (null == (e = Ta.value.subject) ? void 0 : e.type) || 'system',
                                      options: Ha,
                                      onUpdateValue: (e) => {
                                        var l
                                        return wi({
                                          subject:
                                            'service' === e
                                              ? {
                                                  type: 'service',
                                                  id: (null == (l = Ta.value.subject) ? void 0 : l.id) || ''
                                                }
                                              : { type: 'system' }
                                        })
                                      }
                                    },
                                    null
                                  )
                                ]),
                                a('label', { class: 'overview-page__darwin-settings-field' }, [
                                  a('span', null, [s('目标服务')]),
                                  a(
                                    t,
                                    {
                                      value: (null == (l = Ta.value.subject) ? void 0 : l.id) || null,
                                      clearable: !0,
                                      options: Va.value,
                                      placeholder: '当目标对象为服务时选择',
                                      disabled: 'system' === (null == (r = Ta.value.subject) ? void 0 : r.type),
                                      onUpdateValue: (e) =>
                                        wi({
                                          subject: { ...(Ta.value.subject || { type: 'service' }), id: e || void 0 }
                                        })
                                    },
                                    null
                                  )
                                ])
                              ])
                            ]),
                            a('div', { class: 'overview-page__query-builder-step' }, [
                              a('div', { class: 'overview-page__query-builder-step-header' }, [
                                a('span', null, [s('2')]),
                                a('div', null, [
                                  a('div', { class: 'overview-page__editor-query-title' }, [s('设置计算方式')]),
                                  a('div', { class: 'overview-page__editor-query-subtitle' }, [
                                    s('选择聚合方式和可选分组字段，图表形态在展示设置中选择。')
                                  ])
                                ])
                              ]),
                              a('div', { class: 'overview-page__darwin-settings-grid' }, [
                                a('label', { class: 'overview-page__darwin-settings-field' }, [
                                  a('span', null, [s('聚合方式')]),
                                  a(
                                    t,
                                    {
                                      value: Ta.value.aggregation,
                                      options: Ya.value,
                                      onUpdateValue: (e) => wi({ aggregation: e })
                                    },
                                    null
                                  )
                                ]),
                                a(
                                  'label',
                                  {
                                    class:
                                      'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                                  },
                                  [
                                    a('span', null, [s('分组字段')]),
                                    a(
                                      m,
                                      {
                                        value: (Ta.value.groupBy || []).join(','),
                                        placeholder: (
                                          null == (v = null == (o = Wa.value) ? void 0 : o.labelNames)
                                            ? void 0
                                            : v.length
                                        )
                                          ? `可选：${Wa.value.labelNames.join(', ')}`
                                          : '多个字段用逗号分隔，例如 service,env',
                                        'onUpdate:value': (e) =>
                                          wi({
                                            groupBy: e
                                              .split(',')
                                              .map((e) => e.trim())
                                              .filter(Boolean)
                                          })
                                      },
                                      null
                                    )
                                  ]
                                )
                              ])
                            ]),
                            a(
                              'div',
                              { class: 'overview-page__query-builder-step overview-page__query-display-rule-panel' },
                              [
                                a('div', { class: 'overview-page__query-builder-step-header' }, [
                                  a('span', null, [s('3')]),
                                  a('div', null, [
                                    a('div', { class: 'overview-page__editor-query-title' }, [s('展示与规则')]),
                                    a('div', { class: 'overview-page__editor-query-subtitle' }, [
                                      s('设置图表最大值和单位；启用阈值后，保存卡片会同步创建或更新告警规则。')
                                    ])
                                  ])
                                ]),
                                a('div', { class: 'overview-page__darwin-settings-grid' }, [
                                  a('label', { class: 'overview-page__darwin-settings-field' }, [
                                    a('span', null, [s('最小值')]),
                                    a(
                                      A,
                                      {
                                        value:
                                          (null == (c = null == (d = Ta.value.display) ? void 0 : d.value)
                                            ? void 0
                                            : c.min) ?? null,
                                        placeholder: '自动',
                                        clearable: !0,
                                        onUpdateValue: (e) => _i({ min: 'number' == typeof e ? e : void 0 })
                                      },
                                      null
                                    )
                                  ]),
                                  a('label', { class: 'overview-page__darwin-settings-field' }, [
                                    a('span', null, [s('最大值')]),
                                    a(
                                      A,
                                      {
                                        value:
                                          (null == (f = null == (p = Ta.value.display) ? void 0 : p.value)
                                            ? void 0
                                            : f.max) ?? null,
                                        placeholder: '例如 100',
                                        clearable: !0,
                                        onUpdateValue: (e) => _i({ max: 'number' == typeof e ? e : void 0 })
                                      },
                                      null
                                    )
                                  ]),
                                  a('label', { class: 'overview-page__darwin-settings-field' }, [
                                    a('span', null, [s('展示单位')]),
                                    a(
                                      t,
                                      {
                                        value:
                                          (null == (_ = null == (w = Ta.value.display) ? void 0 : w.value)
                                            ? void 0
                                            : _.unit) || '',
                                        options: sl,
                                        tag: !0,
                                        clearable: !0,
                                        placeholder: '例如 % / ms',
                                        onUpdateValue: (e) => {
                                          var l
                                          const a = e || ''
                                          _i({ unit: a }),
                                            (null == (l = Ta.value.alert) ? void 0 : l.enabled) && qi({ unit: a })
                                        }
                                      },
                                      null
                                    )
                                  ])
                                ]),
                                'number' === Ta.value.visualizationHint
                                  ? a('div', { class: 'overview-page__query-compare-panel' }, [
                                      a('div', { class: 'overview-page__query-compare-toggle-row' }, [
                                        a(
                                          C,
                                          {
                                            value: Boolean(Ta.value.compare && bi(Ta.value.compare).enabled),
                                            onUpdateValue: (e) => (e ? hi({ enabled: !0 }) : wi({ compare: void 0 }))
                                          },
                                          null
                                        ),
                                        a('div', null, [
                                          a('strong', null, [s('对比时间段')]),
                                          a('span', null, [s('仅数值卡支持趋势徽章，会展示在数值与单位同一行右侧。')])
                                        ])
                                      ]),
                                      Ta.value.compare
                                        ? a('div', { class: 'overview-page__query-compare-grid' }, [
                                            a('label', { class: 'overview-page__darwin-settings-field' }, [
                                              a('span', null, [s('对比窗口')]),
                                              a(
                                                t,
                                                {
                                                  value: bi(Ta.value.compare).mode,
                                                  options: tl,
                                                  onUpdateValue: (e) => hi({ mode: e })
                                                },
                                                null
                                              )
                                            ]),
                                            a('label', { class: 'overview-page__darwin-settings-field' }, [
                                              a('span', null, [s('展示方式')]),
                                              a(
                                                t,
                                                {
                                                  value: bi(Ta.value.compare).display,
                                                  options: rl,
                                                  onUpdateValue: (e) => hi({ display: e })
                                                },
                                                null
                                              )
                                            ]),
                                            a(
                                              'label',
                                              {
                                                class:
                                                  'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                                              },
                                              [
                                                a('span', null, [s('趋势语义')]),
                                                a(
                                                  t,
                                                  {
                                                    value: bi(Ta.value.compare).directionality,
                                                    options: nl,
                                                    onUpdateValue: (e) => hi({ directionality: e })
                                                  },
                                                  null
                                                )
                                              ]
                                            )
                                          ])
                                        : null
                                    ])
                                  : null,
                                a('div', { class: 'overview-page__query-alert-toggle-row' }, [
                                  a(
                                    C,
                                    {
                                      value: Boolean(null == (h = Ta.value.alert) ? void 0 : h.enabled),
                                      onUpdateValue: (e) => Ci(e, 'form-builder')
                                    },
                                    null
                                  ),
                                  a('div', null, [
                                    a('strong', null, [s('告警阈值')]),
                                    a('span', null, [s('超过阈值后触发告警，并按选择的渠道发送通知。')])
                                  ])
                                ]),
                                (null == (k = Ta.value.alert) ? void 0 : k.enabled)
                                  ? Oi(Ta.value, 'form-builder')
                                  : null
                              ]
                            )
                          ])
                        : a('div', { class: 'overview-page__query-script-editor' }, [
                            a('div', { class: 'overview-page__editor-query-header' }, [
                              a('div', null, [
                                a('div', { class: 'overview-page__editor-query-title' }, [s('QuerySpec JSON')]),
                                a('div', { class: 'overview-page__editor-query-subtitle' }, [
                                  s('保存的是完整查询语句；切回表单前不会自动拆解覆盖字段。')
                                ])
                              ]),
                              a(
                                n,
                                { size: 'small', ghost: !0, onClick: () => ki(Ta.value) },
                                { default: () => [s('从当前表单生成模板')] }
                              )
                            ]),
                            a(
                              m,
                              {
                                type: 'textarea',
                                autosize: { minRows: 10, maxRows: 18 },
                                value: Gl.value,
                                'onUpdate:value': (e) => (Gl.value = e),
                                placeholder: '粘贴 QuerySpec、{ query } 或 { config: { query } }'
                              },
                              null
                            ),
                            a('div', { class: 'overview-page__query-required-fields' }, [
                              a('span', null, [s('必须包含：')]),
                              a('code', null, [s('scope')]),
                              a('code', null, [s('subject')]),
                              a('code', null, [s('metricRef')]),
                              a('code', null, [s('aggregation')]),
                              a('code', null, [s('timeRange')])
                            ]),
                            a(
                              'div',
                              { class: 'overview-page__query-builder-step overview-page__query-display-rule-panel' },
                              [
                                a('div', { class: 'overview-page__query-builder-step-header' }, [
                                  a('span', null, [s('3')]),
                                  a('div', null, [
                                    a('div', { class: 'overview-page__editor-query-title' }, [s('展示与规则')]),
                                    a('div', { class: 'overview-page__editor-query-subtitle' }, [
                                      s(
                                        '这里会直接改写上方 QuerySpec JSON 的 display 和 alert 字段，保存查询语句时一并生效。'
                                      )
                                    ])
                                  ])
                                ]),
                                a('div', { class: 'overview-page__darwin-settings-grid' }, [
                                  a('label', { class: 'overview-page__darwin-settings-field' }, [
                                    a('span', null, [s('最小值')]),
                                    a(
                                      A,
                                      {
                                        value:
                                          (null == (z = null == (S = Da.value.display) ? void 0 : S.value)
                                            ? void 0
                                            : z.min) ?? null,
                                        placeholder: '自动',
                                        clearable: !0,
                                        onUpdateValue: (e) => zi({ min: 'number' == typeof e ? e : void 0 })
                                      },
                                      null
                                    )
                                  ]),
                                  a('label', { class: 'overview-page__darwin-settings-field' }, [
                                    a('span', null, [s('最大值')]),
                                    a(
                                      A,
                                      {
                                        value:
                                          (null == (M = null == (R = Da.value.display) ? void 0 : R.value)
                                            ? void 0
                                            : M.max) ?? null,
                                        placeholder: '例如 100',
                                        clearable: !0,
                                        onUpdateValue: (e) => zi({ max: 'number' == typeof e ? e : void 0 })
                                      },
                                      null
                                    )
                                  ]),
                                  a('label', { class: 'overview-page__darwin-settings-field' }, [
                                    a('span', null, [s('展示单位')]),
                                    a(
                                      t,
                                      {
                                        value:
                                          (null == ($ = null == (x = Da.value.display) ? void 0 : x.value)
                                            ? void 0
                                            : $.unit) || '',
                                        options: sl,
                                        tag: !0,
                                        clearable: !0,
                                        placeholder: '例如 % / ms',
                                        onUpdateValue: (e) => {
                                          var l
                                          const a = e || ''
                                          zi({ unit: a }),
                                            (null == (l = Da.value.alert) ? void 0 : l.enabled) && Mi({ unit: a })
                                        }
                                      },
                                      null
                                    )
                                  ])
                                ]),
                                'number' === Da.value.visualizationHint
                                  ? a('div', { class: 'overview-page__query-compare-panel' }, [
                                      a('div', { class: 'overview-page__query-compare-toggle-row' }, [
                                        a(
                                          C,
                                          {
                                            value: Boolean(Da.value.compare && bi(Da.value.compare).enabled),
                                            onUpdateValue: (e) =>
                                              e ? Ri({ enabled: !0 }) : Si((e) => ({ ...e, compare: void 0 }))
                                          },
                                          null
                                        ),
                                        a('div', null, [
                                          a('strong', null, [s('对比时间段')]),
                                          a('span', null, [
                                            s('直接写入 QuerySpec compare 字段，仅数值卡展示趋势徽章。')
                                          ])
                                        ])
                                      ]),
                                      Da.value.compare
                                        ? a('div', { class: 'overview-page__query-compare-grid' }, [
                                            a('label', { class: 'overview-page__darwin-settings-field' }, [
                                              a('span', null, [s('对比窗口')]),
                                              a(
                                                t,
                                                {
                                                  value: bi(Da.value.compare).mode,
                                                  options: tl,
                                                  onUpdateValue: (e) => Ri({ mode: e })
                                                },
                                                null
                                              )
                                            ]),
                                            a('label', { class: 'overview-page__darwin-settings-field' }, [
                                              a('span', null, [s('展示方式')]),
                                              a(
                                                t,
                                                {
                                                  value: bi(Da.value.compare).display,
                                                  options: rl,
                                                  onUpdateValue: (e) => Ri({ display: e })
                                                },
                                                null
                                              )
                                            ]),
                                            a(
                                              'label',
                                              {
                                                class:
                                                  'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                                              },
                                              [
                                                a('span', null, [s('趋势语义')]),
                                                a(
                                                  t,
                                                  {
                                                    value: bi(Da.value.compare).directionality,
                                                    options: nl,
                                                    onUpdateValue: (e) => Ri({ directionality: e })
                                                  },
                                                  null
                                                )
                                              ]
                                            )
                                          ])
                                        : null
                                    ])
                                  : null,
                                a('div', { class: 'overview-page__query-alert-toggle-row' }, [
                                  a(
                                    C,
                                    {
                                      value: Boolean(null == (P = Da.value.alert) ? void 0 : P.enabled),
                                      onUpdateValue: (e) => Ci(e, 'query-statement')
                                    },
                                    null
                                  ),
                                  a('div', null, [
                                    a('strong', null, [s('告警阈值')]),
                                    a('span', null, [s('超过阈值后触发告警，并按选择的渠道发送通知。')])
                                  ])
                                ]),
                                (null == (O = Da.value.alert) ? void 0 : O.enabled)
                                  ? Oi(Da.value, 'query-statement')
                                  : null
                              ]
                            )
                          ])
                    ])
                  : 'risk-service' === Dl.value.kind
                    ? a('div', { class: 'overview-page__darwin-settings-grid' }, [
                        a('label', { class: 'overview-page__darwin-settings-field' }, [
                          a('span', null, [s('展示数量')]),
                          a(
                            A,
                            {
                              value: xt.value.limit || 6,
                              min: 1,
                              max: 12,
                              onUpdateValue: (e) => fi({ config: { ...xt.value, limit: e || 6 } })
                            },
                            null
                          )
                        ]),
                        a('label', { class: 'overview-page__darwin-settings-field' }, [
                          a('span', null, [s('环境')]),
                          a(
                            m,
                            {
                              value: xt.value.env || '',
                              placeholder: '可选，如 prod',
                              'onUpdate:value': (e) => fi({ config: { ...xt.value, env: e || void 0 } })
                            },
                            null
                          )
                        ]),
                        a('label', { class: 'overview-page__darwin-settings-field' }, [
                          a('span', null, [s('团队')]),
                          a(
                            m,
                            {
                              value: xt.value.team || '',
                              placeholder: '可选，如 core-platform',
                              'onUpdate:value': (e) => fi({ config: { ...xt.value, team: e || void 0 } })
                            },
                            null
                          )
                        ]),
                        a(
                          'label',
                          { class: 'overview-page__darwin-settings-field overview-page__darwin-settings-field--full' },
                          [
                            a('span', null, [s('筛选标签')]),
                            a(
                              g,
                              {
                                value: xt.value.tags || [],
                                onUpdateValue: (e) => fi({ config: { ...xt.value, tags: e } })
                              },
                              {
                                default: () => [
                                  a('div', { class: 'overview-page__editor-choice-list' }, [
                                    [
                                      { label: '高风险', value: 'high-risk' },
                                      { label: '最近退化', value: 'degraded' }
                                    ].map((e) =>
                                      a('label', { key: e.value, class: 'overview-page__editor-choice-tile' }, [
                                        a(y, { value: e.value }, null),
                                        a('span', null, [e.label])
                                      ])
                                    )
                                  ])
                                ]
                              }
                            )
                          ]
                        )
                      ])
                    : 'incident' === Dl.value.kind
                      ? a('div', { class: 'overview-page__darwin-settings-grid' }, [
                          a('label', { class: 'overview-page__darwin-settings-field' }, [
                            a('span', null, [s('展示数量')]),
                            a(
                              A,
                              {
                                value: $t.value.limit || 5,
                                min: 1,
                                max: 12,
                                onUpdateValue: (e) => fi({ config: { ...$t.value, limit: e || 5 } })
                              },
                              null
                            )
                          ]),
                          a('label', { class: 'overview-page__darwin-settings-field' }, [
                            a('span', null, [s('环境')]),
                            a(
                              m,
                              {
                                value: $t.value.env || '',
                                placeholder: '可选，如 prod',
                                'onUpdate:value': (e) => fi({ config: { ...$t.value, env: e || void 0 } })
                              },
                              null
                            )
                          ]),
                          a(
                            'label',
                            {
                              class: 'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                            },
                            [
                              a('span', null, [s('事件级别')]),
                              a(
                                g,
                                {
                                  value: $t.value.severity || [],
                                  onUpdateValue: (e) => fi({ config: { ...$t.value, severity: e } })
                                },
                                {
                                  default: () => [
                                    a('div', { class: 'overview-page__editor-choice-list' }, [
                                      _l.map((e) =>
                                        a('label', { key: e.value, class: 'overview-page__editor-choice-tile' }, [
                                          a(y, { value: e.value }, null),
                                          a('span', null, [e.label])
                                        ])
                                      )
                                    ])
                                  ]
                                }
                              )
                            ]
                          ),
                          a(
                            'label',
                            {
                              class: 'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                            },
                            [
                              a('span', null, [s('事件来源')]),
                              a(
                                g,
                                {
                                  value: $t.value.source || [],
                                  onUpdateValue: (e) => fi({ config: { ...$t.value, source: e } })
                                },
                                {
                                  default: () => [
                                    a('div', { class: 'overview-page__editor-choice-list' }, [
                                      bl.map((e) =>
                                        a('label', { key: e.value, class: 'overview-page__editor-choice-tile' }, [
                                          a(y, { value: e.value }, null),
                                          a('span', null, [e.label])
                                        ])
                                      )
                                    ])
                                  ]
                                }
                              )
                            ]
                          )
                        ])
                      : 'ingest-status' === Dl.value.kind
                        ? a('div', { class: 'overview-page__darwin-settings-grid' }, [
                            a(
                              'label',
                              {
                                class: 'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                              },
                              [
                                a('span', null, [s('采集来源')]),
                                a(
                                  g,
                                  {
                                    value: At.value.source || [],
                                    onUpdateValue: (e) => fi({ config: { ...At.value, source: e } })
                                  },
                                  {
                                    default: () => [
                                      a('div', { class: 'overview-page__editor-choice-list' }, [
                                        hl.map((e) =>
                                          a('label', { key: e.value, class: 'overview-page__editor-choice-tile' }, [
                                            a(y, { value: e.value }, null),
                                            a('span', null, [e.label])
                                          ])
                                        )
                                      ])
                                    ]
                                  }
                                )
                              ]
                            )
                          ])
                        : 'quick-pivot' === Dl.value.kind
                          ? a('div', { class: 'overview-page__darwin-settings-grid' }, [
                              a(
                                'label',
                                {
                                  class:
                                    'overview-page__darwin-settings-field overview-page__darwin-settings-field--full'
                                },
                                [
                                  a('span', null, [s('可见入口')]),
                                  a(
                                    g,
                                    {
                                      value: (Pt.value.links || []).filter((e) => !1 !== e.visible).map((e) => e.key),
                                      onUpdateValue: (e) =>
                                        fi({
                                          config: {
                                            ...Pt.value,
                                            links: ql.map((l) => ({ key: l.value, visible: e.includes(l.value) }))
                                          }
                                        })
                                    },
                                    {
                                      default: () => [
                                        a('div', { class: 'overview-page__editor-choice-list' }, [
                                          ql.map((e) =>
                                            a('label', { key: e.value, class: 'overview-page__editor-choice-tile' }, [
                                              a(y, { value: e.value }, null),
                                              a('span', null, [e.label])
                                            ])
                                          )
                                        ])
                                      ]
                                    }
                                  )
                                ]
                              )
                            ])
                          : null,
                'query-card' !== Dl.value.kind
                  ? null
                  : a('div', { class: 'overview-page__editor-query-panel overview-page__query-metric-browser' }, [
                      a('div', { class: 'overview-page__editor-query-header' }, [
                        a('div', null, [
                          a('div', { class: 'overview-page__editor-query-title' }, [s('系统指标目录')]),
                          a('div', { class: 'overview-page__editor-query-subtitle' }, [
                            s(
                              '用于选择 metricRef、查看可用标签和聚合方式；查询语句模式也可以直接把指标写入 QuerySpec。'
                            )
                          ])
                        ]),
                        a(
                          u,
                          { size: 'small', bordered: !1, type: 'schema' === xl.value ? 'success' : 'warning' },
                          { default: () => ['schema' === xl.value ? 'Schema 已加载' : 'Schema 未完整加载'] }
                        )
                      ]),
                      a('div', { class: 'overview-page__query-metric-stats' }, [
                        a('div', null, [a('strong', null, [Ga.value.total]), a('span', null, [s('当前可选')])]),
                        a('div', null, [a('strong', null, [Ga.value.system]), a('span', null, [s('系统指标')])]),
                        a('div', null, [a('strong', null, [Ga.value.darwin]), a('span', null, [s('Darwin 来源')])]),
                        a('div', null, [a('strong', null, [Ga.value.labels]), a('span', null, [s('标签字段')])])
                      ]),
                      a('div', { class: 'overview-page__editor-discovery-filters' }, [
                        a(
                          m,
                          {
                            value: Pl.value.keyword,
                            placeholder: '搜索指标名、描述、标签、服务',
                            'onUpdate:value': (e) => {
                              Pl.value.keyword = e
                            }
                          },
                          null
                        ),
                        a(
                          t,
                          {
                            value: Pl.value.type || null,
                            clearable: !0,
                            placeholder: '指标类型',
                            options: Array.from(new Set(Ml.value.map((e) => e.type).filter(Boolean))).map((e) => ({
                              label: e,
                              value: e
                            })),
                            onUpdateValue: (e) => {
                              Pl.value.type = e || ''
                            }
                          },
                          null
                        )
                      ]),
                      Qa.value.length
                        ? a('div', { class: 'overview-page__editor-discovery-list overview-page__query-metric-list' }, [
                            Qa.value.slice(0, 60).map((e) => {
                              let l
                              return a(
                                'div',
                                {
                                  key: e.name,
                                  class: 'overview-page__editor-discovery-item overview-page__query-metric-item'
                                },
                                [
                                  a('div', { class: 'overview-page__editor-discovery-main' }, [
                                    a('div', { class: 'overview-page__editor-discovery-name' }, [e.name]),
                                    a('div', { class: 'overview-page__editor-discovery-description' }, [e.description]),
                                    a('div', { class: 'overview-page__editor-discovery-meta' }, [
                                      a(u, { size: 'small', bordered: !1 }, { default: () => [e.type] }),
                                      a(
                                        u,
                                        { size: 'small', bordered: !1, type: 'info' },
                                        { default: () => [e.unit || '无单位'] }
                                      ),
                                      a(
                                        u,
                                        {
                                          size: 'small',
                                          bordered: !1,
                                          type: e.scope.includes('system') ? 'warning' : 'default'
                                        },
                                        Fe((l = e.scope.join(' / '))) ? l : { default: () => [l] }
                                      ),
                                      a(
                                        u,
                                        {
                                          size: 'small',
                                          bordered: !1,
                                          type: 'darwin-event' === e.sourceKind ? 'success' : 'default'
                                        },
                                        { default: () => [e.sourceKind] }
                                      ),
                                      a(
                                        u,
                                        { size: 'small', bordered: !1, type: 'success' },
                                        { default: () => [s('聚合 '), e.allowedAggregations.join(', ')] }
                                      )
                                    ]),
                                    a('div', { class: 'overview-page__query-metric-detail-row' }, [
                                      a('span', null, [s('标签：')]),
                                      a('strong', null, [e.labelNames.length ? e.labelNames.join(', ') : '无标签'])
                                    ]),
                                    a('div', { class: 'overview-page__query-metric-detail-row' }, [
                                      a('span', null, [s('推荐展示：')]),
                                      a('strong', null, [e.recommendedVisualizations.join(', ') || e.recommendation])
                                    ])
                                  ]),
                                  a('div', { class: 'overview-page__query-metric-actions' }, [
                                    a(
                                      n,
                                      { size: 'small', type: 'primary', ghost: !0, onClick: () => Ei(e) },
                                      { default: () => [s('应用到表单')] }
                                    ),
                                    a(
                                      n,
                                      {
                                        size: 'small',
                                        secondary: !0,
                                        onClick: () =>
                                          ((e) => {
                                            var l, a, i, t
                                            const r = Ke(Gl.value).query || Ta.value,
                                              n = e.allowedAggregations.includes(r.aggregation)
                                                ? r.aggregation
                                                : e.allowedAggregations[0] || 'avg',
                                              s = e.recommendedVisualizations.includes(r.visualizationHint || 'line')
                                                ? r.visualizationHint
                                                : e.recommendedVisualizations[0] || 'line',
                                              u = e.scope.includes(r.scope) ? r.scope : e.scope[0] || 'tenant',
                                              o =
                                                'mixed' === e.sourceKind || 'auto' === e.sourceKind
                                                  ? r.sourceKind || 'auto'
                                                  : e.sourceKind,
                                              v = e.subjectKinds.includes(
                                                (null == (l = r.subject) ? void 0 : l.type) || 'system'
                                              )
                                                ? r.subject || { type: 'system' }
                                                : { type: e.subjectKinds[0] || 'system' },
                                              d =
                                                '%' === e.unit ||
                                                e.name.toLowerCase().includes('cpu') ||
                                                e.name.toLowerCase().includes('percent'),
                                              c = {
                                                ...r,
                                                metricRef: e.name,
                                                aggregation: n,
                                                visualizationHint: s,
                                                scope: u,
                                                sourceKind: o,
                                                subject: v,
                                                display: {
                                                  ...(r.display || {}),
                                                  value: d
                                                    ? { min: 0, max: 100, unit: '%' }
                                                    : {
                                                        ...((null == (a = r.display) ? void 0 : a.value) || {}),
                                                        unit:
                                                          e.unit ||
                                                          (null == (t = null == (i = r.display) ? void 0 : i.value)
                                                            ? void 0
                                                            : t.unit) ||
                                                          ''
                                                      }
                                                }
                                              }
                                            ;(Gl.value = JSON.stringify(
                                              { type: 'queryspec', version: 1, query: c },
                                              null,
                                              2
                                            )),
                                              (Yl.value = null)
                                          })(e)
                                      },
                                      { default: () => [s('写入 QuerySpec')] }
                                    )
                                  ])
                                ]
                              )
                            })
                          ])
                        : a(
                            q,
                            {
                              description: 'schema' === xl.value ? '当前筛选下没有指标' : '指标 schema 暂不可用',
                              class: 'overview-page__editor-query-empty'
                            },
                            null
                          )
                    ]),
                ai.value
                  ? a('div', { class: 'overview-page__editor-query-panel' }, [
                      a('div', { class: 'overview-page__editor-query-header' }, [
                        a('div', null, [
                          a('div', { class: 'overview-page__editor-query-title' }, [s('当前卡片可用指标')]),
                          a('div', { class: 'overview-page__editor-query-subtitle' }, [
                            s(
                              '这些是当前卡片类型已经支持并可保存到面板的指标；部分指标支持查询预览，部分指标走本地运行时渲染。'
                            )
                          ])
                        ]),
                        a(u, { size: 'small', bordered: !1, type: 'success' }, { default: () => [s('可直接使用')] })
                      ]),
                      a('div', { class: 'overview-page__editor-discovery-filters' }, [
                        a(
                          m,
                          {
                            value: Hl.value,
                            placeholder: '搜索当前卡片可用指标',
                            'onUpdate:value': (e) => {
                              Hl.value = e
                            }
                          },
                          null
                        )
                      ]),
                      ti.value.length
                        ? a('div', { class: 'overview-page__editor-discovery-list' }, [
                            ti.value.map((e) =>
                              a('div', { key: e.key, class: 'overview-page__editor-discovery-item' }, [
                                a('div', { class: 'overview-page__editor-discovery-main' }, [
                                  a('div', { class: 'overview-page__editor-discovery-name' }, [e.label]),
                                  a('div', { class: 'overview-page__editor-discovery-description' }, [e.description]),
                                  a('div', { class: 'overview-page__editor-discovery-meta' }, [
                                    a(u, { size: 'small', bordered: !1 }, { default: () => [Dl.value.kind] }),
                                    a(
                                      u,
                                      { size: 'small', bordered: !1, type: 'info' },
                                      { default: () => [e.unit || '无单位'] }
                                    ),
                                    a(
                                      u,
                                      { size: 'small', bordered: !1, type: 'success' },
                                      { default: () => [s('推荐 '), e.recommendation] }
                                    ),
                                    a(
                                      u,
                                      { size: 'small', bordered: !1, type: 'warning' },
                                      { default: () => [s('查询指标 '), e.label] }
                                    )
                                  ])
                                ]),
                                a(
                                  n,
                                  {
                                    size: 'small',
                                    type: 'primary',
                                    ghost: !0,
                                    onClick: () =>
                                      ((e) => {
                                        var l
                                        const a = Dl.value.title.trim(),
                                          i =
                                            (null == (l = se.find((e) => e.kind === Dl.value.kind))
                                              ? void 0
                                              : l.label) || '',
                                          t = a && a !== i ? Dl.value.title : e.title
                                        'metric-summary' !== Dl.value.kind
                                          ? 'trend' !== Dl.value.kind
                                            ? 'darwin-infra-summary' !== Dl.value.kind
                                              ? 'darwin-infra-trend' === Dl.value.kind &&
                                                fi({
                                                  title: t,
                                                  config: { ...Ut.value, ...e.configPatch },
                                                  editor: { ...Pa.value, displayedMetrics: e.displayedMetrics }
                                                })
                                              : fi({
                                                  title: t,
                                                  config: { ...Ot.value, ...e.configPatch },
                                                  editor: { ...Pa.value, displayedMetrics: e.displayedMetrics }
                                                })
                                            : fi({
                                                title: t,
                                                config: { ...Ct.value, ...e.configPatch },
                                                editor: { ...Pa.value, displayedMetrics: e.displayedMetrics }
                                              })
                                          : fi({
                                              title: t,
                                              config: { ...Mt.value, ...e.configPatch },
                                              editor: { ...Pa.value, displayedMetrics: e.displayedMetrics }
                                            })
                                      })(e)
                                  },
                                  { default: () => [s('应用')] }
                                )
                              ])
                            )
                          ])
                        : a(
                            q,
                            {
                              description: '当前关键词下没有可直接用于这张卡片的指标。',
                              class: 'overview-page__editor-query-empty'
                            },
                            null
                          )
                    ])
                  : null,
                i ? Nt() : null
              ])
            }),
            l
          )
        }
      return () => {
        var e, l
        let t
        return a('div', { class: ['overview-page', Il.value ? 'overview-page--large-screen' : ''] }, [
          Il.value
            ? a(
                n,
                { class: 'overview-page__large-screen-exit', size: 'small', type: 'warning', ghost: !0, onClick: ga },
                { default: () => [s('退出大屏')] }
              )
            : a(b, null, [
                a(
                  X,
                  { title: '看板', subtitle: '集中查看系统健康、风险服务和关键事件，支持保存常用看板布局。' },
                  {
                    actions: () =>
                      a(
                        n,
                        {
                          secondary: !0,
                          onClick: () => {
                            ;(aa.value = 0), o.refreshTime(), rt()
                          }
                        },
                        { default: () => [s('刷新')] }
                      )
                  }
                ),
                a(
                  i,
                  { bordered: !1, class: 'overview-page__control-panel' },
                  {
                    default: () => [
                      a('div', { class: 'overview-page__control-toolbar' }, [
                        a('div', { class: 'overview-page__time-control-shell' }, [
                          a(
                            Y,
                            {
                              value: o.timeRange,
                              live: o.isLive,
                              options: qa.value,
                              autoRefreshValue: ea.value,
                              autoRefreshOptions: Ye,
                              autoRefreshHint: La.value,
                              'onUpdate:value': (e) => {
                                o.setTimeRange(e)
                              },
                              'onUpdate:live': (e) => {
                                ;(o.isLive = e), e && o.refreshTime(), rt()
                              },
                              'onUpdate:autoRefresh': (e) => {
                                Ze(e) &&
                                  ((aa.value = 0),
                                  (ea.value = e),
                                  na.value || I(Qe, { autoRefresh: e, updatedAt: Date.now() }).catch((e) => {}),
                                  o.isLive &&
                                    ('auto' === e ? Boolean(Oa.value) : 'off' !== e) &&
                                    (o.refreshTime(), tt()))
                              },
                              onRefresh: () => {
                                ;(aa.value = 0), o.refreshTime(), rt()
                              }
                            },
                            null
                          )
                        ]),
                        a('div', { class: 'overview-page__service-search' }, [
                          a(
                            m,
                            {
                              value: Oe.value.service || '',
                              placeholder: '全部服务',
                              clearable: !0,
                              'onUpdate:value': (e) => {
                                Oe.value = { service: e || null }
                              },
                              onKeydown: (e) => {
                                'Enter' === e.key && rt()
                              }
                            },
                            null
                          ),
                          a(
                            n,
                            {
                              class: 'overview-page__service-search-button',
                              type: 'primary',
                              secondary: !0,
                              onClick: () => rt()
                            },
                            { default: () => [s('搜索')] }
                          )
                        ])
                      ])
                    ]
                  }
                ),
                a(
                  Ce,
                  {
                    panel: ha.value,
                    panelOptions: Ol.value,
                    capabilities: ka.value,
                    canRestore: Boolean(Ul.value[(null == (e = ha.value) ? void 0 : e.id) || '']),
                    canEdit: za.value,
                    editMode: jl.value,
                    largeScreenMode: Il.value,
                    'onChange-panel': (e) => {
                      Ll.value = e
                    },
                    'onDuplicate-panel': Yi,
                    'onRename-panel': Zi,
                    'onDelete-panel': lt,
                    'onRestore-panel': at,
                    'onSave-default': ri,
                    'onToggle-edit': () => {
                      Il.value ? ma() : (jl.value = !jl.value)
                    },
                    'onToggle-large-screen': ya,
                    'onAdd-widget': Vi,
                    'onExport-cards': di,
                    'onImport-cards': ci
                  },
                  null
                ),
                a(
                  'input',
                  {
                    ref: ua,
                    type: 'file',
                    accept: 'application/json,.json',
                    class: 'overview-page__cards-import-input',
                    onChange: mi
                  },
                  null
                )
              ]),
          !Il.value && xa.value.length
            ? a(
                i,
                { bordered: !1, class: 'overview-page__tag-filter-card' },
                {
                  default: () => [
                    a('div', { class: 'overview-page__tag-filter-head' }, [
                      a('div', null, [
                        a('div', { class: 'overview-page__tag-filter-title' }, [s('卡片分类')]),
                        a('div', { class: 'overview-page__tag-filter-description' }, [
                          s('默认展示全部，点击分类仅过滤当前面板。')
                        ])
                      ]),
                      Ra.value
                        ? a(
                            n,
                            { size: 'small', quaternary: !0, onClick: () => (Ra.value = '') },
                            { default: () => [s('清除过滤')] }
                          )
                        : null
                    ]),
                    a(
                      'div',
                      { class: 'overview-page__tag-filter-list', role: 'tablist', 'aria-label': '卡片标签过滤' },
                      [
                        a(
                          'button',
                          {
                            type: 'button',
                            class: ['overview-page__tag-filter-chip', Ra.value ? '' : 'is-active'],
                            onClick: () => (Ra.value = '')
                          },
                          [
                            a('span', null, [s('全部')]),
                            a('span', { class: 'overview-page__tag-filter-count' }, [Ma.value.length])
                          ]
                        ),
                        xa.value.map((e) =>
                          a(
                            'button',
                            {
                              key: e.tag,
                              type: 'button',
                              class: ['overview-page__tag-filter-chip', Ra.value === e.tag ? 'is-active' : ''],
                              onClick: () => (Ra.value = e.tag)
                            },
                            [
                              a('span', null, [e.tag]),
                              a('span', { class: 'overview-page__tag-filter-count' }, [e.count])
                            ]
                          )
                        )
                      ]
                    ),
                    Ra.value
                      ? a('div', { class: 'overview-page__tag-filter-result' }, [
                          s('正在查看 '),
                          a('strong', null, [Ra.value]),
                          s(' 标签下的 '),
                          Aa.value,
                          s(' 张卡片。')
                        ])
                      : null
                  ]
                }
              )
            : null,
          jl.value && !Il.value
            ? a(
                i,
                { bordered: !1, class: 'overview-page__edit-notice' },
                {
                  default: () => [
                    a('div', { class: 'overview-page__edit-notice-text' }, [
                      s(
                        '当前处于编辑态：支持切换模板、复制为用户面板、通过卡片右上角“拖拽排序”手柄调整顺序、尺寸切换与 widget 配置。当前面板状态会通过后端存储保存，并在恢复时优先读取后端持久化结果。'
                      )
                    ])
                  ]
                }
              )
            : null,
          Ue.value
            ? a('div', { class: 'overview-page__skeleton', 'aria-busy': 'true', 'aria-label': '看板数据加载中' }, [
                a('div', { class: 'overview-page__skeleton-header' }, [
                  a('div', null, [
                    a('div', { class: 'overview-page__skeleton-kicker' }, null),
                    a('div', { class: 'overview-page__skeleton-title' }, null)
                  ]),
                  a('div', { class: 'overview-page__skeleton-status' }, [
                    a('span', null, null),
                    s('正在并行加载指标、服务与卡片数据')
                  ])
                ]),
                a('div', { class: 'overview-page__masonry-grid overview-page__skeleton-grid' }, [
                  [
                    { key: 'hero', size: 'L', lines: 7 },
                    { key: 'health', size: 'S', lines: 5 },
                    { key: 'latency', size: 'S', lines: 5 },
                    { key: 'trend', size: 'M', lines: 6 },
                    { key: 'incidents', size: 'M', lines: 7 },
                    { key: 'ingest', size: 'S', lines: 5 }
                  ].map((e) =>
                    a('div', { key: e.key, class: 'overview-page__grid-item', style: { gridColumn: Hi(e.size) } }, [
                      a(
                        'div',
                        {
                          class: [
                            'overview-page__skeleton-card',
                            `overview-page__skeleton-card--${e.size.toLowerCase()}`
                          ]
                        },
                        [
                          a('div', { class: 'overview-page__skeleton-card-top' }, [
                            a('div', { class: 'overview-page__skeleton-card-title' }, null),
                            a('div', { class: 'overview-page__skeleton-pill' }, null)
                          ]),
                          a('div', { class: 'overview-page__skeleton-card-subtitle' }, null),
                          a('div', { class: 'overview-page__skeleton-lines' }, [
                            Array.from({ length: e.lines }).map((e, l) => a('span', { key: l }, null))
                          ])
                        ]
                      )
                    ])
                  )
                ])
              ])
            : Ca.value.length
              ? a(
                  'div',
                  {
                    class: [
                      'overview-page__grid-shell',
                      (null == (l = ca.value) ? void 0 : l.active) ? 'is-reordering' : ''
                    ]
                  },
                  [
                    a(
                      'div',
                      {
                        ref: (e) =>
                          ((e) => {
                            const l =
                              e instanceof Element ? e : (null == e ? void 0 : e.$el) instanceof Element ? e.$el : null
                            sa.value = l instanceof HTMLElement ? l : null
                          })(e),
                        class: 'overview-page__masonry-grid'
                      },
                      [
                        Ca.value.map((e) => {
                          var l, i, t
                          return a(
                            'div',
                            {
                              key: e.id,
                              ref: (l) =>
                                ((e, l) => {
                                  const a =
                                      l instanceof Element
                                        ? l
                                        : (null == l ? void 0 : l.$el) instanceof Element
                                          ? l.$el
                                          : null,
                                    i = a instanceof HTMLElement ? a : null
                                  ;(oa.get(e) || null) !== i && (i ? oa.set(e, i) : oa.delete(e))
                                })(e.id, l),
                              class: 'overview-page__grid-item',
                              style: { gridColumn: Hi(e.size) }
                            },
                            [
                              a(
                                'div',
                                {
                                  ref: (l) =>
                                    ((e, l) => {
                                      const a =
                                          l instanceof Element
                                            ? l
                                            : (null == l ? void 0 : l.$el) instanceof Element
                                              ? l.$el
                                              : null,
                                        i = a instanceof HTMLElement ? a : null
                                      ;(va.get(e) || null) !== i && (i ? va.set(e, i) : va.delete(e))
                                    })(e.id, l),
                                  class: [
                                    'overview-page__widget-shell',
                                    (null == (l = ca.value) ? void 0 : l.dragId) === e.id && ca.value.active
                                      ? 'overview-page__widget-shell--dragging'
                                      : '',
                                    (null == (i = pa.value) ? void 0 : i.targetId) === e.id &&
                                    'before' === pa.value.placement
                                      ? 'overview-page__widget-shell--drop-before'
                                      : '',
                                    (null == (t = pa.value) ? void 0 : t.targetId) === e.id &&
                                    'after' === pa.value.placement
                                      ? 'overview-page__widget-shell--drop-after'
                                      : ''
                                  ],
                                  'data-widget-id': e.id
                                },
                                [
                                  a(
                                    Le,
                                    h(
                                      {
                                        widget: e,
                                        editMode: jl.value && !Il.value,
                                        panelEditable: za.value && !Il.value
                                      },
                                      {
                                        'onReorder-pointerdown': (l) => {
                                          return (
                                            (a = e.id),
                                            (i = l),
                                            void (Il.value
                                              ? ma()
                                              : jl.value &&
                                                za.value &&
                                                0 === i.button &&
                                                (i.preventDefault(),
                                                (ca.value = {
                                                  pointerId: i.pointerId,
                                                  dragId: a,
                                                  startX: i.clientX,
                                                  startY: i.clientY,
                                                  currentX: i.clientX,
                                                  currentY: i.clientY,
                                                  active: !1
                                                }),
                                                (pa.value = null),
                                                Ji(),
                                                window.addEventListener('pointermove', Gi),
                                                window.addEventListener('pointerup', Xi),
                                                window.addEventListener('pointercancel', Xi)))
                                          )
                                          var a, i
                                        }
                                      },
                                      {
                                        onConfigure: () => {
                                          return (
                                            (l = e),
                                            void (Il.value
                                              ? ma()
                                              : za.value &&
                                                ((Dl.value = yi(kl(l))), (Bl.value = 'update'), (El.value = !0)))
                                          )
                                          var l
                                        },
                                        onRemove: () => {
                                          return (
                                            (l = e.id),
                                            void (Il.value
                                              ? ma()
                                              : za.value &&
                                                (vi((e) => ({ ...e, widgets: e.widgets.filter((e) => e.id !== l) })),
                                                v.success('组件已移除')))
                                          )
                                          var l
                                        },
                                        onResize: (l) => {
                                          return (
                                            (a = e.id),
                                            (i = l),
                                            void (Il.value
                                              ? ma()
                                              : za.value &&
                                                vi((e) => ({
                                                  ...e,
                                                  widgets: e.widgets.map((e) => {
                                                    if (e.id !== a) return e
                                                    const l = re({ ...e, size: i })
                                                    return 'S' !== i || te(l) ? l : { ...l, size: 'M' }
                                                  })
                                                })))
                                          )
                                          var a, i
                                        }
                                      }
                                    ),
                                    { default: () => zt(e) }
                                  )
                                ]
                              )
                            ]
                          )
                        })
                      ]
                    )
                  ]
                )
              : a(
                  i,
                  { bordered: !1, class: 'overview-page__widgets-empty-card' },
                  {
                    default: () => [
                      a(
                        q,
                        {
                          description: Ra.value
                            ? `没有匹配「${Ra.value}」标签的卡片。`
                            : '当前面板还是空的，请新增第一张指标卡片。',
                          class: 'overview-page__widgets-empty'
                        },
                        {
                          extra: () =>
                            Ra.value
                              ? a(
                                  n,
                                  { type: 'primary', secondary: !0, onClick: () => (Ra.value = '') },
                                  { default: () => [s('查看全部卡片')] }
                                )
                              : a(n, { type: 'primary', onClick: Vi }, { default: () => [s('添加第一张卡片')] })
                        }
                      )
                    ]
                  }
                ),
          (Il.value,
          Il.value
            ? null
            : a(
                je,
                {
                  show: El.value,
                  mode: Bl.value,
                  confirmLoading: Tl.value,
                  draft: yi(Dl.value),
                  widgetTypeOptions: Rt.value.map((e) => ({ label: e.label, value: e.value })),
                  tagOptions: $a.value,
                  granularityOptions: el,
                  timeRangeOptions: Ia.value,
                  showTimeSettings:
                    'query-card' === Dl.value.kind ||
                    'trend' === Dl.value.kind ||
                    'darwin-infra-summary' === Dl.value.kind ||
                    'darwin-infra-trend' === Dl.value.kind ||
                    'darwin-instance-table' === Dl.value.kind ||
                    ('metric-summary' === Dl.value.kind &&
                      !['healthy-services', 'ingest-success-rate'].includes(String(ei.value || ''))),
                  metricOptions: li.value,
                  comparisonOptions: il,
                  sizeOptions: Xe.map((e) => ({
                    label: e.label,
                    value: e.value,
                    description: 'S' === e.value ? '紧凑卡片' : 'M' === e.value ? '标准宽度' : '大尺寸卡片'
                  })),
                  visualizationOptions: 'query-card' === Dl.value.kind ? Za.value : ja.value,
                  showVisualizationOptions: [
                    'query-card',
                    'metric-summary',
                    'trend',
                    'darwin-infra-summary',
                    'darwin-infra-trend',
                    'darwin-instance-table'
                  ].includes(Dl.value.kind),
                  allowSmallSize: te(yi(Dl.value)),
                  showMetricSelector: ['metric-summary', 'trend'].includes(Dl.value.kind),
                  metricSelectorMultiple: !1,
                  showComparisonSelector: !1,
                  showDisplayOptions: !1,
                  settingsSectionTitle: Et.value.supported ? '专项设置与查询预览' : '专项设置',
                  settingsSectionDescription: Et.value.supported
                    ? '补充当前卡片专属配置，并通过查询网关预览或查看高级脚本。'
                    : '补充当前卡片专属配置。',
                  'onUpdate:show': (e) => (El.value = e),
                  'onUpdate:draft': (e) => fi(e),
                  'onKind-change': (e) => Bi(e),
                  onConfirm: Ki
                },
                Fe((t = Kt())) ? t : { default: () => [t] }
              )),
          Il.value
            ? null
            : a(
                k,
                {
                  show: Nl.value,
                  preset: 'dialog',
                  title: 'duplicate' === ta.value ? '创建用户面板' : '重命名用户面板',
                  'onUpdate:show': (e) => (Nl.value = e)
                },
                {
                  default: () => [
                    a(S, null, {
                      default: () => [
                        a(
                          z,
                          { label: '面板名称' },
                          {
                            default: () => [
                              a(
                                m,
                                {
                                  value: ra.value,
                                  placeholder: '请输入面板名称',
                                  'onUpdate:value': (e) => (ra.value = e)
                                },
                                null
                              )
                            ]
                          }
                        )
                      ]
                    }),
                    a('div', { class: 'overview-page__modal-actions' }, [
                      a(n, { onClick: () => (Nl.value = !1) }, { default: () => [s('取消')] }),
                      a(
                        n,
                        { type: 'primary', onClick: et },
                        { default: () => ['duplicate' === ta.value ? '创建面板' : '保存名称'] }
                      )
                    ])
                  ]
                }
              )
        ])
      }
    }
  })
export { Pl as default }
