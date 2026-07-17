import { defineComponent, ref, onMounted, computed } from 'vue'
import { NCard, NButton, NTag, NSpin, NEmpty, NStatistic, NIcon } from 'naive-ui'
import { PhArrowsClockwise, PhCpu, PhCheckCircle, PhXCircle, PhWarningCircle } from '@phosphor-icons/vue'
import { getAppKeys, generateAppKey, deleteAppKey, getIngestionStatus } from '@/api/metrics'
import './MobileIngestion.scss'

// ── Types ──────────────────────────────────
type AppKeyItem = {
  id?: string
  name?: string
  keyName?: string
  appKey?: string
  keyId?: string
  appSecret?: string
  status?: string
  isActive?: boolean
  createdAt?: string
  lastUsed?: string
  description?: string
}

type IngestionStatus = {
  totalKeys?: number
  activeKeys?: number
  expiredKeys?: number
  status?: string
  lastActivityAt?: string
  [key: string]: any
}

// ── Component ──────────────────────────────
export default defineComponent({
  name: 'MobileIngestion',
  setup() {
    // ── State ────────────────────────────────
    const loading = ref(false)
    const error = ref(false)
    const appKeys = ref<AppKeyItem[]>([])
    const ingestionStatus = ref<IngestionStatus | null>(null)

    // ── Expand state ─────────────────────────
    const expandedKey = ref<string | null>(null)
    const showGenerateForm = ref(false)
    const generateFormName = ref('')
    const generateFormDesc = ref('')

    // ── Computed ─────────────────────────────
    const sourceCount = computed(() => ingestionStatus.value?.totalKeys ?? appKeys.value.length)
    const activeCount = computed(
      () => ingestionStatus.value?.activeKeys ?? appKeys.value.filter((item) => item.isActive !== false).length
    )
    const inactiveCount = computed(() => {
      const expired = ingestionStatus.value?.expiredKeys
      if (expired !== undefined) return expired + (sourceCount.value - activeCount.value - expired)
      return appKeys.value.filter((item) => item.status === 'expired' || item.isActive === false).length
    })
    const errorCount = computed(
      () => appKeys.value.filter((item) => item.status === 'error' || item.status === 'revoked').length
    )
    const connectionStatus = computed(() => {
      if (ingestionStatus.value?.status === 'connected' || activeCount.value > 0) return 'connected'
      return 'pending'
    })
    const recentActivity = computed(() => ingestionStatus.value?.lastActivityAt || '暂无活动')

    // ── Data loading ─────────────────────────
    const loadData = async () => {
      loading.value = true
      error.value = false
      try {
        const [keysRes, statusRes] = await Promise.all([getAppKeys(), getIngestionStatus()])
        appKeys.value = Array.isArray(keysRes) ? keysRes : []
        ingestionStatus.value = statusRes || null
      } catch {
        error.value = true
        appKeys.value = []
        ingestionStatus.value = null
      } finally {
        loading.value = false
      }
    }

    onMounted(loadData)

    // ── Helpers ──────────────────────────────
    const getSourceStatus = (item: AppKeyItem): 'active' | 'inactive' | 'error' | 'expired' => {
      if (item.status === 'expired') return 'expired'
      if (item.status === 'error' || item.status === 'revoked') return 'error'
      if (item.isActive === false) return 'inactive'
      return 'active'
    }

    const getStatusTagType = (status: string): 'success' | 'warning' | 'error' | 'default' => {
      switch (status) {
        case 'active':
          return 'success'
        case 'expired':
          return 'warning'
        case 'error':
        case 'revoked':
          return 'error'
        default:
          return 'default'
      }
    }

    const getStatusLabel = (status: string): string => {
      switch (status) {
        case 'active':
          return '活跃'
        case 'inactive':
          return '已停用'
        case 'expired':
          return '已过期'
        case 'error':
          return '异常'
        case 'revoked':
          return '已撤销'
        default:
          return status
      }
    }

    const formatTime = (time?: string) => {
      if (!time) return '—'
      return time.replace('T', ' ').slice(0, 16)
    }

    // ── Actions ──────────────────────────────
    const toggleExpand = (key: string) => {
      expandedKey.value = expandedKey.value === key ? null : key
    }

    const handleGenerate = async () => {
      if (!generateFormName.value.trim()) return
      try {
        await generateAppKey({
          name: generateFormName.value,
          description: generateFormDesc.value
        })
        generateFormName.value = ''
        generateFormDesc.value = ''
        showGenerateForm.value = false
        window.$message.success('AppKey 已生成')
        await loadData()
      } catch {
        window.$message.error('生成 AppKey 失败')
      }
    }

    const handleRevoke = async (item: AppKeyItem) => {
      const keyId = item.keyId || item.id
      if (!keyId) return
      try {
        await deleteAppKey({ keyId: String(keyId) })
        window.$message.success('AppKey 已撤销')
        await loadData()
      } catch {
        window.$message.error('撤销 AppKey 失败')
      }
    }

    // ── Render helpers ───────────────────────
    const renderStatusSummary = () => {
      return (
        <div class="mobile-ingestion__summary-grid">
          <NCard size="small" bordered={false} class="mobile-ingestion__summary-card">
            <NStatistic label="总接入源" value={sourceCount.value} />
          </NCard>
          <NCard
            size="small"
            bordered={false}
            class="mobile-ingestion__summary-card mobile-ingestion__summary-card--active">
            <NStatistic label="活跃" value={activeCount.value} />
          </NCard>
          <NCard
            size="small"
            bordered={false}
            class="mobile-ingestion__summary-card mobile-ingestion__summary-card--inactive">
            <NStatistic label="非活跃" value={inactiveCount.value} />
          </NCard>
          <NCard
            size="small"
            bordered={false}
            class="mobile-ingestion__summary-card mobile-ingestion__summary-card--error">
            <NStatistic label="异常" value={errorCount.value} />
          </NCard>
        </div>
      )
    }

    const renderConnectionBadge = () => {
      const isConnected = connectionStatus.value === 'connected'
      return (
        <div class="mobile-ingestion__connection-badge">
          <NIcon size={16} color={isConnected ? 'var(--color-success-6)' : 'var(--color-warning-6)'}>
            {isConnected ? <PhCheckCircle /> : <PhWarningCircle />}
          </NIcon>
          <span>{isConnected ? '已接入' : '待接入'}</span>
        </div>
      )
    }

    const renderSourceCard = (item: AppKeyItem, index: number) => {
      const sourceStatus = getSourceStatus(item)
      const key = item.appKey || item.keyName || item.name || `source-${index}`
      const isExpanded = expandedKey.value === key

      return (
        <div
          key={key}
          class={['mobile-ingestion__source-card', isExpanded ? 'mobile-ingestion__source-card--expanded' : '']}
          onClick={() => toggleExpand(key)}>
          <NCard size="small" bordered={false}>
            <div class="mobile-ingestion__source-header">
              <div class="mobile-ingestion__source-info">
                <div class="mobile-ingestion__source-name">{item.name || item.keyName || item.appKey || '-'}</div>
                <div class="mobile-ingestion__source-meta">
                  <span class="mobile-ingestion__source-key">{key}</span>
                </div>
              </div>
              <div class="mobile-ingestion__source-badges">
                <NTag size="tiny" bordered={false} type={getStatusTagType(sourceStatus)}>
                  {getStatusLabel(sourceStatus)}
                </NTag>
                <NIcon
                  class={[
                    'mobile-ingestion__source-chevron',
                    isExpanded ? 'mobile-ingestion__source-chevron--open' : ''
                  ]}
                  size={16}>
                  <PhCpu />
                </NIcon>
              </div>
            </div>

            <div class="mobile-ingestion__source-detail-row">
              <span class="mobile-ingestion__source-detail-label">最近活动</span>
              <span class="mobile-ingestion__source-detail-value">{formatTime(item.lastUsed || item.createdAt)}</span>
            </div>

            {isExpanded && (
              <div class="mobile-ingestion__source-expanded">
                <div class="mobile-ingestion__source-divider" />

                <div class="mobile-ingestion__source-detail-grid">
                  <div class="mobile-ingestion__source-detail-item">
                    <span class="mobile-ingestion__source-detail-label">来源标识</span>
                    <span class="mobile-ingestion__source-detail-value">{key}</span>
                  </div>
                  {item.appSecret && (
                    <div class="mobile-ingestion__source-detail-item">
                      <span class="mobile-ingestion__source-detail-label">AppSecret</span>
                      <span class="mobile-ingestion__source-detail-value">{item.appSecret.slice(0, 8)}********</span>
                    </div>
                  )}
                  <div class="mobile-ingestion__source-detail-item">
                    <span class="mobile-ingestion__source-detail-label">状态</span>
                    <NTag size="tiny" bordered={false} type={getStatusTagType(sourceStatus)}>
                      {getStatusLabel(sourceStatus)}
                    </NTag>
                  </div>
                  {item.description && (
                    <div class="mobile-ingestion__source-detail-item">
                      <span class="mobile-ingestion__source-detail-label">描述</span>
                      <span class="mobile-ingestion__source-detail-value">{item.description}</span>
                    </div>
                  )}
                </div>

                {sourceStatus !== 'active' && sourceStatus !== 'expired' && (
                  <div class="mobile-ingestion__source-actions">
                    <NButton
                      size="tiny"
                      type="error"
                      secondary
                      onClick={(e: Event) => {
                        e.stopPropagation()
                        handleRevoke(item)
                      }}>
                      <NIcon size={14}>
                        <PhXCircle />
                      </NIcon>
                      <span class="mobile-ingestion__source-action-label">撤销</span>
                    </NButton>
                  </div>
                )}
              </div>
            )}
          </NCard>
        </div>
      )
    }

    // ── Main content render ──────────────────
    const renderContent = () => {
      if (loading.value) {
        return (
          <div class="mobile-ingestion__loading">
            <NSpin size="medium" />
          </div>
        )
      }

      if (error.value) {
        return (
          <div class="mobile-ingestion__error-state">
            <NEmpty description="接入数据加载失败">
              {{
                action: () => (
                  <NButton size="small" type="primary" onClick={loadData}>
                    重新加载
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        )
      }

      if (appKeys.value.length === 0) {
        return (
          <div class="mobile-ingestion__empty-state">
            <NEmpty description="暂无接入源，请先生成 AppKey">
              {{
                action: () => (
                  <NButton size="small" type="primary" onClick={() => (showGenerateForm.value = true)}>
                    生成 AppKey
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        )
      }

      return (
        <div class="mobile-ingestion__source-list">
          {appKeys.value.map((item, index) => renderSourceCard(item, index))}
        </div>
      )
    }

    // ── Generate form ────────────────────────
    const renderGenerateForm = () => {
      if (!showGenerateForm.value) return null
      return (
        <NCard size="small" bordered={false} class="mobile-ingestion__generate-card">
          <div class="mobile-ingestion__generate-header">
            <span class="mobile-ingestion__generate-title">生成 AppKey</span>
            <NButton
              size="tiny"
              quaternary
              onClick={() => {
                showGenerateForm.value = false
                generateFormName.value = ''
                generateFormDesc.value = ''
              }}>
              <NIcon size={16}>
                <PhXCircle />
              </NIcon>
            </NButton>
          </div>
          <div class="mobile-ingestion__generate-body">
            <input
              class="mobile-ingestion__generate-input"
              placeholder="名称（例如：growth-service-prod）"
              value={generateFormName.value}
              onInput={(e: Event) => {
                generateFormName.value = (e.target as HTMLInputElement).value
              }}
            />
            <input
              class="mobile-ingestion__generate-input"
              placeholder="描述（可选）"
              value={generateFormDesc.value}
              onInput={(e: Event) => {
                generateFormDesc.value = (e.target as HTMLInputElement).value
              }}
            />
            <NButton size="small" type="primary" block onClick={handleGenerate}>
              生成
            </NButton>
          </div>
        </NCard>
      )
    }

    // ── Main render ──────────────────────────
    return () => (
      <div class="mobile-ingestion">
        {/* ── Header ──────────────────────────── */}
        <div class="mobile-ingestion__header">
          <div>
            <h2 class="mobile-ingestion__title">接入管理</h2>
            <div class="mobile-ingestion__subtitle">
              {sourceCount.value} 个接入源 · {activeCount.value} 活跃 · {recentActivity.value}
            </div>
          </div>
          <div class="mobile-ingestion__header-actions">
            <NButton
              size="small"
              secondary
              type="primary"
              onClick={() => (showGenerateForm.value = !showGenerateForm.value)}>
              + 生成
            </NButton>
            <NButton size="small" secondary type="primary" onClick={loadData}>
              <NIcon size={16}>
                <PhArrowsClockwise />
              </NIcon>
            </NButton>
          </div>
        </div>

        {/* ── Connection badge ────────────────── */}
        {!loading.value && !error.value && renderConnectionBadge()}

        {/* ── Status summary ──────────────────── */}
        {!loading.value && !error.value && appKeys.value.length > 0 && renderStatusSummary()}

        {/* ── Generate form ───────────────────── */}
        {renderGenerateForm()}

        {/* ── Source list ─────────────────────── */}
        {renderContent()}
      </div>
    )
  }
})
