/**
 * 用 worker 来处理 websocket 连接
 */
import { ConnectionState, WorkerMsgEnum } from '@/types/enums'

// 向 主进程 发送消息
const postMessage = ({ type, value }: { type: string; value?: { [key: string]: any } }) => {
  self.postMessage(JSON.stringify({ type, value }))
}

// ws实例
let connection: WebSocket
// 心跳 timer
let heartTimer: number | null = null

// 重连次数上限
const reconnectCountMax = 5
let reconnectCount = 0

// 重连锁
let lockReconnect = false
let token: null | string = null

// 客户端id
let clientId: null | string = null

let connectionState = ConnectionState.DISCONNECTED

const resolveWebSocketUrl = () => {
  const configuredUrl = String(import.meta.env.VITE_WEBSOCKET_URL || '').trim()
  if (configuredUrl && !configuredUrl.includes('/api/')) return configuredUrl

  if (configuredUrl.includes('/api/')) {
    console.warn('VITE_WEBSOCKET_URL 指向了 HTTP API 路径，已回退到默认 WebSocket 地址:', configuredUrl)
  }

  const serviceUrl = String(import.meta.env.VITE_SERVICE_URL || '').trim()
  if (serviceUrl) {
    const endpoint = new URL(serviceUrl)
    endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:'
    endpoint.pathname = '/ws'
    endpoint.search = ''
    endpoint.hash = ''
    return endpoint.toString().replace(/\/$/, '')
  }

  return 'wss://api.starlight.host/ws'
}

// 往 ws 发送消息
const connectionSend = (value: { [key: string]: any }) => {
  connection?.send(JSON.stringify(value))
}

// 添加心跳超时检测
let heartbeatTimeout: number | null = null
const HEARTBEAT_TIMEOUT = 15 * 1000 // 心跳超时时间，单位毫秒 15s超时

// 发送心跳 10s 内发送
const sendHeartPacket = () => {
  // 10s 检测心跳
  heartTimer = setInterval(() => {
    // 心跳消息类型 2
    connectionSend({ type: 2 })

    // 清除之前的超时计时器
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout)
    }

    // 设置新的超时计时器
    heartbeatTimeout = setTimeout(() => {
      console.log('心跳超时，重连...')
      connection.close()
    }, HEARTBEAT_TIMEOUT) as any
  }, 9900) as any
}

// 清除心跳 timer
const clearHeartPacketTimer = () => {
  if (heartTimer) {
    clearInterval(heartTimer)
    heartTimer = null
  }
}

const getBackoffDelay = (retryCount: number) => {
  const baseDelay = 1000 // 基础延迟1秒
  const maxDelay = 30000 // 最大延迟30秒
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)
  return delay + Math.random() * 1000 // 添加随机抖动
}

const onCloseHandler = () => {
  clearHeartPacketTimer()
  if (lockReconnect) return

  // 重连次数限制检查
  if (reconnectCount >= reconnectCountMax) {
    console.log('达到最大重连次数，停止重连')
    postMessage({
      type: WorkerMsgEnum.WS_ERROR,
      value: { msg: '连接失败次数过多，请刷新页面重试' }
    })
    return
  }

  updateConnectionState(ConnectionState.RECONNECTING)
  lockReconnect = true

  // 使用 timer worker 发起重连
  postMessage({
    type: 'startReconnectTimer',
    value: {
      delay: getBackoffDelay(reconnectCount),
      reconnectCount
    }
  })
}

// ws 连接 error
const onConnectError = () => {
  console.log('❌ WebSocket 连接错误')
  if (connection?.readyState !== WebSocket.OPEN) {
    postMessage({ type: WorkerMsgEnum.WS_ERROR, value: { msg: '连接失败，请检查网络或联系管理员' } })
    return
  }
  onCloseHandler()
  postMessage({ type: WorkerMsgEnum.ERROR })
}
// ws 连接 close
const onConnectClose = () => {
  console.log('📡 WebSocket 连接断开')
  updateConnectionState(ConnectionState.DISCONNECTED)
  onCloseHandler()
  token = null
  postMessage({ type: WorkerMsgEnum.CLOSE })
}
// ws 连接成功
const onConnectOpen = () => {
  console.log('✅ WebSocket 连接成功')
  updateConnectionState(ConnectionState.CONNECTED)
  postMessage({ type: WorkerMsgEnum.OPEN })
  sendHeartPacket()
}

// ws 连接 接收到消息
const onConnectMsg = (e: any) => postMessage({ type: WorkerMsgEnum.MESSAGE, value: e.data })

// 更新连接状态
const updateConnectionState = (newState: ConnectionState) => {
  connectionState = newState
  postMessage({ type: 'connectionStateChange', value: { state: connectionState } })
}

// 初始化 ws 连接
const initConnection = () => {
  console.log('🚀 开始初始化 WebSocket 连接')
  updateConnectionState(ConnectionState.CONNECTING)
  connection?.removeEventListener('message', onConnectMsg)

  // 建立链接
  // 本地配置到 .env 里面修改。生产配置在 .env.production 里面
  if (!connection) {
    connection = new WebSocket(`${resolveWebSocketUrl()}?clientId=${clientId}${token ? `&token=${token}` : ''}`)
  }
  // 收到消息
  connection.addEventListener('message', onConnectMsg)
  // 建立链接
  connection.addEventListener('open', onConnectOpen)
  // 关闭连接
  connection.addEventListener('close', onConnectClose)
  // 连接错误
  connection.addEventListener('error', onConnectError)
}

self.onmessage = (e: MessageEvent<string>) => {
  console.log(e.data)
  const { type, value } = JSON.parse(e.data)
  switch (type) {
    case 'initWS': {
      reconnectCount = 0
      token = value['token']
      clientId = value['clientId']
      initConnection()
      break
    }
    case 'message': {
      if (connection?.readyState !== 1) return
      connectionSend(value)
      break
    }
    case 'reconnectTimeout': {
      reconnectCount = value.reconnectCount + 1
      // 如果没有超过最大重连次数才继续重连
      if (reconnectCount < reconnectCountMax) {
        initConnection()
        lockReconnect = false
      } else {
        console.log('达到最大重连次数，停止重连')
        postMessage({
          type: WorkerMsgEnum.WS_ERROR,
          value: { msg: '连接失败次数过多，请刷新页面重试' }
        })
      }
      break
    }
  }
}
