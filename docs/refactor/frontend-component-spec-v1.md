# StarLight 组件库详细规格文档 v1

这份文档的目标，是把未来 StarLight 的前端能力从“页面里临时拼 UI”提升成“围绕设计系统的可复用监控组件库”。

组件分为 5 层：

1. Shell / 页面框架组件
2. 实体组件
3. 观测卡片组件
4. 数据探索组件
5. 专业观测组件

### Overview 面板共享类型

```ts
type OverviewCapability = 'metrics' | 'logs' | 'traces' | 'alerts' | 'serviceCatalog' | 'ingestion'

type OverviewWidgetType =
  | 'metric-summary'
  | 'risk-service'
  | 'incident'
  | 'ingest-status'
  | 'trend'
  | 'quick-pivot'
  | 'log-patterns'
  | 'trace-latency'

type OverviewWidgetSize = 'S' | 'M' | 'L'

type OverviewWidget = {
  id: string
  type: OverviewWidgetType
  title: string
  description?: string
  capability: OverviewCapability
  size: OverviewWidgetSize
  order: number
  config: Record<string, unknown>
}

type OverviewWidgetDraft = Omit<OverviewWidget, 'id'>

type OverviewWidgetCatalogItem = {
  type: OverviewWidgetType
  title: string
  description?: string
  capability: OverviewCapability
  defaultSize: OverviewWidgetSize
}

type OverviewPanel = {
  id: string
  name: string
  kind: 'system' | 'preset' | 'user'
  editable: boolean
  isDefault?: boolean
  widgets: OverviewWidget[]
  createdAt: string
  updatedAt: string
}
```

### Overview widget catalog

| type | display | capability | sizes | default | data source | local config | empty state | drill-down |
|---|---|---|---|---|---|---|---|---|
| `metric-summary` | 指标摘要 | `metrics` | `S` | `S` | `overview summary` / `overview trends` | metricKey / service / env / region / tags / threshold / compareWindow | 显示“未接入指标能力”或“暂无指标数据” | metrics / alerts / service detail |
| `risk-service` | 风险服务 | `serviceCatalog` | `M` | `M` | `overview risk-services` | env / team / tags / limit | 显示“暂无风险服务” | service detail |
| `incident` | 最近事件 | `alerts` | `M` | `M` | `overview incidents` | severity / source / env / limit | 显示“当前无关键事件” | alert inbox / traces / logs / service |
| `ingest-status` | 接入状态 | `ingestion` | `M` | `M` | `overview ingest-status` | env / source | 显示“尚未接入采集能力” | admin ingestion |
| `trend` | 趋势图 | `metrics` | `L` | `L` | `overview trends` | metric / aggregation / groupBy / service / env / compareWindow | 显示“暂无趋势数据” | metrics explorer |
| `quick-pivot` | 快捷入口 | `serviceCatalog` | `S` / `M` | `S` | local action model | link set / shortcut visibility | 不走通用 empty 壳层；系统必须注入基础默认入口 | services / topology / traces / logs |
| `log-patterns` | 日志模式摘要 | `logs` | `M` | `M` | logs patterns / recent clusters read model（后续扩展） | service / env / tags / limit | 显示“暂无日志模式” | logs explorer |
| `trace-latency` | 链路延迟摘要 | `traces` | `M` / `L` | `M` | traces summary / latency distribution read model（后续扩展） | service / env / operation / limit | 显示“暂无链路数据” | trace explorer |

### Overview widget component mapping

| component name | widget type | role |
|---|---|---|
| `MetricSummaryWidget` | `metric-summary` | Small KPI / compare widget |
| `RiskServiceWidget` | `risk-service` | Medium risk-service list widget |
| `IncidentWidget` | `incident` | Medium recent-incident widget |
| `IngestStatusWidget` | `ingest-status` | Medium ingest health widget |
| `TrendWidget` | `trend` | Large trend/series widget |
| `QuickPivotWidget` | `quick-pivot` | Small/medium quick-entry widget |
| `LogPatternsWidget` | `log-patterns` | Later-extension logs summary widget |
| `TraceLatencyWidget` | `trace-latency` | Later-extension traces summary widget |

说明：
- wireframe 中的组件名用于页面装配与实现命名。
- widget type 用于面板定义、持久化、能力 gating、AddWidgetDrawer 与 WidgetConfigDrawer。
- 两者必须保持一一映射，不允许同一组件名对应多个 widget type。

