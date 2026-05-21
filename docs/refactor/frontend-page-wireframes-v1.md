# StarLight 前端页面线框级详细设计文档 v1

本文按页面输出以下内容：

- 页面目标
- 页面结构
- 区块说明
- 组件组成
- 页面状态
- 页面接口
- 关键交互事件
- drill-down / 跳转关系

---

# 1. `/home/overview` 面板首页

## 1.1 页面目标
让用户基于“自己已经接入的微服务监控能力”组织首页，而不是消费一套固定总览。首页的首要职责不是展示预设卡片，而是承载可配置面板，让用户在最短时间内回答 4 个问题：

1. 现在系统整体健康吗
2. 哪些服务正在异常
3. 风险来自哪里（延迟 / 错误 / 告警 / 采集）
4. 下一步应该点去哪里排查

---

## 1.2 页面结构

```text
PageHeader
TimeRangeBar + ScopeBar
PanelToolbar
PanelCanvas
AddWidgetDrawer (edit mode)
WidgetConfigDrawer (edit mode)
```

---

## 1.3 区块说明

### A. `PageHeader`
内容：
- 标题：面板
- 副标题：基于已接入能力组织你自己的微服务监控首页
- 右侧操作：
  - 刷新
  - 自动刷新开关
  - 保存为默认面板
  - 面板恢复
  - 进入编辑态 / 退出编辑态

### B. `TimeRangeBar + ScopeBar`
作用：
- 时间范围
- 环境（env）
- 区域（region）
- 团队（team）
- 标签（tags）

### C. `PanelToolbar`
功能：
- 当前面板选择
- 系统模板 / 场景模板 / 用户面板切换
- 新建面板
- 复制面板
- 保存为默认面板
- 面板恢复
- 编辑态下打开“添加组件”抽屉

### D. `PanelCanvas`
由多个 widget 组成，而不是固定区块：
- Small widget：KPI / 状态卡
- Medium widget：列表 / 摘要卡
- Large widget：趋势 / 表格 / 分布图

系统默认模板可以包含：
- 服务总数
- 健康服务数
- 活跃告警数
- 总 QPS
- 全局错误率
- p95 延迟
- ingest 成功率
- 高风险服务
- 最近退化服务
- 趋势概览
- 最近事件
- 快捷入口

但这些都只是默认 widget，不是固定首页结构。

### E. `AddWidgetDrawer`
编辑态出现：
- 按 capability 展示可添加 widget
- capability 示例：
  - metrics
  - logs
  - traces
  - alerts
  - serviceCatalog
  - ingestion

### F. `WidgetConfigDrawer`
编辑态出现：
- service / env / region / tags 局部过滤
- group by / aggregation / compare window（按 widget 类型决定是否可用）
- widget title / description
- size: S / M / L
- delete widget

### G. 面板组合规则

系统默认模板：
- 必须至少包含 1 个 `quick-pivot` widget，确保即使监控能力未接齐，也有可执行入口
- 当 `metrics` 已接入时，优先加入：
  - `metric-summary`
  - `trend`
- 当 `serviceCatalog` 已接入时，优先加入：
  - `risk-service`
  - `quick-pivot`
- 当 `alerts` 已接入时，优先加入：
  - `incident`
- 当 `ingestion` 已接入时，优先加入：
  - `ingest-status`

场景模板：
- 服务稳定性模板：`metric-summary + trend + risk-service`
- 接入健康模板：`ingest-status + incident + quick-pivot`
- 告警值班模板：`incident + risk-service + quick-pivot`

扩展 widget 规则：
- `log-patterns`、`trace-latency` 属于后续扩展 widget
- 它们可以进入 AddWidgetDrawer 的能力目录，但不属于当前系统默认模板
- 它们依赖 logs / traces 侧 read model 稳定后再进入后续模板体系

缺能力时的回退规则：
- 缺少某 capability 时，不自动补一个“假数据 widget”
- 系统模板允许跳过该 widget，或以 capability-blocked 空态占位
- 若一个模板中大部分 widget 都不可用，则应提示用户优先完成接入，而不是渲染空白画布
- `quick-pivot` 是唯一兜底例外：系统必须注入一组基础默认入口，因此它不走通用 empty 壳层

