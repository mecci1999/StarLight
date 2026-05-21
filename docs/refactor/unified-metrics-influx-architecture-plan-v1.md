# StarLight 统一指标底座与查询网关改造方案 v1

本文定义一条在 **不推翻现有页面骨架** 的前提下，把 StarLight 的指标采集、存储、查询、卡片展示统一到底层时序能力的改造方案。

目标不是把 StarLight 做成通用 BI 产品，而是把它做成：

> **统一指标底座 + darwin-app 查询网关 + 声明式卡片配置 + 高级脚本模式可选**

---

# 1. 背景与当前问题

当前 StarLight 在“指标可用性”和“卡片自定义能力”上已经具备很多局部能力，但底层模型仍然分散：

- Overview 依赖 `overview/summary`、`overview/trends` 等聚合接口
- Realtime Monitor 依赖 `realtime + metrics explorer + runtime` 组合查询
- Service Detail 依赖服务级 summary/runtime/explorer 组合查询
- Custom Dashboard 目前仍是预设指标与固定组件流程
- 指标目录/Schema/卡片发现能力刚开始建设，但还没有统一到底层查询契约

这会带来几个长期问题：

1. 同一类指标（如 QPS、延迟、CPU）在不同页面语义和取数口径不完全统一
2. 用户无法真正按“自己的数据 + 自己的视角”去配置卡片
3. 管理员与普通用户虽然在视角上有 `system / tenant` 区分，但底层查询机制仍然碎片化
4. 新接入的 node-universe / SDK 指标很难快速纳入现有卡片体系

---

# 2. 总体目标

把系统改造成：

- **采集层**：
  - 普通用户通过 SDK 上报指标
  - Darwin 系统/管理员通过 darwin-app 的 event 路径摄入指标
- **存储层**：
  - 所有指标统一进入与 tenant/system 关联的 InfluxDB 存储目标
- **查询层**：
  - 所有指标查询统一通过 darwin-app 查询网关完成
- **展示层**：
  - 前端不再面向具体数据库写查询，而是提交声明式 `QuerySpec`
  - darwin-app 返回统一的 `CardData`
- **高级能力**：
  - 只在高级模式下开放脚本查询，不作为默认路径

---

# 3. 核心原则

## 3.1 统一底座，不统一入口

SDK 上报与 Darwin event 摄入路径可以不同，但进入查询层前必须统一成同一套指标模型。

## 3.2 前端不直连 InfluxDB

前端永远通过 darwin-app 提交查询请求，由后端负责：

- scope 鉴权
- 存储目标定位
- 查询语法编译
- 返回统一展示数据

## 3.3 默认不暴露原始 Flux / SQL

默认只允许用户配置：

- 指标
- 对象（系统 / 服务 / 实例）
- 时间范围
- 聚合方式
- 过滤条件
- 展示类型

只有高级用户才允许进入脚本模式。

高级用户的判定规则：
- 当前仅管理员可进入脚本模式
- 后续普通用户是否开放，取决于订阅等级/套餐能力

## 3.4 看板级能力统一管理

时间范围、自动刷新、默认对比策略优先作为看板级能力，而不是每张卡片各自定义一套刷新行为。

## 3.5 渐进迁移，不推倒现有页面

第一阶段不要求 Overview、Realtime、ServiceDetail 全部重写，只要求：

- 先统一底层查询契约
- 再逐页迁移 metrics 类卡片和趋势图

---

# 4. 角色与数据范围

## 4.1 管理员

- 默认 scope：`system`
- 主要使用场景：Darwin 系统级观测、接入状态、全局总览
- 指标来源：darwin-app event 摄入 + 系统基础资源 + 服务聚合视图

## 4.2 普通用户

- 默认 scope：`tenant`
- 主要使用场景：自己接入的服务、实例、指标、告警、日志、链路
- 指标来源：SDK 上报 + 自己服务的业务指标

## 4.3 统一查询原则

不论管理员还是普通用户，展示层都统一走：

- `QuerySpec -> darwin-app -> CardData`

