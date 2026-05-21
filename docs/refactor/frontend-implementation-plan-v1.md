# StarLight 前端实施拆解与排期文档 v1

本文用于把以下三份设计文档转为可执行开发计划：

- `frontend-page-wireframes-v1.md`
- `frontend-component-spec-v1.md`
- `backend-api-contract-v1.md`

目标不是写泛化项目计划，而是给 StarLight 前端一个可按里程碑推进的重构路线。

---

# 1. 总体实施原则

## 1.1 核心原则
1. 先做壳层与共享组件，再做页面重构
2. 先做 Panel-first Overview 主路径，再做扩展页
3. 页面重构必须与后端 read model 同步推进
4. 每个阶段都必须可运行、可回归、可渐进替换旧页面
5. 不做大爆炸式重写
6. 桌面端优先，但共享组件必须默认考虑移动端降级复用

## 1.2 交付原则
- 每个波次必须有可见结果
- 旧路由可阶段性兼容，但新结构优先
- 所有新页面必须优先使用新组件库
- 新页面不允许直接混入 mock 逻辑
- 新页面必须统一接入 `TimeRangeBar` / `ScopeBar` / `DetailDrawer`

---

# 2. 实施阶段总览

```text
Phase 0: 基线清理与框架准备
Phase 1: 设计系统与共享组件底座
Phase 2: Panel-first Overview + Service Catalog + Service Detail
Phase 3: Topology + Instance Monitor
Phase 4: Investigate（Metrics / Logs / Traces / Exceptions）
Phase 5: Alerts
Phase 6: Admin（Billing / Ingestion / Setup）
Phase 7: 收尾、替换旧页面、统一验收
```

---

# 3. Phase 0：基线清理与框架准备

## 3.1 目标
把当前代码从“继续堆功能会越来越乱”的状态，拉到“可以开始重构”的状态。

## 3.2 任务包

### FE-0-1 目录预重组
- 新建：
  - `src/app/`
  - `src/shared/`
  - `src/domains/`
- 保留旧 `views/`，但新页面从 `domains/*/pages` 开始落

### FE-0-2 统一路由元信息模型
- 把侧边栏显示信息从 `layout/left/index.tsx` 中抽出
- 建立统一 route meta：
  - title
  - group
  - icon
  - order
  - visibility

### FE-0-3 清理技术债标记
对以下问题加 TODO/迁移标记：
- `dashboard.tsx` 旧版/新版本混乱问题
- `mock/api` 直连页面问题
- `NavieProvider` 命名拼写问题
- topology 组件重复
- tabs 空实现

### FE-0-4 建立 refactor feature flag（可选）
- 允许新旧页面并行存在时切换
- 用于 `/overview-v2`、`/services-v2` 之类过渡路径

## 3.3 交付物
- 目录基线可用
- 路由 meta 统一
- 重构入口明确

## 3.4 风险
- 初期不要动太多业务逻辑
- 此阶段不追求视觉变化

---

# 4. Phase 1：设计系统与共享组件底座

## 4.1 目标
在不重做所有页面前，先建立统一的 UI 与交互底座。

## 4.2 任务包

### FE-1-1 Token 扩展
修改：
- `src/styles/variable.scss`

新增：
- health / signal / topology / chart token
- panel/drawer/filter bar 尺寸 token

### FE-1-2 Naive UI 主题桥接重构
修改：
- `src/components/common/NaiveProvider.tsx`

目标：
- token → Naive theme override 映射规范化
- 消除局部 hardcode 颜色策略

### FE-1-3 基础共享组件
首批实现：
- `PageHeader`
- `TimeRangeBar`
- `ScopeBar`
- `ResultTable`
- `DetailDrawer`
- `ServiceHealthBadge`
- `ServiceIdentityCard`
- `RedSummaryCard`

建议目录：
```text
src/shared/components/
src/shared/query/
src/shared/layout/
```

### FE-1-4 图表主题统一
修改：
- `src/hooks/useChartTheme.ts`
- `src/components/charts/BaseChart.tsx`

目标：
- 图表主题全部从 token 生成
- dark/light 一致

### FE-1-5 页面级状态规范
建立共享 composable：
- `usePageLoadingState`
- `usePageScopeState`
- `useTimeRangeState`
- `useDetailDrawerState`

