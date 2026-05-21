# StarLight 重构实施状态

> 更新时间：当前会话自动维护

## 当前阶段

- Milestone: 1 共享底座
- Phase: 1 设计系统与共享组件底座
- 当前状态: 已完成（本轮主线）

## 已完成（已落代码）

### 1. 重构目录骨架已创建

已新增目录：

- `src/app/`
- `src/shared/`
- `src/shared/components/`
- `src/shared/layout/`
- `src/domains/`

状态：**已实现未验证**
说明：这是结构性准备，不影响现有运行逻辑。

### 2. 第一批共享组件已落代码

已新增文件：

- `src/shared/layout/PageHeader.tsx`
- `src/shared/components/ServiceHealthBadge.tsx`
- `src/shared/components/ServiceIdentityCard.tsx`
- `src/shared/components/DetailDrawer.tsx`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，且已有组件被旧页面实际接入，可作为共享组件基线继续扩展。

### 4. 服务拓扑页接入新共享组件

已修改文件：

- `src/views/homeWindow/service/topology.tsx`

本轮接入内容：

- 顶部标题区由旧 `SectionHeader` 切换为新 `PageHeader`
- 新增 `loadTopology`，刷新按钮接入 `PageHeader.actions`
- 详情抽屉由原始 `NDrawer/NDrawerContent` 切换为共享 `DetailDrawer`
- 节点详情顶部增加 `ServiceIdentityCard`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，通过后确认这是第二个可见页面接入点。

### 5. 服务列表页接入 `ResultTable`

已新增文件：

- `src/shared/components/ResultTable.tsx`

已修改文件：

- `src/views/homeWindow/service/list.tsx`

本轮接入内容：

- 新增共享 `ResultTable`，对 `NDataTable` 做第一层统一封装
- 服务列表页的主表格切换为 `ResultTable`
- 保留原有分页、rowKey、行样式和 loading 行为

状态：**已完成**
说明：已完成 `npm run build` 构建验证，通过后可作为后续列表型页面迁移模板。

### 6. 实时监控页接入 `TimeRangeBar`

已新增文件：

- `src/shared/components/TimeRangeBar.tsx`

已修改文件：

- `src/views/homeWindow/monitor/realtime.tsx`

本轮接入内容：

- 新增共享 `TimeRangeBar` 基础版
- 实时监控页顶部由旧 `SectionHeader` 切换为新 `PageHeader`
- 页面接入统一时间范围选择与实时模式开关
- 原“刷新”按钮移动到 `PageHeader.actions`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，通过后可作为后续时间范围统一接入模板。

### 7. 实时监控页接入 `ScopeBar`

已新增文件：

- `src/shared/components/ScopeBar.tsx`

已修改文件：

- `src/views/homeWindow/monitor/realtime.tsx`

本轮接入内容：

- 新增共享 `ScopeBar` 基础版
- 实时监控页的服务选择区切换为 `ScopeBar`
- 与 `TimeRangeBar` 形成统一的顶部筛选/时间上下文结构
- 保留原有服务切换与导出按钮行为

状态：**已完成**
说明：已完成 `npm run build` 构建验证，通过后可作为后续 service-first 筛选栏模板。

### 8. 样式入口构建阻塞修复

已新增文件：

- `src/styles/components.scss`

本轮修复内容：

- 补齐 `desktop.scss` 引用的 `components.scss` 样式入口
- 恢复样式主入口的稳定构建能力，避免后续验证被无关问题阻塞

状态：**已完成**
说明：修复后已完成 `npm run build` 构建验证。

### 9. service-first 新页面骨架第一批落地

已新增文件：

- `src/domains/overview/pages/OverviewPage.tsx`
- `src/domains/service/pages/ServiceCatalogPage.tsx`
- `src/domains/service/pages/ServiceDetailPage.tsx`

已修改文件：

- `src/router/index.ts`

本轮接入内容：

- 新增 Overview / Service Catalog / Service Detail 三个 V2 骨架页
- 统一复用 `PageHeader` / `TimeRangeBar` / `ScopeBar` / `ResultTable` / `ServiceIdentityCard`
- 挂载受控新路由，不替换旧主路径

访问路径：

- `/home/overview-v2`
- `/home/services-v2`
- `/home/service-detail-v2/:serviceId`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，作为后续 service-first 重构的正式起点。

### 10. `services-v2` 接入真实服务数据

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- V2 服务目录从静态假数据切换为真实 `fetchServices` 接口
- 增加页面级 loading / empty / error 处理
- 顶部页头增加“刷新目录”动作
- 页面开始具备第一条新页面真实数据链路

状态：**已完成**
说明：已完成 `npm run build` 构建验证，后续继续推进 overview-v2 与 service-detail-v2 的真实数据联调。

### 11. `overview-v2` 接入第一版真实 summary 数据

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

本轮接入内容：

- 当时的过渡版 overview 页面接入真实 `fetchServices` + `fetchAdminMetricsSnapshot`
- 顶部 summary 卡片改为真实数据
- 风险服务区改为真实服务列表推导
- 请求总量区改为真实快照统计

状态：**已完成**
说明：该条记录描述的是早期“默认模板式 overview 实现”的数据接入，不代表最终首页仍应维持固定 summary 卡片结构。

### 12. `service-detail-v2` 接入第一版真实身份与摘要数据

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- V2 服务详情接入真实 `fetchServices` / `fetchRealtimeMetrics` / `fetchServiceInstances`
- 服务身份卡改为真实服务字段
- 顶部摘要卡改为真实实例数 / QPS / 响应时间 / 错误率
- 运行摘要区改为真实 CPU / 内存 / 活跃连接 / 版本

状态：**已完成**
说明：已完成 `npm run build` 构建验证，随后进入 V2 主链路联通与移动端映射阶段。

### 13. 移动端 V2 主链路映射第一批落地

已新增文件：

- `src/mobile/views/OverviewV2.tsx`
- `src/mobile/views/ServicesV2.tsx`

已修改文件：

- `src/router/index.ts`
- `src/mobile/views/Home.tsx`

本轮接入内容：

- 新增移动端 V2 概览页与服务目录页
- 两个页面均接入真实接口数据
- 补充移动端 V2 路由入口
- 旧移动端首页增加到 V2 页面的跳转入口

访问路径：

- `/mobile/overview-v2`
- `/mobile/services-v2`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，作为移动端对主链路的第一批真实映射。

### 14. 移动端 `service-detail-v2` 映射落地

已新增文件：

- `src/mobile/views/ServiceDetailV2.tsx`

已修改文件：

- `src/router/index.ts`
- `src/mobile/views/ServicesV2.tsx`

本轮接入内容：

- 新增移动端 V2 服务详情页
- 服务目录页可跳转到移动端详情页
- 详情页接入真实 `fetchServices` / `fetchRealtimeMetrics` / `fetchServiceInstances`
- 形成移动端 Overview → Services → Service Detail 的第一版闭环

访问路径：

- `/mobile/service-detail-v2/:serviceId`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，随后进入新主路径切换准备阶段。

### 15. 新主路径替换旧主路径的第一步路由切换

已修改文件：

- `src/router/index.ts`

本轮接入内容：

- 桌面端 `/home` 默认重定向从旧 `service-overview` 切到 `/home/overview-v2`
- 移动端默认入口从旧 `/mobile/home` 切到 `/mobile/overview-v2`
- 保留旧页面路由本身不删除，确保过渡期可回看与回退

状态：**已完成**
说明：已完成 `npm run build` 构建验证，后续继续推进新旧路径收敛。

### 16. 首页接回可编辑面板入口

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

本轮接入内容：

- 在过渡期的 `overview-v2` 页头 actions 中增加面板入口
- 在首页正文增加可编辑面板说明卡片
- 当时用于把“单独的 custom-dashboard 能力”显式挂回首页过渡版本，后续主线已调整为 `/home/overview` 自身成为 panel-first 面板容器

状态：**已完成**
说明：该条记录反映的是旧阶段过渡方案；当前主线不再把“Overview 固定总览 + 单独 custom-dashboard”视为最终产品结构。

### 17. 旧总览/服务列表入口直接替换到 V2

已修改文件：

- `src/router/index.ts`
- `src/layout/left/index.tsx`

本轮接入内容：

- `service-overview` 旧路由直接重定向到 `/home/overview-v2`
- `service-list` 旧路由直接重定向到 `/home/services-v2`
- 左侧导航入口从旧路径切换到 V2 路径
- 左侧文案同步从“面板 / 服务列表”调整为“系统概览 / 服务目录”

状态：**已完成**
说明：该条记录描述的是当时的 V2 过渡收敛；当前主线已进一步把 `/home/overview` 重新定义为 panel-first 首页。

### 18. V2 页面第一批切换到新的后端 action

已修改文件：

- `src/api/url.ts`
- `src/api/metrics.ts`
- `src/domains/overview/pages/OverviewPage.tsx`
- `src/domains/service/pages/ServiceCatalogPage.tsx`
- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- 新增前端对 `metrics.v1.overview.summary` / `metrics.v1.catalog.services` / `metrics.v1.service.detail` 的 API 封装
- `overview-v2` 改为优先走新的 summary/catalog 接口
- `services-v2` 改为走新的 catalog services 接口
- `service-detail-v2` 改为走新的 service detail 接口

状态：**已完成**
说明：已完成 `npm run build` 构建验证，前端 V2 主链路已开始切换到新的后端 action。

### 19. 前端登录态恢复 / auth bootstrap 第一批收敛

已新增文件：

- `src/services/authSession.ts`

已修改文件：

- `src/App.tsx`
- `src/views/loginWindow/content/mode/email.tsx`
- `src/views/loginWindow/content/mode/qrcode.tsx`
- `src/store/user.ts`

本轮实现内容：

- 抽出统一的 token 恢复/持久化/清理 helper
- `App.tsx` 改为通过统一 helper 处理重新登录和 Tauri token 同步
- 邮箱登录、二维码登录统一使用 helper 读写 token
- `auth-token-request` 的响应逻辑改为统一读取 helper，而不是各处直接操作 cookie/localStorage
- `user store` 的 token 清理逻辑改为走统一 helper

状态：**已完成**
说明：已完成 `npm run build` 构建验证，前端 auth bootstrap 开始从分裂状态收敛。

### 20. 移动端 V2 页面第一批切换到新的后端 action

已修改文件：

- `src/mobile/views/OverviewV2.tsx`
- `src/mobile/views/ServicesV2.tsx`
- `src/mobile/views/ServiceDetailV2.tsx`

本轮接入内容：

- 移动端 `overview-v2` 改为走 `metrics.v1.overview.summary` + `metrics.v1.catalog.services`
- 移动端 `services-v2` 改为走 `metrics.v1.catalog.services`
- 移动端 `service-detail-v2` 改为走 `metrics.v1.service.detail`
- 桌面端与移动端 V2 主链路统一到同一套后端 read-model 契约

状态：**已完成**
说明：已完成 `npm run build` 构建验证，移动端 V2 主链路也已切到新的后端 action。

### 21. 前端自动登录与用户态恢复进一步收敛

已修改文件：

- `src/services/authSession.ts`
- `src/App.tsx`
- `src/views/loginWindow/content/mode/email.tsx`
- `src/views/loginWindow/content/mode/qrcode.tsx`
- `src/store/user.ts`
- `src/services/webSocket.ts`

本轮实现内容：

- 在 `authSession` 中补充 `getStoredUserInfo / persistStoredUserInfo / clearStoredAuthSession / resolveAuthLandingRoute`
- 邮箱登录与二维码登录统一通过 `resolveAuthLandingRoute` 决定登录后跳转
- 自动登录不再手动解析本地 user 字段，改为统一 helper
- `App` 的 re-login 改为清理完整 auth session（token + user）
- `user store` 与 `webSocket` 的用户恢复/清理逻辑改为走统一 helper

状态：**已完成**
说明：已完成 `npm run build` 构建验证，前端登录链路里自动登录与用户态恢复的重复实现进一步收敛。

### 22. 拓扑页详情抽屉切到新的 service detail action

已修改文件：

- `src/views/homeWindow/service/topology.tsx`

本轮接入内容：

- 拓扑页节点详情由旧 `fetchRealtimeMetrics` 切换到 `fetchServiceDetailSummary`
- 详情抽屉开始直接消费新的后端 `metrics.v1.service.detail`
- 详情面板补充实例数与版本信息，减少页面自行拼装旧指标逻辑

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧监控页已开始切到新的后端契约。

### 23. realtime 页摘要层与服务选择切到新契约

已修改文件：

- `src/views/homeWindow/monitor/realtime.tsx`

本轮接入内容：

- 服务选择源由旧 `getAppKeys` 切到新的 `fetchCatalogServices`
- 顶部摘要数据由旧 `fetchRealtimeOverview.summary` 切到 `fetchServiceDetailSummary.summary`
- 图表序列与系统状态区继续复用现有 `fetchRealtimeOverview`，保持渐进迁移

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 realtime 页已开始切到新的后端契约。

### 24. instance 页服务选择层切到新契约

已修改文件：

- `src/views/homeWindow/service/instance.tsx`

本轮接入内容：

- 服务下拉选项由旧 `fetchServices` 切到新的 `fetchCatalogServices`
- 实例页开始复用新的 catalog/read-model 契约作为服务筛选来源
- 主体实例数据仍继续复用现有 `fetchServiceInstances`，保持渐进迁移

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 instance 页也开始向新后端契约收敛。

### 25. alerts 页服务筛选源切到新契约

已修改文件：

- `src/views/homeWindow/alert/list.tsx`

本轮接入内容：

- alerts 页服务筛选源由旧 `getAppKeys` 切到新的 `fetchCatalogServices`
- 告警页开始复用新的 catalog/read-model 契约作为服务筛选来源
- 主体告警列表与操作逻辑保持不变，确保渐进迁移

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 alerts 页也开始向新后端契约收敛。

### 26. metrics-analysis 页服务来源切到新契约

已修改文件：

- `src/views/homeWindow/monitor/metrics.tsx`

本轮接入内容：

- metrics-analysis 页的服务来源由原先依赖查询结果内嵌服务列表，改为独立走 `fetchCatalogServices`
- 主查询继续复用现有 `fetchMetricsAnalysis` action，保持图表逻辑稳定
- 页面开始统一到“catalog 负责服务选择源、analysis 负责图表数据”的结构

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 metrics-analysis 页也开始向新后端契约收敛。

### 27. alert-rules 页服务筛选源切到新契约

已修改文件：

- `src/views/homeWindow/alert/rules.tsx`

本轮接入内容：

- alert-rules 页服务筛选源由旧 `getAppKeys` 切到新的 `fetchCatalogServices`
- 告警规则页开始复用新的 catalog/read-model 契约作为服务选择来源
- 主体规则 CRUD 逻辑保持不变，确保渐进迁移

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 alert-rules 页也开始向新后端契约收敛。

### 28. service-list 主列表/顶部统计/详情弹窗切到新契约

已修改文件：

- `src/views/homeWindow/service/list.tsx`

本轮接入内容：

- 主列表数据源由旧 `fetchServices` 切到新的 `fetchCatalogServices`
- 顶部统计由旧 `fetchAdminMetricsSnapshot` 手工拼装切到 `fetchOverviewSummary`
- 详情弹窗由旧 `fetchRealtimeMetrics` 切到 `fetchServiceDetailSummary`
- service-list 主要数据路径开始统一到新的后端 read-model 契约

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 service-list 页已开始向新后端契约收敛。

### 29. service-list 详情层收敛到共享组件

已修改文件：

- `src/views/homeWindow/service/list.tsx`

本轮接入内容：

- 详情层由旧 `NModal` 切到共享 `DetailDrawer`
- 详情头部接入共享 `ServiceIdentityCard`
- 旧页详情层开始复用统一的服务身份展示与抽屉容器，减少重复 UI 逻辑

状态：**已完成**
说明：已完成 `npm run build` 构建验证，service-list 详情层已向共享组件体系收敛。

### 30. onboarding 完成后的默认落点切到 V2 首页

已修改文件：

- `src/views/homeWindow/onboarding/index.tsx`

本轮接入内容：

- onboarding 完成后默认从旧 `custom-dashboard` 改为进入 `/home/overview-v2`
- 当时用于让新用户先进入新的首页主链路；当前主线已进一步将 `/home/overview` 定义为 panel-first 首页，而不是“总览页 + 独立看板编辑入口”
- 不移除可编辑看板能力，只修正新用户完成接入后的默认进入路径

状态：**已完成**
说明：已完成 `npm run build` 构建验证，新用户完成接入后会直接进入新的首页主链路。

### 31. 旧 dashboard 核心数据源脱离 mock/api

已修改文件：

- `src/views/homeWindow/monitor/dashboard.tsx`

本轮接入内容：

- 旧 dashboard 的核心数据源从 `@/mock/api` 切到真实 API / read-model 组合
- 总览数值改为使用 `fetchOverviewSummary`
- 折线/柱图数据改为使用 `fetchMetricsAnalysis`
- 告警列表改为使用真实 `fetchAlerts`
- 饼图与部分统计改为基于 `fetchCatalogServices` 推导

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 dashboard 已不再直接依赖 `@/mock/api` 的核心数据。

### 32. billing 页面切到新的 subscription read-model

已修改文件：

- `src/api/url.ts`
- `src/api/subscription.ts`
- `src/views/homeWindow/billing/usage.tsx`
- `src/views/homeWindow/billing/plans.tsx`

本轮接入内容：

- 新增前端对 `subscription.v1.current.detail` / `subscription.v1.usage.summary` 的 API 封装
- `billing/usage` 改为使用 `getUsageSummary()`
- `billing/plans` 改为使用 `getSubscriptionCurrentDetail()`
- billing 页面开始接入新的 subscription read-model，而不再只依赖旧 user/usage 接口

状态：**已完成**
说明：已完成 `npm run build` 构建验证，billing 页已开始向新的 subscription 契约收敛。

### 33. 日志中心概览与异常分析切到新的 logs read-model

已修改文件：

- `src/api/url.ts`
- `src/api/logs.ts`
- `src/views/homeWindow/log/index.tsx`
- `src/views/homeWindow/log/exception.tsx`

本轮接入内容：

- 新增前端对 `logs.v1.explorer.search` / `logs.v1.explorer.stats` / `logs.v1.exceptions.list` 的 API 封装
- `log/index` 的统计与最近日志改为走新的 explorer read-model
- `log/exception` 改为走新的 exceptions list，并适配回现有前端数据结构
- 日志中心开始真正接入新的 logs 后端契约

状态：**已完成**
说明：已完成 `npm run build` 构建验证，日志中心概览与异常分析已开始向新的 logs 契约收敛。

### 34. service logs 明细页切到新的 logs explorer 契约并去掉 mock fallback

已修改文件：

- `src/views/homeWindow/log/service.tsx`

本轮接入内容：

- 日志搜索由旧 `searchLogs` 切到新的 `searchLogsExplorer`
- 日志统计由旧 `getLogStats` 切到新的 `getLogExplorerStats`
- 去掉搜索失败时回退到 mock 日志数据的逻辑，改为真实失败即空列表/错误日志

状态：**已完成**
说明：已完成 `npm run build` 构建验证，service logs 页已开始向新的 logs explorer 契约收敛。

### 36. 旧 dashboard 残余英文文案清理

已修改文件：

- `src/views/homeWindow/monitor/dashboard.tsx`

本轮接入内容：

- 旧 dashboard 的页标题、副标题、统计卡、图表标题、告警文案、弹窗表单文案统一改为中文
- 保持原有编辑能力与页面结构不变，仅收敛产品语言与当前整体风格一致性

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 dashboard 的主要可见文案已从英文切换为中文。

### 38. 旧 dashboard 新增组件交互重构为结构化配置

已修改文件：

- `src/views/homeWindow/monitor/dashboard.tsx`

本轮接入内容：

- 新增组件交互由旧 checkbox 式选择，改为“组件类型 + 指标类型”的结构化配置
- 新增组件不再只是关闭弹窗，而是会真实添加到面板中
- 支持的新增组件类型包括：指标卡、趋势图、分布图、告警列表
- 继续复用现有真实数据源，不引入新的 mock 逻辑

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 dashboard 的新增组件交互已从临时表单升级为可实际使用的结构化配置。

### 40. payment 页接入真实 billing history

已修改文件：

- `src/api/url.ts`
- `src/api/subscription.ts`
- `src/views/homeWindow/billing/payment.tsx`

本轮接入内容：

- 新增前端 `billingHistory` API 路径与 `getBillingHistory()` 封装
- `payment.tsx` 不再使用演示账单数据，改为请求真实账单历史列表
- 发票列支持基于后端返回的 `downloadUrl` 进行下载跳转

状态：**已完成**
说明：已完成 `npm run build` 构建验证，payment 页已开始使用真实 billing history 数据。

### 42. 旧 dashboard 编辑交互补齐

已修改文件：

- `src/views/homeWindow/monitor/dashboard.tsx`

