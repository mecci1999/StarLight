# 星光 Odyssey 移动端功能适配总纲

> 基于桌面端全部页面功能分析，结合移动端场景，输出移动端应实现的功能清单和实现优先级。

---

## 一、桌面端页面总览（26个页面）

### 看板与概览
| 页面 | 文件 | 行数 | 移动端 | 优先级 |
|------|------|------|--------|--------|
| 看板 | OverviewPage.tsx | 6138 | ✅ 适配 | P0 |
| 基础设施概览 | RealtimeMonitorPage.tsx | 489 | ✅ 适配 | P0 |
| 自定义看板 | CustomDashboardPage.tsx | - | ❌ 桌面专属 | - |

### 服务管理
| 页面 | 文件 | 行数 | 移动端 | 优先级 |
|------|------|------|--------|--------|
| 服务目录 | ServiceCatalogPage.tsx | 742 | ✅ 适配 | P0 |
| 服务详情 | ServiceDetailPage.tsx | 2035 | ⚠️ 精简 | P1 |
| 服务拓扑 | TopologyPage.tsx | 1000 | ❌ 不适合 | - |
| 实例监控 | InstanceMonitorPage.tsx | 331 | ✅ 适配 | P0 |

### 告警管理
| 页面 | 文件 | 行数 | 移动端 | 优先级 |
|------|------|------|--------|--------|
| 告警收件箱 | AlertInboxPage.tsx | 542 | ✅ 适配 | P0 |
| 告警规则 | AlertRulesPage.tsx | 725 | ⚠️ 只读 | P2 |
| 通知历史 | NotificationCenterPage.tsx | 409 | ⚠️ 精简 | P2 |

### 监控分析
| 页面 | 文件 | 行数 | 移动端 | 优先级 |
|------|------|------|--------|--------|
| 指标分析 | MetricsExplorerPage.tsx | 503 | ⚠️ 精简 | P1 |
| 指标目录 | MetricsCatalogPage.tsx | 698 | ⚠️ 精简 | P2 |
| 链路追踪 | TraceExplorerPage.tsx | 731 | ⚠️ 检索列表 | P1 |
| 日志中心 | LogCenterPage.tsx | 855 | ⚠️ 精简 | P1 |
| 异常分析 | ExceptionAnalysisPage.tsx | - | ✅ 适配 | P1 |

### 管理配置
| 页面 | 文件 | 行数 | 移动端 | 优先级 |
|------|------|------|--------|--------|
| 计费 | BillingPage.tsx | - | ❌ 桌面专属 | - |
| 接入管理 | IngestionPage.tsx | - | ❌ 桌面专属 | - |
| 接入引导 | OnboardingPage.tsx | - | ✅ 已适配 | P2 |
| 设置 | SettingsPage.tsx | - | ⚠️ 简化 | P2 |
| 个人资料 | ProfilePage.tsx | - | ✅ 已适配 | P0 |
| 微应用 | MicroAppCenterPage.tsx | - | ❌ 桌面专属 | - |

---

## 二、各页面移动端实现详情

### P0 - 看板 (OverviewV2)

**桌面端功能**（6138行）:
- 可定制 Widget 面板（增删改排序）
- 时间范围选择器 (TimeRangeBar)
- ScopeBar 范围切换
- 趋势图表 (LineChart/BarChart/PieChart/GaugeChart)
- 实时自动刷新
- 指标对比（环比/同比）
- 接入状态面板
- 事件/告警面板
- 导出功能

**移动端实现**:
| 功能 | 实现方式 |
|------|---------|
| 6 统计卡片 | NGrid 2列 + NStatistic，含趋势箭头↑↓ |
| 服务总数 + 健康服务数 | fetchOverviewSummary → totals.serviceCount / healthyServices |
| 活跃告警数 | fetchOverviewSummary → totals.activeIncidents |
| 请求总量 + 趋势 | fetchOverviewSummary + fetchOverviewTrends |
| P95 延迟 | fetchOverviewSummary → totals.p95Latency |
| 错误率 + 趋势 | fetchOverviewSummary + fetchOverviewTrends |
| 接入速率 | fetchOverviewSummary → totals.ingestionRate |
| 风险服务列表 | fetchOverviewRiskServices → 可点击跳转详情 |
| 最近告警 | fetchOverviewIncidents → 可跳转告警收件箱 |
| 手动刷新 | 按钮 + 时间新鲜度提示 |
| 自动刷新 | 不实现（移动端省电） |
| 时间范围切换 | 不实现（固定最近时间范围） |
| 图表 | 不实现（移动端用数字替代） |
| 导出 | 不实现 |
| Widget 定制 | 不实现 |

