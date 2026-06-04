# StarLight 清爽设计系统 - 风格指南

## 设计理念

**简约、清晰、层次分明**

- **视觉清爽** - 减少不必要的装饰，保持界面整洁
- **信息直接** - 让用户快速获取关键信息
- **交互自然** - 流畅的动画和反馈
- **一致性强** - 统一的设计语言和组件库

---

## AI 样式修改执行规范

当用户要求“按照系统样式规范调整”“优化布局/交互/样式”时，默认遵循本节。目标是让后续修改保持同一种 StarLight 产品气质：清爽、专业、信息密度适中，接近主流监控/后台应用，而不是为单个页面临时发挥。

### 1. 样式修改优先级

1. **优先改共享组件**：如果多个页面共用同一种结构，优先修改 shared/layout 或 shared/components，例如 `PageHeader`、`TimeRangeBar`，不要逐页复制样式。
2. **优先改同目录 SCSS**：新建或调整布局、间距、字号、颜色时，默认改 `Component.scss` / `Page.scss`，不要在 TSX 中继续堆 inline style 或原子类。
3. **优先使用 token**：颜色、字号、间距、圆角、阴影、动效必须优先使用 `src/styles/variable.scss` 中的 `var(--...)`。
4. **最小有效改动**：解决当前视觉/交互问题，不顺手重做无关页面结构。

### 2. 页面标题区规范

适用于所有桌面主页面的 `PageHeader`。

- 标题和描述应在**同一行主标题区域**内呈现，而不是上下两行堆叠。
- 标题使用 `var(--font-size-title-2)`，字重使用 `var(--font-weight-semibold)`。
- 描述使用 `var(--font-size-body-2)`，颜色使用 `var(--color-text-3)`。
- 标题与描述之间使用轻量分隔（例如 3px 中性色圆点），避免视觉上粘连。
- 右侧操作按钮、meta、extra 插槽必须独立在 action 区域，不与标题描述混排。
- 小屏可以换行，但桌面宽度下应保持“标题 · 描述”的同一行信息结构。

推荐结构：

```tsx
<header class="page-header">
  <div class="page-header__main">
    <h1 class="page-header__title">页面标题</h1>
    <span class="page-header__subtitle">页面描述</span>
  </div>
  <div class="page-header__actions">...</div>
</header>
```

### 3. 工具栏与筛选区规范

适用于时间范围、服务搜索、状态筛选、查询操作等控制区。

- 工具栏应按任务分组：主要范围控制在左，实时/刷新/查询操作在右或下一组。
- 使用语义化 BEM 类名，例如 `time-range-bar__primary`、`time-range-bar__secondary`、`overview-page__service-search`。
- 控件宽度要克制，避免默认撑满导致视觉失衡：
  - 服务/主体选择：约 `200px ~ 240px`。
  - 状态/等级/环境筛选：约 `136px ~ 180px`。
  - 搜索输入：根据语义控制在 `220px ~ 300px`，只有全局搜索/复杂查询才允许更宽。
- 同一工具栏内的按钮宽度保持稳定；短按钮可固定为 `64px`。
- 交互状态要符合语义，例如实时模式关闭时自动刷新选择器应禁用。
- 小屏下工具栏可以纵向铺满，避免按钮和输入框挤压。

### 4. 卡片、网格与间距规范

- 页面卡片之间的横向和纵向间距必须一致，默认使用 `var(--spacing-4)` / `16px`。
- Grid 布局优先用 `gap` 统一管理间距，不用子项 margin 拼接间距。
- Masonry / CSS Grid 手动计算高度时：
  - 先测量自然内容高度，再设置 `grid-row-end`。
  - 不要在未确定父级高度时给 grid item/card 直接写 `height: 100%`，这会让卡片折叠成线。
  - 如需撑满计算后的网格区域，优先设置安全的 `min-height`，并让子卡片继承 `min-height`。
- 卡片内容不应依赖外部 margin 形成布局节奏；卡片内部使用 padding/gap。

### 5. 字号与信息层级

常用层级：

| 场景 | 字号 | 字重 | 颜色 |
|------|------|------|------|
| 页面标题 | `--font-size-title-2` | `--font-weight-semibold` | `--color-text-1` |
| 页面描述 | `--font-size-body-2` | `--font-weight-regular` | `--color-text-3` |
| 卡片标题 | `--font-size-title-1` 或 `14px` | `--font-weight-medium` | `--color-text-1` |
| 卡片说明/辅助信息 | `--font-size-body-1` / `--font-size-body-2` | `--font-weight-regular` | `--color-text-3` |
| 表格/标签/小控件 | `12px` / `--font-size-body-1` | `--font-weight-medium` 视语义而定 | token 色 |

