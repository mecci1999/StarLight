import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  NTabPane,
  NTabs,
  useMessage
} from 'naive-ui'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import {
  deleteAlertRule,
  deleteRegistryMissingAlertRule,
  exportAlertRules,
  fetchAlertRules,
  fetchRegistryMissingAlertRules,
  importAlertRules,
  saveAlertRule,
  saveRegistryMissingAlertRule,
  updateAlertRule,
  updateRegistryMissingAlertRule
} from '@/api/alerts'
import { fetchCatalogServices, type MetricsDatasetScope } from '@/api/metrics'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import {
  MANAGED_SYSTEM_SERVICES,
  type AlertRule,
  type AlertRuleItem,
  type ManagedSystemService,
  type RegistryMissingAlertRule,
  type RegistryMissingChannel,
  type RegistryMissingSeverity
} from '@/types/monitor'
import './AlertRulesPage.scss'

type RuleCategory = 'all' | 'metrics' | 'logs' | 'trace' | 'quota' | 'registry_missing'
type MetricOperator = '>' | '<' | '=' | '>=' | '<='
type MetricLevel = 'critical' | 'warning' | 'info'
type RuleForm = {
  ruleType: 'metric' | 'registry_missing'
  name: string
  service: string
  metric: string
  operator: MetricOperator
  threshold: number
  duration: number
  level: MetricLevel
  enabled: boolean
  notificationChannels: string[]
  serviceName: ManagedSystemService | ''
  forSeconds: number | null
  deployGraceSeconds: number | null
  severity: RegistryMissingSeverity
  emailRecipients: string
  notifyOnRecovery: boolean
}

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
const registryChannelOptions = [
  { label: 'Email', value: 'Email' },
  { label: '站内通知', value: 'InApp' }
]
const metricChannelOptions = [...registryChannelOptions, { label: 'Webhook', value: 'Webhook' }]

const isRegistryRule = (rule: AlertRule): rule is RegistryMissingAlertRule =>
  'ruleType' in rule && rule.ruleType === 'registry_missing'
const isRegistryChannel = (channel: string): channel is RegistryMissingChannel =>
  channel === 'Email' || channel === 'InApp'
const normalizeRecipients = (value: string) =>
  [
    ...new Set(
      value
        .split(/[\n,;]+/)
        .map((recipient) => recipient.trim().toLowerCase())
        .filter(Boolean)
    )
  ].sort()
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const emptyForm = (ruleType: RuleForm['ruleType'] = 'metric'): RuleForm => ({
  ruleType,
  name: '',
  service: '',
  metric: 'cpu_usage',
  operator: '>',
  threshold: 0,
  duration: 5,
  level: 'warning',
  enabled: true,
  notificationChannels: [],
  serviceName: '',
  forSeconds: 300,
  deployGraceSeconds: 300,
  severity: 'warning',
  emailRecipients: '',
  notifyOnRecovery: true
})

