# 星光 Odyssey 移动端页面开发指南

## 一、项目架构

### 技术栈
- Vue 3 Composition API + TSX
- Naive UI 组件库
- SCSS (CSS 变量来自 @/styles/variable.scss)
- Vue Router
- Vite + Tauri v2 iOS

### 目录结构
```
src/mobile/
  layout/
    MobileLayout.tsx + .scss    -- 底部 Tab 栏容器(看板/服务/告警/我的)
  views/
    Login.tsx + .scss           -- 登录页
    OverviewV2.tsx + .scss      -- 看板 Tab
    ServicesV2.tsx + .scss      -- 服务目录 Tab
    ServiceDetailV2.tsx + .scss -- 服务详情
    MobileAlertsInbox.tsx + .scss -- 告警收件箱 Tab
    MobileProfile.tsx + .scss   -- 我的 Tab
    Home.tsx                    -- 旧首页(保留)
    OnboardingNotice.tsx        -- 接入引导
```

### 组件模式(必须遵守)
```tsx
import { NButton, NInput } from 'naive-ui'
import './ComponentName.scss'

export default defineComponent({
  name: 'ComponentName',
  setup() {
    // 逻辑在这里
    return () => (
      <div class="component-name">
        {/* 模板 */}
      </div>
    )
  }
})
```

关键规则:
- 必须 `export default`, 不能是裸 `defineComponent`
- Vue API 自动导入(ref/computed/watch/useRouter/useRoute/onMounted/onUnmounted 等无需手动 import)
- Naive UI 组件需要手动 import
- 每个组件配一个同名 .scss 文件
- SCSS 中颜色一律用 CSS 变量 var(--xxx), 不硬编码

## 二、路由配置

路由文件: `src/router/index.ts`

```typescript
// 独立页面(不经过 MobileLayout, 无底部 Tab)
{ path: '/mobile/login', name: 'mobile-login', component: () => import('@/mobile/views/Login') },

// 带底部 Tab 的页面
{
  path: '/mobile',
  component: () => import('@/mobile/layout/MobileLayout'),
  children: [
    { path: 'overview-v2', name: 'mobile-overview-v2', component: () => import('@/mobile/views/OverviewV2') },
    { path: 'services-v2', name: 'mobile-services-v2', component: () => import('@/mobile/views/ServicesV2') },
    { path: 'alerts-inbox', name: 'mobile-alerts-inbox', component: () => import('@/mobile/views/MobileAlertsInbox') },
    { path: 'profile', name: 'mobile-profile', component: () => import('@/mobile/views/MobileProfile') },
  ]
}
```

规则:
- 登录页必须放在 Layout 外部(不需要 Tab 栏)
- 其他页面放在 /mobile children 下
- 路由守卫已处理桌面端/移动端自动分发

## 三、Tauri iOS 配置与构建

### 配置文件: src-tauri/tauri.ios.conf.json

```json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://127.0.0.1:6130",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{
      "url": "/mobile/login"
    }]
  }
}
```

### 前端加载机制(关键)

Tauri 源码中 AssetResolver 的 dev mode 逻辑:
```rust
if let (Some(_), Some(FrontendDist::Directory(dist_path))) = (
    &self.manager.config().build.dev_url,
    &self.manager.config().build.frontend_dist,
) {
    let asset_path = self.manager.config_parent()
        .map(|p| p.join(dist_path).join(&asset_path))
        .unwrap_or_else(|| dist_path.join(&asset_path));
    return std::fs::read(asset_path);
}
```

- devUrl 和 frontendDist 必须同时存在, 否则不会从文件系统读取前端文件
- frontendDist 路径相对于 src-tauri/ 目录, 即 ../dist = StarLight/dist/
- 纯前端改动: pnpm build + 重启模拟器 app
- Rust 配置改动: 需要完整重新编译 Rust

### 完整构建流程

```bash
# 1. 构建前端
cd StarLight && pnpm build

# 2. 编译 Rust(iOS 模拟器 target)
cd src-tauri && cargo build --target aarch64-apple-ios-sim

# 3. 复制 libapp.a 到 Xcode 期望位置
cp target/aarch64-apple-ios-sim/debug/libtauri_app_lib.a gen/apple/Externals/arm64-sim/debug/libapp.a

# 4. Xcode 构建
cd gen/apple && xcodebuild -project tauri-app.xcodeproj -scheme tauri-app_iOS \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' build

# 5. 安装到模拟器
DEVICE_ID=$(xcrun simctl list devices | grep "iPhone 16 (" | head -1 | grep -oE '[A-F0-9-]+')
xcrun simctl install "$DEVICE_ID" ~/Library/Developer/Xcode/DerivedData/tauri-app-*/Build/Products/debug-iphonesimulator/星光.app
xcrun simctl launch "$DEVICE_ID" com.starlight-app.app
```