### Capability gating rules

- capability 未接入时，widget 默认不出现在 `AddWidgetDrawer` 可添加列表中。
- 若用户已保存的面板包含当前不可用 capability 的 widget：
  - 查看态显示 widget 壳层空态与“能力未接入”说明
  - 编辑态允许删除该 widget，但不允许继续配置不可用数据源
- `quick-pivot` 可作为系统默认模板中的兜底 widget，即使其它能力未接入，也应保留服务目录/接入管理等基础入口。

### Widget config rules

- `metric-summary`：支持 `metricKey / service / env / region / tags / threshold / compareWindow`
- `risk-service`：支持 `env / team / tags / limit`
- `incident`：支持 `severity / source / env / limit`
- `ingest-status`：支持 `env / source`
- `trend`：支持 `metric / aggregation / groupBy / service / env / compareWindow`
- `log-patterns`：支持 `service / env / tags / limit`
- `trace-latency`：支持 `service / env / operation / limit / compareWindow`
- `quick-pivot`：支持 `links[] / title / description`，不支持复杂查询配置

### Widget rendering contract

- 所有 Overview widget 都必须统一支持：`loading / error / empty / capability-blocked` 四种壳层状态。
- `quick-pivot` 是唯一例外：它不进入通用 `empty` 壳层，系统必须注入一组基础默认入口（至少包含服务目录或接入管理）作为兜底内容。
- `PanelWidgetCard` 负责承载这些通用状态，具体 widget 不重复定义壳层行为。
- 除 `quick-pivot` 外，widget 的 drill-down 只能来自该 widget 自身 capability 对应的真实落点；`quick-pivot` 允许承载跨 capability 的导航入口，因为它的职责就是面板级排查跳板。

每个组件统一定义：

- 职责
- Props
- Emits
- Slots
- 内部状态
- 样式规则
- 使用场景
- 禁止场景

---

## 1. Shell / 页面框架组件

---

## 1.1 `PageHeader`

### 职责
统一所有页面的标题区，替代每个页面各写一套 title + subtitle + action。

### Props
```ts
type PageHeaderProps = {
  title: string
  subtitle?: string
  meta?: Array<{ label: string; value: string | number }>
  sticky?: boolean
  compact?: boolean
}
```

### Emits
无

### Slots
- `actions`
- `extra`
- `meta`

### 内部状态
无状态组件

### 样式规则
- title 用 `--font-size-title-3`
- subtitle 用 `--color-text-3`
- 左右布局固定
- 支持 sticky，但 sticky 时阴影和底色要跟随 theme

### 使用场景
- 所有一级页面
- 服务详情页
- 规则编辑页

### 禁止场景
- modal 内部
- drawer header 内部

---

## 1.2 `TimeRangeBar`

### 职责
统一时间范围控制与自动刷新策略。

### Props
```ts
type TimeRangeBarProps = {
  value: TimeRange
  refreshInterval?: number | null
  allowCompare?: boolean
  allowAutoRefresh?: boolean
  presets?: TimePreset[]
  disabled?: boolean
}
```

### Emits
```ts
type Emits = {
  'update:value': [TimeRange]
  'update:refreshInterval': [number | null]
  refresh: []
  compareChange: [CompareRange | null]
}
```

### Slots
- `left`
- `right`

### 内部状态
- preset active
- custom picker open
- compare enabled

### 样式规则
- 高度固定
- 与 ScopeBar 连续摆放
- compact toolbar 风格
- dark/light 下 hover 背景要一致

### 使用场景
- overview
- service detail
- topology
- logs/traces/metrics explorer
- alert inbox

### 禁止场景
- 登录页
- onboarding

---

## 1.3 `ScopeBar`

### 职责
统一上下文筛选。

### Props
```ts
type ScopeBarProps = {
  value: ScopeFilter
  options: {
    envs?: Option[]
    services?: Option[]
    regions?: Option[]
    teams?: Option[]
    appKeys?: Option[]
    instances?: Option[]
    tags?: Option[]
  }
  mode?: 'global' | 'service'
}
```

### Emits
```ts
type Emits = {
  'update:value': [ScopeFilter]
  change: [ScopeFilter]
  reset: []
}
```

### Slots
- `extraFilters`
- `actions`

### 内部状态
- 当前展开筛选项
- advanced mode open