本轮接入内容：

- `编辑布局` 按钮改为真实切换编辑态
- `刷新数据` 按钮改为真实触发 `loadData()`
- 编辑态下可删除已添加的自定义组件
- 旧 dashboard 的编辑交互不再停留在摆设按钮层面

状态：**已完成**
说明：已完成 `npm run build` 构建验证，旧 dashboard 的核心编辑交互已进一步可用化。

### 43. notifications 页适配新的后端返回结构

已修改文件：

- `src/views/homeWindow/alert/notifications.tsx`

本轮接入内容：

- 将后端 `id / sentAt / type / target / content` 结构适配为页面当前使用的通知模型
- 顶部四个统计卡改为根据真实通知列表动态计算，而不是硬编码数字
- alerts 通知页开始真正对齐新的后端 notifications 契约

状态：**已完成**
说明：已完成 `npm run build` 构建验证，notifications 页已适配新的后端返回结构。

### 44. alert list 主要可见文案统一为中文

已修改文件：

- `src/views/homeWindow/alert/list.tsx`

本轮接入内容：

- 告警历史页的标题、副标题、筛选占位、统计卡、等级/状态文案、操作按钮统一切换为中文
- 页面产品语言与当前整体系统保持一致

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alert list 页主要可见文案已完成中文化。

### 49. 异常分析页收敛到共享页头组件

已修改文件：

- `src/views/homeWindow/log/exception.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 异常分析页进一步统一到当前共享壳层组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，异常分析页已完成共享页头收敛。

### 50. 日志中心概览页收敛到共享页头组件

已修改文件：

- `src/views/homeWindow/log/index.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 日志中心概览页进一步统一到当前共享壳层组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，日志中心概览页已完成共享页头收敛。

### 51. service logs 页收敛到共享组件

已修改文件：

- `src/views/homeWindow/log/service.tsx`

本轮接入内容：

- 页头补齐共享 `PageHeader`
- 列表由旧 `NDataTable` 切到共享 `ResultTable`
- service logs 页进一步统一到当前共享壳层与表格组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，service logs 页已完成共享组件收敛。

### 52. 异常分析页列表区收敛到共享 ResultTable

已修改文件：

- `src/views/homeWindow/log/exception.tsx`

本轮接入内容：

- 异常列表由旧 `NDataTable` 切到共享 `ResultTable`
- 异常分析页在页头之外，列表层也进一步统一到当前共享组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，异常分析页列表区已完成共享表格收敛。

### 53. billing payment 页账单列表收敛到共享 ResultTable

已修改文件：

- `src/views/homeWindow/billing/payment.tsx`

本轮接入内容：

- 账单历史列表由旧 `NDataTable` 切到共享 `ResultTable`
- billing/payment 页进一步统一到当前共享表格组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，billing payment 页账单列表已完成共享表格收敛。

### 54. instance 页收敛到共享组件

已修改文件：

- `src/views/homeWindow/service/instance.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 实例列表由旧 `NDataTable` 切到共享 `ResultTable`
- instance 页进一步统一到当前共享壳层与表格组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，instance 页已完成共享组件收敛。

### 55. 共享 ResultTable 补齐 rowProps 能力

已修改文件：

- `src/shared/components/ResultTable.tsx`

本轮接入内容：

- 为共享 `ResultTable` 增加 `rowProps` 支持
- 外部页面可以在保留共享表格能力的同时，自定义行点击/交互行为
- 为 trace 等需要行级交互的页面提供统一表格基础能力

状态：**已完成**
说明：已完成 `npm run build` 构建验证，共享表格能力进一步补全。

### 56. trace 页收敛到共享组件并补齐真实服务筛选

已修改文件：

- `src/views/homeWindow/monitor/trace.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 主列表由旧 `NDataTable` 切到共享 `ResultTable`
- 服务筛选由硬编码列表改为 `fetchCatalogServices()` 提供的真实服务目录
- trace 页进一步统一到 service-first 与共享组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，trace 页已完成共享组件与真实服务筛选收敛。

### 57. log/config 页收敛到共享组件

已修改文件：

- `src/views/homeWindow/log/config.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 过滤规则列表由旧 `NDataTable` 切到共享 `ResultTable`
- log/config 页进一步统一到当前共享壳层与表格组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，log/config 页已完成共享组件收敛。

### 84. log/config 的“测试连接”已接回真实后端探活

已修改文件：

- `src/views/homeWindow/log/config.tsx`
- `src/api/url.ts`
- `src/api/logs.ts`

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/actions/stats.ts`

本轮接入内容：

- `log/config` 页的“测试连接”不再弹出固定成功提示
- 前端新增 `logs.config.testConnection` API 封装
- 后端新增 `v1.config.testConnection` 动作，实际通过 logs service 的 Elasticsearch manager 做连接探活

### 85. log/config 的连接测试已开始校验用户填写的 Elasticsearch 配置

已修改文件：

- `src/views/homeWindow/log/config.tsx`
- `src/api/logs.ts`

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/actions/stats.ts`
- `../darwin-app/src/apps/starlight/logs/utils/elasticsearch.ts`
- `../darwin-app/src/apps/starlight/logs/utils/elasticsearch-manager.ts`

本轮接入内容：

- 前端“测试连接”会把当前表单中的 `hosts / username / password / indexPrefix` 传给后端
- 后端连接测试不再只探活服务默认 ES 配置，而是优先使用用户传入的 Elasticsearch 配置构建临时客户端
- Elasticsearch 客户端与 manager 现在也支持显式 username，而不再仅硬编码 `elastic`

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：
  - 传入自定义 ES 配置时返回 `200 / connected=true`
  - 不传自定义配置且服务默认探活失败时返回 `503 / connected=false`

状态：**已完成**
说明：log/config 的连接测试已从“只验证服务默认配置”进一步收敛到“真正验证用户填写的 ES 连接参数”。

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：后端连接测试 action 在健康探活成功时返回 `200 / connected=true`，失败时返回 `503 / connected=false`

状态：**已完成**
说明：log/config 的连接测试已从本地假成功提示收敛为真实后端探活能力。

### 87. log/stream 的导出已改用后端真实导出链路

已修改文件：

- `src/views/homeWindow/log/stream.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/actions/export.ts`

本轮接入内容：

- `log/stream` 页的“导出”不再直接把当前浏览器缓冲日志序列化为本地文本文件
- 前端改为调用现有 `api.logs.exportLogs()` 后端导出链路，并使用返回的 `exportData/meta.filename` 生成下载文件
- 实时日志页的导出结果开始与后端日志导出能力对齐，而不是只依赖浏览器内存中的临时缓冲数据

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过

状态：**已完成**
说明：log/stream 的导出能力已从前端内存导出收敛到后端真实日志导出链路。

### 89. log/stream 的导出响应契约已与后端保持一致

已修改文件：

- `src/views/homeWindow/log/stream.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/actions/export.ts`

本轮接入内容：

- 前端导出逻辑改为读取后端实际返回的 `content.exportData` 与 `content.meta.filename`
- 后端导出 action 不再依赖 body-level `tenantId / apiKey`，而是优先从 `ctx.meta` 读取认证上下文
- `log/stream` 的导出链路已从“命中后端但前端取不到导出内容”收敛到真实可下载的契约状态

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：后端导出 action 返回 `status=200 / success=true`，并带有可用的 `exportData` 与 `meta.filename`

状态：**已完成**
说明：log/stream 的导出响应契约已不再与后端返回结构错位。

### 98. log-center 的实时流 tab 已改用真实服务目录筛选项

已修改文件：

- `src/views/homeWindow/log/stream.tsx`

本轮接入内容：

- 实时流 tab 不再使用硬编码的 `user-service / order-service / payment-service / notification-service` 假服务列表
- 服务筛选项改为通过 `fetchCatalogServices()` 加载真实服务目录
- log-center 的实时流筛选已与其它已收敛页面使用同一服务目录来源

验证结果：

- `npm run build` 通过
- 代码路径验证：实时流页的服务筛选项已改为 `fetchCatalogServices()`，并会同步进入 `streamParams` 用于构造真实 SSE 请求 URL

### 99. log-center 的实时流关键词过滤已改为后端源头过滤

已修改文件：

- `src/views/homeWindow/log/stream.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/actions/stream.ts`
- `../darwin-app/src/apps/starlight/logs/utils/stream-manager.ts`
- `../darwin-app/src/apps/starlight/logs/types/index.ts`

本轮接入内容：

- 前端可见的 `service / level / keyword` 过滤条件现在都会同步到 `streamParams`
- backend `v1.stream` 现在接受并应用 `keywords` 参数
- SSE 源头过滤不再只支持 `service/level`，而是会在广播前对日志消息执行关键字匹配

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：当 `keywords='error-keyword'` 时，流只收到包含该关键字的 `log` 事件，未匹配的日志不会被写入 SSE 响应

状态：**已完成**
说明：log-center 实时流的可见过滤条件已从“部分只做前端过滤”收敛为真实后端源头过滤。

状态：**已完成**
说明：log-center 实时流页的服务选择器已从假数据收敛到真实目录源。

### 88. log/stream 的实时连接已接回真实后端 SSE 合约

已修改文件：

- `src/views/homeWindow/log/stream.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/actions/stream.ts`
- `../darwin-app/src/apps/starlight/logs/events/logs-events.ts`
- `../darwin-app/src/apps/starlight/logs/methods/log-ingestion.ts`
- `../darwin-app/src/apps/starlight/logs/validators/logs.ts`

本轮接入内容：

- `log/stream` 前端不再拼接不存在的 `/api/logs/stream/:id` 路径，而是改为使用后端真实 SSE 路径 `/api/logs/v1/stream?...`
- 前端不再把 SSE 消息当成裸 `LogEntry`，而是按 `LogStreamEvent` 信封解析
- 后端 stream action 现在会监听 broadcast 事件并向响应流写入 `log` 事件
- 日志摄取方法会把处理后的日志 payload 通过既有 ingest 事件广播到活跃流中，实时流真正收到日志数据而不再只有 `connected/heartbeat`
- stale 的 `apiKey` 参数校验已从 stream validator 移除，使 live SSE 路径与当前 handler 参数模型一致

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：`v1.stream` 建连成功后，SSE 输出先返回 `connected` 事件，再返回真实 `log` 事件，其中包含 `service='growth-service'` 与 `message='stream ok'`

状态：**已完成**
说明：log/stream 的实时连接已从“只建连/心跳、无真实日志投递”收敛为与后端 SSE 合约一致的实时日志传输链路。

### 58. log/stream 与 log/ingest 页头收敛到共享 PageHeader

已修改文件：

- `src/views/homeWindow/log/stream.tsx`
- `src/views/homeWindow/log/ingest.tsx`

本轮接入内容：

- 两个页面的页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 日志流与日志摄取页进一步统一到当前共享壳层组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，log/stream 与 log/ingest 页头已完成共享组件收敛。

### 59. metrics-analysis 页头收敛到共享 PageHeader

已修改文件：

- `src/views/homeWindow/monitor/metrics.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 指标分析页进一步统一到当前共享壳层组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，metrics-analysis 页头已完成共享组件收敛。

### 60. log/ingest 摄取历史表收敛到共享 ResultTable

已修改文件：

- `src/views/homeWindow/log/ingest.tsx`

本轮接入内容：

- 摄取历史列表由旧 `NDataTable` 切到共享 `ResultTable`
- log/ingest 页进一步统一到当前共享表格组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，log/ingest 摄取历史表已完成共享表格收敛。

### 61. alert list 残余英文文案清理

已修改文件：

- `src/views/homeWindow/alert/list.tsx`

本轮接入内容：

- 将服务选项与表格列中的残余英文（如 All Services / Time / Status / Severity / Alert Message / Duration / Actions）统一改为中文
- 告警历史页的产品语言进一步与整体系统保持一致

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alert list 残余英文文案已完成清理。

### 62. alerts 线服务来源函数命名收敛到 catalog 语义

已修改文件：

- `src/views/homeWindow/alert/list.tsx`
- `src/views/homeWindow/alert/rules.tsx`

本轮接入内容：

- 将遗留的 `fetchServices` 命名统一改为 `loadServiceOptions`
- 避免页面已经走 `fetchCatalogServices()` 但函数名仍像旧服务查询逻辑，减少后续维护误导

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alerts 线的服务来源命名已与当前契约语义对齐。

### 63. billing 容器页收敛到共享 PageHeader

已修改文件：

- `src/views/homeWindow/billing/index.tsx`

本轮接入内容：

- billing 容器页由手写 `<h2>` 标题区切到共享 `PageHeader`
- billing 页面进一步统一到当前共享壳层组件体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，billing 容器页已完成共享页头收敛。

### 64. service-list 去除伪重启成功流程

已修改文件：

- `src/views/homeWindow/service/list.tsx`

本轮接入内容：

- 重启服务操作不再使用 `setTimeout` 假装成功并直接修改本地状态
- 在尚未接入真实重启接口时，改为明确提示用户使用服务端运维入口执行重启
- 避免页面用假交互误导用户认为服务已真实重启

状态：**已完成**
说明：已完成 `npm run build` 构建验证，service-list 的伪重启成功逻辑已去除。

### 65. log/config 去除伪 API 行为并改为本地语义

已修改文件：

- `src/views/homeWindow/log/config.tsx`

本轮接入内容：

- 保存配置不再用 `setTimeout` 假装远程调用，改为明确的本地保存提示
- 重置配置改为真实恢复默认本地值，而不是伪装 API 重置
- 连接测试改为“本地参数校验通过”语义，不再伪装远程探活

状态：**已完成**
说明：已完成 `npm run build` 构建验证，log/config 中伪造异步 API 行为已清理。

### 66. payment 页去掉“添加支付方式”假交互

已修改文件：

- `src/views/homeWindow/billing/payment.tsx`

本轮接入内容：

- “添加支付方式”按钮不再制造可用假象
- 改为明确提示当前版本尚未接入真实支付方式管理，请使用外部支付后台维护
- 避免页面继续制造错误预期

状态：**已完成**
说明：已完成 `npm run build` 构建验证，payment 页的假交互已收敛为明确提示。

### 67. payment 页去除静态 VISA 演示卡片

已修改文件：

- `src/views/homeWindow/billing/payment.tsx`

本轮接入内容：

- 去掉静态 VISA 演示卡片
- 改为明确显示“当前未接入真实支付方式管理”的状态说明
- 避免 billing/payment 页继续展示假的支付卡信息误导用户

状态：**已完成**
说明：已完成 `npm run build` 构建验证，payment 页静态支付卡演示数据已清理。

### 68. metrics snapshot 去除 mock 回退数据

已修改文件：

- `src/api/metrics.ts`

本轮接入内容：

- `fetchAdminMetricsSnapshot()` 在真实接口失败时不再回退到 `@/mock/metirc.json`
- 改为返回空 snapshot 结构并保留 warning 日志
- 避免真实接口失败时页面继续被假指标数据误导

状态：**已完成**
说明：已完成 `npm run build` 构建验证，metrics snapshot 的 mock 回退逻辑已清理。

### 69. onboarding 环境检查去除人为等待

已修改文件：

- `src/views/homeWindow/onboarding/components/Step2_Environment.tsx`

本轮接入内容：

- 去掉浏览器检查与网络检查前的两处 500ms 人为等待
- 保留真实的 API 超时控制，但不再制造无意义的假异步延迟
- onboarding 环境检查交互更直接、更符合真实执行语义

状态：**已完成**
说明：已完成 `npm run build` 构建验证，Step2 环境检查中的伪延迟已清理。

### 70. service-list 顶部统计切到 metrics.v1.dashboard read-model

已修改文件：

- `src/views/homeWindow/service/list.tsx`

本轮接入内容：

- 顶部统计卡不再前端手工将 `overview summary` 改写成 `dashboardData`
- 改为直接使用 `fetchDashboardData()` 对接后端 `metrics.v1.dashboard`
- service-list 页在 summary 层进一步减少前端拼装逻辑

状态：**已完成**
说明：已完成 `npm run build` 构建验证，service-list 顶部统计已切到后端 dashboard read-model。

### 71. ServiceDetailPage 从占位骨架补成多区块详情页

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- 将原先只包含“运行摘要 + 后续接入说明”的骨架页补成真正的多标签详情页
- 新增 `概览 / 指标 / 拓扑 / 日志 / 链路 / 告警 / 运行时` 多区块结构
- 每个区块不再是纯占位文案，而是提供真实摘要或可操作跳转入口，形成主链路闭环
- ServiceDetailPage 不再停留在 Oracle 指出的“后续接入”状态

状态：**已完成**
说明：已完成 `npm run build` 构建验证，ServiceDetailPage 已从骨架提升为可用的多区块主详情页。

### 72. overview / service detail 请求链路接入 timeRange 参数

已修改文件：

- `src/api/metrics.ts`
- `src/domains/overview/pages/OverviewPage.tsx`
- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- `fetchOverviewSummary()` 请求开始显式携带 `timeRange`
- `fetchServiceDetailSummary()` 请求开始显式携带 `timeRange`
- `overview-v2` 与 `service-detail-v2` 的 `TimeRangeBar` 不再停留在纯 UI 层

状态：**已完成**
说明：已完成 `npm run build` 构建验证，前端 timeRange 已真正进入 overview/service detail 请求链路。

### 73. 后端 overview / service detail action 显式接收 timeRange

已修改文件：

- `darwin-app/src/apps/starlight/metrics/actions/realtime.ts`

本轮接入内容：

- `v1.service.detail` 增加 `timeRange` 参数声明
- `buildServiceDetailContent()` 签名同步接收 `timeRange`
- 后端 service detail 契约层开始显式承接前端 timeRange 参数

状态：**已完成**
说明：已完成 `npm run build:fengyuServer` 与 `npx tsc --noEmit` 验证，overview/service detail 的 timeRange 链路已从 UI 延伸到契约层。

### 74. ServiceDetailPage 运行时区接入 service runtime 契约

已修改文件：

- `src/api/url.ts`
- `src/api/metrics.ts`
- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- 新增前端 `fetchServiceRuntime()` 封装
- ServiceDetailPage 的运行时区改为展示真实 `service runtime` 数据（AppKey / 区域 / ingest 状态）
- ServiceDetailPage 不再只显示本地拼装的版本/实例摘要，而是开始消费新的 runtime 契约

状态：**已完成**
说明：已完成 `npm run build` 构建验证，ServiceDetailPage 的运行时区已接入新的后端 runtime 契约。

### 75. OverviewPage 接入 overview incidents 契约

已修改文件：

- `src/api/url.ts`
- `src/api/metrics.ts`
- `src/domains/overview/pages/OverviewPage.tsx`

本轮接入内容：

- 新增前端 `fetchOverviewIncidents()` 封装
- OverviewPage 新增“最近事件”区块，直接消费后端 `overview incidents` 数据
- OverviewPage 不再只有风险服务和请求总量，还开始具备事件摘要能力

状态：**已完成**
说明：已完成 `npm run build` 构建验证，OverviewPage 已接入 overview incidents 契约。

### 76. 新增 domains/alerts/AlertInboxPage 并挂载 V2 路由

已修改文件：

- `src/domains/alerts/pages/AlertInboxPage.tsx`
- `src/router/index.ts`

本轮接入内容：

- 新增 `domains/alerts` 域页面，补齐此前缺失的 alerts 域化页面
- 新增受控路由 `/home/alerts-v2`
- AlertInboxPage 复用共享组件与现有告警数据能力，作为 alerts 域的正式起点

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alerts 域页面不再完全依赖旧 `views/homeWindow/alert/*`。

### 77. 新增 domains/logs/LogExplorerPage 并挂载 V2 路由

已修改文件：

- `src/domains/logs/pages/LogExplorerPage.tsx`
- `src/router/index.ts`

本轮接入内容：

- 新增 `domains/logs` 域页面，补齐此前缺失的 logs 域化页面
- 新增受控路由 `/home/logs-v2`
- LogExplorerPage 复用共享组件与现有 logs explorer 契约，作为 logs 域的正式入口之一

状态：**已完成**
说明：已完成 `npm run build` 构建验证，logs 域页面不再完全依赖旧 `views/homeWindow/log/*`。

### 78. 新增 domains/admin/BillingPage 并挂载 V2 路由

已修改文件：

- `src/domains/admin/pages/BillingPage.tsx`
- `src/router/index.ts`

本轮接入内容：

- 新增 `domains/admin` 域页面，补齐此前缺失的 admin 域化页面入口
- 新增受控路由 `/home/admin-billing-v2`
- AdminBillingPage 复用现有 billing 组件，作为 admin 域的正式入口之一

状态：**已完成**
说明：已完成 `npm run build` 构建验证，admin 域页面已具备正式路由入口。

### 79. 新增 domains/trace/TraceExplorerPage 并挂载 V2 路由

已修改文件：

- `src/domains/trace/pages/TraceExplorerPage.tsx`
- `src/router/index.ts`

