import { defineComponent, ref, onMounted } from 'vue'
import StepLayout from './StepLayout'
import { NList, NListItem, NThing, NTag, NSpin, NIcon, NButton } from 'naive-ui'
import { CheckmarkCircle, CloseCircle, RefreshCircle, RefreshOutline } from '@vicons/ionicons5'

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
    const isChecking = ref(false)

    const checkBrowser = () => {
      const ua = navigator.userAgent
      const isModern = /Chrome|Firefox|Safari|Edge/.test(ua) && !/MSIE|Trident/.test(ua)
      return {
        success: isModern,
        message: isModern ? `已通过 (${navigator.platform})` : '当前浏览器可能存在兼容性问题'
      }
    }

    const checkNetwork = async () => {
      return {
        success: navigator.onLine,
        message: navigator.onLine ? '网络连接正常' : '网络已断开'
      }
    }

    const checkApi = async () => {
      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          return { success: true, message: 'API 服务响应正常' }
        }
        return { success: false, message: '服务响应异常' }
      } catch (e) {
        return { success: false, message: '无法连接到服务器' }
      }
    }

    const runChecks = async () => {
      if (isChecking.value) return
      isChecking.value = true
      allPassed.value = false

      // Reset statuses
      checks.value.forEach((c) => {
        c.status = 'pending'
        c.message = '检查中...'
      })

      // Check 1: Browser
      await new Promise((r) => setTimeout(r, 500))
      const browserRes = checkBrowser()
      checks.value[0].status = browserRes.success ? 'success' : 'warning'
      checks.value[0].message = browserRes.message

      // Check 2: Network
      await new Promise((r) => setTimeout(r, 500))
      const networkRes = await checkNetwork()
      checks.value[1].status = networkRes.success ? 'success' : 'error'
      checks.value[1].message = networkRes.message

      // Check 3: API
      if (networkRes.success) {
        const apiRes = await checkApi()
        checks.value[2].status = apiRes.success ? 'success' : 'error'
        checks.value[2].message = apiRes.message
      } else {
        checks.value[2].status = 'error'
        checks.value[2].message = '网络不可用，跳过检查'
      }

      const hasError = checks.value.some((c) => c.status === 'error')
      allPassed.value = !hasError
      isChecking.value = false

      if (!hasError) {
        // Auto proceed after a short delay if all good?
        // Or let user read the result. User experience is better if they see the green ticks.
      }
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
                <li>浏览器是否支持最新的 Web 特性 (ES2015+)</li>
                <li>网络连接是否正常</li>
                <li>能否正常访问 StarLight API 服务</li>
              </ul>
              <div style={{ marginTop: '20px' }}>
                <p class="text-[--color-text-3] text-12px">如果遇到问题，请检查您的网络设置或联系管理员。</p>
              </div>
            </div>
          ),
          default: () => (
            <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <NList>
                {checks.value.map((check) => (
                  <NListItem key={check.id}>
                    <NThing title={check.name} description={check.message}>
                      {{
                        avatar: () => (
                          <div class="flex items-center justify-center h-full">
                            {check.status === 'pending' ? (
                              <NSpin size={20} />
                            ) : (
                              <NIcon
                                size={24}
                                color={
                                  check.status === 'success'
                                    ? 'var(--color-success-6)'
                                    : check.status === 'error'
                                      ? 'var(--color-danger-6)'
                                      : 'var(--color-warning-6)'
                                }>
                                {check.status === 'success' ? (
                                  <CheckmarkCircle />
                                ) : check.status === 'error' ? (
                                  <CloseCircle />
                                ) : (
                                  <RefreshCircle />
                                )}
                              </NIcon>
                            )}
                          </div>
                        )
                      }}
                    </NThing>
                  </NListItem>
                ))}
              </NList>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                {!allPassed && !isChecking.value && (
                  <NButton onClick={runChecks} icon-placement="right">
                    {{
                      icon: () => (
                        <NIcon>
                          <RefreshOutline />
                        </NIcon>
                      ),
                      default: () => '重新检查'
                    }}
                  </NButton>
                )}
                <NButton type="primary" disabled={!allPassed || isChecking.value} onClick={() => emit('next')}>
                  下一步
                </NButton>
              </div>
            </div>
          )
        }}
      </StepLayout>
    )
  }
})