## 4.3 交付物
- 新组件可在旧页面中小范围试用
- 所有新页面的基础壳层可复用

## 4.4 验收标准
- 至少 2 个旧页面局部替换成功
- dark/light 无明显破坏
- 不新增新的硬编码主色/状态色

---

# 5. Phase 2：Panel-first Overview + Service Catalog + Service Detail

## 5.1 目标
先打通新的主导航路径：
**Panel-first Overview → Service Catalog → Service Detail**

## 5.2 任务包

### FE-2-1 Panel-first Overview 首页
新增：
- `src/domains/overview/pages/OverviewPage.tsx`
- `src/domains/overview/components/*`
- `src/domains/overview/composables/useOverviewPage.ts`
- `src/domains/overview/adapters/*`

替代旧：
- 不再以旧 dashboard 作为总览中心

### FE-2-2 新 Service Catalog 页
新增：
- `src/domains/service/pages/ServiceCatalogPage.tsx`
- `ServiceCatalogTable`
- `DetailDrawer`（用于 service quick view）

### FE-2-3 新 Service Detail 页
新增：
- `src/domains/service/pages/ServiceDetailPage.tsx`
- `ServiceOverviewTab`
- `ServiceMetricsTab`
- `ServiceTopologyTab`
- `ServiceTracesTab`
- `ServiceLogsTab`
- `ServiceAlertsTab`
- `ServiceRuntimeTab`

### FE-2-4 新路由接入
- `/home/overview`
- `/home/services`
- `/home/services/:serviceId`

## 5.3 依赖
后端优先要有：
- overview summary
- overview trends
- overview risk-services
- overview incidents
- overview ingest-status
- catalog services
- catalog services summary
- catalog service quick-view
- service detail overview

## 5.4 验收标准
- 可从 panel-first overview 进入 catalog，再进入 service detail
- timeRange / scope 在三个页面间透传
- 所有详情优先 drawer/tab，而非跳一堆新页面

### FE-2-5 Overview 面板体系与自定义面板编辑二阶段优化
目标：
- 将 `/home/overview` 从“固定概览卡片页”改成“panel-first 的用户自定义面板容器”，首页优先展示用户已经接入的数据能力，而不是预设一套假定所有租户都拥有的固定卡片。

范围：
- 页面模型改为 `panel + widgets[]`：
  - Panel：默认面板 / 场景模板 / 用户自定义面板
  - Widget：最小可配置单元，负责展示单一能力或查询结果
- Widget 必须按 capability 驱动，而不是固定硬编码到首页：
  - capability 示例：`metrics` / `logs` / `traces` / `alerts` / `serviceCatalog` / `ingestion`
  - 未接入对应能力时，该 widget 不应假装有数据
- Widget 尺寸体系保留，但语义改为组件尺寸而不是固定整页区块：
  - Small：KPI / 状态 / 单值卡
  - Medium：列表 / 摘要 / 聚合卡
  - Large：趋势图 / 表格 / 分布图
- Small widget 增强范围：
  - baseline / delta / 环比 / 阈值提示
  - 这些表达属于 widget 配置能力，不应再被理解为“固定首页总览字段”
- 编辑能力升级为“面板编辑”，不是单纯的固定卡片编辑：
  - 查看态 / 编辑态显式分离
  - widget 拖拽排序
  - widget 尺寸切换（S/M/L）
  - widget 添加 / 删除 / 重命名
  - widget 局部配置（service / env / tags / aggregation / compareWindow 等 widget 级字段）
  - 保存默认面板 / 面板恢复
- 若进入真正的 persisted panel 阶段，前端应接入：
  - `GET /api/dashboard/v1/panels`
  - `GET /api/dashboard/v1/panels/:panelId`
  - `POST /api/dashboard/v1/panels`
  - `PATCH /api/dashboard/v1/panels/:panelId`
  - `POST /api/dashboard/v1/panels/:panelId/restore`
  - `DELETE /api/dashboard/v1/panels/:panelId`
  - 其语义不是“本地撤销未保存编辑”，而是恢复服务端约定的 panel 版本