差别只在于：

- 数据 scope 不同
- 可访问的 subject 不同
- 摄入路径不同

---

# 5. 改造后的目标架构

```text
[数据接入层]
  ├─ SDK 上报 (tenant/user services)
  └─ darwin-app event 摄入 (system/admin services)
          │
          ▼
[指标标准化层]
  ├─ metric identity 统一
  ├─ timestamp 统一
  ├─ unit/type/labels 统一
  └─ sourceKind 标记（sdk | darwin-event）
          │
          ▼
[存储路由层]
  └─ StorageTargetResolver
       ├─ tenant -> tenant 关联存储目标
       └─ system -> Darwin 系统存储目标
          │
          ▼
[InfluxDB 底座]
          │
          ▼
[darwin-app 查询网关]
  ├─ QuerySpec 校验
  ├─ 权限与 scope 校验
  ├─ Influx 查询编译
  ├─ 结果规范化
  └─ CardData 返回
          │
          ▼
[前端展示层]
  ├─ Metrics Explorer
  ├─ Custom Dashboard
  ├─ Overview
  ├─ Realtime Monitor
  └─ Service Detail / Instance Monitor
```

---

# 6. 需要统一的四个核心模型

## 6.1 MetricSchema

描述“当前有哪些指标可用”。

```ts
type MetricSchema = {
  name: string
  description: string
  unit?: string
  type: 'gauge' | 'counter' | 'histogram' | 'summary' | 'info'
  scope: Array<'tenant' | 'system'>
  sourceKind: 'sdk' | 'darwin-event' | 'mixed'
  subjectKinds: Array<'system' | 'service' | 'instance'>
  allowedAggregations: Array<'latest' | 'avg' | 'sum' | 'max' | 'p95'>
  labelNames: string[]
  recommendedVisualizations: Array<'number' | 'line' | 'bar' | 'table' | 'donut'>
}
```

## 6.2 StorageTarget

前端不关心具体 Influx 实例、bucket、org；后端内部用它来把 scope 和 subject 映射到底层存储目标。

```ts
type StorageTarget = {
  scope: 'tenant' | 'system'
  tenantId?: string
  org?: string
  bucket: string
  sourceKind: 'sdk' | 'darwin-event'
}
```

## 6.3 QuerySpec

这是前端真正提交的“查询规格”，不是脚本。

```ts
type QuerySpec = {
  scope: 'tenant' | 'system'
  sourceKind?: 'sdk' | 'darwin-event' | 'auto'
  subject: {
    type: 'system' | 'service' | 'instance'
    id?: string
  }
  metricRef: string
  aggregation: 'latest' | 'avg' | 'sum' | 'max' | 'p95'
  groupBy?: string[]
  filters?: Record<string, string | string[]>
  compare?: 'previous-period' | 'same-period'
  timeRange: string
  granularity?: string
  limit?: number
  visualizationHint?: 'number' | 'line' | 'bar' | 'table' | 'donut'
}
```

## 6.4 CardData

darwin-app 返回给前端的统一展示数据。

```ts
type CardData =
  | {
      kind: 'number'
      value: number | null
      unit?: string
      compare?: { value: number; direction: 'up' | 'down' | 'flat' }
      meta?: Record<string, any>
    }
  | {
      kind: 'timeseries'
      series: Array<{ name: string; points: Array<{ timestamp: number; value: number }> }>
      unit?: string
    }
  | {
      kind: 'distribution'
      items: Array<{ name: string; value: number }>
      unit?: string
    }
  | {
      kind: 'table'
      columns: Array<{ key: string; label: string }>
      rows: Array<Record<string, any>>
    }
```

---

# 7. 前端如何配置卡片

前端默认不让用户写脚本，而是通过受控字段配置卡片：

- 指标
- 服务 / 实例 / 系统对象
- 过滤条件
- 聚合方式
- 时间范围
- 展示类型

例如：

## 7.1 系统一天内 QPS 趋势卡