快捷命令: `pnpm ios:sim`

### 调试
- Safari -> 开发 -> iPhone 16 Simulator -> 选择 app
- Console 查看日志, Elements 查看 DOM

## 四、样式规范

### 常用 CSS 变量

| 变量 | 值 | 用途 |
|---|---|---|
| --color-bg-1 | #ffffff | 主背景 |
| --color-bg-2 | #fafafa | 次级背景 |
| --color-bg-white | #ffffff | 白色背景 |
| --color-text-1 | #1a1a1a | 主文字 |
| --color-text-2 | #595959 | 次级文字 |
| --color-text-3 | #8c8c8c | 辅助文字 |
| --color-primary-6 | #165dff | 主题色 |
| --color-danger-6 | #f53f3f | 错误/危险 |
| --color-border-2 | #e5e6eb | 边框 |
| --shadow-lg | 0 8px 24px rgba(0,0,0,0.08) | 大阴影 |
| --radius-lg | 8px | 大圆角 |
| --font-size-title-2 | 20px | 二级标题 |
| --font-size-body-1 | 13px | 正文 |
| --font-size-caption | 11px | 辅助文字 |

### SCSS 模板

```scss
.component-name {
  padding: 16px;
  min-height: 100vh;
  background: var(--color-bg-1);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--color-text-1);
  }

  // Naive UI 组件内部样式穿透
  :deep(.n-card) {
    border-radius: 12px;
  }
}
```

规则:
- BEM 命名: block__element--modifier
- 颜色用 CSS 变量
- 移动端适配: padding 用固定 px, 字号用 CSS 变量
- Naive UI 组件用 :deep() 穿透

## 五、登录页实现要点

### 布局结构
```
.mobile-login                  // 全屏容器 + ::before 动画背景
  .mobile-login__content       // 毛玻璃卡片(width:100%, padding:40px 28px)
    .mobile-login__header      // 标题(28px) + 副标题(12px)
    .mobile-login__form        // 表单区
      .mobile-login__input-wrap // 邮箱 + 密码 + 验证码
      .mobile-login__error      // 红色错误提示
      NFlex(记住密码 + 忘记密码)
      NButton(登录)
    .mobile-login__footer      // 模式切换 + 协议
```

### 核心功能列表
1. 毛玻璃卡片: hsla(0,0%,100%,0.15) + backdrop-filter: blur(30px) + border-radius: 25px
2. 动画背景: login_bg.svg 30s hue-rotate + position 漂移动画
3. 邮箱历史: useLoginHistoriesStore(), 下拉选择自动填充, 可删除
4. 记住密码: NCheckbox
5. 验证码: 60s 倒计时, api.verifyCode() 发送, suffix 在输入框右侧
6. 模式切换: login / register / forget
7. 服务协议: NCheckbox, 未勾选时登录按钮禁用
8. 网络检测: useNetwork(), 断开时显示"网络异常"
9. 登录流程: encryptPassword() -> api.login() -> persistAuthTokens() -> persistStoredUserInfo() -> resolveAuthLandingRoute(false, userInfo) -> router.push()

### 关键认证 API
```typescript
// @/services/authSession
persistAuthTokens({ accessToken, refreshToken })
getStoredAuthTokens()
persistStoredUserInfo(userInfo)
getStoredUserInfo()
resolveAuthLandingRoute(isDesktop: boolean, userInfo: UserInfoType)
clearStoredAuthSession()

// @/api
api.login({ email, hash, code })
api.verifyCode({ email, type: 'login' })
api.getUserInfo(userId)

// @/utils/Crypto
encryptPassword(password, secretKey)

// @/store/loginHistory
useLoginHistoriesStore()    // { loginHistories, addLoginHistory, removeLoginHistory }
```

## 六、新页面开发 Checklist

1. 创建 `src/mobile/views/PageName.tsx`(export default defineComponent)
2. 创建 `src/mobile/views/PageName.scss`(BEM 命名, CSS 变量)
3. 在 `src/router/index.ts` 添加路由(有 Tab 放 children, 无 Tab 独立)
4. 运行 `npx vue-tsc --noEmit` 验证
5. `pnpm build` + 重启模拟器 app

## 七、常见问题

### Q: 改完代码模拟器里没变化?
A: 确认 dist/ 已更新(ls -la dist/index.html), 确认 devUrl+frontendDist 都在 tauri.ios.conf.json 中, 然后重启 app(terminate + launch).

### Q: 组件不渲染?
A: 检查是否加了 `export default`, RouterView 需要 import from 'vue-router'.

### Q: SCSS 变量不生效?
A: 确认使用了 var(--xxx), vite 已全局注入 @use "@/styles/variable.scss" as *, 不需要在 scss 文件里再 import.

