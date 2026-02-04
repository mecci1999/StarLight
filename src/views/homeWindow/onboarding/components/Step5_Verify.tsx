import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import StepLayout from './StepLayout'
import { NResult, NButton, NSpin, NIcon } from 'naive-ui'
import { CheckmarkCircle, WarningOutline } from '@vicons/ionicons5'

import { fetchRealtimeMetrics } from '@/api'

export default defineComponent({
  name: 'Step5_Verify',
  emits: ['finish'],
  setup(props, { emit }) {
    const status = ref<'waiting' | 'success' | 'timeout'>('waiting')
    const timer = ref<any>(null)
    const retryCount = ref(0)

    // Check if real data is coming in
    const pollForData = async () => {
      try {
        // Use an AppKey if available, or check general health
        const appKey = localStorage.getItem('starlight_app_key')
        if (appKey) {
          const res = await fetchRealtimeMetrics(appKey)
          // If we get valid numbers > 0, consider it a success
          if (res && (res.qps > 0 || res.cpu > 0 || res.activeInstances > 0)) {
            return true
          }
        }
        return false
      } catch (e) {
        return false
      }
    }

    const startVerification = async () => {
      status.value = 'waiting'
      retryCount.value = 0

      const maxRetries = 30 // 30 seconds timeout for real usage
      let currentTry = 0

      if (timer.value) clearInterval(timer.value)

      timer.value = setInterval(async () => {
        currentTry++
        const received = await pollForData()

        if (received) {
          status.value = 'success'
          clearInterval(timer.value)
        } else if (currentTry >= maxRetries) {
          status.value = 'timeout'
          clearInterval(timer.value)
        }
      }, 1000)
    }

    onMounted(() => {
      startVerification()
    })

    onUnmounted(() => {
      if (timer.value) clearInterval(timer.value)
    })

    const handleFinish = () => {
      emit('finish')
    }

    return () => (
      <StepLayout title="验证连接" description="正在等待您的服务上报第一条数据...">
        {{
          guide: () => (
            <div>
              <p>请确保您已启动服务并产生了一些流量（如访问几个页面或调用几个 API）。</p>
              <p>数据上报通常有 10-30 秒的延迟。</p>
            </div>
          ),
          default: () => (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {status.value === 'waiting' && (
                <div style={{ textAlign: 'center' }}>
                  <NSpin size="large" />
                  <p style={{ marginTop: '20px', color: 'var(--color-text-2)', cursor: 'default', userSelect: 'none' }}>
                    正在监听数据上报...
                  </p>
                  <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-3)' }}>请保持此页面打开</p>
                </div>
              )}

              {status.value === 'success' && (
                <NResult
                  status="success"
                  title="接入成功！"
                  description="我们已收到您的服务数据。"
                  style={{ maxWidth: '400px' }}>
                  {{
                    footer: () => (
                      <div class="flex flex-col items-center gap-4">
                        <NButton type="primary" size="large" onClick={handleFinish}>
                          进入仪表盘
                        </NButton>
                      </div>
                    )
                  }}
                </NResult>
              )}

              {status.value === 'timeout' && (
                <NResult
                  status="warning"
                  title="暂未收到数据"
                  description="可能是网络延迟或配置有误。"
                  style={{ maxWidth: '400px' }}>
                  {{
                    footer: () => (
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <NButton onClick={startVerification} icon-placement="right">
                          重试
                        </NButton>
                        <NButton secondary type="primary" onClick={handleFinish}>
                          跳过验证，稍后检查
                        </NButton>
                      </div>
                    )
                  }}
                </NResult>
              )}
            </div>
          )
        }}
      </StepLayout>
    )
  }
})
