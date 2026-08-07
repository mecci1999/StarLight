#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_TAURI="$ROOT/src-tauri"
PROJECT="$SRC_TAURI/gen/apple/tauri-app.xcodeproj"
SCHEME="tauri-app_iOS"
BUNDLE_ID="com.starlight-app.app"
VERSION="$(node -p "require('./package.json').version" 2>/dev/null || true)"
SIGNING_ENV="$ROOT/scripts/mobile-signing.env"
DERIVED_DATA="${STARLIGHT_IOS_DERIVED_DATA:-$ROOT/build/ios/device-derived-data}"
ARCHIVE_PATH="${STARLIGHT_IOS_ARCHIVE_PATH:-$ROOT/build/ios/StarLight-${VERSION}-device.xcarchive}"

usage() {
  cat <<'EOF'
Usage: pnpm ios:device:ipa

Archives an arm64 iphoneos Release build and exports a device-installable IPA.
Requires STARLIGHT_IOS_DEVELOPMENT_TEAM and STARLIGHT_IOS_CODE_SIGN_IDENTITY from
protected environment variables or scripts/mobile-signing.env. Set
STARLIGHT_IOS_SIGNING_STYLE=automatic for an Xcode-managed Personal Team profile;
otherwise STARLIGHT_IOS_PROVISIONING_PROFILE_SPECIFIER is also required. The export
method must be development or ad-hoc; the selected profile must authorize every target device.
EOF
}

if [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -f "$SIGNING_ENV" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$SIGNING_ENV"
  set +a
fi

signing_style="${STARLIGHT_IOS_SIGNING_STYLE:-manual}"
if [[ "$signing_style" != "manual" && "$signing_style" != "automatic" ]]; then
  echo 'STARLIGHT_IOS_SIGNING_STYLE must be manual or automatic.' >&2
  exit 1
fi

if [[ "$signing_style" == "automatic" ]]; then
  xcode_signing_style='Automatic'
else
  xcode_signing_style='Manual'
fi

required=(STARLIGHT_IOS_DEVELOPMENT_TEAM STARLIGHT_IOS_CODE_SIGN_IDENTITY)
if [[ "$signing_style" == "manual" ]]; then
  required+=(STARLIGHT_IOS_PROVISIONING_PROFILE_SPECIFIER)
fi
missing=()
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || missing+=("$name")
done

export_method="${STARLIGHT_IOS_EXPORT_METHOD:-development}"
if [[ "$export_method" != "development" && "$export_method" != "ad-hoc" ]]; then
  echo 'STARLIGHT_IOS_EXPORT_METHOD must be development or ad-hoc.' >&2
  exit 1
fi
if (( ${#missing[@]} )); then
  printf 'Physical-device iOS export requires: %s\n' "${missing[*]}" >&2
  printf 'Use protected environment variables or scripts/mobile-signing.env; see docs/RELEASE_GUIDE.md.\n' >&2
  exit 1
fi
[[ -n "$VERSION" ]] || { echo 'Unable to read package version.' >&2; exit 1; }
[[ -d "$PROJECT" ]] || { echo "Missing Xcode project: $PROJECT" >&2; exit 1; }

export_dir="$(mktemp -d "${TMPDIR:-/tmp}/starlight-export.XXXXXX")"
export_options="$export_dir/ExportOptions.plist"
cleanup() { rm -rf "$export_dir"; }
trap cleanup EXIT

cat > "$export_options" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>$export_method</string>
  <key>signingStyle</key>
  <string>$signing_style</string>
  <key>teamID</key>
  <string>$STARLIGHT_IOS_DEVELOPMENT_TEAM</string>
</dict>
</plist>
EOF

if [[ "$signing_style" == "manual" ]]; then
  plutil -replace provisioningProfiles -xml "<dict><key>$BUNDLE_ID</key><string>$STARLIGHT_IOS_PROVISIONING_PROFILE_SPECIFIER</string></dict>" "$export_options"
fi

cd "$ROOT"
echo '[1/5] Building Rust for physical arm64 iOS devices...'
cargo build --manifest-path "$SRC_TAURI/Cargo.toml" --target aarch64-apple-ios --release
mkdir -p "$SRC_TAURI/gen/apple/Externals/arm64/release"
cp "$SRC_TAURI/target/aarch64-apple-ios/release/libtauri_app_lib.a" \
  "$SRC_TAURI/gen/apple/Externals/arm64/release/libapp.a"

echo '[2/5] Building typed production frontend with .env.production...'
rm -rf "$ROOT/dist"
pnpm build

echo '[3/5] Synchronizing production frontend resources...'
rm -rf "$SRC_TAURI/gen/apple/assets" "$SRC_TAURI/gen/apple/dist"
cp -R "$ROOT/dist" "$SRC_TAURI/gen/apple/assets"
cp -R "$ROOT/dist" "$SRC_TAURI/gen/apple/dist"

echo '[4/5] Archiving signed arm64 iphoneos Release app...'
if [[ "$signing_style" == "automatic" ]]; then
  xcodebuild \
    -project "$PROJECT" \
    -scheme "$SCHEME" \
    -sdk iphoneos \
    -configuration release \
    -destination 'generic/platform=iOS' \
    -derivedDataPath "$DERIVED_DATA" \
    -archivePath "$ARCHIVE_PATH" \
    CODE_SIGN_STYLE="$xcode_signing_style" \
    DEVELOPMENT_TEAM="$STARLIGHT_IOS_DEVELOPMENT_TEAM" \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    archive
else
  xcodebuild \
    -project "$PROJECT" \
    -scheme "$SCHEME" \
    -sdk iphoneos \
    -configuration release \
    -destination 'generic/platform=iOS' \
    -derivedDataPath "$DERIVED_DATA" \
    -archivePath "$ARCHIVE_PATH" \
    CODE_SIGN_STYLE="$xcode_signing_style" \
    DEVELOPMENT_TEAM="$STARLIGHT_IOS_DEVELOPMENT_TEAM" \
    CODE_SIGN_IDENTITY="$STARLIGHT_IOS_CODE_SIGN_IDENTITY" \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    archive
fi

echo '[5/5] Exporting signed device IPA and SHA-256 metadata...'
ipa_export_dir="$export_dir/ipa"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$ipa_export_dir" \
  -exportOptionsPlist "$export_options"

ipa_candidates=("$ipa_export_dir"/*.ipa)
(( ${#ipa_candidates[@]} == 1 )) || { echo "Expected exactly one exported IPA, found ${#ipa_candidates[@]}." >&2; exit 1; }
release_dir="$ROOT/build/releases/$VERSION"
mkdir -p "$release_dir"
artifact="$release_dir/StarLight_${VERSION}_iphoneos-arm64.ipa"
cp "${ipa_candidates[0]}" "$artifact"
(cd "$release_dir" && shasum -a 256 "$(basename "$artifact")" > "$(basename "$artifact").sha256")
printf 'Signed iOS device IPA: %s\n' "$artifact"
