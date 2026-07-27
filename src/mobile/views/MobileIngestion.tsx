import { defineComponent, ref, onActivated, computed } from 'vue'
import { Button, Empty, Loading } from 'vant'
import { MobileTag } from '@/mobile/ui'
import { PhArrowsClockwise, PhCpu, PhCheckCircle, PhXCircle, PhWarningCircle } from '@phosphor-icons/vue'
import { getAppKeys, generateAppKey, deleteAppKey, getIngestionStatus } from '@/api/metrics'
import { mobileFeedback } from '@/mobile/services/mobileFeedback'
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

    onActivated(loadData)

    // ── Helpers ──────────────────────────────
    const getSourceStatus = (item: AppKeyItem): 'active' | 'inactive' | 'error' | 'expired' => {
      if (item.status === 'expired') return 'expired'
      if (item.status === 'error' || item.status === 'revoked') return 'error'
      if (item.isActive === false) return 'inactive'
      return 'active'
    }

    const getStatusTagType = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
      switch (status) {
        case 'active':
          return 'success'
        case 'expired':
          return 'warning'
        case 'error':
        case 'revoked':
          return 'danger'
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
        await mobileFeedback.confirm({
          title: '确认撤销',
          message: `确定要撤销 AppKey「${item.name || item.keyName || keyId}」吗？此操作不可撤销。`,
          confirmButtonText: '撤销',
          cancelButtonText: '取消'
        })
        await deleteAppKey({ keyId: String(keyId) })
        window.$message.success('AppKey 已撤销')
        await loadData()
      } catch (err) {
        if (err !== 'cancel') {
          window.$message.error('撤销 AppKey 失败')
        }
      }
    }

    // ── Render helpers ───────────────────────
    const renderStatusSummary = () => {
      return (
        <div class="mobile-ingestion__summary-grid">
          <div class="mobile-ingestion__summary-card">
            <div class="mobile-ingestion__summary-label">总接入源</div>
            <div class="mobile-ingestion__summary-value">{sourceCount.value}</div>
          </div>
          <div class="mobile-ingestion__summary-card mobile-ingestion__summary-card--active">
            <div class="mobile-ingestion__summary-label">活跃</div>
            <div class="mobile-ingestion__summary-value">{activeCount.value}</div>
          </div>
          <div class="mobile-ingestion__summary-card mobile-ingestion__summary-card--inactive">
            <div class="mobile-ingestion__summary-label">非活跃</div>
            <div class="mobile-ingestion__summary-value">{inactiveCount.value}</div>
          </div>
          <div class="mobile-ingestion__summary-card mobile-ingestion__summary-card--error">
            <div class="mobile-ingestion__summary-label">异常</div>
            <div class="mobile-ingestion__summary-value">{errorCount.value}</div>
          </div>
        </div>
      )
    }

    const renderConnectionBadge = () => {
      const isConnected = connectionStatus.value === 'connected'
      return (
        <div class="mobile-ingestion__connection-badge">
          <span class="mobile-ingestion__connection-icon" aria-hidden="true">
            {isConnected ? <PhCheckCircle size={16} /> : <PhWarningCircle size={16} />}
          </span>
          <span>{isConnected ? '已接入' : '待接入'}</span>
        </div>
      )
    }

    const renderSourceCard = (item: AppKeyItem, index: number) => {
      const sourceStatus = getSourceStatus(item)
      const key = item.appKey || item.keyName || item.name || `source-${index}`
      const isExpanded = expandedKey.value === key

      return (
        <article
          class={['mobile-ingestion__source-card', isExpanded ? 'mobile-ingestion__source-card--expanded' : '']}
          role="button"
          tabindex="0"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? '收起' : '展开'}接入源：${item.name || item.keyName || item.appKey || '-'}`}
          onClick={() => toggleExpand(key)}
          onKeydown={(event: KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggleExpand(key)
            }
          }}>
          <div class="mobile-ingestion__source-card-inner">
            <div class="mobile-ingestion__source-header">
              <div class="mobile-ingestion__source-info">
                <div class="mobile-ingestion__source-name">{item.name || item.keyName || item.appKey || '-'}</div>
                <div class="mobile-ingestion__source-meta">
                  <span class="mobile-ingestion__source-key">{key}</span>
                </div>
              </div>
              <div class="mobile-ingestion__source-badges">
                <MobileTag size="small" type={getStatusTagType(sourceStatus)}>
                  {getStatusLabel(sourceStatus)}
                </MobileTag>
                <PhCpu
                  class={[
                    'mobile-ingestion__source-chevron',
                    isExpanded ? 'mobile-ingestion__source-chevron--open' : ''
                  ]}
                  size={16}
                />
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
                    <MobileTag size="small" type={getStatusTagType(sourceStatus)}>
                      {getStatusLabel(sourceStatus)}
                    </MobileTag>
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
                    <Button
                      size="small"
                      type="default"
                      class="mobile-ingestion__revoke-button"
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        handleRevoke(item)
                      }}>
                      <PhXCircle size={14} />
                      <span class="mobile-ingestion__source-action-label">撤销</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      )
    }

    // ── Main content render ──────────────────
    const renderContent = () => {
      if (loading.value) {
        return (
          <div class="mobile-ingestion__loading">
            <Loading size="28px" />
          </div>
        )
      }

      if (error.value) {
        return (
          <div class="mobile-ingestion__error-state">
            <div class="mobile-ingestion__error-content">
              <Empty description="接入数据加载失败" />
              <Button size="small" type="primary" onClick={loadData}>
                重新加载
              </Button>
            </div>
          </div>
        )
      }

      if (appKeys.value.length === 0) {
        return (
          <div class="mobile-ingestion__empty-state">
            <div class="mobile-ingestion__empty-content">
              <Empty description="暂无接入源，请先生成 AppKey" />
              <Button size="small" type="primary" onClick={() => (showGenerateForm.value = true)}>
                生成 AppKey
              </Button>
            </div>
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
        <section class="mobile-ingestion__generate-card">
          <div class="mobile-ingestion__generate-header">
            <span class="mobile-ingestion__generate-title">生成 AppKey</span>
            <Button
              size="small"
              type="default"
              plain
              aria-label="关闭生成 AppKey 表单"
              onClick={() => {
                showGenerateForm.value = false
                generateFormName.value = ''
                generateFormDesc.value = ''
              }}>
              <PhXCircle size={16} />
            </Button>
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
            <Button size="small" type="primary" block onClick={handleGenerate}>
              生成
            </Button>
          </div>
        </section>
      )
    }

    // ── Main render ──────────────────────────
    return () => (
      <div class="mobile-ingestion">
        {/* ── Header ──────────────────────────── */}
        <header class="mobile-ingestion__header">
          <div>
            <h2 class="mobile-ingestion__title">接入管理</h2>
            <div class="mobile-ingestion__subtitle">
              {sourceCount.value} 个接入源 · {activeCount.value} 活跃 · {recentActivity.value}
            </div>
          </div>
          <div class="mobile-ingestion__header-actions">
            <Button
              size="small"
              type="primary"
              plain
              onClick={() => (showGenerateForm.value = !showGenerateForm.value)}>
              + 生成
            </Button>
            <Button size="small" type="primary" plain onClick={loadData} aria-label="刷新接入数据">
              <PhArrowsClockwise size={18} />
            </Button>
          </div>
        </header>

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
