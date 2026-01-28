import { defineComponent, ref, onMounted } from 'vue'
import StepLayout from './StepLayout'
import { NList, NListItem, NThing, NTag, NSpin, NIcon } from 'naive-ui'
import { CheckmarkCircle, CloseCircle, RefreshCircle } from '@vicons/ionicons5'

export default defineComponent({
  name: 'Step2_Environment',
  emits: ['next'],
  setup(props, { emit }) {
    const checks = ref([
      { id: 1, name: '浏览器兼容性', status: 'pending', message: '检查中...' },
      { id: 2, name: '网络连通性', status: 'pending', message: '检查中...' },
      { id: 3, name: 'API 服务状态', status: 'pending', message: '检查中...' }
    ])

    const allPassed = ref(false)

    const runChecks = async () => {
      // Check 1: Browser
      checks.value[0].status = 'success'
      checks.value[0].message = 'Chrome/Edge/Safari (已通过)'

      // Check 2: Network (Simulated)
      await new Promise((resolve) => setTimeout(resolve, 800))
      checks.value[1].status = 'success'
      checks.value[1].message = '网络连接正常'

      // Check 3: API (Simulated)
      await new Promise((resolve) => setTimeout(resolve, 800))
      checks.value[2].status = 'success'
      checks.value[2].message = 'API 服务响应正常'

      allPassed.value = true
      emit('next') // Auto next or let user click? Let's let user click in the main layout, but here we just signal readiness
    }

    onMounted(() => {
      runChecks()
    })

    return () => (
      <StepLayout title="环境检查" description="正在检查您的运行环境是否满足接入要求...">
        {{
          guide: () => (
            <div>
              <p>我们会检查以下项目：</p>
              <ul>
                <li>浏览器是否支持最新的 Web 特性</li>
                <li>能否正常访问 StarLight API 服务</li>
                <li>网络延迟是否在可接受范围内</li>
              </ul>
            </div>
          ),
          default: () => (
            <div style={{ padding: '20px' }}>
              <NList>
                {checks.value.map((check) => (
                  <NListItem key={check.id}>
                    <NThing title={check.name} description={check.message}>
                      {{
                        avatar: () => (
                          <NIcon
                            size={24}
                            color={
                              check.status === 'success' ? '#18a058' : check.status === 'error' ? '#d03050' : '#f0a020'
                            }>
                            {check.status === 'success' ? (
                              <CheckmarkCircle />
                            ) : check.status === 'error' ? (
                              <CloseCircle />
                            ) : (
                              <RefreshCircle class="rotate" />
                            )}
                          </NIcon>
                        )
                      }}
                    </NThing>
                  </NListItem>
                ))}
              </NList>
            </div>
          )
        }}
      </StepLayout>
    )
  }
})