排序规则：
- Small widget 优先放在首屏上部
- Medium widget 放在 Small widget 之后
- Large widget 默认放在后续行
- 编辑态下允许用户完全覆盖系统默认排序

---

## 1.4 页面组件组成

- `PageHeader`
- `TimeRangeBar`
- `ScopeBar`
- `PanelToolbar`
- `PanelCanvas`
- `PanelWidgetCard`
- `AddWidgetDrawer`
- `WidgetConfigDrawer`
- `MetricSummaryWidget`
- `RiskServiceWidget`
- `IncidentWidget`
- `IngestStatusWidget`
- `TrendWidget`
- `QuickPivotWidget`
- `LogPatternsWidget`
- `TraceLatencyWidget`
- `EmptyStatePanel`

---

## 1.5 页面状态

```ts
type OverviewPageState = {
  activePanelId: string
  panels: Array<{
    id: string
    name: string
    kind: 'system' | 'preset' | 'user'
    editable: boolean
    isDefault?: boolean
  }>
  activePanel: OverviewPanel | null
  editMode: boolean
  timeRange: TimeRange
  scope: ScopeFilter
  loading: boolean
  refreshing: boolean
  availableCapabilities: OverviewCapability[]
  widgetResults: Record<string, unknown>
}
```

---

## 1.6 页面接口

- 面板定义（后续阶段目标接口，用于真正的 panel 持久化与编辑能力）：
  - `GET /api/dashboard/v1/panels`
  - `GET /api/dashboard/v1/panels/:panelId`
  - `POST /api/dashboard/v1/panels`
  - `PATCH /api/dashboard/v1/panels/:panelId`
  - `POST /api/dashboard/v1/panels/:panelId/restore`
  - `DELETE /api/dashboard/v1/panels/:panelId`
- 说明：
  - `GET /api/dashboard/v1/panels` 用于面板列表/选择器数据
  - `GET /api/dashboard/v1/panels/:panelId` 返回完整 panel 定义与 `widgets[]`
- restore 语义：
  - `user` panel：恢复最近一次已保存的服务端版本
  - `preset/system` panel：恢复模板初始定义
  - 不等于“设为默认面板”，也不等于前端本地未保存撤销
- widget 数据源（当前默认模板阶段可复用现有 overview 接口）：
  - `GET /api/overview/v1/summary`
  - `GET /api/overview/v1/trends`
  - `GET /api/overview/v1/risk-services`
  - `GET /api/overview/v1/incidents`
  - `GET /api/overview/v1/ingest-status`

---

## 1.7 关键交互事件

- 编辑态下拖拽 widget → 更新面板布局
- 编辑态下切换 widget 尺寸 → 更新 widget layout
- 添加 / 删除 widget → 更新当前面板定义
- 点击 widget 内部 drill-down → 打开 investigate / detail 页面并带筛选
- 切换 scope/timeRange → 全页面重刷

---

## 1.8 drill-down

- Panel widget → Service Detail
- Panel widget → Alert Inbox
- Panel widget → Metrics Explorer
- Panel widget → Logs Explorer
- Panel widget → Trace Explorer

---

# 2. `/home/services` 服务目录页

## 2.1 页面目标
让用户快速找到某个服务，并获取其当前状态与进入排查的入口。

---

## 2.2 页面结构

```text
PageHeader
ScopeBar
CatalogToolbar
ServiceListStats
ServiceTable / ServiceCardGrid
DetailDrawer(optional)
```

---

## 2.3 区块说明

### A. `CatalogToolbar`
包含：
- 搜索 service / owner / tag
- status filter
- env filter
- team filter
- view mode（table / card）
- sort selector

### B. `ServiceListStats`
展示：
- 总服务数
- healthy
- degraded
- critical
- muted

### C. `ServiceTable`
字段：
- 服务名
- owner
- env
- region
- 实例数
- qps
- error rate
- p95
- alerts
- health
- last deploy
- 操作

### D. `ServiceCardGrid`
卡片模式用于快速浏览。

### E. `DetailDrawer`
悬浮查看服务摘要，不离开列表页。

---

## 2.4 组件组成

