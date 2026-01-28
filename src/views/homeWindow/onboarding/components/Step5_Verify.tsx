import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import StepLayout from './StepLayout'
import { NResult, NButton, NSpin } from 'naive-ui'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'Step5_Verify',
  emits: ['finish'],
  setup(props, { emit }) {
    const router = useRouter()
    const status = ref<'waiting' | 'success' | 'timeout'>('waiting')
    const timer = ref<any>(null)

    const startVerification = () => {
      status.value = 'waiting'
      // Simulate waiting for data
      timer.value = setTimeout(() => {
        status.value = 'success'
      }, 3000)
    }

    onMounted(() => {
      startVerification()
    })

    onUnmounted(() => {
      if (timer.value) clearTimeout(timer.value)
    })

    const handleFinish = () => {
      emit('finish')
    }

    return () => (
      <StepLayout title="验证连接" description="正在等待您的服务上报第一条数据...">
        {{
          guide: () => (
            <div>
              <p>通常需要 1-2 分钟。请确保您的服务已启动并产生流量。</p>
            </div>
          ),
          default: () => (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {status.value === 'waiting' && (
                <div style={{ textAlign: 'center' }}>
                  <NSpin size="large" />
                  <p style={{ marginTop: '20px', color: '#666' }}>正在监听数据上报...</p>
                </div>
              )}

              {status.value === 'success' && (
                <NResult status="success" title="接入成功！" description="我们已收到您的服务数据。">
                  {{
                    footer: () => (
                      <NButton type="primary" onClick={handleFinish}>
                        进入仪表盘
                      </NButton>
                    )
                  }}
                </NResult>
              )}

              {status.value === 'timeout' && (
                <NResult status="warning" title="暂未收到数据" description="请检查您的配置或网络连接。">
                  {{
                    footer: () => (
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <NButton onClick={startVerification}>重试</NButton>
                        <NButton type="primary" ghost onClick={handleFinish}>
                          跳过验证
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