### 样式规则
- 多筛选器横向排列
- 超宽时自动折叠进更多筛选
- current chips 固定显示

### 使用场景
- overview
- services list
- topology
- investigate pages

### 禁止场景
- 详情 drawer
- 小型局部卡片

---

## 1.4 `ContextTabs`

### 职责
用于服务详情页等上下文内功能切换。

### Props
```ts
type ContextTabsProps = {
  value: string
  items: Array<{ key: string; label: string; badge?: number; disabled?: boolean }>
}
```

### Emits
```ts
type Emits = {
  'update:value': [string]
  change: [string]
}
```

### Slots
- `label`
- `suffix`

### 内部状态
无

### 样式规则
- 不是浏览器 tab 视觉
- 更偏内容切换条
- active 态要简洁，不要过度高亮

### 使用场景
- service detail
- alert rule editor
- admin 页面

### 禁止场景
- 左侧导航替代品

---

## 1.5 `PanelToolbar`

### 职责
统一面板首页的顶层操作，承载面板切换、模板切换与编辑态入口。

### Props
```ts
type PanelToolbarProps = {
  activePanelId: string
  panels: Array<{
    id: string
    name: string
    kind: 'system' | 'preset' | 'user'
    editable: boolean
    isDefault?: boolean
  }>
  editMode: boolean
  canCreate?: boolean
  canDuplicate?: boolean
  canSaveDefault?: boolean
  canRestore?: boolean
}
```

### Emits
```ts
type Emits = {
  'update:activePanelId': [string]
  toggleEdit: [boolean]
  createPanel: []
  duplicatePanel: [string]
  saveDefault: [string]
  restorePanel: [string]
  openAddWidget: []
}
```

### Slots
- `left`
- `right`

### 内部状态
- 当前面板选择
- 模板分组展开状态

### 样式规则
- 与 `PageHeader`、`TimeRangeBar` 保持同一横向工具条语义
- 编辑态按钮与查看态按钮要明显分组
- 恢复动作属于 panel 级操作，应与“保存默认面板”并列而不是下沉到 widget 内
- 不承担 widget 内部筛选能力

### 使用场景
- `/home/overview` panel-first 首页

### 禁止场景
- service detail tab 内
- logs / traces / metrics explorer 页面

---

## 1.6 `PanelCanvas`

### 职责
承载 widget 布局与渲染，不再把首页写死成固定区块顺序。

### Props
```ts
type PanelCanvasProps = {
  panel: {
    id: string
    name: string
    widgets: OverviewWidget[]
  }
  editMode: boolean
  capabilities: OverviewCapability[]
}
```

### Emits
```ts
type Emits = {
  reorder: [OverviewWidget[]]
  resize: [{ widgetId: string; size: 'S' | 'M' | 'L' }]
  remove: [string]
  configure: [string]
  widgetClick: [string]
}
```

### Slots
- `widget`
- `empty`

### 内部状态
- 拖拽排序状态
- 布局占位态

### 样式规则
- 查看态与编辑态视觉明确区分
- 空面板必须给出添加组件引导，而不是空白页
- widget 间距统一，不应隐式耦合固定首页区块顺序

### 使用场景
- `/home/overview` 作为 panel-first 首页容器
- 系统模板 / 场景模板 / 用户面板的共享容器

### 禁止场景
- 单个 widget 内部
- service detail tab 局部卡片区

---

## 1.6.1 `PanelWidgetCard`

### 职责
作为面板 widget 的共享壳层，统一承载标题、描述、动作区、尺寸语义、空状态与编辑态操作，不让每个 widget 自己重复拼容器。

### Props
```ts
type PanelWidgetCardProps = {
  widget: OverviewWidget
  editMode: boolean
  loading?: boolean
  error?: string | null
  capabilityReady?: boolean
  empty?: boolean
}
```

### Emits
```ts
type Emits = {
  configure: [string]
  remove: [string]
  resize: [{ widgetId: string; size: 'S' | 'M' | 'L' }]
  click: [string]
}
```

### Slots
- `title`
- `description`
- `actions`
- `default`
- `empty`
- `error`

### 内部状态
- hover / focus
- 编辑态操作显隐

