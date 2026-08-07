# StarLight release guide

## Supported desktop artifacts

| Platform | Architecture | Artifact | Build environment |
| --- | --- | --- | --- |
| macOS | Apple Silicon | DMG | macOS ARM64 |
| macOS | Intel | DMG | macOS Intel or matching GitHub Actions runner |
| Windows | x64 | NSIS EXE and WiX MSI | Windows-native runner |

The GitHub Actions workflow in `.github/workflows/release.yml` builds these artifacts for version tags matching `v*`, uploads them to the matching GitHub Release, and includes SHA-256 checksum files.

## Local commands

```bash
pnpm tauri:build:macos
pnpm tauri:build:windows
```

The Windows command is only supported on Windows for production output. Do not publish an installer cross-compiled from macOS as a replacement for a Windows-native build.

## Signing policy

- A publicly downloadable macOS DMG must use a Developer ID Application certificate and be notarized before publication. The local Apple Development certificate is only for development/device testing.
- A public Windows installer should use Authenticode signing to avoid SmartScreen/reputation warnings.
- Keep Android keystores/passwords, Apple certificates, notarization credentials, Windows signing keys, provisioning profiles, and Tauri updater private keys exclusively in protected secret storage. Do not commit them or place them in release assets.
- `scripts/mobile-signing.env` is ignored. Copy `scripts/mobile-signing.env.example` locally only when protected CI environment variables are not available. Do not add a keystore, certificate, profile, password, Apple account, or device identifier to source control.

## Tauri updater

Updater signing is currently disabled. Before enabling it, generate one durable key pair, commit only its public key in the Tauri configuration, put the private key in a protected CI secret as `TAURI_SIGNING_PRIVATE_KEY`, and publish signed artifacts through HTTPS. Loss of the private key prevents updates for existing installs.

## Authorized mobile-device distribution

Mobile releases use stable platform-specific identities: iOS uses bundle ID `com.starlight-app.app`, while Android uses application ID `com.starlight_app.app`. Keep each platform's identifier and release version continuous: changing either prevents an ordinary install from updating an authorized-device installation. Android `versionCode` and iOS `CFBundleVersion` must increase for each update.

The mobile scripts rebuild the frontend through `pnpm build`, so the packaged assets use the existing `.env.production` values: `https://api.starlight.host` and `wss://api.starlight.host/ws`. COS/CDN upload, hosting, and distribution are explicitly out of scope; release engineers transfer verified artifacts only through an approved private channel.

### Android signed Release APK

Minimum protected inputs are:

```text
STARLIGHT_ANDROID_KEYSTORE_PATH
STARLIGHT_ANDROID_KEYSTORE_PASSWORD
STARLIGHT_ANDROID_KEY_ALIAS
STARLIGHT_ANDROID_KEY_PASSWORD
```

Build a signed arm64-v8a Release APK:

```bash
pnpm android:release
```

The command refuses to run without all inputs, builds no debug APK, and writes only these new mobile artifacts to `build/releases/<version>/`:

```text
StarLight_<version>_arm64-v8a.apk
StarLight_<version>_arm64-v8a.apk.sha256
```

On the authorized Android device, verify the checksum before transfer, enable installation from the approved transfer app only for this install, install the APK, open StarLight, and confirm login/API and WebSocket connectivity. For a manual update, verify the next APK checksum and install it over the existing app; Android accepts it only when the application ID and signing certificate are unchanged.

### iOS physical-device IPA

`ios:build` and `ios:sim` remain simulator Debug workflows. They do not create an installable physical-device IPA.

Minimum protected/non-secret signing selectors are:

```text
STARLIGHT_IOS_DEVELOPMENT_TEAM
STARLIGHT_IOS_CODE_SIGN_IDENTITY
STARLIGHT_IOS_PROVISIONING_PROFILE_SPECIFIER
STARLIGHT_IOS_EXPORT_METHOD=development # or ad-hoc
```

The referenced signing identity must exist in the macOS keychain, and the selected development or ad-hoc provisioning profile must authorize the target device. Archive and export only after those prerequisites are satisfied:

```bash
pnpm ios:device:ipa
```

This macOS-only command builds Rust for `aarch64-apple-ios`, builds typed production frontend assets, archives a `Release` `iphoneos` app with explicit manual signing inputs, generates a temporary ExportOptions.plist, and exports:

```text
StarLight_<version>_iphoneos-arm64.ipa
StarLight_<version>_iphoneos-arm64.ipa.sha256
```

Both files are staged in `build/releases/<version>/`; the temporary export settings are deleted. Verify the IPA checksum before installation. Install only through a method permitted by the selected profile onto an authorized/provisioned device, then open the app and confirm login/API and WebSocket connectivity. A manual iOS update must use the same bundle ID and an eligible signing/provisioning chain, or iOS will reject it.
