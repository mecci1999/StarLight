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
fn micro_app_path_segment_allowed(segment: &str) -> bool {
    !segment.is_empty()
        && segment != "."
        && segment != ".."
        && segment
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-'))
}

#[cfg(desktop)]
fn micro_app_protocol_path(raw_path: &str) -> Option<std::path::PathBuf> {
    let segments = raw_path.trim_start_matches('/').split('/').collect::<Vec<_>>();
    if segments.len() < 3 || segments.iter().any(|segment| !micro_app_path_segment_allowed(segment)) {
        return None;
    }
    let mut relative_path = std::path::PathBuf::new();
    for segment in segments {
        relative_path.push(segment);
    }
    Some(relative_path)
}

#[cfg(desktop)]
fn micro_app_label_identity(label: &str) -> Option<(&str, &str)> {
    let identity = label.strip_prefix("micro_app_")?;
    let (app_id, version) = identity.split_once(':')?;
    if micro_app_path_segment_allowed(app_id) && micro_app_path_segment_allowed(version) {
        Some((app_id, version))
    } else {
        None
    }
}

#[cfg(desktop)]
fn allows_micro_app_navigation(label: &str, url: &tauri::Url) -> bool {
    if !label.starts_with("micro_app_") {
        return true;
    }
    let Some((app_id, version)) = micro_app_label_identity(label) else {
        return false;
    };
    if url.scheme() != "starlight-micro" || url.host_str() != Some("localhost") {
        return false;
    }
    let mut segments = url.path_segments().into_iter().flatten();
    matches!((segments.next(), segments.next()), (Some(path_app_id), Some(path_version)) if path_app_id == app_id && path_version == version)
}

#[cfg(desktop)]
fn setup_desktop() {
    tauri::Builder::default()
        .register_uri_scheme_protocol("starlight-micro", |ctx, request| {
            let Some(relative_path) = micro_app_protocol_path(request.uri().path()) else {
                return tauri::http::Response::builder()
                    .status(400)
                    .body(Vec::from("invalid micro app path"))
                    .unwrap();
            };

            let Ok(app_data_dir) = ctx.app_handle().path().app_data_dir() else {
                return tauri::http::Response::builder()
                    .status(500)
                    .body(Vec::from("failed to resolve app data dir"))
                    .unwrap();
            };
            let root = app_data_dir.join("micro-apps");
            let app_id = relative_path.components().next().expect("validated micro app app id");
            let version = relative_path
                .components()
                .nth(1)
                .expect("validated micro app version");
            let package_root = root.join(app_id).join(version);
            let file_path = root.join(relative_path);
            let Ok(canonical_root) = std::fs::canonicalize(&root) else {
                return tauri::http::Response::builder()
                    .status(404)
                    .body(Vec::from("micro app storage not found"))
                    .unwrap();
            };
            let Ok(canonical_package_root) = std::fs::canonicalize(&package_root) else {
                return tauri::http::Response::builder()
                    .status(404)
                    .body(Vec::from("micro app package not found"))
                    .unwrap();
            };
            let Ok(canonical_file_path) = std::fs::canonicalize(&file_path) else {
                return tauri::http::Response::builder()
                    .status(404)
                    .body(Vec::from("micro app asset not found"))
                    .unwrap();
            };
            if !canonical_package_root.starts_with(&canonical_root)
                || !canonical_file_path.starts_with(&canonical_package_root)
            {
                return tauri::http::Response::builder()
                    .status(403)
                    .body(Vec::from("micro app path denied"))
                    .unwrap();
            }

            if !micro_app_asset_allowed(&canonical_file_path) {
                return tauri::http::Response::builder()
                    .status(403)
                    .body(Vec::from("micro app asset extension denied"))
                    .unwrap();
            }

            match std::fs::read(&canonical_file_path) {
                Ok(data) => tauri::http::Response::builder()
                    .header(tauri::http::header::CONTENT_TYPE, micro_app_content_type(&canonical_file_path))
                    .header(
                        tauri::http::header::CONTENT_SECURITY_POLICY,
                        "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; script-src 'self' starlight-micro://localhost 'unsafe-inline' blob:; style-src 'self' starlight-micro://localhost 'unsafe-inline' blob:; img-src 'self' starlight-micro://localhost data: blob:; font-src 'self' starlight-micro://localhost data:; connect-src 'self' starlight-micro://localhost https://api.starlight.host http://127.0.0.1:6670; media-src 'self' starlight-micro://localhost blob:; object-src 'none'",
                    )
                    .body(data)
                    .unwrap(),
                Err(_) => tauri::http::Response::builder()
                    .status(404)
                    .body(Vec::from("micro app asset not found"))
                    .unwrap(),
            }
        })
        .plugin(
            tauri::plugin::Builder::<tauri::Wry>::new("micro-app-navigation")
                .on_navigation(|webview, url| allows_micro_app_navigation(webview.label(), url))
                .build(),
        )
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

#[cfg(all(test, desktop))]
mod micro_app_tests {
    use super::*;

    #[test]
    fn only_allows_navigation_within_the_labeled_package_root() {
        assert!(allows_micro_app_navigation(
            "micro_app_trails:1.0.0",
            &"starlight-micro://localhost/trails/1.0.0/index.html".parse().unwrap()
        ));
        assert!(!allows_micro_app_navigation(
            "micro_app_trails:1.0.0",
            &"starlight-micro://localhost/other/1.0.0/index.html".parse().unwrap()
        ));
        assert!(!allows_micro_app_navigation(
            "micro_app_trails:1.0.0",
            &"https://example.com/".parse().unwrap()
        ));
        assert!(!allows_micro_app_navigation(
            "micro_app_trails:1.0.0",
            &"starlight-micro://localhost/trails/1.0.0/../other/index.html".parse().unwrap()
        ));
        assert!(!allows_micro_app_navigation(
            "micro_app_invalid_label",
            &"starlight-micro://localhost/trails/1.0.0/index.html".parse().unwrap()
        ));
        assert!(allows_micro_app_navigation(
            "home",
            &"https://example.com/".parse().unwrap()
        ));
    }
}

#[cfg(mobile)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn setup_mobile() {
    tauri::Builder::default()
        .init_plugin()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