**API 调用**: fetchOverviewSummary, fetchOverviewTrends, fetchOverviewRiskServices, fetchOverviewIncidents

**可视化组件**: NCard, NStatistic, NTag, NIcon (PulseOutline/WarningOutline/ServerOutline/TrendingUpOutline)

---

### P0 - 服务目录 (ServicesV2)

**桌面端功能**（742行）:
- 表格/卡片双视图
- 5个 NSelect 多维度筛选（状态/环境/团队/Owner/Tag）
- 排序（名称/QPS/错误率/延迟/部署时间）
- 服务摘要统计（总/健康/轻微异常/严重/已静音）
- 快捷操作（快速查看/拓扑/链路/日志）
- ScopeBar + TimeRangeBar

**移动端实现**:
| 功能 | 实现方式 |
|------|---------|
| 搜索框 | NInput 关键词搜索（name/owner/region） |
| 卡片列表 | NCard + 健康标签 + 指标摘要 |
| 服务计数 | 头部"共 N 个服务" |
| 健康状态标签 | NTag（健康/警告/异常/降级/严重/静默/未知） |
| 点击进详情 | 整卡可点击 → /mobile/service-detail-v2/:id |
| 下拉刷新 | 按钮手动刷新 |
| 错误状态 | NResult + 重试按钮 |
| 空状态 | NEmpty "暂无服务数据" |

**API 调用**: fetchCatalogServices

**不实现**: 表格视图、多维度筛选下拉、排序、ScopeBar、TimeRangeBar、快捷操作按钮

---

### P0 - 实例监控 (新增)

**桌面端功能**（331行）:
- 4个统计卡片（总实例/运行中/异常/平均CPU）
- 实例列表（ID/状态/节点/CPU进度条/内存进度条/启动时间）
- 服务选择器 + 时间范围

**移动端实现**:
| 功能 | 实现方式 |
|------|---------|
| 4 统计卡片 | NGrid 2列 + NStatistic |
| 实例列表 | 卡片列表：实例ID + 状态标签 + CPU/内存进度条 + 启动时间 |
| 服务选择 | NSelect 搜索选择 |

**API 调用**: fetchServiceInstances

---

### P0 - 告警收件箱 (MobileAlertsInbox)

**桌面端功能**（542行）:
- 5个筛选（搜索/服务/等级/状态/处理人）+ TimeRangeBar
- 统计卡片（总/活跃/已解决/已静默）
- 操作（确认/解决/静默/指派）
- DetailDrawer 详情

**移动端实现**:
| 功能 | 实现方式 |
|------|---------|
| 告警列表 | NCard 卡片列表 + 严重级别色点 + 服务名 + 消息 + 相对时间 |
| 刷新 | 按钮手动刷新 |
| 告警计数 | 头部"N 条活跃告警" |
| 相对时间 | "刚刚/5分钟前/1小时前/3天前" |
| 空状态 | "暂无活跃告警，系统运行正常" |
| 错误状态 | NEmpty + 重试按钮 |
| 查看全部 | > 10条时显示"查看全部"（跳转完整列表或 toast） |

**API 调用**: fetchAlerts

**不实现**: 筛选栏、操作按钮（确认/解决/指派）、详情抽屉、TimeRangeBar

---

### P0 - 个人中心 (MobileProfile)

**已实现**: 头像+用户名+邮箱+菜单列表+退出登录+版本号

**待完善**:
- 退出登录前加确认弹窗
- "个人资料"菜单 → 跳转编辑页面
- "设置"菜单 → 跳转设置页面
- "关于" → 显示版本弹窗

---

### P1 - 服务详情 (ServiceDetailV2)

**桌面端功能**（2035行，6个Tab）:
- Tab1 概览：运行摘要/健康时间线/依赖摘要/最近事件/最近链路/最近异常
- Tab2 指标：KPI图组/基础设施图组/请求统计/基线对比
- Tab3 拓扑：ServiceTopology 力导向图
- Tab4 日志：日志搜索/日志模式/日志详情
- Tab5 链路：Trace ID搜索/耗时分布/链路表格/瀑布图
- Tab6 告警：活跃告警/告警规则/已静默/通知历史
- Tab7 运行时：实例/环境/AppKey/部署历史/实例表格

**移动端实现（精简版）**:
| 功能 | 实现方式 |
|------|---------|
| 服务身份卡 | 服务名 + Owner/区域/版本 + 健康标签 |
| 核心指标 | 4个 NStatistic：QPS/响应时间/错误率/活跃连接 |
| 运行摘要 | CPU + 内存 百分比 |
| 返回按钮 | router.back() |
| 错误状态 | NResult + 重试 |

