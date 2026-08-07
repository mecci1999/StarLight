#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import { existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SIM_NAME = 'iPhone 16 Pro';
const SCHEME = 'tauri-app_iOS';
const BUNDLE_ID = 'com.starlight_app.app';

// ── helpers ──────────────────────────────────────────────
function run(cmd, opts = {}) {
  const { silent, timeout } = opts;
  return execSync(cmd, {
    cwd: ROOT,
    stdio: silent ? 'pipe' : 'inherit',
    timeout: timeout ?? 600_000,
  });
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: 'pipe', timeout: 60_000 }).toString().trim();
  } catch {
    return '';
  }
}

function rlQuestion(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans.trim()); }));
}

function warn(msg) { console.log(`\x1b[33m⚠  ${msg}\x1b[0m`); }
function ok(msg)   { console.log(`\x1b[32m✅ ${msg}\x1b[0m`); }
function err(msg)  { console.log(`\x1b[31m❌ ${msg}\x1b[0m`); }
function title(msg){ console.log(`\n\x1b[36m═══ ${msg} ═══\x1b[0m\n`); }

// ── resolve paths ────────────────────────────────────────
const PROJECT = resolve(ROOT, 'src-tauri/gen/apple/tauri-app.xcodeproj');

// Find DerivedData path (traverse symlinks if any)
const raw = runSilent(
  `find "$HOME/Library/Developer/Xcode/DerivedData" -maxdepth 1 -name "tauri-app-*" -type d 2>/dev/null | head -1`
);
const DERIVED = raw || resolve(process.env.HOME, 'Library/Developer/Xcode/DerivedData/tauri-app-gnkbstmlxoaftahcvewclzrqvcuc');
const APP_PATH = resolve(DERIVED, 'Build/Products/debug-iphonesimulator/星光.app');
const DIST_SRC = resolve(ROOT, 'dist');

// ── get simulator device id ──────────────────────────────
function getDeviceId() {
  return runSilent(`xcrun simctl list devices | grep "${SIM_NAME} (" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}'`);
}

// ── 1. check status ──────────────────────────────────────
function status() {
  if (!existsSync(resolve(DIST_SRC, 'index.html'))) {
    err('dist 不存在，请先执行 npm run build');
    return false;
  }

  const distTime = statSync(resolve(DIST_SRC, 'index.html')).mtime;
  const appHtml = resolve(APP_PATH, 'assets/index.html');
  const appTime = existsSync(appHtml) ? statSync(appHtml).mtime : null;
  const binary = resolve(APP_PATH, '星光');
  const binaryTime = existsSync(binary) ? statSync(binary).mtime : null;

  console.log(`  📦 dist:    ${distTime.toLocaleString()}`);
  console.log(`  📲 .app:    ${appTime ? appTime.toLocaleString() : '不存在'}`);
  console.log(`  ⚙️  binary: ${binaryTime ? binaryTime.toLocaleString() : '不存在'}`);

  const distHash = runSilent(`md5 -q "${resolve(DIST_SRC, 'index.html')}"`);
  const appHash = appTime ? runSilent(`md5 -q "${appHtml}"`) : '';

  // Also check if dist has new chunk files not in .app
  const distChunks = runSilent(`ls "${resolve(DIST_SRC, 'static/js')}" 2>/dev/null`);
  const appChunks = runSilent(`ls "${resolve(APP_PATH, 'assets/static/js')}" 2>/dev/null`);

  if (!appTime || distTime > appTime) {
    warn('dist 比 .app 新 —— 需要部署');
    return false;
  }
  if (distHash !== appHash) {
    warn(`MD5 不一致 (dist: ${distHash.slice(0,8)}…  app: ${appHash.slice(0,8)}…) —— 需要部署`);
    return false;
  }
  if (distChunks !== appChunks) {
    warn('dist 的 chunk 文件与 .app 不一致 —— 需要部署');
    return false;
  }

  // Check simulator
  const deviceId = getDeviceId();
  if (!deviceId) {
    warn(`模拟器 "${SIM_NAME}" 未找到`);
    return true; // binary is up to date
  }
  const booted = runSilent(`xcrun simctl list devices | grep "${deviceId}" | grep -c "Booted"`);
  console.log(`  📱 模拟器: ${booted === '1' ? '已启动' : '未启动'}`);
  const installed = runSilent(`xcrun simctl listapps "${deviceId}" 2>/dev/null | grep -c "${BUNDLE_ID}"`);
  console.log(`  📲 App:    ${installed === '1' ? '已安装' : '未安装'}`);

  return true;
}

