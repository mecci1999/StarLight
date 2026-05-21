# StarLight SCSS 迁移实施手册

## 目标

将客户端从“UnoCSS 原子样式 + 局部 SCSS”混合模式，逐步迁移到“语义类 + 本地 SCSS + token 驱动”的可维护模式。

## 当前现状

- 原子样式在客户端页面与 TSX 组件中广泛存在
- `src/styles/variable.scss` 已提供完整设计 token
- `src/styles/desktop.scss` 已承担全局基础样式与 Naive UI 全局覆写
- 部分 layout / login / onboarding / shared 组件已存在本地 SCSS 模式

## 实施顺序

### Phase 1

- 统一规范文档
- 先迁移 `layout`、`shared`、`WindowActionBar` 等壳层和基础组件

### Phase 2

- 迁移 login / onboarding / admin 壳层页面
- 建立可复用的 page shell、section、card、action row SCSS 模式

### Phase 3

- 迁移 overview / service / investigate / alerts 主要桌面页面
- 大页面优先拆 section，再迁样式

### Phase 4

- 迁移 mobile 页面
- 收紧新的 UnoCSS 使用范围

## 执行原则

- 先 shared、再 layout、后 pages
- 一次只迁一个组件族或一个页面 section
- 不把样式迁移和业务重写混在同一次提交里
- 保持 token 为单一来源，组件 SCSS 通过 `var(--...)` 消费

## 验证要求

- 每轮迁移后运行 `npm run build`
- 对高风险布局区域做人工抽样检查
- 新组件和已迁移组件不再继续引入新的原子样式链