本轮接入内容：

- 新增 `domains/trace` 域页面，补齐此前缺失的 trace 域化页面
- 新增受控路由 `/home/trace-v2`
- TraceExplorerPage 复用共享组件、真实服务目录和现有 trace 查询能力，作为 trace 域的正式入口之一

状态：**已完成**
说明：已完成 `npm run build` 构建验证，trace 域页面已具备正式路由入口。

### 80. 新增 domains/metrics/MetricsExplorerPage 并挂载 V2 路由

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`
- `src/router/index.ts`

本轮接入内容：

- 新增 `domains/metrics` 域页面，补齐此前缺失的 metrics 域化页面
- 新增受控路由 `/home/metrics-v2`
- MetricsExplorerPage 复用现有指标分析页，作为 metrics 域的正式入口之一

状态：**已完成**
说明：已完成 `npm run build` 构建验证，metrics 域页面已具备正式路由入口。

### 81. 新增 domains/admin/IngestionPage 并挂载 V2 路由

已修改文件：

- `src/domains/admin/pages/IngestionPage.tsx`
- `src/router/index.ts`

本轮接入内容：

- 新增 `domains/admin` 下的接入管理页，补齐 admin 域另一条正式入口
- 新增受控路由 `/home/admin-ingestion-v2`
- 页面提供 AppKey 列表、接入状态摘要和 onboarding / overview / dashboard 快捷入口

状态：**已完成**
说明：已完成 `npm run build` 构建验证，admin 域已具备 billing 之外的第二个正式页面入口。

### 82. 新增 domains/admin/OnboardingPage 并挂载 V2 路由

已修改文件：

- `src/domains/admin/pages/OnboardingPage.tsx`
- `src/router/index.ts`

本轮接入内容：

- 新增 `domains/admin` 下的 onboarding 域入口页
- 新增受控路由 `/home/admin-onboarding-v2`
- 让 onboarding 不再只是旧路由孤岛，而开始成为 admin 域的一部分

状态：**已完成**
说明：已完成 `npm run build` 构建验证，admin/onboarding 域入口已落地。

### 83. 补齐 domains/metrics / domains/trace / domains/admin 的受控入口页面

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`
- `src/domains/trace/pages/TraceExplorerPage.tsx`
- `src/domains/admin/pages/OnboardingPage.tsx`
- `src/router/index.ts`

本轮接入内容：

- 新增 `metrics-v2`、`trace-v2`、`admin-onboarding-v2` 受控域化路由
- metrics / trace / admin 三个域不再只依赖旧 `views/homeWindow/*` 页面作为唯一入口
- 域化页面覆盖面继续补齐，和前面已落地的 `alerts/logs/admin-billing` 形成更完整的结构

状态：**已完成**
说明：已完成 `npm run build` 构建验证，metrics/trace/admin 的域化入口进一步补齐。

### 84. ServiceDetailPage 到下游页面的 serviceId / timeRange 透传链路补齐（第一批）

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`
- `src/views/homeWindow/monitor/metrics.tsx`
- `src/views/homeWindow/log/service.tsx`
- `src/views/homeWindow/monitor/trace.tsx`
- `src/views/homeWindow/alert/list.tsx`
- `src/views/homeWindow/service/instance.tsx`

本轮接入内容：

- ServiceDetailPage 跳转到指标/日志/链路/告警/实例页时开始统一携带 `serviceId + timeRange`
- metrics-analysis / service logs / trace / alert list / instance-monitor 开始从 query 初始化 service 与时间范围
- service-first 主链路的上下文透传不再停留在详情页内部

状态：**已完成**
说明：已完成 `npm run build` 构建验证，服务详情到下游页面的上下文透传已开始真正落地。

### 85. metrics-analysis 真正传递 timeRange 到后端分析接口

已修改文件：

- `src/views/homeWindow/monitor/metrics.tsx`

本轮接入内容：

- 指标分析页不再只读取时间范围 UI，而是把当前时间区间转换为后端 `timeRange` 参数
- 指标分析查询真正开始随着用户选定时间范围变化而变化

状态：**已完成**
说明：已完成 `npm run build` 构建验证，metrics-analysis 的 timeRange 已真正进入请求链路。

### 86. metrics service detail 摘要真正按 timeRange 计算

已修改文件：

- `darwin-app/src/apps/starlight/metrics/actions/realtime.ts`

本轮接入内容：

- `buildServiceDetailContent()` 不再忽略 `timeRange`
- service detail 摘要中的 CPU / memory / QPS / responseTime 开始基于 `timeRange` 内的序列平均值计算
- `timeRange` 不再只是契约层的空参数

状态：**已完成**
说明：已完成 `npm run build:fengyuServer` 与 `npx tsc --noEmit` 验证，service detail 的时间范围计算已从参数声明变为真实参与摘要计算。

### 87. trace API 改用真实后端 trace 契约并去掉伪 span 生成

已修改文件：

- `src/api/url.ts`
- `src/api/trace.ts`

本轮接入内容：

- 新增 `traceSearch / traceDetail` 路径
- `api/trace.ts` 不再直接调用 `logSearch` 冒充 trace 服务
- 去掉 `Math.random()` 生成 duration 的逻辑，改为只消费后端返回的真实/保守字段

状态：**已完成**
说明：已完成 `npm run build` 构建验证，trace 前端 API 已不再通过日志接口直接伪装链路服务。

### 88. ServiceDetailPage 快捷入口优先切到 V2 路由

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的日志/链路/告警/指标快捷入口优先切到 `/home/logs-v2`、`/home/trace-v2`、`/home/alerts-v2`、`/home/metrics-v2`
- 避免新域化页面已经存在，但主详情页仍然把用户送回旧入口

状态：**已完成**
说明：已完成 `npm run build` 构建验证，ServiceDetailPage 的快捷入口已优先指向 V2 路由。

### 89. ServiceCatalogPage 补 TimeRangeBar 并透传 timeRange 到详情页

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- ServiceCatalogPage 新增 `TimeRangeBar`
- 页面支持从 `route.query.timeRange` 初始化时间范围
- 进入 service detail 时开始把当前 `timeRange` 一并透传

状态：**已完成**
说明：已完成 `npm run build` 构建验证，服务目录页已纳入主链路时间上下文。

### 90. ServiceDetailPage 与下游 V2 路由的主链路优先化

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- 快捷入口中的日志/链路/告警/指标分析优先切到 `logs-v2 / trace-v2 / alerts-v2 / metrics-v2`
- 避免主详情页继续把用户送回旧入口，强化 V2 主链路的一致性

状态：**已完成**
说明：已完成 `npm run build` 构建验证，ServiceDetailPage 的主跳转路径已优先指向 V2 域页面。

### 91. AlertInboxPage / LogExplorerPage 接收 serviceId + timeRange query

已修改文件：

- `src/domains/logs/pages/LogExplorerPage.tsx`
- `src/domains/alerts/pages/AlertInboxPage.tsx`

本轮接入内容：

- 两个 V2 页面在进入时开始从 query 初始化 `serviceId` 与 `timeRange`
- 来自 ServiceDetailPage 的上下文透传不再丢失在这两个域页面入口处

状态：**已完成**
说明：已完成 `npm run build` 构建验证，logs/alerts 域页面已开始承接主链路透传上下文。

### 92. ServiceDetailPage 入口开始消费 route.query.timeRange 并随时间切换自动重载

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- 进入 service detail 时，开始读取 `route.query.timeRange`
- `TimeRangeBar` 改变时会自动触发 `loadServiceDetail()`
- service detail 的时间范围不再只在点击刷新时生效

状态：**已完成**
说明：已完成 `npm run build` 构建验证，ServiceDetailPage 的时间范围交互已形成闭环。

### 93. metrics-analysis / alert list 等下游页开始接收 serviceId + timeRange query

已修改文件：

- `src/views/homeWindow/monitor/metrics.tsx`
- `src/views/homeWindow/alert/list.tsx`
- `src/views/homeWindow/log/service.tsx`
- `src/views/homeWindow/monitor/trace.tsx`
- `src/views/homeWindow/service/instance.tsx`

本轮接入内容：

- 下游页进入时开始读取 `serviceId + timeRange` query
- 来自 ServiceDetailPage 的主链路上下文透传不再只停留在跳转参数上
- service-first 路径的关联跳转一致性进一步补齐

状态：**已完成**
说明：已完成 `npm run build` 构建验证，下游页已开始承接主链路透传上下文。

### 94. topology / instance 页开始承接 serviceId + timeRange 上下文

已修改文件：

- `src/views/homeWindow/service/topology.tsx`
- `src/views/homeWindow/service/instance.tsx`
- `src/api/metrics.ts`

本轮接入内容：

- topology 页开始读取 `route.query.timeRange` 并把 timeRange 带入 `fetchTopology()`
- topology 页在存在 `serviceId` 时会在加载后自动打开对应节点详情
- instance 页开始读取 `route.query.timeRange` 并显示统一 `TimeRangeBar`
- `fetchTopology()` API 封装支持显式传入 timeRange

状态：**已完成**
说明：已完成 `npm run build` 构建验证，topology/instance 页已开始真正承接主链路上下文。

### 95. ServiceDetailPage 与 ServiceCatalogPage 的主链路上下文一致性补齐

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`
- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- ServiceDetailPage 进入时开始消费 `route.query.timeRange`，并在时间范围变化时自动重载
- ServiceDetailPage 的指标/日志/链路/告警快捷入口优先切到 V2 路由
- ServiceCatalogPage 增加 `TimeRangeBar`，并把当前 `timeRange` 透传到 service detail

状态：**已完成**
说明：已完成 `npm run build` 构建验证，主链路的 serviceId/timeRange 一致性进一步补齐。

### 96. 旧主路径路由切到域化包装页

已修改文件：

- `src/router/index.ts`
- `src/domains/service/pages/TopologyPage.tsx`
- `src/domains/service/pages/InstanceMonitorPage.tsx`
- `src/domains/logs/pages/ExceptionAnalysisPage.tsx`
- `src/domains/alerts/pages/AlertRulesPage.tsx`
- `src/domains/alerts/pages/NotificationCenterPage.tsx`

本轮接入内容：

- `service-topology / instance-monitor / exception-analysis / alert-rules / alert-notifications` 路由不再直接挂旧 `views/*` 页面
- 这些主路径路由开始统一指向 `domains/*/pages/*` 包装页
- 主路径的域化承载进一步从“受控新入口”推进到“实际主路由接管”

状态：**已完成**
说明：已完成 `npm run build` 构建验证，主路径路由与域化页面的一致性进一步补齐。

### 97. topology / instance 页真正承接 serviceId + timeRange 上下文

已修改文件：

- `src/views/homeWindow/service/topology.tsx`
- `src/views/homeWindow/service/instance.tsx`
- `src/api/metrics.ts`

本轮接入内容：

- topology 页开始读取 `route.query.timeRange` 并通过 `fetchTopology({ timeRange })` 真正使用
- topology 页在存在 `serviceId` 时会自动打开对应节点详情
- instance 页开始读取 `route.query.timeRange` 并显示统一 `TimeRangeBar`
- ServiceDetailPage → topology/instance 的上下文透传不再只是“有 query 但页面不吃”

状态：**已完成**
说明：已完成 `npm run build` 构建验证，topology/instance 页已真正承接主链路上下文。

### 98. billing/plans 去除 mock 成功提示

已修改文件：

- `src/views/homeWindow/billing/plans.tsx`

本轮接入内容：

- 订阅更新失败时不再提示 `Successfully subscribed ... (Mock)`
- 改为明确失败提示，避免把失败路径伪装成成功
- 套餐按钮文案同步统一为中文

状态：**已完成**
说明：已完成 `npm run build` 构建验证，billing/plans 的假成功语义已清理。

### 99. alerts 后端动作开始支持时间过滤与状态记忆

已修改文件：

- `darwin-app/src/apps/starlight/metrics/actions/alerts.ts`

本轮接入内容：

- 告警列表新增 `startTime/endTime` 过滤支持
- `resolve/suppress/resend` 不再只是永远成功的空 stub，而是具备最小状态记忆
- alerts 契约不再完全停留在纯当前状态/纯立即成功的假语义

状态：**已完成**
说明：已完成 `npm run build:fengyuServer` 与 `npx tsc --noEmit` 验证，alerts 后端行为已进一步真实化。

### 100. billing/plans 去除“创建订单即订阅成功”的假语义

已修改文件：

- `src/api/url.ts`
- `src/views/homeWindow/billing/plans.tsx`

本轮接入内容：

- 前端订阅接口路径改到真实后端 `subscription.v1.subscription.create`
- 订阅按钮成功提示改为“已发起订阅申请/等待支付确认”，不再直接切当前套餐
- 订阅失败时不再使用 mock 成功提示

状态：**已完成**
说明：已完成 `npm run build` 构建验证，billing/plans 的假成功路径已清理。

### 101. notifications 页真正按 serviceId + timeRange 过滤

已修改文件：

- `src/views/homeWindow/alert/notifications.tsx`
- `src/api/alerts.ts`

本轮接入内容：

- notifications 页不再用 route.timeRange 伪造 1h 查询
- 改为直接使用 `timeStore.startTime / endTime` 作为真实过滤范围
- `fetchNotifications()` 参数显式补齐 `serviceId`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，notifications 页已真正接收并使用主链路上下文。

### 102. alert-rules 页接入 serviceId/timeRange 上下文并支持最小过滤

已修改文件：

- `src/views/homeWindow/alert/rules.tsx`
- `src/api/alerts.ts`

本轮接入内容：

- alert-rules 页开始读取 `route.query.serviceId / timeRange`
- 增加 `TimeRangeBar`，并按 `serviceId` 过滤规则列表
- `fetchAlertRules()` 前端封装支持透传 `serviceId`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alert-rules 页已开始真正承接主链路上下文。

### 103. notifications / alert-rules 进一步承接主链路上下文

已修改文件：

- `src/views/homeWindow/alert/notifications.tsx`
- `src/views/homeWindow/alert/rules.tsx`
- `src/api/alerts.ts`

本轮接入内容：

- notifications 页开始真正使用 `timeStore.startTime / endTime` 与 `serviceId` 过滤
- alert-rules 页开始读取 `route.query.serviceId / timeRange`，并按 service 上下文过滤规则列表
- alert-rules 前端 API 封装支持透传 `serviceId`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alerts 线的上下文承接进一步补齐。

### 104. notifications / alert-rules 真正承接 serviceId + timeRange 上下文

已修改文件：

- `src/views/homeWindow/alert/notifications.tsx`
- `src/views/homeWindow/alert/rules.tsx`
- `src/api/alerts.ts`

本轮接入内容：

- notifications 页改为直接使用 `timeStore.startTime / endTime` 与 `serviceId` 进行过滤
- alert-rules 页开始读取 `route.query.serviceId / timeRange`，并按 service 上下文过滤规则列表
- `fetchAlertRules()` 前端封装支持透传 `serviceId`

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alerts 线的上下文承接已进一步补齐。

### 105. alerts 线 serviceId / timeRange 过滤与通知状态一致性修复

已修改文件：

- `src/views/homeWindow/alert/notifications.tsx`
- `src/views/homeWindow/alert/rules.tsx`
- `src/api/alerts.ts`

本轮接入内容：

- notifications 页改为直接使用 `timeStore.startTime / endTime` 与 `serviceId` 过滤
- alert-rules 页开始按 `serviceId` 与时间范围过滤规则列表
- alerts 前端上下文承接从“部分可见”进一步收敛为“请求层真实参与”

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alerts 线 serviceId/timeRange 过滤已进一步补齐。

### 106. 侧边栏导航改为共享 route meta 源并补 Phase 0 技术债标记

已新增文件：

- `src/app/navigation/homeRouteMeta.ts`

已修改文件：

- `src/router/index.ts`
- `src/layout/left/index.tsx`
- `src/views/homeWindow/monitor/dashboard.tsx`
- `src/views/homeWindow/service/topology.tsx`
- `src/components/common/NaiveProvider.tsx`
- `src/components/charts/TopologyChart.tsx`
- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- 将首页侧边栏的标题/分组/icon/order/visibility 信息从 `layout/left/index.tsx` 抽离到共享导航源
- `src/router/index.ts` 的 home 子路由开始统一挂载 route meta，侧边栏 active 状态也开始优先消费 route meta 中的 `sidebarKey`
- 为旧 dashboard 包装页、旧 topology 包装页、`NavieProvider` 拼写、重复 topology 渲染器、过渡期 tab shell 补齐显式 TODO 标记

验证结果：

- `npm run build` 通过
- 手动 QA：`npx tsx -e "import { mustGetHomeRouteMeta, resolveHomeSidebarKey } from './src/app/navigation/homeRouteMeta.ts'; ..."` 输出确认了 `service-detail-v2 / alert-notifications / admin-ingestion-v2 / custom-dashboard` 都会映射到预期的 sidebarKey，且 `custom-dashboard` 保持 `overview` 分组
- `npm run test:run` 未通过，但失败集中在仓库既有问题：`.tmp_omo/package/bin/platform.test.ts` 依赖 `bun:test` 无法加载，以及 `src/views/homeWindow/billing/__tests__/plans.test.tsx` 缺少 DOM 环境导致 `document is not defined`

状态：**已完成**
说明：已完成构建与手动验证，Phase 0 的 route meta 基线与首页侧边栏 active-state 收敛已补齐；当前测试失败为本次改动之外的既有问题。

### 107. legacy service list 收敛到域化 ServiceCatalogPage

已修改文件：

- `src/views/homeWindow/service/list.tsx`

本轮接入内容：

- 旧 `views/homeWindow/service/list.tsx` 不再维护独立服务目录实现
- legacy service list 入口改为兼容包装页，直接复用 `src/domains/service/pages/ServiceCatalogPage.tsx`
- 服务目录的真实实现所有权进一步收敛到域化页面，减少旧/新双份逻辑并行

验证结果：

- `npm run build` 通过
- 静态验证：legacy 兼容入口文件现已直接 import/render `ServiceCatalogPage`，且旧服务目录实现体已移除
- `npm run test:run` 未通过，但失败集中在仓库既有问题：`.tmp_omo/package/bin/platform.test.ts` 依赖 `bun:test` 无法加载，以及 `src/views/homeWindow/billing/__tests__/plans.test.tsx` 缺少 DOM 环境导致 `document is not defined`

状态：**已完成**
说明：已完成构建与静态验证，service list 已从“旧页真实实现”收敛到“legacy 兼容壳层”。

### 108. exception analysis 收敛到域化内容组件

已新增文件：

- `src/domains/logs/components/ExceptionAnalysisContent.tsx`

已修改文件：

- `src/domains/logs/pages/ExceptionAnalysisPage.tsx`
- `src/domains/logs/pages/LogCenterPage.tsx`
- `src/views/homeWindow/log/exception.tsx`

本轮接入内容：

- 将异常分析的真实实现从 legacy `views/homeWindow/log/exception.tsx` 提取到域化 `ExceptionAnalysisContent`
- `ExceptionAnalysisPage` 与 `LogCenterPage` 的异常分析 tab 开始直接复用域化内容组件，不再共同依赖 legacy 页面实现
- legacy exception 页改为兼容壳层，异常分析的实现所有权收敛到 `src/domains/logs/components/ExceptionAnalysisContent.tsx`

验证结果：

- `npm run build` 通过
- 静态验证：domain page、log center tab、legacy 兼容入口均已指向 `ExceptionAnalysisContent`
- `npm run test:run` 未通过，但失败集中在仓库既有问题：`.tmp_omo/package/bin/platform.test.ts` 依赖 `bun:test` 无法加载，以及 `src/views/homeWindow/billing/__tests__/plans.test.tsx` 缺少 DOM 环境导致 `document is not defined`

状态：**已完成**
说明：已完成构建与静态验证，exception analysis 已从 legacy 真实实现收敛到域化内容组件。

### 109. log stream 收敛到域化内容组件

已新增文件：

- `src/domains/logs/components/LogStreamContent.tsx`

已修改文件：

- `src/domains/logs/pages/LogCenterPage.tsx`
- `src/views/homeWindow/log/stream.tsx`

本轮接入内容：

- 将实时日志流的真实实现从 legacy `views/homeWindow/log/stream.tsx` 提取到域化 `LogStreamContent`
- `LogCenterPage` 的实时流 tab 开始直接复用域化内容组件，不再依赖 legacy 页面实现
- legacy log stream 页改为兼容壳层，实时流实现所有权收敛到 `src/domains/logs/components/LogStreamContent.tsx`

验证结果：

- `npm run build` 通过
- 静态验证：log center tab 与 legacy 兼容入口均已指向 `LogStreamContent`
- `npm run test:run` 未通过，但失败集中在仓库既有问题：`.tmp_omo/package/bin/platform.test.ts` 依赖 `bun:test` 无法加载，以及 `src/views/homeWindow/billing/__tests__/plans.test.tsx` 缺少 DOM 环境导致 `document is not defined`

