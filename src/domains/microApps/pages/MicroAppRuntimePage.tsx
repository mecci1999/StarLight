import { defineComponent, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NEmpty, NSpace, NSpin, useMessage } from 'naive-ui'
import PageHeader from '@/shared/layout/PageHeader'
import { getMicroAppRuntimeTicket } from '@/api/microApps'
import url from '@/api/url'
import { buildMicroAppRuntimeUrl, getInstalledMicroApp } from '../services/localMicroAppStore'
import './MicroAppRuntimePage.scss'

export default defineComponent({
  name: 'MicroAppRuntimePage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const message = useMessage()
    const loading = ref(false)
    const frameUrl = ref('')
    const errorText = ref('')
    const installedName = ref('微应用运行')
    const installedSubtitle = ref('本地微应用容器')
    const appId = computed(() => String(route.params.appId || ''))

    const boot = async () => {
      loading.value = true
      errorText.value = ''
      try {
        const localApp = await getInstalledMicroApp(appId.value)
        if (!localApp) {
          errorText.value = '该微应用尚未下载到本地，请先回到微应用列表下载。'
          return
        }
        installedName.value = localApp.manifest.name
        installedSubtitle.value = `${localApp.appId} / ${localApp.version}`
        const runtimePayload = await getMicroAppRuntimeTicket({ appId: localApp.appId, version: localApp.version })
        const payloadWithEndpoints = {
          ...(runtimePayload as Record<string, unknown>),
          endpoints: {
            exchangeSession: url.microAppExchangeSession,
            scopedApi: url.microAppScopedApi
          }
        }
        if (frameUrl.value) URL.revokeObjectURL(frameUrl.value)
        frameUrl.value = await buildMicroAppRuntimeUrl(localApp, payloadWithEndpoints)
      } catch (error) {
        console.error('Failed to boot micro app:', error)
        errorText.value = '微应用运行票据获取失败，请确认你仍有使用权限。'
        message.error(errorText.value)
      } finally {
        loading.value = false
      }
    }

    onMounted(boot)

    return () => (
      <div class="micro-app-runtime">
        <PageHeader title={installedName.value} subtitle={installedSubtitle.value} />
        <NCard bordered={false} class="micro-app-runtime__shell">
          <div class="micro-app-runtime__toolbar">
            <div class="micro-app-runtime__toolbar-main">
              <strong>本地包加载</strong>
              <span>运行时只注入短期 ticket，不暴露客户端主 token。</span>
            </div>
            <NSpace class="micro-app-runtime__toolbar-actions">
              <NButton secondary onClick={() => router.push('/home/micro-apps')}>
                返回列表
              </NButton>
              <NButton type="primary" onClick={boot}>
                重新加载
              </NButton>
            </NSpace>
          </div>

          <div class="micro-app-runtime__status-strip">
            <span>Sandbox iframe</span>
            <span>Scoped API</span>
            <span>Runtime ticket</span>
          </div>

          {loading.value ? (
            <div class="micro-app-runtime__state">
              <NSpin size="large" />
            </div>
          ) : errorText.value ? (
            <div class="micro-app-runtime__state">
              <NEmpty description={errorText.value} />
            </div>
          ) : (
            <iframe
              class="micro-app-runtime__frame"
              src={frameUrl.value}
              sandbox="allow-scripts allow-forms allow-popups"
            />
          )}
        </NCard>
      </div>
    )
  }
})
