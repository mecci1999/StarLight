!(function () {
  'use strict'
  const e = async (e) => {
    try {
      const r = performance.now(),
        n = performance.now(),
        t = await (async () => {
          const e = {},
            r = {
              webgl: async () => {
                try {
                  return !!new OffscreenCanvas(1, 1).getContext('webgl')
                } catch {
                  return !1
                }
              },
              canvas: async () => {
                try {
                  return !!new OffscreenCanvas(1, 1).getContext('2d')
                } catch {
                  return !1
                }
              },
              audio: async () => {
                try {
                  return !(!self.AudioContext && !self.webkitAudioContext)
                } catch {
                  return !1
                }
              }
            }
          return (
            (
              await Promise.all(
                Object.entries(r).map(async ([e, r]) => {
                  try {
                    return [e, await r()]
                  } catch {
                    return [e, !1]
                  }
                })
              )
            ).forEach(([r, n]) => {
              e[r] = n
            }),
            e
          )
        })(),
        o = performance.now() - n
      console.log(`Worker: 特征检测耗时: ${o.toFixed(2)}ms`)
      const a = performance.now(),
        s = JSON.stringify({
          browserFingerprint: e.browserFingerprint,
          deviceInfo: e.deviceInfo,
          browserFeatures: t,
          timestamp: Date.now()
        }),
        c = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)),
        i = Array.from(new Uint8Array(c))
          .map((e) => e.toString(16).padStart(2, '0'))
          .join(''),
        f = performance.now() - a
      console.log(`Worker: SHA-256计算耗时: ${f.toFixed(2)}ms`)
      const w = performance.now() - r
      return console.log(`Worker: 指纹生成总耗时: ${w.toFixed(2)}ms`), i
    } catch (r) {
      return console.error('Worker: ❌ 生成设备指纹失败:', r), ''
    }
  }
  self.onmessage = async (r) => {
    const { type: n, deviceInfo: t, browserFingerprint: o } = r.data
    if ('generateFingerprint' === n) {
      const r = await e({ deviceInfo: t, browserFingerprint: o })
      self.postMessage({ type: 'fingerprintGenerated', fingerprint: r })
    }
  }
})()
