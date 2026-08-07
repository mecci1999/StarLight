import { strToU8, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { bytesToBase64, canonicalZipPath, parseMicroAppZip } from './localMicroAppStore'

const manifest = {
  appId: 'trails',
  name: 'Trails',
  version: '1.0.0',
  entry: 'index.html'
}

const packageBase64 = (files: Record<string, string>) =>
  bytesToBase64(zipSync(Object.fromEntries(Object.entries(files).map(([path, content]) => [path, strToU8(content)]))))

describe('local micro-app package validation', () => {
  it('accepts canonical POSIX package paths and matching manifest identity', () => {
    const archive = packageBase64({
      'manifest.json': JSON.stringify(manifest),
      'index.html': '<main>Trails</main>',
      'assets/app.js': 'console.log("ok")'
    })

    expect(parseMicroAppZip(archive, manifest).manifest).toEqual(manifest)
    expect(canonicalZipPath('assets/app.js')).toBe('assets/app.js')
  })

  it.each([
    '../escape.html',
    'assets/../escape.html',
    '/absolute.html',
    'assets\\app.js',
    './index.html',
    'assets//app.js'
  ])('rejects unsafe ZIP member path %s', (path) => {
    const archive = packageBase64({
      'manifest.json': JSON.stringify(manifest),
      'index.html': '<main>Trails</main>',
      [path]: 'x'
    })

    expect(() => parseMicroAppZip(archive, manifest)).toThrow('非规范路径')
  })

  it('rejects a manifest identity or entry that differs from package metadata', () => {
    const archive = packageBase64({ 'manifest.json': JSON.stringify(manifest), 'index.html': '<main>Trails</main>' })

    expect(() => parseMicroAppZip(archive, { ...manifest, version: '2.0.0' })).toThrow('身份')
    expect(() => parseMicroAppZip(archive, { ...manifest, entry: 'other.html' })).toThrow('入口')
  })

  it('rejects archives with too many entries before extraction', () => {
    const files: Record<string, string> = {
      'manifest.json': JSON.stringify(manifest),
      'index.html': '<main>Trails</main>'
    }
    for (let index = 0; index < 1_000; index += 1) files[`assets/${index}.txt`] = 'x'

    expect(() => parseMicroAppZip(packageBase64(files), manifest)).toThrow('条目数量超过上限')
  })

  it('rejects entries whose declared expanded content is too large before extraction', () => {
    const archive = packageBase64({
      'manifest.json': JSON.stringify(manifest),
      'index.html': '<main>Trails</main>',
      'assets/too-large.txt': 'x'.repeat(16 * 1024 * 1024 + 1)
    })

    expect(() => parseMicroAppZip(archive, manifest)).toThrow('解压大小上限')
  })
})