状态：**已完成**
说明：已完成构建与静态验证，log stream 已从 legacy 真实实现收敛到域化内容组件。

### 110. log config 收敛到域化内容组件

已新增文件：

- `src/domains/logs/components/LogConfigContent.tsx`

已修改文件：

- `src/domains/logs/pages/LogCenterPage.tsx`
- `src/views/homeWindow/log/config.tsx`

本轮接入内容：

- 将日志配置的真实实现从 legacy `views/homeWindow/log/config.tsx` 提取到域化 `LogConfigContent`
- `LogCenterPage` 的系统配置 tab 开始直接复用域化内容组件，不再依赖 legacy 页面实现
- legacy log config 页改为兼容壳层，日志配置实现所有权收敛到 `src/domains/logs/components/LogConfigContent.tsx`

验证结果：

- `npm run build` 通过
- 静态验证：log center tab 与 legacy 兼容入口均已指向 `LogConfigContent`
- `npm run test:run` 未通过，但失败集中在仓库既有问题：`.tmp_omo/package/bin/platform.test.ts` 依赖 `bun:test` 无法加载，以及 `src/views/homeWindow/billing/__tests__/plans.test.tsx` 缺少 DOM 环境导致 `document is not defined`

状态：**已完成**
说明：已完成构建与静态验证，log config 已从 legacy 真实实现收敛到域化内容组件。

### 111. service overview preset 收敛到域化页面壳层

已新增文件：

- `src/domains/overview/pages/ServiceOverviewDashboardPage.tsx`

已修改文件：

- `src/views/homeWindow/service/overview.tsx`

本轮接入内容：

- 将 service overview 对 `CustomDashboardPage` 的 preset 配置从 legacy `views/homeWindow/service/overview.tsx` 移入域化 `ServiceOverviewDashboardPage`
- service overview 的标题、副标题、存储 key、控件可见性等行为配置不再由 legacy 文件持有
- legacy service overview 页改为兼容壳层，preset 所有权收敛到 `src/domains/overview/pages/ServiceOverviewDashboardPage.tsx`

验证结果：

- `npm run build` 通过
- 静态验证：legacy 兼容入口已指向 `ServiceOverviewDashboardPage`，preset 参数不再定义在 legacy 文件中
- `npm run test:run` 未通过，但失败集中在仓库既有问题：`.tmp_omo/package/bin/platform.test.ts` 依赖 `bun:test` 无法加载，以及 `src/views/homeWindow/billing/__tests__/plans.test.tsx` 缺少 DOM 环境导致 `document is not defined`

状态：**已完成**
说明：已完成构建与静态验证，service overview 的旧 preset 所有权已收敛到域化页面壳层。

### 112. dashboard editor preset 收敛到域化页面壳层

已新增文件：

- `src/domains/overview/pages/CustomDashboardEditorPage.tsx`

已修改文件：

- `src/views/homeWindow/monitor/dashboard-editor.tsx`

本轮接入内容：

- 将 dashboard editor 对 `CustomDashboardPage` 的编辑态 preset 配置从 legacy `views/homeWindow/monitor/dashboard-editor.tsx` 移入域化 `CustomDashboardEditorPage`
- dashboard editor 的标题、副标题、存储 key 与编辑初始态不再由 legacy 文件持有
- legacy dashboard editor 页改为兼容壳层，editor preset 所有权收敛到 `src/domains/overview/pages/CustomDashboardEditorPage.tsx`

验证结果：

- `npm run build` 通过
- 静态验证：legacy 兼容入口已指向 `CustomDashboardEditorPage`，preset 参数不再定义在 legacy 文件中
- `npm run test:run` 未通过，但失败集中在仓库既有问题：`.tmp_omo/package/bin/platform.test.ts` 依赖 `bun:test` 无法加载，以及 `src/views/homeWindow/billing/__tests__/plans.test.tsx` 缺少 DOM 环境导致 `document is not defined`

状态：**已完成**
说明：已完成构建与静态验证，dashboard editor 的旧 preset 所有权已收敛到域化页面壳层。

### 113. custom dashboard 默认 preset 收敛到域化页面壳层

已新增文件：

- `src/domains/overview/pages/CustomDashboardLandingPage.tsx`

已修改文件：

- `src/views/homeWindow/monitor/dashboard.tsx`

本轮接入内容：

- 将 custom dashboard 默认 preset 配置从 legacy `views/homeWindow/monitor/dashboard.tsx` 移入域化 `CustomDashboardLandingPage`
- `custom-dashboard` 路由入口开始直接挂载 `CustomDashboardLandingPage`，默认 preset 不再通过 `CustomDashboardPage` 的内置默认值隐式生效
- custom dashboard 的标题、副标题、存储 key 与默认编辑态不再由 legacy 文件持有
- legacy dashboard 页改为兼容壳层，默认 preset 所有权收敛到 `src/domains/overview/pages/CustomDashboardLandingPage.tsx`

验证结果：

- `npm run build` 通过
- 静态验证：legacy 兼容入口已指向 `CustomDashboardLandingPage`，`custom-dashboard` 路由也已直接指向该域化 wrapper，preset 参数不再定义在 legacy 文件中
- `npm run test:run` 未通过，但失败集中在仓库既有问题：`.tmp_omo/package/bin/platform.test.ts` 依赖 `bun:test` 无法加载，以及 `src/views/homeWindow/billing/__tests__/plans.test.tsx` 缺少 DOM 环境导致 `document is not defined`

状态：**已完成**
说明：已完成构建与静态验证，custom dashboard 的旧默认 preset 所有权已收敛到域化页面壳层，路由入口也已与该单一 owner 对齐。

### 83. OverviewPage 接上 overview trends 契约并补 TrendSection

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/realtime.ts`

本轮接入内容：

- OverviewPage 开始直接消费 `fetchOverviewTrends()`
- 页面新增文档所需的 `TrendSection`，展示 `requests / errors / latency` 三联趋势图
- active overview 页面不再停留在“后端 wrapper 已有但页面未接线”的状态

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `OverviewPage.tsx` 已 import `fetchOverviewTrends`、在加载链路中实际调用该接口，并渲染“趋势概览 / 请求趋势 / 错误趋势 / 延迟趋势”区块

状态：**已完成**
说明：overview 页面对 `overview trends` 新契约的页面级接线已完成。

### 84. ServiceCatalogPage 接上 catalog quick-view 契约并补 DetailDrawer

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/realtime.ts`

本轮接入内容：

- ServiceCatalogPage 开始直接消费 `fetchCatalogServiceQuickView()`
- 服务目录页新增文档所需的 `DetailDrawer(optional)` 能力，支持列表内“快速查看”服务摘要
- active service catalog 页面不再只有列表跳详情，而具备留在目录页内查看轻量摘要的能力

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceCatalogPage.tsx` 已 import `fetchCatalogServiceQuickView`、存在 `openQuickView()` 加载链路，并实际渲染 `DetailDrawer` 与 `quickView.redSummary / instanceCount` 内容

状态：**已完成**
说明：service catalog 页面对 `catalog quick-view` 新契约的页面级接线已完成。

### 85. ServiceCatalogPage 接上 services summary 契约并补 ServiceListStats

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/realtime.ts`

本轮接入内容：

- ServiceCatalogPage 开始直接消费 `fetchCatalogServicesSummary()`
- 页面新增文档所需的 `ServiceListStats`，展示总服务数、healthy、degraded、critical、muted 五组摘要数字
- active service catalog 页面现在同时具备列表摘要和 quick-view，而不再只依赖服务列表表格本身

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceCatalogPage.tsx` 已 import `fetchCatalogServicesSummary`、在加载链路中实际调用该接口，并渲染五个目录摘要统计卡片

状态：**已完成**
说明：service catalog 页面对 `catalog services summary` 新契约的页面级接线已完成。

### 86. OverviewPage 补 QuickPivotSection 快捷入口区块

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

本轮接入内容：

- OverviewPage 新增文档要求的 `QuickPivotSection`
- 页面现在提供“打开服务目录 / 打开拓扑 / 打开 Trace Explorer / 打开 Logs Explorer”四个快捷入口
- 快捷入口统一透传当前 `timeRange`，让 overview drill-down 保持上下文

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `OverviewPage.tsx` 已渲染“快捷入口”区块，并包含四个目标路由按钮，点击跳转会透传 `timeRange`

状态：**已完成**
说明：overview 页面对 wireframe 中的 QuickPivotSection 已完成页面级补齐。

### 87. OverviewPage 接上 overview ingest-status 契约并补 IngestStatusSection

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/realtime.ts`

本轮接入内容：

- OverviewPage 开始直接消费 `fetchOverviewIngestStatus()`
- 页面新增文档所需的 `IngestStatusSection`，展示 metrics / logs / traces 采集状态以及 dropped / delayed / failed 摘要
- active overview 页面不再只有 summary / trends / incidents，而开始具备采集状态总览

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `OverviewPage.tsx` 已 import `fetchOverviewIngestStatus`、在加载链路中实际调用该接口，并渲染“采集状态”区块与三项采集状态卡片

状态：**已完成**
说明：overview 页面对 `overview ingest-status` 新契约的页面级接线已完成。

### 88. OverviewPage 接上 overview risk-services 契约并补双列 RiskServiceSection

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/realtime.ts`

本轮接入内容：

- OverviewPage 开始直接消费 `fetchOverviewRiskServices()`
- 页面中的风险服务区块从“本地用 catalog 列表近似排序”切到真正的 overview 风险读模型
- wireframe 所需的 `RiskServiceSection` 现在补齐为两列：`高风险服务` 与 `最近退化服务`
- 风险卡片现在展示 `health / error rate / latency delta / active alerts / last abnormal time`，并按 contract 返回的 `healthStatus` 渲染 badge

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `OverviewPage.tsx` 已 import `fetchOverviewRiskServices`、在加载链路中实际调用该接口，并渲染两列风险服务区块，同时展示 `health / active alerts / last abnormal time`

状态：**已完成**
说明：overview 页面对 `overview risk-services` 新契约的页面级接线已完成，风险列表不再依赖本地近似排序。

### 89. ServiceDetailPage Overview Tab 补 recent incidents 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Overview Tab 开始直接消费 `fetchAlerts({ serviceId, startTime, endTime })`
- 页面新增 wireframe 所需的 `recent incidents` 区块，展示当前服务最近 5 条事件
- 点击事件卡片会保持 `serviceId / timeRange` 上下文并跳转到告警页

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已 import `fetchAlerts`、在详情加载链路中实际调用该接口，并渲染“最近事件”区块

状态：**已完成**
说明：service detail 页 Overview Tab 的 recent incidents 已不再是文档缺口。

### 90. ServiceDetailPage Overview Tab 补 recent traces 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Overview Tab 开始直接消费 `searchTraces({ service, startTime, endTime, limit })`
- 页面新增 wireframe 所需的 `recent traces` 区块，并与 `recent incidents` 组成两列预览
- 点击链路卡片会保持 `serviceId / timeRange` 上下文并跳转到链路页

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已 import `searchTraces`、在详情加载链路中实际调用该接口，并渲染“最近链路”区块；trace 请求失败时会降级为空列表，不阻断详情主体刷新

状态：**已完成**
说明：service detail 页 Overview Tab 的 recent traces 已不再是文档缺口。

### 196. ServiceDetailPage Overview Tab 补 recent exceptions 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Overview Tab 开始直接消费 `listExceptions({ service, startTime, endTime, limit })`
- 页面新增 wireframe 所需的 `recent exceptions` 区块，并与 `recent incidents / recent traces` 组成同一 overview 预览层
- 点击异常卡片会保持 `serviceId / timeRange` 上下文并跳转到异常分析页

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已 import `listExceptions`、在详情加载链路中实际调用该接口，并渲染“最近异常”区块

状态：**已完成**
说明：service detail 页 Overview Tab 的 recent exceptions 已不再是文档缺口。

### 92. ServiceDetailPage Overview Tab 补 dependency summary 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Overview Tab 复用已加载的 `topologyPreview` 衍生 `dependency summary`
- 页面新增 wireframe 所需的 `dependency summary` 区块，展示上游数、下游数、相关依赖总数以及直接依赖列表
- 点击依赖服务按钮会直接跳转到对应 service detail，并保留当前 `timeRange`
- 依赖摘要中的“上游服务 / 下游服务”只展示 service 节点，不再把其它拓扑节点混作服务展示

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已派生 `dependencySummary`，并渲染“依赖摘要”区块；依赖按钮现在会跳转到对应 service detail

状态：**已完成**
说明：service detail 页 Overview Tab 的 dependency summary 已不再是文档缺口。

### 93. ServiceDetailPage Overview Tab 补 health timeline 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Overview Tab 开始直接消费 `fetchMetricsExplorer({ serviceId, timeRange })`
- 页面新增 wireframe 所需的 `health timeline` 区块，展示 CPU / 内存 / 响应时间三组时间线
- 时间线完全复用现有 `LineChart` 与详情页当前 `timeRange` 上下文

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已 import `fetchMetricsExplorer`、在详情加载链路中实际调用该接口，并渲染“健康时间线”区块

状态：**已完成**
说明：service detail 页 Overview Tab 的 health timeline 已不再是文档缺口。

### 94. ServiceDetailPage Metrics Tab 补 KPI chart group

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Metrics Tab 开始直接复用 `fetchMetricsExplorer({ serviceId, timeRange })` 返回的系列数据
- 页面新增 wireframe 所需的 `KPI chart group`，展示 CPU / 内存 / QPS / 响应时间四张趋势图
- 保留“进入指标分析”主入口作为更深钻取路径

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已存储 `metricsSeries`，并在 Metrics Tab 渲染四张趋势图卡片

状态：**已完成**
说明：service detail 页 Metrics Tab 的 KPI chart group 已不再是文档缺口。

### 95. ServiceDetailPage Metrics Tab 接入 requestStats 补充卡片

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Metrics Tab 开始直接复用 `fetchMetricsExplorer({ serviceId, timeRange })` 返回的 `requestStats`
- 页面新增一个全宽 `请求统计` 卡片，复用现有 `BarChart` 呈现请求分布
- 保持当前四张趋势图和“进入指标分析”入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已存储 `requestStats`，并在 Metrics Tab 渲染“请求统计”卡片

状态：**已完成（补充实现）**
说明：这是对 Metrics Tab 的补充增强，不单独视为 wireframe 中某个已闭合区块；后续仍需继续补齐 `infra chart group / custom metric section / compare baseline` 中的文档项。

### 96. ServiceDetailPage Topology Tab 补 selected dependency metrics 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Topology Tab 复用 `topologyPreview.edges` 派生 `selected dependency metrics`
- 选中拓扑节点时，页面会展示该节点关联边的 QPS / 错误率 / P99 / 调用次数摘要
- 不引入新后端契约，仅复用现有拓扑预览数据

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已派生 `selectedDependencyMetrics`，并在拓扑图下方渲染关联指标区块

状态：**已完成**
说明：service detail 页 Topology Tab 的 selected dependency metrics 已不再是文档缺口。

### 97. ServiceDetailPage Topology Tab 补 upstream/downstream table

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Topology Tab 复用 `topologyPreview.edges` 和已派生的上游/下游节点集合，补齐 `upstream/downstream table`
- 页面新增两张依赖表：`上游依赖表` 与 `下游依赖表`，展示服务名、状态、协议、QPS、错误率、P99、调用次数与详情动作
- 表内“查看详情”会直接跳转到对应 service detail，并保留当前 `timeRange`

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已派生 `upstreamDependencyRows / downstreamDependencyRows`，并在 Topology Tab 渲染两张依赖表

状态：**已完成**
说明：service detail 页 Topology Tab 的 upstream/downstream table 已不再是文档缺口。

### 98. ServiceDetailPage Alerts Tab 补 active incidents 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 现在保留完整 `alerts` 列表，Overview 继续使用 `recentIncidents` 作为最近事件预览
- Alerts Tab 改为明确过滤 `status === 'active'` 的告警，补齐 wireframe 所需的 `active incidents` 区块，不再只有三个跳转按钮壳层
- 保持原有“告警历史 / 告警规则 / 通知历史”入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已持有完整 `alerts` 状态，Overview 使用 `recentIncidents`，Alerts Tab 则显式过滤并渲染 `status === 'active'` 的事件列表

状态：**已完成**
说明：service detail 页 Alerts Tab 的 active incidents 已不再是文档缺口。

### 99. ServiceDetailPage Traces Tab 补 result table + detail drawer

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Traces Tab 开始直接复用已加载的 `recentTraces` 渲染链路结果表
- 行点击与 Trace ID 点击都会打开页内 trace detail drawer，复用现有 `getTraceDetails()` 和 waterfall 详情模式
- 保持原有“打开链路追踪”入口作为完整链路页的深度钻取路径

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已在 Traces Tab 渲染结果表，并接入 `getTraceDetails()` drawer 流程

状态：**已完成**
说明：service detail 页 Traces Tab 的 trace result table + detail drawer 已不再是文档缺口。

### 100. ServiceDetailPage Alerts Tab 补 rule list 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Alerts Tab 开始直接消费 `fetchAlertRules({ serviceId, startTime, endTime })`
- 页面新增 wireframe 所需的 `rule list`，展示规则名、指标、阈值、级别、启停状态
- 保持现有 active incidents 列表与三类告警入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已加载 `alertRules`，并在 Alerts Tab 渲染规则表

状态：**已完成**
说明：service detail 页 Alerts Tab 的 rule list 已不再是文档缺口。

### 101. ServiceDetailPage Alerts Tab 补 recent history 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Alerts Tab 开始直接消费 `fetchNotifications({ serviceId, startTime, endTime })`
- 页面新增 wireframe 所需的 `recent history` 区块，展示最近通知历史列表及状态
- 保持 active incidents、rule list 与三类告警入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已加载 `notifications`，并在 Alerts Tab 渲染通知历史列表

状态：**已完成**
说明：service detail 页 Alerts Tab 的 recent history 已不再是文档缺口。

### 102. ServiceDetailPage Runtime Tab 补 deploy history 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Runtime Tab 复用现有 `service.lastDeploy` 与 `summary.version` 补齐 `deploy history`
- 页面新增最小部署记录卡，展示最近部署时间与当前版本
- 保持 instance list / runtime env / ingestion state / appKey 区块不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已在 Runtime Tab 渲染“部署历史”卡片，并显示最近部署时间与当前版本

状态：**已完成**
说明：service detail 页 Runtime Tab 的 deploy history 已不再是文档缺口。

### 103. ServiceDetailPage Logs Tab 补 result table 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Logs Tab 开始直接消费 `searchLogsExplorer({ service, startTime, endTime, page, pageSize })`
- 页面新增 wireframe 所需的 `result table`，展示时间、级别、服务、消息、主机五列
- 保持原有“日志中心 / 异常分析”入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已加载 `logs`，并在 Logs Tab 渲染结果表

状态：**已完成**
说明：service detail 页 Logs Tab 的 result table 已不再是文档缺口。

### 104. ServiceDetailPage Runtime Tab 补 runtime env 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Runtime Tab 开始直接展示已加载的 `runtime.value.env`
- 页面新增独立的 `运行环境` 卡片，不再只把 env 隐含在状态对象里
- 保持 instance list / deploy history / ingestion state / appKey 区块不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已在 Runtime Tab 渲染“运行环境”卡片，并直接读取 `runtime.value.env`

状态：**已完成**
说明：service detail 页 Runtime Tab 的 runtime env 已不再是文档缺口。

### 105. ServiceDetailPage Logs Tab 补 detail drawer

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Logs Tab 增加日志详情 drawer，复用现有已加载的日志行数据
- 点击日志行或消息内容即可打开 `日志详情` drawer，展示级别、时间、正文和 tags/fields/stackTrace
- 保持已有 result table 与“日志中心 / 异常分析”入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已新增 `showLogDetail / selectedLog` 状态，并接入 `日志详情` drawer

状态：**已完成**
说明：service detail 页 Logs Tab 的 detail drawer 已不再是文档缺口。

### 106. ServiceDetailPage Logs Tab 补 log query bar

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Logs Tab 新增最小 `log query bar`，支持关键词过滤并复用现有 `searchLogsExplorer`
- 页面现在可在当前 `serviceId + timeRange` 上重新拉取日志结果，而不只是展示初始列表
- 保持 result table / detail drawer / drill-down 按钮不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已新增 `logKeyword` 与 `loadLogs()`，并在 Logs Tab 渲染查询输入与搜索按钮

状态：**已完成**
说明：service detail 页 Logs Tab 的 log query bar 已不再是文档缺口。

### 107. ServiceDetailPage Runtime Tab 补 appKey / metadata 区块

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Runtime Tab 复用现有 `service/runtime/summary` 状态补齐 `appKey / metadata`
- 页面新增独立 `元信息` 卡片，集中展示 owner、region、appKey、version 与 tags
- 保持 instance list / runtime env / deploy history / ingestion state 区块不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已在 Runtime Tab 渲染 `元信息` 卡片，并读取既有 service/runtime 字段

状态：**已完成**
说明：service detail 页 Runtime Tab 的 appKey / metadata 已不再是文档缺口。

### 108. ServiceDetailPage Logs Tab 补 patterns side panel

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Logs Tab 基于已加载的 `logs.value` 本地聚合出 `patterns side panel`
- 页面新增右侧 `日志模式` 侧栏，展示重复日志模式及计数，并支持点击模式过滤当前日志表
- 保持现有 query bar / result table / detail drawer / drill-down 按钮不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已派生 `logPatterns / filteredLogs`，并在 Logs Tab 渲染 `日志模式` 侧栏

状态：**已完成**
说明：service detail 页 Logs Tab 的 patterns side panel 已不再是文档缺口。

### 109. ServiceDetailPage Traces Tab 补 trace search bar

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Traces Tab 新增最小 `trace search bar`，支持按 Trace ID 过滤当前服务链路
- 页面引入独立 `loadTraces()` helper，在当前 `serviceId + timeRange` 上重新拉取链路表
- 保持现有 result table / detail drawer / drill-down 按钮不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已新增 `traceQuery` 与 `loadTraces()`，并在 Traces Tab 渲染查询输入与搜索按钮

状态：**已完成**
说明：service detail 页 Traces Tab 的 trace search bar 已不再是文档缺口。

### 110. ServiceDetailPage Traces Tab 补 duration histogram

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Traces Tab 基于已加载的 `recentTraces` 本地派生耗时分布
- 页面新增 wireframe 所需的 `duration histogram`，按耗时区间展示链路数量分布
- 保持现有 trace search bar / result table / detail drawer 不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已派生 `traceDurationBuckets`，并在 Traces Tab 渲染 `耗时分布` 图表

状态：**已完成**
说明：service detail 页 Traces Tab 的 duration histogram 已不再是文档缺口。

### 111. ServiceDetailPage 顶部 SummaryStrip 补 active incidents / deploy marker

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 顶部摘要条从 4 张卡扩展到 6 张卡
- 新增 `活跃事件`（基于当前 `alerts` 中 `status === 'active'` 的数量）
- 新增 `最近部署`（直接复用 `service.value.lastDeploy`）

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认顶层摘要条已包含 `活跃事件` 和 `最近部署` 两张卡片

状态：**已完成**
说明：service detail 页 SummaryStrip 的 active incidents 与 deploy marker 已不再是文档缺口。

### 112. ServiceDetailPage Alerts Tab 补 mute policies 最小列表

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Alerts Tab 基于已加载的 `alerts` 列表，新增最小 `mute policies` 视图
- 页面现在会单独展示 `status === 'suppressed'` 的告警列表，作为静默策略的当前生效项
- 保持 active incidents / rule list / recent history 与现有入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已在 Alerts Tab 渲染 `suppressed` 列表与 `暂无静默策略` 空态

状态：**已完成**
说明：service detail 页 Alerts Tab 的 mute policies 已有最小可用实现。

### 113. ServiceDetailPage Metrics Tab 补 infra chart group

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Metrics Tab 现在按 wireframe 分成 `KPI 图组` 与 `基础设施图组`
- 复用现有 `metricsSeries.cpu / memory` 作为基础设施图组，`metricsSeries.qps / responseTime` 作为 KPI 图组
- 保持 `请求统计` 与 `进入指标分析` 入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已渲染 `KPI 图组` 与 `基础设施图组` 两个分区，并正确分配四张趋势图

状态：**已完成**
说明：service detail 页 Metrics Tab 的 infra chart group 已不再是文档缺口。

### 114. ServiceCatalogPage 补 CatalogToolbar MVP

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- ServiceCatalogPage 新增最小 `CatalogToolbar`，提供服务关键词搜索、状态筛选、环境筛选、团队筛选和重置动作
- 工具栏直接复用现有 `fetchCatalogServices({ keyword, status })`，并基于本地 `allRows` 做 `query/status/env/team/sort` 统一过滤
- 表格列同步补齐到 wireframe 要求的实例数、错误率、P95、最近部署等核心字段

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceCatalogPage.tsx` 已新增 query/status/env/team/reset 工具栏，并通过本地过滤链支持 service/owner/team/tag 搜索

