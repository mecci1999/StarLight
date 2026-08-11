fn main() {
    tauri_plugin::Builder::new(&["open_notification_settings"])
        .ios_path("ios")
        .build();
}
