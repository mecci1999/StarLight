import { defineComponent, ref, onMounted } from 'vue'
import StepLayout from './StepLayout'
import { NInput, NInputGroup, NButton, NIcon, useMessage, NAlert } from 'naive-ui'
import { CopyOutline, RefreshOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

export default defineComponent({
  name: 'Step3_KeyConfig',
  emits: ['next'],
  setup(props, { emit }) {
    const message = useMessage()
    const appKey = ref('')
    const isGenerating = ref(false)

    // Generate a random AppKey
    const generateKey = () => {
      isGenerating.value = true
      // Simulate API delay
      setTimeout(() => {
        const randomPart = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        const newKey = `sl_live_${randomPart}`
        appKey.value = newKey

        // Persist for next step
        localStorage.setItem('starlight_onboarding_appkey', newKey)
        isGenerating.value = false
      }, 600)
    }

    onMounted(() => {
      // Try to load existing key from storage or generate new one
      const savedKey = localStorage.getItem('starlight_onboarding_appkey')
      if (savedKey) {
        appKey.value = savedKey
      } else {
        generateKey()
      }
    })

    const copyKey = async () => {
      try {
        await writeText(appKey.value)
        message.success('AppKey 已复制到剪贴板')
      } catch (err) {
        // Fallback for browser env if tauri plugin fails
        navigator.clipboard
          .writeText(appKey.value)
          .then(() => {
            message.success('AppKey 已复制到剪贴板')
          })
          .catch(() => {
            message.error('复制失败')
          })
      }
    }

    const handleRegenerate = () => {
      if (confirm('重新生成 AppKey 将导致旧 Key 立即失效。确定要继续吗？')) {
        generateKey()
        message.success('新的 AppKey 已生成')
      }
    }

    return () => (
      <StepLayout title="配置凭证" description="AppKey 是您的服务接入 StarLight 的唯一凭证，请妥善保管。">
        {{
          guide: () => (
            <div>
              <p>请将此 Key 配置到您的 SDK 初始化代码或 Agent 配置文件中。</p>
              <div style={{ marginTop: '20px' }}>
                <NAlert type="warning" showIcon>
                  注意：不要将 AppKey 泄露给未授权的第三方。如果 Key 泄露，请立即重新生成。
                </NAlert>
              </div>
            </div>
          ),
          default: () => (
            <div
              style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
              <div class="key-display">
                <label
                  style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-2)', fontSize: '14px' }}>
                  Your AppKey
                </label>
                <NInputGroup>
                  <NInput
                    value={appKey.value}
                    readonly
                    placeholder="Generating..."
                    loading={isGenerating.value}
                    style={{ flex: 1, fontFamily: 'monospace', color: 'var(--color-text-1)' }}
                  />
                  <NButton type="primary" ghost onClick={copyKey} disabled={!appKey.value}>
                    {{
                      icon: () => (
                        <NIcon>
                          <CopyOutline />
                        </NIcon>
                      ),
                      default: () => '复制'
                    }}
                  </NButton>
                  <NButton secondary type="warning" onClick={handleRegenerate} disabled={isGenerating.value}>
                    {{
                      icon: () => (
                        <NIcon>
                          <RefreshOutline />
                        </NIcon>
                      )
                    }}
                  </NButton>
                </NInputGroup>
                <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-3)' }}>
                  * 该 Key 仅用于本次接入向导，后续可在设置中管理
                </p>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                <NButton type="primary" size="large" onClick={() => emit('next')} disabled={!appKey.value}>
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
