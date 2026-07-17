import { defineComponent, ref, computed, onMounted } from 'vue'
import { NCard, NButton, NEmpty, NSpin, NTag, NResult, NIcon } from 'naive-ui'
import { PhArrowsClockwise, PhCaretDown, PhCaretUp } from '@phosphor-icons/vue'
import { listExceptions } from '@/api'
import type { ExceptionGroup } from '@/types/logs'
import './MobileExceptionAnalysis.scss'

type TimeRange = '1h' | '4h' | '1d' | '7d'
type Severity = 'critical' | 'error' | 'warning' | 'info'

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: '1h', label: '1h' },
  { key: '4h', label: '4h' },
  { key: '1d', label: '1d' },
  { key: '7d', label: '7d' }
]

const SEVERITIES: { key: Severity; label: string }[] = [
  { key: 'critical', label: 'Critical' },
  { key: 'error', label: 'Error' },
  { key: 'warning', label: 'Warning' },
  { key: 'info', label: 'Info' }
]

function inferSeverity(ex: ExceptionGroup): Severity {
  const t = (ex.type || '').toLowerCase()
  if (t.includes('fatal') || t.includes('critical') || t.includes('panic')) return 'critical'
  if (t.includes('error') || t.includes('exception')) return 'error'
  if (t.includes('warn')) return 'warning'
  return 'info'
}

