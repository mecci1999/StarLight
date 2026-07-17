#!/bin/bash
# ====== iOS 模拟器编译状态检查脚本 ======

PROJECT='/Users/darwin/项目/starlight-odyssey/StarLight/src-tauri/gen/apple/tauri-app.xcodeproj'
SCHEME='tauri-app_iOS'
APP_PATH="$HOME/Library/Developer/Xcode/DerivedData/tauri-app-gnkbstmlxoaftahcvewclzrqvcuc/Build/Products/debug-iphonesimulator/星光.app"
DIST='/Users/darwin/项目/starlight-odyssey/StarLight/dist'
SRC_TSX='/Users/darwin/项目/starlight-odyssey/StarLight/src/mobile/views/OverviewV2.tsx'
SRC_SCSS='/Users/darwin/项目/starlight-odyssey/StarLight/src/mobile/views/OverviewV2.scss'

echo '════════════════════════════════════════'
echo '  🔍 iOS App 编译状态检查'
echo '════════════════════════════════════════'
echo ''

# 1. 源码最后修改时间
echo '📝 源码最后修改时间:'
stat -f '  OverviewV2.tsx:  %Sm' "$SRC_TSX"
stat -f '  OverviewV2.scss: %Sm' "$SRC_SCSS"
echo ''

# 2. dist 构建产物时间
echo '📦 dist 构建产物:'
if [ -f "$DIST/index.html" ]; then
  stat -f '  构建时间: %Sm' "$DIST/index.html"
  echo '  ✅ dist 存在'
else
  echo '  ❌ dist 不存在'
fi
echo ''

# 3. Xcode 编译产物时间
echo '🏗️  .app 编译产物:'
if [ -d "$APP_PATH" ]; then
  stat -f '  编译时间: %Sm' "$APP_PATH"
  echo '  ✅ .app 存在'
else
  echo '  ❌ .app 不存在'
fi
echo ''

# 4. 模拟器已安装的 app 版本
echo '📲 模拟器状态:'
SIM_NAME='iPhone 16 Pro'
DEVICE_ID=$(xcrun simctl list devices | grep "$SIM_NAME (" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}')
BOOTED=$(xcrun simctl list devices | grep "$DEVICE_ID" | grep -c 'Booted')

echo "  设备: $SIM_NAME ($DEVICE_ID)"
[ "$BOOTED" -gt 0 ] && echo '  ✅ 已启动' || echo '  ⚠️  未启动'

# 检查 app 是否安装
INSTALLED=$(xcrun simctl listapps "$DEVICE_ID" 2>/dev/null | grep -c 'com.starlight-app.app')
[ "$INSTALLED" -gt 0 ] && echo '  ✅ App 已安装' || echo '  ❌ App 未安装'

echo ''

# 5. 对比 - 判断是否需要重新编译
echo '════════════════════════════════════════'
echo '  📊 判断结果:'
echo '════════════════════════════════════════'
echo ''

SRC_TIME=$(stat -f '%m' "$SRC_TSX" 2>/dev/null)
APP_TIME=$(stat -f '%m' "$APP_PATH" 2>/dev/null)

if [ -z "$SRC_TIME" ] || [ -z "$APP_TIME" ]; then
  echo '  ❌ 无法对比时间戳，请检查路径'
elif [ "$SRC_TIME" -gt "$APP_TIME" ]; then
  echo '  🔴 源码比 .app 新 → 需要重新编译！'
  echo "     源码: $(stat -f '%Sm' "$SRC_TSX")"
  echo "     .app: $(stat -f '%Sm' "$APP_PATH")"
else
  echo '  🟢 .app 已是最新编译版本'
  echo "     源码: $(stat -f '%Sm' "$SRC_TSX")"
  echo "     .app: $(stat -f '%Sm' "$APP_PATH")"
fi
echo ''
echo '════════════════════════════════════════'