```ts
{
  metricRef: 'service.qps',
  scope: 'system',
  subject: { type: 'system' },
  aggregation: 'avg',
  timeRange: '1d',
  visualizationHint: 'line'
}
```

## 7.2 服务 CPU 当前值卡

```ts
{
  metricRef: 'service.cpu.usage',
  scope: 'tenant',
  subject: { type: 'service', id: 'order-api' },
  aggregation: 'latest',
  timeRange: '1h',
  visualizationHint: 'number'
}
```

## 7.3 实例资源明细表

```ts
{
  metricRef: 'instance.cpu.usage',
  scope: 'system',
  subject: { type: 'service', id: 'gateway' },
  aggregation: 'latest',
  groupBy: ['instanceId'],
  limit: 10,
  visualizationHint: 'table'
}
```

---

# 8. 脚本模式怎么放

脚本模式可以有，但它只能是 **高级模式**，不能是主路径。

访问策略明确如下：

- **当前阶段**：仅对管理员开放
- **后续阶段**：可根据用户订阅等级逐步开放给普通用户
- **默认状态**：普通用户不可见、不可用，不进入主流程

推荐方式：

1. 用户先通过声明式配置生成 QuerySpec
2. 系统在高级模式里显示 darwin-app 编译后的 Flux / InfluxQL 草稿
3. 高级用户再手动调整

也就是说：

- **默认体验**：配置指标，不写脚本
- **高级体验**：允许看脚本、改脚本、保存脚本
- **权限策略**：管理员优先，普通用户需满足订阅条件后再开放

这样普通用户不会被复杂度劝退，而平台专家也保留自由度。

---

# 9. darwin-app 需要新增的能力

## 9.1 指标 Schema 接口

```http
GET /api/metrics/v2/schema
```

职责：
- 返回 MetricSchema 列表
- 支持按 scope / service / sourceKind 筛选

## 9.2 查询网关接口

```http
POST /api/metrics/v2/query/cards
```

请求体：
- 单个 QuerySpec 或多个 QuerySpec 批量

职责：
- scope 权限校验
- 定位 Influx 存储目标
- 把 QuerySpec 编译成底层查询
- 返回统一 CardData

### 推荐的批量查询协议

前端不再为每张卡片分别打一个零散接口，而是把当前面板中的卡片查询一次性提交给 darwin-app：

```ts
type DashboardQueryRequest = {
  dashboardId?: string
  refreshGenerationId: string
  context: {
    scope: 'tenant' | 'system'
    timeRange: string
    granularity?: string
    autoRefresh?: boolean
  }
  cards: Array<{
    cardId: string
    priority?: 'high' | 'normal' | 'low'
    query: QuerySpec
  }>
}
```

返回结构建议支持“卡片级独立结果”：

```ts
type DashboardQueryResponse = {
  refreshGenerationId: string
  items: Array<{
    cardId: string
    status: 'success' | 'partial' | 'timeout' | 'cancelled' | 'error'
    startedAt: number
    finishedAt: number
    data?: CardData
    error?: { code: string; message: string }
    cache?: { hit: boolean; ttlMs?: number }
  }>
}
```

### 为什么要批量而不是逐卡片散发请求

参考 Grafana / Datadog / Splunk / New Relic 等主流做法，更合理的方式不是“每张卡片完全独立实时打库”，而是：

- 同一面板统一刷新调度
- 同一时间范围统一管理
- 共享的基础查询尽可能复用
- 允许卡片级部分成功
- 谁先完成谁先展示

也就是说：

- 前端一次提交整批卡片查询
- darwin-app 内部并发执行
- 前端按卡片粒度渐进渲染，不等整页全完成

### darwin-app 内部执行模型

推荐引入 **Dashboard Execution Planner**，核心职责是：

1. 读取当前批量请求中的所有 QuerySpec
2. 识别是否存在可复用的共享基础查询
3. 构建轻量查询图（shared fetch -> derived card data）
4. 按优先级和并发限制调度执行
5. 将每张卡片结果独立回填

推荐执行顺序：

