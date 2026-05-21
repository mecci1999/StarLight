import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import StepLayout from './StepLayout'
import { NResult, NButton, NSpin, NIcon } from 'naive-ui'
import { CheckmarkCircle, WarningOutline } from '@vicons/ionicons5'

import { verifyAppKey } from '@/api'
import './Step5_Verify.scss'

export default defineComponent({
  name: 'Step5_Verify',
  emits: ['finish', 'prev'],
  setup(props, { emit }) {
    const status = ref<'waiting' | 'success' | 'timeout'>('waiting')
    const timer = ref<any>(null)
    const retryCount = ref(0)
    const appKey = ref('')
    const appSecret = ref('')

    // Verify the generated AppKey/AppSecret pair
    const pollForData = async () => {
      try {
        if (appKey.value && appSecret.value) {
          const res = await verifyAppKey({ appKey: appKey.value, appSecret: appSecret.value })
          return Boolean((res as any)?.valid)
        }
        return false
      } catch (e) {
        return false
      }
    }

    const startVerification = async () => {
      status.value = 'waiting'
      retryCount.value = 0
      appKey.value =
        localStorage.getItem('starlight_onboarding_appkey') || localStorage.getItem('starlight_app_key') || ''
      appSecret.value = localStorage.getItem('starlight_onboarding_appsecret') || ''

      if (!appKey.value || !appSecret.value) {
        status.value = 'timeout'
        return
      }

      const maxRetries = 18
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
      }, 5000)
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

    const handlePrev = () => {
      emit('prev')
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
            <div class="step5-verify">
              {!appKey.value && (
                <NResult
                  status="warning"
                  title="未检测到凭证"
                  description="请先完成凭证配置，或返回上一步重新生成 AppKey / AppSecret。"
                  style={{ maxWidth: '400px' }}>
                  {{
                    footer: () => (
                      <div class="step5-verify__footer">
                        <NButton onClick={handlePrev}>上一步</NButton>
                        <NButton secondary type="primary" onClick={handleFinish}>
                          跳过验证，稍后检查
                        </NButton>
                      </div>
                    )
                  }}
                </NResult>
              )}

              {appKey.value && status.value === 'waiting' && (
                <div class="step5-verify__waiting">
                  <NSpin size="large" />
                  <p class="step5-verify__waiting-text">正在监听数据上报...</p>
                  <p class="step5-verify__waiting-note">正在验证当前凭证是否已生效，请保持此页面打开</p>
                  <div class="step5-verify__waiting-actions">
                    <NButton onClick={handlePrev}>上一步</NButton>
                    <NButton secondary type="primary" onClick={handleFinish}>
                      跳过验证，稍后检查
                    </NButton>
                  </div>
                </div>
              )}

              {status.value === 'success' && (
                <NResult
                  status="success"
                  title="接入成功！"
                  description="当前 AppKey / AppSecret 已通过验证，可继续进入系统。"
                  style={{ maxWidth: '400px' }}>
                  {{
                    footer: () => (
                      <div class="step5-verify__footer">
                        <NButton onClick={handlePrev}>上一步</NButton>
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
                  title="凭证暂未通过验证"
                  description="可能是凭证尚未生效，或 AppKey / AppSecret 配置有误。"
                  style={{ maxWidth: '400px' }}>
                  {{
                    footer: () => (
                      <div class="step5-verify__timeout-actions">
                        <NButton onClick={handlePrev}>上一步</NButton>
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
