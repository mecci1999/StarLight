use base64::{engine::general_purpose, Engine as _};
use lazy_static::lazy_static;
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use std::cmp;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[cfg(unix)]
use std::os::unix::process::ExitStatusExt;
// use std::thread;
// use std::time::Duration;
// use tauri::path::BaseDirectory;
use tauri::{AppHandle, LogicalSize, Manager, ResourceId, Runtime, Webview};

// 定义用户信息结构体
#[derive(Debug, Clone, Serialize)]
pub struct UserInfo {
    user_id: i64,
    username: String,
    token: String,
    avatar: String,
}

impl UserInfo {
    pub fn new(user_id: i64, username: String, token: String, avatar: String) -> Self {
        UserInfo {
            user_id,
            username,
            token,
            avatar,
        }
    }
    // pub fn get_user_id(&self) -> Result<i64, ()> { Ok(self.user_id)}
    // pub fn get_username(&self) -> Result<&str, ()> { Ok(self.username.as_str())}
    // pub fn get_token(&self) -> Result<&str, ()> { Ok(self.token.as_str())}
}

// 定义全局用户信息
lazy_static! {
    pub static ref USER_INFO: Arc<RwLock<UserInfo>> = Arc::new(RwLock::new(UserInfo::new(
        -1,
        String::new(),
        String::new(),
        String::new()
    )));
    static ref VIDEO_UPSCALE_TASKS: Arc<RwLock<HashMap<String, VideoUpscaleTaskStatus>>> =
        Arc::new(RwLock::new(HashMap::new()));
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoUpscaleRuntimeStatus {
    ffmpeg_available: bool,
    ai_upscaler_available: bool,
    ai_upscaler_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoUpscaleTaskStatus {
    id: String,
    status: String,
    progress: u8,
    message: String,
    output_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartVideoUpscaleLocalRequest {
    input_path: String,
    output_path: String,
    model: Option<String>,
    scale: Option<u8>,
    engine: Option<String>,
    ai_binary_path: Option<String>,
}

fn candidate_binary_paths(name: &str) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    if let Some(paths) = std::env::var_os("PATH") {
        candidates.extend(std::env::split_paths(&paths).map(|dir| dir.join(name)));
    }

    candidates.push(PathBuf::from(format!("/opt/homebrew/bin/{}", name)));
    candidates.push(PathBuf::from(format!("/usr/local/bin/{}", name)));
    candidates.push(PathBuf::from(format!("/usr/bin/{}", name)));

    if let Some(home) = std::env::var_os("HOME") {
        let home = PathBuf::from(home);
        candidates.push(home.join(format!("Applications/realesrgan/{}", name)));
        candidates.push(home.join(format!("Applications/realesrgan-ncnn-vulkan/{}", name)));
        candidates.push(home.join(format!("Downloads/realesrgan-ncnn-vulkan/{}", name)));
        candidates.push(home.join(format!("Downloads/realesrgan/{}", name)));
    }

    candidates
}

fn find_binary(name: &str) -> Option<String> {
    candidate_binary_paths(name).into_iter().find_map(|binary| {
        #[cfg(target_os = "windows")]
        {
            if binary.exists() {
                return Some(binary.to_string_lossy().to_string());
            }
            let exe = PathBuf::from(format!("{}.exe", binary.to_string_lossy()));
            if exe.exists() {
                return Some(exe.to_string_lossy().to_string());
            }
            None
        }
        #[cfg(not(target_os = "windows"))]
        {
            if binary.exists() {
                Some(binary.to_string_lossy().to_string())
            } else {
                None
            }
        }
    })
}

fn find_ai_upscaler() -> Option<String> {
    if let Ok(path) = std::env::var("STARLIGHT_VIDEO_UPSCALE_BIN") {
        if !path.trim().is_empty() && PathBuf::from(&path).exists() {
            return Some(path);
        }
    }

    find_binary("realesrgan-ncnn-vulkan")
}

fn model_file_stem(model: &str) -> String {
    if model == "realesrgan-x4plus" {
        return "realesrgan-x4plus".to_string();
    }
    model.to_string()
}

fn validate_ai_model_files(ai_binary: &str, model: &str) -> Result<PathBuf, String> {
    let Some(ai_work_dir) = command_parent_dir(ai_binary) else {
        return Err("AI 引擎路径不是完整文件路径，无法定位 models 目录".to_string());
    };
    let models_dir = ai_work_dir.join("models");
    if !models_dir.exists() {
        return Err(format!(
            "Real-ESRGAN 安装不完整：缺少 models 目录（{}）。请重新解压完整 macOS portable 包，确保 models 与 realesrgan-ncnn-vulkan 在同一目录。",
            models_dir.to_string_lossy()
        ));
    }

    let stem = model_file_stem(model);
    let param_path = models_dir.join(format!("{}.param", stem));
    let bin_path = models_dir.join(format!("{}.bin", stem));
    if !param_path.exists() || !bin_path.exists() {
        return Err(format!(
            "Real-ESRGAN 安装不完整：缺少模型文件 {} 或 {}。当前模型为 {}，请重新解压完整 macOS portable 包。",
            param_path.to_string_lossy(),
            bin_path.to_string_lossy(),
            model
        ));
    }

    Ok(models_dir)
}

fn update_video_task(id: &str, status: &str, progress: u8, message: &str, output_path: Option<String>) {
    println!(
        "[VideoUpscale][task:{}] status={} progress={} message={} output_path={:?}",
        id, status, progress, message, output_path
    );
    if let Ok(mut tasks) = VIDEO_UPSCALE_TASKS.write() {
        tasks.insert(
            id.to_string(),
            VideoUpscaleTaskStatus {
                id: id.to_string(),
                status: status.to_string(),
                progress,
                message: message.to_string(),
                output_path,
            },
        );
    }
}

fn exit_status_detail(status: std::process::ExitStatus) -> String {
    if let Some(code) = status.code() {
        return format!("退出码 {}", code);
    }

    #[cfg(unix)]
    {
        if let Some(signal) = status.signal() {
            let signal_name = match signal {
                6 => "SIGABRT",
                9 => "SIGKILL",
                10 => "SIGBUS",
                11 => "SIGSEGV",
                15 => "SIGTERM",
                _ => "UNKNOWN_SIGNAL",
            };
            return format!(
                "进程被信号 {} ({}) 终止，core_dumped={}",
                signal,
                signal_name,
                status.core_dumped()
            );
        }
    }

    "进程没有正常退出，且无法读取退出码/信号".to_string()
}

fn run_command(command_name: &str, mut command: Command, failed_message: &str) -> Result<(), String> {
    println!("[VideoUpscale][command:{}] start: {:?}", command_name, command);
    let output = command.output().map_err(|error| error.to_string())?;
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let status_detail = exit_status_detail(output.status);
    println!(
        "[VideoUpscale][command:{}] finished success={} status={} stdout={} stderr={}",
        command_name,
        output.status.success(),
        status_detail,
        if stdout.is_empty() { "<empty>" } else { stdout.as_str() },
        if stderr.is_empty() { "<empty>" } else { stderr.as_str() }
    );

    if output.status.success() {
        return Ok(());
    }

    let detail = if !stderr.is_empty() {
        stderr
    } else if !stdout.is_empty() {
        stdout
    } else {
        format!("{}，但没有输出 stderr/stdout", status_detail)
    };
    Err(format!("{}：{}", failed_message, detail))
}

fn count_png_files(dir: &PathBuf) -> usize {
    std::fs::read_dir(dir)
        .map(|entries| {
            entries
                .filter_map(Result::ok)
                .filter(|entry| {
                    entry
                        .path()
                        .extension()
                        .map(|extension| extension.eq_ignore_ascii_case("png"))
                        .unwrap_or(false)
                })
                .count()
        })
        .unwrap_or(0)
}

fn run_upscale_command_with_progress(
    id: &str,
    command_name: &str,
    mut command: Command,
    failed_message: &str,
    frames_dir: &PathBuf,
    enhanced_dir: &PathBuf,
) -> Result<(), String> {
    println!("[VideoUpscale][command:{}] start: {:?}", command_name, command);
    let total_frames = count_png_files(frames_dir).max(1);
    command.stdout(Stdio::inherit()).stderr(Stdio::inherit());
    let mut child = command.spawn().map_err(|error| error.to_string())?;
    let mut last_enhanced_frames = 0usize;

    loop {
        match child.try_wait().map_err(|error| error.to_string())? {
            Some(_) => {
                let status = child.wait().map_err(|error| error.to_string())?;
                let status_detail = exit_status_detail(status);
                println!(
                    "[VideoUpscale][command:{}] finished success={} status={}",
                    command_name,
                    status.success(),
                    status_detail
                );

                if status.success() {
                    update_video_task(id, "running", 82, "Real-ESRGAN AI 超分完成，准备合成视频", None);
                    return Ok(());
                }

                return Err(format!("{}：{}", failed_message, status_detail));
            }
            None => {
                let enhanced_frames = count_png_files(enhanced_dir);
                if enhanced_frames != last_enhanced_frames {
                    last_enhanced_frames = enhanced_frames;
                    let ratio = (enhanced_frames as f64 / total_frames as f64).clamp(0.0, 1.0);
                    let progress = 45 + (ratio * 37.0).round() as u8;
                    update_video_task(
                        id,
                        "running",
                        progress.min(81),
                        &format!("Real-ESRGAN AI 超分处理中：{}/{} 帧", enhanced_frames, total_frames),
                        None,
                    );
                }
                thread::sleep(Duration::from_secs(2));
            }
        }
    }
}

fn command_parent_dir(binary_path: &str) -> Option<PathBuf> {
    let path = PathBuf::from(binary_path);
    if path.components().count() <= 1 {
        return None;
    }
    path.parent().map(|parent| parent.to_path_buf())
}

fn build_upscale_command(
    ai_binary: &str,
    ai_work_dir: Option<&PathBuf>,
    frames_dir: &PathBuf,
    enhanced_dir: &PathBuf,
    model: &str,
    scale: &str,
    tile_size: &str,
    thread_config: &str,
) -> Command {
    let mut command = Command::new(ai_binary);
    if let Some(ai_work_dir) = ai_work_dir {
        command.current_dir(ai_work_dir);
    }
    command
        .arg("-i")
        .arg(frames_dir)
        .arg("-o")
        .arg(enhanced_dir)
        .arg("-n")
        .arg(model)
        .arg("-s")
        .arg(scale)
        .arg("-t")
        .arg(tile_size)
        .arg("-j")
        .arg(thread_config)
        .arg("-f")
        .arg("png")
        .arg("-v");
    command
}

fn build_ffmpeg_fallback_command(ffmpeg_binary: &str, input_path: &str, output_path: &str) -> Command {
    let mut command = Command::new(ffmpeg_binary);
    command
        .arg("-y")
        .arg("-i")
        .arg(input_path)
        .arg("-vf")
        .arg("scale=3840:2160:flags=lanczos,hqdn3d=1.5:1.5:6:6,unsharp=5:5:0.8:3:3:0.3")
        .arg("-c:v")
        .arg("libx264")
        .arg("-pix_fmt")
        .arg("yuv420p")
        .arg("-crf")
        .arg("17")
        .arg("-preset")
        .arg("slow")
        .arg("-c:a")
        .arg("copy")
        .arg(output_path);
    command
}

// 用于获取应用程序的默认窗口图标并将其添加到资源表中
#[tauri::command]
pub fn default_window_icon<R: Runtime>(
    webview: Webview<R>,
    app: AppHandle<R>,
) -> Option<ResourceId> {
    app.default_window_icon().cloned().map(|icon| {
        let mut resources_table = webview.resources_table();
        resources_table.add(icon.to_owned())
    })
}

// #[tauri::command]
// pub fn audio(filename: &str, handle: AppHandle) {
//     use rodio::{Decoder, Source};
//     use std::fs::File;
//     use std::io::BufReader;
//     let path = "audio/".to_string() + filename;
//     thread::spawn(move || {
//         let audio_path = handle
//             .path()
//             .resolve(path, BaseDirectory::Resource)
//             .unwrap();
//         let audio = File::open(audio_path).unwrap();
//         let file = BufReader::new(audio);
//         let (_stream, stream_handle) = rodio::OutputStream::try_default().unwrap();
//         let source = Decoder::new(file).unwrap();
//         stream_handle.play_raw(source.convert_samples()).unwrap();
//         thread::sleep(Duration::from_millis(3000));
//     });
// }

// 获取屏幕中某个区域的截图
#[tauri::command]
pub fn screenshot(x: &str, y: &str, width: &str, height: &str) -> String {
    let screen = Screen::from_point(100, 100).unwrap();
    let image = screen
        .capture_area(
            x.parse::<i32>().unwrap(),
            y.parse::<i32>().unwrap(),
            width.parse::<u32>().unwrap(),
            height.parse::<u32>().unwrap(),
        )
        .unwrap();
    let buffer = image.buffer();
    let base64_str = general_purpose::STANDARD_NO_PAD.encode(buffer);
    base64_str
}

// 设置窗口高度
#[tauri::command]
pub fn set_height(height: u32, handle: AppHandle) {
    let home_window = handle.get_webview_window("home").unwrap();
    let sf = home_window.scale_factor().unwrap();
    let out_size = home_window.inner_size().unwrap();

    home_window
        .set_size(LogicalSize::new(
            out_size.to_logical(sf).width,
            cmp::max(out_size.to_logical(sf).height, height),
        ))
        .unwrap();
}

// 设置桌面角标数量
#[tauri::command]
pub fn set_badge_count(count: Option<i64>, handle: AppHandle) -> Result<(), String> {
    match handle.get_webview_window("home") {
        Some(window) => {
            window.set_badge_count(count).map_err(|e| e.to_string())?;
            Ok(())
        }

        None => Err("No webview window found".to_string()),
    }
}

#[tauri::command]
pub fn probe_video_upscale_runtime() -> VideoUpscaleRuntimeStatus {
    let ai_upscaler_path = find_ai_upscaler();
    let ffmpeg_path = find_binary("ffmpeg");
    let ai_upscaler_available = ai_upscaler_path
        .as_ref()
        .map(|path| validate_ai_model_files(path, "realesrgan-x4plus").is_ok())
        .unwrap_or(false);
    println!(
        "[VideoUpscale][runtime] ffmpeg_path={:?} ai_upscaler_path={:?} ai_upscaler_available={}",
        ffmpeg_path, ai_upscaler_path, ai_upscaler_available
    );
    VideoUpscaleRuntimeStatus {
        ffmpeg_available: ffmpeg_path.is_some(),
        ai_upscaler_available,
        ai_upscaler_path,
    }
}

#[tauri::command]
pub fn start_video_upscale_local(request: StartVideoUpscaleLocalRequest) -> Result<VideoUpscaleTaskStatus, String> {
    println!(
        "[VideoUpscale][start] input_path={} output_path={} model={:?} scale={:?} ai_binary_path={:?}",
        request.input_path, request.output_path, request.model, request.scale, request.ai_binary_path
    );
    if request.input_path.trim().is_empty() || request.output_path.trim().is_empty() {
        return Err("请输入输入视频和输出视频路径".to_string());
    }

    let id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis()
        .to_string();
    let initial_status = VideoUpscaleTaskStatus {
        id: id.clone(),
        status: "queued".to_string(),
        progress: 0,
        message: "本地 AI 超分任务已创建".to_string(),
        output_path: None,
    };

    if let Ok(mut tasks) = VIDEO_UPSCALE_TASKS.write() {
        tasks.insert(id.clone(), initial_status.clone());
    }

    thread::spawn(move || {
        println!("[VideoUpscale][task:{}] worker started", id);
        let engine = request.engine.as_deref().unwrap_or("realesrgan");
        update_video_task(
            &id,
            "running",
            5,
            if engine == "ffmpeg" { "检查本地 FFmpeg 快速增强运行时" } else { "检查本地 FFmpeg 与 AI 超分引擎" },
            None,
        );

        let Some(ffmpeg_binary) = find_binary("ffmpeg") else {
            update_video_task(&id, "error", 0, "未检测到 ffmpeg，请安装 ffmpeg 后重试", None);
            return;
        };

        if engine == "ffmpeg" {
            update_video_task(&id, "running", 35, "正在使用 FFmpeg 快速执行 4K 增强", None);
            let fallback = build_ffmpeg_fallback_command(&ffmpeg_binary, &request.input_path, &request.output_path);
            if let Err(error) = run_command("ffmpeg-fast-upscale", fallback, "FFmpeg 快速增强失败") {
                update_video_task(&id, "error", 35, &error, None);
                return;
            }

            update_video_task(&id, "done", 100, "FFmpeg 4K 快速增强完成", Some(request.output_path));
            return;
        }

        let explicit_ai_binary = request
            .ai_binary_path
            .as_ref()
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
            .map(|value| value.to_string());
        let ai_binary = explicit_ai_binary.or_else(find_ai_upscaler);
        let Some(ai_binary) = ai_binary else {
            update_video_task(
                &id,
                "error",
                0,
                "未检测到 realesrgan-ncnn-vulkan；请安装后加入 PATH、设置 STARLIGHT_VIDEO_UPSCALE_BIN，或在页面中选择 AI 引擎文件",
                None,
            );
            return;
        };

        let model = request.model.unwrap_or_else(|| "realesrgan-x4plus".to_string());
        let scale = request.scale.unwrap_or(4).to_string();

        let ai_work_dir = command_parent_dir(&ai_binary);
        println!(
            "[VideoUpscale][task:{}] binaries ffmpeg={} ai={} ai_work_dir={:?}",
            id, ffmpeg_binary, ai_binary, ai_work_dir
        );

        if ai_binary.contains(std::path::MAIN_SEPARATOR) && !PathBuf::from(&ai_binary).exists() {
            update_video_task(&id, "error", 0, "选择的 AI 引擎文件不存在", None);
            return;
        }

        if let Err(error) = validate_ai_model_files(&ai_binary, &model) {
            update_video_task(&id, "error", 0, &error, None);
            return;
        }

        let work_dir = std::env::temp_dir().join(format!("starlight-video-upscale-{}", id));
        let frames_dir = work_dir.join("frames");
        let enhanced_dir = work_dir.join("enhanced");
        println!(
            "[VideoUpscale][task:{}] work_dir={} frames_dir={} enhanced_dir={}",
            id,
            work_dir.to_string_lossy(),
            frames_dir.to_string_lossy(),
            enhanced_dir.to_string_lossy()
        );

        if let Err(error) = std::fs::create_dir_all(&frames_dir).and_then(|_| std::fs::create_dir_all(&enhanced_dir)) {
            update_video_task(&id, "error", 0, &format!("创建临时目录失败：{}", error), None);
            return;
        }

        update_video_task(&id, "running", 15, "正在使用 FFmpeg 拆分视频帧", None);
        let frame_pattern = frames_dir.join("frame_%08d.png");
        let mut extract = Command::new(&ffmpeg_binary);
        extract
            .arg("-y")
            .arg("-i")
            .arg(&request.input_path)
            .arg("-vsync")
            .arg("0")
            .arg(&frame_pattern);
        if let Err(error) = run_command("ffmpeg-extract", extract, "拆分视频帧失败") {
            update_video_task(&id, "error", 15, &error, None);
            return;
        }

        update_video_task(&id, "running", 45, "正在执行 Real-ESRGAN AI 超分", None);
        let upscale_attempts = [("0", "2:2:2"), ("256", "2:2:2"), ("128", "1:1:1"), ("64", "1:1:1"), ("32", "1:1:1")];
        let mut last_upscale_error = None;
        for (attempt_index, (tile_size, thread_config)) in upscale_attempts.iter().enumerate() {
            update_video_task(
                &id,
                "running",
                45,
                &format!(
                    "正在执行 Real-ESRGAN AI 超分（tile={}，线程={}，第 {}/{} 次尝试）",
                    tile_size,
                    thread_config,
                    attempt_index + 1,
                    upscale_attempts.len()
                ),
                None,
            );
            let upscale = build_upscale_command(
                &ai_binary,
                ai_work_dir.as_ref(),
                &frames_dir,
                &enhanced_dir,
                &model,
                &scale,
                tile_size,
                thread_config,
            );
            match run_upscale_command_with_progress(
                &id,
                &format!("realesrgan-upscale-tile-{}", tile_size),
                upscale,
                "AI 超分处理失败",
                &frames_dir,
                &enhanced_dir,
            ) {
                Ok(()) => {
                    last_upscale_error = None;
                    break;
                }
                Err(error) => {
                    println!(
                        "[VideoUpscale][task:{}] upscale attempt failed tile={} thread_config={} error={}",
                        id, tile_size, thread_config, error
                    );
                    last_upscale_error = Some(error);
                    let _ = std::fs::remove_dir_all(&enhanced_dir);
                    if let Err(error) = std::fs::create_dir_all(&enhanced_dir) {
                        update_video_task(&id, "error", 45, &format!("重置增强帧目录失败：{}", error), None);
                        return;
                    }
                }
            }
        }

        let mut used_ffmpeg_fallback = false;
        if let Some(error) = last_upscale_error {
            update_video_task(
                &id,
                "running",
                70,
                &format!(
                    "Real-ESRGAN 原生进程崩溃，正在自动切换到 FFmpeg 4K 兜底增强。原始错误：{}",
                    error
                ),
                None,
            );
            let fallback = build_ffmpeg_fallback_command(&ffmpeg_binary, &request.input_path, &request.output_path);
            if let Err(fallback_error) = run_command("ffmpeg-fallback-upscale", fallback, "FFmpeg 兜底增强失败") {
                update_video_task(
                    &id,
                    "error",
                    70,
                    &format!(
                        "Real-ESRGAN 崩溃且 FFmpeg 兜底也失败。Real-ESRGAN：{}；FFmpeg：{}",
                        error, fallback_error
                    ),
                    None,
                );
                return;
            }
            used_ffmpeg_fallback = true;
        } else {
            update_video_task(&id, "running", 82, "正在合成 4K 视频并保留原音轨", None);
            let enhanced_pattern = enhanced_dir.join("frame_%08d.png");
            let mut compose = Command::new(&ffmpeg_binary);
            compose
                .arg("-y")
                .arg("-framerate")
                .arg("30")
                .arg("-i")
                .arg(&enhanced_pattern)
                .arg("-i")
                .arg(&request.input_path)
                .arg("-map")
                .arg("0:v:0")
                .arg("-map")
                .arg("1:a?")
                .arg("-c:v")
                .arg("libx264")
                .arg("-pix_fmt")
                .arg("yuv420p")
                .arg("-crf")
                .arg("16")
                .arg("-preset")
                .arg("slow")
                .arg("-c:a")
                .arg("copy")
                .arg(&request.output_path);
            if let Err(error) = run_command("ffmpeg-compose", compose, "合成视频失败") {
                update_video_task(&id, "error", 82, &error, None);
                return;
            }
        }

        update_video_task(
            &id,
            "done",
            100,
            if used_ffmpeg_fallback {
                "Real-ESRGAN 崩溃，已使用 FFmpeg 4K 兜底增强完成"
            } else {
                "本地 AI 4K 视频增强完成"
            },
            Some(request.output_path),
        );
    });

    Ok(initial_status)
}

#[tauri::command]
pub fn get_video_upscale_task_status(id: String) -> Result<VideoUpscaleTaskStatus, String> {
    VIDEO_UPSCALE_TASKS
        .read()
        .map_err(|error| error.to_string())?
        .get(&id)
        .cloned()
        .ok_or_else(|| "未找到视频增强任务".to_string())
}
