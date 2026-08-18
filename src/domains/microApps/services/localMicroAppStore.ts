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

export type MicroAppInstallRequirement = 'open' | 'download' | 'update'

export const getMicroAppInstallRequirement = (
  installed: InstalledMicroApp | null | undefined,
  published: MicroAppVersion | null | undefined
): MicroAppInstallRequirement => {
  if (!installed || !published) return 'download'
  return installed.appId === published.appId &&
    installed.version === published.version &&
    installed.packageSha256 === published.packageSha256
    ? 'open'
    : 'update'
}

type MicroAppIdentity = Pick<InstalledMicroApp, 'appId' | 'version'> & { entry?: string }

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

export const isCanonicalMicroAppSegment = (value: string) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)

export const canonicalZipPath = (path: string) => {
  if (!path || path.includes('\\') || path.startsWith('/') || path.endsWith('/')) return null
  const segments = path.split('/')
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return null
  return path
}

const canonicalZipMemberPath = (path: string) => {
  const isDirectory = path.endsWith('/')
  const canonicalPath = canonicalZipPath(isDirectory ? path.slice(0, -1) : path)
  return canonicalPath ? { canonicalPath, isDirectory } : null
}

const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50
const ZIP_CENTRAL_DIRECTORY_FILE_HEADER = 0x02014b50
const MAX_MICRO_APP_ARCHIVE_BYTES = 25 * 1024 * 1024
const MAX_MICRO_APP_ENTRY_COUNT = 1_000
const MAX_MICRO_APP_ENTRY_UNCOMPRESSED_BYTES = 16 * 1024 * 1024
const MAX_MICRO_APP_TOTAL_UNCOMPRESSED_BYTES = 64 * 1024 * 1024
const MAX_MICRO_APP_COMPRESSION_RATIO = 100

const zipUint32 = (bytes: Uint8Array, offset: number) =>
  bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)

const zipUint16 = (bytes: Uint8Array, offset: number) => bytes[offset] | (bytes[offset + 1] << 8)

const validateZipMemberPaths = (zipBytes: Uint8Array) => {
  if (zipBytes.byteLength > MAX_MICRO_APP_ARCHIVE_BYTES) throw new Error('zip 包超过最大归档大小')
  let endOfDirectory = -1
  for (let index = zipBytes.length - 22; index >= Math.max(0, zipBytes.length - 65_557); index -= 1) {
    if (zipUint32(zipBytes, index) === ZIP_END_OF_CENTRAL_DIRECTORY) {
      endOfDirectory = index
      break
    }
  }
  if (endOfDirectory < 0 || endOfDirectory + 22 > zipBytes.length) throw new Error('无效的 ZIP 中央目录')

  const entryCount = zipUint16(zipBytes, endOfDirectory + 10)
  if (entryCount > MAX_MICRO_APP_ENTRY_COUNT) throw new Error('zip 包条目数量超过上限')
  const centralDirectoryOffset = zipUint32(zipBytes, endOfDirectory + 16) >>> 0
  let offset = centralDirectoryOffset
  const memberPaths = new Set<string>()
  const decoder = new TextDecoder()
  let totalUncompressedBytes = 0

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (offset + 46 > zipBytes.length || zipUint32(zipBytes, offset) !== ZIP_CENTRAL_DIRECTORY_FILE_HEADER) {
      throw new Error('无效的 ZIP 文件条目')
    }
    const nameLength = zipUint16(zipBytes, offset + 28)
    const extraLength = zipUint16(zipBytes, offset + 30)
    const commentLength = zipUint16(zipBytes, offset + 32)
    const compressedBytes = zipUint32(zipBytes, offset + 20) >>> 0
    const uncompressedBytes = zipUint32(zipBytes, offset + 24) >>> 0
    const end = offset + 46 + nameLength + extraLength + commentLength
    if (end > zipBytes.length) throw new Error('无效的 ZIP 文件名')
    const path = decoder.decode(zipBytes.subarray(offset + 46, offset + 46 + nameLength))
    const memberPath = canonicalZipMemberPath(path)
    if (!memberPath) throw new Error(`zip 包包含非规范路径: ${path}`)
    if (memberPaths.has(memberPath.canonicalPath)) throw new Error(`zip 包包含重复路径: ${memberPath.canonicalPath}`)
    if (uncompressedBytes > MAX_MICRO_APP_ENTRY_UNCOMPRESSED_BYTES) {
      throw new Error(`zip 包条目超过解压大小上限: ${memberPath.canonicalPath}`)
    }
    if (
      compressedBytes === 0
        ? uncompressedBytes > 0
        : uncompressedBytes / compressedBytes > MAX_MICRO_APP_COMPRESSION_RATIO
    ) {
      throw new Error(`zip 包条目压缩比超过上限: ${memberPath.canonicalPath}`)
    }
    totalUncompressedBytes += uncompressedBytes
    if (totalUncompressedBytes > MAX_MICRO_APP_TOTAL_UNCOMPRESSED_BYTES) throw new Error('zip 包总解压大小超过上限')
    memberPaths.add(memberPath.canonicalPath)
    offset = end
  }
}

