import {
  NCard,
  NTag,
  NSpace,
  NButton,
  NModal,
  NTabs,
  NTabPane,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NInputNumber,
  NSwitch,
  NSpin,
  NGrid,
  NGridItem,
  useMessage
} from 'naive-ui'
import { ref, h, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTimeStore } from '@/store/useTimeStore'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import {
  fetchAlertRules,
  saveAlertRule,
  updateAlertRule,
  deleteAlertRule,
  bulkUpdateAlertRules,
  exportAlertRules,
  importAlertRules
} from '@/api/alerts'
import { fetchCatalogServices, type MetricsDatasetScope } from '@/api/metrics'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import type { AlertRuleItem } from '@/types/monitor'
import './AlertRulesPage.scss'

export default defineComponent({
  name: 'AlertRulesPage',
  setup() {
    const message = useMessage()
    const route = useRoute()
    const timeStore = useTimeStore()
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())
    const showAddModal = ref(false)
    const showEditModal = ref(false)
    const showImportModal = ref(false)
    const editingRule = ref<any>(null)
    const importPayload = ref('[]')
    const selectedRuleType = ref<'metrics' | 'logs' | 'trace' | 'quota'>('metrics')

    const formData = ref({
      name: '',
      service: '',
      metric: '',
      operator: '',
      threshold: 0,
      duration: 5,
      level: 'warning',
      enabled: true,
      notificationChannels: [] as string[]
    })

    const serviceOptions = ref([{ label: '全部服务', value: 'all' }])

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        const items = res?.items || []
        serviceOptions.value = [
          { label: '全部服务', value: 'all' },
          ...items.map((item: any) => ({
            label: item.identity?.name || item.identity?.id,
            value: item.identity?.id || 'all'
          }))
        ]
      } catch (e) {
        console.error('Failed to fetch services', e)
      }
    }

    onMounted(() => {
      loadServiceOptions()
    })

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
      { label: '邮件', value: 'email' },
      { label: 'Slack', value: 'slack' },
      { label: 'Webhook', value: 'webhook' },
      { label: '短信', value: 'sms' }
    ]

    const columns = [
      { title: '规则名称', key: 'name', width: 200 },
      { title: '服务', key: 'service', width: 150 },
      { title: '监控指标', key: 'metric', width: 120 },
      {
        title: '条件',
        key: 'condition',
        width: 150,
        render(row: any) {
          return `${row.operator} ${row.threshold}${row.unit || ''}`
        }
      },
      {
        title: '持续时间',
        key: 'duration',
        width: 100,
        render(row: any) {
          return `${row.duration}分钟`
        }
      },
      {
        title: '告警等级',
        key: 'level',
        width: 100,
        render(row: any) {
          const levelMap = {
            critical: { type: 'error', text: '严重' },
            warning: { type: 'warning', text: '警告' },
            info: { type: 'info', text: '信息' }
          }
          const config = levelMap[row.level as keyof typeof levelMap]
          return h(NTag, { type: config.type as any }, { default: () => config.text })
        }
      },
      {
        title: '状态',
        key: 'enabled',
        width: 80,
        render(row: any) {
          return h(
            NTag,
            { type: row.enabled ? 'success' : 'default' },
            { default: () => (row.enabled ? '启用' : '禁用') }
          )
        }
      },
      {
        title: '通知渠道',
        key: 'channels',
        width: 150,
        render(row: any) {
          return row.channels.join(', ')
        }
      },
      {
        title: '操作',
        key: 'actions',
        width: 200,
        render(row: any) {
          return h(NSpace, null, {
            default: () => [
              h(NButton, { size: 'small', type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
              h(
                NButton,
                { size: 'small', type: row.enabled ? 'warning' : 'success', onClick: () => handleToggle(row) },
                { default: () => (row.enabled ? '禁用' : '启用') }
              ),
              h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' })
            ]
          })
        }
      }
    ]

    const loading = ref(false)
    const rulesData = ref<AlertRuleItem[]>([])
    const enabledCount = computed(() => rulesData.value.filter((rule) => rule.enabled).length)
    const criticalCount = computed(() => rulesData.value.filter((rule) => rule.level === 'critical').length)
    const coveredServiceCount = computed(
      () => new Set(rulesData.value.map((rule) => rule.service).filter(Boolean)).size
    )

    const resolveRuleType = (metric: string) => {
      if (metric === 'error_rate' || metric.includes('log')) return 'logs'
      if (metric === 'response_time' || metric.includes('trace')) return 'trace'
      if (metric === 'qps' || metric.includes('quota')) return 'quota'
      return 'metrics'
    }

    const filteredRules = computed(() => {
      let list = rulesData.value
      if (route.query.serviceId && typeof route.query.serviceId === 'string') {
        list = list.filter((rule) => rule.service === route.query.serviceId)
      }
      return list.filter((rule) => resolveRuleType(rule.metric) === selectedRuleType.value)
    })

    const loadRules = async () => {
      loading.value = true
      rulesData.value = await fetchAlertRules({
        serviceId: route.query.serviceId as string | undefined,
        scope: datasetScope.value,
        startTime: timeStore.startTime,
        endTime: timeStore.endTime
      })
      loading.value = false
    }

    onMounted(() => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      if (route.query.serviceId && typeof route.query.serviceId === 'string') {
        formData.value.service = route.query.serviceId
      }
      loadServiceOptions()
      loadRules()
    })

    watch(
      () => [timeStore.startTime, timeStore.endTime],
      () => {
        loadRules()
      }
    )

    const handleAdd = () => {
      formData.value = {
        name: '',
        service: '',
        metric:
          selectedRuleType.value === 'metrics'
            ? 'cpu_usage'
            : selectedRuleType.value === 'logs'
              ? 'error_rate'
              : selectedRuleType.value === 'trace'
                ? 'response_time'
                : 'qps',
        operator: '',
        threshold: 0,
        duration: 5,
        level: 'warning',
        enabled: true,
        notificationChannels: []
      }
      showAddModal.value = true
    }

    const handleEdit = (rule: any) => {
      editingRule.value = rule
      formData.value = {
        ...rule,
        notificationChannels: Array.isArray(rule.notificationChannels)
          ? rule.notificationChannels
          : Array.isArray(rule.channels)
            ? rule.channels
            : []
      }
      showEditModal.value = true
    }

    const handleToggle = async (rule: AlertRuleItem) => {
      rule.enabled = !rule.enabled
      await updateAlertRule(rule)
    }

    const handleDelete = async (rule: AlertRuleItem) => {
      await deleteAlertRule(rule.id)
      const index = rulesData.value.findIndex((r) => r.id === rule.id)
      if (index > -1) rulesData.value.splice(index, 1)
    }

    const handleBulkToggle = async (enabled: boolean) => {
      const ids = filteredRules.value.map((rule) => rule.id)
      if (!ids.length) {
        message.info('当前没有可批量处理的规则')
        return
      }
      const updated = await bulkUpdateAlertRules({ ids, enabled })
      const updateMap = new Map(updated.map((item) => [item.id, item]))
      rulesData.value = rulesData.value.map((rule) => updateMap.get(rule.id) || rule)
      message.success(enabled ? '批量启用成功' : '批量禁用成功')
    }

    const handleExport = async () => {
      const exported = await exportAlertRules({
        serviceId: route.query.serviceId as string | undefined,
        scope: datasetScope.value,
        startTime: timeStore.startTime,
        endTime: timeStore.endTime
      })
      const blob = new Blob([JSON.stringify(exported.rules, null, 2)], { type: 'application/json' })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `alert-rules-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
      message.success('导出规则成功')
    }

    const handleImport = async () => {
      const parsed = JSON.parse(importPayload.value)
      const imported = await importAlertRules({ rules: parsed })
      rulesData.value = [
        ...imported,
        ...rulesData.value.filter((rule) => !imported.some((item) => item.id === rule.id))
      ]
      showImportModal.value = false
      importPayload.value = '[]'
      message.success('导入规则成功')
    }

    const handleSave = async () => {
      if (editingRule.value) {
        const ruleToUpdate: AlertRuleItem = {
          ...editingRule.value,
          ...formData.value,
          operator: formData.value.operator as any,
          level: formData.value.level as any,
          channels: formData.value.notificationChannels
        }
        const updated = await updateAlertRule(ruleToUpdate)
        Object.assign(editingRule.value, updated)
        showEditModal.value = false
      } else {
        const ruleToSave: Omit<AlertRuleItem, 'id'> = {
          ...formData.value,
          operator: formData.value.operator as any,
          level: formData.value.level as any,
          channels: formData.value.notificationChannels
        }
        const saved = await saveAlertRule(ruleToSave)
        rulesData.value.push(saved)
        showAddModal.value = false
      }
      editingRule.value = null
    }

    return () => (
      <div class="alert-rules-page">
        <PageHeader title="告警规则配置" subtitle="支持设置阈值告警、自定义条件与通知渠道" />
        <TimeRangeBar
          value={timeStore.timeRange}
          live={timeStore.isLive}
          options={timeStore.timeOptions as any}
          onUpdate:value={(range: any) => {
            timeStore.setTimeRange(range)
            loadRules()
          }}
          onUpdate:live={(value: boolean) => {
            timeStore.isLive = value
            if (value) timeStore.refreshTime()
            loadRules()
          }}
          onRefresh={loadRules}
        />
        <NTabs v-model:value={selectedRuleType.value} class="alert-rules-page__tabs">
          <NTabPane name="metrics" tab="指标规则" />
          <NTabPane name="logs" tab="日志规则" />
          <NTabPane name="trace" tab="链路规则" />
          <NTabPane name="quota" tab="配额规则" />
        </NTabs>
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
        <NCard bordered={false} class="alert-rules-page__preview-card">
          <div class="alert-rules-page__preview-note">规则预览</div>
          <div class="alert-rules-page__preview-grid">
            <div>名称：{formData.value.name || '-'}</div>
            <div>服务：{formData.value.service || '-'}</div>
            <div>指标：{formData.value.metric || '-'}</div>
            <div>条件：{formData.value.operator ? `${formData.value.operator} ${formData.value.threshold}` : '-'}</div>
            <div>持续时间：{formData.value.duration ? `${formData.value.duration}分钟` : '-'}</div>
            <div>等级：{formData.value.level || '-'}</div>
            <div class="alert-rules-page__preview-grid-wide">
              通知渠道：
              {formData.value.notificationChannels.length ? formData.value.notificationChannels.join(', ') : '-'}
            </div>
          </div>
        </NCard>
        <NCard bordered={false} class="alert-rules-page__action-card">
          <NSpace class="alert-rules-page__action-row">
            <NButton type="primary" onClick={handleAdd}>
              + 添加规则
            </NButton>
            <NButton onClick={() => handleBulkToggle(true)}>批量启用</NButton>
            <NButton onClick={() => handleBulkToggle(false)}>批量禁用</NButton>
            <NButton onClick={() => (showImportModal.value = true)}>导入规则</NButton>
            <NButton onClick={handleExport}>导出规则</NButton>
          </NSpace>
        </NCard>
        <NCard bordered={false} class="alert-rules-page__table-card" contentStyle={{ padding: 0 }}>
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
                rowKey={(row: any) => row.id}
              />
            </div>
          )}
        </NCard>

        <NModal v-model:show={showAddModal.value} title="添加规则" preset="card" style={{ width: '600px' }}>
          <NForm model={formData.value} labelPlacement="left" labelWidth={100}>
            <NFormItem label="规则名称">
              <NInput v-model:value={formData.value.name} placeholder="请输入规则名称" />
            </NFormItem>
            <NFormItem label="监控服务">
              <NSelect v-model:value={formData.value.service} options={serviceOptions.value} placeholder="选择服务" />
            </NFormItem>
            <NFormItem label="监控指标">
              <NSelect v-model:value={formData.value.metric} options={metricOptions} placeholder="选择指标" />
            </NFormItem>
            <NFormItem label="触发条件">
              <NSpace>
                <NSelect v-model:value={formData.value.operator} options={operatorOptions} style={{ width: '120px' }} />
                <NInputNumber v-model:value={formData.value.threshold} placeholder="阈值" style={{ width: '150px' }} />
              </NSpace>
            </NFormItem>
            <NFormItem label="持续时间">
              <NInputNumber v-model:value={formData.value.duration} placeholder="分钟" style={{ width: '150px' }} />
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
            <NFormItem label="启用状态">
              <NSwitch v-model:value={formData.value.enabled} />
            </NFormItem>
          </NForm>
          <div class="alert-rules-page__modal-actions">
            <NButton onClick={() => (showAddModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleSave}>
              保存
            </NButton>
          </div>
        </NModal>

        <NModal v-model:show={showEditModal.value} title="编辑规则" preset="card" style={{ width: '600px' }}>
          <NForm model={formData.value} labelPlacement="left" labelWidth={100}>
            <NFormItem label="规则名称">
              <NInput v-model:value={formData.value.name} placeholder="请输入规则名称" />
            </NFormItem>
            <NFormItem label="监控服务">
              <NSelect v-model:value={formData.value.service} options={serviceOptions.value} placeholder="选择服务" />
            </NFormItem>
            <NFormItem label="监控指标">
              <NSelect v-model:value={formData.value.metric} options={metricOptions} placeholder="选择指标" />
            </NFormItem>
            <NFormItem label="触发条件">
              <NSpace>
                <NSelect v-model:value={formData.value.operator} options={operatorOptions} style={{ width: '120px' }} />
                <NInputNumber v-model:value={formData.value.threshold} placeholder="阈值" style={{ width: '150px' }} />
              </NSpace>
            </NFormItem>
            <NFormItem label="持续时间">
              <NInputNumber v-model:value={formData.value.duration} placeholder="分钟" style={{ width: '150px' }} />
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
            <NFormItem label="启用状态">
              <NSwitch v-model:value={formData.value.enabled} />
            </NFormItem>
          </NForm>
          <div class="alert-rules-page__modal-actions">
            <NButton onClick={() => (showEditModal.value = false)}>取消</NButton>
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
                placeholder='[{"name":"CPU 告警","service":"svc-growth"}]'
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
