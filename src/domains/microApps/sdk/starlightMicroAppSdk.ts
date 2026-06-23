type RuntimePayload = {
  ticket?: string
  user?: unknown
  app?: unknown
  version?: unknown
  endpoints?: {
    exchangeSession?: string
    scopedApi?: string
  }
}

const runtime = () => (window as unknown as { __STARLIGHT_MICRO_APP__?: RuntimePayload }).__STARLIGHT_MICRO_APP__ || {}

export const starlightMicroAppSdk = {
  getRuntime() {
    return runtime()
  },

  getUserInfo() {
    return runtime().user || null
  },

  getAppInfo() {
    const data = runtime()
    return { app: data.app || null, version: data.version || null }
  },

  async exchangeSession() {
    const data = runtime()
    if (!data.ticket || !data.endpoints?.exchangeSession) throw new Error('微应用运行票据或 exchange endpoint 不存在')
    const response = await fetch(data.endpoints.exchangeSession, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket: data.ticket })
    })
    if (!response.ok) throw new Error('微应用会话换取失败')
    return response.json()
  },

  async scopedApi(scope: string, payload?: Record<string, unknown>) {
    const data = runtime()
    if (!data.endpoints?.scopedApi) throw new Error('微应用 scoped API endpoint 不存在')
    const session = await this.exchangeSession()
    const sessionToken = session?.data?.content?.sessionToken || session?.content?.sessionToken
    const response = await fetch(data.endpoints.scopedApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, scope, payload })
    })
    if (!response.ok) throw new Error('微应用 scoped API 调用失败')
    return response.json()
  }
}

export type StarlightMicroAppSdk = typeof starlightMicroAppSdk