- `PageHeader`
- `ScopeBar`
- `QueryBar`
- `FilterChips`
- `ResultTable`
- `ServiceIdentityCard`
- `ServiceHealthBadge`
- `DetailDrawer`

---

## 2.5 页面状态

```ts
type ServiceCatalogState = {
  query: string
  filters: CatalogFilters
  sort: CatalogSort
  viewMode: 'table' | 'card'
  loading: boolean
  services: ServiceCatalogRow[]
  summary: ServiceCatalogSummary | null
  selectedServiceId?: string
}
```

---

## 2.6 页面接口

- `GET /api/catalog/v1/services`
- `GET /api/catalog/v1/services/summary`
- `GET /api/catalog/v1/services/:serviceId/quick-view`

---

## 2.7 交互事件

- 点击行 → `/home/services/:serviceId`
- 点击“拓扑” → `/home/services/topology?focus=:serviceId`
- 点击“Traces” → `/home/investigate/traces?service=:serviceId`
- 点击“Logs” → `/home/investigate/logs?service=:serviceId`
- 点击 owner / tag → 自动加筛选 chip

---

# 3. `/home/services/:serviceId` 服务详情页

## 3.1 页面目标
把某个服务的所有关键观察与排查入口集中在一个上下文里。

---

## 3.2 页面结构

```text
PageHeader
ServiceIdentityBar
TimeRangeBar
ServiceSummaryStrip
ContextTabs
  - Overview
  - Metrics
  - Topology
  - Traces
  - Logs
  - Alerts
  - Runtime
```

---

## 3.3 头部结构

### A. `ServiceIdentityBar`
内容：
- service name
- owner
- env
- region
- appKey
- runtime
- tags
- runbook / repo / dashboard links
- 当前 health 状态

### B. `ServiceSummaryStrip`
- qps
- error rate
- p95
- active incidents
- instance count
- deployment marker

---

## 3.4 各 Tab 说明

## Overview Tab
结构：
- RED summary
- health timeline
- dependency summary
- recent incidents
- recent traces
- recent exceptions

## Metrics Tab
结构：
- KPI chart group
- infra chart group
- custom metric section
- compare baseline

## Topology Tab
结构：
- mini topology graph
- selected dependency metrics
- upstream/downstream table

## Traces Tab
结构：
- trace search bar
- duration histogram
- trace result table
- trace detail drawer

## Logs Tab
结构：
- log query bar
- result table
- patterns side panel
- detail drawer

## Alerts Tab
结构：
- active incidents
- rule list
- mute policies
- recent history

## Runtime Tab
结构：
- instance list
- runtime env
- deploy history
- ingestion state
- appKey / metadata

---

## 3.5 组件组成

- `PageHeader`
- `ServiceIdentityCard`
- `ServiceHealthBadge`
- `TimeRangeBar`
- `ContextTabs`
- `RedSummaryCard`
- `TopologyGraph`
- `TraceWaterfall`
- `ResultTable`
- `DetailDrawer`
- `ExceptionClusterList`
- `InstanceCard`

---

## 3.6 页面状态

```ts
type ServiceDetailState = {
  serviceId: string
  timeRange: TimeRange
  loading: boolean
  activeTab: ServiceDetailTab
  header: ServiceHeaderModel | null
  overview: ServiceOverviewModel | null
  metrics: ServiceMetricsModel | null
  topology: ServiceTopologyModel | null
  traces: TraceSearchResult | null
  logs: LogSearchResult | null
  alerts: AlertIncidentResult | null
  runtime: ServiceRuntimeModel | null
}
```

---

## 3.7 页面接口

- `GET /api/catalog/v1/services/:serviceId`
- `GET /api/service/v1/:serviceId/overview`
- `GET /api/service/v1/:serviceId/metrics`
- `GET /api/service/v1/:serviceId/topology`
- `POST /api/trace/v1/search/execute`
- `POST /api/logs/v1/search/execute`
- `GET /api/alerts/v1/incidents?serviceId=...`
- `GET /api/service/v1/:serviceId/runtime`

---

## 3.8 交互事件

