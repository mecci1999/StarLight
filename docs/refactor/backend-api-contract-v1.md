# StarLight 后端 API 契约文档 v1

本文聚焦 StarLight 桌面端主链路对应的后端读模型/动作契约，尤其补齐 panel-first Overview 所需的面板定义与 widget 持久化接口。

---

# 1. 设计目标

后端契约必须支持：

1. `/home/overview` 作为 panel-first 首页，而不是固定 summary dashboard
2. 默认模板阶段可以直接复用现有 overview read model
3. 后续阶段可以落地真正的 `panel + widgets[]` 持久化模型
4. widget 配置、面板模板、默认面板切换不依赖前端本地硬编码

---

# 2. 契约分层

## 2.1 当前默认模板阶段

当前 `/home/overview` 的默认模板可以直接复用以下只读接口：

- `GET /api/overview/v1/summary`
- `GET /api/overview/v1/trends`
- `GET /api/overview/v1/risk-services`
- `GET /api/overview/v1/incidents`
- `GET /api/overview/v1/ingest-status`

这些接口负责默认模板 widget 的数据来源，不负责面板定义持久化。

## 2.2 后续面板持久化阶段

后续应新增 dashboard / panel 维度契约，负责：

- 面板列表
- 面板详情
- 面板创建/修改/删除
- 默认面板切换
- widget 布局与配置持久化

---

# 3. Overview Panel 领域模型

## 3.1 Panel

```ts
type DashboardPanel = {
  id: string
  name: string
  kind: 'system' | 'preset' | 'user'
  editable: boolean
  isDefault?: boolean
  widgets: DashboardWidget[]
  createdAt: string
  updatedAt: string
}
```

说明：
- `system`：系统默认模板，不允许用户直接覆盖
- `preset`：系统场景模板，如服务稳定性 / 接入健康 / 告警值班
- `user`：用户自定义面板

## 3.2 Widget

```ts
type DashboardWidget = {
  id: string
  type:
    | 'metric-summary'
    | 'risk-service'
    | 'incident'
    | 'ingest-status'
    | 'trend'
    | 'quick-pivot'
    | 'log-patterns'
    | 'trace-latency'
  capability: 'metrics' | 'logs' | 'traces' | 'alerts' | 'serviceCatalog' | 'ingestion'
  title: string
  description?: string
  size: 'S' | 'M' | 'L'
  order: number
  config: Record<string, unknown>
}
```

## 3.3 Capability gating

后端返回 panel 定义时，不要求自动删除不可用 widget；前端可以基于 capability 做展示降级。

如需服务端辅助，可额外返回：

```ts
type DashboardCapabilityState = {
  metrics: boolean
  logs: boolean
  traces: boolean
  alerts: boolean
  serviceCatalog: boolean
  ingestion: boolean
}
```

---

# 4. Panel CRUD API

## 4.1 获取面板列表

`GET /api/dashboard/v1/panels`

### Query

```ts
type Query = {
  scope?: 'current-user' | 'system'
}
```

### Response

```ts
type Response = {
  items: Array<{
    id: string
    name: string
    kind: 'system' | 'preset' | 'user'
    editable: boolean
    isDefault?: boolean
  }>
}
```

## 4.2 获取单个面板详情

`GET /api/dashboard/v1/panels/:panelId`

### Response

```ts
type Response = DashboardPanel
```

## 4.3 新建面板

`POST /api/dashboard/v1/panels`

### Body

```ts
type Body = {
  name: string
  basedOnPanelId?: string
  widgets?: DashboardWidget[]
}
```

## 4.4 修改面板

`PATCH /api/dashboard/v1/panels/:panelId`

### Body

```ts
type Body = {
  name?: string
  widgets?: DashboardWidget[]
  isDefault?: boolean
}
```

说明：
- `widgets` 为全量提交，避免前后端在拖拽/删除/尺寸修改上出现补丁合并歧义
- 系统模板不允许直接修改，只允许复制后另存为用户面板