export default defineComponent({
  name: 'AlertRulesPage',
  setup() {
    const message = useMessage()
    const route = useRoute()
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())
    const routeServiceId = computed(() =>
      typeof route.query.serviceId === 'string' ? route.query.serviceId.trim() : ''
    )
    const showEditor = ref(false)
    const showImportModal = ref(false)
    const editingRule = ref<AlertRule | null>(null)
    const importPayload = ref('[]')
    const selectedRuleType = ref<RuleCategory>('all')
    const formData = ref<RuleForm>(emptyForm())
    const loading = ref(false)
    const rulesData = ref<AlertRule[]>([])
    const serviceLabelMap = ref(new Map<string, string>())

    const loadServiceLabels = async () => {
      try {
        const response = await fetchCatalogServices({ page: 1, pageSize: 200, scope: 'system' })
        const labels = new Map<string, string>()
        response.items.forEach((item: { identity?: { id?: string; name?: string }; displayName?: string }) => {
          const id = item.identity?.id
          const displayName = item.displayName || item.identity?.name
          if (id && displayName) labels.set(id, displayName)
        })
        serviceLabelMap.value = labels
      } catch (error) {
        console.error('Failed to fetch system service display names', error)
      }
    }

    const registryServiceOptions = computed(() =>
      MANAGED_SYSTEM_SERVICES.map((serviceName) => ({
        value: serviceName,
        label: serviceLabelMap.value.get(serviceName) || serviceName
      }))
    )
    const metricServiceOptions = computed(() => [{ label: '全部服务', value: 'all' }, ...registryServiceOptions.value])
    const enabledCount = computed(() => rulesData.value.filter((rule) => rule.enabled).length)
    const criticalCount = computed(
      () => rulesData.value.filter((rule) => (isRegistryRule(rule) ? rule.severity : rule.level) === 'critical').length
    )
    const coveredServiceCount = computed(
      () =>
        new Set(rulesData.value.map((rule) => (isRegistryRule(rule) ? rule.serviceName : rule.service)).filter(Boolean))
          .size
    )
    const resolveRuleType = (
      rule: AlertRule
    ): Exclude<RuleCategory, 'all' | 'registry_missing'> | 'registry_missing' => {
      if (isRegistryRule(rule)) return 'registry_missing'
      const metric = rule.metric.toLowerCase()
      if (metric.includes('log')) return 'logs'
      if (metric.includes('trace') || metric.includes('response.time')) return 'trace'
      if (metric.includes('qps') || metric.includes('quota')) return 'quota'
      return 'metrics'
    }
    const filteredRules = computed(() =>
      rulesData.value.filter((rule) => {
        if (routeServiceId.value && !isRegistryRule(rule) && rule.service !== routeServiceId.value) return false
        return selectedRuleType.value === 'all' || resolveRuleType(rule) === selectedRuleType.value
      })
    )

    const loadRules = async () => {
      loading.value = true
      try {
        const [metricRules, registryRules] = await Promise.all([
          fetchAlertRules({ serviceId: routeServiceId.value || undefined, scope: datasetScope.value }),
          fetchRegistryMissingAlertRules()
        ])
        rulesData.value = [...metricRules, ...registryRules]
      } catch (error) {
        console.error('Failed to load alert rules', error)
        rulesData.value = []
        message.error('加载告警规则失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    const openAdd = () => {
      const type = selectedRuleType.value === 'registry_missing' ? 'registry_missing' : 'metric'
      formData.value = emptyForm(type)
      if (type === 'metric' && routeServiceId.value) formData.value.service = routeServiceId.value
      showEditor.value = true
    }
    const openEdit = (rule: AlertRule) => {
      editingRule.value = rule
      formData.value = isRegistryRule(rule)
        ? {
            ...emptyForm('registry_missing'),
            ruleType: 'registry_missing',
            name: rule.name,
            serviceName: rule.serviceName,
            forSeconds: rule.forSeconds,
            deployGraceSeconds: rule.deployGraceSeconds,
            severity: rule.severity,
            enabled: rule.enabled,
            notificationChannels: rule.channels,
            emailRecipients: (rule.emailRecipients || []).join(', '),
            notifyOnRecovery: rule.notifyOnRecovery !== false
          }
        : {
            ...emptyForm(),
            ...rule,
            ruleType: 'metric',
            notificationChannels: rule.channels,
            emailRecipients: (rule.emailRecipients || []).join(', '),
            notifyOnRecovery: rule.notifyOnRecovery !== false
          }
      showEditor.value = true
    }
    const validateRegistryForm = () => {
      const { serviceName, forSeconds, deployGraceSeconds, notificationChannels } = formData.value
      const recipients = normalizeRecipients(formData.value.emailRecipients)
      if (!serviceName) return '请选择目标服务'
      if (!Number.isInteger(forSeconds) || (forSeconds ?? 0) < 60 || (forSeconds ?? 0) > 86400) {
        return '缺失持续时间必须为 60 到 86400 秒的整数'
      }
      if (
        !Number.isInteger(deployGraceSeconds) ||
        (deployGraceSeconds ?? -1) < 0 ||
        (deployGraceSeconds ?? 0) > 86400
      ) {
        return '发布宽限期必须为 0 到 86400 秒的整数'
      }
      if (
        notificationChannels.includes('Email') &&
        (!recipients.length || recipients.some((recipient) => !isValidEmail(recipient)))
      ) {
        return '选择 Email 时至少需要一个有效收件人'
      }
      return ''
    }
    const validateMetricForm = () => {
      const recipients = normalizeRecipients(formData.value.emailRecipients)
      if (
        formData.value.notificationChannels.includes('Email') &&
        (!recipients.length || recipients.some((recipient) => !isValidEmail(recipient)))
      ) {
        return '选择 Email 时至少需要一个有效收件人'
      }
      return ''
    }
    const buildRegistryRule = (): Omit<RegistryMissingAlertRule, 'ruleId'> | null => {
      const validationMessage = validateRegistryForm()
      if (validationMessage) {
        message.error(validationMessage)
        return null
      }
      const recipients = normalizeRecipients(formData.value.emailRecipients)
      return {
        ruleType: 'registry_missing',
        name: formData.value.name.trim() || `${formData.value.serviceName} 服务注册缺失`,
        serviceName: formData.value.serviceName as ManagedSystemService,
        forSeconds: formData.value.forSeconds as number,
        deployGraceSeconds: formData.value.deployGraceSeconds as number,
        severity: formData.value.severity,
        enabled: formData.value.enabled,
        channels: formData.value.notificationChannels.filter(isRegistryChannel),
        emailRecipients: recipients,
        notifyOnRecovery: formData.value.notifyOnRecovery
      }
    }
    const handleSave = async () => {
      if (formData.value.ruleType === 'registry_missing') {
        const draft = buildRegistryRule()
        if (!draft) return
        const saved =
          editingRule.value && isRegistryRule(editingRule.value)
            ? await updateRegistryMissingAlertRule({ ...draft, ruleId: editingRule.value.ruleId })
            : await saveRegistryMissingAlertRule(draft)
        rulesData.value = editingRule.value
          ? rulesData.value.map((rule) => (isRegistryRule(rule) && rule.ruleId === saved.ruleId ? saved : rule))
          : [...rulesData.value, saved]
      } else {
        const validationMessage = validateMetricForm()
        if (validationMessage) {
          message.error(validationMessage)
          return
        }
        const metricRule: Omit<AlertRuleItem, 'id'> = {
          name: formData.value.name,
          service: formData.value.service,
          metric: formData.value.metric,
          operator: formData.value.operator,
          threshold: formData.value.threshold,
          duration: formData.value.duration,
          level: formData.value.level,
          enabled: formData.value.enabled,
          channels: formData.value.notificationChannels,
          emailRecipients: normalizeRecipients(formData.value.emailRecipients),
          notifyOnRecovery: formData.value.notifyOnRecovery
        }
        const saved =
          editingRule.value && !isRegistryRule(editingRule.value)
            ? await updateAlertRule({ ...metricRule, id: editingRule.value.id })
            : await saveAlertRule(metricRule)
        rulesData.value = editingRule.value
          ? rulesData.value.map((rule) => (!isRegistryRule(rule) && rule.id === saved.id ? saved : rule))
          : [...rulesData.value, saved]
      }
      showEditor.value = false
      editingRule.value = null
      message.success('规则保存成功')
    }
    const handleDelete = async (rule: AlertRule) => {
      if (isRegistryRule(rule)) await deleteRegistryMissingAlertRule(rule.ruleId)
      else await deleteAlertRule(rule.id)
      rulesData.value = rulesData.value.filter(
        (item) => (isRegistryRule(item) ? item.ruleId : item.id) !== (isRegistryRule(rule) ? rule.ruleId : rule.id)
      )
      message.success('规则已删除')
    }
    const handleToggle = async (rule: AlertRule) => {
      const updated = isRegistryRule(rule)
        ? await updateRegistryMissingAlertRule({ ...rule, enabled: !rule.enabled })
        : await updateAlertRule({ ...rule, enabled: !rule.enabled })
      rulesData.value = rulesData.value.map((item) =>
        (isRegistryRule(item) ? item.ruleId : item.id) === (isRegistryRule(updated) ? updated.ruleId : updated.id)
          ? updated
          : item
      )
    }
    const handleExport = async () => {
      const metricExport = await exportAlertRules({
        serviceId: routeServiceId.value || undefined,
        scope: datasetScope.value
      })
      const rules = [...metricExport.rules, ...rulesData.value.filter(isRegistryRule)]
      const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `alert-rules-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(downloadUrl)
      message.success('导出规则成功')
    }
    const handleImport = async () => {
      try {
        const parsed: unknown = JSON.parse(importPayload.value)
        if (!Array.isArray(parsed)) throw new Error('rules must be an array')
        const registryRules = parsed.filter(
          (rule): rule is RegistryMissingAlertRule =>
            typeof rule === 'object' && rule !== null && 'ruleType' in rule && rule.ruleType === 'registry_missing'
        )
        const metricRules = parsed.filter(
          (rule): rule is Partial<AlertRuleItem> =>
            typeof rule === 'object' && rule !== null && !('ruleType' in rule && rule.ruleType === 'registry_missing')
        )
        const [importedMetrics, importedRegistry] = await Promise.all([
          metricRules.length ? importAlertRules({ rules: metricRules }) : Promise.resolve([]),
          Promise.all(
            registryRules.map((rule) => {
              const { ruleId: _, ...newRule } = rule
              return saveRegistryMissingAlertRule(newRule)
            })
          )
        ])
        rulesData.value = [...rulesData.value, ...importedMetrics, ...importedRegistry]
        showImportModal.value = false
        importPayload.value = '[]'
        message.success('导入规则成功')
      } catch (error) {
        console.error('Failed to import alert rules', error)
        message.error('导入失败，请检查规则 JSON')
      }
    }

    const columns = [
      {
        title: '规则名称',
        key: 'name',
        fixed: 'left',
        width: 240,
        render: (row: AlertRule) => (
          <div class="alert-rules-page__rule-cell">
            <strong>{row.name || '未命名规则'}</strong>
            <span>{isRegistryRule(row) ? '服务注册缺失' : row.id}</span>
          </div>
        )
      },
      {
        title: '类型',
        key: 'type',
        width: 130,
        render: (row: AlertRule) => (
          <NTag type={isRegistryRule(row) ? 'warning' : 'info'} bordered={false}>
            {isRegistryRule(row) ? '服务注册缺失' : '指标规则'}
          </NTag>
        )
      },
      {
        title: '目标',
        key: 'target',
        width: 190,
        render: (row: AlertRule) => {
          const service = isRegistryRule(row) ? row.serviceName : row.service
          return (
            <div class="alert-rules-page__service-cell">
              <strong>{serviceLabelMap.value.get(service) || service || '全部服务'}</strong>
              <span>{isRegistryRule(row) ? 'Node-Universe 服务' : service}</span>
            </div>
          )
        }
      },
      {
        title: '触发条件',
        key: 'condition',
        width: 210,
        render: (row: AlertRule) =>
          isRegistryRule(row) ? (
            <span class="alert-rules-page__condition-pill">
              缺失 {row.forSeconds}s · 宽限 {row.deployGraceSeconds}s
            </span>
          ) : (
            <span class="alert-rules-page__condition-pill">
              {row.metric} {row.operator} {row.threshold}
              {row.unit || ''}
            </span>
          )
      },
      {
        title: '告警等级',
        key: 'level',
        width: 110,
        render: (row: AlertRule) => (
          <NTag
            type={
              (isRegistryRule(row) ? row.severity : row.level) === 'critical'
                ? 'error'
                : (isRegistryRule(row) ? row.severity : row.level) === 'warning'
                  ? 'warning'
                  : 'info'
            }>
            {(isRegistryRule(row) ? row.severity : row.level) === 'critical'
              ? '严重'
              : (isRegistryRule(row) ? row.severity : row.level) === 'warning'
                ? '警告'
                : '信息'}
          </NTag>
        )
      },
      {
        title: '通知渠道',
        key: 'channels',
        width: 160,
        render: (row: AlertRule) => (
          <span class="alert-rules-page__channel-list">{row.channels.length ? row.channels.join(', ') : '-'}</span>
        )
      },
      {
        title: '状态',
        key: 'enabled',
        width: 80,
        render: (row: AlertRule) => (
          <NTag type={row.enabled ? 'success' : 'default'}>{row.enabled ? '启用' : '禁用'}</NTag>
        )
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 210,
        render: (row: AlertRule) => (
          <div class="alert-rules-page__table-actions">
            <NButton size="small" type="primary" secondary onClick={() => openEdit(row)}>
              编辑
            </NButton>
            <NButton size="small" secondary onClick={() => handleToggle(row)}>
              {row.enabled ? '禁用' : '启用'}
            </NButton>
            <NButton size="small" type="error" secondary onClick={() => handleDelete(row)}>
              删除
            </NButton>
          </div>
        )
      }
    ]

    onMounted(() => {
      loadServiceLabels()
      loadRules()
    })
    return () => (
      <div class="alert-rules-page">
        <PageHeader title="告警规则配置" subtitle="配置指标阈值与 Node-Universe 服务注册缺失通知" />
        <section class="alert-rules-page__toolbar-card">
          <NTabs v-model:value={selectedRuleType.value} class="alert-rules-page__tabs">
            <NTabPane name="all" tab="全部规则" />
            <NTabPane name="metrics" tab="指标规则" />
            <NTabPane name="registry_missing" tab="服务注册缺失" />
            <NTabPane name="logs" tab="日志规则" />
            <NTabPane name="trace" tab="链路规则" />
            <NTabPane name="quota" tab="配额规则" />
          </NTabs>
          <NButton loading={loading.value} onClick={loadRules}>
            刷新规则
          </NButton>
        </section>
        <NGrid cols={4} xGap={16} class="alert-rules-page__summary-grid">
          {[
            { label: '总规则数', value: rulesData.value.length },
            { label: '启用规则', value: enabledCount.value },
            { label: '严重规则', value: criticalCount.value },
            { label: '覆盖服务', value: coveredServiceCount.value }
          ].map((item) => (
            <NGridItem key={item.label}>
              <NCard bordered={false} class="alert-rules-page__summary-card">
                <div class="alert-rules-page__summary-label">{item.label}</div>
                <div class="alert-rules-page__summary-value">{item.value}</div>
              </NCard>
            </NGridItem>
          ))}
        </NGrid>
        <NCard bordered={false} class="alert-rules-page__preview-card" title="当前编辑预览">
          <div class="alert-rules-page__preview-note">预览会跟随新增或编辑表单变化，确认后才会保存规则。</div>
          <div class="alert-rules-page__preview-grid">
            {formData.value.ruleType === 'registry_missing' ? (
              <>
                <div class="alert-rules-page__preview-item">
                  <span>规则类型</span>服务注册缺失
                </div>
                <div class="alert-rules-page__preview-item">
                  <span>目标服务</span>
                  {serviceLabelMap.value.get(formData.value.serviceName) || formData.value.serviceName || '-'}
                </div>
                <div class="alert-rules-page__preview-item">
                  <span>触发时间</span>
                  {formData.value.forSeconds ? `${formData.value.forSeconds} 秒` : '-'}
                </div>
                <div class="alert-rules-page__preview-item">
                  <span>发布宽限期</span>
                  {formData.value.deployGraceSeconds ?? '-'}
                  {formData.value.deployGraceSeconds !== null ? ' 秒' : ''}
                </div>
                <div class="alert-rules-page__preview-item">
                  <span>等级</span>
                  {formData.value.severity}
                </div>
                <div class="alert-rules-page__preview-item">
                  <span>恢复通知</span>
                  {formData.value.notifyOnRecovery ? '开启' : '关闭'}
                </div>
              </>
            ) : (
              <>
                <div class="alert-rules-page__preview-item">
                  <span>服务</span>
                  {formData.value.service || '-'}
                </div>
                <div class="alert-rules-page__preview-item">
                  <span>指标</span>
                  {formData.value.metric || '-'}
                </div>
                <div class="alert-rules-page__preview-item">
                  <span>条件</span>
                  {`${formData.value.operator} ${formData.value.threshold}`}
                </div>
              </>
            )}
            <div class="alert-rules-page__preview-grid-wide">
              <span>通知渠道</span>
              <strong>
                {formData.value.notificationChannels.length ? formData.value.notificationChannels.join(', ') : '-'}
              </strong>
            </div>
          </div>
        </NCard>
        <NCard bordered={false} class="alert-rules-page__action-card">
          <div class="alert-rules-page__action-row">
            <div>
              <div class="alert-rules-page__action-title">规则操作</div>
              <div class="alert-rules-page__action-desc">导入和导出会保留指标规则与服务注册缺失规则。</div>
            </div>
            <NSpace>
              <NButton type="primary" onClick={openAdd}>
                + 添加规则
              </NButton>
              <NButton onClick={() => (showImportModal.value = true)}>导入规则</NButton>
              <NButton onClick={handleExport}>导出规则</NButton>
            </NSpace>
          </div>
        </NCard>
        <section class="alert-rules-page__table-card">
          <div class="alert-rules-page__table-header">
            <div>
              <div class="alert-rules-page__section-title">规则清单</div>
              <div class="alert-rules-page__section-desc">服务注册缺失规则使用独立条件和通知配置，不包含指标阈值。</div>
            </div>
          </div>
          {loading.value ? (
            <div class="alert-rules-page__table-loading">
              <NSpin size="large" />
            </div>
          ) : (
            <div class="alert-rules-page__table-shell">
              <ResultTable
                class="alert-rules-page__table"
                columns={columns}
                data={filteredRules.value}
                pagination={{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50] }}
                bordered={false}
                singleLine={false}
                scrollX={1340}
                flexHeight={false}
                rowKey={(row: AlertRule) => (isRegistryRule(row) ? row.ruleId : row.id)}
              />
            </div>
          )}
        </section>
        <NModal
          v-model:show={showEditor.value}
          title={editingRule.value ? '编辑规则' : '添加规则'}
          preset="card"
          style={{ width: '620px' }}>
          <NForm labelPlacement="left" labelWidth={110}>
            <NFormItem label="规则类型">
              <NSelect
                v-model:value={formData.value.ruleType}
                options={[
                  { label: '指标规则', value: 'metric' },
                  { label: '服务注册缺失', value: 'registry_missing' }
                ]}
                disabled={Boolean(editingRule.value)}
              />
            </NFormItem>
            <NFormItem label="规则名称">
              <NInput
                v-model:value={formData.value.name}
                placeholder={formData.value.ruleType === 'registry_missing' ? '留空将按目标服务生成' : '请输入规则名称'}
              />
            </NFormItem>
            {formData.value.ruleType === 'registry_missing' ? (
              <>
                <NFormItem label="目标服务">
                  <NSelect
                    v-model:value={formData.value.serviceName}
                    options={registryServiceOptions.value}
                    placeholder="选择 Node-Universe 服务"
                    filterable
                  />
                </NFormItem>
                <NFormItem label="缺失持续时间">
                  <NInputNumber
                    v-model:value={formData.value.forSeconds}
                    min={60}
                    max={86400}
                    placeholder="60 - 86400 秒"
                  />
                </NFormItem>
                <NFormItem label="发布宽限期">
                  <NInputNumber
                    v-model:value={formData.value.deployGraceSeconds}
                    min={0}
                    max={86400}
                    placeholder="0 - 86400 秒"
                  />
                </NFormItem>
                <NFormItem label="告警等级">
                  <NSelect v-model:value={formData.value.severity} options={levelOptions} />
                </NFormItem>
                <NFormItem label="通知渠道">
                  <NSelect
                    v-model:value={formData.value.notificationChannels}
                    options={registryChannelOptions}
                    multiple
                  />
                </NFormItem>
                {formData.value.notificationChannels.includes('Email') ? (
                  <NFormItem label="Email 收件人">
                    <NInput
                      v-model:value={formData.value.emailRecipients}
                      type="textarea"
                      rows={3}
                      placeholder="多个地址用逗号、分号或换行分隔"
                    />
                  </NFormItem>
                ) : null}
                <NFormItem label="恢复时通知">
                  <NSwitch v-model:value={formData.value.notifyOnRecovery} />
                </NFormItem>
              </>
            ) : (
              <>
                <NFormItem label="监控服务">
                  <NSelect
                    v-model:value={formData.value.service}
                    options={metricServiceOptions.value}
                    placeholder="选择服务"
                  />
                </NFormItem>
                <NFormItem label="监控指标">
                  <NSelect v-model:value={formData.value.metric} options={metricOptions} />
                </NFormItem>
                <NFormItem label="触发条件">
                  <NSpace>
                    <NSelect
                      v-model:value={formData.value.operator}
                      options={operatorOptions}
                      style={{ width: '120px' }}
                    />
                    <NInputNumber v-model:value={formData.value.threshold} />
                  </NSpace>
                </NFormItem>
                <NFormItem label="持续时间">
                  <NInputNumber v-model:value={formData.value.duration} min={1} />
                </NFormItem>
                <NFormItem label="告警等级">
                  <NSelect v-model:value={formData.value.level} options={levelOptions} />
                </NFormItem>
                <NFormItem label="通知渠道">
                  <NSelect
                    v-model:value={formData.value.notificationChannels}
                    options={metricChannelOptions}
                    multiple
                  />
                </NFormItem>
                {formData.value.notificationChannels.includes('Email') ? (
                  <NFormItem label="Email 收件人">
                    <NInput
                      v-model:value={formData.value.emailRecipients}
                      type="textarea"
                      rows={3}
                      placeholder="多个地址用逗号、分号或换行分隔"
                    />
                  </NFormItem>
                ) : null}
                <NFormItem label="恢复时通知">
                  <NSwitch v-model:value={formData.value.notifyOnRecovery} />
                </NFormItem>
              </>
            )}
            <NFormItem label="启用状态">
              <NSwitch v-model:value={formData.value.enabled} />
            </NFormItem>
          </NForm>
          <div class="alert-rules-page__modal-actions">
            <NButton onClick={() => (showEditor.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleSave}>
              保存
            </NButton>
          </div>
        </NModal>
        <NModal v-model:show={showImportModal.value} title="导入规则" preset="card" style={{ width: '680px' }}>
          <NForm>
            <NFormItem label="规则 JSON">
              <NInput
                v-model:value={importPayload.value}
                type="textarea"
                rows={12}
                placeholder='[{"ruleType":"registry_missing","serviceName":"auth"}]'
              />
            </NFormItem>
          </NForm>
          <div class="alert-rules-page__modal-actions">
            <NButton onClick={() => (showImportModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleImport}>
              导入
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
