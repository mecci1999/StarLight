import type { MicroAppVersion } from '@/api/microApps'
import { unzipSync, strFromU8 } from 'fflate'
import { BaseDirectory, exists, mkdir, readFile, writeFile, writeTextFile } from '@tauri-apps/plugin-fs'

const STORAGE_KEY = 'starlight-installed-micro-apps'
const PREVIEW_STORAGE_KEY_PREFIX = 'starlight-micro-app-preview:'
const MICRO_APP_ROOT = 'micro-apps'

export type InstalledMicroApp = {
  appId: string
  version: string
  manifest: MicroAppVersion['manifest']
  zipBase64?: string
  zipPath?: string
  protocolEntry?: string
  packageSha256: string
  installedAt: string
  storage: 'appData' | 'localStorage'
}

export type ParsedMicroAppZip = {
  manifest: MicroAppVersion['manifest']
  files: Record<string, Uint8Array>
}

export type MicroAppPreviewRecord = {
  key: string
  appId: string
  version: string
  title: string
  subtitle: string
  runtimeUrl: string
  createdAt: string
}

const readInstalledMap = (): Record<string, InstalledMicroApp> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

const writeInstalledMap = (installed: Record<string, InstalledMicroApp>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(installed))
}

const isTauriRuntime = () => Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)

const microAppDir = (appId: string, version: string) => `${MICRO_APP_ROOT}/${appId}/${version}`
const microAppZipPath = (appId: string, version: string) => `${microAppDir(appId, version)}/package.zip`
const microAppManifestPath = (appId: string, version: string) => `${microAppDir(appId, version)}/manifest.json`

const previewStorageKey = (key: string) => `${PREVIEW_STORAGE_KEY_PREFIX}${key}`