// ── 2. build ─────────────────────────────────────────────
async function deploy() {
  title('1/4 构建前端');
  run('npm run build');

  title('2/4 复制 dist 到 .app');
  if (!existsSync(APP_PATH)) {
    warn('.app 不存在，需先 Xcode 构建一次');
    await buildXcode();
  }

  // Remove old & copy new (cp dist/* to avoid nested dist/ directory)
  const assetsDir = resolve(APP_PATH, 'assets');
  runSilent(`rm -rf "${assetsDir}"`);
  runSilent(`mkdir -p "${assetsDir}"`);
  run(`cp -r "${DIST_SRC}/"* "${assetsDir}/"`, { silent: true });

  // Inject cache-busting query params to bypass WKWebView cache
  const ts = Date.now();
  const { readFileSync, writeFileSync } = await import('fs');
  let html = readFileSync(resolve(assetsDir, 'index.html'), 'utf-8');
  html = html.replace(/src="(\/static\/[^"]+)"/g, `src="$1?v=${ts}"`);
  html = html.replace(/href="(\/static\/[^"]+)"/g, `href="$1?v=${ts}"`);
  writeFileSync(resolve(assetsDir, 'index.html'), html);
  ok(`dist 已同步到 .app (cache-bust: ${ts})`);

  // Verify (skip MD5 check after cache-bust injection)
  const distHash = runSilent(`md5 -q "${resolve(DIST_SRC, 'index.html')}"`);
  const appHash = runSilent(`md5 -q "${resolve(APP_PATH, 'assets/index.html')}"`);
  if (distHash === appHash) {
    ok(`MD5 一致: ${distHash.slice(0,12)}`);
  } else {
    // Expected after cache-bust injection
    console.log('  ℹ️  MD5 不同 (cache-bust 注入导致，正常)');
  }

  title('3/4 安装到模拟器');
  const deviceId = getDeviceId();
  if (!deviceId) { err('未找到模拟器设备'); process.exit(1); }

  const booted = runSilent(`xcrun simctl list devices | grep "${deviceId}" | grep -c "Booted"`);
  if (booted !== '1') {
    console.log('  启动模拟器...');
    run(`xcrun simctl boot "${deviceId}"`);
    await new Promise(r => setTimeout(r, 8000));
  }

  run(`xcrun simctl terminate "${deviceId}" "${BUNDLE_ID}" 2>/dev/null || true`, { silent: true });
  await new Promise(r => setTimeout(r, 1000));
  run(`xcrun simctl uninstall "${deviceId}" "${BUNDLE_ID}" 2>/dev/null || true`, { silent: true });
  await new Promise(r => setTimeout(r, 500));
  run(`xcrun simctl install "${deviceId}" "${APP_PATH}"`);
  ok('已安装');

  title('4/4 启动 App');
  run(`xcrun simctl launch "${deviceId}" "${BUNDLE_ID}"`);
  ok('App 已启动');
  console.log('');
}

// ── 3. xcode build (fallback) ────────────────────────────
async function buildXcode() {
  title('Xcode 构建');
  const deviceId = getDeviceId();
  run(
    `xcodebuild -project "${PROJECT}" -scheme "${SCHEME}" -sdk iphonesimulator -destination "platform=iOS Simulator,name=${SIM_NAME}" -configuration debug build -quiet`
  );
  ok('Xcode 构建完成');
}

// ── main ─────────────────────────────────────────────────
async function main() {
  const cmd = process.argv[2] || 'deploy';

  if (cmd === 'status' || cmd === 'check') {
    title('iOS App 状态');
    const upToDate = status();
    if (upToDate) ok('.app 已是最新');
  } else if (cmd === 'deploy' || cmd === 'update') {
    title('iOS App 部署');
    const upToDate = status();
    if (upToDate) {
      const ans = await rlQuestion('\n.app 已是最新，是否强制重新构建？(y/N): ');
      if (ans.toLowerCase() !== 'y') { console.log('已取消'); process.exit(0); }
    }
    await deploy();
  } else if (cmd === 'build') {
    await buildXcode();
  } else {
    console.log('用法:\n  node scripts/ios-deploy.mjs [status|deploy|build]\n');
    console.log('  status  检查 dist / .app / 模拟器状态');
    console.log('  deploy  构建前端 → 复制到 .app → 安装到模拟器并启动');
    console.log('  build   仅执行 Xcode 构建');
  }
}

main().catch(e => {
  err(e.message);
  process.exit(1);
});