- 模板体系：
  - 系统默认模板
  - 场景模板（服务稳定性 / 接入健康 / 告警值班）
  - 用户自定义面板
- `logs` / `traces` capability 对应的 Overview widget（如日志模式摘要、链路延迟摘要）属于后续扩展能力：
  - 可在 panel-first 模型中预留类型与容器
  - 但不属于当前默认模板或 Phase 2 默认依赖闭环
- 数据层方向：
  - 长期以 `panel definition -> widget queries -> rendered widgets` 为准
  - 现有 `overview summary / trends / incidents / ingest-status` 等接口先复用为默认 widget 数据源

约束：
- 优先复用共享图表、`DetailDrawer`、`TimeRangeBar`、`ScopeBar`；`CustomDashboardPage` 仅作为历史过渡实现参考，不再作为 panel-first 首页的目标承载层
- 在真正落地拖拽/布局持久化前，不把现有“编辑布局”按钮误写成已完成能力
- 在面板系统正式落地前，当前 `/home/overview` 只应被视为“默认模板的过渡实现”，不再继续朝固定卡片页方向深化
- 该优化线属于主线后续增强，但新的主线方向已经明确为“panel-first Overview”

---

# 6. Phase 3：Topology + Instance Monitor

## 6.1 目标
把“关系视图”和“实例视图”拉到 service-first 体系下。

## 6.2 任务包

### FE-3-1 拓扑主图重构
新增：
- `TopologyGraph`
- `TopologyToolbar`
- `TopologySidePanel`

改造：
- 替换旧 `ServiceTopology` / `TopologyChart` 重复实现

### FE-3-2 实例监控页重构
新增：
- `InstanceMonitorPage`
- `InstanceTable`
- `InstanceDetailDrawer`

### FE-3-3 服务详情拓扑 tab 接入
- ServiceDetail 中复用缩略拓扑/依赖视图

## 6.3 验收标准
- topology 节点点击可打开 side panel
- topology 双击可进入 service detail
- 实例页可按 service 过滤

---

# 7. Phase 4：Investigate（Metrics / Logs / Traces / Exceptions）

## 7.1 目标
打通“服务 → 排查”的核心调查路径。

## 7.2 任务包

### FE-4-1 Metrics Explorer
新增：
- `MetricsExplorerPage`
- `MetricQueryBuilder`
- `SavedMetricViewPanel`

### FE-4-2 Logs Explorer
新增：
- `LogsExplorerPage`
- `LogFacetSidebar`
- `LogPatternPanel`
- `LogDetailDrawer`

### FE-4-3 Trace Explorer
新增：
- `TraceExplorerPage`
- `TraceSummaryStrip`
- `TraceWaterfall`
- `SpanDetailPanel`

### FE-4-4 Exception Analysis
新增：
- `ExceptionAnalysisPage`
- `ExceptionClusterList`
- `ExceptionDetailDrawer`

### FE-4-5 Correlation 打通
必须支持：
- service → traces/logs
- trace → logs
- alert → traces/logs/service
- exception → traces/logs

## 7.3 验收标准
- investigate 页面不再直接做散乱数据拼装
- 所有关联跳转至少支持 serviceId + timeRange 透传
- logs/traces 页面可从 service detail 直达

---

# 8. Phase 5：Alerts

## 8.1 目标
建立真正的告警收件箱与规则管理面。

## 8.2 任务包

### FE-5-1 Alert Inbox
新增：
- `AlertInboxPage`
- `AlertSummaryStrip`
- `AlertTable`
- `AlertDetailDrawer`

### FE-5-2 Alert Rule Builder
新增：
- `AlertRulesPage`
- `RuleTypeTabs`
- `RuleEditorPanel`
- `RulePreviewPanel`

### FE-5-3 Notifications
新增：
- `NotificationCenterPage`

## 8.3 验收标准
- alert 可 ack/resolve/mute
- 可从 incident 回跳 service detail
- 规则编辑与实际 scope 模型一致

---

# 9. Phase 6：Admin（Billing / Ingestion / Setup）

## 9.1 目标
把运维配置与计费从“边角页面”变成稳定后台能力。

## 9.2 任务包

