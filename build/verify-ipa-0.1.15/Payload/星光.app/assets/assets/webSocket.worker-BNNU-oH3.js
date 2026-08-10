!(function () {
  'use strict'
  var e = ((e) => (
      (e.CONNECTING = 'connecting'),
      (e.CONNECTED = 'connected'),
      (e.DISCONNECTED = 'disconnected'),
      (e.RECONNECTING = 'reconnecting'),
      (e.MESSAGE = 'message'),
      (e.ERROR = 'error'),
      e
    ))(e || {}),
    t = ((e) => (
      (e.OPEN = 'open'), (e.MESSAGE = 'message'), (e.CLOSE = 'close'), (e.ERROR = 'error'), (e.WS_ERROR = 'wsError'), e
    ))(t || {})
  const n = ({ type: e, value: t }) => {
    self.postMessage(JSON.stringify({ type: e, value: t }))
  }
  let o = null,
    s = null
  let l = 0,
    a = !1,
    r = null,
    c = null,
    i = e.DISCONNECTED
  const E = (e) => {
    null == o || o.send(JSON.stringify(e))
  }
  let u = null
  const S = () => {
      if ((s && (clearInterval(s), (s = null)), u && (clearTimeout(u), (u = null)), !a)) {
        if (l >= 5)
          return (
            console.log('达到最大重连次数，停止重连'),
            void n({ type: t.WS_ERROR, value: { msg: '连接失败次数过多，请刷新页面重试' } })
          )
        var o
        O(e.RECONNECTING),
          (a = !0),
          n({
            type: 'startReconnectTimer',
            value: { delay: ((o = l), Math.min(1e3 * Math.pow(2, o), 3e4) + 1e3 * Math.random()), reconnectCount: l }
          })
      }
    },
    N = () => {
      console.log('❌ WebSocket 连接错误'),
        (null == o ? void 0 : o.readyState) === WebSocket.OPEN
          ? (S(), n({ type: t.ERROR }))
          : n({ type: t.WS_ERROR, value: { msg: '连接失败，请检查网络或联系管理员' } })
    },
    d = () => {
      console.log('📡 WebSocket 连接断开'), (o = null), O(e.DISCONNECTED), S(), n({ type: t.CLOSE })
    },
    g = () => {
      console.log('✅ WebSocket 连接成功'),
        O(e.CONNECTED),
        n({ type: t.OPEN }),
        (s = setInterval(() => {
          E({ type: 'ping' }),
            u && clearTimeout(u),
            (u = setTimeout(() => {
              console.log('心跳超时，重连...'), (null == o ? void 0 : o.readyState) === WebSocket.OPEN && o.close()
            }, 15e3))
        }, 9900))
    },
    p = (e) => {
      u && (clearTimeout(u), (u = null)), n({ type: t.MESSAGE, value: e.data })
    },
    O = (e) => {
      ;(i = e), n({ type: 'connectionStateChange', value: { state: i } })
    },
    R = () => {
      if (
        (console.log('🚀 开始初始化 WebSocket 连接'),
        O(e.CONNECTING),
        null == o || o.removeEventListener('message', p),
        (null == o ? void 0 : o.readyState) === WebSocket.OPEN ||
          (null == o ? void 0 : o.readyState) === WebSocket.CONNECTING)
      )
        return
      const t = new URL(
        (() => {
          const e = String('wss://api.starlight.host/ws').trim()
          if (e && !e.includes('/api/')) return e
          e.includes('/api/') &&
            console.warn('VITE_WEBSOCKET_URL 指向了 HTTP API 路径，已回退到默认 WebSocket 地址:', e)
          const t = String('https://api.starlight.host').trim()
          if (t) {
            const e = new URL(t)
            return (
              (e.protocol = 'https:' === e.protocol ? 'wss:' : 'ws:'),
              (e.pathname = '/ws'),
              (e.search = ''),
              (e.hash = ''),
              e.toString().replace(/\/$/, '')
            )
          }
          return 'wss://api.starlight.host/ws'
        })()
      )
      t.searchParams.set('clientId', c || ''),
        r && t.searchParams.set('token', r),
        (o = new WebSocket(t.toString())),
        o.addEventListener('message', p),
        o.addEventListener('open', g),
        o.addEventListener('close', d),
        o.addEventListener('error', N)
    }
  self.onmessage = (e) => {
    console.log(e.data)
    const { type: s, value: i } = JSON.parse(e.data)
    switch (s) {
      case 'initWS':
        ;(l = 0), (r = i.token), (c = i.clientId), R()
        break
      case 'message':
        if (1 !== (null == o ? void 0 : o.readyState)) return
        E(i)
        break
      case 'reconnectTimeout':
        ;(l = i.reconnectCount + 1),
          l < 5
            ? (R(), (a = !1))
            : (console.log('达到最大重连次数，停止重连'),
              n({ type: t.WS_ERROR, value: { msg: '连接失败次数过多，请刷新页面重试' } }))
    }
  }
})()
