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
- Keep Apple certificates, notarization credentials, Windows signing keys, provisioning profiles, and Tauri updater private keys exclusively in protected secret storage. Do not commit them or place them in release assets.

## Tauri updater

Updater signing is currently disabled. Before enabling it, generate one durable key pair, commit only its public key in the Tauri configuration, put the private key in a protected CI secret as `TAURI_SIGNING_PRIVATE_KEY`, and publish signed artifacts through HTTPS. Loss of the private key prevents updates for existing installs.

## iOS distribution

The existing `ios:build` command creates a simulator Debug app only. A TestFlight/App Store IPA requires Apple Developer Program membership, an App Store Connect app record, Apple Distribution signing, and an App Store provisioning profile. Use a dedicated macOS release job with those protected credentials; do not distribute the simulator app as an IPA.
