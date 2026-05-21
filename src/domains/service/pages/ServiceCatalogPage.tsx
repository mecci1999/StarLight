import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import {
  NButton,
  NCard,
  NEmpty,
  NGrid,
  NGridItem,
  NSpin,
  NStatistic,
  NInput,
  NSelect,
  NSpace,
  NTag,
  useMessage
} from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import {
  fetchCatalogServiceQuickView,
  fetchCatalogServices,
  fetchCatalogServicesSummary,
  type MetricsDatasetScope
} from '@/api'
import type { ServiceItem } from '@/types/monitor'
import PageHeader from '@/shared/layout/PageHeader'
import TimeRangeBar from '@/shared/components/TimeRangeBar'
import ScopeBar from '@/shared/components/ScopeBar'
import ResultTable from '@/shared/components/ResultTable'
import ServiceHealthBadge from '@/shared/components/ServiceHealthBadge'
import DetailDrawer from '@/shared/components/DetailDrawer'
import { useTimeStore } from '@/store/useTimeStore'
import { getPreferredMetricsDatasetScope } from '@/services/authSession'
import './ServiceCatalogPage.scss'

export default defineComponent({
  name: 'ServiceCatalogPageV2',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const timeStore = useTimeStore()
    const message = useMessage()
    const datasetScope = ref<MetricsDatasetScope>(getPreferredMetricsDatasetScope())
    const scopeValue = ref({ service: null, env: null, region: null })
    const query = ref('')
    const selectedStatus = ref('')
    const selectedEnv = ref('')
    const selectedTeam = ref('')
    const selectedOwner = ref('')
    const selectedTag = ref('')
    const sortBy = ref<'name' | 'qps' | 'errorRate' | 'latency' | 'lastDeploy'>('name')
    const viewMode = ref<'table' | 'card'>('table')
    const loading = ref(false)
    const loadError = ref('')
    const allRows = ref<ServiceItem[]>([])
    const rows = ref<ServiceItem[]>([])
    const summary = ref<{
      total: number | null
      healthy: number | null
      degraded: number | null
      critical: number | null
      muted: number | null
    }>({ total: null, healthy: null, degraded: null, critical: null, muted: null })
    const quickViewLoading = ref(false)
    const quickViewVisible = ref(false)
    const quickView = ref<any | null>(null)

    const applyRowFiltersAndSort = () => {
      rows.value = allRows.value
        .filter((row: any) => !scopeValue.value.service || row.id === scopeValue.value.service)
        .filter((row: any) => !scopeValue.value.env || row.env === scopeValue.value.env)
        .filter((row: any) => !scopeValue.value.region || row.region === scopeValue.value.region)
        .filter((row: any) => {
          const keyword = query.value.trim().toLowerCase()
          if (!keyword) return true
          return [row.name, row.owner, row.team, ...(row.tags || [])]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword))
        })
        .filter((row: any) => !selectedStatus.value || row.health === selectedStatus.value)
        .filter((row: any) => !selectedEnv.value || row.env === selectedEnv.value)
        .filter((row: any) => !selectedTeam.value || row.team === selectedTeam.value)
        .filter((row: any) => !selectedOwner.value || row.owner === selectedOwner.value)
        .filter((row: any) => !selectedTag.value || (row.tags || []).includes(selectedTag.value))
      rows.value = [...rows.value].sort((a: any, b: any) => {
        if (sortBy.value === 'name') return String(a.name).localeCompare(String(b.name))
        if (sortBy.value === 'lastDeploy') return String(b.lastDeploy || '').localeCompare(String(a.lastDeploy || ''))
        const left = typeof a[sortBy.value] === 'number' ? a[sortBy.value] : Number.NEGATIVE_INFINITY
        const right = typeof b[sortBy.value] === 'number' ? b[sortBy.value] : Number.NEGATIVE_INFINITY
        return right - left
      })
    }

    const loadServices = async () => {
      loading.value = true
      loadError.value = ''
      try {
        const [res, summaryRes] = await Promise.all([
          fetchCatalogServices({
            page: 1,
            pageSize: 50,
            scope: datasetScope.value
          }),
          fetchCatalogServicesSummary({ scope: datasetScope.value })
        ])
        const items = res?.items || []
        allRows.value = items.map((item: any) => ({
          id: item.identity?.id,
          name: item.identity?.name,
          owner: item.identity?.owner,
          team: item.identity?.team,
          env: item.identity?.env,
          region: item.identity?.region,
          version: item.identity?.runtime,
          tags: item.identity?.tags || [],
          health: item.identity?.healthStatus,
          qps: item.qps,
          latency: item.p95Latency,
          errorRate: item.errorRate,
          activeIncidentCount: item.activeIncidentCount,
          instances: item.instanceCount,
          lastDeploy: item.lastDeployAt,
          status:
            item.identity?.healthStatus === 'healthy'
              ? 'running'
              : item.identity?.healthStatus === 'warning' || item.identity?.healthStatus === 'degraded'
                ? 'warning'
                : item.identity?.healthStatus === 'unknown' || item.identity?.healthStatus === 'muted'
                  ? 'unknown'
                  : item.identity?.healthStatus === 'critical'
                    ? 'error'
                    : 'unknown'
        }))
        applyRowFiltersAndSort()
        summary.value = {
          total: summaryRes?.total ?? null,
          healthy: summaryRes?.healthy ?? null,
          degraded: summaryRes?.degraded ?? null,
          critical: summaryRes?.critical ?? null,
          muted: summaryRes?.muted ?? null
        }
      } catch (error) {
        console.error('Failed to load services:', error)
        allRows.value = []
        rows.value = []
        summary.value = { total: null, healthy: null, degraded: null, critical: null, muted: null }
        loadError.value = '服务目录加载失败，请检查后端服务或稍后重试。'
        message.error('加载服务目录失败')
      } finally {
        loading.value = false
      }
    }

    const envOptions = computed(() => {
      const envs = Array.from(new Set(allRows.value.map((row: any) => row.env).filter(Boolean)))
      return [{ label: '全部环境', value: '' }, ...envs.map((env) => ({ label: env, value: env }))]
    })

    const scopeOptions = computed(() => ({
      services: allRows.value.map((row: any) => ({ label: row.name, value: row.id })),
      envs: envOptions.value.filter((item) => item.value),
      regions: Array.from(new Set(allRows.value.map((row: any) => row.region).filter(Boolean))).map((value) => ({
        label: value,
        value
      }))
    }))

    const teamOptions = computed(() => {
      const teams = Array.from(new Set(allRows.value.map((row: any) => row.team).filter(Boolean)))
      return [{ label: '全部团队', value: '' }, ...teams.map((team) => ({ label: team, value: team }))]
    })

    const activeFilterChips = computed(
      () =>
        [
          query.value ? { key: 'query', label: `关键词: ${query.value}` } : null,
          scopeValue.value.service
            ? {
                key: 'scope-service',
                label: `服务: ${allRows.value.find((row: any) => row.id === scopeValue.value.service)?.name || scopeValue.value.service}`
              }
            : null,
          scopeValue.value.env ? { key: 'scope-env', label: `范围环境: ${scopeValue.value.env}` } : null,
          scopeValue.value.region ? { key: 'scope-region', label: `范围区域: ${scopeValue.value.region}` } : null,
          selectedStatus.value ? { key: 'status', label: `状态: ${selectedStatus.value}` } : null,
          selectedEnv.value ? { key: 'env', label: `环境: ${selectedEnv.value}` } : null,
          selectedTeam.value ? { key: 'team', label: `团队: ${selectedTeam.value}` } : null,
          selectedOwner.value ? { key: 'owner', label: `Owner: ${selectedOwner.value}` } : null,
          selectedTag.value ? { key: 'tag', label: `Tag: ${selectedTag.value}` } : null
        ].filter(Boolean) as Array<{ key: string; label: string }>
    )

    const clearFilterChip = (key: string) => {
      if (key === 'query') query.value = ''
      if (key === 'scope-service') scopeValue.value.service = null
      if (key === 'scope-env') scopeValue.value.env = null
      if (key === 'scope-region') scopeValue.value.region = null
      if (key === 'status') selectedStatus.value = ''
      if (key === 'env') selectedEnv.value = ''
      if (key === 'team') selectedTeam.value = ''
      if (key === 'owner') selectedOwner.value = ''
      if (key === 'tag') selectedTag.value = ''
    }

    const openQuickView = async (serviceId: string) => {
      quickViewVisible.value = true
      quickViewLoading.value = true
      try {
        quickView.value = await fetchCatalogServiceQuickView(serviceId, { scope: datasetScope.value })
      } catch (error) {
        console.error('Failed to load service quick view:', error)
        message.error('加载服务摘要失败')
      } finally {
        quickViewLoading.value = false
      }
    }

    const openServiceDetail = (serviceId: string) => {
      router.push({
        path: `/home/services/${serviceId}`,
        query: { timeRange: timeStore.timeRange, scope: datasetScope.value }
      })
    }

    const openServiceRoute = (path: string, serviceId: string, queryKey = 'serviceId') => {
      router.push({
        path,
        query: { [queryKey]: serviceId, timeRange: timeStore.timeRange, scope: datasetScope.value }
      })
    }

    const displayMetric = (value: number | null | undefined, suffix = '') =>
      typeof value === 'number' ? `${value}${suffix}` : '未知'

    const columns = [
      { title: '服务名', key: 'name' },
      {
        title: 'Owner',
        key: 'owner',
        render: (row: ServiceItem) => (
          <span
            class="service-catalog-page__link-button"
            onClick={(e) => {
              e.stopPropagation()
              selectedOwner.value = row.owner || ''
            }}>
            {row.owner || '-'}
          </span>
        )
      },
      { title: '团队', key: 'team', render: (row: ServiceItem) => (row as any).team || '-' },
      { title: '环境', key: 'env', render: (row: ServiceItem) => (row as any).env || '-' },
      { title: '区域', key: 'region', render: (row: ServiceItem) => row.region || '-' },
      {
        title: '健康状态',
        key: 'health',
        render: (row: any) => <ServiceHealthBadge status={row.health} size="sm" />
      },
      {
        title: '实例数',
        key: 'instances',
        render: (row: any) => (typeof row.instances === 'number' ? row.instances : '未知')
      },
      { title: 'QPS', key: 'qps', render: (row: any) => (typeof row.qps === 'number' ? row.qps : '未知') },
      {
        title: '错误率',
        key: 'errorRate',
        render: (row: any) => (typeof row.errorRate === 'number' ? `${row.errorRate}%` : '未知')
      },
      {
        title: 'P95',
        key: 'latency',
        render: (row: any) => (typeof row.latency === 'number' ? `${row.latency}ms` : '未知')
      },
      {
        title: '告警',
        key: 'alerts',
        render: (row: any) => (typeof row.activeIncidentCount === 'number' ? row.activeIncidentCount : '未知')
      },
      { title: '最近部署', key: 'lastDeploy', render: (row: ServiceItem) => row.lastDeploy || '-' },
      {
        title: '操作',
        key: 'actions',
        render: (row: any) => (
          <div class="service-catalog-page__meta-group">
            <NButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                openQuickView(row.id)
              }}>
              快速查看
            </NButton>
            <NButton
              size="small"
              secondary
              onClick={(e) => {
                e.stopPropagation()
                openServiceRoute('/home/services/topology', row.id, 'focus')
              }}>
              拓扑
            </NButton>
            <NButton
              size="small"
              secondary
              onClick={(e) => {
                e.stopPropagation()
                openServiceRoute('/home/investigate/traces', row.id)
              }}>
              Traces
            </NButton>
            <NButton
              size="small"
              secondary
              onClick={(e) => {
                e.stopPropagation()
                openServiceRoute('/home/investigate/logs', row.id, 'service')
              }}>
              Logs
            </NButton>
            <NButton size="small" secondary type="primary" onClick={() => openServiceDetail(row.id)}>
              查看详情
            </NButton>
          </div>
        )
      }
    ]

    onMounted(() => {
      if (route.query.timeRange && typeof route.query.timeRange === 'string') {
        timeStore.setTimeRange(route.query.timeRange as any)
      }
      loadServices()
    })

    watch(
      () => [
        scopeValue.value.service,
        scopeValue.value.env,
        scopeValue.value.region,
        query.value,
        selectedStatus.value,
        selectedEnv.value,
        selectedTeam.value,
        selectedOwner.value,
        selectedTag.value,
        sortBy.value
      ],
      () => {
        applyRowFiltersAndSort()
      }
    )

    watch(
      () => timeStore.timeRange,
      () => {
        loadServices()
      }
    )

    watch(
      () => datasetScope.value,
      () => {
        loadServices()
      }
    )

    return () => (
      <div class="service-catalog-page">
        <PageHeader title="服务目录" subtitle="查看服务清单、健康状态与常用排查入口">
          {{
            actions: () => (
              <NButton secondary type="primary" onClick={loadServices}>
                刷新目录
              </NButton>
            )
          }}
        </PageHeader>

        <TimeRangeBar
          value={timeStore.timeRange}
          live={timeStore.isLive}
          options={timeStore.timeOptions as any}
          onUpdate:value={(range: any) => {
            timeStore.setTimeRange(range)
            loadServices()
          }}
          onUpdate:live={(value: boolean) => {
            timeStore.isLive = value
            if (value) timeStore.refreshTime()
            loadServices()
          }}
          onRefresh={() => {
            timeStore.refreshTime()
            loadServices()
          }}
        />

        <ScopeBar
          value={scopeValue.value}
          options={scopeOptions.value as any}
          mode="global"
          onUpdate:value={(value: any) => {
            scopeValue.value = value
            applyRowFiltersAndSort()
          }}
        />

        <NGrid cols={5} xGap={16} yGap={16} class="service-catalog-page__summary-grid">
          {[
            { label: '总服务数', value: summary.value.total },
            { label: '健康', value: summary.value.healthy },
            { label: '轻微异常', value: summary.value.degraded },
            { label: '严重异常', value: summary.value.critical },
            { label: '已静音', value: summary.value.muted }
          ].map((item) => (
            <NGridItem key={item.label}>
              <NCard bordered={false} class="service-catalog-page__summary-card">
                <NStatistic label={item.label} value={displayMetric(item.value)} />
              </NCard>
            </NGridItem>
          ))}
        </NGrid>

        <div class="service-catalog-page__filters">
          <NInput
            v-model:value={query.value}
            placeholder="搜索服务 / Owner / Team / Tag"
            clearable
            class="service-catalog-page__search"
          />
          <NSelect
            v-model:value={selectedStatus.value}
            options={[
              { label: '全部状态', value: '' },
              { label: '健康', value: 'healthy' },
              { label: '轻微异常', value: 'degraded' },
              { label: '严重异常', value: 'critical' }
            ]}
            class="service-catalog-page__select"
          />
          <NSelect v-model:value={selectedEnv.value} options={envOptions.value} class="service-catalog-page__select" />
          <NSelect
            v-model:value={selectedTeam.value}
            options={teamOptions.value}
            class="service-catalog-page__select"
          />
          <NSelect
            v-model:value={sortBy.value}
            options={[
              { label: '按名称', value: 'name' },
              { label: '按 QPS', value: 'qps' },
              { label: '按错误率', value: 'errorRate' },
              { label: '按 P95', value: 'latency' },
              { label: '按最近部署', value: 'lastDeploy' }
            ]}
            class="service-catalog-page__select"
          />
          <NSpace>
            <NButton
              type={viewMode.value === 'table' ? 'primary' : 'default'}
              onClick={() => (viewMode.value = 'table')}>
              表格
            </NButton>
            <NButton type={viewMode.value === 'card' ? 'primary' : 'default'} onClick={() => (viewMode.value = 'card')}>
              卡片
            </NButton>
            <NButton type="primary" onClick={loadServices}>
              搜索
            </NButton>
            <NButton
              secondary
              onClick={() => {
                query.value = ''
                selectedStatus.value = ''
                selectedEnv.value = ''
                selectedTeam.value = ''
                selectedOwner.value = ''
                selectedTag.value = ''
                scopeValue.value = { service: null, env: null, region: null }
                sortBy.value = 'name'
                loadServices()
              }}>
              重置
            </NButton>
          </NSpace>
        </div>

        {activeFilterChips.value.length > 0 && (
          <div class="service-catalog-page__chips">
            {activeFilterChips.value.map((chip) => (
              <NTag closable bordered={false} onClose={() => clearFilterChip(chip.key)}>
                {chip.label}
              </NTag>
            ))}
          </div>
        )}

        {loadError.value && !loading.value ? (
          <NEmpty description={loadError.value} class="service-catalog-page__empty-state">
            {{
              extra: () => (
                <NButton type="primary" secondary onClick={loadServices}>
                  重试加载
                </NButton>
              )
            }}
          </NEmpty>
        ) : rows.value.length === 0 && !loading.value ? (
          <NEmpty description="暂无服务数据" class="service-catalog-page__empty-state" />
        ) : viewMode.value === 'table' ? (
          <ResultTable
            columns={columns as any}
            data={rows.value as any}
            loading={loading.value}
            rowKey="id"
            rowProps={(row: any) => ({
              onClick: () => openServiceDetail(row.id)
            })}
          />
        ) : (
          <div class="service-catalog-page__card-grid">
            {rows.value.map((row) => (
              <div class="service-catalog-page__card-wrap" key={row.id} onClick={() => openServiceDetail(row.id)}>
                <NCard bordered={false} class="service-catalog-page__card">
                  <div class="service-catalog-page__card-header">
                    <div>
                      <div class="service-catalog-page__card-title">{row.name}</div>
                      <div class="service-catalog-page__card-meta">
                        Owner：{row.owner || '-'} · Team：{(row as any).team || '-'} · Env：{(row as any).env || '-'} ·
                        Region：{row.region || '-'}
                      </div>
                    </div>
                    <ServiceHealthBadge status={(row.health as any) || 'unknown'} size="sm" />
                  </div>
                  <div class="service-catalog-page__card-stats">
                    <div>实例数：{typeof row.instances === 'number' ? row.instances : '未知'}</div>
                    <div>QPS：{typeof row.qps === 'number' ? row.qps : '未知'}</div>
                    <div>错误率：{typeof row.errorRate === 'number' ? `${row.errorRate}%` : '未知'}</div>
                    <div>P95：{typeof row.latency === 'number' ? `${row.latency}ms` : '未知'}</div>
                    <div>最近部署：{row.lastDeploy || '-'}</div>
                  </div>
                  <div class="service-catalog-page__card-tags">
                    {row.tags?.map((tag) => (
                      <button
                        class="service-catalog-page__tag-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          selectedTag.value = tag
                        }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div class="service-catalog-page__card-actions">
                    <NButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        openQuickView(row.id)
                      }}>
                      快速查看
                    </NButton>
                    <NButton
                      size="small"
                      secondary
                      onClick={(e) => {
                        e.stopPropagation()
                        openServiceRoute('/home/services/topology', row.id, 'focus')
                      }}>
                      拓扑
                    </NButton>
                    <NButton
                      size="small"
                      secondary
                      onClick={(e) => {
                        e.stopPropagation()
                        openServiceRoute('/home/investigate/traces', row.id)
                      }}>
                      Traces
                    </NButton>
                    <NButton
                      size="small"
                      secondary
                      onClick={(e) => {
                        e.stopPropagation()
                        openServiceRoute('/home/investigate/logs', row.id, 'service')
                      }}>
                      Logs
                    </NButton>
                    <NButton
                      size="small"
                      secondary
                      type="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        openServiceDetail(row.id)
                      }}>
                      查看详情
                    </NButton>
                  </div>
                </NCard>
              </div>
            ))}
          </div>
        )}

        <DetailDrawer
          show={quickViewVisible.value}
          title={quickView.value?.identity?.displayName || quickView.value?.identity?.name || '服务摘要'}
          width="md"
          onUpdate:show={(value: boolean) => {
            quickViewVisible.value = value
          }}
          onClose={() => {
            quickView.value = null
          }}>
          {quickViewLoading.value ? (
            <div class="service-catalog-page__quick-loading">
              <NSpin size="large" />
            </div>
          ) : quickView.value ? (
            <div class="service-catalog-page__quick-panel">
              <div class="service-catalog-page__quick-hero">
                <div class="service-catalog-page__quick-hero-title">
                  {quickView.value.identity?.displayName || quickView.value.identity?.name}
                </div>
                <div class="service-catalog-page__quick-hero-meta">
                  Owner：{quickView.value.identity?.owner || '-'} · Region：{quickView.value.identity?.region || '-'} ·
                  Runtime：{quickView.value.identity?.runtime || '-'}
                </div>
              </div>
              <div class="service-catalog-page__quick-stats">
                <div class="service-catalog-page__quick-stat">
                  <div class="service-catalog-page__quick-stat-label">QPS</div>
                  <div class="service-catalog-page__quick-stat-value">
                    {typeof quickView.value.redSummary?.qps === 'number' ? quickView.value.redSummary.qps : '未知'}
                  </div>
                </div>
                <div class="service-catalog-page__quick-stat">
                  <div class="service-catalog-page__quick-stat-label">错误率</div>
                  <div class="service-catalog-page__quick-stat-value">
                    {typeof quickView.value.redSummary?.errorRate === 'number'
                      ? `${quickView.value.redSummary.errorRate}%`
                      : '未知'}
                  </div>
                </div>
                <div class="service-catalog-page__quick-stat">
                  <div class="service-catalog-page__quick-stat-label">P95 延迟</div>
                  <div class="service-catalog-page__quick-stat-value">
                    {typeof quickView.value.redSummary?.p95Latency === 'number'
                      ? `${quickView.value.redSummary.p95Latency}ms`
                      : '未知'}
                  </div>
                </div>
                <div class="service-catalog-page__quick-stat">
                  <div class="service-catalog-page__quick-stat-label">实例数</div>
                  <div class="service-catalog-page__quick-stat-value">
                    {typeof quickView.value.instanceCount === 'number' ? quickView.value.instanceCount : '未知'}
                  </div>
                </div>
              </div>
              <div class="service-catalog-page__quick-footer">
                活跃事件：
                {typeof quickView.value.activeIncidentCount === 'number' ? quickView.value.activeIncidentCount : '未知'}
              </div>
            </div>
          ) : (
            <NEmpty description="暂无服务摘要" class="service-catalog-page__empty-state" />
          )}
        </DetailDrawer>
      </div>
    )
  }
})
