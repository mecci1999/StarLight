# StarLight 客户端组件样式规范

## 目标

客户端组件统一采用 **SCSS-first** 规范，逐步替换 JSX/TSX 中的大量原子样式写法，提升可维护性、可搜索性与后续主题调整效率。

## 适用范围

- `src/layout/**`
- `src/shared/**`
- `src/domains/**`
- `src/views/**`
- `src/mobile/**`

## 基本规则

1. 新建组件默认使用 `Component.tsx` + `Component.scss`
2. 每个组件必须有一个语义化根类名
3. 样式必须优先使用 `src/styles/variable.scss` 中的 token
4. 不在新组件中继续引入新的原子样式链来表达布局和视觉
5. 组件内部状态使用语义 modifier，例如 `.is-active`、`.is-loading`

## 推荐命名

- 根类：`.scope-bar`
- 子元素：`.scope-bar__content`
- 状态：`.scope-bar.is-compact`
- 变体：`.scope-bar--service`

## 推荐写法

```tsx
import './ScopeBar.scss'

return () => (
  <div class="scope-bar">
    <div class="scope-bar__content">...</div>
  </div>
)
```

```scss
.scope-bar {
  border: 1px solid var(--color-border-2);

  &__content {
    display: flex;
    gap: var(--spacing-3);
  }
}
```

## 禁止项

- 在已迁移组件中继续新增长串原子类
- 在组件样式里硬编码主题色、阴影、边框色
- 用单个超长页面 SCSS 承载所有 section 的样式职责

## 迁移顺序

1. shell / layout
2. shared components
3. login / onboarding / admin shell
4. overview / service / investigate / alerts 页面
5. mobile 页面

## 验收要求

- JSX 中不再依赖原子类表达主要布局和视觉
- 样式来源清晰，可在同目录 SCSS 中直接调整
- `npm run build` 通过
