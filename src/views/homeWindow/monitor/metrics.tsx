import { NCard, NGrid, NGridItem, NSelect, NDatePicker, NSpace, NButton, NTabs, NTabPane } from 'naive-ui'
import { ref } from 'vue'

export default defineComponent({
  name: 'MetricsAnalysis',
  setup() {
    const selectedService = ref('user-service')
    const dateRange = ref<[number, number] | null>(null)
    const activeTab = ref('trend')

    const serviceOptions = [
      { label: 'user-service', value: 'user-service' },
      { label: 'order-service', value: 'order-service' },
      { label: 'payment-service', value: 'payment-service' }
    ]

    // 模拟图表组件
    const TrendChart = () => (
      <div class="h-300px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">📈 趋势图表</div>
          <div class="text-14px text-[--color-text-3]">显示CPU、内存、QPS等指标的历史趋势</div>
        </div>
      </div>
    )

    const HeatmapChart = () => (
      <div class="h-300px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">🔥 热力图</div>
          <div class="text-14px text-[--color-text-3]">显示不同时间段的性能热力分布</div>
        </div>
      </div>
    )

    const ComparisonChart = () => (
      <div class="h-300px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">📊 对比分析</div>
          <div class="text-14px text-[--color-text-3]">多服务性能指标对比分析</div>
        </div>
      </div>
    )

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">指标分析</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">历史趋势图、热力图等可视化分析</p>
        </div>

        {/* 控制面板 */}
        <NCard class="mb-16px">
          <NSpace>
            <NSelect
              v-model:value={selectedService.value}
              options={serviceOptions}
              style={{ width: '200px' }}
              placeholder="选择服务"
            />
            <NDatePicker v-model:value={dateRange.value} type="datetimerange" clearable style={{ width: '300px' }} />
            <NButton type="primary">查询</NButton>
            <NButton>导出数据</NButton>
          </NSpace>
        </NCard>

        {/* 图表区域 */}
        <NCard>
          <NTabs v-model:value={activeTab.value} type="line">
            <NTabPane name="trend" tab="趋势分析">
              <NGrid cols={1} yGap={16}>
                <NGridItem>
                  <NCard title="CPU & 内存使用趋势">
                    <TrendChart />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="QPS & 响应时间趋势">
                    <TrendChart />
                  </NCard>
                </NGridItem>
              </NGrid>
            </NTabPane>

            <NTabPane name="heatmap" tab="热力图">
              <NGrid cols={2} xGap={16} yGap={16}>
                <NGridItem>
                  <NCard title="CPU使用率热力图">
                    <HeatmapChart />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="响应时间热力图">
                    <HeatmapChart />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="QPS热力图">
                    <HeatmapChart />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="错误率热力图">
                    <HeatmapChart />
                  </NCard>
                </NGridItem>
              </NGrid>
            </NTabPane>

            <NTabPane name="comparison" tab="对比分析">
              <NGrid cols={1} yGap={16}>
                <NGridItem>
                  <NCard title="多服务性能对比">
                    <ComparisonChart />
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="历史同期对比">
                    <ComparisonChart />
                  </NCard>
                </NGridItem>
              </NGrid>
            </NTabPane>
          </NTabs>
        </NCard>
      </div>
    )
  }
})
