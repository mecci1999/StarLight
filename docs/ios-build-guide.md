# iOS 编译部署指南

## 完整编译流程

每次修改前端代码后，按以下顺序执行：

### 1. 编译 Rust
```bash
cd src-tauri
cargo build --target aarch64-apple-ios-sim
mkdir -p gen/apple/Externals/arm64-sim/debug
cp target/aarch64-apple-ios-sim/debug/libtauri_app_lib.a gen/apple/Externals/arm64-sim/debug/libapp.a
```

### 2. 编译前端
```bash
pnpm vite build
```

### 3. 同步前端产物到 Xcode
```bash
rm -rf src-tauri/gen/apple/assets src-tauri/gen/apple/dist
cp -r dist src-tauri/gen/apple/assets
cp -r dist src-tauri/gen/apple/dist
```

### 4. Xcode 构建
```bash
xcodebuild -project src-tauri/gen/apple/tauri-app.xcodeproj \
  -scheme "tauri-app_iOS" \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 16" \
  -configuration debug \
  -derivedDataPath "$HOME/Library/Developer/Xcode/DerivedData/tauri-app-starlight-build" \
  build
```

### 5. ⚠️ 关键步骤：替换 App Bundle 中的前端产物

**Xcode 构建完成后，必须在上一步 Xcode build 完成后，直接把最新的 dist 覆盖到最终的 App bundle 里：**
```bash
APP="$HOME/Library/Developer/Xcode/DerivedData/tauri-app-starlight-build/Build/Products/debug-iphonesimulator/星光.app"
rm -rf "$APP/assets"
cp -r dist "$APP/assets"
```

### 6. 安装并启动
```bash
DEVICE_ID="${DEVICE_ID:-<your-simulator-udid>}"
xcrun simctl bootstatus "$DEVICE_ID" -b
xcrun simctl install "$DEVICE_ID" "$APP"
xcrun simctl launch --terminate-running-process "$DEVICE_ID" "com.starlight-app.app"
```

## 常见问题

### Q: 修改了代码但 App 里看不到变化？
**A:** 检查步骤 5。当前 `src-tauri/tauri.ios.conf.json` 的 `beforeBuildCommand` 为 `echo skip`，所以脚本会显式编译前端，并在 Xcode build 完成后再次覆盖 App Bundle 的 `assets`。

### Q: 怎么验证 App 加载的是我们编译的前端？
**A:** 查看 App 包里的 index.html 引用的 JS 文件名，和 dist/index.html 对比是否一致：
```bash
grep "script.*index" "$APP/assets/index.html"
grep "script.*index" dist/index.html
```

### Q: `git checkout -- src/mobile/` 后文件被恢复了？
**A:** `src/mobile/` 下的所有文件都是 untracked 状态（未加入 git），`git checkout` 不会恢复它们。但如果用 `git checkout -- src/mobile/` 恢复了 `src/router/index.ts`（tracked 文件），需要重新修改路由配置。

### Q: 模拟器缓存问题？
**A:** 彻底清理：
```bash
# 杀掉模拟器
killall Simulator
xcrun simctl shutdown all

# 清理 DerivedData
rm -rf "$HOME/Library/Developer/Xcode/DerivedData/tauri-app-*"

# 清理 App 数据缓存
rm -rf "$HOME/Library/Developer/CoreSimulator/Devices/$DEVICE_ID/data/Containers/Data/Application"/*
```

### Q: 登录历史记录消失？
**A:** 卸载重装 App 会清除所有本地存储（localStorage/IndexedDB/pinia 持久化数据），这是正常行为。如果需要保留数据，不要卸载 App，只替换 App bundle 里的 assets 然后通过 `xcrun simctl launch` 重启。

### Q: beforeBuildCommand 可以禁用吗？
**A:** 当前配置已经使用 `"beforeBuildCommand": "echo skip"`。如需临时恢复自动前端构建，请修改配置后再执行六步命令，并不要提交临时改动。

## 一键脚本

现在可以在项目根目录直接执行完整的六步流程：

```bash
pnpm ios:build
```

默认使用 `iPhone 16` 模拟器。如果本机设备名称不同，可以覆盖模拟器名称或直接指定 UDID：

```bash
SIM_NAME="iPhone 16 Pro" pnpm ios:build
DEVICE_ID="<your-simulator-udid>" pnpm ios:build
```

脚本会自动完成 Rust、前端、Xcode 构建、App Bundle 资源覆盖、模拟器安装和启动。

脚本使用固定的项目 DerivedData 目录，不依赖 Xcode 自动生成的随机 DerivedData 后缀；如需修改目录，可覆盖 `DERIVED_DATA` 环境变量。模拟器会按名称解析 UDID，也可以通过 `DEVICE_ID` 覆盖。