const validateMicroAppIdentity = (identity: MicroAppIdentity) => {
  if (!isCanonicalMicroAppSegment(identity.appId) || !isCanonicalMicroAppSegment(identity.version)) {
    throw new Error('微应用 appId 和 version 必须是安全的包路径片段')
  }
}

export const installMicroAppLocally = async (version: MicroAppVersion) => {
  if (!version.packageBase64) throw new Error('缺少微应用包内容')
  validateMicroAppIdentity(version)
  parseMicroAppZip(version.packageBase64, { ...version, entry: version.manifest.entry })
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

export const parseMicroAppZip = (zipBase64: string, expectedIdentity?: MicroAppIdentity): ParsedMicroAppZip => {
  const zipBytes = base64ToBytes(zipBase64)
  validateZipMemberPaths(zipBytes)
  const files = unzipSync(zipBytes)
  const canonicalFiles: Record<string, Uint8Array> = {}
  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith('/')) continue
    const canonicalPath = canonicalZipPath(path)
    if (!canonicalPath) throw new Error(`zip 包包含非规范路径: ${path}`)
    if (canonicalFiles[canonicalPath]) throw new Error(`zip 包包含重复路径: ${canonicalPath}`)
    canonicalFiles[canonicalPath] = content
  }

  const manifestBytes = canonicalFiles['manifest.json']
  if (!manifestBytes) throw new Error('zip 包根目录必须包含 manifest.json')
  let manifest: MicroAppVersion['manifest']
  try {
    manifest = JSON.parse(strFromU8(manifestBytes)) as MicroAppVersion['manifest']
  } catch {
    throw new Error('manifest.json 不是有效 JSON')
  }
  if (
    !manifest ||
    typeof manifest.appId !== 'string' ||
    typeof manifest.name !== 'string' ||
    typeof manifest.version !== 'string' ||
    typeof manifest.entry !== 'string' ||
    !manifest.appId ||
    !manifest.name ||
    !manifest.version ||
    !manifest.entry
  ) {
    throw new Error('manifest.json 必须包含 appId/name/version/entry')
  }
  validateMicroAppIdentity(manifest)
  const entryPath = canonicalZipPath(manifest.entry)
  if (!entryPath || entryPath !== manifest.entry) throw new Error('manifest.entry 必须是规范的相对 POSIX 路径')
  if (!canonicalFiles[entryPath]) throw new Error(`zip 包中找不到入口文件: ${manifest.entry}`)
  if (
    expectedIdentity &&
    (manifest.appId !== expectedIdentity.appId || manifest.version !== expectedIdentity.version)
  ) {
    throw new Error('manifest 身份与微应用包元数据不匹配')
  }
  if (expectedIdentity?.entry && manifest.entry !== expectedIdentity.entry) {
    throw new Error('manifest 入口与微应用包元数据不匹配')
  }
  return { manifest, files: canonicalFiles }
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
    const relativePath = rawPath.replace(/^\.\//, '')
    const normalized = canonicalZipPath(relativePath)
    if (!normalized) return match
    const mapped = assetUrls[normalized]
    return mapped ? `${attr}=${quote}${mapped}${quote}` : match
  })
}

export const buildMicroAppObjectUrl = (installed: InstalledMicroApp, runtimePayload: unknown) => {
  if (!installed.zipBase64) throw new Error('微应用本地 zip 包不存在')
  validateMicroAppIdentity(installed)
  const { manifest, files } = parseMicroAppZip(installed.zipBase64, { ...installed, entry: installed.manifest.entry })
  const assetUrls: Record<string, string> = {}
  for (const [path, content] of Object.entries(files)) {
    if (path === manifest.entry) continue
    assetUrls[path] = URL.createObjectURL(new Blob([content], { type: getMimeType(path) }))
  }

  const html = strFromU8(files[manifest.entry])
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
  const parsed = parseMicroAppZip(packageBase64, manifest)
  const runtimeUrl = await buildMicroAppRuntimeUrl(
    {
      appId: parsed.manifest.appId,
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

  validateMicroAppIdentity(installed)
  const { manifest, files } = parseMicroAppZip(installed.zipBase64, { ...installed, entry: installed.manifest.entry })
  const dir = microAppDir(installed.appId, installed.version)
  await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true })

  for (const [path, content] of Object.entries(files)) {
    const parentDir = path.split('/').slice(0, -1).join('/')
    if (parentDir) await mkdir(`${dir}/${parentDir}`, { baseDir: BaseDirectory.AppData, recursive: true })
    await writeFile(`${dir}/${path}`, content, { baseDir: BaseDirectory.AppData })
  }

  const html = strFromU8(files[manifest.entry])
  const bridgeScript = `<script>window.__STARLIGHT_MICRO_APP__=${JSON.stringify(runtimePayload)};window.parent&&window.parent.postMessage({type:'STARLIGHT_MICRO_APP_READY',appId:${JSON.stringify(installed.appId)}},'*');</script>`
  const runtimeHtml = html.includes('</head>')
    ? html.replace('</head>', `${bridgeScript}</head>`)
    : `${bridgeScript}${html}`
  await writeFile(`${dir}/__runtime.html`, new TextEncoder().encode(runtimeHtml), { baseDir: BaseDirectory.AppData })
  return `starlight-micro://localhost/${installed.appId}/${installed.version}/__runtime.html`
}
