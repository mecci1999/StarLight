import { dq as e, dr as t, ds as r, dt as a, du as n, cI as i, dv as s, dw as o } from './invariable-DewVS0br.js'
const p = 'starlight-installed-micro-apps',
  c = () => {
    try {
      return JSON.parse(localStorage.getItem(p) || '{}')
    } catch {
      return {}
    }
  },
  l = () => Boolean(window.__TAURI_INTERNALS__),
  w = (e, t) => `micro-apps/${e}/${t}`,
  h = (e) => `starlight-micro-app-preview:${e}`,
  d = (e) => {
    let t = ''
    for (let r = 0; r < e.length; r += 1) t += String.fromCharCode(e[r])
    return btoa(t)
  },
  f = (e) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(e),
  g = (e) =>
    !e ||
    e.includes('\\') ||
    e.startsWith('/') ||
    e.endsWith('/') ||
    e.split('/').some((e) => !e || '.' === e || '..' === e)
      ? null
      : e,
  m = (e) => {
    const t = e.endsWith('/'),
      r = g(t ? e.slice(0, -1) : e)
    return r ? { canonicalPath: r, isDirectory: t } : null
  },
  I = (e, t) => e[t] | (e[t + 1] << 8) | (e[t + 2] << 16) | (e[t + 3] << 24),
  y = (e, t) => e[t] | (e[t + 1] << 8),
  u = (e) => {
    if (!f(e.appId) || !f(e.version)) throw new Error('微应用 appId 和 version 必须是安全的包路径片段')
  },
  $ = async (e) => {
    if (!e.packageBase64) throw new Error('缺少微应用包内容')
    u(e), D(e.packageBase64, { ...e, entry: e.manifest.entry })
    const t = b(e.packageBase64)
    if (
      (await (async (e) => {
        const t = await crypto.subtle.digest('SHA-256', e)
        return Array.from(new Uint8Array(t))
          .map((e) => e.toString(16).padStart(2, '0'))
          .join('')
      })(t)) !== e.packageSha256
    )
      throw new Error('微应用包 SHA256 校验失败')
    const s = c(),
      o = {
        appId: e.appId,
        version: e.version,
        manifest: e.manifest,
        packageSha256: e.packageSha256,
        installedAt: new Date().toISOString(),
        storage: 'localStorage'
      }
    if (l()) {
      const p = w(e.appId, e.version),
        c = ((h = e.appId), (d = e.version), `${w(h, d)}/package.zip`),
        l = ((e, t) => `${w(e, t)}/manifest.json`)(e.appId, e.version)
      await r(p, { baseDir: a.AppData, recursive: !0 }),
        await n(c, t, { baseDir: a.AppData }),
        await i(l, JSON.stringify(o, null, 2), { baseDir: a.AppData }),
        (s[e.appId] = { ...o, zipPath: c, protocolEntry: `${e.appId}/${e.version}/__runtime.html`, storage: 'appData' })
    } else s[e.appId] = { ...o, zipBase64: e.packageBase64 }
    var h, d
    return (
      ((e) => {
        localStorage.setItem(p, JSON.stringify(e))
      })(s),
      s[e.appId]
    )
  },
  S = async (e) => {
    const t = c()[e]
    if (!t) return null
    if ('appData' === t.storage && t.zipPath && l()) {
      if (!(await s(t.zipPath, { baseDir: a.AppData }))) return null
      const e = await o(t.zipPath, { baseDir: a.AppData })
      return { ...t, zipBase64: d(e) }
    }
    return t
  },
  v = () => Object.values(c()),
  A = (e) => {
    try {
      return JSON.parse(sessionStorage.getItem(h(e)) || 'null')
    } catch {
      return null
    }
  },
  _ = (e) => {
    sessionStorage.removeItem(h(e))
  },
  b = (e) => {
    const t = atob(e),
      r = new Uint8Array(t.length)
    for (let a = 0; a < t.length; a += 1) r[a] = t.charCodeAt(a)
    return r
  },
  D = (r, a) => {
    const n = b(r)
    ;((e) => {
      if (e.byteLength > 26214400) throw new Error('zip 包超过最大归档大小')
      let t = -1
      for (let o = e.length - 22; o >= Math.max(0, e.length - 65557); o -= 1)
        if (101010256 === I(e, o)) {
          t = o
          break
        }
      if (t < 0 || t + 22 > e.length) throw new Error('无效的 ZIP 中央目录')
      const r = y(e, t + 10)
      if (r > 1e3) throw new Error('zip 包条目数量超过上限')
      let a = I(e, t + 16) >>> 0
      const n = new Set(),
        i = new TextDecoder()
      let s = 0
      for (let o = 0; o < r; o += 1) {
        if (a + 46 > e.length || 33639248 !== I(e, a)) throw new Error('无效的 ZIP 文件条目')
        const t = y(e, a + 28),
          r = y(e, a + 30),
          o = y(e, a + 32),
          p = I(e, a + 20) >>> 0,
          c = I(e, a + 24) >>> 0,
          l = a + 46 + t + r + o
        if (l > e.length) throw new Error('无效的 ZIP 文件名')
        const w = i.decode(e.subarray(a + 46, a + 46 + t)),
          h = m(w)
        if (!h) throw new Error(`zip 包包含非规范路径: ${w}`)
        if (n.has(h.canonicalPath)) throw new Error(`zip 包包含重复路径: ${h.canonicalPath}`)
        if (c > 16777216) throw new Error(`zip 包条目超过解压大小上限: ${h.canonicalPath}`)
        if (0 === p ? c > 0 : c / p > 100) throw new Error(`zip 包条目压缩比超过上限: ${h.canonicalPath}`)
        if (((s += c), s > 67108864)) throw new Error('zip 包总解压大小超过上限')
        n.add(h.canonicalPath), (a = l)
      }
    })(n)
    const i = e(n),
      s = {}
    for (const [e, t] of Object.entries(i)) {
      if (e.endsWith('/')) continue
      const r = g(e)
      if (!r) throw new Error(`zip 包包含非规范路径: ${e}`)
      if (s[r]) throw new Error(`zip 包包含重复路径: ${r}`)
      s[r] = t
    }
    const o = s['manifest.json']
    if (!o) throw new Error('zip 包根目录必须包含 manifest.json')
    let p
    try {
      p = JSON.parse(t(o))
    } catch {
      throw new Error('manifest.json 不是有效 JSON')
    }
    if (
      !(
        p &&
        'string' == typeof p.appId &&
        'string' == typeof p.name &&
        'string' == typeof p.version &&
        'string' == typeof p.entry &&
        p.appId &&
        p.name &&
        p.version &&
        p.entry
      )
    )
      throw new Error('manifest.json 必须包含 appId/name/version/entry')
    u(p)
    const c = g(p.entry)
    if (!c || c !== p.entry) throw new Error('manifest.entry 必须是规范的相对 POSIX 路径')
    if (!s[c]) throw new Error(`zip 包中找不到入口文件: ${p.entry}`)
    if (a && (p.appId !== a.appId || p.version !== a.version)) throw new Error('manifest 身份与微应用包元数据不匹配')
    if ((null == a ? void 0 : a.entry) && p.entry !== a.entry) throw new Error('manifest 入口与微应用包元数据不匹配')
    return { manifest: p, files: s }
  },
  E = (e) =>
    e.endsWith('.js')
      ? 'text/javascript'
      : e.endsWith('.css')
        ? 'text/css'
        : e.endsWith('.svg')
          ? 'image/svg+xml'
          : e.endsWith('.png')
            ? 'image/png'
            : e.endsWith('.jpg') || e.endsWith('.jpeg')
              ? 'image/jpeg'
              : e.endsWith('.webp')
                ? 'image/webp'
                : e.endsWith('.json')
                  ? 'application/json'
                  : e.endsWith('.html')
                    ? 'text/html'
                    : 'application/octet-stream',
  z = async (e, t, r) => {
    const a = `preview-${(o = t).appId}-${o.version}-${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      n = D(e, t),
      i = await O(
        {
          appId: n.manifest.appId,
          version: t.version,
          manifest: t,
          zipBase64: e,
          packageSha256: 'preview',
          installedAt: new Date().toISOString(),
          storage: l() ? 'appData' : 'localStorage'
        },
        r
      ),
      s = {
        key: a,
        appId: t.appId,
        version: t.version,
        title: t.name || t.appId,
        subtitle: `${t.appId} / ${t.version}`,
        runtimeUrl: i,
        createdAt: new Date().toISOString()
      }
    var o
    return sessionStorage.setItem(h(a), JSON.stringify(s)), s
  },
  O = async (e, i) => {
    if (!e.zipBase64) throw new Error('微应用本地 zip 包不存在')
    if (!l() || 'appData' !== e.storage)
      return ((e, r) => {
        if (!e.zipBase64) throw new Error('微应用本地 zip 包不存在')
        u(e)
        const { manifest: a, files: n } = D(e.zipBase64, { ...e, entry: e.manifest.entry }),
          i = {}
        for (const [t, w] of Object.entries(n))
          t !== a.entry && (i[t] = URL.createObjectURL(new Blob([w], { type: E(t) })))
        const s = t(n[a.entry]),
          o = `<script>window.__STARLIGHT_MICRO_APP__=${JSON.stringify(r)};window.parent&&window.parent.postMessage({type:'STARLIGHT_MICRO_APP_READY',appId:${JSON.stringify(e.appId)}},'*');<\/script>`,
          p =
            ((c = s.includes('</head>') ? s.replace('</head>', `${o}</head>`) : `${o}${s}`),
            (l = i),
            c.replace(/(src|href)=(['"])([^'"]+)\2/g, (e, t, r, a) => {
              if (/^(https?:|data:|blob:|#|javascript:)/i.test(a)) return e
              const n = a.replace(/^\.\//, ''),
                i = g(n)
              if (!i) return e
              const s = l[i]
              return s ? `${t}=${r}${s}${r}` : e
            }))
        var c, l
        return URL.createObjectURL(new Blob([p], { type: 'text/html' }))
      })(e, i)
    u(e)
    const { manifest: s, files: o } = D(e.zipBase64, { ...e, entry: e.manifest.entry }),
      p = w(e.appId, e.version)
    await r(p, { baseDir: a.AppData, recursive: !0 })
    for (const [t, l] of Object.entries(o)) {
      const e = t.split('/').slice(0, -1).join('/')
      e && (await r(`${p}/${e}`, { baseDir: a.AppData, recursive: !0 })),
        await n(`${p}/${t}`, l, { baseDir: a.AppData })
    }
    const c = t(o[s.entry]),
      h = `<script>window.__STARLIGHT_MICRO_APP__=${JSON.stringify(i)};window.parent&&window.parent.postMessage({type:'STARLIGHT_MICRO_APP_READY',appId:${JSON.stringify(e.appId)}},'*');<\/script>`,
      d = c.includes('</head>') ? c.replace('</head>', `${h}</head>`) : `${h}${c}`
    return (
      await n(`${p}/__runtime.html`, new TextEncoder().encode(d), { baseDir: a.AppData }),
      `starlight-micro://localhost/${e.appId}/${e.version}/__runtime.html`
    )
  }
export { z as a, A as b, _ as c, S as d, O as e, v as g, $ as i, D as p }