- 点击依赖服务 → 切换到对应 service detail
- 点击 trace → 打开 trace drawer
- 点击 error log → 打开日志 drawer
- 点击 alert → 跳 alert detail
- 切换 tab 不丢 service context
- 所有 drill-down 保留当前 timeRange

---

# 4. `/home/services/topology` 服务拓扑页

## 4.1 页面目标
从依赖关系和流量关系角度定位故障与瓶颈。

---

## 4.2 页面结构

```text
PageHeader
TimeRangeBar
TopologyToolbar
TopologyCanvas
TopologyLegend
TopologySidePanel
```

---

## 4.3 区块说明

### A. `TopologyToolbar`
- graph mode：service / instance
- overlay：traffic / latency / error / health
- search
- filter env
- focus service
- reset graph
- fit view

### B. `TopologyCanvas`
主图层。

### C. `TopologyLegend`
- node meaning
- edge meaning
- color meaning

### D. `TopologySidePanel`
点击节点后显示：
- service identity
- RED summary
- upstream/downstream
- recent alerts
- suspect traces
- recent errors

---

## 4.4 页面状态

```ts
type TopologyPageState = {
  mode: 'service' | 'instance'
  overlay: 'traffic' | 'latency' | 'error' | 'health'
  filters: TopologyFilters
  graph: TopologyGraphModel | null
  selectedNode?: TopologyNode
  selectedEdge?: TopologyEdge
  loading: boolean
}
```

---

## 4.5 页面接口

- `GET /api/metrics/v1/topology/graph`
- `GET /api/metrics/v1/topology/service-subgraph`
- `GET /api/metrics/v1/topology/instance-graph`
- `GET /api/service/v1/:serviceId/quick-panel`

---

## 4.6 交互事件

- click node → open side panel
- double click node → service detail
- click edge → dependency detail overlay
- search service → focus graph
- change overlay → graph recolor/reweight

---

# 5. `/home/services/instances` 实例监控页

## 5.1 页面目标
看实例级资源、存活、异常、重启等问题。

## 5.2 页面结构
```text
PageHeader
TimeRangeBar
ScopeBar
InstanceSummaryStrip
InstanceTable
InstanceDetailDrawer
```

## 5.3 核心字段
- instanceId
- service
- host/ip
- cpu
- memory
- restartCount
- status
- uptime
- last error

## 5.4 接口
- `GET /api/service/v1/instances`
- `GET /api/service/v1/instances/:instanceId`
- `GET /api/service/v1/instances/:instanceId/metrics`

---

# 6. `/home/investigate/metrics` 指标分析页

## 6.1 页面目标
支持更自由的指标查询、对比和保存。

## 6.2 页面结构
```text
PageHeader
TimeRangeBar
QueryBar
MetricQueryBuilder
ChartResultPanel
TableResultPanel
SavedViewPanel
```

## 6.3 核心能力
- select metric
- select aggregation
- group by
- compare service/env/instance
- chart/table mode
- save query
- add to dashboard

## 6.4 状态
```ts
type MetricsExplorerState = {
  query: MetricsQueryDraft
  result: MetricsQueryResult | null
  chartMode: 'line' | 'bar' | 'area' | 'table'
  loading: boolean
  savedViews: SavedMetricView[]
}
```

## 6.5 接口
- `POST /api/metrics/v1/query/execute`
- `POST /api/metrics/v1/query/compare`
- `GET /api/metrics/v1/query/tag-values`
- `GET /api/metrics/v1/views`

---

# 7. `/home/investigate/traces` Trace Explorer

## 7.1 页面结构
```text
PageHeader
TimeRangeBar
QueryBar
TraceSummaryStrip
DurationHistogram
TraceTable
TraceDetailDrawer
```

## 7.2 区块
- filters: service / operation / status / duration / env
- trace list
- waterfall
- span detail
- related logs

## 7.3 接口
- `POST /api/trace/v1/search/execute`
- `GET /api/trace/v1/trace/:traceId`
- `GET /api/trace/v1/trace/:traceId/related-logs`

---

# 8. `/home/investigate/logs` Logs Explorer

## 8.1 页面结构
```text
PageHeader
TimeRangeBar
QueryBar
FacetSidebar
LogTable
LogPatternPanel
LogDetailDrawer
```

