# Tauri iOS 真机打包与部署手册

> 适用范围：StarLight 当前 iOS 真机流程，以及后续星迹 App（StarTrace）复用。
>
> 本文只覆盖 **iOS 真机 Release IPA**：构建、签名、安装、验证与故障定位。模拟器调试与公开 App Store 发布是不同流程，不能替代本手册。

## 1. 已验证的流程

StarLight 当前使用 Tauri 2、Vue 前端和 Rust 移动端库。物理设备包通过以下链路生成：

```text
Rust aarch64-apple-ios Release 构建
  -> TypeScript 类型检查 + Vite 生产构建
  -> 同步 dist 到 Tauri iOS assets
  -> Xcode archive（iphoneos）
  -> 使用开发/Ad Hoc profile 导出 IPA
  -> xcrun devicectl 安装至已授权 iPhone
```

StarLight 的标准命令是：

```bash
pnpm ios:device:ipa
```

脚本：`scripts/ios-device-ipa.sh`。

该脚本会执行：

1. `cargo build --manifest-path src-tauri/Cargo.toml --target aarch64-apple-ios --release`
2. `pnpm build`（包含 `vue-tsc --noEmit`）
3. 将 `dist/` 复制到 `src-tauri/gen/apple/assets/` 和 `src-tauri/gen/apple/dist/`
4. 归档 Xcode scheme `tauri-app_iOS`
5. 导出签名 IPA 和 SHA-256 文件

## 2. 前置条件

### 2.1 macOS、Xcode 与 Rust

- 必须在 macOS 上运行；Linux/Windows 不能生成可安装的 iOS IPA。
- 已安装完整 Xcode、iPhoneOS SDK、Xcode command line tools。
- 已安装 Rust iOS 目标：

```bash
rustup target add aarch64-apple-ios
```

- iPhone 已通过 USB 或无线调试连接、已信任开发电脑，并已启用开发者模式。
- 使用 `xcrun devicectl list devices` 确认设备可见。

### 2.2 Apple 签名材料

本机钥匙串中必须存在可用的代码签名身份；用下面命令检查：

```bash
security find-identity -v -p codesigning
```

真机开发分发通常使用 **Apple Development** 身份和 Xcode 管理的 development profile。Ad Hoc 分发需要对应的 Ad Hoc profile，且 profile 必须包含目标设备 UDID。

**绝对不要**提交以下内容到仓库、日志或文档：

- `.p12` 证书及密码
- provisioning profile 原文件
- Apple ID、app-specific password、私钥
- 完整设备 UDID
- `scripts/mobile-signing.env`

StarLight 已将 `scripts/mobile-signing.env` 忽略；星迹 App 必须保持同样规则。

### 2.3 不可变身份

已有安装包升级时，以下信息必须连续：

- iOS bundle ID
- 签名团队和可用签名链
- iOS `CFBundleVersion`（每次发布必须递增）
- 应用版本号（用户可见版本）

StarLight 当前 bundle ID：`com.starlight-app.app`。星迹 App 必须使用自己的稳定 bundle ID，不能复制 StarLight 的标识。

## 3. 签名配置

### 3.1 推荐：自动签名（开发真机）

适用于开发设备、内部测试设备；Xcode 管理 profile：

```bash
export STARLIGHT_IOS_SIGNING_STYLE=automatic
export STARLIGHT_IOS_DEVELOPMENT_TEAM='<APPLE_TEAM_ID>'
export STARLIGHT_IOS_CODE_SIGN_IDENTITY='Apple Development: <name> (<certificate-id>)'
pnpm ios:device:ipa
```

`STARLIGHT_IOS_CODE_SIGN_IDENTITY` 是脚本的必需保护输入；automatic 模式下，Xcode archive 主要依据 `DEVELOPMENT_TEAM` 自动选择 profile。

### 3.2 手动签名（Ad Hoc 或受控 profile）

适用于明确管理 profile 的授权设备分发：

```bash
export STARLIGHT_IOS_SIGNING_STYLE=manual
export STARLIGHT_IOS_DEVELOPMENT_TEAM='<APPLE_TEAM_ID>'
export STARLIGHT_IOS_CODE_SIGN_IDENTITY='Apple Development: <name> (<certificate-id>)'
export STARLIGHT_IOS_PROVISIONING_PROFILE_SPECIFIER='<profile-name>'
export STARLIGHT_IOS_EXPORT_METHOD=ad-hoc
pnpm ios:device:ipa
```

可选导出方法：`development`、`ad-hoc`。脚本会拒绝其他值。

### 3.3 本地私密环境文件

可将上述变量保存在本机未追踪的 `scripts/mobile-signing.env`，不要写入 shell history 或提交到 Git：