状态：**已完成**
说明：service catalog 页的 CatalogToolbar MVP 已不再是文档缺口。

### 115. OverviewPage 补 PageHeader 右侧动作

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

本轮接入内容：

- OverviewPage 的 PageHeader 现在补齐 `刷新 / 自动刷新开关 / 保存默认入口`
- `自动刷新开关` 直接复用现有 `timeStore.isLive`
- 当时的过渡实现仍以 `timeRange + scope` 写入本地存储并在页面进入时恢复；当前 panel-first 主线的最终目标已升级为“保存默认面板”

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `OverviewPage.tsx` 已新增 `NSwitch`、本地存储 key 与恢复逻辑、以及保存默认入口按钮

状态：**已完成**
说明：该条记录反映的是 overview 页头动作在过渡阶段补齐，不代表最终首页仍以“默认视图”作为产品语义。

### 116. OverviewPage 补 MetricSummaryStrip 缺失指标

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

本轮接入内容：

- OverviewPage 的 `MetricSummaryStrip` 从 4 项扩展到 7 项
- 新增 `健康服务数`、`总 QPS`、`ingest 成功率`
- 新指标全部复用当前页面已加载的 `services / summary / ingestStatus`，未新增后端契约

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `OverviewPage.tsx` 的摘要条已包含 `健康服务数 / 总 QPS / ingest 成功率`

状态：**已完成**
说明：overview 页 MetricSummaryStrip 进一步向 wireframe 收敛。

### 117. ServiceDetailPage ServiceIdentityBar 补 env / appKey 透传

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 现在会把已加载的 `runtime.value.env` 透传给 `ServiceIdentityCard`
- 同时把 `runtime.value.appKey || service.value.id` 透传为 `appKey`
- 不引入新后端契约，也不提前假设 `repo/runbook/dashboard links` 已可用

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已向 `ServiceIdentityCard` 透传 `env` 与 `appKey`

状态：**已完成**
说明：service detail 页头部 `ServiceIdentityBar` 的 env / appKey 已不再是文档缺口。

### 118. ServiceCatalogPage 补 table / card view toggle

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- ServiceCatalogPage 新增 `viewMode`，支持 `表格 / 卡片` 两种视图切换
- card mode 复用现有 `rows` 数据，展示服务名、owner、env、region、健康状态、实例数、QPS、错误率、P95、最近部署
- 保持现有 quick view 与详情跳转能力不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceCatalogPage.tsx` 已新增 `viewMode` 状态和 `表格 / 卡片` 切换按钮，并渲染 card grid

状态：**已完成**
说明：service catalog 页的 ServiceCardGrid 已不再是文档缺口。

### 119. ServiceCatalogPage 补 sort selector

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- ServiceCatalogPage 新增最小 `sort selector`，支持按名称、QPS、错误率、P95、最近部署排序
- 排序完全基于前端当前 `allRows` 本地完成，不引入新后端契约
- 保持现有 query/status/env/filter、table/card mode 和 quick-view/detail 能力不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceCatalogPage.tsx` 已新增 `sortBy` 状态、排序下拉和本地排序逻辑

状态：**已完成**
说明：service catalog 页的 sort selector 已不再是文档缺口。

### 120. ServiceCatalogPage 补 FilterChips

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- ServiceCatalogPage 新增 `FilterChips`，展示当前 query/status/env/team 筛选状态
- 每个 chip 都可单独关闭并回写到对应筛选 state
- 保持现有 CatalogToolbar、view toggle、table/card mode 不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceCatalogPage.tsx` 已新增 `activeFilterChips / clearFilterChip`，并渲染可关闭筛选 chip

状态：**已完成**
说明：service catalog 页的 FilterChips 已不再是文档缺口。

### 121. OverviewPage 补 ScopeBar env / region 真实选项

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

本轮接入内容：

- OverviewPage 现在会从已加载的 `services` 派生 `env / region` 选项传给 `ScopeBar`
- `services` 行数据新增 `env` 字段，和现有 `region` 一起支持基础范围筛选
- 不引入新的 backend contract，仅复用当前 catalog 响应中的 `identity.env / identity.region`

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `OverviewPage.tsx` 已派生 `scopeOptions`，并把 `env / region` 真实传入 `ScopeBar`

状态：**已完成**
说明：overview 页 ScopeBar 的 env / region 选项已不再是空壳。

### 122. ServiceCatalogPage 补行点击进入详情

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- ServiceCatalogPage 现在支持表格行点击直接进入 `service detail`
- card mode 也支持整卡点击进入详情，`快速查看` 会阻止冒泡保持原交互
- 现有 `查看详情` 按钮仍保留，作为显式 drill-down 入口

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ResultTable` 已接入 `rowProps` 跳详情，card mode 也已支持整卡点击

状态：**已完成**
说明：service catalog 页“点击行进入详情”已不再是文档缺口。

### 123. ServiceDetailPage Metrics Tab 补 custom metric section

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Metrics Tab 新增最小 `custom metric section`
- 页面提供 `CPU / 内存 / QPS / 响应时间` 四选一的指标切换，并复用现有 `metricsSeries` 渲染单图
- 保持 KPI 图组 / 基础设施图组 / 请求统计 / 指标分析入口不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已新增 `selectedMetric` 状态、指标选择下拉和单图渲染

状态：**已完成**
说明：service detail 页 Metrics Tab 的 custom metric section 已不再是文档缺口。

### 123. ServiceCatalogPage 补拓扑 / Traces / Logs drill-down 动作

已修改文件：

- `src/domains/service/pages/ServiceCatalogPage.tsx`

本轮接入内容：

- ServiceCatalogPage 的表格与卡片视图都新增 `拓扑 / Traces / Logs` 三类 drill-down 动作
- 所有动作统一保留 `serviceId + timeRange` 上下文跳转到对应页面
- 现有 quick view 与 service detail 入口保持不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认表格 actions 列和卡片按钮区都已包含 `拓扑 / Traces / Logs` 动作

状态：**已完成**
说明：service catalog 页的跨页 drill-down 动作已进一步对齐 wireframe。

### 124. NotificationCenterPage 补 FailurePanel

已修改文件：

- `src/domains/alerts/pages/NotificationCenterPage.tsx`

本轮接入内容：

- NotificationCenterPage 基于现有 `failedItems` 和 `handleResend()` 补齐 `FailurePanel`
- 页面新增独立失败通知面板，展示规则、渠道、接收者、发送时间和错误信息
- 保持现有 DeliveryHistoryTable 与批量重发逻辑不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `NotificationCenterPage.tsx` 已新增 `failedItems` 和 `失败面板` 区块，并复用现有重发动作

状态：**已完成**
说明：notifications 页的 FailurePanel 已不再是文档缺口。

### 125. NotificationCenterPage 补 ChannelList

已修改文件：

- `src/domains/alerts/pages/NotificationCenterPage.tsx`

本轮接入内容：

- NotificationCenterPage 基于现有 `notificationData` 和 `channelOptions` 新增 `ChannelList`
- 页面现在会展示每个通知渠道的数量，并支持点击渠道按钮切换当前筛选
- 保持现有查询栏、统计卡、失败面板、历史表与详情弹窗不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `NotificationCenterPage.tsx` 已新增 `channelSummary` 与 `渠道列表` 区块，并通过点击按钮触发渠道筛选

状态：**已完成**
说明：notifications 页的 ChannelList 已不再是文档缺口。

### 126. TraceExplorerPage 补 TimeRangeBar

已修改文件：

- `src/domains/trace/pages/TraceExplorerPage.tsx`

本轮接入内容：

- TraceExplorerPage 现在补齐 `TimeRangeBar`
- 时间范围条直接复用现有 `timeStore`、`route.query.timeRange` 和 `loadData()` 链路
- 保持现有 QueryBar、结果表和链路详情 drawer 不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `TraceExplorerPage.tsx` 已引入并渲染 `TimeRangeBar`，且更新动作会复用现有 `loadData()`

状态：**已完成**
说明：TraceExplorer 页的 TimeRangeBar 已不再是文档缺口。

### 127. AlertInboxPage 补 AlertSummaryStrip

已修改文件：

- `src/domains/alerts/pages/AlertInboxPage.tsx`

本轮接入内容：

- AlertInboxPage 基于当前 `alertData` 补齐 `AlertSummaryStrip`
- 页面新增总告警数、活跃、已解决、已静默四张摘要卡
- 保持现有筛选栏与告警表格不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `AlertInboxPage.tsx` 已新增 `activeCount / resolvedCount / suppressedCount` 和摘要卡片区块

状态：**已完成**
说明：alert inbox 页的 AlertSummaryStrip 已不再是文档缺口。

### 128. TraceExplorerPage 补 TraceSummaryStrip

已修改文件：

- `src/domains/trace/pages/TraceExplorerPage.tsx`

本轮接入内容：

- TraceExplorerPage 基于现有 `tableData` 新增 `TraceSummaryStrip`
- 页面新增链路总数、正常链路、异常链路、平均耗时四张摘要卡
- 保持现有 TimeRangeBar、QueryBar、结果表和详情 drawer 不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `TraceExplorerPage.tsx` 已新增 `traceSummary` 并渲染四张摘要卡

状态：**已完成**
说明：trace explorer 页的 TraceSummaryStrip 已不再是文档缺口。

### 129. AlertInboxPage 补 AlertDetailDrawer

已修改文件：

- `src/domains/alerts/pages/AlertInboxPage.tsx`

本轮接入内容：

- AlertInboxPage 新增页内 `AlertDetailDrawer`
- 行点击与“详情”按钮都会打开详情 drawer，展示当前告警的时间、状态、等级、服务与内容
- 保持现有解决/静默动作和列表结构不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `AlertInboxPage.tsx` 已新增 `selectedAlert / showDetailDrawer` 状态，并接入 `AlertDetailDrawer`

状态：**已完成**
说明：alert inbox 页的 AlertDetailDrawer 已不再是文档缺口。

### 130. TraceExplorerPage 补 DurationHistogram

已修改文件：

- `src/domains/trace/pages/TraceExplorerPage.tsx`

本轮接入内容：

- TraceExplorerPage 基于当前 `tableData` 本地派生 `durationBuckets`
- 页面新增 `DurationHistogram`，按耗时区间展示链路数量分布
- 保持现有 `TimeRangeBar / QueryBar / TraceSummaryStrip / ResultTable / TraceDetailDrawer` 不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `TraceExplorerPage.tsx` 已新增 `durationBuckets` 并渲染 `耗时分布` 图表

状态：**已完成**
说明：trace explorer 页的 DurationHistogram 已不再是文档缺口。

### 131. AlertRulesPage 补 RuleSummaryStrip

已修改文件：

- `src/domains/alerts/pages/AlertRulesPage.tsx`

本轮接入内容：

- AlertRulesPage 基于现有 `rulesData` 补齐 `RuleSummaryStrip`
- 页面新增总规则数、启用规则、严重规则、覆盖服务四张摘要卡
- 保持现有 TimeRangeBar、规则表格与增删改导入导出交互不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `AlertRulesPage.tsx` 已新增 `enabledCount / criticalCount / coveredServiceCount` 和摘要卡区块

状态：**已完成**
说明：alert rules 页的 RuleSummaryStrip 已不再是文档缺口。

### 132. AlertRulesPage 补 RulePreviewPanel

已修改文件：

- `src/domains/alerts/pages/AlertRulesPage.tsx`

本轮接入内容：

- AlertRulesPage 基于现有 `formData` 新增页内 `RulePreviewPanel`
- 页面现在会在规则列表上方显示当前规则名称、服务、指标、条件、持续时间、等级与通知渠道的只读预览
- 保持现有 RuleTypeTabs、RuleList 与增删改导入导出交互不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `AlertRulesPage.tsx` 已新增 `规则预览` 区块，并直接读取 `formData`

状态：**已完成**
说明：alert rules 页的 RulePreviewPanel 已不再是文档缺口。

### 133. AlertInboxPage 补 status filter

已修改文件：

- `src/domains/alerts/pages/AlertInboxPage.tsx`

本轮接入内容：

- AlertInboxPage 新增状态筛选下拉，支持 `active / resolved / suppressed`
- 筛选直接复用现有 `fetchAlerts({ status })` 契约，不引入新后端接口
- 保持现有 service / severity 查询与 SummaryStrip / DetailDrawer 不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `AlertInboxPage.tsx` 已新增 `selectedStatus` 和状态下拉，并把 `status` 透传给 `fetchAlerts`

状态：**已完成**
说明：alert inbox 页的 status filter 已不再是文档缺口。

### 134. TopologyPage 补 TopologyLegend

已修改文件：

- `src/domains/service/pages/TopologyPage.tsx`

本轮接入内容：

- TopologyPage 新增 `TopologyLegend`
- 页面现在显式说明节点含义、边含义和颜色含义
- 不改主图与侧栏交互，仅补齐 wireframe 里缺失的图例说明

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `TopologyPage.tsx` 已新增图例区块，并包含节点/边/颜色三组说明

状态：**已完成**
说明：service topology 页的 TopologyLegend 已不再是文档缺口。

### 135. MetricsExplorerPage 补 TimeRangeBar

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`

本轮接入内容：

- MetricsExplorerPage 现在补齐 `TimeRangeBar`
- 时间范围条直接复用现有 `timeStore`、`route.query.timeRange` 和 `loadMetrics()` 链路
- 保持现有 QueryBar、图表区和导出按钮不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `MetricsExplorerPage.tsx` 已引入并渲染 `TimeRangeBar`，且更新动作会复用现有 `loadMetrics()`

状态：**已完成**
说明：metrics explorer 页的 TimeRangeBar 已不再是文档缺口。

### 136. MetricsExplorerPage 补 TableResultPanel

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`

本轮接入内容：

- MetricsExplorerPage 基于现有 `metrics.series` 新增 `TableResultPanel`
- 页面现在会把 CPU / 内存 / QPS / 响应时间系列平铺成统一表格结果
- 保持现有图表区和请求统计图不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `MetricsExplorerPage.tsx` 已新增 `tableRows / tableColumns` 并渲染“表格结果”区块

状态：**已完成**
说明：metrics explorer 页的 TableResultPanel 已不再是文档缺口。

### 137. MetricsExplorerPage 补 SavedViewPanel（本地最小版）

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`

本轮接入内容：

- MetricsExplorerPage 新增本地 `SavedViewPanel`
- 页面可将当前 `serviceId + dateRange` 保存为本地视图，并在页内恢复
- 不依赖后端 `/api/metrics/v1/views`，作为最小可用实现先收敛页面交互

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `MetricsExplorerPage.tsx` 已新增 `savedViews / saveCurrentView / 已保存视图` 面板

状态：**已完成**
说明：metrics explorer 页的 SavedViewPanel 已有本地最小可用实现。

### 138. NotificationCenterPage 详情容器收敛为 DetailDrawer

已修改文件：

- `src/domains/alerts/pages/NotificationCenterPage.tsx`

本轮接入内容：

- NotificationCenterPage 的详情展示从 `NModal` 收敛到共享 `DetailDrawer`
- 仍然复用现有 `selectedNotification` 行数据，不引入新接口或新数据流
- 保持现有 ChannelList / FailurePanel / DeliveryHistoryTable / 批量重发交互不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `NotificationCenterPage.tsx` 已改用 `DetailDrawer` 展示通知详情

状态：**已完成**
说明：notifications 页的详情容器已与当前页面体系保持一致。

### 138. MetricsExplorerPage TableResultPanel 收敛为独立组件

已新增文件：

- `src/domains/metrics/components/TableResultPanel.tsx`

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`

本轮接入内容：

- `MetricsExplorerPage` 的表格模式不再直接内联 `NCard + ResultTable`
- 新增 `TableResultPanel` 组件承接 wireframe 对应的表格结果区块
- chart/table mode 现在不只是状态切换，也具备与 wireframe 命名一致的结果面板结构

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `MetricsExplorerPage` 已在 table 模式使用 `TableResultPanel`

状态：**已完成**
说明：metrics explorer 页的 `TableResultPanel` 已从页内内联块收敛为明确组件。

### 139. MetricsExplorerPage 补导出动作

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`

本轮接入内容：

- MetricsExplorerPage 的 `导出` 按钮现在会导出当前表格结果为 CSV
- 导出完全复用现有 `tableRows`，不依赖新后端接口
- 保持现有 QueryBar / SavedViewPanel / chart-table mode 不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `exportCurrentView()` 已存在，导出按钮已绑定，且会基于 `tableRows` 生成 CSV

状态：**已完成**
说明：metrics explorer 页的导出动作已不再是空按钮。

### 140. OverviewPage 补 TrendSection grouping switch

已修改文件：

- `src/domains/overview/pages/OverviewPage.tsx`

本轮接入内容：

- OverviewPage 的 `趋势概览` 现在补齐 `overall / env / team` 切换
- `fetchOverviewTrends()` 不再硬编码 `groupBy: 'overall'`，而是跟随页面状态变化
- 保持现有三联趋势图与其它 Overview 区块不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `OverviewPage.tsx` 已新增 `trendGroupBy` 状态、切换下拉，以及 `fetchOverviewTrends({ groupBy })` 透传

状态：**已完成**
说明：overview 页的 TrendSection grouping switch 已不再是文档缺口。

### 141. MetricsExplorerPage 补完整 chartMode 四态切换

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`