const createPreviewKey = (manifest: MicroAppVersion['manifest']) =>
  `preview-${manifest.appId}-${manifest.version}-${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_')

export const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index])
  return btoa(binary)
}

export const sha256Hex = async (bytes: Uint8Array) => {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const installMicroAppLocally = async (version: MicroAppVersion) => {
  if (!version.packageBase64) throw new Error('缺少微应用包内容')
  const zipBytes = base64ToBytes(version.packageBase64)
  const actualHash = await sha256Hex(zipBytes)
  if (actualHash !== version.packageSha256) throw new Error('微应用包 SHA256 校验失败')
  const installed = readInstalledMap()
  const baseRecord: InstalledMicroApp = {
    appId: version.appId,
    version: version.version,
    manifest: version.manifest,
    packageSha256: version.packageSha256,
    installedAt: new Date().toISOString(),
    storage: 'localStorage'
  }

  if (isTauriRuntime()) {
    const dir = microAppDir(version.appId, version.version)
    const zipPath = microAppZipPath(version.appId, version.version)
    const manifestPath = microAppManifestPath(version.appId, version.version)
    await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true })
    await writeFile(zipPath, zipBytes, { baseDir: BaseDirectory.AppData })
    await writeTextFile(manifestPath, JSON.stringify(baseRecord, null, 2), { baseDir: BaseDirectory.AppData })
    installed[version.appId] = {
      ...baseRecord,
      zipPath,
      protocolEntry: `${version.appId}/${version.version}/__runtime.html`,
      storage: 'appData'
    }
  } else {
    installed[version.appId] = { ...baseRecord, zipBase64: version.packageBase64 }
  }

  writeInstalledMap(installed)
  return installed[version.appId]
}

export const getInstalledMicroApp = async (appId: string) => {
  const installed = readInstalledMap()[appId]
  if (!installed) return null
  if (installed.storage === 'appData' && installed.zipPath && isTauriRuntime()) {
    if (!(await exists(installed.zipPath, { baseDir: BaseDirectory.AppData }))) return null
    const bytes = await readFile(installed.zipPath, { baseDir: BaseDirectory.AppData })
    return { ...installed, zipBase64: bytesToBase64(bytes) }
  }
  return installed
}

export const getInstalledMicroApps = () => Object.values(readInstalledMap())

export const getMicroAppPreviewRecord = (key: string): MicroAppPreviewRecord | null => {
  try {
    return JSON.parse(sessionStorage.getItem(previewStorageKey(key)) || 'null')
  } catch {
    return null
  }
}

export const clearMicroAppPreviewRecord = (key: string) => {
  sessionStorage.removeItem(previewStorageKey(key))
}

export const base64ToBytes = (base64: string) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export const normalizeZipPath = (path: string) => path.replace(/^\.\//, '').replace(/^\//, '')

export const parseMicroAppZip = (zipBase64: string): ParsedMicroAppZip => {
  const files = unzipSync(base64ToBytes(zipBase64))
  const manifestPath = Object.keys(files).find((path) => normalizeZipPath(path) === 'manifest.json')
  if (!manifestPath) throw new Error('zip 包根目录必须包含 manifest.json')
  const manifest = JSON.parse(strFromU8(files[manifestPath])) as MicroAppVersion['manifest']
  if (!manifest.appId || !manifest.name || !manifest.version || !manifest.entry) {
    throw new Error('manifest.json 必须包含 appId/name/version/entry')
  }
  const entryPath = Object.keys(files).find((path) => normalizeZipPath(path) === normalizeZipPath(manifest.entry))
  if (!entryPath) throw new Error(`zip 包中找不到入口文件: ${manifest.entry}`)
  return { manifest, files }
}

const getMimeType = (path: string) => {
  if (path.endsWith('.js')) return 'text/javascript'
  if (path.endsWith('.css')) return 'text/css'
  if (path.endsWith('.svg')) return 'image/svg+xml'
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  if (path.endsWith('.webp')) return 'image/webp'
  if (path.endsWith('.json')) return 'application/json'
  if (path.endsWith('.html')) return 'text/html'
  return 'application/octet-stream'
}

const rewriteHtmlAssets = (html: string, assetUrls: Record<string, string>) => {
  return html.replace(/(src|href)=(['"])([^'"]+)\2/g, (match, attr, quote, rawPath) => {
    if (/^(https?:|data:|blob:|#|javascript:)/i.test(rawPath)) return match
    const normalized = normalizeZipPath(rawPath)
    const withoutDot = normalizeZipPath(rawPath.replace(/^\.\//, ''))
    const mapped = assetUrls[normalized] || assetUrls[withoutDot]
    return mapped ? `${attr}=${quote}${mapped}${quote}` : match
  })
}

export const buildMicroAppObjectUrl = (installed: InstalledMicroApp, runtimePayload: unknown) => {
  if (!installed.zipBase64) throw new Error('微应用本地 zip 包不存在')
  const { files } = parseMicroAppZip(installed.zipBase64)
  const assetUrls: Record<string, string> = {}
  for (const [path, content] of Object.entries(files)) {
    const normalized = normalizeZipPath(path)
    if (normalized === normalizeZipPath(installed.manifest.entry)) continue
    assetUrls[normalized] = URL.createObjectURL(new Blob([content], { type: getMimeType(normalized) }))
  }

  const entryPath = Object.keys(files).find(
    (path) => normalizeZipPath(path) === normalizeZipPath(installed.manifest.entry)
  )
  if (!entryPath) throw new Error(`找不到入口文件: ${installed.manifest.entry}`)
  const html = strFromU8(files[entryPath])
  const bridgeScript = `<script>window.__STARLIGHT_MICRO_APP__=${JSON.stringify(runtimePayload)};window.parent&&window.parent.postMessage({type:'STARLIGHT_MICRO_APP_READY',appId:${JSON.stringify(installed.appId)}},'*');</script>`
  const htmlWithBridge = html.includes('</head>')
    ? html.replace('</head>', `${bridgeScript}</head>`)
    : `${bridgeScript}${html}`
  const nextHtml = rewriteHtmlAssets(htmlWithBridge, assetUrls)
  return URL.createObjectURL(new Blob([nextHtml], { type: 'text/html' }))
}

export const prepareMicroAppPreview = async (
  packageBase64: string,
  manifest: MicroAppVersion['manifest'],
  runtimePayload: unknown
) => {
  const key = createPreviewKey(manifest)
  const runtimeUrl = await buildMicroAppRuntimeUrl(
    {
      appId: key,
      version: manifest.version,
      manifest,
      zipBase64: packageBase64,
      packageSha256: 'preview',
      installedAt: new Date().toISOString(),
      storage: isTauriRuntime() ? 'appData' : 'localStorage'
    },
    runtimePayload
  )
  const record: MicroAppPreviewRecord = {
    key,
    appId: manifest.appId,
    version: manifest.version,
    title: manifest.name || manifest.appId,
    subtitle: `${manifest.appId} / ${manifest.version}`,
    runtimeUrl,
    createdAt: new Date().toISOString()
  }
  sessionStorage.setItem(previewStorageKey(key), JSON.stringify(record))
  return record
}

export const buildMicroAppRuntimeUrl = async (installed: InstalledMicroApp, runtimePayload: unknown) => {
  if (!installed.zipBase64) throw new Error('微应用本地 zip 包不存在')
  if (!isTauriRuntime() || installed.storage !== 'appData') return buildMicroAppObjectUrl(installed, runtimePayload)

  const { files } = parseMicroAppZip(installed.zipBase64)
  const dir = microAppDir(installed.appId, installed.version)
  await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true })

  for (const [path, content] of Object.entries(files)) {
    const normalized = normalizeZipPath(path)
    if (!normalized || normalized.endsWith('/')) continue
    const parentDir = normalized.split('/').slice(0, -1).join('/')
    if (parentDir) await mkdir(`${dir}/${parentDir}`, { baseDir: BaseDirectory.AppData, recursive: true })
    await writeFile(`${dir}/${normalized}`, content, { baseDir: BaseDirectory.AppData })
  }

  const entryPath = Object.keys(files).find(
    (path) => normalizeZipPath(path) === normalizeZipPath(installed.manifest.entry)
  )
  if (!entryPath) throw new Error(`找不到入口文件: ${installed.manifest.entry}`)
  const html = strFromU8(files[entryPath])
  const bridgeScript = `<script>window.__STARLIGHT_MICRO_APP__=${JSON.stringify(runtimePayload)};window.parent&&window.parent.postMessage({type:'STARLIGHT_MICRO_APP_READY',appId:${JSON.stringify(installed.appId)}},'*');</script>`
  const runtimeHtml = html.includes('</head>')
    ? html.replace('</head>', `${bridgeScript}</head>`)
    : `${bridgeScript}${html}`
  await writeFile(`${dir}/__runtime.html`, new TextEncoder().encode(runtimeHtml), { baseDir: BaseDirectory.AppData })
  return `starlight-micro://localhost/${installed.appId}/${installed.version}/__runtime.html`
}