### 样式规则
- S / M / L 三档尺寸只影响容器布局和内容密度，不改变页面级网格语义
- capability 未接入时优先走壳层空态，而不是让具体 widget 自己伪装有数据
- 编辑态操作（配置 / 删除 / 尺寸切换）固定在壳层，不散落到 widget 内容区
- error 状态与 empty 状态必须由壳层统一托底，避免每个 widget 各自定义错误样式
- 不直接承担 TimeRangeBar / ScopeBar 等全局筛选职责

### 使用场景
- `/home/overview` 的所有 widget 容器
- 未来系统模板 / 场景模板 / 用户面板中的共享 widget 壳层

### 禁止场景
- service detail tab 普通信息卡
- investigate 页面主结果面板
- alerts / logs / traces 的 detail drawer

---

## 1.7 `AddWidgetDrawer`

### 职责
在编辑态下按 capability 展示可添加 widget，避免用户看到未接入能力的假组件。

### Props
```ts
type AddWidgetDrawerProps = {
  show: boolean
  capabilities: OverviewCapability[]
  widgetCatalog: OverviewWidgetCatalogItem[]
}
```

### Emits
```ts
type Emits = {
  'update:show': [boolean]
  addWidget: [OverviewWidgetDraft]
}
```

### Slots
- `empty`
- `item`

### 内部状态
- capability 分组展开状态
- 搜索关键词

### 样式规则
- 按 capability 分区
- 未接入能力使用空态/禁用说明，不伪装成可添加
- 不承担 widget 详细配置

### 使用场景
- `/home/overview` 编辑态

### 禁止场景
- 查看态首页
- service detail / investigate 页面

---

## 1.8 `WidgetConfigDrawer`

### 职责
编辑单个 widget 的局部配置，而不是修改全局 ScopeBar。

### Props
```ts
type WidgetConfigDrawerProps = {
  show: boolean
  widget: OverviewWidget | null
  options: {
    services?: Option[]
    envs?: Option[]
    regions?: Option[]
    tags?: Option[]
    teams?: Option[]
  }
}
```

### Emits
```ts
type Emits = {
  'update:show': [boolean]
  save: [OverviewWidget]
  remove: [string]
}
```

### Slots
- `footer`

### 内部状态
- widget 临时草稿
- dirty 状态

### 样式规则
- 配置项分组展示：范围、查询、展示、尺寸
- 删除行为与保存行为明显分离
- 不承担面板级模板选择

### 使用场景
- `/home/overview` 编辑态

### 禁止场景
- 查看态首页
- 用作全局筛选面板

---

## 2. 实体组件

---

## 2.1 `ServiceIdentityCard`

### 职责
统一显示服务身份信息。

### Props
```ts
type ServiceIdentityCardProps = {
  service: {
    id: string
    name: string
    displayName?: string
    owner?: string
    team?: string
    env?: string
    region?: string
    runtime?: string
    appKey?: string
    tags?: string[]
    repoUrl?: string
    runbookUrl?: string
  }
  compact?: boolean
}
```

### Emits
```ts
type Emits = {
  ownerClick: [string]
  teamClick: [string]
  tagClick: [string]
}
```

### Slots
- `actions`
- `footer`

### 内部状态
无

### 样式规则
- 服务名是视觉主标题
- 标签区可折叠
- 链接按钮（repo/runbook）统一 secondary style

### 使用场景
- service detail
- topology panel
- drawer quick view

### 禁止场景
- services list 行内（行内只应用精简版）

---

## 2.2 `ServiceHealthBadge`

### 职责
统一服务健康状态显示。

### Props
```ts
type ServiceHealthBadgeProps = {
  status: 'healthy' | 'degraded' | 'critical' | 'muted' | 'unknown'
  pulse?: boolean
  size?: 'sm' | 'md'
}
```

### Emits
无

### Slots
- default（允许自定义文案）

### 内部状态
无

### 样式规则
- healthy = success
- degraded = warning
- critical = danger
- muted = neutral
- unknown = text-3
- pulse 仅 critical / degraded 可用

### 使用场景
- 服务目录
- service detail
- topology side panel
- alert row

### 禁止场景
- 表示 deployment 状态
- 表示 ingest 状态

---

## 2.3 `InstanceCard`

### 职责
展示单实例状态和资源概览。

### Props
```ts
type InstanceCardProps = {
  instance: {
    id: string
    host?: string
    ip?: string
    service: string
    status: string
    cpu?: number
    memory?: number
    uptime?: number
    restartCount?: number
  }
}
```