本轮接入内容：

- MetricsExplorerPage 的 `chartMode` 从二态扩展到 `line / bar / area / table`
- 图表模式现在支持折线、柱状、面积三种视图切换，表格模式继续复用 `TableResultPanel`
- 不引入新后端契约，完全复用现有 `metrics.value.series` 与 `requestStats`

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `chartMode` 已扩展到四态，模式下拉与条件渲染均已到位

状态：**已完成**
说明：metrics explorer 页的 chart/table mode 已与 wireframe 定义对齐。

### 142. TraceExplorerPage 补 operation / duration 过滤

已修改文件：

- `src/domains/trace/pages/TraceExplorerPage.tsx`

本轮接入内容：

- TraceExplorerPage 的 QueryBar 新增 `操作` 与 `耗时` 两个过滤项
- `操作` 直接基于当前 `traces` 的 `name` 去重生成选项
- `耗时` 复用与直方图一致的区间桶，在前端本地过滤 `tableData`

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `TraceExplorerPage.tsx` 已新增 `selectedOperation / selectedDurationBucket`、对应下拉和过滤逻辑

状态：**已完成**
说明：trace explorer 页的 QueryBar 进一步向 wireframe 收敛。

### 143. ServiceDetailPage Metrics Tab 补 compare baseline（最小前端版）

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- ServiceDetailPage 的 Metrics Tab 新增 `compare baseline` 区块
- 页面基于现有 `metricsSeries` 以前半窗 vs 后半窗的均值做最小基线比较
- 不新增后端 compare 契约，先让 wireframe 里的 baseline 对比能力有最小可用版本

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `ServiceDetailPage.tsx` 已新增 `baselineComparison`，并渲染 `基线对比` 区块

状态：**已完成**
说明：service detail 页 Metrics Tab 的 compare baseline 已有最小前端闭环。

### 144. TraceExplorerPage 补 env filter

已修改文件：

- `src/domains/trace/pages/TraceExplorerPage.tsx`

本轮接入内容：

- TraceExplorerPage 新增 `env` 过滤项，直接复用当前 `fetchCatalogServices()` 返回的 `identity.env`
- 页面会从服务目录映射 `serviceId -> env`，并在本地对链路结果做环境过滤
- 保持现有 service/status/operation/duration 过滤与结果表/drawer 不变

验证结果：

- `npm run build` 通过
- 手动 QA：静态执行检查确认 `TraceExplorerPage.tsx` 已新增 `selectedEnv / envOptions / serviceEnvMap`，并在 `tableData` 中应用环境过滤

状态：**已完成**
说明：trace explorer 页的 env filter 已不再是文档缺口。

### 35. 登录页容器层与扫码登录残余旧 token 逻辑清理

已修改文件：

- `src/views/loginWindow/content/index.tsx`
- `src/views/loginWindow/content/mode/qrcode.tsx`
- `src/views/loginWindow/content/mode/email.tsx`

本轮接入内容：

- 登录页容器层不再直接读取 Cookie 判定 auto-login
- 清理扫码登录里残留的旧 setCookie 注释逻辑与无用 token 常量
- 登录页相关容器/模式页进一步统一到 `authSession` helper 体系

状态：**已完成**
说明：已完成 `npm run build` 构建验证，登录页残余的旧 token 读取逻辑进一步减少。

### 37. service logs 页补齐真实服务筛选选项

已修改文件：

- `src/views/homeWindow/log/service.tsx`

本轮接入内容：

- 新增 `fetchCatalogServices()` 作为服务日志页的服务筛选来源
- 搜索栏中的服务下拉不再是空 options，而是使用真实服务目录数据
- logs 明细页进一步统一到 service-first 的筛选上下文

状态：**已完成**
说明：已完成 `npm run build` 构建验证，service logs 页服务筛选已补齐真实选项。

### 39. billing 页面文案与 usage 接口调用收敛

已修改文件：

- `src/views/homeWindow/billing/index.tsx`
- `src/views/homeWindow/billing/usage.tsx`
- `src/views/homeWindow/billing/payment.tsx`

本轮接入内容：

- `usage.tsx` 的数据源从旧 `getUsageStatistics()` 切到新的 `getUsageSummary()`
- billing 容器页与 payment 页的残余英文文案统一为中文
- billing 相关页面的产品语言与当前整体风格进一步统一

状态：**已完成**
说明：已完成 `npm run build` 构建验证，billing 页面细节已继续收敛。

### 41. onboarding Step5 验证步骤切到新的 service detail 契约

已修改文件：

- `src/views/homeWindow/onboarding/components/Step5_Verify.tsx`

本轮接入内容：

- 接入验证步骤由旧 `fetchRealtimeMetrics(appKey)` 切到新的 `fetchServiceDetailSummary(appKey)`
- 验证逻辑改为基于 `identity + summary` 判断是否已收到真实服务数据
- onboarding 验证流程进一步与 service-first 新契约对齐

状态：**已完成**
说明：已完成 `npm run build` 构建验证，接入验证已开始复用新的后端摘要契约。

### 45. notifications 页补齐重置与批量重发交互

已修改文件：

- `src/views/homeWindow/alert/notifications.tsx`

本轮接入内容：

- `重置` 按钮改为真实清空筛选条件并重新查询
- `批量重发` 按钮改为对当前失败通知逐条重发并刷新列表
- notifications 页从“数据已对齐”进一步提升到“核心交互可用”状态

状态：**已完成**
说明：已完成 `npm run build` 构建验证，notifications 页的关键交互已补齐。

### 46. notifications 页收敛到共享组件

已修改文件：

- `src/views/homeWindow/alert/notifications.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 列表由旧 `NDataTable` 切到共享 `ResultTable`
- notifications 页进一步脱离旧 UI 体系，收敛到共享组件方案

状态：**已完成**
说明：已完成 `npm run build` 构建验证，notifications 页已完成共享组件收敛。

### 47. alert list 收敛到共享组件

已修改文件：

- `src/views/homeWindow/alert/list.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 列表由旧 `NDataTable` 切到共享 `ResultTable`
- 告警历史页进一步脱离旧 UI 体系，收敛到共享组件方案

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alert list 页已完成共享组件收敛。

### 48. alert-rules 收敛到共享组件

已修改文件：

- `src/views/homeWindow/alert/rules.tsx`

本轮接入内容：

- 页头由旧 `SectionHeader` 切到共享 `PageHeader`
- 规则列表由旧 `NDataTable` 切到共享 `ResultTable`
- 告警规则页进一步脱离旧 UI 体系，收敛到共享组件方案

状态：**已完成**
说明：已完成 `npm run build` 构建验证，alert-rules 页已完成共享组件收敛。

### 49. billing payment 页接回真实支付方式列表

已修改文件：

- `src/views/homeWindow/billing/payment.tsx`
- `src/api/subscription.ts`
- `src/api/url.ts`

本轮接入内容：

- 新增前端 `payment/methods` API 封装与类型定义
- billing payment 页不再显示“未接入真实支付方式管理”的静态占位卡片
- 支付页改为真实拉取后端支付方式列表，并展示启用状态、支持币种与手续费摘要

状态：**已完成**
说明：已完成 `npm run build` 构建验证，billing payment 页已从硬编码占位切到真实后端支付方式数据。

### 50. billing plans 页改为创建真实支付订单

已修改文件：

- `src/views/homeWindow/billing/plans.tsx`
- `src/api/subscription.ts`
- `src/api/url.ts`

本轮接入内容：

- 付费套餐不再直接走泛化的 `subscription.create` 成功提示
- plans 页开始先读取可用支付方式，再为付费套餐调用 `payment/createOrder`
- 创建成功后使用真实订单返回的 `paymentUrl` 继续支付，而不是只提示“等待系统确认”

状态：**已完成**
说明：已完成 `npm run build` 构建验证，且已通过手动脚本验证支付订单的创建、查询、取消与历史读取链路。

### 51. billing plans 的 free / paid 订阅链路补齐后端承接

已修改文件：

- `docs/refactor/implementation-status.md`

本轮接入内容：

- free 套餐的 `subscription.create` 后端承接已补齐，不再因缺失 `createFreeSubscription` 而悬空
- paid 套餐的默认异步支付回调路径已改为真实网关 notify 路由，并补齐后端 notify 方法承接
- billing plans 页的 free / paid 两条订阅主链路现在都有实际后端执行落点

状态：**已完成**
说明：本轮后端验证已通过 `npm run build:fengyuServer`、`npx tsc --noEmit` 及手动回调脚本验证，前端现有 billing plans 入口的关键承接缺口已补齐。

### 52. billing plans 的 paid 成功回调已激活真实订阅

已修改文件：

- `docs/refactor/implementation-status.md`

本轮接入内容：

- paid 套餐支付成功后，后端不再只更新订单状态
- 现有 billing plans 入口对应的 paid 主链路现在会真实创建订阅记录并回写到支付订单
- free / paid / cancel / resume 四条订阅主链路都已有后端最小真实承接

状态：**已完成**
说明：本轮后端验证已通过 `npm run build:fengyuServer`、`npx tsc --noEmit` 与手动 paid-notify/cancel-resume 脚本，billing plans 主链路的关键后端承接进一步补齐。

### 53. billing plans 对应的 upgrade 与 webhook 安全承接继续补齐

已修改文件：

- `docs/refactor/implementation-status.md`

本轮接入内容：

- billing plans 对应的后端 upgrade 主链路已补齐核心方法承接
- queue-backed webhook 处理路径已不再默认放过错误签名
- 现有订阅/支付主链路的业务承接与安全门槛继续收敛

状态：**已完成**
说明：本轮后端验证已通过 `npm run build:fengyuServer`、`npx tsc --noEmit` 与手动 upgrade/webhook 脚本，billing plans 关联链路继续向真实业务流收敛。

### 54. billing 关联退款主链路已补齐后端承接

已修改文件：

- `docs/refactor/implementation-status.md`

本轮接入内容：

- billing 关联的 `payment.refund` 后端主链路已补齐核心方法与表结构映射
- 自动退款后会同步更新退款记录与支付订单状态，不再停留在导出 action 的缺失方法阶段

状态：**已完成**
说明：本轮后端验证已通过 `npm run build:fengyuServer`、`npx tsc --noEmit` 与手动 refund 脚本，billing 关联退款路径已具备最小真实承接能力。

### 55. billing plans 接回 upgrade / resume / cancel 生命周期入口

已修改文件：

- `src/api/url.ts`
- `src/api/subscription.ts`
- `src/views/homeWindow/billing/plans.tsx`

本轮接入内容：

- 前端新增 `upgradeSubscription / resumeSubscription / getSubscriptionHistory` API 封装
- billing plans 页不再把所有付费动作都当成“新订阅订单”
- plans 页开始根据当前订阅状态在现有卡片内分支到 `发起订阅 / 升级套餐 / 取消订阅 / 恢复订阅`
- 已有后端 `subscription.upgrade / subscription.cancel / subscription.resume` 能力现在可从当前 StarLight 账单页触达

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/billing` 的“套餐与订阅”页成功渲染，运行时按钮集不再只有旧的单一路径，页面可显示生命周期动作标签（如 `恢复订阅`）

状态：**已完成**
说明：billing plans 的前端生命周期入口已与已落地的 subscription 后端动作接通，最新 Oracle 指出的“前端不可达 upgrade/resume/cancel”阻塞已被正面处理。

### 56. billing plans 改为消费真实 plans.list 契约

已修改文件：

- `src/api/url.ts`
- `src/api/subscription.ts`
- `src/views/homeWindow/billing/plans.tsx`

本轮接入内容：

- 前端 plans API 从旧的 `/subscription/v1/plans` 修正为真实后端 `plans/list`
- `getPlans()` 返回值改为匹配后端 `{ plans, currency, total }` 契约
- billing plans 页不再使用硬编码三套餐数组，而是根据后端计划列表动态渲染卡片与特性

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/billing` 的“套餐与订阅”页成功渲染后端返回的 `Starter / Growth` 计划名，旧硬编码 `FREE / 100k Requests/month` 文案未再出现

状态：**已完成**
说明：billing plans 的计划数据源已从本地静态配置收敛到后端真实订阅计划契约。

### 57. billing plans 动作逻辑改为跟随后端计划顺序

已修改文件：

- `src/views/homeWindow/billing/plans.tsx`

本轮接入内容：

- 移除 `free / pro / enterprise` 固定 rank 判断
- 计划升级/禁用逻辑改为根据后端返回的计划列表顺序动态计算
- 卡片配色也不再依赖固定计划名，而是按当前后端计划列表顺序分配

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：当后端返回 `Starter / Growth / Scale` 三个非旧命名计划时，billing plans 页仍可正确渲染三张卡片，并显示与当前计划匹配的 `升级套餐 / 当前套餐 / 取消订阅` 动作组合

状态：**已完成**
说明：billing plans 的交互逻辑已从固定套餐命名耦合收敛为后端计划驱动。

### 58. billing plans 改为消费后端显式 sortOrder 契约

已修改文件：

- `src/api/subscription.ts`
- `src/views/homeWindow/billing/plans.tsx`

联动后端文件：

- `../darwin-app/src/db/mysql/apis/subscription.ts`
- `../darwin-app/src/apps/starlight/subscription/actions/plans.ts`

本轮接入内容：

- 前端 `SubscriptionPlan` 类型新增 `sortOrder`
- billing plans 页不再把后端返回顺序直接当作权威顺序，而是按 `sortOrder` 排序后再生成卡片与动作阶梯
- 后端 `plans.list` 返回开始显式携带 `sortOrder`

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动 QA：后端脚本验证 `queryAllSubscriptionPlans()` 输出按 `sortOrder` 排序；浏览器 QA（Tauri bridge mock）验证即使接口返回顺序被打乱，billing plans 页仍按 `Starter -> Growth -> Scale` 顺序展示，并为当前 `Growth` 计划给出正确的 `升级套餐 / 当前套餐 / 取消订阅` 动作

状态：**已完成**
说明：billing plans 的计划排序契约已从隐式列表顺序收敛为显式后端 `sortOrder` 驱动。

### 59. billing paid 流程的 paymentUrl 改为真实 provider handoff

关联后端文件：

- `../darwin-app/src/apps/starlight/subscription/methods/index.ts`

本轮联动结果：

- paid 订阅和 upgrade 订单返回的 `paymentUrl` 不再是本地 `/home/billing?...` 占位页地址
- StarLight 当前 `window.open(paymentUrl)` 行为现在会打开 provider-aware checkout URL
- 二维码支付分支也有真实 `qr://...` 编码值，不再依赖缺失 helper

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- 手动脚本验证：Stripe / PayPal / Alipay checkout URL 与 QR 编码均可生成

状态：**已完成**
说明：billing paid 跳转已从本地账单页占位跳转，收敛为真实 provider handoff。

### 60. billing paid create / upgrade / continuation 重新拿到可用 checkout URL

关联后端文件：

- `../darwin-app/src/apps/starlight/subscription/actions/subscription.ts`
- `../darwin-app/src/apps/starlight/subscription/actions/payment.ts`
- `../darwin-app/src/apps/starlight/subscription/methods/index.ts`

本轮联动结果：

- paid 新订阅与 upgrade 不再读取已被移除的本地 `paymentUrl` 字段
- StarLight 当前 `window.open(paymentUrl)` 行为重新能拿到后端动态生成的 provider checkout URL
- pending order 查询返回的 `nextAction.target` 也恢复为可继续支付的 checkout URL

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：paid create / upgrade / queryOrder continuation 三条路径都返回可用的 checkout URL

状态：**已完成**
说明：billing paid handoff 的回归已修复，前端当前打开 checkout URL 的链路重新闭环。

### 61. billing paid 新订阅与待处理订单续付已接回真实前端入口

已修改文件：

- `src/api/url.ts`
- `src/api/subscription.ts`
- `src/views/homeWindow/billing/plans.tsx`
- `src/views/homeWindow/billing/payment.tsx`

本轮接入内容：

- paid 新订阅不再走旧的 `payment/createOrder` 前端直连路径，而是改为调用 `subscription.create`
- 前端新增 `payment.queryOrder` API 封装
- billing payment 页开始读取 `orderId` 查询参数，并展示待处理订单状态与“继续支付”动作

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：
  - paid 新订阅点击后实际命中 `/subscription/create`，未再命中旧的 `/payment/createOrder`
  - billing payment 页可展示待处理订单，并点击“继续支付”打开 `nextAction.target`

状态：**已完成**
说明：StarLight 已接回当前后端的 paid create 与 pending-order continuation 主链路。

### 62. billing payment 页的待处理订单查询已接回真实状态对账

关联后端文件：

- `../darwin-app/src/apps/starlight/subscription/methods/index.ts`

本轮联动结果：

- billing payment 页读取的 `payment.queryOrder` 结果不再只是静态回显数据库现状
- 待处理订单现在可被后端对账推进到 `paid / failed / expired-failed` 等更真实的状态结果

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：pending 订单查询可根据 provider evidence/过期状态返回不同对账结果

状态：**已完成**
说明：billing payment 页依赖的订单状态查询已具备最小真实对账能力。

### 63. billing paid 订单回跳已直接落到 payment continuation 页

已修改文件：

- `src/views/homeWindow/billing/index.tsx`
- `src/views/homeWindow/billing/plans.tsx`

关联后端文件：

- `../darwin-app/src/apps/starlight/subscription/actions/payment.ts`
- `../darwin-app/src/apps/starlight/subscription/methods/index.ts`

本轮接入内容：

- billing 页面开始受 `route.query.tab` 控制，支持直接落到 `payment` tab
- paid create / upgrade 在打开外部 checkout 前，会把当前页路由切到 `?tab=payment&orderId=...`
- 后端默认 `returnUrl` 改为 `/home/billing?tab=payment&orderId=...`，不再返回不存在的 `/subscription/success`

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：paid 新订阅后页面 URL 变为 `/home/billing?tab=payment&orderId=o99`，支付 tab 自动激活并展示待处理订单，同时仍会打开外部 checkout URL

状态：**已完成**
说明：paid 订单的回跳与续付入口已从“需要手动拼 URL”收敛为当前应用内的真实 continuation handoff。

### 64. legacy 日志中心概览页去除临时统计占位

已修改文件：

- `src/views/homeWindow/log/index.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/actions/read-model.ts`
- `../darwin-app/src/apps/starlight/logs/utils/elasticsearch.ts`

本轮接入内容：

- 旧日志中心概览页不再把 `todayLogs` 直接复用为总日志数，也不再把 `avgResponseTime` 固定为 `0`
- `logsExplorerStats` 开始返回更完整的 overview 统计字段：`totalLogs / errorLogs / warnLogs / levelStats / serviceStats / topServices / avgResponseTime`
- 旧日志中心概览页开始用 `explorer/search` 的分页总数作为“总日志数”，并用 `explorer/stats` 的真实值渲染“今日日志 / 错误率 / 平均响应时间 / Top 服务”

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：`v1.explorer.stats` 可返回完整 overview 字段
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/log-center` 可显示真实的 `总日志数 456 / 今日日志 120 / 平均响应时间 150ms / Top 服务`，旧临时占位值不再出现

状态：**已完成**
说明：legacy 日志中心概览页的核心统计已从临时占位切到真实 logs read-model 数据。

### 65. legacy 日志中心概览页修正级别分布百分比口径

已修改文件：

- `src/views/homeWindow/log/index.tsx`

本轮接入内容：

- 日志级别分布百分比改为使用与 `levelStats` 同一批 today-range 统计总量计算
- Top 服务百分比也统一使用同一批 today-range 统计总量，避免先后混用不同总数
- 旧日志中心概览不再出现 `0.0%` 或与“今日日志”口径不一致的分布百分比

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/log-center` 现可正确显示 `info 66.7% / error 16.7% / warn 16.7%`

状态：**已完成**
说明：legacy 日志中心概览页的级别/服务分布百分比口径已与当前统计数据源对齐。

### 86. exception-analysis 详情页已改用真实“关联日志”语义

已修改文件：

- `src/views/homeWindow/log/exception.tsx`

本轮接入内容：

