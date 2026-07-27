#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_TAURI="$ROOT/src-tauri"
PROJECT="$SRC_TAURI/gen/apple/tauri-app.xcodeproj"
SCHEME="tauri-app_iOS"
BUNDLE_ID="com.starlight-app.app"
SIM_NAME="${SIM_NAME:-iPhone 16}"
DEVICE_ID="${DEVICE_ID:-}"
DERIVED_DATA="${DERIVED_DATA:-$HOME/Library/Developer/Xcode/DerivedData/tauri-app-starlight-build}"
APP_PATH="${APP_PATH:-$DERIVED_DATA/Build/Products/debug-iphonesimulator/星光.app}"

cd "$ROOT"

if [ -z "$DEVICE_ID" ]; then
  DEVICE_ID="$(xcrun simctl list devices available | awk -v name="$SIM_NAME" 'index($0, name " (") { match($0, /[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}/); if (RSTART) { print substr($0, RSTART, RLENGTH); exit } }')"
fi

if [ -z "$DEVICE_ID" ]; then
  echo "找不到可用模拟器: $SIM_NAME" >&2
  echo "可通过 SIM_NAME='iPhone 16 Pro' 或 DEVICE_ID=<UDID> pnpm ios:build 重新指定。" >&2
  exit 1
fi

echo "[1/6] 编译 Rust..."
cargo build --manifest-path "$SRC_TAURI/Cargo.toml" --target aarch64-apple-ios-sim
mkdir -p "$SRC_TAURI/gen/apple/Externals/arm64-sim/debug"
cp "$SRC_TAURI/target/aarch64-apple-ios-sim/debug/libtauri_app_lib.a" \
  "$SRC_TAURI/gen/apple/Externals/arm64-sim/debug/libapp.a"

echo "[2/6] 编译前端..."
rm -rf "$ROOT/dist"
pnpm vite build

echo "[3/6] 同步前端资源到 Xcode..."
rm -rf "$SRC_TAURI/gen/apple/assets" "$SRC_TAURI/gen/apple/dist"
cp -R "$ROOT/dist" "$SRC_TAURI/gen/apple/assets"
cp -R "$ROOT/dist" "$SRC_TAURI/gen/apple/dist"

echo "[4/6] 构建 iOS 模拟器 App..."
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,id=$DEVICE_ID" \
  -configuration debug \
  -derivedDataPath "$DERIVED_DATA" \
  build

if [ ! -d "$APP_PATH" ]; then
  echo "找不到 App Bundle: $APP_PATH" >&2
  echo "可通过 APP_PATH=/path/to/星光.app pnpm ios:sim 重新指定。" >&2
  exit 1
fi

echo "[5/6] 覆盖 App Bundle 前端资源..."
rm -rf "$APP_PATH/assets"
cp -R "$ROOT/dist" "$APP_PATH/assets"

echo "[6/6] 安装并启动模拟器 App..."
xcrun simctl bootstatus "$DEVICE_ID" -b
xcrun simctl install "$DEVICE_ID" "$APP_PATH"
xcrun simctl launch --terminate-running-process "$DEVICE_ID" "$BUNDLE_ID"

echo "✅ 六步完成：$SIM_NAME ($DEVICE_ID)"
