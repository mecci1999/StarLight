import { defineComponent, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  NButton,
  NTag,
  NSpin,
  NEmpty,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NTabs,
  NTabPane,
  NDescriptions,
  NDescriptionsItem,
  useMessage
} from 'naive-ui'
import { getAppKeys, generateAppKey, verifyAppKey, deleteAppKey, getIngestionStatus } from '@/api/metrics'
import PageHeader from '@/shared/layout/PageHeader'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import './IngestionPage.scss'

export default defineComponent({
  name: 'AdminIngestionPage',
  setup() {
    const router = useRouter()
    const message = useMessage()
    const loading = ref(false)
    const appKeys = ref<any[]>([])
    const ingestionStatus = ref<any>(null)
    const showGenerate = ref(false)
    const generatedAppKey = ref('')
    const generatedSecret = ref('')
    const guideTab = ref('nodejs')
    const verifyMessage = ref('')
    const verifyStatus = ref<'success' | 'default'>('default')

    const generateForm = ref({
      name: '',
      description: ''
    })

    const verifyForm = ref({
      appKey: '',
      appSecret: ''
    })

    const loadAppKeys = async () => {
      loading.value = true
      try {
        const [keysRes, statusRes] = await Promise.all([getAppKeys(), getIngestionStatus()])
        appKeys.value = Array.isArray(keysRes) ? keysRes : []
        ingestionStatus.value = statusRes
      } catch (error) {
        console.error('Failed to load app keys:', error)
        appKeys.value = []
        ingestionStatus.value = null
      } finally {
        loading.value = false
      }
    }

    onMounted(loadAppKeys)

    const appKeyCount = computed(() => ingestionStatus.value?.totalKeys ?? appKeys.value.length)
    const activeKeys = computed(
      () => ingestionStatus.value?.activeKeys ?? appKeys.value.filter((item) => item.isActive !== false).length
    )
    const expiredKeys = computed(
      () => ingestionStatus.value?.expiredKeys ?? appKeys.value.filter((item) => item.status === 'expired').length
    )
    const effectiveAppKey = computed(
      () => generatedAppKey.value || appKeys.value[0]?.appKey || appKeys.value[0]?.keyName || '请先生成 AppKey'
    )
    const connectionStatus = computed(() => {
      if (ingestionStatus.value?.status === 'connected' || activeKeys.value > 0) return 'connected'
      return 'pending'
    })
    const connectionLabel = computed(() => (connectionStatus.value === 'connected' ? '已接入' : '待接入'))
    const recentActivity = computed(() => ingestionStatus.value?.lastActivityAt || '暂无活动')

    const guideSnippets = computed(() => ({
      nodejs: `const StarLight = require('@starlight/node-sdk')

StarLight.init({
  appKey: '${effectiveAppKey.value}',
  serviceName: 'my-service',
  endpoint: 'https://api.your-starlight-domain.com'
})
`,
      go: `import "github.com/starlight/go-sdk"

func main() {
  config := starlight.Config{
    AppKey: "${effectiveAppKey.value}",
    ServiceName: "my-service",
    Endpoint: "https://api.your-starlight-domain.com",
  }

  starlight.Init(config)
  defer starlight.Close()
}
`,
      java: `import com.starlight.sdk.StarLight;

public class App {
  public static void main(String[] args) {
    StarLight.init(
      "${effectiveAppKey.value}",
      "my-service",
      "https://api.your-starlight-domain.com"
    );
  }
}
`
    }))

    const copyGuideCode = async () => {
      const code = guideSnippets.value[guideTab.value as keyof typeof guideSnippets.value]
      try {
        await writeText(code)
        message.success('接入代码已复制')
      } catch (error) {
        navigator.clipboard
          .writeText(code)
          .then(() => {
            message.success('接入代码已复制')
          })
          .catch(() => {
            message.error('复制失败')
          })
      }
    }

    const handleGenerate = async () => {
      const created = await generateAppKey({
        name: generateForm.value.name,
        description: generateForm.value.description
      })
      generatedAppKey.value = created?.appKey || ''
      generatedSecret.value = created?.appSecret || ''
      showGenerate.value = false
      generateForm.value = { name: '', description: '' }
      message.success('AppKey 已生成')
      await loadAppKeys()
    }

    const handleVerify = async () => {
      const result = await verifyAppKey({
        appKey: verifyForm.value.appKey,
        appSecret: verifyForm.value.appSecret
      })
      verifyStatus.value = result?.valid ? 'success' : 'default'
      verifyMessage.value = result?.valid ? 'AppKey 验证成功，可继续接入验证。' : '验证请求已执行，请检查接入状态。'
      message.success(result?.valid ? 'AppKey 验证成功' : 'AppKey 验证完成')
      await loadAppKeys()
    }

    const handleDelete = async (item: any) => {
      await deleteAppKey({ keyId: item.id })
      message.success('AppKey 已删除')
      await loadAppKeys()
    }

    return () => (
      <div class="ingestion-page">
        <PageHeader title="接入管理" subtitle="管理服务端 SDK 凭证、接入状态与验证流程" />

        <section class="ingestion-page__hero">
          <div class="ingestion-page__hero-main">
            <div class="ingestion-page__eyebrow">SDK Ingestion</div>
            <h2 class="ingestion-page__hero-title">让 Java、Go、Node.js 微服务稳定上报到星光</h2>
            <p class="ingestion-page__hero-desc">
              统一管理 AppKey、复制初始化代码，并在同一页面完成凭证验证与接入状态巡检。
            </p>
          </div>
          <div class="ingestion-page__hero-actions">
            <NButton type="primary" onClick={() => router.push('/home/admin-onboarding-v2')}>
              接入向导
            </NButton>
            <NButton secondary onClick={() => (showGenerate.value = true)}>
              生成 AppKey
            </NButton>
          </div>
        </section>

        <NGrid cols={3} xGap={16} yGap={16} responsive="screen" class="ingestion-page__stats-grid">
          <NGridItem>
            <NCard bordered={false} class="ingestion-page__stat-card">
              <div class="ingestion-page__stat-kicker">凭证规模</div>
              <NStatistic label="AppKey 总数" value={appKeyCount.value} />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard bordered={false} class="ingestion-page__stat-card">
              <div class="ingestion-page__stat-kicker">当前可用</div>
              <NStatistic label="可用凭证" value={activeKeys.value} />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard bordered={false} class="ingestion-page__stat-card ingestion-page__stat-card--status">
              <div class="ingestion-page__stat-kicker">接入状态</div>
              <NStatistic label="健康状态" value={connectionLabel.value} />
            </NCard>
          </NGridItem>
        </NGrid>

        <div class="ingestion-page__content-grid">
          <div class="ingestion-page__main-stack">
            <NCard bordered={false} class="ingestion-page__section-card" title="接入状态概览">
              {ingestionStatus.value ? (
                <NDescriptions column={2} bordered>
                  <NDescriptionsItem label="总 AppKey">{ingestionStatus.value.totalKeys}</NDescriptionsItem>
                  <NDescriptionsItem label="可用凭证">{ingestionStatus.value.activeKeys}</NDescriptionsItem>
                  <NDescriptionsItem label="已过期">{expiredKeys.value}</NDescriptionsItem>
                  <NDescriptionsItem label="当前状态">{connectionLabel.value}</NDescriptionsItem>
                  <NDescriptionsItem label="最近活动">{recentActivity.value}</NDescriptionsItem>
                </NDescriptions>
              ) : (
                <div class="ingestion-page__empty-state">
                  <NEmpty description="暂无接入状态数据" class="ingestion-page__list-empty" />
                </div>
              )}
            </NCard>

            {generatedAppKey.value || generatedSecret.value ? (
              <NCard bordered={false} class="ingestion-page__section-card" title="最近生成的凭证">
                <NDescriptions column={1} bordered>
                  <NDescriptionsItem label="AppKey">{generatedAppKey.value || '-'}</NDescriptionsItem>
                  <NDescriptionsItem label="AppSecret">{generatedSecret.value || '-'}</NDescriptionsItem>
                </NDescriptions>
              </NCard>
            ) : null}

            <NCard bordered={false} class="ingestion-page__section-card" title="接入指引">
              <div class="ingestion-page__header-row">
                <div class="ingestion-page__section-note">
                  选择运行时语言，复用当前 AppKey 生成初始化代码。复制后放入服务启动入口即可完成 SDK 初始化。
                </div>
                <NButton secondary onClick={copyGuideCode}>
                  复制代码
                </NButton>
              </div>
              <NTabs type="line" value={guideTab.value} onUpdateValue={(value: string) => (guideTab.value = value)}>
                <NTabPane name="nodejs" tab="Node.js">
                  <pre class="ingestion-page__code-block">
                    <code>{guideSnippets.value.nodejs}</code>
                  </pre>
                </NTabPane>
                <NTabPane name="go" tab="Go">
                  <pre class="ingestion-page__code-block">
                    <code>{guideSnippets.value.go}</code>
                  </pre>
                </NTabPane>
                <NTabPane name="java" tab="Java">
                  <pre class="ingestion-page__code-block">
                    <code>{guideSnippets.value.java}</code>
                  </pre>
                </NTabPane>
              </NTabs>
            </NCard>

            <div id="ingestion-verification-panel">
              <NCard bordered={false} class="ingestion-page__section-card" title="接入验证">
                <div class="ingestion-page__section-note">
                  使用当前 AppKey / Secret 验证接入状态，确认服务端配置已经生效。
                </div>
                <NForm>
                  <NFormItem label="AppKey">
                    <NInput v-model:value={verifyForm.value.appKey} placeholder="请输入 AppKey">
                      {{
                        suffix: () => (
                          <NButton
                            text
                            type="primary"
                            onClick={() => {
                              verifyForm.value.appKey = String(effectiveAppKey.value || '')
                            }}>
                            使用当前值
                          </NButton>
                        )
                      }}
                    </NInput>
                  </NFormItem>
                  <NFormItem label="AppSecret">
                    <NInput v-model:value={verifyForm.value.appSecret} placeholder="请输入 AppSecret" type="password" />
                  </NFormItem>
                </NForm>
                <div class="ingestion-page__verify-row">
                  <div
                    class={[
                      'ingestion-page__status-text',
                      verifyStatus.value === 'success'
                        ? 'ingestion-page__status-text--success'
                        : 'ingestion-page__status-text--muted'
                    ]}>
                    {verifyMessage.value || '尚未执行验证'}
                  </div>
                  <NButton type="primary" onClick={handleVerify}>
                    立即验证
                  </NButton>
                </div>
              </NCard>
            </div>
          </div>

          <aside class="ingestion-page__side-stack">
            <NCard bordered={false} class="ingestion-page__section-card" title="快速入口">
              <div class="ingestion-page__quick-actions">
                <NButton type="primary" secondary onClick={() => router.push('/home/admin-onboarding-v2')}>
                  接入向导
                </NButton>
                <NButton secondary onClick={() => (showGenerate.value = true)}>
                  生成 AppKey
                </NButton>
                <NButton
                  secondary
                  onClick={() => {
                    document
                      .getElementById('ingestion-verification-panel')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}>
                  验证凭证
                </NButton>
                <NButton secondary onClick={() => router.push('/home/overview')}>
                  面板首页
                </NButton>
              </div>
            </NCard>

            <NCard bordered={false} class="ingestion-page__list-card" title="AppKey 列表">
              {loading.value ? (
                <div class="ingestion-page__list-loading">
                  <NSpin size="large" />
                </div>
              ) : appKeys.value.length ? (
                <div class="ingestion-page__list-stack">
                  {appKeys.value.map((item, index) => (
                    <div key={item.appKey || item.keyName || item.name || index} class="ingestion-page__list-item">
                      <div class="ingestion-page__list-copy">
                        <div class="ingestion-page__list-title">{item.name || item.keyName || item.appKey}</div>
                        <div class="ingestion-page__list-meta">{item.appKey || item.keyName || '-'}</div>
                      </div>
                      <NSpace align="center">
                        <NTag
                          type={item.status === 'expired' ? 'warning' : item.isActive === false ? 'default' : 'success'}
                          bordered={false}>
                          {item.status === 'expired' ? '已过期' : item.isActive === false ? '已停用' : '可用'}
                        </NTag>
                        <NButton size="small" secondary type="error" onClick={() => handleDelete(item)}>
                          撤销
                        </NButton>
                      </NSpace>
                    </div>
                  ))}
                </div>
              ) : (
                <NEmpty description="暂无 AppKey，请先完成接入向导" class="ingestion-page__list-empty" />
              )}
            </NCard>
          </aside>
        </div>

        <NModal v-model:show={showGenerate.value} preset="card" title="生成 AppKey" style={{ width: '520px' }}>
          <NForm>
            <NFormItem label="名称">
              <NInput v-model:value={generateForm.value.name} placeholder="例如：growth-service-prod" />
            </NFormItem>
            <NFormItem label="描述">
              <NInput v-model:value={generateForm.value.description} placeholder="可选描述" />
            </NFormItem>
          </NForm>
          <div class="ingestion-page__modal-actions">
            <NButton onClick={() => (showGenerate.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleGenerate}>
              生成
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