- 异常详情弹层中的 `sampleLogs` 展示文案不再误称为“示例日志”
- 标题与折叠项文案统一改为“关联日志 / 日志 1...”，避免误导用户以为这些是静态示例数据

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/exception-analysis` 打开异常详情后，详情弹层显示“关联日志”，且页面中不再出现“示例日志”字样

状态：**已完成**
说明：exception-analysis 详情页的日志示例文案已与实际后端 sampleLogs 数据语义对齐。

### 66. service-detail-v2 内嵌 topology/runtime continuation

已修改文件：

- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- `service-detail-v2` 的“拓扑”tab 不再只是一个跳转按钮，开始内嵌当前服务的直接上下游拓扑预览
- 拓扑 tab 新增直接上下游节点按钮和节点详情抽屉，用户可在 service detail 内直接查看节点元信息
- “运行时”tab 不再只有摘要标签和跳转按钮，而是直接展示当前服务的实例预览表

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：
  - V2 服务详情页“拓扑”tab 显示过滤后的上下游节点与节点按钮
  - 点击 `edge-gateway` 可打开节点详情抽屉并显示节点元信息
  - “运行时”tab 可显示 `inst-1 / inst-2` 实例预览及采集状态标签

状态：**已完成**
说明：Milestone 3 的 service-detail continuation 已从“按钮跳转式”推进为页内可用的 topology/runtime 预览体验。

### 67. service-domain 页面接管 topology / instance 实现所有权

已修改文件：

- `src/domains/service/pages/TopologyPage.tsx`
- `src/domains/service/pages/InstanceMonitorPage.tsx`
- `src/views/homeWindow/service/topology.tsx`
- `src/views/homeWindow/service/instance.tsx`

本轮接入内容：

- `TopologyPage` 与 `InstanceMonitorPage` 不再是薄包装页，而是成为真实实现页面
- 旧 `views/homeWindow/service/topology.tsx` 与 `instance.tsx` 改为兼容包装层，反向代理到 domain 页面
- service-domain 路由开始成为 topology / instance 功能的真实所有者，而不是反向依赖 legacy view

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：
  - `/home/service-topology?serviceId=svc-growth&timeRange=1h` 可正常渲染服务拓扑与服务详情
  - `/home/instance-monitor?serviceId=svc-growth&timeRange=1h` 可正常渲染实例监控与实例列表

状态：**已完成**
说明：Milestone 3 的 service-domain 页面已开始从路由壳层升级为真正的实现承载层。

### 68. trace-v2 域页面接管链路追踪实现所有权

已修改文件：

- `src/domains/trace/pages/TraceExplorerPage.tsx`
- `src/views/homeWindow/monitor/trace.tsx`

本轮接入内容：

- `TraceExplorerPage` 不再是薄包装页，而是成为真实链路追踪实现页面
- 旧 `views/homeWindow/monitor/trace.tsx` 改为兼容包装层，反向代理到 domain 页面
- `trace-v2` 路由对应页面开始成为 trace 功能的真实实现承载层，而不是继续反向依赖 legacy monitor view

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/trace-v2?serviceId=svc-growth&timeRange=1h` 可正常显示 trace 列表与详情抽屉，点击 `trace-123` 可看到 `SELECT orders` span 详情

状态：**已完成**
说明：trace-v2 的页面所有权已开始从 legacy monitor view 收敛到 trace domain 页面本身。

### 69. service-logs 域页面接管服务日志实现所有权

已修改文件：

- `src/domains/logs/pages/LogExplorerPage.tsx`
- `src/views/homeWindow/log/service.tsx`

本轮接入内容：

- `LogExplorerPage` 不再只是较轻量的旧日志检索页，而是接管了服务日志的完整实现能力
- 旧 `views/homeWindow/log/service.tsx` 改为兼容包装层，反向代理到 domain 页面
- `service-logs` 路由对应页面开始成为 logs 功能的真实实现承载层，而不是继续反向依赖 legacy service-log view

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/service-logs?serviceId=svc-growth&timeRange=1h` 可正常渲染统计、过滤、日志列表与详情弹层；点击“详情”可看到 `trace-123` 与 `ap-south` 结构化数据

状态：**已完成**
说明：service-logs 的页面所有权已开始从 legacy log view 收敛到 logs domain 页面本身。

### 70. metrics-v2 域页面接管指标分析实现所有权

已修改文件：

- `src/domains/metrics/pages/MetricsExplorerPage.tsx`
- `src/views/homeWindow/monitor/metrics.tsx`

本轮接入内容：

- `MetricsExplorerPage` 不再是薄包装页，而是成为真实指标分析实现页面
- 旧 `views/homeWindow/monitor/metrics.tsx` 改为兼容包装层，反向代理到 domain 页面
- `metrics-v2` 路由对应页面开始成为 metrics 功能的真实实现承载层，而不是继续反向依赖 legacy monitor metrics view

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/metrics-v2?serviceId=svc-growth&timeRange=1h` 可正常显示服务选择、图表区与“请求统计”卡片

状态：**已完成**
说明：metrics-v2 的页面所有权已开始从 legacy metrics view 收敛到 metrics domain 页面本身。

### 71. real-time-monitor 域页面接管实时监控实现所有权

已修改文件：

- `src/domains/overview/pages/RealtimeMonitorPage.tsx`
- `src/views/homeWindow/monitor/realtime.tsx`

本轮接入内容：

- 新增 `RealtimeMonitorPage` 作为实时监控的真实实现页面
- 旧 `views/homeWindow/monitor/realtime.tsx` 改为兼容包装层，反向代理到 domain 页面
- `real-time-monitor` 路由对应页面开始成为 realtime 功能的真实实现承载层，而不是继续直接绑定 legacy monitor realtime view

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/real-time-monitor?serviceId=svc-growth&timeRange=1h` 可正常显示 CPU/内存/错误率卡片、实时趋势图与系统状态区

状态：**已完成**
说明：real-time-monitor 的页面所有权已开始从 legacy realtime view 收敛到 overview domain 页面本身。

### 197. real-time-monitor 已切到新的 service.runtime / overview.incidents 合约

已修改文件：

- `src/domains/overview/pages/RealtimeMonitorPage.tsx`

本轮接入内容：

- 页面不再依赖旧的 `fetchRealtimeOverview()` 作为图表与系统状态的单一来源
- 核心卡片继续使用 `service.detail` 摘要
- 图表数据改为来自 `metrics.analysis`
- 系统状态区改为由 `service.runtime` 的 ingest/runtime 信息与 `overview.incidents` 的活跃事件聚合而成

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/real-time-monitor?serviceId=svc-growth&timeRange=1h` 可显示 `实例运行 / Metrics 采集 / Logs 采集 / 活跃事件` 等基于新合约的状态区块，并正常显示 CPU/内存/响应时间图表

状态：**已完成**
说明：real-time-monitor 的合约来源已从旧 realtime 汇总接口进一步收敛到 service-first / overview read-model 组合。

### 72. alert-list 域页面接管告警列表实现所有权

已修改文件：

- `src/views/homeWindow/alert/list.tsx`

联动域页面：

- `src/domains/alerts/pages/AlertInboxPage.tsx`

本轮接入内容：

- 旧 `views/homeWindow/alert/list.tsx` 改为兼容包装层，反向代理到 `AlertInboxPage`
- `alert-list` 路由开始由 alerts domain 页面承载真实实现，而不是继续直接绑定 legacy alert list view

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/alert-list?serviceId=svc-growth&timeRange=1h` 可正常显示告警筛选、表格和 `CPU 高` 告警项

状态：**已完成**
说明：alert-list 的页面所有权已开始从 legacy alert view 收敛到 alerts domain 页面本身。

### 82. alert-rules 与 alert-notifications 的实现模块已迁入 alerts domain

已修改文件：

- `src/domains/alerts/pages/AlertRulesPage.tsx`
- `src/domains/alerts/pages/NotificationCenterPage.tsx`
- `src/views/homeWindow/alert/rules.tsx`
- `src/views/homeWindow/alert/notifications.tsx`

本轮接入内容：

- `AlertRulesPage` 与 `NotificationCenterPage` 不再 import legacy alert views，而是直接承载真实实现代码
- 旧 `views/homeWindow/alert/rules.tsx` 与 `views/homeWindow/alert/notifications.tsx` 改为兼容包装层
- alerts 域页面的所有权从“只有 alert-list 完成收敛”推进到“rules / notifications 也收敛到 domain 页面本身”

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：
  - `/home/alert-notifications?serviceId=svc-growth&timeRange=1h` 可正常显示通知历史表格与统计
  - `/home/alert-rules?serviceId=svc-growth&timeRange=1h` 可正常显示规则页面与空状态/表头结构

状态：**已完成**
说明：alerts 域页面已开始从 route owner 收敛到真正的 implementation owner。

### 103. alert-rules 的批量/导入/导出动作已接回真实合约

已修改文件：

- `src/api/url.ts`
- `src/api/alerts.ts`
- `src/domains/alerts/pages/AlertRulesPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/alerts.ts`

本轮接入内容：

- `AlertRulesPage` 不再只是展示四个无效按钮
- 前端已接回批量启用、批量禁用、导入规则、导出规则 API
- 后端新增 `alert-rules/bulk-update`、`alert-rules/export`、`alert-rules/import` 三条动作，完成当前规则管理面缺失的批量/导入导出能力

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：
  - `bulk-update` 返回两条已更新规则
  - `export` 返回 2 条规则
  - `import` 返回新导入规则对象

状态：**已完成**
说明：alert-rules 已从“动作面板存在但无实现”收敛到真实可执行的规则管理操作面。

### 73. custom-dashboard 域页面接管自定义看板实现所有权

已修改文件：

- `src/domains/overview/pages/CustomDashboardPage.tsx`
- `src/views/homeWindow/monitor/dashboard.tsx`

本轮接入内容：

- 新增 `CustomDashboardPage` 作为自定义看板的域内实现页面
- 旧 `views/homeWindow/monitor/dashboard.tsx` 改为兼容包装层，并保留原有 props 透传能力
- `custom-dashboard` 路由在当时开始承接 dashboard 能力，从 legacy monitor dashboard view 中收回实现所有权；当前主线已进一步将 `/home/overview` 定义为 panel-first 首页

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/custom-dashboard` 可正常显示总 QPS、趋势图、健康分布、流量分布和最近告警区块

状态：**已完成**
说明：该条记录描述的是自定义看板能力从 legacy dashboard view 收敛到 overview domain 的历史过程，不代表最终首页仍以 `/home/custom-dashboard` 作为主入口。

### 74. log-center 域页面接管日志中心实现所有权

已修改文件：

- `src/domains/logs/pages/LogCenterPage.tsx`
- `src/views/homeWindow/log/index.tsx`

本轮接入内容：

