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
    const routeServiceId = computed(() => {
      const serviceId = typeof route.query.serviceId === 'string' ? route.query.serviceId.trim() : ''
      if (!serviceId || serviceId === 'undefined' || serviceId === 'null') return undefined
      return serviceId
    })
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
    const scopeLabel = computed(() => (datasetScope.value === 'system' ? 'Darwin 系统' : '用户接入'))

    const resolveRuleType = (metric: string) => {
      if (metric === 'error_rate' || metric.includes('log')) return 'logs'
      if (metric === 'response_time' || metric.includes('trace')) return 'trace'
      if (metric === 'qps' || metric.includes('quota')) return 'quota'
      return 'metrics'
    }

    const filteredRules = computed(() => {
      let list = rulesData.value
      if (routeServiceId.value) {
        list = list.filter((rule) => rule.service === routeServiceId.value)
      }
      return list.filter((rule) => resolveRuleType(rule.metric) === selectedRuleType.value)
    })

    const loadRules = async () => {
      loading.value = true
      rulesData.value = await fetchAlertRules({
        serviceId: routeServiceId.value,
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
      if (routeServiceId.value) {
        formData.value.service = routeServiceId.value
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
        serviceId: routeServiceId.value,
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
        <PageHeader title="告警规则配置" subtitle="配置阈值触发条件、通知渠道与批量启停策略" />

        <section class="alert-rules-page__context-card">
          <div>
            <div class="alert-rules-page__context-title">规则工作台</div>
            <div class="alert-rules-page__context-desc">
              当前范围：{scopeLabel.value} · {routeServiceId.value ? `服务 ${routeServiceId.value}` : '全部服务'}
            </div>
          </div>
          <NTag type={routeServiceId.value ? 'info' : 'success'} bordered={false}>
            {routeServiceId.value ? '服务上下文' : '全局规则'}
          </NTag>
        </section>

        <div class="alert-rules-page__toolbar-card">
          <div class="alert-rules-page__toolbar-primary">
            <NTabs v-model:value={selectedRuleType.value} class="alert-rules-page__tabs">
              <NTabPane name="metrics" tab="指标规则" />
              <NTabPane name="logs" tab="日志规则" />
              <NTabPane name="trace" tab="链路规则" />
              <NTabPane name="quota" tab="配额规则" />
            </NTabs>
          </div>
          <div class="alert-rules-page__toolbar-secondary">
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
          </div>
        </div>

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
          <div class="alert-rules-page__preview-note">预览会跟随新增/编辑表单变化，用于确认触发条件与通知范围。</div>
          <div class="alert-rules-page__preview-grid">
            <div class="alert-rules-page__preview-item">
              <span>名称</span>
              {formData.value.name || '-'}
            </div>
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
              {formData.value.operator ? `${formData.value.operator} ${formData.value.threshold}` : '-'}
            </div>
            <div class="alert-rules-page__preview-item">
              <span>持续时间</span>
              {formData.value.duration ? `${formData.value.duration}分钟` : '-'}
            </div>
            <div class="alert-rules-page__preview-item">
              <span>等级</span>
              {formData.value.level || '-'}
            </div>
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
            <div class="alert-rules-page__action-copy">
              <div class="alert-rules-page__action-title">规则操作</div>
              <div class="alert-rules-page__action-desc">对当前类型下的规则进行新增、导入导出或批量启停。</div>
            </div>
            <NSpace class="alert-rules-page__action-buttons">
              <NButton type="primary" onClick={handleAdd}>
                + 添加规则
              </NButton>
              <NButton onClick={() => handleBulkToggle(true)}>批量启用</NButton>
              <NButton onClick={() => handleBulkToggle(false)}>批量禁用</NButton>
              <NButton onClick={() => (showImportModal.value = true)}>导入规则</NButton>
              <NButton onClick={handleExport}>导出规则</NButton>
            </NSpace>
          </div>
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