- **Wave 1**：首屏 / 高优先级 KPI 卡片
- **Wave 2**：趋势图 / 分布图
- **Wave 3**：重查询表格卡 / drill-down 卡

### 前端渲染策略

前端应采用“先到先显”的策略：

- 已完成卡片立即显示数据
- 未完成卡片维持 skeleton/loading
- 超时卡片显示 slow/partial 状态
- 失败卡片单独显示错误，不阻塞整页

不要做：

- 等所有卡片都返回后再统一渲染
- 因一张卡片失败导致整页失败

### 并发治理要求

这是这套方案能否稳定的关键。

服务端必须至少提供：

1. **全局面板并发上限**
   - 限制同一个 dashboard 查询波次的最大并发数
2. **按后端/存储目标限流**
   - 避免同一 Influx bucket/org 被打爆
3. **按租户/用户配额限制**
   - 普通用户与管理员可使用不同查询预算
4. **按卡片类型分类治理**
   - KPI 卡、趋势卡、表格卡使用不同的超时与并发策略

### 去重与缓存策略

应参考主流监控产品的做法，对相同查询做短时复用：

- cache key 应至少包含：
  - normalized QuerySpec
  - scope
  - service/subject
  - timeRange bucket
  - granularity
- 对同一批量请求里的相同 QuerySpec 做 **in-flight dedup**
- 对短时间重复请求做 **TTL cache**

推荐：

- 近实时卡片：短 TTL
- 历史时间窗卡片：长 TTL
- 真正实时卡片：可选择不缓存

### 超时、取消、刷新代际

应为每一批面板查询引入 `refreshGenerationId`：

- 用户切换时间范围 / 服务 / scope 后，旧批次结果即使回来也要丢弃
- 新一轮刷新应取消旧一轮未完成的重查询卡片
- 慢查询卡片允许先回 partial/timeout 状态

推荐策略：

- soft timeout：卡片显示 slow / partial
- hard timeout：卡片标记 timeout 并终止
- 用户切页/切 scope：取消当前批次剩余查询

### 共享查询与派生查询

参考 Splunk 的 base search / chain search、Datadog 的 formula/nested query，建议允许：

- 一个共享基础时序查询被多个卡片复用
- 上层卡片仅做派生聚合或格式转换

例如：

- 一个 `service.qps` 基础查询
- 派生出：
  - 数值卡（latest/avg）
  - 折线图卡
  - 柱图卡

这样可以显著减少同一面板内的重复查询。

## 9.3 看板配置接口（后续）

```http
GET /api/metrics/v2/dashboard/panels
POST /api/metrics/v2/dashboard/panels
PATCH /api/metrics/v2/dashboard/panels/:id
```

职责：
- 保存 CardDefinition / QuerySpec
- 不再保存“页面专属的临时字段拼装结构”

---

# 10. 渐进迁移方案

## Phase 0：先统一命名与语义

目标：
- 冻结 QPS、请求总量、P95 延迟、错误率等关键指标语义
- 冻结 Schema / QuerySpec / CardData 三套契约

任务：
- 对齐 `Overview / Realtime / ServiceDetail / CustomDashboard` 的指标命名
- 统一 `tenant/system` 的 scope 约定

验收标准：
- 相同指标在不同页面的语义一致
- 前后端团队对核心字段无歧义

---

## Phase 1：Schema + Explorer 闭环

目标：
- 用户先能知道“有哪些指标可以用”
- Metrics Explorer 第一个接入 QuerySpec 查询模型

任务：
- 上线 `/metrics/v2/schema`
- 用真实 schema 替换前端 mock fallback
- Metrics Explorer 改成：UI -> QuerySpec -> darwin-app -> CardData

验收标准：
- 指标目录和指标分析用同一套 schema/query 口径
- 选服务、选时间范围、选图表都能由 QuerySpec 驱动

---

## Phase 2：Custom Dashboard 接入 QuerySpec

目标：
- 自定义卡片不再依赖硬编码 metric preset