原则：不要在同一页面制造过多字号层级。内页页面标题不应长期使用展示级大标题，除非是登录页、营销页或空状态 Hero。

### 6. Naive UI 组件定制边界

- 可以通过语义 class 调整 Naive UI 组件的布局宽度、背景、边框、hover 状态。
- 不要大面积重写 Naive UI 的内部结构；必要时使用 `:deep(...)`，并限定在当前组件根类下。
- 控件交互语义优先于装饰：禁用态、加载态、可清除、Enter 查询等行为要和视觉调整一起确认。

### 7. 验收清单

每次样式修改完成后至少检查：

- 是否使用了 `var(--...)` token，而不是硬编码主题值。
- 是否写在同目录 SCSS 中，且类名语义清晰。
- 是否影响共享组件的所有调用方。
- 是否存在小屏换行/铺满策略。
- 是否运行了相关 LSP diagnostics、必要的组件测试和 `npm run build`。
- 若修改 shared 组件，优先补一条 focused component test 固化结构或关键交互。

---

## 颜色系统

### 主色调 - 清新科技蓝

```css
--color-primary-7: #1e40af; /* 点击态 */
--color-primary-6: #2563eb; /* 常规/品牌色 */
--color-primary-5: #3b82f6; /* 悬浮态 */
--color-primary-4: #60a5fa; /* 特殊场景 */
--color-primary-3: #93c5fd; /* 禁用态 */
--color-primary-2: #bfdbfe; /* 文字禁用 */
--color-primary-1: #eff6ff; /* 浅色背景 */
```

### 中性色 - 柔和层次

```css
--color-text-1: #1f2937; /* 标题/强调 */
--color-text-2: #4b5563; /* 正文/次标题 */
--color-text-3: #6b7280; /* 次要信息 */
--color-text-4: #9ca3af; /* 置灰信息 */
```

### 功能色 - 温和清晰

```css
/* 成功 - 柔和绿 */
--color-success-6: #16a34a;

/* 警告 - 柔和橙 */
--color-warning-6: #d97706;

/* 错误 - 柔和红 */
--color-danger-6: #dc2626;
```

---

## 间距系统 - 8px 基础单位

```css
--spacing-1: 4px; /* 最小间距 */
--spacing-2: 8px; /* 小间距 */
--spacing-3: 12px; /* 中间距 */
--spacing-4: 16px; /* 标准间距 */
--spacing-5: 20px; /* 大间距 */
--spacing-6: 24px; /* 超大间距 */
--spacing-8: 32px; /* 特大间距 */
```

**使用原则：**

- 组件内间距：使用 8px、12px、16px
- 组件间间距：使用 16px、20px、24px
- 页面大区块间距：使用 24px、32px

---

## 圆角系统

```css
--radius-sm: 4px; /* 小圆角 - 复选框等小组件 */
--radius-md: 6px; /* 中圆角 - 按钮、输入框 */
--radius-lg: 8px; /* 大圆角 - 卡片、弹窗 */
--radius-xl: 12px; /* 超大圆角 - 大弹窗、侧边栏 */
```

---

## 阴影系统 - 轻盈柔和

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.04); /* 轻微阴影 */
--shadow-md: 0 2px 8px -2px rgba(0, 0, 0, 0.06), ...; /* 卡片阴影 */
--shadow-lg: 0 8px 24px -4px rgba(0, 0, 0, 0.08), ...; /* 弹窗阴影 */
```

**使用原则：**

- 卡片默认使用 `--shadow-sm`，悬浮时变为 `--shadow-md`
- 弹窗使用 `--shadow-lg`
- 避免使用过重的阴影

---

## 字体系统

### 字号层级

```css
--font-size-caption: 11px; /* 水印/最小文字 */
--font-size-body-1: 12px; /* 辅助文案 */
--font-size-body-2: 13px; /* 正文-小 */
--font-size-body-3: 14px; /* 正文 */
--font-size-title-1: 15px; /* 小标题 */
--font-size-title-2: 18px; /* 中标题 */
--font-size-title-3: 24px; /* 大标题 */
--font-size-display-1: 32px; /* 展示-小 */
```

### 字重

```css
--font-weight-regular: 400; /* 常规 - 正文 */
--font-weight-medium: 500; /* 中等 - 按钮、标签 */
```

**使用原则：**

- 减少字重层级，保持清爽
- 标题使用 `semibold (600)`
- 按钮、标签使用 `medium (500)`
- 正文使用 `regular (400)`

---

## 动画过渡

```css
--duration-fast: 150ms; /* 快速响应 */
--duration-normal: 200ms; /* 标准动画 */
--duration-slow: 300ms; /* 大组件动画 */