### FE-6-1 Billing
- `BillingPage`
- `PlanCard`
- `QuotaUsageStrip`
- `BillingHistoryTable`

### FE-6-2 Ingestion Admin
- `IngestionAdminPage`
- `AppKeyPanel`
- `IngestHealthPanel`
- `VerificationPanel`

### FE-6-3 Setup / Onboarding 收束
- 将 onboarding 重构为 admin/setup 体系的一部分

## 9.3 验收标准
- 用户能从 admin 页面完成 appKey / ingest / quota 查看
- onboarding 不再是孤岛流程

---

# 10. Phase 7：替换旧页面与收尾

## 10.1 任务包
- 移除旧 route
- 将旧页面重定向到新页面
- 删除重复组件
- 删除不再使用的 mock 入口
- 清理冗余样式

## 10.2 候选删除/收敛对象
- 旧 dashboard 作为首页入口的路径
- 重复 topology 组件
- 分裂的 logs/service-logs
- 页面直连 mock api

## 10.3 验收标准
- 路由稳定
- 旧页面无用户主路径依赖
- 主流程全部在新结构中闭环

---

# 10. 移动端约束

## 10.1 基本原则
- 本轮重构以桌面端为主，但不能破坏现有移动端路径
- 所有新共享组件至少要满足“可在移动端降级复用”
- 不允许把桌面端交互硬编码成移动端无法承载的唯一实现

## 10.2 必须考虑移动端的组件
- `PageHeader`
- `TimeRangeBar`
- `ScopeBar`
- `ResultTable`（移动端需有卡片/列表降级）
- `DetailDrawer`（移动端需能切换为全屏面板）
- `ServiceHealthBadge`
- `ServiceIdentityCard`

## 10.3 页面策略
- Overview / Service / Alerts / Logs 的核心信息结构需可映射到移动端
- 桌面端复杂拓扑、trace waterfall 可在移动端降级为摘要视图
- 新页面骨架落地时要保留移动端路由复用空间

# 11. 前端任务拆分建议

## 11.1 建议角色拆分

### Track A：Design System / Shared
- token
- provider
- shared components
- chart theme

### Track B：Shell / Navigation
- router meta
- sidebar grouping
- layout integration

### Track C：Service Domain
- overview
- services
- service detail
- topology
- instances

### Track D：Investigate Domain
- metrics
- logs
- traces
- exceptions

### Track E：Alerts + Admin
- alerts
- billing
- ingestion
- setup

---

# 12. 前端依赖关系

```text
Phase 0 -> Phase 1
Phase 1 -> Phase 2
Phase 2 -> Phase 3
Phase 2 -> Phase 4
Phase 4 -> Phase 5
Phase 2 + Phase 5 -> Phase 6
Phase 3 + Phase 4 + Phase 5 + Phase 6 -> Phase 7
```

关键依赖：
- ServiceDetail 是拓扑、trace、logs、alerts 体验的中心
- 没有统一的 Scope/TimeRange，就不要推进 investigate
- 没有统一 drawer/result table，页面会继续分裂

---

# 13. 前端风险点

## 13.1 最大风险
- 页面重构时继续把数据转换写回页面
- 新旧页面长期并存导致结构再次分裂
- 后端接口未准备好，前端又开始堆 fallback

## 13.2 控制策略
- 所有新页面必须走 adapter/composable
- 不允许新页面直接 import mock
- 每波结束都做路由与组件去重检查

---

# 14. 里程碑建议

## M1
- Phase 0 + 1 完成
- 可以用新壳层和共享组件造页面

## M2
- Phase 2 完成
- 新主链路可用：Panel-first Overview → Service Catalog → Service Detail

## M3
- Phase 3 + 4 完成
- 服务排查链路基本闭环

## M4
- Phase 5 + 6 完成
- 告警与管理能力完善

## M5
- Phase 7 完成
- 旧页面退出主路径

---

# 15. 前端完成定义（DoD）

一个阶段完成，必须满足：

1. 相关新页面已挂到正式路由或受控灰度路由
2. 使用新组件体系，而不是继续临时堆 UI
3. dark/light 主题可用
4. 不依赖 mock 作为主数据源
5. scope / timeRange / drill-down 行为一致
6. 至少完成一次真实链路手动验证