## 8.2 功能
- search
- structured filter
- live tail
- facet stats
- patterns
- export

## 8.3 接口
- `POST /api/logs/v1/search/execute`
- `POST /api/logs/v1/search/facets`
- `GET /api/logs/v1/patterns/list`
- `POST /api/logs/v1/export/start`

---

# 9. `/home/investigate/exceptions` 异常分析页

## 9.1 页面结构
```text
PageHeader
TimeRangeBar
ScopeBar
ExceptionSummaryStrip
ExceptionClusterList
ExceptionDetailDrawer
```

## 9.2 功能
- exception grouping
- trend
- impacted services
- sample logs
- related traces

## 9.3 接口
- `GET /api/logs/v1/exceptions/list`
- `GET /api/logs/v1/exceptions/:clusterId`

---

# 10. `/home/alerts/inbox` Alert Inbox

## 10.1 页面结构
```text
PageHeader
TimeRangeBar
AlertToolbar
AlertSummaryStrip
AlertTable
AlertDetailDrawer
```

## 10.2 功能
- severity/status filters
- assignee filter
- service filter
- ack/resolve/assign/mute

## 10.3 接口
- `GET /api/alerts/v1/incidents`
- `GET /api/alerts/v1/incidents/:id`
- `POST /api/alerts/v1/incidents/:id/ack`
- `POST /api/alerts/v1/incidents/:id/resolve`

---

# 11. `/home/alerts/rules` 告警规则页

## 11.1 页面结构
```text
PageHeader
RuleTypeTabs
RuleList
RuleEditorPanel
RulePreviewPanel
```

## 11.2 功能
- metrics/logs/trace/quota rule builder
- evaluation window
- scope selector
- notification routing
- preview

## 11.3 接口
- `GET /api/alerts/v1/rules`
- `POST /api/alerts/v1/rules`
- `PUT /api/alerts/v1/rules/:id`
- `DELETE /api/alerts/v1/rules/:id`

---

# 12. `/home/alerts/notifications`

## 页面结构
```text
PageHeader
ChannelList
DeliveryHistoryTable
FailurePanel
```

## 接口
- `GET /api/alerts/v1/notifications/channels`
- `GET /api/alerts/v1/notifications/history`

---

# 13. `/home/admin/billing`

## 页面结构
```text
PageHeader
PlanCard
QuotaUsageStrip
UsageTrendSection
BillingHistoryTable
PaymentPanel
```

## 接口
- `GET /api/subscription/v1/current/detail`
- `GET /api/subscription/v1/usage/summary`
- `GET /api/subscription/v1/billing/history`

---

# 14. `/home/admin/ingestion`

## 页面结构
```text
PageHeader
AppKeyPanel
IngestHealthPanel
SetupGuideTabs
VerificationPanel
```

## 功能
- appKey list
- generate/revoke
- verify ingestion
- env configuration
- quick copy sdk snippet

## 接口
- `GET /api/metrics/v1/appkey/list`
- `POST /api/metrics/v1/appkey/generate`
- `POST /api/metrics/v1/appkey/verify`
- `GET /api/admin/v1/ingestion/status`

---

# 15. 页面级统一状态约束

## 15.1 时间范围规则
- 统一使用 `TimeRangeBar`
- service detail / trace / logs / metrics drill-down 时继承时间范围

## 15.2 筛选上下文规则
- service / env / region / appKey / traceId / instanceId 等上下文在跳转时必须透传

## 15.3 详情展示规则
- 详情优先右侧 `DetailDrawer`
- 只有创建/编辑类操作才允许 modal

## 15.4 空状态规则
统一 `EmptyStatePanel`：
- 无数据
- 无权限
- 接入未完成
- 查询无结果
- 服务不存在

## 15.5 加载规则
- 页级 skeleton
- 区块级 loading
- 轮询数据不闪屏，只局部 refresh

---

# 16. 页面实施优先级

## P0
- Overview
- Services Catalog
- Service Detail
- Topology

## P1
- Metrics Explorer
- Logs Explorer
- Trace Explorer
- Alert Inbox

## P2
- Exception Analysis
- Alert Rules
- Notifications
- Billing
- Ingestion Admin
