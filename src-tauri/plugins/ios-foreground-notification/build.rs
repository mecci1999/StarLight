fn main() {
    tauri_plugin::Builder::new(&[
        "open_notification_settings",
        "get_notification_authorization_status",
        "request_notification_authorization",
        "show_local_notification",
    ])
    .ios_path("ios")
    .build();
}