--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
```

**使用原则：**

- 悬停、点击反馈：`150ms`
- 展开收起、弹窗显示：`200ms`
- 页面切换、大动画：`300ms`

---

## 组件使用规范

### 客户端组件样式规范

对于新的客户端组件和已经进入重构范围的组件，默认采用 **SCSS-first**：

- 组件文件与样式文件成对出现：`Component.tsx` + `Component.scss`
- 组件必须有一个语义化根类名，例如 `.scope-bar`、`.service-detail-page`
- 颜色、间距、字号、圆角、阴影必须优先使用 `src/styles/variable.scss` 中的 `var(--...)` token
- 一旦组件已有本地 SCSS，就不要继续在 JSX 中堆叠新的原子类去表达布局和视觉
- 原子类仅允许保留在未迁移的旧文件中，或者用于短期过渡，不作为新规范

推荐结构：

```tsx
import './Component.scss'

return () => (
  <section class="component-name">
    <div class="component-name__header" />
    <div class="component-name__content" />
  </section>
)
```

```scss
.component-name {
  padding: var(--spacing-4);

  &__header {
    margin-bottom: var(--spacing-3);
  }
}
```

### 卡片 (sl-card)

```html
<div class="sl-card">
  <div class="sl-card__header">
    <h3 class="sl-card__title">卡片标题</h3>
  </div>
  <div class="sl-card__body">卡片内容</div>
</div>
```

**设计要点：**

- 默认有 1px 边框和轻微阴影
- 内边距统一使用 `--spacing-4` (16px)
- 标题使用 `sl-card__title` 样式

### 按钮 (sl-btn)

```html
<!-- 主按钮 -->
<button class="sl-btn sl-btn--primary">确定</button>

<!-- 次要按钮 -->
<button class="sl-btn sl-btn--secondary">取消</button>

<!-- 文字按钮 -->
<button class="sl-btn sl-btn--text">编辑</button>
```

**设计要点：**

- 标准高度：`--size-default` (36px)
- 圆角：`--radius-md` (6px)
- 字重：`--font-weight-medium` (500)
- 主要操作使用主按钮，次要操作使用次要按钮

### 输入框 (sl-input)

```html
<div class="sl-input">
  <div class="sl-input__wrapper">
    <input class="sl-input__field" placeholder="请输入..." />
  </div>
</div>
```

**设计要点：**

- 高度与按钮一致：36px
- 默认边框：`--color-border-2`
- 聚焦时：蓝色边框 + 3px 浅色外阴影
- 背景：白色

### 标签/徽章 (sl-tag)

```html
<!-- 默认 -->
<span class="sl-tag sl-tag--default">默认</span>

<!-- 主色调 -->
<span class="sl-tag sl-tag--primary">进行中</span>

<!-- 成功 -->
<span class="sl-tag sl-tag--success">已完成</span>

<!-- 警告 -->
<span class="sl-tag sl-tag--warning">待处理</span>