export default defineComponent({
  name: 'MobileExceptionAnalysis',
  setup() {
    const loading = ref(false)
    const error = ref(false)
    const exceptions = ref<ExceptionGroup[]>([])
    const expandedIds = ref<Set<string>>(new Set())
    const timeRange = ref<TimeRange>('1d')
    const enabledSeverities = ref<Set<Severity>>(new Set(['critical', 'error', 'warning', 'info']))

    const groupedExceptions = computed(() => {
      const filtered = exceptions.value.filter((ex) => enabledSeverities.value.has(inferSeverity(ex)))
      const groups: { severity: Severity; items: ExceptionGroup[] }[] = []
      const seen = new Set<Severity>()

      for (const sev of ['critical', 'error', 'warning', 'info'] as Severity[]) {
        const items = filtered.filter((ex) => inferSeverity(ex) === sev)
        if (items.length > 0) {
          groups.push({ severity: sev, items })
          seen.add(sev)
        }
      }

      return groups
    })

    const loadExceptions = async () => {
      loading.value = true
      error.value = false
      try {
        const res = await listExceptions({})
        const items = res?.items || []
        exceptions.value = Array.isArray(items) ? items : []
      } catch {
        error.value = true
      } finally {
        loading.value = false
      }
    }

    onMounted(loadExceptions)

    const toggleExpand = (id: string) => {
      const newSet = new Set(expandedIds.value)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      expandedIds.value = newSet
    }

    const selectTimeRange = (r: TimeRange) => {
      timeRange.value = r
    }

    const toggleSeverity = (s: Severity) => {
      const newSet = new Set(enabledSeverities.value)
      if (newSet.has(s)) {
        newSet.delete(s)
      } else {
        newSet.add(s)
      }
      enabledSeverities.value = newSet
    }

    const severityCounts = computed(() => {
      const counts: Record<Severity, number> = { critical: 0, error: 0, warning: 0, info: 0 }
      for (const ex of exceptions.value) {
        counts[inferSeverity(ex)]++
      }
      return counts
    })

    const renderCard = (ex: ExceptionGroup) => (
      <div key={ex.id} class="mobile-exception-analysis__card-wrapper" onClick={() => toggleExpand(ex.id)}>
        <NCard size="small" bordered={false} class="mobile-exception-analysis__list-card">
          <div class="mobile-exception-analysis__card-header">
            <div class="mobile-exception-analysis__card-main">
              <div class="mobile-exception-analysis__card-message">
                {(ex.message || '未知异常').length > 80
                  ? (ex.message || '').slice(0, 80) + '...'
                  : ex.message || '未知异常'}
              </div>
              <div class="mobile-exception-analysis__card-meta">
                <NTag size="tiny" bordered={false} type="error">
                  {ex.type || 'Unknown'}
                </NTag>
                <span class="mobile-exception-analysis__card-count">次数: {ex.count ?? 0}</span>
                <span class="mobile-exception-analysis__card-time">{ex.lastOccurrence || '-'}</span>
              </div>
            </div>
            <div class="mobile-exception-analysis__card-expand">
              <NIcon size={18}>{expandedIds.value.has(ex.id) ? <PhCaretUp /> : <PhCaretDown />}</NIcon>
            </div>
          </div>

          {expandedIds.value.has(ex.id) && (
            <div class="mobile-exception-analysis__card-detail">
              <div class="mobile-exception-analysis__detail-section">
                <div class="mobile-exception-analysis__detail-title">完整消息</div>
                <div class="mobile-exception-analysis__detail-content">{ex.message || '-'}</div>
              </div>
              {ex.stackTrace && (
                <div class="mobile-exception-analysis__detail-section">
                  <div class="mobile-exception-analysis__detail-title">堆栈跟踪</div>
                  <pre class="mobile-exception-analysis__detail-stack">{ex.stackTrace}</pre>
                </div>
              )}
              <div class="mobile-exception-analysis__detail-section">
                <div class="mobile-exception-analysis__detail-title">其他信息</div>
                <div class="mobile-exception-analysis__detail-meta">
                  <span>服务: {ex.service || '-'}</span>
                  <span>首次出现: {ex.firstOccurrence || '-'}</span>
                  {ex.affectedUsers !== undefined && <span>受影响用户: {ex.affectedUsers}</span>}
                </div>
              </div>
            </div>
          )}
        </NCard>
      </div>
    )

    return () => (
      <div class="mobile-exception-analysis">
        <div class="mobile-exception-analysis__header">
          <div>
            <h2 class="mobile-exception-analysis__title">异常分析</h2>
          </div>
          <NButton size="small" secondary type="primary" onClick={loadExceptions}>
            <NIcon>
              <PhArrowsClockwise />
            </NIcon>
          </NButton>
        </div>

        {/* ── Time Range Filter ── */}
        <div class="mobile-exception-analysis__time-filter">
          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              class={[
                'mobile-exception-analysis__time-chip',
                { 'mobile-exception-analysis__time-chip--active': timeRange.value === r.key }
              ]}
              onClick={() => selectTimeRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>

        {/* ── Severity Filter Chips ── */}
        <div class="mobile-exception-analysis__severity-filter">
          {SEVERITIES.map((s) => (
            <button
              key={s.key}
              class={[
                'mobile-exception-analysis__severity-chip',
                `mobile-exception-analysis__severity-chip--${s.key}`,
                { 'mobile-exception-analysis__severity-chip--inactive': !enabledSeverities.value.has(s.key) }
              ]}
              onClick={() => toggleSeverity(s.key)}>
              <span class="mobile-exception-analysis__severity-chip-label">{s.label}</span>
              <span class="mobile-exception-analysis__severity-chip-badge">{severityCounts.value[s.key]}</span>
            </button>
          ))}
        </div>

        {loading.value ? (
          <div class="mobile-exception-analysis__loading">
            <NSpin size="large" />
          </div>
        ) : error.value ? (
          <NResult
            status="500"
            title="数据加载失败"
            description="请检查网络连接后重试"
            class="mobile-exception-analysis__error">
            {{
              footer: () => (
                <NButton type="primary" size="small" onClick={loadExceptions}>
                  重新加载
                </NButton>
              )
            }}
          </NResult>
        ) : exceptions.value.length === 0 ? (
          <div class="mobile-exception-analysis__empty-state">
            <NEmpty description="暂无异常数据" />
          </div>
        ) : groupedExceptions.value.length === 0 ? (
          <div class="mobile-exception-analysis__empty-state">
            <NEmpty description="无匹配的异常数据" />
          </div>
        ) : (
          <div class="mobile-exception-analysis__list">
            {groupedExceptions.value.map((group) => (
              <div key={group.severity} class="mobile-exception-analysis__severity-group">
                <div
                  class={[
                    'mobile-exception-analysis__severity-header',
                    `mobile-exception-analysis__severity-header--${group.severity}`
                  ]}>
                  <span class="mobile-exception-analysis__severity-header-label">
                    {group.severity === 'critical'
                      ? '严重'
                      : group.severity === 'error'
                        ? '错误'
                        : group.severity === 'warning'
                          ? '警告'
                          : '信息'}
                  </span>
                  <span class="mobile-exception-analysis__severity-header-badge">{group.items.length}</span>
                </div>
                {group.items.map((ex) => renderCard(ex))}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
})