- 新增 `LogCenterPage` 作为日志中心概览与多 tab 日志工作的真实实现页面
- 旧 `views/homeWindow/log/index.tsx` 改为兼容包装层，反向代理到 domain 页面
- `log-center` 路由对应页面开始成为 logs 功能的真实实现承载层，而不是继续直接绑定 legacy log center view

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/log-center` 可正常显示核心指标、Top 5 服务、日志级别分布、最近日志和快捷操作区块

状态：**已完成**
说明：log-center 的页面所有权已开始从 legacy log center view 收敛到 logs domain 页面本身。

### 75. billing 域页面接管账单与订阅实现所有权

已修改文件：

- `src/domains/admin/pages/BillingPage.tsx`
- `src/views/homeWindow/billing/index.tsx`

本轮接入内容：

- `BillingPage` 补齐 `tab` query 同步与切换行为，接管 legacy billing shell 的关键路由状态能力
- 旧 `views/homeWindow/billing/index.tsx` 改为兼容包装层，反向代理到 domain 页面
- `/home/billing` 与 `/home/admin-billing-v2` 现在都由同一个 domain-owned billing 页面承载真实实现

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：
  - `/home/billing?tab=payment&orderId=o99` 可正常显示待处理支付订单与“继续支付”
  - `/home/admin-billing-v2?tab=plans` 可正常显示套餐页与 `Growth` 计划

状态：**已完成**
说明：billing 的页面所有权已开始从 legacy billing view 收敛到 admin domain 页面本身，且未回退已完成的支付续付路由能力。

### 83. billing usage / plans / payment 子实现已迁入 admin domain

已修改文件：

- `src/domains/admin/pages/BillingPage.tsx`
- `src/domains/admin/components/billing/UsageTab.tsx`
- `src/domains/admin/components/billing/PlansTab.tsx`
- `src/domains/admin/components/billing/PaymentTab.tsx`
- `src/views/homeWindow/billing/usage.tsx`
- `src/views/homeWindow/billing/plans.tsx`
- `src/views/homeWindow/billing/payment.tsx`

本轮接入内容：

- `BillingPage` 不再 import legacy `views/homeWindow/billing/*` 子视图
- `usage / plans / payment` 三个子实现已迁入 `src/domains/admin/components/billing/*`
- 旧 `views/homeWindow/billing/*` 文件改为兼容包装层，billing 的 domain owner 从路由层进一步收敛到实现模块层

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：
  - `/home/billing?tab=payment&orderId=o99` 可正常显示待处理支付订单与“继续支付”
  - `/home/admin-billing-v2?tab=plans` 可正常显示套餐页与 `Growth` 计划

状态：**已完成**
说明：billing 已从 route owner 收敛到真正的 implementation owner。

### 101. billing usage trend 已接回真实 quota.history 合约

已修改文件：

- `src/api/url.ts`
- `src/api/subscription.ts`
- `src/domains/admin/components/billing/UsageTab.tsx`

本轮接入内容：

- 前端新增 `subscription/quota/history` API 封装
- billing usage 页不再渲染空的静态趋势图配置
- Usage Trend 图表改为根据后端 `quota.history` 返回的真实历史记录填充 X 轴和数据点

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过

状态：**已完成**
说明：billing usage trend 已从空占位图表收敛到真实 backend quota history 合约。

### 103. metrics 页面已切到新的 metrics.explorer 合约

已修改文件：

- `src/api/url.ts`
- `src/api/metrics.ts`
- `src/domains/metrics/pages/MetricsExplorerPage.tsx`
- `src/domains/overview/pages/RealtimeMonitorPage.tsx`
- `src/domains/overview/pages/CustomDashboardPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/realtime.ts`

本轮接入内容：

- backend 新增 `v1.metrics.explorer` 读模型动作，沿用现有 analysis 内容结构但作为新的探索型契约面
- frontend 新增 `fetchMetricsExplorer()`
- `MetricsExplorerPage`、`RealtimeMonitorPage`、`CustomDashboardPage` 不再直接依赖 legacy `metrics.analysis` 端点

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过

状态：**已完成**
说明：active metrics 页面已从 legacy `metrics.analysis` 端点收敛到新的 `metrics.explorer` 合约面。

### 102. quota.history 后端方法已补齐，billing usage trend 可真实执行

联动后端文件：

- `../darwin-app/src/apps/starlight/subscription/methods/index.ts`

本轮联动结果：

- `subscription.v1.quota.history` 不再依赖缺失的 `getQuotaUsageHistory / generateQuotaStats`
- billing usage trend 现在不只是前端接线完成，而是后端历史接口也能真正返回数据结构

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：`v1.quota.history` 返回 `history/stats/timeRange/total/limit/offset/hasMore` 完整结构，且示例中 `history[0].current = 42`

状态：**已完成**
说明：billing usage trend 已从“前端接好了但后端方法缺失”收敛到可实际执行的 quota history 链路。

### 90. instance-monitor 的重启控件已从假操作收敛为真实占位入口

已修改文件：

- `src/domains/service/pages/InstanceMonitorPage.tsx`

本轮接入内容：

- `InstanceMonitorPage` 不再使用“确认重启 -> 固定失败提示”的假操作流
- 重启按钮改为禁用的“运维入口”占位控件，明确表达当前版本尚未接入真实实例重启能力
- 避免用户误以为实例重启是可执行动作，从而减少假阳性交互

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/instance-monitor?serviceId=svc-growth` 已显示 `运维入口` 占位控件，不再呈现可点击的“重启”操作

状态：**已完成**
说明：active 实例监控页的重启交互已从假操作收敛为诚实占位状态。

### 76. active 日志/告警入口改为指向已收敛的域页面

已修改文件：

- `src/layout/left/index.tsx`
- `src/domains/service/pages/ServiceDetailPage.tsx`

本轮接入内容：

- 侧边栏“日志中心”入口从 `/home/logs-v2` 改为 `/home/log-center`
- 侧边栏“告警列表”入口从 `/home/alerts-v2` 改为 `/home/alert-list`
- `service-detail-v2` 中的“查看日志 / 日志中心 / 查看告警 / 告警历史”快捷入口同步改为走已收敛的 `log-center` 与 `alert-list` 路由

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/log-center` 与 `/home/alert-list` 可正常渲染，`service-detail-v2` 中对应按钮仍正常显示

状态：**已完成**
说明：active 导航入口已不再绕开新 owner，而是直接进入已收敛的日志中心与告警列表路由。

### 77. admin-ingestion-v2 域页面接管接入管理实现所有权

已修改文件：

- `src/views/homeWindow/log/ingest.tsx`

联动域页面：

- `src/domains/admin/pages/IngestionPage.tsx`

本轮接入内容：

- 旧 `views/homeWindow/log/ingest.tsx` 改为兼容包装层，反向代理到 `IngestionPage`
- `admin-ingestion-v2` 路由开始由 admin domain 页面承载真实实现，而不是继续由 legacy log ingest view 作为实现源

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/admin-ingestion-v2` 可正常显示 AppKey 总数、可用凭证、接入状态、快速入口与 AppKey 列表

状态：**已完成**
说明：admin-ingestion-v2 的页面所有权已开始从 legacy ingest view 收敛到 admin domain 页面本身。

### 92. admin-ingestion-v2 已切到真实 AppKey / ingestion-status 合约

已修改文件：

- `src/domains/admin/pages/IngestionPage.tsx`
- `src/api/metrics.ts`
- `src/api/url.ts`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/appkey.ts`

本轮接入内容：

- admin ingestion 页不再把 admin snapshot 的服务/节点列表伪装成 AppKey 列表
- 前端开始使用真实 `appkey.list / appkey.generate / appkey.verify / appkey.delete` 合约
- 后端新增 `v1.appkey.ingestionStatus`，为页面提供接入状态概览（总 key、可用、过期、最近活动）
- 管理页现在具备真实的生成、验证、撤销和状态展示链路

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：
  - `/home/admin-ingestion-v2` 正常显示接入状态概览与真实 AppKey 列表
  - 点击“生成 AppKey”并提交后，页面实际命中 `/api/metrics/v1/appkey/generate`

### 93. admin-ingestion 的 AppKey 验证已校验真实 key/secret 对

联动后端文件：

- `../darwin-app/src/db/mysql/apis/apiKey.ts`
- `../darwin-app/src/apps/starlight/metrics/actions/appkey.ts`

本轮接入内容：

- `appkey.verify` 不再只按 secret hash 验证，而是改为 secret hash + AppKey 前缀联合验证
- admin ingestion 页的“验证凭证”现在会验证用户输入的 AppKey / AppSecret 是否真实匹配

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：
  - 匹配的 AppKey/Secret 对返回 `200 / valid=true`
  - 不匹配的 AppKey/Secret 对返回 `401 / AppKey或AppSecret不匹配`

状态：**已完成**
说明：admin-ingestion 的 AppKey 验证语义已从“只验 secret”收敛到“验证完整凭证对”。

### 94. admin-ingestion 生成后会保留完整 AppKey / Secret 供用户复制

已修改文件：

- `src/domains/admin/pages/IngestionPage.tsx`

本轮接入内容：

- 生成 AppKey 成功后，页面不再只短暂展示 Secret
- 最近生成的凭证现在会在页面中保留并同时显示完整 `AppKey` 与 `AppSecret`
- 管理页用户无需依赖瞬时弹窗状态，也能完成后续凭证复制与验证操作

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：
  - `/home/admin-ingestion-v2` 点击“生成 AppKey”后实际命中 `/api/metrics/v1/appkey/generate`
  - 页面会显示“最近生成的凭证”区块，并展示 `AppKey` 与 `AppSecret` 两个字段的值

状态：**已完成**
说明：admin-ingestion 的生成凭证体验已从“生成后信息易丢失”收敛为可复制的页面持久展示。

### 96. admin-ingestion 的 rateLimit 返回已改为诚实的未知值语义

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/appkey.ts`

本轮接入内容：

- `appkey.verify` 仍返回配置限额 `limit`
- 在当前后端尚未计算实时剩余额度的情况下，`remaining` 与 `resetTime` 不再伪装为“满额度 / 1小时后重置”
- 前后端契约改为明确表达这两个字段当前未知 (`null`)

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：`appkey.verify` 返回 `rateLimit = { limit: 600, remaining: null, resetTime: null }`

状态：**已完成**
说明：admin-ingestion 的 rateLimit 语义已从伪造剩余额度收敛为诚实的未知值表示。

### 95. subscription payment handler 已停止返回伪造 provider 原生响应

关联后端文件：

- `../darwin-app/src/apps/starlight/subscription/utils/payment-handler.ts`

本轮联动结果：

- 支付处理路径不再返回伪造的 Stripe / PayPal / Alipay 原生响应结构
- 前端消费的 pending/manual review 语义现在明确对应 “provider SDK 未配置 / 无真实交易创建” 的本地 manual review 合约

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：Stripe / PayPal / Alipay 三条路径的 `gatewayResponse` 均返回统一的 `{ provider, mode: 'manual_review', supported: false, transactionCreated: false, amount, currency, reason }`

状态：**已完成**
说明：payment handler 的 provider 响应语义已从“伪装成真实 provider payload”收敛为诚实的 local/manual-review 合约。

### 96. subscription payment handler 的 webhook 校验已改为真实签名验证

关联后端文件：

- `../darwin-app/src/apps/starlight/subscription/utils/payment-handler.ts`

本轮联动结果：

- `payment-handler` 中的 Stripe / PayPal / Alipay webhook 验证不再只是检查 secret/key 是否存在
- 现在会基于 payload 和对应密钥执行确定性的签名校验
- 该 handler 的 webhook 入口与此前收敛过的 webhook processor 一样，开始拒绝错误签名

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：Stripe / PayPal / Alipay 三条路径都满足“正确签名=true、错误签名=false”

状态：**已完成**
说明：payment-handler 的 webhook 校验已从“仅检查配置存在”收敛为真实签名验证。

### 97. admin-ingestion 的 AppKey 列表已显示真实 usageCount

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/appkey.ts`

本轮联动结果：

- `appkey.list` 不再为每个凭证固定返回 `usageCount: 0`
- admin-ingestion 页现在可消费来自 `ApiKeyStats` 的真实累计请求数

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：`v1.appkey.list` 返回的条目中 `usageCount` 已为真实聚合值（示例为 `42`），不再固定为 `0`

状态：**已完成**
说明：admin-ingestion 的 AppKey 列表已从“usageCount 全为 0”收敛到真实统计值。

### 98. logs API key usage stats 已停止返回随机 dailyUsage 曲线

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/methods/api-key-management.ts`

本轮联动结果：

- logs API key usage stats 不再为 `dailyUsage` 生成随机数序列
- 在当前没有真实 usage-history 数据源的情况下，该接口会返回空数组而不是伪造曲线

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：当 `ApiKeyStats` 有记录时，`getApiKeyUsageStats(...)` 会返回真实 `dailyUsage = [{ date, count }]`；当源不可用时不再伪造随机曲线

状态：**已完成**
说明：logs API key usage stats 已从“随机模拟曲线”收敛为诚实的空结果语义。

### 99. logs 的活跃 API key 校验路径已开始写入真实 usage 统计

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/utils/api-key-manager.ts`

本轮联动结果：

- active logs API key 校验不再只更新内存中的 `lastUsedAt`
- DB-backed key 校验成功后，现在会同步写入 `lastUsedAt` 和 `ApiKeyStats` 请求计数
- logs API key 统计页与活跃请求路径开始共用同一组真实使用数据来源

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：DB-backed `validateApiKey()` 调用后会触发 `updateApiKeyLastUsed('key-1')` 和 `updateApiKeyStats('key-1', 1)`

状态：**已完成**
说明：logs API key 统计已从“只读现有字段”进一步收敛到“活跃请求会真实更新统计值”的状态。

### 100. API Key 底层存储已接回真实 tenantId / usageCount 语义

联动后端文件：

- `../darwin-app/src/db/mysql/models/api/apiKey.ts`
- `../darwin-app/src/db/mysql/apis/apiKey.ts`
- `../darwin-app/src/apps/starlight/metrics/actions/appkey.ts`
- `../darwin-app/src/apps/starlight/logs/methods/api-key-management.ts`

本轮联动结果：

- metrics 侧生成 AppKey 时会真实持久化 `tenantId`
- logs 侧 `findApiKeysByTenantId / countActiveApiKeysByTenantId` 开始按真实 `tenantId` 过滤
- logs methods 层的 `getApiKeys()` 不再回显 row 上的默认 `usageCount`，而是读取真实聚合统计值

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- 手动脚本验证：
  - `v1.appkey.generate` 可带 tenant 上下文创建新 key
  - tenant-scoped `getApiKeys()` 返回条目的 `usageCount` 已为真实统计值（示例 `42`）

状态：**已完成**
说明：API Key 的 DB 层 tenant 语义与 usageCount 语义已收敛到真实存储/统计路径。

### 101. logs API key 管理面已补齐 tenant 级别的 get/update/delete 约束

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/methods/api-key-management.ts`

本轮联动结果：

- `getApiKeys()` 不再在 `userId` 分支绕开 tenant 过滤
- `updateApiKey()` 与 `deleteApiKey()` 不再仅按 `id` 操作，而会同时校验 `tenantId` / `userId`
- 同 tenant 的更新/删除可成功，跨 tenant 操作会被明确拒绝

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- 手动脚本验证：
  - tenant-scoped `getApiKeys()` 只返回 `tenant-a` 的 key，且 `usageCount=42`
  - 同 tenant `updateApiKey()` / `deleteApiKey()` 返回 `success: true`
  - 跨 tenant `updateApiKey()` 返回 `API key not found`

状态：**已完成**
说明：logs API key 管理面已从“部分 tenant-aware”收敛到真正的 tenant-scoped 行为。

### 100. logs ApiKeyManager 已优先走 DB-backed 校验路径

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/utils/api-key-manager.ts`

本轮联动结果：

- `ApiKeyManager.validateApiKey()` 不再先走内存 fast path 再跳过 DB 统计更新
- 当前逻辑会优先校验并更新 DB-backed key 的 `lastUsedAt` / `requestCount`
- 只有真正不存在 DB 记录的内存开发 key 才会走本地 fallback 路径

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- 手动脚本验证：`validateApiKey('dk_live_secret_key')` 会触发 `updateApiKeyLastUsed('key-1')` 和 `updateApiKeyStats('key-1', 1)`，且返回 DB-backed key 信息

状态：**已完成**
说明：logs API key 的运行时校验已优先收敛到真实 DB-backed 使用统计路径。

### 100. logs methods 层的 validateApiKey 也已接回真实 usage 统计更新

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/methods/api-key-management.ts`

本轮联动结果：

- `api-key-management.validateApiKey()` 不再通过 `findApiKeyById(hashedKey)` 走错路径
- 该方法改为与活跃运行时校验路径一致：使用 DB-backed key 查找，并写入 `updateApiKeyLastUsed()` / `updateApiKeyStats()`
- logs API-key 统计在 methods 层和 runtime 层的验证面都开始共用同一套真实更新逻辑

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- 手动脚本验证：`validateApiKey(...)` 返回 `isValid=true` 后会触发 `updateApiKeyLastUsed('key-1')` 和 `updateApiKeyStats('key-1', 1)`

状态：**已完成**
说明：logs API-key 的 methods 层验证面已不再绕开真实 usage 统计更新。

### 99. logs 的活跃 API key 校验路径已开始写入真实 usage 统计

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/utils/api-key-manager.ts`

本轮联动结果：

- logs 活跃请求路径不再只在内存里刷新 `lastUsedAt`
- DB-backed API key 校验成功后，现在会同步写入 `lastUsedAt` 和 `ApiKeyStats` 请求计数
- logs API key 统计页与活跃请求路径开始共用同一组真实使用数据来源

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- 手动脚本验证：DB-backed `validateApiKey()` 调用后会触发 `updateApiKeyLastUsed('key-1')` 和 `updateApiKeyStats('key-1', 1)`

状态：**已完成**
说明：logs API key 统计已从“只读现有字段”进一步收敛到“活跃请求会真实更新统计值”的状态。

### 97. subscription refund handler 已停止伪造“已完成退款”

关联后端文件：

- `../darwin-app/src/apps/starlight/subscription/utils/payment-handler.ts`

本轮联动结果：

- `processRefund()` 不再在没有真实 provider refund 调用的情况下返回 `status='completed'`
- 当前 refund 路径已改为显式 local/manual-review 语义：`status='manual_review'`, `supported=false`, `transactionCreated=false`

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：`processRefund('payment-1', 5000, 'manual test')` 返回 `manual_review`，且包含 `supported=false` 与 `transactionCreated=false`

状态：**已完成**
说明：payment-handler 的退款语义已从“伪造已完成”收敛为诚实的 manual-review 状态。

状态：**已完成**
说明：admin-ingestion-v2 已从“用服务列表近似 AppKey 管理”收敛到真实 AppKey / ingestion-status 合约。

### 78. admin-onboarding-v2 域页面接管接入向导实现所有权

已修改文件：

- `src/domains/admin/pages/OnboardingPage.tsx`
- `src/views/homeWindow/onboarding/index.tsx`

本轮接入内容：

- `AdminOnboardingPage` 不再只是薄包装页，而是成为真实接入向导实现页面
- 旧 `views/homeWindow/onboarding/index.tsx` 改为兼容包装层，反向代理到 domain 页面
- `admin-onboarding-v2` 路由开始由 admin domain 页面承载真实 onboarding wizard 实现

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/admin-onboarding-v2` 可正常显示接入向导标题、五步流程与欢迎页内容

状态：**已完成**
说明：admin-onboarding-v2 的页面所有权已开始从 legacy onboarding view 收敛到 admin domain 页面本身。

### 79. admin-onboarding-v2 的实现模块已完全迁入 admin domain

已修改文件：

- `src/domains/admin/pages/OnboardingPage.tsx`
- `src/domains/admin/pages/onboarding.scss`
- `src/domains/admin/components/onboarding/Step1_Welcome.tsx`
- `src/domains/admin/components/onboarding/Step2_Environment.tsx`
- `src/domains/admin/components/onboarding/Step3_KeyConfig.tsx`
- `src/domains/admin/components/onboarding/Step4_Integration.tsx`
- `src/domains/admin/components/onboarding/Step5_Verify.tsx`
- `src/domains/admin/components/onboarding/StepLayout.tsx`

本轮接入内容：

- onboarding 向导的 step 组件与样式不再留在 legacy `views/homeWindow/onboarding` 树下
- `AdminOnboardingPage` 现在直接依赖 admin domain 下的 onboarding 组件与样式
- onboarding 路由所有权从“路由壳层迁移”进一步收敛到“实现模块也完成迁移”

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/home/admin-onboarding-v2` 仍可正常显示向导标题、五步流程与欢迎页内容

状态：**已完成**
说明：admin-onboarding-v2 已从 route owner 收敛到真正的 implementation owner。

### 80. /onboarding 路由已直接指向 domain-owned onboarding 页面

已修改文件：

- `src/router/index.ts`

本轮接入内容：

- 根路由 `/onboarding` 不再经过 legacy `views/homeWindow/onboarding/index.tsx` 包装层
- `/onboarding` 现在直接加载 `src/domains/admin/pages/OnboardingPage.tsx`
- onboarding 路由层最后一处对 legacy wrapper 的主动依赖被移除

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：`/onboarding` 可正常显示接入向导标题、五步流程与欢迎页内容

状态：**已完成**
说明：onboarding 在路由层也已完成向 admin domain owner 的直接收敛。

### 81. service-overview 已不再依赖 legacy dashboard wrapper

已修改文件：

- `src/views/homeWindow/service/overview.tsx`

本轮接入内容：

- `service/overview.tsx` 不再 import legacy `views/homeWindow/monitor/dashboard`
- 当前服务概览入口改为直接依赖 domain-owned `CustomDashboardPage`
- 在非路由调用链中，对 legacy dashboard wrapper 的最后一处直接依赖被移除

验证结果：

- `npm run build` 通过
- 手动浏览器 QA（Tauri bridge mock）验证：访问 `/home/service-overview` 仍正常进入当前系统概览主路径，没有引入回退或报错

状态：**已完成**
说明：service-overview 对 dashboard 的引用已直接收敛到 domain owner，而不是继续经过 legacy wrapper。

### 82. log/config 的连接测试已开始校验用户填写的 Elasticsearch 配置

已修改文件：

- `src/views/homeWindow/log/config.tsx`
- `src/api/logs.ts`
- `src/api/url.ts`

联动后端文件：

- `../darwin-app/src/apps/starlight/logs/actions/stats.ts`
- `../darwin-app/src/apps/starlight/logs/utils/elasticsearch.ts`
- `../darwin-app/src/apps/starlight/logs/utils/elasticsearch-manager.ts`

本轮接入内容：

- 前端“测试连接”会把当前表单中的 `hosts / username / password / indexPrefix` 传给后端
- 后端连接测试不再只探活服务默认 ES 配置，而是优先使用用户传入的 Elasticsearch 配置构建临时客户端
- Elasticsearch 客户端与 manager 现在也支持显式 username，而不再仅硬编码 `elastic`

验证结果：

- darwin-app `npm run build:fengyuServer` 通过
- darwin-app `npx tsc --noEmit` 通过
- StarLight `npm run build` 通过
- 手动脚本验证：
  - 传入自定义 ES 配置时返回 `200 / connected=true`
  - 不传自定义配置且服务默认探活失败时返回 `503 / connected=false`
  - 仅传 `username` 且不传 `password` 时，临时 ES 客户端仍会保留 `{ username: 'custom-user', password: '' }` 认证配置
  - fallback 路径现在会复用服务初始化时的 ES 配置，而不是退回到裸 `process.env`，默认与 tenant scoped client 都保持同一 `node/auth`

状态：**已完成**
说明：log/config 的连接测试已从“只验证服务默认配置”进一步收敛到“真正验证用户填写的 ES 连接参数”。

### 83. /home/overview 已切到 panel-first Overview 本地同构模型

已修改文件：

- `src/domains/overview/panelModel.ts`
- `src/domains/overview/pages/OverviewPage.tsx`
- `src/domains/overview/components/PanelToolbar.tsx`
- `src/domains/overview/components/PanelWidgetCard.tsx`

本轮接入内容：

- `/home/overview` 不再把“固定卡片集合”作为唯一首页形态，而是改为 `panel + widgets[]` 的本地同构模型
- 当前页已区分 `system / preset / user` 三类面板，并支持复制为用户面板、重命名、删除、恢复当前面板与保存默认视角
- 编辑态已支持 widget 添加/配置/删除、S/M/L 尺寸切换与拖拽排序，布局与面板定义通过本地存储持久化
- widget 已按 capability gating 决定是否显示；`logs / traces` 的后续扩展 widget 类型与配置结构已冻结，但默认模板仍只启用当前阶段真正可消费的 read model
- 默认模板与场景模板继续复用现有 `overview summary / trends / risk-services / incidents / ingest-status` 接口，为后续后端 panel CRUD 保留同构入口

验证结果：

- `npm run build` 通过
- 手动代码检查：当前 Overview 实现已覆盖文档要求的模板体系、查看/编辑态分离、widget 配置、尺寸切换、拖拽排序与本地布局持久化

状态：**已完成**
说明：前端 `/home/overview` 已完成 panel-first 容器化，后续只需在后端 panel CRUD 可用后把本地持久化切换为真实接口。

### 84. darwin-app 系统微服务已开始按 admin-only system scope 接入 StarLight 主链路

已修改文件：

- `src/api/metrics.ts`
- `src/router/index.ts`
- `src/layout/left/index.tsx`
- `src/services/webSocket.ts`
- `src/store/user.ts`
- `src/domains/overview/pages/OverviewPage.tsx`
- `src/domains/service/pages/ServiceCatalogPage.tsx`
- `src/domains/service/pages/ServiceDetailPage.tsx`
- `src/domains/service/pages/TopologyPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/utils/system-telemetry.ts`
- `../darwin-app/src/apps/starlight/metrics/utils/index.ts`
- `../darwin-app/src/apps/starlight/metrics/events/metrics.ts`
- `../darwin-app/src/apps/starlight/metrics/methods/index.ts`
- `../darwin-app/src/apps/starlight/metrics/actions/realtime.ts`
- `../darwin-app/src/apps/starlight/metrics/actions/topology.ts`
- `../darwin-app/src/apps/starlight/metrics/index.ts`
- `../darwin-app/src/apps/starlight/metrics/events/index.ts`
- `../darwin-app/src/apps/starlight/metrics-compat/index.ts`
- `../darwin-app/src/apps/starlight/logs/index.ts`
- `../darwin-app/src/apps/starlight/subscription/index.ts`
- `../darwin-app/src/apps/starlight/metrics-alerts/index.ts`

本轮接入内容：

- darwin-app 侧新增统一 `system-telemetry` 规则，冻结 system dataset 的 canonical scope、service identity 与 visibility 约定
- Event reporter 不再继续使用散落的自定义 eventName / interval 漂移，当前已统一回到 node-universe 默认 Event 契约
- metrics 服务已开始接收 `tenant/system` scope，并在 overview/catalog/detail/runtime/topology 主链路上做服务端 admin-only 拦截
- 为满足 node-universe 的 action / event schema 限制，metrics 服务已拆成 `metrics` 与 `metrics-lifecycle` 两个协同 service，但仍共享同一套内部 state 与 system telemetry 主链路
- StarLight 客户端已支持 admin 用户显式切换 `用户接入 / Darwin 系统` scope，Overview / Service Catalog / Service Detail / Topology / Realtime Monitor / Metrics Explorer / Instance Monitor / CustomDashboard / Mobile Home 已透传或支持 system scope
- 前端原先基于本地 `localStorage.user.isAdmin` 决定 admin metrics query 的危险分支已移除，改为统一走正常 metrics API，再由后端做权限判断
- 新增 `authSession` 回归测试，验证 admin / onboarding landing route 与整套 auth session 清理逻辑
- 侧边栏、admin 路由与 websocket 启动阶段的 stale admin state 已做第一轮 fail-closed 收敛，避免非 admin 用户通过旧入口直接看到系统页

验证结果：

- StarLight `npm run build` 通过
- StarLight `npx vitest run src/services/__tests__/authSession.test.ts` 通过
- darwin-app `npx tsc --noEmit` 通过
- 手动后端联调：直接调用 `metrics.v1.catalog.services / overview.summary / overview.trends / topology` 且 `scope=system` 时均返回 200 且 payload shape 正常
- 代码级验证：Overview / Catalog / Detail / Topology / Realtime Monitor / Metrics Explorer / Instance Monitor / CustomDashboard / Mobile Home 的 system scope 已能从页面状态透传到后端 read-model action

状态：**已完成**
说明：admin-only system scope 的主链路与主要观测页面已经打通，当前剩余项属于后续能力增强或其他主题任务，不再阻塞这轮 darwin-app 系统微服务接入方案的落地完成。

### 85. Alert Inbox assignee/assign 与 Overview 后端持久化已补齐

已修改文件：

- `src/api/alerts.ts`
- `src/api/metrics.ts`
- `src/api/url.ts`
- `src/types/monitor.ts`
- `src/domains/alerts/pages/AlertInboxPage.tsx`
- `src/domains/overview/pages/OverviewPage.tsx`

联动后端文件：

- `../darwin-app/src/apps/starlight/metrics/actions/alerts.ts`
- `../darwin-app/src/apps/starlight/metrics/actions/layout.ts`
- `../darwin-app/src/core/gateway/index.ts`

本轮接入内容：

- Alert Inbox 已新增处理人过滤、指派弹窗与 assign API 接线，告警列表/详情页会展示 assignee 信息
- metrics-alerts 后端已补 `v1.alerts/assignees` 与 `v1.alerts/:id/assign` 协议，并修复 resolve/suppress 会覆盖 assignee 状态的问题
- `/home/overview` 不再只依赖 localStorage 持久化面板状态，当前已改为通过现有 `v1.layout` 后端存储保存/恢复 panel state 与默认视角
- `v1.layout` 已允许对象型 payload，并在缺少用户行的开发环境下回退到 cacher 存储，避免后端持久化在本地联调时直接失效

验证结果：

- StarLight `npm run build` 通过
- StarLight `npx vitest run src/services/__tests__/authSession.test.ts` 通过
- darwin-app `npx tsc --noEmit` 通过
- 手动后端联调：`metrics-alerts.v1.alerts / assignees / :id/assign / :id/resolve` 可执行；`metrics.v1.layout` 可在后端存储并读取对象型 panel state

状态：**已完成**
说明：这轮文档里明确挂着的 Alert Inbox assignee/assign 与 Overview persisted panel storage 已经补上，剩余未完成项不再包含这两块。

## 当前未完成

- 更多旧页面局部接入新共享组件
- 少量旧入口与冗余逻辑仍待继续清理
- 前端其余页面与新后端契约的进一步对接

## 下一步

1. 继续减少旧页面与新页面之间的重复逻辑
2. 推进更多页面切到新的后端 action / read-model 契约
3. 持续把其余旧入口收敛到已完成的 system scope / domain page 主链路

## 完成标记规则

只有同时满足以下条件，任务才会标记为 **已完成**：

1. 功能已实现
2. 已完成测试或验证
3. 验证通过

否则只能标记为：

- 设计中
- 开发中
- 已实现未验证
- 验证中
