# StarLight 后端实施拆解与排期文档 v1

本文聚焦 darwin-app / backend 侧如何支撑 StarLight 的 panel-first Overview、Service Catalog、Service Detail 主链路，尤其补齐 Overview 面板持久化相关的分阶段落地计划。

---

# 1. 总体实施原则

## 1.1 核心原则
1. 先提供默认模板可复用 read model，再落地真正的 panel CRUD
2. 先冻结 panel/widget 契约，再做持久化和默认面板切换
3. 不把后续扩展 widget（logs/traces）错误地塞进第一阶段依赖闭环
4. 任何阶段都不能破坏现有 overview/cataloɡ/service detail 可运行能力

## 1.2 交付原则
- 每一阶段都必须有稳定 contract
- 所有 dashboard/panel 结构字段必须来源单一 owner
- 面板持久化不得依赖前端临时拼装字段
- `system / preset / user` 三类 panel 必须有明确 ownership

---

# 2. 实施阶段总览

```text
Phase 0: 读模型与路由治理基线
Phase 1: 主链路默认模板 read model
Phase 2: PanelDefinition / WidgetDefinition 契约冻结
Phase 3: Panel CRUD 与默认面板持久化
Phase 4: 扩展 widget（logs/traces）与模板体系增强
```

---

# 3. Phase 0：基线治理

## 目标
把现有 overview / catalog / service detail 数据源整理到适合扩展的状态。

## 任务
- 统一 service identity
- 统一时间范围与 scope query 约定
- 去除 overview/dashboard 相关 mock / gateway hack
- 收拢 Overview read model 的命名与返回结构

## 验收标准
- 现有 overview / catalog / service detail 主链路接口稳定
- 新 contract 可在不破坏旧路由的前提下演进

---

# 4. Phase 1：主链路默认模板 read model

## 目标
支持 `/home/overview` 作为 panel-first 首页的默认模板实现，但暂不要求用户持久化自定义面板。

## 任务
- 提供默认模板可复用的 read model：
  - `GET /api/overview/v1/summary`
  - `GET /api/overview/v1/trends`
  - `GET /api/overview/v1/risk-services`
  - `GET /api/overview/v1/incidents`
  - `GET /api/overview/v1/ingest-status`
- 提供 Service Catalog 主链路 read model：
  - `GET /api/catalog/v1/services`
  - `GET /api/catalog/v1/services/summary`
  - `GET /api/catalog/v1/services/:serviceId/quick-view`
- 提供 Service Detail read model：
  - `GET /api/service/v1/:serviceId/overview`

## 验收标准
- 默认模板 widget 都能由真实 read model 驱动
- Service Catalog 列表、summary、quick-view 契约稳定
- 前端无需 mock 即可走完整主链路

---

# 5. Phase 2：PanelDefinition / WidgetDefinition 契约冻结

## 目标
在真正实现持久化前，先冻结 panel / widget 的数据结构，避免前后端后续各自发散。

## 任务
- 定义 `DashboardPanel`
- 定义 `DashboardWidget`
- 定义 `system / preset / user` 三类 panel
- 定义 widget config schema
- 定义 capability gating 行为
- 定义默认 panel 解析规则

## 依赖
- `docs/refactor/backend-api-contract-v1.md`
- frontend 侧的 widget taxonomy / panel model 已稳定

## 验收标准
- panel / widget 字段含义清晰
- 面板列表、详情、保存接口可以稳定扩展
- logs / traces widget 已被标记为后续扩展，而不是当前阶段强依赖

---

# 6. Phase 3：Panel CRUD 与默认面板持久化

## 目标
让用户真正拥有可持久化的 panel-first 首页。

## 任务
- 实现 `GET /api/dashboard/v1/panels`
- 实现 `GET /api/dashboard/v1/panels/:panelId`
- 实现 `POST /api/dashboard/v1/panels`
- 实现 `PATCH /api/dashboard/v1/panels/:panelId`
- 实现 `POST /api/dashboard/v1/panels/:panelId/restore`
- 实现 `DELETE /api/dashboard/v1/panels/:panelId`
- 支持默认面板切换 / 标记
- 支持 widget 顺序、尺寸、局部配置持久化

## 约束
- `PATCH` 优先采用 widget 全量提交，避免补丁合并歧义
- system panel 不允许原地修改，只允许复制
- `restore` 必须有明确服务端语义：user panel 恢复最近一次已保存版本，system/preset panel 恢复模板初始定义
- panel CRUD 不应阻塞默认模板阶段的继续交付

## 验收标准
- 当前用户至少能读取、创建、修改、删除 user panel
- `restore` 可稳定恢复 user/preset/system panel 的约定目标版本
- 前端编辑态能闭环保存布局与 widget 配置

---

# 7. Phase 4：扩展 widget 与模板体系增强

## 目标
在 panel-first 主链路稳定后，再引入 logs/traces 扩展 widget 与更完整的模板系统。

## 任务
- logs patterns / traces latency 相关 read model
- 场景模板管理增强
- 模板复制、恢复、回退能力增强
- capability-blocked widget 的服务端辅助策略（可选）

## 验收标准
- 扩展 widget 不影响当前默认模板稳定性
- 模板体系可以区分 system / preset / user
- 扩展 widget 的 read model 与 config schema 已联调稳定

---

# 8. 当前优先级建议

如果只做最小闭环，建议后端按以下顺序推进：

1. 先补齐/稳定默认模板阶段 read model
2. 再冻结 panel/widget 契约
3. 再落地 panel CRUD 与默认面板持久化
4. 最后补 logs/traces 扩展 widget

---

# 9. 完成定义

只有同时满足以下条件，某阶段才允许标记为已完成：

1. 契约已经写清并同步到文档
2. 对应接口已经实现
3. 前后端已完成验证
4. 文档状态已同步更新
