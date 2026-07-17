import { PhTrash } from '@phosphor-icons/vue'
import { defineComponent, ref, onMounted, computed } from 'vue'
import {
  NCard,
  NButton,
  NEmpty,
  NSpin,
  NTag,
  NResult,
  NIcon,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NTabPane,
  NTabs,
  NStatistic,
  NGrid,
  NGridItem,
  useDialog
} from 'naive-ui'
import { PhArrowsClockwise, PhPlusCircle, PhDownload, PhCloudArrowUp, PhGear } from '@phosphor-icons/vue'
import {
  fetchAlertRules,
  saveAlertRule,
  updateAlertRule,
  deleteAlertRule,
  bulkUpdateAlertRules,
  exportAlertRules,
  importAlertRules
} from '@/api'
import type { AlertRuleItem } from '@/types/monitor'
import './MobileAlertRules.scss'

const metricOptions = [
  { label: 'CPU使用率', value: 'cpu_usage' },
  { label: '内存使用率', value: 'memory_usage' },
  { label: '响应时间', value: 'response_time' },
  { label: 'QPS', value: 'qps' },
  { label: '错误率', value: 'error_rate' },
  { label: '磁盘使用率', value: 'disk_usage' }
]

const operatorOptions = [
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '等于', value: '=' },
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' }
]

const levelOptions = [
  { label: '严重', value: 'critical' },
  { label: '警告', value: 'warning' },
  { label: '信息', value: 'info' }
]

const channelOptions = [
  { label: 'Email', value: 'Email' },
  { label: 'Webhook', value: 'Webhook' },
  { label: '站内通知', value: 'InApp' }
]