```bash
STARLIGHT_IOS_SIGNING_STYLE=automatic
STARLIGHT_IOS_DEVELOPMENT_TEAM=<APPLE_TEAM_ID>
STARLIGHT_IOS_CODE_SIGN_IDENTITY=Apple Development: <name> (<certificate-id>)
```

星迹 App 建议复制同样的脚本读取方式，使用自己的变量前缀，例如 `STARTRACE_IOS_*`，避免两个项目的签名配置混用。

## 4. 构建与产物验收

在项目根目录执行：

```bash
pnpm ios:device:ipa
```

StarLight 输出：

```text
build/releases/<version>/StarLight_<version>_iphoneos-arm64.ipa
build/releases/<version>/StarLight_<version>_iphoneos-arm64.ipa.sha256
```

校验 IPA：

```bash
shasum -a 256 -c "build/releases/<version>/StarLight_<version>_iphoneos-arm64.ipa.sha256"
```

还应执行最低代码校验：

```bash
pnpm test:run
pnpm build
cargo check --target aarch64-apple-ios --manifest-path src-tauri/Cargo.toml
```

如果只验证移动端重点测试，可使用项目的 mobile focused test 路径；发布前仍建议运行完整 `pnpm test:run`。

### 4.1 发包前配置一致性检查

不要把 `src-tauri/gen/apple/` 下的生成文件当作唯一配置来源。StarLight 当前存在历史生成文件与实际 IPA 流程不完全一致的情况：

- `scripts/ios-device-ipa.sh` 是物理设备 IPA 的实际执行入口，并定义当前导出 bundle ID 与产物命名。
- `src-tauri/gen/apple/tauri-app.xcodeproj` 是 archive 实际使用的 Xcode 工程。
- `package.json` 决定 IPA 脚本使用的版本号和 release 目录。
- `src-tauri/tauri.ios.conf.json`、`src-tauri/gen/apple/project.yml` 与生成 `ExportOptions.plist` 可能是旧生成状态，必须在版本、bundle ID、最低系统版本与导出方法方面与前述实际入口核对；不能直接沿用其中的过期值。

星迹 App 建议将 bundle ID、version、build number 和 Xcode scheme 定义在单一可追溯配置源中，并在每次 `tauri ios init` 或重新生成 Apple 工程后运行一次一致性检查。

## 5. 安装和启动真机

从 archive 中安装 `.app`，而不是尝试直接用 `devicectl` 安装 IPA：

```bash
xcrun devicectl device install app \
  --device '<DEVICE_ID>' \
  "build/ios/StarLight-<version>-device.xcarchive/Products/Applications/星光.app"
```

启动：

```bash
xcrun devicectl device process launch \
  --device '<DEVICE_ID>' \
  com.starlight-app.app
```

### 设备锁屏行为

`devicectl` 可以在设备锁定时完成安装，但 iOS 会拒绝远程启动，常见错误包含：

```text
Unable to launch ... because the device was not, or could not be, unlocked
```

这不是构建或签名失败。解锁设备后手动打开 App，或重新执行 launch 命令。

当前仓库没有封装物理设备安装/启动脚本；上面的 `devicectl` 是经过验证的手动操作。星迹 App 应将该命令参数化为单独脚本，但不得把设备 ID 写进版本控制。

## 6. StarLight 的关键移动端经验

### 6.1 使用生产环境 API 地址

`pnpm ios:device:ipa` 内部执行 `pnpm build`，因此会打入 `.env.production` 中的配置。发布前确认：

```text
VITE_SERVICE_URL=https://<production-api-host>
VITE_WEBSOCKET_URL=wss://<production-api-host>/ws
```

不要把开发环境地址打进真机 Release 包。

### 6.2 登录状态恢复：access token 6 小时，refresh token 3 天

当前策略：

- access token：约 6 小时。
- refresh token：3 天。
- token 同时写入 localStorage 和 cookie；冷启动时 localStorage 是恢复的可靠来源。
- App 挂载时先等待会话恢复，再渲染路由，避免首批页面请求携带过期 access token。
- iOS 的登录、验证码、扫码和 refresh-token 续签统一通过 Rust `reqwest` 原生通道 `ios_auth_post`，不依赖 WebView 的 Cookie 或响应流。
- 临时网络/服务端故障不会主动清除 refresh token；只有服务器给出明确认证失败才应要求重新登录。

星迹 App 如有相同的 token 模型，应直接复用该原则：**冷启动续签必须使用与登录相同、已验证可靠的原生网络通道。**

### 6.3 原生网络命令设计

StarLight 的 Rust 命令位于：

```text
src-tauri/src/mobiles/auth_cmd.rs
```

它具备以下约束，星迹 App 应保留：

- 固定允许的认证 endpoint 枚举，不接受任意 URL。
- 强制 HTTPS。
- 限制连接和整体超时。
- 将响应完整缓冲后再通过 Tauri IPC 返回，避免 WebView/插件流式响应卡死。
- 限制最大响应体大小。
- 前端只为认证固定端点调用该命令；普通 API 继续使用标准 HTTP 客户端。