### Emits
```ts
type Emits = {
  click: [string]
  logs: [string]
  traces: [string]
}
```

### Slots
- `metrics`
- `actions`

### 内部状态
无

### 使用场景
- 实例监控页
- service runtime tab

### 禁止场景
- 总览 summary 区

---

## 2.4 `SignalPill`

### 职责
表示信号来源/类型。

### Props
```ts
type SignalPillProps = {
  type: 'metrics' | 'trace' | 'logs' | 'alerts' | 'quota' | 'ingest'
  size?: 'xs' | 'sm'
}
```

### Emits
无

### 样式规则
- 不使用过强背景
- 颜色来自 semantic token

### 使用场景
- incident card
- alert row
- correlation panel

---

## 3. 观测卡片组件

---

## 3.1 `RedSummaryCard`

### 职责
统一显示 RED 指标及趋势。

### Props
```ts
type RedSummaryCardProps = {
  label: string
  value: number | string
  unit?: string
  delta?: number
  trend?: TimeSeriesPoint[]
  severity?: 'normal' | 'warning' | 'critical'
}
```

### Emits
```ts
type Emits = {
  click: []
}
```

### Slots
- `icon`
- `suffix`

### 内部状态
无

### 样式规则
- card 高度固定
- 数值字体大于 label
- delta 使用上下箭头
- severity 只影响边框/左侧标识，不整卡大红大绿

### 使用场景
- overview
- service detail
- topology panel

### 禁止场景
- 详细时间序列主图位置

---

## 3.2 `IncidentCard`

### 职责
展示风险事件。

### Props
```ts
type IncidentCardProps = {
  incident: {
    id: string
    title: string
    severity: 'info' | 'warning' | 'critical'
    service?: string
    source: 'metrics' | 'logs' | 'traces' | 'alerts'
    startedAt: number
    status: string
    summary?: string
  }
}
```

### Emits
```ts
type Emits = {
  click: [string]
}
```

### 使用场景
- overview
- service overview tab

---

## 3.3 `IngestStatusCard`

### 职责
展示采集链路状态。

### Props
```ts
type IngestStatusCardProps = {
  status: {
    source: 'metrics' | 'logs' | 'traces'
    healthy: boolean
    delayMs?: number
    dropRate?: number
    lastSeenAt?: number
  }
}
```

### Emits
```ts
type Emits = {
  click: [string]
}
```

### 使用场景
- overview
- admin ingestion

---

## 3.4 `QuotaUsageCard`

### 职责
显示额度和消耗趋势。

### Props
```ts
type QuotaUsageCardProps = {
  used: number
  total: number
  unit: string
  projected?: number
  status?: 'safe' | 'warning' | 'critical'
}
```

### Emits
```ts
type Emits = {
  click: []
}
```

---

## 4. 数据探索组件

---

## 4.1 `QueryBar`

### 职责
统一查询入口。

### Props
```ts
type QueryBarProps = {
  modelValue: string
  placeholder?: string
  mode: 'logs' | 'traces' | 'metrics'
  allowSave?: boolean
  allowHistory?: boolean
}
```

### Emits
```ts
type Emits = {
  'update:modelValue': [string]
  submit: [string]
  saveView: [string]
  openHistory: []
}
```

### Slots
- `prefix`
- `suffix`
- `filters`

### 内部状态
- focus
- suggestions open
- syntax helper open

### 使用场景
- logs explorer
- trace explorer
- metrics explorer

### 禁止场景
- 普通列表搜索栏

---

## 4.2 `FilterChips`

### 职责
显示当前所有生效筛选条件。

### Props
```ts
type FilterChipsProps = {
  items: Array<{ key: string; label: string; value: string }>
}
```

### Emits
```ts
type Emits = {
  remove: [string]
  clearAll: []
}
```

---

## 4.3 `ResultTable`

### 职责
统一数据表格，覆盖 logs / traces / alerts / services / instances。

### Props
```ts
type ResultTableProps<T> = {
  columns: TableColumn<T>[]
  data: T[]
  rowKey: string | ((row: T) => string)
  loading?: boolean
  density?: 'compact' | 'default' | 'loose'
  selectable?: boolean
  pagination?: PaginationConfig
}
```

### Emits
```ts
type Emits = {
  rowClick: [any]
  selectionChange: [any[]]
  sortChange: [SortState]
  columnVisibilityChange: [string[]]
}
```

