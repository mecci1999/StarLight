import {
  NCard,
  NDataTable,
  NTag,
  NSpace,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NInputNumber,
  NSwitch,
  NSpin
} from 'naive-ui'
import { ref, h, onMounted } from 'vue'
import { NotificationsOutline } from '@vicons/ionicons5'
import SectionHeader from '@/components/common/SectionHeader'
import { fetchAlertRules, saveAlertRule, updateAlertRule, deleteAlertRule } from '@/mock/api'
import type { AlertRuleItem } from '@/types/monitor'

export default defineComponent({
  name: 'AlertRules',
  setup() {
    const showAddModal = ref(false)
    const showEditModal = ref(false)
    const editingRule = ref<any>(null)

    // 表单数据
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

    const serviceOptions = [
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' },
      { label: '全部服务', value: 'all' }
    ]

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
      {
        title: '规则名称',
        key: 'name',
        width: 200
      },
      {
        title: '服务',
        key: 'service',
        width: 150
      },
      {
        title: '监控指标',
        key: 'metric',
        width: 120
      },
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
            {
              type: row.enabled ? 'success' : 'default'
            },
            {
              default: () => (row.enabled ? '启用' : '禁用')
            }
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
              h(
                NButton,
                {
                  size: 'small',
                  type: 'primary',
                  onClick: () => handleEdit(row)
                },
                { default: () => '编辑' }
              ),
              h(
                NButton,
                {
                  size: 'small',
                  type: row.enabled ? 'warning' : 'success',
                  onClick: () => handleToggle(row)
                },
                { default: () => (row.enabled ? '禁用' : '启用') }
              ),
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                  onClick: () => handleDelete(row)
                },
                { default: () => '删除' }
              )
            ]
          })
        }
      }
    ]

    const loading = ref(false)
    const rulesData = ref<AlertRuleItem[]>([])

    const loadRules = async () => {
      loading.value = true
      rulesData.value = await fetchAlertRules()
      loading.value = false
    }
    onMounted(loadRules)

    const handleAdd = () => {
      formData.value = {
        name: '',
        service: '',
        metric: '',
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
      formData.value = { ...rule }
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
      <div class="p-24px h-full bg-gray-50/50 flex flex-col overflow-hidden">
        <SectionHeader
          title="告警规则配置"
          subtitle="支持设置阈值告警、自定义条件、通知渠道"
          icon={NotificationsOutline}
        />

        {/* 操作面板 */}
        <NCard bordered={false} class="mb-4 shadow-sm rounded-lg">
          <NSpace>
            <NButton type="primary" onClick={handleAdd}>
              + 添加规则
            </NButton>
            <NButton>批量启用</NButton>
            <NButton>批量禁用</NButton>
            <NButton>导入规则</NButton>
            <NButton>导出规则</NButton>
          </NSpace>
        </NCard>

        {/* 规则列表 */}
        <NCard bordered={false} class="flex-1 shadow-sm rounded-lg" contentStyle={{ padding: 0 }}>
          {loading.value ? (
            <div class="py-40px flex items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : (
            <div class="p-4 h-full flex flex-col">
              <NDataTable
                class="flex-1"
                flex-height
                columns={columns}
                data={rulesData.value}
                pagination={{
                  pageSize: 10,
                  showSizePicker: true,
                  pageSizes: [10, 20, 50]
                }}
                bordered={false}
                singleLine={false}
                rowKey={(row: any) => row.id}
              />
            </div>
          )}
        </NCard>

        {/* 添加规则模态框 */}
        <NModal
          v-model:show={showAddModal.value}
          preset="dialog"
          title="添加告警规则"
          bordered={false}
          class="shadow-lg rounded-lg">
          <NForm model={formData.value} labelPlacement="left" labelWidth={100} class="mt-4">
            <NFormItem label="规则名称" required>
              <NInput v-model:value={formData.value.name} placeholder="请输入规则名称" />
            </NFormItem>
            <NFormItem label="服务" required>
              <NSelect v-model:value={formData.value.service} options={serviceOptions} placeholder="选择服务" />
            </NFormItem>
            <NFormItem label="监控指标" required>
              <NSelect v-model:value={formData.value.metric} options={metricOptions} placeholder="选择指标" />
            </NFormItem>
            <NFormItem label="条件" required>
              <NSpace>
                <NSelect v-model:value={formData.value.operator} options={operatorOptions} style={{ width: '80px' }} />
                <NInputNumber v-model:value={formData.value.threshold} placeholder="阈值" style={{ width: '120px' }} />
              </NSpace>
            </NFormItem>
            <NFormItem label="持续时间">
              <NInputNumber v-model:value={formData.value.duration} min={1} max={60}>
                {{
                  suffix: () => <span>分钟</span>
                }}
              </NInputNumber>
            </NFormItem>
            <NFormItem label="告警等级">
              <NSelect v-model:value={formData.value.level} options={levelOptions} />
            </NFormItem>
            <NFormItem label="通知渠道">
              <NSelect v-model:value={formData.value.notificationChannels} options={channelOptions} multiple />
            </NFormItem>
            <NFormItem label="启用状态">
              <NSwitch v-model:value={formData.value.enabled} />
            </NFormItem>
          </NForm>
          <div class="flex justify-end gap-8px mt-16px">
            <NButton onClick={() => (showAddModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleSave}>
              确定
            </NButton>
          </div>
        </NModal>

        {/* 编辑规则模态框 */}
        <NModal
          v-model:show={showEditModal.value}
          preset="dialog"
          title="编辑告警规则"
          bordered={false}
          class="shadow-lg rounded-lg">
          <NForm model={formData.value} labelPlacement="left" labelWidth={100} class="mt-4">
            <NFormItem label="规则名称" required>
              <NInput v-model:value={formData.value.name} placeholder="请输入规则名称" />
            </NFormItem>
            <NFormItem label="服务" required>
              <NSelect v-model:value={formData.value.service} options={serviceOptions} placeholder="选择服务" />
            </NFormItem>
            <NFormItem label="监控指标" required>
              <NSelect v-model:value={formData.value.metric} options={metricOptions} placeholder="选择指标" />
            </NFormItem>
            <NFormItem label="条件" required>
              <NSpace>
                <NSelect v-model:value={formData.value.operator} options={operatorOptions} style={{ width: '80px' }} />
                <NInputNumber v-model:value={formData.value.threshold} placeholder="阈值" style={{ width: '120px' }} />
              </NSpace>
            </NFormItem>
            <NFormItem label="持续时间">
              <NInputNumber v-model:value={formData.value.duration} min={1} max={60}>
                {{
                  suffix: () => <span>分钟</span>
                }}
              </NInputNumber>
            </NFormItem>
            <NFormItem label="告警等级">
              <NSelect v-model:value={formData.value.level} options={levelOptions} />
            </NFormItem>
            <NFormItem label="通知渠道">
              <NSelect v-model:value={formData.value.notificationChannels} options={channelOptions} multiple />
            </NFormItem>
            <NFormItem label="启用状态">
              <NSwitch v-model:value={formData.value.enabled} />
            </NFormItem>
          </NForm>
          <div class="flex justify-end gap-8px mt-16px">
            <NButton onClick={() => (showEditModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleSave}>
              确定
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