如果星迹 App 的认证路径或 API 域名不同，更新 Rust endpoint 枚举和前端 canonical URL 判定，同时添加“iOS 重启恢复 session”测试。

### 6.4 相机扫码

对于 Tauri barcode-scanner：

- capability 中必须同时允许 `scan`、`cancel`、`check-permissions`、`request-permissions`，需要系统设置跳转时还需 `open-app-settings`。
- 在调用原生扫描前先让 Vue 完成透明预览层渲染（例如 `await nextTick()`）。
- 扫描页面需要在根 HTML/布局层切换透明状态，让原生相机穿透 WebView 背景。
- 使用 session/generation 标识防止取消、路由离开和旧扫描结果相互覆盖。

这些是原生交互可靠性要求，不是视觉优化项。

## 7. 常见故障与处置

| 现象 | 常见原因 | 处理方式 |
| --- | --- | --- |
| `No profiles ... were found` | bundle ID/profile/设备 UDID 不匹配 | 在 Apple Developer/Xcode 中确认 profile 覆盖 bundle ID 与设备；自动签名时确认 Team 正确。 |
| IPA 导出失败 | export method 与 profile 不匹配 | development profile 用 `development`；Ad Hoc profile 用 `ad-hoc`。 |
| `devicectl` 安装成功但启动被拒绝 | iPhone 锁屏 | 解锁设备后手动打开或再次 launch。 |
| 关闭 App 后重新登录 | refresh token 未保存、续签 URL/协议不匹配，或 iOS WebView 续签失败 | 确认 localStorage 写入、启动恢复在路由前执行、iOS refresh 走原生认证通道。 |
| 登录响应卡住 | WebView/插件响应流问题 | 对固定认证 endpoint 用 Rust 原生缓冲请求。 |
| 扫码有权限但画面黑/透明 | WebView 背景遮盖原生相机 | 检查扫描期 `html/#app/layout` 的透明类、原生 scan 前的 `nextTick()` 和 capability 权限。 |
| 更新安装失败 | bundle ID、签名身份/profile 或 build number 变更 | 保持应用标识和签名链连续，并递增 build number。 |
| Rust iOS target 构建失败 | target/toolchain 未安装 | `rustup target add aarch64-apple-ios`，确认 Xcode SDK 和 Rust 工具链版本一致。 |

## 8. 星迹 App 迁移清单

复制 StarLight 流程到星迹 App 前，逐项确认：

- [ ] 配置独立 `productName`、iOS bundle ID、version、build number。
- [ ] 配置独立 release 目录前缀和 IPA 文件名，例如 `StarTrace_<version>_iphoneos-arm64.ipa`。
- [ ] 将 `ios-device-ipa.sh` 复制/抽取为项目脚本，替换项目路径、Xcode scheme、bundle ID、产物名和环境变量前缀。
- [ ] 生产环境 `.env.production` 指向星迹 API 与 WebSocket。
- [ ] 认证 API 采用 HTTPS，Rust 原生认证命令仅允许星迹固定认证路径。
- [ ] 实现 access/refresh token 的本地持久化与 App 启动前恢复。
- [ ] 覆盖登录、刷新 token、退出登录、失效 refresh token、短暂网络失败、关闭重开 App 的测试。
- [ ] 审查 iOS capabilities、相机、通知、文件等每个原生插件的权限和 Info.plist 用途说明。
- [ ] 以一台授权真机完成安装、冷启动、登录、关闭重开、WebSocket、关键原生能力的验收。
- [ ] 将证书/profile/设备标识只保留在密钥系统、本机忽略文件或 CI secrets。

## 9. 建议的星迹命令约定

```json
{
  "scripts": {
    "ios:device:ipa": "bash scripts/ios-device-ipa.sh",
    "ios:sim": "bash scripts/ios-sim-build.sh",
    "ios:check": "node scripts/ios-deploy.mjs status"
  }
}
```

保持命令名与 StarLight 一致可降低维护成本；差异放在项目配置、bundle ID、scheme、产物前缀和受保护环境变量中。

## 10. 发布验收记录模板

```text
项目：StarLight / StarTrace
版本：
Bundle ID：
构建时间：
构建机器/Xcode：
签名模式：automatic / manual
导出方法：development / ad-hoc
IPA SHA-256：
测试：pnpm test:run（结果）
类型与 Web 构建：pnpm build（结果）
Rust iOS 检查：cargo check --target aarch64-apple-ios（结果）
安装设备：已授权设备（不记录完整 UDID）
真机验收：安装 / 冷启动 / 登录 / 关闭重开 / API / WebSocket / 原生能力
备注：
```
