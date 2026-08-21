#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('./package.json').version")"
APP="$ROOT/src-tauri/target/release/bundle/macos/星光.app"
DMG="$ROOT/src-tauri/target/release/bundle/dmg/星光_${VERSION}_aarch64.dmg"
RELEASE_DIR="$ROOT/build/releases/$VERSION"
APP_ARCHIVE="$RELEASE_DIR/StarLight_${VERSION}_macos-aarch64.app.zip"
DMG_ARCHIVE="$RELEASE_DIR/StarLight_${VERSION}_macos-aarch64.dmg"

cd "$ROOT"
pnpm tauri:build:macos

[[ -d "$APP" ]] || { echo "Missing macOS app bundle: $APP" >&2; exit 1; }
[[ -f "$DMG" ]] || { echo "Missing macOS DMG: $DMG" >&2; exit 1; }

mkdir -p "$RELEASE_DIR"
rm -f "$APP_ARCHIVE" "$APP_ARCHIVE.sha256" "$DMG_ARCHIVE" "$DMG_ARCHIVE.sha256"
ditto -c -k --sequesterRsrc --keepParent "$APP" "$APP_ARCHIVE"
cp "$DMG" "$DMG_ARCHIVE"

(
  cd "$RELEASE_DIR"
  shasum -a 256 "$(basename "$APP_ARCHIVE")" > "$(basename "$APP_ARCHIVE").sha256"
  shasum -a 256 "$(basename "$DMG_ARCHIVE")" > "$(basename "$DMG_ARCHIVE").sha256"
)

printf 'macOS release artifacts staged in: %s\n' "$RELEASE_DIR"