<!-- 错误 -->
<span class="sl-tag sl-tag--danger">异常</span>
```

**设计要点：**

- 字号：`--font-size-body-1` (12px)
- 圆角：`--radius-sm` (4px)
- 优先使用浅色背景 + 深色文字的组合

---

## 布局规范

### 页面结构

```
┌─────────────────────────────────────┐
│  WindowActionBar (38px)             │
├─────────────────────────────────────┤
│  Header (56px)                      │
├──────────┬──────────────────────────┤
│          │  Tabs Nav (40px)         │
│  Left    ├──────────────────────────┤
│ (240px)  │                          │
│          │  Content Area            │
│          │                          │
└──────────┴──────────────────────────┘
```

### 页面内边距

```css
.page-view {
  padding: var(--spacing-5); /* 20px */
}
```

### 新旧样式并存期规则

- 优先迁移 shared / layout / shell 组件，再迁移业务页面
- 大页面不要一次性写成超长 SCSS，优先拆成 section 组件后分别落样式
- Naive UI 的覆写尽量收敛在组件根类下，避免无边界全局覆盖
- 若同一组件已经有 SCSS 文件，新增样式必须继续写入该 SCSS，而不是回退到原子类

### 卡片网格

使用 12 列网格系统：

- 桌面端：12 列
- 平板端：6-8 列
- 移动端：4 列

---

## 色彩使用原则

### 文字颜色

| 场景               | 颜色变量         | 使用示例                     |
| ------------------ | ---------------- | ---------------------------- |
| 页面标题、重要强调 | `--color-text-1` | 页面标题、卡片标题           |
| 正文、次标题       | `--color-text-2` | 正文内容、表单标签           |
| 次要信息           | `--color-text-3` | 描述文字、辅助信息           |
| 占位、置灰         | `--color-text-4` | 输入框 placeholder、禁用文字 |

### 背景颜色

| 场景     | 颜色变量           | 使用示例             |
| -------- | ------------------ | -------------------- |
| 整体背景 | `--color-bg-1`     | 页面最外层背景       |
| 容器背景 | `--color-bg-white` | 卡片、弹窗背景       |
| 浅填充   | `--color-fill-1`   | 输入框背景           |
| 悬浮填充 | `--color-fill-2`   | 按钮悬浮、菜单项悬浮 |

### 边框颜色

| 场景     | 颜色变量           | 使用示例         |
| -------- | ------------------ | ---------------- |
| 常规边框 | `--color-border-1` | 卡片边框、分割线 |
| 组件边框 | `--color-border-2` | 按钮、输入框边框 |
| 悬浮边框 | `--color-border-3` | 输入框悬浮       |

---

## 交互反馈

### 悬停 (Hover)

- **按钮**：背景色变化，无外发光
- **卡片**：阴影从 `sm` 变为 `md`，轻微上移 2px
- **菜单/列表项**：背景变为 `--color-fill-2`
- **链接**：颜色变为 `--color-primary-5`

### 点击 (Active)

- 按钮背景色进一步加深
- 瞬时反馈，无长时间动画

### 聚焦 (Focus)

- 输入框：蓝色边框 + 3px 浅色外阴影（`box-shadow: 0 0 0 3px var(--color-primary-1)`）
- 避免使用粗边框或强烈的外发光

### 禁用 (Disabled)

- 不透明度：0.5
- 光标：`not-allowed`
- 保持灰色调，不使用其他颜色

---

## 深色模式

### 设计原则

- 保持相同的信息层级
- 避免纯黑背景，使用深灰 (#171717)
- 降低对比度，避免刺眼
- 功能色保持色相不变，调整明度

### 颜色转换

- 背景色：反转明度，深色调为主
- 文字色：确保足够对比度（WCAG AA 标准）
- 边框：使用深色边框，避免过于明显
- 阴影：可以稍微加重，增加层次感

---

## 代码书写规范

### SCSS 变量使用

**优先使用 CSS 变量：**

```scss
// ✅ 推荐
padding: var(--spacing-4);
color: var(--color-text-1);
border-radius: var(--radius-md);

// ❌ 避免
padding: 16px;
color: #1f2937;
border-radius: 8px;
```

### 类名规范

使用 BEM 命名风格：

```scss
// 块 (Block)
.sl-card {
}

// 元素 (Element)
.sl-card__header {
}
.sl-card__body {
}
.sl-card__title {
}

// 修饰符 (Modifier)
.sl-card--borderless {
}
.sl-card--compact {
}
```

### 组件样式组织

```scss
// 1. 基础样式
.sl-component {
  // ...
}

// 2. 子元素
.sl-component__header {
}
.sl-component__body {
}

// 3. 修饰符变体
.sl-component--primary {
}
.sl-component--large {
}

// 4. 状态
.sl-component.is-active {
}
.sl-component.is-loading {
}
```

---

## 检查清单

开发新页面/组件时，请确认：

- [ ] 使用了统一的间距变量 (--spacing-\*)
- [ ] 使用了统一的颜色变量 (--color-\*)
- [ ] 使用了统一的圆角变量 (--radius-\*)
- [ ] 使用了统一的阴影变量 (--shadow-\*)
- [ ] 字体层级清晰，不超过 3-4 种字号
- [ ] 字重不超过 3 种 (400, 500, 600)
- [ ] 交互反馈一致（悬停、点击、聚焦、禁用）
- [ ] 动画时长合理 (150-300ms)
- [ ] 考虑了深色模式适配

---

## 参考资源

- 设计文件：Figma（如有）
- 组件库：Naive UI
- 工具类：UnoCSS
