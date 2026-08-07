#!/bin/bash
set -euo pipefail
shopt -s nullglob

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/src-tauri/gen/android"
VERSION="$(node -p "require('./package.json').version" 2>/dev/null || true)"
SIGNING_ENV="$ROOT/scripts/mobile-signing.env"

usage() {
  cat <<'EOF'
Usage: pnpm android:release

Builds only a signed arm64-v8a Android Release APK and stages it with SHA-256.
Provide STARLIGHT_ANDROID_KEYSTORE_PATH, STARLIGHT_ANDROID_KEYSTORE_PASSWORD,
STARLIGHT_ANDROID_KEY_ALIAS, and STARLIGHT_ANDROID_KEY_PASSWORD through protected
environment variables or the ignored scripts/mobile-signing.env file.
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

required=(
  STARLIGHT_ANDROID_KEYSTORE_PATH
  STARLIGHT_ANDROID_KEYSTORE_PASSWORD
  STARLIGHT_ANDROID_KEY_ALIAS
  STARLIGHT_ANDROID_KEY_PASSWORD
)
missing=()
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || missing+=("$name")
done

if (( ${#missing[@]} )); then
  printf 'Signed Android release requires: %s\n' "${missing[*]}" >&2
  printf 'Use protected environment variables or scripts/mobile-signing.env; see docs/RELEASE_GUIDE.md.\n' >&2
  exit 1
fi

[[ -n "$VERSION" ]] || { echo "Unable to read package version." >&2; exit 1; }
[[ -f "$STARLIGHT_ANDROID_KEYSTORE_PATH" ]] || { echo "Android keystore does not exist: $STARLIGHT_ANDROID_KEYSTORE_PATH" >&2; exit 1; }

cd "$ROOT"
echo '[1/3] Preparing typed production frontend with .env.production...'
echo '[2/3] Building signed arm64 Android Release APK...'
pnpm tauri android build --config src-tauri/tauri.android.conf.json --target aarch64

apk_candidates=("$ANDROID_DIR"/app/build/outputs/apk/arm64/release/*.apk)
(( ${#apk_candidates[@]} == 1 )) || { echo "Expected exactly one arm64 Release APK, found ${#apk_candidates[@]}." >&2; exit 1; }

release_dir="$ROOT/build/releases/$VERSION"
mkdir -p "$release_dir"
artifact="$release_dir/StarLight_${VERSION}_arm64-v8a.apk"
cp "${apk_candidates[0]}" "$artifact"

echo '[3/3] Writing SHA-256 metadata...'
(cd "$release_dir" && shasum -a 256 "$(basename "$artifact")" > "$(basename "$artifact").sha256")
printf 'Signed Android Release APK: %s\n' "$artifact"
