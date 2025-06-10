import {
  NCard,
  NGrid,
  NGridItem,
  NButton,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NCheckbox
} from 'naive-ui'
import { ref } from 'vue'

export default defineComponent({
  name: 'CustomDashboard',
  setup() {
    const showAddModal = ref(false)
    const dashboardName = ref('')
    const selectedWidgets = ref<string[]>([])

    const widgetOptions = [
      { label: 'CPU使用率', value: 'cpu' },
      { label: '内存使用率', value: 'memory' },
      { label: 'QPS统计', value: 'qps' },
      { label: '响应时间', value: 'response-time' },
      { label: '错误率', value: 'error-rate' },
      { label: '活跃连接数', value: 'connections' },
      { label: '服务状态', value: 'service-status' },
      { label: '告警统计', value: 'alerts' }
    ]

    // 模拟组件
    const CPUWidget = () => (
      <div class="h-200px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">💻 CPU使用率</div>
          <div class="text-24px font-600 text-[--color-primary]">45%</div>
        </div>
      </div>
    )

    const MemoryWidget = () => (
      <div class="h-200px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">🧠 内存使用率</div>
          <div class="text-24px font-600 text-[--color-warning]">62%</div>
        </div>
      </div>
    )

    const QPSWidget = () => (
      <div class="h-200px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">⚡ QPS</div>
          <div class="text-24px font-600 text-[--color-success]">1,250</div>
        </div>
      </div>
    )

    const ResponseTimeWidget = () => (
      <div class="h-200px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">⏱️ 响应时间</div>
          <div class="text-24px font-600 text-[--color-info]">85ms</div>
        </div>
      </div>
    )

    const ErrorRateWidget = () => (
      <div class="h-200px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">❌ 错误率</div>
          <div class="text-24px font-600 text-[--color-error]">0.5%</div>
        </div>
      </div>
    )

    const ServiceStatusWidget = () => (
      <div class="h-200px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">🔧 服务状态</div>
          <div class="text-14px">
            <div class="text-[--color-success]">✅ 运行中: 8</div>
            <div class="text-[--color-error]">❌ 异常: 1</div>
          </div>
        </div>
      </div>
    )

    const AlertsWidget = () => (
      <div class="h-200px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">🚨 告警统计</div>
          <div class="text-14px">
            <div class="text-[--color-error]">严重: 2</div>
            <div class="text-[--color-warning]">警告: 5</div>
          </div>
        </div>
      </div>
    )

    const ConnectionsWidget = () => (
      <div class="h-200px bg-[--color-bg-2] rounded-8px flex items-center justify-center">
        <div class="text-center">
          <div class="text-16px text-[--color-text-2] mb-8px">🔗 活跃连接</div>
          <div class="text-24px font-600 text-[--color-info]">342</div>
        </div>
      </div>
    )

    const renderWidget = (type: string) => {
      switch (type) {
        case 'cpu':
          return <CPUWidget />
        case 'memory':
          return <MemoryWidget />
        case 'qps':
          return <QPSWidget />
        case 'response-time':
          return <ResponseTimeWidget />
        case 'error-rate':
          return <ErrorRateWidget />
        case 'service-status':
          return <ServiceStatusWidget />
        case 'alerts':
          return <AlertsWidget />
        case 'connections':
          return <ConnectionsWidget />
        default:
          return null
      }
    }

    const handleAddDashboard = () => {
      showAddModal.value = false
      dashboardName.value = ''
      selectedWidgets.value = []
    }

    return () => (
      <div class="p-24px h-full">
        <div class="mb-16px">
          <h1 class="text-20px font-600 text-[--color-text-1] m-0">自定义看板</h1>
          <p class="text-14px text-[--color-text-3] mt-8px mb-0">支持自定义拖拽不同图表组成一个总览面板</p>
        </div>

        {/* 控制面板 */}
        <NCard class="mb-16px">
          <NSpace>
            <NButton type="primary" onClick={() => (showAddModal.value = true)}>
              + 添加看板
            </NButton>
            <NButton>编辑布局</NButton>
            <NButton>保存配置</NButton>
            <NButton>重置布局</NButton>
          </NSpace>
        </NCard>

        {/* 看板网格 */}
        <NGrid cols={4} xGap={16} yGap={16}>
          <NGridItem>
            <NCard title="CPU使用率" headerStyle={{ padding: '12px 16px' }}>
              <CPUWidget />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard title="内存使用率" headerStyle={{ padding: '12px 16px' }}>
              <MemoryWidget />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard title="QPS统计" headerStyle={{ padding: '12px 16px' }}>
              <QPSWidget />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard title="响应时间" headerStyle={{ padding: '12px 16px' }}>
              <ResponseTimeWidget />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard title="错误率" headerStyle={{ padding: '12px 16px' }}>
              <ErrorRateWidget />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard title="服务状态" headerStyle={{ padding: '12px 16px' }}>
              <ServiceStatusWidget />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard title="告警统计" headerStyle={{ padding: '12px 16px' }}>
              <AlertsWidget />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard title="活跃连接" headerStyle={{ padding: '12px 16px' }}>
              <ConnectionsWidget />
            </NCard>
          </NGridItem>
        </NGrid>

        {/* 添加看板模态框 */}
        <NModal v-model:show={showAddModal.value} preset="dialog" title="添加自定义看板">
          <NForm>
            <NFormItem label="看板名称">
              <NInput v-model:value={dashboardName.value} placeholder="请输入看板名称" />
            </NFormItem>
            <NFormItem label="选择组件">
              <div class="grid grid-cols-2 gap-8px">
                {widgetOptions.map((option) => (
                  <NCheckbox
                    key={option.value}
                    value={option.value}
                    checked={selectedWidgets.value.includes(option.value)}
                    onUpdate:checked={(checked: boolean) => {
                      if (checked) {
                        selectedWidgets.value.push(option.value)
                      } else {
                        const index = selectedWidgets.value.indexOf(option.value)
                        if (index > -1) {
                          selectedWidgets.value.splice(index, 1)
                        }
                      }
                    }}>
                    {option.label}
                  </NCheckbox>
                ))}
              </div>
            </NFormItem>
          </NForm>
          <div class="flex justify-end gap-8px mt-16px">
            <NButton onClick={() => (showAddModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={handleAddDashboard}>
              确定
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
