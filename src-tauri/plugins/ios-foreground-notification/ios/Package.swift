// swift-tools-version:5.5
import PackageDescription

let package = Package(
  name: "ios-foreground-notification",
  platforms: [.iOS(.v13)],
  products: [
    .library(
      name: "ios-foreground-notification",
      type: .static,
      targets: ["ios-foreground-notification"])
  ],
  dependencies: [
    .package(name: "Tauri", path: "../.tauri/tauri-api")
  ],
  targets: [
    .target(
      name: "ios-foreground-notification",
      dependencies: [.byName(name: "Tauri")],
      path: "Sources")
  ])