## 4.5 恢复面板

`POST /api/dashboard/v1/panels/:panelId/restore`

### 语义

- 对 `user` panel：恢复到最近一次已保存的服务端版本
- 对 `preset` / `system` panel：恢复到该模板的系统初始定义
- 该动作不等于“设为默认面板”，也不等于前端本地撤销未保存编辑

### Response

```ts
type Response = {
  panel: DashboardPanel
}
```

## 4.6 删除面板

`DELETE /api/dashboard/v1/panels/:panelId`

### Response

```ts
type Response = {
  success: boolean
}
```

---

# 5. Widget 配置约束

## 5.1 metric-summary

```ts
type MetricSummaryConfig = {
  metricKey: string
  compareWindow?: string
  threshold?: number
  service?: string
  env?: string
  region?: string
  tags?: string[]
}
```

## 5.2 risk-service

```ts
type RiskServiceConfig = {
  env?: string
  team?: string
  tags?: string[]
  limit?: number
}
```

## 5.3 incident

```ts
type IncidentConfig = {
  severity?: Array<'info' | 'warning' | 'critical'>
  source?: Array<'metrics' | 'logs' | 'traces' | 'alerts'>
  env?: string
  limit?: number
}
```

## 5.4 ingest-status

```ts
type IngestStatusConfig = {
  env?: string
  source?: Array<'metrics' | 'logs' | 'traces'>
}
```

## 5.5 trend

```ts
type TrendConfig = {
  metric: string
  aggregation?: 'avg' | 'sum' | 'p95' | 'rate'
  groupBy?: 'service' | 'env' | 'region'
  compareWindow?: string
  service?: string
  env?: string
}
```

## 5.6 quick-pivot

```ts
type QuickPivotConfig = {
  links?: Array<{
    key: 'services' | 'topology' | 'traces' | 'logs' | 'alerts' | 'admin-ingestion'
    visible?: boolean
  }>
}
```

## 5.7 later-extension widgets

```ts
type LogPatternsConfig = {
  service?: string
  env?: string
  tags?: string[]
  limit?: number
}

type TraceLatencyConfig = {
  service?: string
  env?: string
  operation?: string
  limit?: number
  compareWindow?: string
}
```

说明：
- `log-patterns` / `trace-latency` 属于后续扩展 widget，不要求进入当前默认模板
- 但其类型和配置结构应提前冻结，避免前后端后续各自发散

---

# 6. 默认模板与系统模板规则

## 6.1 系统默认模板

系统默认模板至少应保证：

- 含 `quick-pivot`
- 当 `metrics` 可用时含 `metric-summary` 与 `trend`
- 当 `serviceCatalog` 可用时含 `risk-service`
- 当 `alerts` 可用时含 `incident`
- 当 `ingestion` 可用时含 `ingest-status`

## 6.2 场景模板

至少保留：

- 服务稳定性模板
- 接入健康模板
- 告警值班模板

后端可以将这些模板作为 `kind = preset` 返回。

---

# 7. 与现有 overview 接口的关系

当前阶段：

- panel CRUD 可以暂时不落地
- 默认模板 widget 先复用现有 overview read model
- 前端先把 `/home/overview` 作为默认模板容器实现

后续阶段：

- panel CRUD 落地后，前端再接入真正的用户面板持久化
- 当前默认模板可以演进成一个 `system panel`

---

# 8. 验收标准

当 backend panel contract 进入“已可联调”状态时，至少满足：

1. `GET /api/dashboard/v1/panels` / `GET /api/dashboard/v1/panels/:panelId` 可返回稳定结构
2. `PATCH /api/dashboard/v1/panels/:panelId` 能保存 widget 顺序、尺寸与配置
3. 默认模板和场景模板可区分 `system/preset/user`
4. widget config 字段含义稳定，不依赖前端临时约定
