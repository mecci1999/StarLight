import { PhTrash, PhArrowsClockwise, PhPlusCircle, PhDownload, PhCloudArrowUp, PhGear } from '@phosphor-icons/vue'
import { defineComponent, ref, onActivated, computed, h } from 'vue'
import { Tab } from 'vant'
import {
  MobileButton,
  MobileCard,
  MobileEmpty,
  MobileInput,
  MobileLoading,
  MobileSelect,
  MobileSheet,
  MobileSwitch,
  MobileTag,
  MobileTabs,
  MobileStatistic,
  MobileGrid,
  MobileForm,
  MobileFormItem
} from '@/mobile/ui'
import { mobileFeedback } from '@/mobile/services/mobileFeedback'
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
import { useActivationRefresh } from '@/mobile/hooks/useActivationRefresh'
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
      notificationChannels: [] as string[],
      emailRecipients: '',
      notifyOnRecovery: true
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

    const shouldRefreshOnActivation = useActivationRefresh(30_000)

    onActivated(() => {
      if (shouldRefreshOnActivation()) void loadRules()
    })

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
    const levelTagType = (level: AlertRuleItem['level']): 'danger' | 'warning' | 'info' | 'default' => {
      switch (level) {
        case 'critical':
          return 'danger'
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
        notificationChannels: [],
        emailRecipients: '',
        notifyOnRecovery: true
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
        notificationChannels: Array.isArray(rule.channels) ? [...rule.channels] : [],
        emailRecipients: (rule.emailRecipients || []).join(', '),
        notifyOnRecovery: rule.notifyOnRecovery !== false
      }
      showEditModal.value = true
    }

    const handleDelete = async (rule: AlertRuleItem) => {
      try {
        await mobileFeedback.confirm({
          title: '确认删除',
          message: `确定要删除规则「${rule.name || rule.id}」吗？此操作不可撤销。`,
          confirmButtonText: '删除',
          cancelButtonText: '取消'
        })
        await deleteAlertRule(rule.id)
        const idx = rules.value.findIndex((r) => r.id === rule.id)
        if (idx > -1) rules.value.splice(idx, 1)
      } catch (err) {
        if (err !== 'cancel') {
          console.error('Failed to delete alert rule:', err)
        }
      }
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
            emailRecipients: formData.value.emailRecipients
              .split(/[\n,;]+/)
              .map((recipient) => recipient.trim().toLowerCase())
              .filter(Boolean),
            notifyOnRecovery: formData.value.notifyOnRecovery,
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
            channels: formData.value.notificationChannels,
            emailRecipients: formData.value.emailRecipients
              .split(/[\n,;]+/)
              .map((recipient) => recipient.trim().toLowerCase())
              .filter(Boolean),
            notifyOnRecovery: formData.value.notifyOnRecovery
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
            <MobileLoading loading={true} size="large" />
          </div>
        )
      }

      if (error.value) {
        return (
          <MobileEmpty description="数据加载失败" class="mobile-alert-rules__error">
            <MobileButton size="small" type="primary" onClick={loadRules}>
              重新加载
            </MobileButton>
          </MobileEmpty>
        )
      }

      if (rules.value.length === 0) {
        return (
          <div class="mobile-alert-rules__empty-state">
            <MobileEmpty description="暂无告警规则">
              <MobileButton size="small" type="primary" onClick={handleAdd}>
                添加规则
              </MobileButton>
            </MobileEmpty>
          </div>
        )
      }

      const displayRules = filteredRules.value

      if (displayRules.length === 0) {
        return <MobileEmpty description="当前分类暂无规则" class="mobile-alert-rules__empty-state" />
      }

      return (
        <div class="mobile-alert-rules__list">
          {displayRules.map((rule) => (
            <MobileCard key={rule.id} size="small" bordered={false} class="mobile-alert-rules__list-card">
              <div class="mobile-alert-rules__card-header">
                <span class="mobile-alert-rules__card-name">{rule.name || '-'}</span>
                <div class="mobile-alert-rules__card-badges">
                  <MobileTag size="small" type={levelTagType(rule.level)}>
                    {levelLabel(rule.level)}
                  </MobileTag>
                  <MobileTag size="small" type={rule.enabled ? 'success' : 'default'}>
                    {rule.enabled ? '启用' : '禁用'}
                  </MobileTag>
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
                  <MobileSwitch modelValue={rule.enabled} onUpdate:modelValue={() => handleToggle(rule)} />
                </div>
                <div class="mobile-alert-rules__card-buttons">
                  <MobileButton size="small" type="ghost" onClick={() => handleEdit(rule)}>
                    编辑
                  </MobileButton>
                  <MobileButton
                    size="small"
                    type="ghost"
                    class="mobile-alert-rules__delete-button"
                    aria-label={`删除规则 ${rule.name || rule.id}`}
                    onClick={() => handleDelete(rule)}
                    icon={() => h(PhTrash, { size: 16 })}
                  />
                </div>
              </div>
            </MobileCard>
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
            <MobileButton
              size="small"
              type="ghost"
              onClick={() => (editMode.value = !editMode.value)}
              icon={() => h(PhGear, { size: 16 })}
            />
            <MobileButton
              size="small"
              type="ghost"
              onClick={loadRules}
              icon={() => h(PhArrowsClockwise, { size: 16 })}
            />
          </div>
        </div>

        {/* ── Summary grid ──────────────────── */}
        {!loading.value && !error.value && rules.value.length > 0 && (
          <MobileGrid cols={3} class="mobile-alert-rules__summary-grid">
            <div>
              <MobileCard bordered={false} size="small" class="mobile-alert-rules__summary-card">
                <MobileStatistic label="总规则" value={rules.value.length} />
              </MobileCard>
            </div>
            <div>
              <MobileCard bordered={false} size="small" class="mobile-alert-rules__summary-card">
                <MobileStatistic label="已启用" value={enabledCount.value} />
              </MobileCard>
            </div>
            <div>
              <MobileCard bordered={false} size="small" class="mobile-alert-rules__summary-card">
                <MobileStatistic label="严重" value={criticalCount.value} />
              </MobileCard>
            </div>
          </MobileGrid>
        )}

        {/* ── Rule type tabs ────────────────── */}
        {!loading.value && !error.value && rules.value.length > 0 && (
          <div class="mobile-alert-rules__tabs-wrapper">
            <MobileTabs
              active={selectedRuleType.value}
              onUpdate:active={(v) => (selectedRuleType.value = v as typeof selectedRuleType.value)}
              class="mobile-alert-rules__tabs"
              type="line">
              <Tab title="全部" name="all" />
              <Tab title="指标" name="metrics" />
              <Tab title="日志" name="logs" />
              <Tab title="链路" name="trace" />
            </MobileTabs>
          </div>
        )}

        {/* ── Action bar ────────────────────── */}
        {!loading.value && !error.value && (
          <div class="mobile-alert-rules__action-bar">
            <MobileButton size="small" type="primary" onClick={handleAdd} icon={() => h(PhPlusCircle, { size: 16 })}>
              <span class="mobile-alert-rules__action-label">添加</span>
            </MobileButton>
            <MobileButton
              size="small"
              onClick={() => (showImportModal.value = true)}
              icon={() => h(PhCloudArrowUp, { size: 16 })}>
              <span class="mobile-alert-rules__action-label">导入</span>
            </MobileButton>
            <MobileButton size="small" onClick={handleExport} icon={() => h(PhDownload, { size: 16 })}>
              <span class="mobile-alert-rules__action-label">导出</span>
            </MobileButton>
          </div>
        )}

        {/* ── Bulk edit mode bar ────────────── */}
        {editMode.value && !loading.value && !error.value && rules.value.length > 0 && (
          <div class="mobile-alert-rules__bulk-bar">
            <MobileButton size="small" type="primary" onClick={() => handleBulkToggle(true)}>
              批量启用
            </MobileButton>
            <MobileButton size="small" type="ghost" onClick={() => handleBulkToggle(false)}>
              批量禁用
            </MobileButton>
          </div>
        )}

        {/* ── Main content ──────────────────── */}
        {renderContent()}

        {/* ── Add/Edit Modal ────────────────── */}
        <MobileSheet
          show={showAddModal.value}
          onUpdate:show={(v) => (showAddModal.value = v)}
          position="bottom"
          title="添加告警规则">
          <MobileForm class="mobile-alert-rules__form">
            <MobileFormItem
              label="规则名称"
              name="name"
              modelValue={formData.value.name}
              onUpdate:modelValue={(v) => (formData.value.name = v as string)}
              placeholder="请输入规则名称"
            />
            <MobileFormItem
              label="监控服务"
              name="service"
              modelValue={formData.value.service}
              onUpdate:modelValue={(v) => (formData.value.service = v as string)}
              placeholder="请输入服务标识"
            />
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">监控指标</div>
              <MobileSelect
                modelValue={formData.value.metric}
                onUpdate:modelValue={(v) => (formData.value.metric = v as string)}
                options={metricOptions}
                placeholder="选择指标"
              />
            </div>
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">触发条件</div>
              <div class="mobile-alert-rules__condition-row">
                <MobileSelect
                  modelValue={formData.value.operator}
                  onUpdate:modelValue={(v) => (formData.value.operator = v as string)}
                  options={operatorOptions}
                  placeholder="运算符"
                />
                <MobileInput
                  type="digit"
                  modelValue={formData.value.threshold}
                  onUpdate:modelValue={(v) => (formData.value.threshold = Number(v))}
                  placeholder="阈值"
                />
              </div>
            </div>
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">持续时间 (分钟)</div>
              <MobileInput
                type="digit"
                modelValue={formData.value.duration}
                onUpdate:modelValue={(v) => (formData.value.duration = Number(v))}
                placeholder="分钟"
              />
            </div>
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">告警等级</div>
              <MobileSelect
                modelValue={formData.value.level}
                onUpdate:modelValue={(v) => (formData.value.level = v as string)}
                options={levelOptions}
                placeholder="选择等级"
              />
            </div>
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">通知渠道</div>
              <MobileSelect
                modelValue={formData.value.notificationChannels[0] || ''}
                onUpdate:modelValue={(v) => {
                  formData.value.notificationChannels = v ? [v as string] : []
                }}
                options={channelOptions}
                placeholder="选择通知渠道"
              />
            </div>
            <div class="mobile-alert-rules__form-group mobile-alert-rules__form-group--switch">
              <div class="mobile-alert-rules__form-label">启用</div>
              <MobileSwitch
                modelValue={formData.value.enabled}
                onUpdate:modelValue={(v) => (formData.value.enabled = v)}
              />
            </div>
          </MobileForm>
          <div class="mobile-alert-rules__modal-footer">
            <MobileButton onClick={() => (showAddModal.value = false)}>取消</MobileButton>
            <MobileButton type="primary" onClick={handleSave}>
              保存
            </MobileButton>
          </div>
        </MobileSheet>

        {/* ── Edit Modal ────────────────────── */}
        <MobileSheet
          show={showEditModal.value}
          onUpdate:show={(v) => (showEditModal.value = v)}
          position="bottom"
          title="编辑告警规则">
          <MobileForm class="mobile-alert-rules__form">
            <MobileFormItem
              label="规则名称"
              name="name"
              modelValue={formData.value.name}
              onUpdate:modelValue={(v) => (formData.value.name = v as string)}
              placeholder="请输入规则名称"
            />
            <MobileFormItem
              label="监控服务"
              name="service"
              modelValue={formData.value.service}
              onUpdate:modelValue={(v) => (formData.value.service = v as string)}
              placeholder="请输入服务标识"
            />
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">监控指标</div>
              <MobileSelect
                modelValue={formData.value.metric}
                onUpdate:modelValue={(v) => (formData.value.metric = v as string)}
                options={metricOptions}
                placeholder="选择指标"
              />
            </div>
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">触发条件</div>
              <div class="mobile-alert-rules__condition-row">
                <MobileSelect
                  modelValue={formData.value.operator}
                  onUpdate:modelValue={(v) => (formData.value.operator = v as string)}
                  options={operatorOptions}
                  placeholder="运算符"
                />
                <MobileInput
                  type="digit"
                  modelValue={formData.value.threshold}
                  onUpdate:modelValue={(v) => (formData.value.threshold = Number(v))}
                  placeholder="阈值"
                />
              </div>
            </div>
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">持续时间 (分钟)</div>
              <MobileInput
                type="digit"
                modelValue={formData.value.duration}
                onUpdate:modelValue={(v) => (formData.value.duration = Number(v))}
                placeholder="分钟"
              />
            </div>
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">告警等级</div>
              <MobileSelect
                modelValue={formData.value.level}
                onUpdate:modelValue={(v) => (formData.value.level = v as string)}
                options={levelOptions}
                placeholder="选择等级"
              />
            </div>
            <div class="mobile-alert-rules__form-group">
              <div class="mobile-alert-rules__form-label">通知渠道</div>
              <MobileSelect
                modelValue={formData.value.notificationChannels[0] || ''}
                onUpdate:modelValue={(v) => {
                  formData.value.notificationChannels = v ? [v as string] : []
                }}
                options={channelOptions}
                placeholder="选择通知渠道"
              />
            </div>
            <div class="mobile-alert-rules__form-group mobile-alert-rules__form-group--switch">
              <div class="mobile-alert-rules__form-label">启用</div>
              <MobileSwitch
                modelValue={formData.value.enabled}
                onUpdate:modelValue={(v) => (formData.value.enabled = v)}
              />
            </div>
          </MobileForm>
          <div class="mobile-alert-rules__modal-footer">
            <MobileButton onClick={() => (showEditModal.value = false)}>取消</MobileButton>
            <MobileButton type="primary" onClick={handleSave}>
              保存
            </MobileButton>
          </div>
        </MobileSheet>

        {/* ── Import Modal ──────────────────── */}
        <MobileSheet
          show={showImportModal.value}
          onUpdate:show={(v) => (showImportModal.value = v)}
          position="bottom"
          title="导入告警规则">
          <MobileForm class="mobile-alert-rules__form">
            <MobileFormItem
              label="规则 JSON"
              name="payload"
              modelValue={importPayload.value}
              onUpdate:modelValue={(v) => (importPayload.value = v as string)}
              type="textarea"
              autosize
              placeholder='[{"name":"CPU 告警","service":"my-service","metric":"cpu_usage","operator":">","threshold":80,"duration":5,"level":"warning","enabled":true,"channels":["Email"]}]'
            />
          </MobileForm>
          <div class="mobile-alert-rules__modal-footer">
            <MobileButton onClick={() => (showImportModal.value = false)}>取消</MobileButton>
            <MobileButton type="primary" onClick={handleImport}>
              导入
            </MobileButton>
          </div>
        </MobileSheet>
      </div>
    )
  }
})