**API 调用**: fetchServiceDetailSummary

**不实现**: 所有 Tab（指标图表/拓扑图/日志/链路/告警/运行时）、LineChart、BarChart、Waterfall、TimeRangeBar

---

### P1 - 日志中心（新增）

**移动端实现（精简版）**:
| 功能 | 实现方式 |
|------|---------|
| 概览统计 | 总日志数/今日日志/错误率 卡片 |
| 最近日志列表 | 卡片列表：时间/级别标签/服务/消息摘要 |
| 关键词搜索 | NInput 搜索 |
| 级别过滤 | NTag chip 行（TRACE/DEBUG/INFO/WARN/ERROR/FATAL） |

**API 调用**: logSearch

**不实现**: 日志摄取、实时流、调试开关、完整检索面板

---

### P1 - 异常分析（新增）

**移动端实现（精简版）**:
| 功能 | 实现方式 |
|------|---------|
| 异常列表 | 卡片列表：异常消息/类型/次数/最后发生时间 |
| 异常详情 | 点击展开：消息详情 + stack trace |

**API 调用**: listExceptions

---

### P1 - 链路追踪（新增，仅检索列表）

**移动端实现（精简版）**:
| 功能 | 实现方式 |
|------|---------|
| 统计卡片 | 链路总数/正常/异常/平均耗时 |
| 链路列表 | 卡片列表：开始时间/服务/操作/耗时/状态/Trace ID |
| 搜索 | NInput 搜索 Trace ID 或服务名 |

**API 调用**: searchTraces

**不实现**: Waterfall 瀑布图（移动端不可用）、耗时分布图

---

### P1 - 指标分析（新增，精简版）

**移动端实现（精简版）**:
| 功能 | 实现方式 |
|------|---------|
| 服务选择 | NSelect |
| CPU/内存/QPS/响应时间 | 4个 NStatistic 当前值卡片 |
| 趋势迷你图 | 可选（如能复用 LineChart 组件） |

**API 调用**: fetchMetricsExplorer

**不实现**: 多模式图表切换、CSV导出、基线对比

---

### P2 - 告警规则（只读）

**移动端实现**:
| 功能 | 实现方式 |
|------|---------|
| 规则列表 | 卡片列表：规则名/服务/指标/条件/级别/状态 |

**API 调用**: fetchAlertRules

**不实现**: 增删改、批量操作、导入导出、看板同步

---

### P2 - 通知历史（精简）

**移动端实现**:
| 功能 | 实现方式 |
|------|---------|
| 通知列表 | 卡片列表：时间/规则名/渠道/状态 |
| 统计 | 成功/失败计数 |

**API 调用**: fetchNotifications

**不实现**: 重发、批量重发、详情抽屉

---

### P2 - 设置

**移动端实现**:
- 深色模式切换
- 语言切换（如支持）
- 缓存清理

---

## 三、实现优先级矩阵

| 优先级 | 页面 | 状态 | 工作量 |
|--------|------|------|--------|
| P0 | 看板 | ✅ 已完成 | - |
| P0 | 服务目录 | ✅ 已完成 | - |
| P0 | 告警收件箱 | ✅ 已完成 | - |
| P0 | 个人中心 | ✅ 已完成 | - |
| P0 | 实例监控 | 🔴 待实现 | 中 |
| P1 | 服务详情 | ⚠️ 需增强 | 中 |
| P1 | 日志中心 | 🔴 待实现 | 中 |
| P1 | 异常分析 | 🔴 待实现 | 中 |
| P1 | 链路追踪 | 🔴 待实现 | 中 |
| P1 | 指标分析 | 🔴 待实现 | 中 |
| P2 | 告警规则 | 🔴 待实现 | 小 |
| P2 | 通知历史 | 🔴 待实现 | 小 |
| P2 | 设置 | 🔴 待实现 | 小 |

---

## 四、移动端样式规范（重申）

1. **clamp()** 流体适配 — 所有尺寸用 clamp(最小值, vw值, 最大值)
2. **100dvh** — 替代 100vh
3. **env(safe-area-inset-top)** — 所有页面加 padding-top
4. **CSS 变量** — 颜色/字重/圆角/阴影一律用 var(--xxx)
5. **BEM 命名** — block__element--modifier
6. **三种状态** — loading/error/empty 必须有
7. **Naive UI 图标** — @vicons/ionicons5
8. **export default defineComponent** — 必须导出