任务：
- Custom Dashboard 的“添加组件”改成真正的声明式查询配置
- 卡片保存持久化改为保存 QuerySpec
- 高级模式允许查看编译后的查询脚本（只读）

验收标准：
- 用户能从 schema 中选择指标并配置卡片
- 不同卡片统一走查询网关

---

## Phase 3：Overview / Realtime 渐进迁移

目标：
- 先迁 metrics 类卡片，保留现有 read model 外壳

任务：
- Overview 中的 metric-summary / trend / darwin resource 卡改为内部走 QuerySpec
- Realtime Monitor 中的 CPU/内存/QPS/响应时间改走统一查询层

约束：
- `incident / risk-service / ingest-status` 暂时继续走现有 read model

验收标准：
- 主面板与实时页的 metrics 类卡片口径统一
- 不破坏现有 UX

---

## Phase 4：脚本模式与高级能力

目标：
- 给专家用户开放自定义脚本

任务：
- 在卡片编辑器增加“高级模式”切换
- 展示由 QuerySpec 编译出来的 Flux/脚本草稿
- 支持权限控制、审计、脚本保存

验收标准：
- 普通用户不被脚本复杂度影响
- 高级用户具备自由分析能力

---

# 11. 风险与治理要求

## 11.1 标签基数风险

如果 SDK 和 event 指标允许随意打高基数标签，InfluxDB 的存储和查询成本会迅速失控。

必须提前定义：
- 标签白名单
- 高基数字段策略
- label retention 策略

## 11.2 scope 越权风险

前端传 `scope=system|tenant` 不能直接信任。

必须由 darwin-app 根据：
- 登录态
- 用户身份
- 租户归属

决定真正能访问的查询范围。

## 11.3 指标语义漂移

相同指标不能允许不同页面各自定义口径。

必须统一：
- 指标名
- 单位
- 聚合默认值
- compare 口径

## 11.4 查询风暴风险

如果每张卡片都独立实时查询，会出现刷新风暴。

必须优先设计：
- 看板级时间范围
- 看板级自动刷新
- 批量 QuerySpec 请求
- 卡片结果缓存

---

# 12. 与当前代码的对应关系

当前代码里已经有很多可复用基础：

- `src/services/authSession.ts`
  - 已经有 `system / tenant` scope 基线
- `src/domains/metrics/pages/MetricsExplorerPage.tsx`
  - 已经是天然的 QuerySpec UI 候选页
- `src/domains/metrics/catalogModel.ts`
  - 已经有 schema/catalog 归一化逻辑
- `src/domains/overview/pages/CustomDashboardPage.tsx`
  - 已经有卡片编辑器和卡片列表容器
- `src/domains/overview/panelModel.ts`
  - 已经有 panel/widget taxonomy

所以这次改造不需要推翻前端页面结构，只需要：

1. 统一查询契约
2. 把旧接口逐步迁到 darwin-app 查询网关
3. 把卡片配置逐步改成 QuerySpec

---

# 13. 最终建议

这次改造的最佳版本不是：

- “每张卡片默认写一段 InfluxDB 脚本”

而是：

> **统一 InfluxDB 指标底座**
> **统一由 darwin-app 查询网关执行**
> **前端默认通过 QuerySpec 声明式配置卡片**
> **高级模式再开放脚本能力**

这是最适合 StarLight 当前产品定位的方式：

- 统一数据来源
- 保留用户自定义能力
- 不让产品变成过重的 BI 查询器
- 兼容管理员和普通用户两类接入方式

---

# 14. 建议下一步

建议下一步按这个顺序推进：

1. 冻结 `MetricSchema / QuerySpec / CardData`
2. 设计 `darwin-app` 查询网关接口
3. 先把 `Metrics Explorer` 接到新查询模型
4. 再改 `Custom Dashboard`
5. 最后迁 `Overview / Realtime`

如果需要，我可以继续在这份文档基础上再拆两份：

- `docs/refactor/backend-metrics-query-gateway-plan-v1.md`
- `docs/refactor/frontend-queryspec-card-builder-plan-v1.md`

分别给后端和前端实施团队使用。