export default defineComponent({
  name: 'MobileAlertRules',
  setup() {
    const dialog = useDialog()
    const loading = ref(false)
    const error = ref(false)
    const rules = ref<AlertRuleItem[]>([])

    // ── Modals ──────────────────────────────
    const showAddModal = ref(false)
    const showEditModal = ref(false)
    const showImportModal = ref(false)
    const editingRule = ref<AlertRuleItem | null>(null)
    const editMode = ref(false)
    const importPayload = ref('[]')

    // ── Filter ──────────────────────────────
    const selectedRuleType = ref<'all' | 'metrics' | 'logs' | 'trace'>('all')

    // ── Form ────────────────────────────────
    const formData = ref({
      name: '',
      service: '',
      metric: '',
      operator: '' as string,
      threshold: 0,
      duration: 5,
      level: 'warning' as string,
      enabled: true,
      notificationChannels: [] as string[]
    })

    // ── Data loading ────────────────────────
    const loadRules = async () => {
      loading.value = true
      error.value = false
      try {
        const res = await fetchAlertRules()
        rules.value = Array.isArray(res) ? res : []
      } catch {
        error.value = true
      } finally {
        loading.value = false
      }
    }

    onMounted(loadRules)

    // ── Rule type resolution ────────────────
    const resolveRuleType = (metric: string): 'metrics' | 'logs' | 'trace' => {
      const n = metric.toLowerCase()
      if (n.includes('log')) return 'logs'
      if (n.includes('trace') || n.includes('response_time')) return 'trace'
      return 'metrics'
    }

    const filteredRules = computed(() => {
      if (selectedRuleType.value === 'all') return rules.value
      return rules.value.filter((r) => resolveRuleType(r.metric) === selectedRuleType.value)
    })

    // ── Summary ─────────────────────────────
    const enabledCount = computed(() => rules.value.filter((r) => r.enabled).length)
    const criticalCount = computed(() => rules.value.filter((r) => r.level === 'critical').length)

    // ── Helpers ─────────────────────────────
    const levelTagType = (level: AlertRuleItem['level']): 'error' | 'warning' | 'info' | 'default' => {
      switch (level) {
        case 'critical':
          return 'error'
        case 'warning':
          return 'warning'
        case 'info':
          return 'info'
        default:
          return 'default'
      }
    }

    const levelLabel = (level: AlertRuleItem['level']): string => {
      switch (level) {
        case 'critical':
          return '严重'
        case 'warning':
          return '警告'
        case 'info':
          return '提示'
        default:
          return level
      }
    }

    const operatorLabel = (op: AlertRuleItem['operator']): string => {
      switch (op) {
        case '>':
          return '>'
        case '<':
          return '<'
        case '=':
          return '='
        case '>=':
          return '>='
        case '<=':
          return '<='
        default:
          return op
      }
    }

    // ── Actions ─────────────────────────────
    const handleAdd = () => {
      formData.value = {
        name: '',
        service: '',
        metric:
          selectedRuleType.value === 'logs'
            ? 'error_rate'
            : selectedRuleType.value === 'trace'
              ? 'response_time'
              : 'cpu_usage',
        operator: '',
        threshold: 0,
        duration: 5,
        level: 'warning',
        enabled: true,
        notificationChannels: []
      }
      editingRule.value = null
      showAddModal.value = true
    }

    const handleEdit = (rule: AlertRuleItem) => {
      editingRule.value = rule
      formData.value = {
        name: rule.name,
        service: rule.service,
        metric: rule.metric,
        operator: rule.operator,
        threshold: rule.threshold,
        duration: rule.duration,
        level: rule.level,
        enabled: rule.enabled,
        notificationChannels: Array.isArray(rule.channels) ? [...rule.channels] : []
      }
      showEditModal.value = true
    }

    const handleDelete = (rule: AlertRuleItem) => {
      dialog.warning({
        title: '确认删除',
        content: `确定要删除规则「${rule.name || rule.id}」吗？此操作不可撤销。`,
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await deleteAlertRule(rule.id)
            const idx = rules.value.findIndex((r) => r.id === rule.id)
            if (idx > -1) rules.value.splice(idx, 1)
          } catch (err) {
            console.error('Failed to delete alert rule:', err)
          }
        }
      })
    }

    const handleToggle = async (rule: AlertRuleItem) => {
      try {
        const updated = await updateAlertRule({ ...rule, enabled: !rule.enabled })
        Object.assign(rule, updated)
      } catch (err) {
        console.error('Failed to toggle alert rule:', err)
      }
    }

    const handleSave = async () => {
      try {
        if (editingRule.value) {
          const ruleToUpdate: AlertRuleItem = {
            ...editingRule.value,
            ...formData.value,
            operator: formData.value.operator as AlertRuleItem['operator'],
            level: formData.value.level as AlertRuleItem['level'],
            channels: formData.value.notificationChannels,
            threshold: Number(formData.value.threshold),
            duration: Number(formData.value.duration)
          }
          const updated = await updateAlertRule(ruleToUpdate)
          Object.assign(editingRule.value, updated)
          showEditModal.value = false
        } else {
          const ruleToSave = {
            name: formData.value.name,
            service: formData.value.service,
            metric: formData.value.metric,
            operator: formData.value.operator as AlertRuleItem['operator'],
            threshold: Number(formData.value.threshold),
            duration: Number(formData.value.duration),
            level: formData.value.level as AlertRuleItem['level'],
            enabled: formData.value.enabled,
            channels: formData.value.notificationChannels
          }
          const saved = await saveAlertRule(ruleToSave)
          rules.value.push(saved)
          showAddModal.value = false
        }
        editingRule.value = null
      } catch (err) {
        console.error('Failed to save alert rule:', err)
      }
    }

    const handleBulkToggle = async (enabled: boolean) => {
      const ids = filteredRules.value.map((r) => r.id)
      if (!ids.length) return
      try {
        const updated = await bulkUpdateAlertRules({ ids, enabled })
        const updateMap = new Map(updated.map((item) => [item.id, item]))
        rules.value = rules.value.map((r) => updateMap.get(r.id) || r)
      } catch (err) {
        console.error('Failed to bulk toggle:', err)
      }
    }

    const handleExport = async () => {
      try {
        const exported = await exportAlertRules()
        const blob = new Blob([JSON.stringify(exported.rules, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `alert-rules-${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('Failed to export alert rules:', err)
      }
    }

    const handleImport = async () => {
      try {
        const parsed = JSON.parse(importPayload.value)
        const imported = await importAlertRules({ rules: parsed })
        rules.value = [...imported, ...rules.value.filter((r) => !imported.some((item) => item.id === r.id))]
        showImportModal.value = false
        importPayload.value = '[]'
      } catch (err) {
        console.error('Failed to import alert rules:', err)
      }
    }

    // ── Render ──────────────────────────────
    const renderContent = () => {
      if (loading.value) {
        return (
          <div class="mobile-alert-rules__loading">
            <NSpin size="large" />
          </div>
        )
      }

      if (error.value) {
        return (
          <NResult
            status="500"
            title="数据加载失败"
            description="请检查网络连接后重试"
            class="mobile-alert-rules__error">
            {{
              footer: () => (
                <NButton type="primary" size="small" onClick={loadRules}>
                  重新加载
                </NButton>
              )
            }}
          </NResult>
        )
      }

      if (rules.value.length === 0) {
        return (
          <div class="mobile-alert-rules__empty-state">
            <NEmpty description="暂无告警规则">
              {{
                action: () => (
                  <NButton type="primary" size="small" onClick={handleAdd}>
                    添加规则
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        )
      }

      const displayRules = filteredRules.value

      if (displayRules.length === 0) {
        return <NEmpty description="当前分类暂无规则" class="mobile-alert-rules__empty-state" />
      }

      return (
        <div class="mobile-alert-rules__list">
          {displayRules.map((rule) => (
            <NCard key={rule.id} size="small" bordered={false} class="mobile-alert-rules__list-card">
              <div class="mobile-alert-rules__card-header">
                <span class="mobile-alert-rules__card-name">{rule.name || '-'}</span>
                <div class="mobile-alert-rules__card-badges">
                  <NTag size="tiny" bordered={false} type={levelTagType(rule.level)}>
                    {levelLabel(rule.level)}
                  </NTag>
                  <NTag size="tiny" bordered={false} type={rule.enabled ? 'success' : 'default'}>
                    {rule.enabled ? '启用' : '禁用'}
                  </NTag>
                </div>
              </div>
              <div class="mobile-alert-rules__card-meta">
                <span>服务: {rule.service || '-'}</span>
              </div>
              <div class="mobile-alert-rules__card-condition">
                <span class="mobile-alert-rules__card-metric">{rule.metric || '-'}</span>
                <span class="mobile-alert-rules__card-operator">{operatorLabel(rule.operator)}</span>
                <span class="mobile-alert-rules__card-threshold">
                  {rule.threshold ?? '-'}
                  {rule.unit ?? ''}
                </span>
              </div>
              {rule.channels && rule.channels.length > 0 && (
                <div class="mobile-alert-rules__card-channels">
                  <span class="mobile-alert-rules__card-channels-label">通知渠道: </span>
                  {rule.channels.join(', ')}
                </div>
              )}
              <div class="mobile-alert-rules__card-actions">
                <div class="mobile-alert-rules__card-toggle">
                  <span class="mobile-alert-rules__card-toggle-label">{rule.enabled ? '已启用' : '已禁用'}</span>
                  <NSwitch size="small" value={rule.enabled} onUpdate:value={() => handleToggle(rule)} />
                </div>
                <div class="mobile-alert-rules__card-buttons">
                  <NButton size="tiny" type="primary" secondary onClick={() => handleEdit(rule)}>
                    编辑
                  </NButton>
                  <NButton size="tiny" type="error" secondary onClick={() => handleDelete(rule)}>
                    <NIcon>
                      <PhTrash />
                    </NIcon>
                  </NButton>
                </div>
              </div>
            </NCard>
          ))}
        </div>
      )
    }

    return () => (
      <div class="mobile-alert-rules">
        {/* ── Header ────────────────────────── */}
        <div class="mobile-alert-rules__header">
          <div>
            <h2 class="mobile-alert-rules__title">告警规则</h2>
            <div class="mobile-alert-rules__subtitle">
              {rules.value.length} 条规则 · {enabledCount.value} 启用 · {criticalCount.value} 严重
            </div>
          </div>
          <div class="mobile-alert-rules__header-actions">
            <NButton size="small" secondary type="primary" onClick={() => (editMode.value = !editMode.value)}>
              <NIcon>
                <PhGear />
              </NIcon>
            </NButton>
            <NButton size="small" secondary type="primary" onClick={loadRules}>
              <NIcon>
                <PhArrowsClockwise />
              </NIcon>
            </NButton>
          </div>
        </div>

        {/* ── Summary grid ──────────────────── */}
        {!loading.value && !error.value && rules.value.length > 0 && (
          <NGrid cols={3} xGap={8} class="mobile-alert-rules__summary-grid">
            <NGridItem>
              <NCard bordered={false} size="small" class="mobile-alert-rules__summary-card">
                <NStatistic label="总规则" value={rules.value.length} />
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard bordered={false} size="small" class="mobile-alert-rules__summary-card">
                <NStatistic label="已启用" value={enabledCount.value} />
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard bordered={false} size="small" class="mobile-alert-rules__summary-card">
                <NStatistic label="严重" value={criticalCount.value} />
              </NCard>
            </NGridItem>
          </NGrid>
        )}

        {/* ── Rule type tabs ────────────────── */}
        {!loading.value && !error.value && rules.value.length > 0 && (
          <div class="mobile-alert-rules__tabs-wrapper">
            <NTabs
              v-model:value={selectedRuleType.value}
              class="mobile-alert-rules__tabs"
              type="segment"
              size="small"
              animated>
              <NTabPane name="all" tab="全部" />
              <NTabPane name="metrics" tab="指标" />
              <NTabPane name="logs" tab="日志" />
              <NTabPane name="trace" tab="链路" />
            </NTabs>
          </div>
        )}

        {/* ── Action bar ────────────────────── */}
        {!loading.value && !error.value && (
          <div class="mobile-alert-rules__action-bar">
            <NButton size="small" type="primary" onClick={handleAdd}>
              <NIcon>
                <PhPlusCircle />
              </NIcon>
              <span class="mobile-alert-rules__action-label">添加</span>
            </NButton>
            <NButton size="small" onClick={() => (showImportModal.value = true)}>
              <NIcon>
                <PhCloudArrowUp />
              </NIcon>
              <span class="mobile-alert-rules__action-label">导入</span>
            </NButton>
            <NButton size="small" onClick={handleExport}>
              <NIcon>
                <PhDownload />
              </NIcon>
              <span class="mobile-alert-rules__action-label">导出</span>
            </NButton>
          </div>
        )}

        {/* ── Bulk edit mode bar ────────────── */}
        {editMode.value && !loading.value && !error.value && rules.value.length > 0 && (
          <div class="mobile-alert-rules__bulk-bar">
            <NButton size="small" type="success" secondary onClick={() => handleBulkToggle(true)}>
              批量启用
            </NButton>
            <NButton size="small" type="warning" secondary onClick={() => handleBulkToggle(false)}>
              批量禁用
            </NButton>
          </div>
        )}

        {/* ── Main content ──────────────────── */}
        {renderContent()}

        {/* ── Add/Edit Modal ────────────────── */}
        <NModal v-model:show={showAddModal.value} title="添加告警规则" preset="card" class="mobile-alert-rules__modal">
          <NForm model={formData.value} labelPlacement="top" class="mobile-alert-rules__form">
            <NFormItem label="规则名称">
              <NInput v-model:value={formData.value.name} placeholder="请输入规则名称" />
            </NFormItem>
            <NFormItem label="监控服务">
              <NInput v-model:value={formData.value.service} placeholder="请输入服务标识" />
            </NFormItem>
            <NFormItem label="监控指标">
              <NSelect v-model:value={formData.value.metric} options={metricOptions} placeholder="选择指标" />
            </NFormItem>
            <NFormItem label="触发条件">
              <div class="mobile-alert-rules__condition-row">
                <NSelect
                  v-model:value={formData.value.operator}
                  options={operatorOptions}
                  class="mobile-alert-rules__operator-select"
                />
                <NInputNumber v-model:value={formData.value.threshold} placeholder="阈值" />
              </div>
            </NFormItem>
            <NFormItem label="持续时间 (分钟)">
              <NInputNumber v-model:value={formData.value.duration} placeholder="分钟" min={1} />
            </NFormItem>
            <NFormItem label="告警等级">
              <NSelect v-model:value={formData.value.level} options={levelOptions} placeholder="选择等级" />
            </NFormItem>
            <NFormItem label="通知渠道">
              <NSelect
                v-model:value={formData.value.notificationChannels}
                options={channelOptions}
                multiple
                placeholder="选择通知渠道"
              />
            </NFormItem>
            <NFormItem label="启用">
              <NSwitch v-model:value={formData.value.enabled} />
            </NFormItem>
          </NForm>
          {{
            footer: () => (
              <div class="mobile-alert-rules__modal-footer">
                <NButton onClick={() => (showAddModal.value = false)}>取消</NButton>
                <NButton type="primary" onClick={handleSave}>
                  保存
                </NButton>
              </div>
            )
          }}
        </NModal>

        {/* ── Edit Modal ────────────────────── */}
        <NModal v-model:show={showEditModal.value} title="编辑告警规则" preset="card" class="mobile-alert-rules__modal">
          <NForm model={formData.value} labelPlacement="top" class="mobile-alert-rules__form">
            <NFormItem label="规则名称">
              <NInput v-model:value={formData.value.name} placeholder="请输入规则名称" />
            </NFormItem>
            <NFormItem label="监控服务">
              <NInput v-model:value={formData.value.service} placeholder="请输入服务标识" />
            </NFormItem>
            <NFormItem label="监控指标">
              <NSelect v-model:value={formData.value.metric} options={metricOptions} placeholder="选择指标" />
            </NFormItem>
            <NFormItem label="触发条件">
              <div class="mobile-alert-rules__condition-row">
                <NSelect
                  v-model:value={formData.value.operator}
                  options={operatorOptions}
                  class="mobile-alert-rules__operator-select"
                />
                <NInputNumber v-model:value={formData.value.threshold} placeholder="阈值" />
              </div>
            </NFormItem>
            <NFormItem label="持续时间 (分钟)">
              <NInputNumber v-model:value={formData.value.duration} placeholder="分钟" min={1} />
            </NFormItem>
            <NFormItem label="告警等级">
              <NSelect v-model:value={formData.value.level} options={levelOptions} placeholder="选择等级" />
            </NFormItem>
            <NFormItem label="通知渠道">
              <NSelect
                v-model:value={formData.value.notificationChannels}
                options={channelOptions}
                multiple
                placeholder="选择通知渠道"
              />
            </NFormItem>
            <NFormItem label="启用">
              <NSwitch v-model:value={formData.value.enabled} />
            </NFormItem>
          </NForm>
          {{
            footer: () => (
              <div class="mobile-alert-rules__modal-footer">
                <NButton onClick={() => (showEditModal.value = false)}>取消</NButton>
                <NButton type="primary" onClick={handleSave}>
                  保存
                </NButton>
              </div>
            )
          }}
        </NModal>

        {/* ── Import Modal ──────────────────── */}
        <NModal
          v-model:show={showImportModal.value}
          title="导入告警规则"
          preset="card"
          class="mobile-alert-rules__modal">
          <NForm>
            <NFormItem label="规则 JSON">
              <NInput
                v-model:value={importPayload.value}
                type="textarea"
                rows={10}
                placeholder='[{"name":"CPU 告警","service":"my-service","metric":"cpu_usage","operator":">","threshold":80,"duration":5,"level":"warning","enabled":true,"channels":["Email"]}]'
              />
            </NFormItem>
          </NForm>
          {{
            footer: () => (
              <div class="mobile-alert-rules__modal-footer">
                <NButton onClick={() => (showImportModal.value = false)}>取消</NButton>
                <NButton type="primary" onClick={handleImport}>
                  导入
                </NButton>
              </div>
            )
          }}
        </NModal>
      </div>
    )
  }
})
