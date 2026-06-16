import { defineComponent, ref, onMounted, watch, h, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NGrid, NGridItem, NInput, NSelect, NTag, useMessage, NModal, NForm, NFormItem } from 'naive-ui'
import { AlertCircleOutline, CheckmarkCircleOutline, CloseCircleOutline } from '@vicons/ionicons5'
import {
  acknowledgeAlert,
  assignAlert,
  fetchAlertAssignees,
  fetchAlerts,
  resolveAlert,
  suppressAlert
} from '@/api/alerts'
import { fetchCatalogServices, type MetricsDatasetScope } from '@/api/metrics'
import type { AlertItem } from '@/types/monitor'
import PageHeader from '@/shared/layout/PageHeader'
import ResultTable from '@/shared/components/ResultTable'
import DetailDrawer from '@/shared/components/DetailDrawer'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import { useTimeStore } from '@/store/useTimeStore'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import './AlertInboxPage.scss'
import './AlertInboxPage.scss'

export default defineComponent({
  name: 'AlertInboxPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const timeStore = useTimeStore()
    const message = useMessage()
    const datasetScope = computed<MetricsDatasetScope>(() => getPreferredMetricsDatasetScope())
    const searchText = ref('')
    const selectedService = ref('')
    const selectedLevel = ref('')
    const selectedStatus = ref('')
    const selectedAssignee = ref('')
    const loading = ref(false)
    const alertData = ref<AlertItem[]>([])
    const selectedAlert = ref<AlertItem | null>(null)
    const showDetailDrawer = ref(false)
    const serviceOptions = ref([{ label: '全部服务', value: '' }])
    const assigneeOptions = ref([{ label: '全部处理人', value: '' }])
    const handledIncidentId = ref('')
    const showAssignModal = ref(false)
    const assigningAlert = ref<AlertItem | null>(null)
    const assignForm = ref({ assigneeUserId: '' })
    const activeCount = computed(() => alertData.value.filter((item) => item.status === 'active').length)
    const resolvedCount = computed(() => alertData.value.filter((item) => item.status === 'resolved').length)
    const suppressedCount = computed(() => alertData.value.filter((item) => item.status === 'suppressed').length)
    const routeIncidentId = computed(() => {
      if (typeof route.params.incidentId === 'string' && route.params.incidentId) return route.params.incidentId
      return typeof route.query.incidentId === 'string' ? route.query.incidentId : ''
    })
    const routeStatus = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))

    const syncAlertFromRoute = () => {
      const incidentId = routeIncidentId.value
      if (!incidentId) {
        handledIncidentId.value = ''
        return
      }
      if (handledIncidentId.value === incidentId) return

      const matchedAlert = alertData.value.find((item) => item.id === incidentId)
      if (matchedAlert) {
        handleViewDetail(matchedAlert)
        handledIncidentId.value = incidentId
        return
      }

      if (!loading.value) {
        handledIncidentId.value = incidentId
        message.warning('未找到对应事件，已展示当前告警列表')
      }
    }

    const loadServiceOptions = async () => {
      try {
        const res = await fetchCatalogServices({ page: 1, pageSize: 200, scope: datasetScope.value })
        const items = res?.items || []
        serviceOptions.value = [
          { label: '全部服务', value: '' },
          ...items.map((item: any) => ({
            label: item.identity?.name || item.identity?.id,
            value: item.identity?.id || ''
          }))
        ]
      } catch (e) {
        console.error('Failed to fetch services', e)
      }
    }

    const loadAssignees = async () => {
      try {
        const users = await fetchAlertAssignees()
        assigneeOptions.value = [
          { label: '全部处理人', value: '' },
          { label: '未指派', value: '__unassigned__' },
          ...users.map((user) => ({ label: user.nickname, value: user.userId }))
        ]
      } catch (e) {
        console.error('Failed to fetch alert assignees', e)
      }
    }

    const levelOptions = [
      { label: '全部等级', value: '' },
      { label: '严重', value: 'critical' },
      { label: '警告', value: 'warning' },
      { label: '信息', value: 'info' }
    ]

    const statusOptions = [
      { label: '全部状态', value: '' },
      { label: '活跃', value: 'active' },
      { label: '等待持续时间', value: 'pending' },
      { label: '已解决', value: 'resolved' },
      { label: '已静默', value: 'suppressed' }
    ]

    const loadAlerts = async () => {
      loading.value = true
      try {
        const list = await fetchAlerts({
          level: selectedLevel.value,
          status: selectedStatus.value,
          serviceId: selectedService.value,
          assigneeUserId: selectedAssignee.value === '__unassigned__' ? '' : selectedAssignee.value,
          scope: datasetScope.value,
          keyword: searchText.value,
          startTime: timeStore.startTime,
          endTime: timeStore.endTime
        })
        alertData.value =
          selectedAssignee.value === '__unassigned__' ? list.filter((item) => !item.assigneeUserId) : list
        syncAlertFromRoute()
      } catch (e) {
        console.error(e)
        message.error('加载告警失败')
      } finally {
        loading.value = false
      }
    }

    const handleViewDetail = (alert: AlertItem) => {
      selectedAlert.value = alert
      showDetailDrawer.value = true
    }

    const openServiceDetail = (alert: AlertItem) => {
      const targetServiceId = alert.serviceId || selectedService.value
      if (!targetServiceId) {
        message.warning('当前告警缺少服务标识，无法跳转服务详情')
        return
      }
      router.push({
        path: `/home/services/${targetServiceId}`,
        query: {
          timeRange: timeStore.timeRange,
          scope: datasetScope.value
        }
      })
    }

    const openAssignModal = (alert: AlertItem) => {
      assigningAlert.value = alert
      assignForm.value.assigneeUserId = alert.assigneeUserId || ''
      showAssignModal.value = true
    }

    const handleAssign = async () => {
      if (!assigningAlert.value) return
      const matched = assigneeOptions.value.find((item) => item.value === assignForm.value.assigneeUserId)
      try {
        await assignAlert(assigningAlert.value.id, {
          assigneeUserId: assignForm.value.assigneeUserId || '',
          assigneeName: assignForm.value.assigneeUserId ? matched?.label || '' : ''
        })
        showAssignModal.value = false
        await loadAlerts()
        message.success('告警处理人已更新')
      } catch (e) {
        message.error('更新告警处理人失败')
      }
    }

    const columns = [
      {
        title: '时间',
        key: 'time',
        render(row: any) {
          return <div class="alert-inbox-page__mono-time">{row.time}</div>
        }
      },
      {
        title: '状态',
        key: 'status',
        render(row: any) {
          const statusMap = {
            active: { type: 'error', text: '活跃', icon: AlertCircleOutline },
            pending: { type: 'warning', text: '等待持续时间', icon: AlertCircleOutline },
            resolved: { type: 'success', text: '已解决', icon: CheckmarkCircleOutline },
            suppressed: { type: 'default', text: '已静默', icon: CloseCircleOutline }
          }
          const config = statusMap[row.status as keyof typeof statusMap]
          return (
            <NTag type={config.type as any} size="small" round bordered={false}>
              {{
                icon: () => h(config.icon),
                default: () => config.text
              }}
            </NTag>
          )
        }
      },
      { title: '等级', key: 'level' },
      { title: '服务', key: 'service' },
      { title: '告警内容', key: 'message' },
      {
        title: '处理人',
        key: 'assigneeName',
        render(row: any) {
          return row.assigneeName || '未指派'
        }
      },
      {
        title: '操作',
        key: 'actions',
        render(row: any) {
          const handleResolve = async () => {
            try {
              await resolveAlert(row.id)
              await loadAlerts()
              message.success('告警已解决')
            } catch (e) {
              message.error('解决告警失败')
            }
          }
          const handleAcknowledge = async () => {
            try {
              await acknowledgeAlert(row.id)
              await loadAlerts()
              message.success('告警已确认')
            } catch (e) {
              message.error('确认告警失败')
            }
          }
          const handleSuppress = async () => {
            try {
              await suppressAlert(row.id)
              await loadAlerts()
              message.info('告警已静默')
            } catch (e) {
              message.error('静默告警失败')
            }
          }
          return (
            <div class="alert-inbox-page__action-group">
              <NButton
                size="tiny"
                type="primary"
                secondary
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDetail(row)
                }}>
                详情
              </NButton>
              <NButton
                size="tiny"
                secondary
                onClick={(e) => {
                  e.stopPropagation()
                  openAssignModal(row)
                }}>
                指派
              </NButton>
              <NButton
                size="tiny"
                secondary
                onClick={(e) => {
                  e.stopPropagation()
                  openServiceDetail(row)
                }}>
                服务详情
              </NButton>
              {row.status === 'active' && (
                <NButton
                  size="tiny"
                  secondary
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAcknowledge()
                  }}>
                  确认
                </NButton>
              )}
              {row.status === 'active' && (
                <NButton
                  size="tiny"
                  type="success"
                  secondary
                  onClick={(e) => {
                    e.stopPropagation()
                    handleResolve()
                  }}>
                  解决
                </NButton>
              )}
              <NButton
                size="tiny"
                secondary
                onClick={(e) => {
                  e.stopPropagation()
                  handleSuppress()
                }}>
                静默
              </NButton>
            </div>
          )
        }
      }
    ]

    onMounted(() => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      if (route.query.serviceId && typeof route.query.serviceId === 'string') {
        selectedService.value = route.query.serviceId
      }
      if (routeStatus.value) {
        selectedStatus.value = routeStatus.value
      }
      loadServiceOptions()
      loadAssignees()
      loadAlerts()
    })

    watch(() => [timeStore.startTime, timeStore.endTime], loadAlerts)
    watch(() => routeIncidentId.value, syncAlertFromRoute)
    watch(
      () => routeStatus.value,
      (value) => {
        selectedStatus.value = value
      }
    )

    return () => (
      <div class="alert-inbox-page">
        <PageHeader title="告警收件箱" subtitle="统一查看当前告警、处理状态与服务关联上下文" />

        <TimeRangeBar
          value={timeStore.timeRange}
          live={timeStore.isLive}
          options={timeStore.timeOptions as any}
          onUpdate:value={(range: any) => timeStore.setTimeRange(range)}
          onUpdate:live={(value: boolean) => {
            timeStore.isLive = value
            if (value) timeStore.refreshTime()
          }}
          onRefresh={() => {
            timeStore.refreshTime()
            loadAlerts()
          }}
        />

        <div class="alert-inbox-page__filters">
          <NInput v-model:value={searchText.value} placeholder="搜索告警内容..." style={{ width: '240px' }} />
          <NSelect
            v-model:value={selectedService.value}
            options={serviceOptions.value}
            placeholder="服务"
            clearable
            style={{ width: '180px' }}
          />
          <NSelect
            v-model:value={selectedLevel.value}
            options={levelOptions}
            placeholder="等级"
            clearable
            style={{ width: '160px' }}
          />
          <NSelect
            v-model:value={selectedStatus.value}
            options={statusOptions}
            placeholder="状态"
            clearable
            style={{ width: '160px' }}
          />
          <NSelect
            v-model:value={selectedAssignee.value}
            options={assigneeOptions.value}
            placeholder="处理人"
            clearable
            style={{ width: '180px' }}
          />
          <NButton type="primary" onClick={loadAlerts}>
            查询
          </NButton>
        </div>

        <NGrid cols={4} xGap={16} class="alert-inbox-page__summary-grid">
          {[
            { label: '总告警数', value: alertData.value.length },
            { label: '活跃', value: activeCount.value },
            { label: '已解决', value: resolvedCount.value },
            { label: '已静默', value: suppressedCount.value }
          ].map((item) => (
            <NGridItem key={item.label}>
              <NCard bordered={false} class="alert-inbox-page__summary-card">
                <div class="alert-inbox-page__summary-label">{item.label}</div>
                <div class="alert-inbox-page__summary-value">{item.value}</div>
              </NCard>
            </NGridItem>
          ))}
        </NGrid>

        <ResultTable
          columns={columns}
          data={alertData.value}
          loading={loading.value}
          rowKey={(row: any) => row.id}
          class="alert-inbox-page__table"
          rowProps={(row: any) => ({ onClick: () => handleViewDetail(row) })}
        />

        <DetailDrawer
          show={showDetailDrawer.value}
          title="告警详情"
          width="md"
          onUpdate:show={(value: boolean) => {
            showDetailDrawer.value = value
            if (!value && routeIncidentId.value) {
              router.replace({
                path: '/home/alerts/inbox',
                query: {
                  ...route.query,
                  incidentId: undefined
                }
              })
            }
          }}>
          {selectedAlert.value ? (
            <div class="alert-inbox-page__detail">
              <div>
                <span class="alert-inbox-page__detail-label">时间：</span>
                {selectedAlert.value.time}
              </div>
              <div>
                <span class="alert-inbox-page__detail-label">状态：</span>
                {selectedAlert.value.status}
              </div>
              <div>
                <span class="alert-inbox-page__detail-label">等级：</span>
                {selectedAlert.value.level}
              </div>
              <div>
                <span class="alert-inbox-page__detail-label">服务：</span>
                {selectedAlert.value.service}
              </div>
              <div>
                <span class="alert-inbox-page__detail-label">处理人：</span>
                {selectedAlert.value.assigneeName || '未指派'}
              </div>
              <div>
                <span class="alert-inbox-page__detail-label">内容：</span>
                {selectedAlert.value.message}
              </div>
              <div class="alert-inbox-page__detail-action">
                <NButton secondary type="primary" onClick={() => openServiceDetail(selectedAlert.value as AlertItem)}>
                  查看服务详情
                </NButton>
              </div>
            </div>
          ) : null}
        </DetailDrawer>

        <NModal v-model:show={showAssignModal.value} preset="dialog" title="指派告警处理人">
          <NForm>
            <NFormItem label="处理人">
              <NSelect
                v-model:value={assignForm.value.assigneeUserId}
                options={assigneeOptions.value.filter((item) => item.value !== '' && item.value !== '__unassigned__')}
                clearable
              />
            </NFormItem>
          </NForm>
          <div class="alert-inbox-page__modal-actions">
            <NButton onClick={() => (showAssignModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleAssign}>
              保存
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
