// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// 桌面端依赖
#[cfg(desktop)]
mod desktops;
#[cfg(desktop)]
use tauri::Manager;
#[cfg(desktop)]
use common_cmd::{
    default_window_icon, get_video_upscale_task_status, probe_video_upscale_runtime, screenshot,
    set_badge_count, set_height, start_video_upscale_local,
};
#[cfg(desktop)]
use desktops::common_cmd;
#[cfg(desktop)]
use desktops::init;
#[cfg(desktop)]
use desktops::tray;
#[cfg(desktop)]
use init::CustomInit;

// 移动端依赖
#[cfg(mobile)]
mod mobiles;
#[cfg(mobile)]
use init::CustomInit;
#[cfg(mobile)]
use mobiles::init;

pub fn run() {
    #[cfg(desktop)]
    {
        setup_desktop();
    }
    #[cfg(mobile)]
    {
        setup_mobile();
    }
}

#[cfg(desktop)]
fn micro_app_content_type(path: &std::path::Path) -> &'static str {
    match path.extension().and_then(|value| value.to_str()).unwrap_or_default() {
        "html" => "text/html; charset=utf-8",
        "js" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        _ => "application/octet-stream",
    }
}

#[cfg(desktop)]
fn micro_app_asset_allowed(path: &std::path::Path) -> bool {
    matches!(
        path.extension().and_then(|value| value.to_str()).unwrap_or_default(),
        "html" | "js" | "css" | "json" | "svg" | "png" | "jpg" | "jpeg" | "webp" | "woff" | "woff2" | "ttf"
    )
}

#[cfg(desktop)]
fn setup_desktop() {
    tauri::Builder::default()
        .register_uri_scheme_protocol("starlight-micro", |ctx, request| {
            let raw_path = request.uri().path().trim_start_matches('/');
            if raw_path.contains("..") || raw_path.is_empty() {
                return tauri::http::Response::builder()
                    .status(400)
                    .body(Vec::from("invalid micro app path"))
                    .unwrap();
            }

            let Ok(app_data_dir) = ctx.app_handle().path().app_data_dir() else {
                return tauri::http::Response::builder()
                    .status(500)
                    .body(Vec::from("failed to resolve app data dir"))
                    .unwrap();
            };
            let root = app_data_dir.join("micro-apps");
            let file_path = root.join(raw_path);
            if !file_path.starts_with(&root) {
                return tauri::http::Response::builder()
                    .status(403)
                    .body(Vec::from("micro app path denied"))
                    .unwrap();
            }

            if !micro_app_asset_allowed(&file_path) {
                return tauri::http::Response::builder()
                    .status(403)
                    .body(Vec::from("micro app asset extension denied"))
                    .unwrap();
            }

            match std::fs::read(&file_path) {
                Ok(data) => tauri::http::Response::builder()
                    .header(tauri::http::header::CONTENT_TYPE, micro_app_content_type(&file_path))
                    .header(
                        tauri::http::header::CONTENT_SECURITY_POLICY,
                        "default-src 'self' starlight-micro://localhost blob: data:; script-src 'self' starlight-micro://localhost 'unsafe-inline' blob:; style-src 'self' starlight-micro://localhost 'unsafe-inline' blob:; img-src 'self' starlight-micro://localhost data: blob:; connect-src 'self' http: https: starlight-micro://localhost; frame-ancestors 'self'",
                    )
                    .body(data)
                    .unwrap(),
                Err(_) => tauri::http::Response::builder()
                    .status(404)
                    .body(Vec::from("micro app asset not found"))
                    .unwrap(),
            }
        })
        .plugin(tauri_plugin_os::init())
        .init_plugin()
        .init_webwindow_event()
        .init_window_event()
        .setup(move |app| {
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            default_window_icon,
            screenshot,
            set_badge_count,
            set_height,
            probe_video_upscale_runtime,
            start_video_upscale_local,
            get_video_upscale_task_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(mobile)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn setup_mobile() {
    tauri::Builder::default()
        .init_plugin()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
