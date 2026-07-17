#!/bin/bash
set -e

SRC_TAURI="$(dirname "$0")/../src-tauri"
PROJECT="$SRC_TAURI/gen/apple/tauri-app.xcodeproj"
SCHEME="tauri-app_iOS"
BUNDLE_ID="com.starlight-app.app"
APP_PATH="$HOME/Library/Developer/Xcode/DerivedData/tauri-app-gnkbstmlxoaftahcvewclzrqvcuc/Build/Products/debug-iphonesimulator/星光.app"
SIM_NAME="${SIM_NAME:-iPhone 16}"

echo "🔨 编译 Rust (aarch64-apple-ios-sim)..."
cd "$SRC_TAURI"
cargo build --target aarch64-apple-ios-sim

echo "📦 复制 libapp.a 到 Externals..."
mkdir -p gen/apple/Externals/arm64-sim/debug
cp target/aarch64-apple-ios-sim/debug/libtauri_app_lib.a gen/apple/Externals/arm64-sim/debug/libapp.a

echo "🏗️ Xcode 构建..."
xcodebuild -project "$PROJECT" -scheme "$SCHEME" -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=$SIM_NAME" \
  -configuration debug build -quiet

echo "📲 安装到模拟器..."
DEVICE_ID=$(xcrun simctl list devices | grep "$SIM_NAME (" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}')

if [ -z "$DEVICE_ID" ]; then
  echo "❌ 未找到模拟器: $SIM_NAME"
  exit 1
fi

BOOT_STATUS=$(xcrun simctl list devices | grep "$DEVICE_ID" | grep -o '(Booted)')
if [ -z "$BOOT_STATUS" ]; then
  echo "🔌 启动模拟器..."
  xcrun simctl boot "$DEVICE_ID"
  sleep 5
fi

xcrun simctl install "$DEVICE_ID" "$APP_PATH"
xcrun simctl launch "$DEVICE_ID" "$BUNDLE_ID"

echo "✅ 完成！app 已在模拟器中运行"