### Slots
- `cell-*`
- `row-actions`
- `empty`

### 内部状态
- visible columns
- density
- selected rows

### 使用场景
- service list
- logs
- traces
- alerts
- billing records

### 禁止场景
- topology node list（建议单独组件）

---

## 4.4 `DetailDrawer`

### 职责
统一右侧详情抽屉。

### Props
```ts
type DetailDrawerProps = {
  show: boolean
  title: string
  width?: 'sm' | 'md' | 'lg'
  loading?: boolean
  destroyOnClose?: boolean
}
```

### Emits
```ts
type Emits = {
  'update:show': [boolean]
  close: []
}
```

### Slots
- default
- header
- footer

### 使用场景
- alert detail
- trace detail
- log detail
- service quick view

### 禁止场景
- 复杂表单编辑（优先 page 或 modal）

---

## 5. 专业观测组件

---

## 5.1 `TopologyGraph`

### 职责
统一渲染服务拓扑/实例拓扑。

### Props
```ts
type TopologyGraphProps = {
  graph: TopologyGraphModel
  mode: 'service' | 'instance'
  overlay: 'health' | 'traffic' | 'latency' | 'error'
  loading?: boolean
}
```

### Emits
```ts
type Emits = {
  nodeClick: [TopologyNode]
  nodeDoubleClick: [TopologyNode]
  edgeClick: [TopologyEdge]
  canvasReady: []
}
```

### Slots
无

### 内部状态
- selected node
- selected edge
- zoom / pan
- highlighted neighborhood

### 样式规则
- 节点类型可视化统一
- edge 颜色和粗细表达 overlay
- 不允许每页单独写节点色彩规则

### 使用场景
- service topology
- service detail topology tab

---

## 5.2 `TopologySidePanel`

### 职责
展示选中节点上下文。

### Props
```ts
type TopologySidePanelProps = {
  node: TopologyNode | null
  summary?: ServiceQuickPanel
  loading?: boolean
}
```

### Emits
```ts
type Emits = {
  openService: [string]
  openLogs: [string]
  openTraces: [string]
  openAlerts: [string]
}
```

---

## 5.3 `TraceWaterfall`

### 职责
显示 span waterfall。

### Props
```ts
type TraceWaterfallProps = {
  trace: TraceDetailModel
  selectedSpanId?: string
}
```

### Emits
```ts
type Emits = {
  spanClick: [string]
  spanHover: [string]
}
```

### 使用场景
- trace detail drawer
- service detail traces tab

---

## 5.4 `SpanDetailPanel`

### 职责
显示 span metadata。

### Props
```ts
type SpanDetailPanelProps = {
  span: SpanModel | null
}
```

### Emits
```ts
type Emits = {
  openLogs: [string]
  openService: [string]
}
```

---

## 5.5 `LogPatternPanel`

### 职责
展示日志模式聚类和异常模式。

### Props
```ts
type LogPatternPanelProps = {
  patterns: LogPatternGroup[]
  loading?: boolean
}
```

### Emits
```ts
type Emits = {
  selectPattern: [string]
}
```

---

## 5.6 `ExceptionClusterList`

### 职责
展示异常聚类。

### Props
```ts
type ExceptionClusterListProps = {
  items: ExceptionCluster[]
  loading?: boolean
}
```

### Emits
```ts
type Emits = {
  select: [string]
}
```

---

## 6. 组件库通用规范

### 6.1 主题规范
- 所有颜色只允许来自 token
- dark/light 不能通过组件内部硬编码 if 大量切换
- chart 组件必须走统一 chart theme adapter

### 6.2 状态规范
每个组件必须明确：
- loading
- empty
- error
- disabled

### 6.3 行为规范
- 详情优先 drawer
- 编辑优先 page / modal
- drill-down 必须透传上下文

### 6.4 类型规范
- props 类型显式导出
- 领域组件的 model 类型由 `domains/*/types` 提供
- shared 组件不得依赖某一具体页面接口响应结构

---

## 7. 建议首批落地组件

第一批必须先做：

1. `PageHeader`
2. `TimeRangeBar`
3. `ScopeBar`
4. `ResultTable`
5. `DetailDrawer`
6. `ServiceHealthBadge`
7. `ServiceIdentityCard`
8. `RedSummaryCard`
9. `TopologyGraph`
10. `TraceWaterfall`