### Q: Safari Web Inspector 连接不上?
A: Safari -> 偏好设置 -> 高级 -> 勾选"在菜单栏中显示开发菜单", 然后开发菜单 -> 模拟器 -> 选择 app.

## 八、移动端交互规范

### 键盘弹出不遮挡输入框

iOS 键盘弹出时，如果输入框在页面下半部分，会被键盘遮挡。解决方案:

**方案 1: CSS visualViewport(推荐)**
```scss
.page-container {
  height: 100dvh;                    // 动态视口高度, 键盘弹出时自动缩小
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

**方案 2: JS scrollIntoView(兜底)**
```tsx
// 在 setup 中
const inputRef = ref<HTMLInputElement>()

onMounted(() => {
  window.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      setTimeout(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 300) // 等键盘弹出动画完成
    }
  })
})
```

**方案 3: 页面级 Composable(最佳实践)**
```typescript
// src/mobile/hooks/useKeyboardAvoid.ts
export function useKeyboardAvoid() {
  onMounted(() => {
    const handler = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
      }
    }
    window.addEventListener('focusin', handler)
    onUnmounted(() => window.removeEventListener('focusin', handler))
  })
}
```

**判断标准**: 输入框在页面中位置低于 50vh 时，才需要处理键盘遮挡。顶部输入框（如登录页的邮箱/密码）一般不会被遮挡。

## 九、移动端多设备适配（clamp 流体布局）

### 核心原则

移动端不能使用固定 px 值做布局。不同设备宽度不同（iPhone SE 375px → iPhone 16 Pro Max 430px），固定 px 会导致小屏显大、大屏显小。

**所有关键尺寸（padding、margin、font-size、height）必须使用 `clamp()` 做流体适配。**

### clamp() 语法

```css
/* clamp(最小值, 流体值, 最大值) */
padding: clamp(16px, 5vw, 24px);
font-size: clamp(24px, 7vw, 30px);
```

| 设备 | 宽度 | 5vw | 7vw | 12vw |
|------|------|-----|-----|------|
| iPhone SE | 375px | 18.75px | 26.25px | 45px |
| iPhone 16 | 393px | 19.65px | 27.51px | 47.16px |
| iPhone 16 Pro Max | 430px | 21.5px | 30.1px | 51.6px |

### 参考比例

| 用途 | clamp 公式 | 说明 |
|------|-----------|------|
| 外层 padding | `clamp(16px, 5vw, 24px)` | 小屏紧凑，大屏宽松 |
| 卡片内边距 V | `clamp(36px, 12vw, 52px)` | 上下留白 |
| 卡片内边距 H | `clamp(24px, 8vw, 36px)` | 左右留白 |
| 标题字号 | `clamp(24px, 7vw, 30px)` | 大屏更大标题 |
| 输入框间距 | `clamp(16px, 5vw, 24px)` | 保持呼吸感 |
| 按钮高度 | `clamp(40px, 11vw, 48px)` | 44px 最小触摸目标 |
| header 间距 | `clamp(28px, 9vw, 40px)` | 标题到内容间距 |
| 副标题字号 | `clamp(11px, 3.2vw, 13px)` | 辅助信息 |
| 代码操作字号 | `clamp(12px, 3.5vw, 15px)` | 验证码等 |
| footer 间距 | `clamp(20px, 6vw, 28px)` | 底部留白 |

### 反例（不要用）

```scss
/* ❌ 固定 px — 不同设备视觉不一致 */
padding: 24px;
font-size: 28px;
margin-bottom: 16px;

/* ✅ clamp 流体 — 所有设备视觉一致 */
padding: clamp(16px, 5vw, 24px);
font-size: clamp(24px, 7vw, 30px);
margin-bottom: clamp(12px, 4vw, 18px);
```

### 构建流程（完整）

纯前端改动也需要重新编译 Rust（Tauri 会缓存 asset resolver 路径），完整流程:

```bash
pnpm build
rm -rf src-tauri/gen/apple/assets/static src-tauri/gen/apple/assets/index.html
cp -r dist/* src-tauri/gen/apple/assets/
cd src-tauri && cargo build --target aarch64-apple-ios-sim
cp target/aarch64-apple-ios-sim/debug/libtauri_app_lib.a gen/apple/Externals/arm64-sim/debug/libapp.a
rm -rf ~/Library/Developer/Xcode/DerivedData/tauri-app-*
cd gen/apple && xcodebuild -project tauri-app.xcodeproj -scheme tauri-app_iOS -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' build
xcrun simctl shutdown <DEVICE_ID> && xcrun simctl boot <DEVICE_ID>
xcrun simctl install <DEVICE_ID> <星光.app路径>
xcrun simctl launch <DEVICE_ID> com.starlight-app.app
```

**关键**: 必须 clean DerivedData + 重新编译 Rust，否则 Tauri 会加载旧 CSS。
