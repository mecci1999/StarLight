import { defineComponent, ref, onMounted } from 'vue'
import StepLayout from './StepLayout'
import { NInput, NInputGroup, NButton, NIcon, useMessage, NAlert } from 'naive-ui'
import { CopyOutline, RefreshOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { generateAppKey } from '@/api/metrics'

export default defineComponent({
  name: 'Step3_KeyConfig',
  emits: ['next', 'prev'],
  setup(props, { emit }) {
    const message = useMessage()
    const appKey = ref('')
    const appSecret = ref('')
    const isGenerating = ref(false)

    // Generate a random AppKey
    const generateKey = async () => {
      isGenerating.value = true
      try {
        const res = await generateAppKey({
          name: `Onboarding Key ${new Date().toLocaleDateString()}`,
          description: 'Created during onboarding process'
        })

        const content = res?.content || res?.data?.content || res
        const newKey = content?.appKey
        const newSecret = content?.appSecret
        if (newKey) {
          appKey.value = newKey
          appSecret.value = newSecret || ''
          localStorage.setItem('starlight_onboarding_appkey', newKey)
          if (newSecret) {
            localStorage.setItem('starlight_onboarding_appsecret', newSecret)
          }
          message.success('AppKey 生成成功')
        } else {
          console.error('Unexpected response structure:', res)
          message.error((res as any)?.message || '生成 AppKey 失败')
        }
      } catch (error) {
        console.error('Failed to generate AppKey:', error)
        message.error('生成 AppKey 失败，请检查网络或登录状态')
      } finally {
        isGenerating.value = false
      }
    }

    onMounted(() => {
      // Try to load existing key from storage or generate new one
      const savedKey = localStorage.getItem('starlight_onboarding_appkey')
      const savedSecret = localStorage.getItem('starlight_onboarding_appsecret')

      // Check if key exists and is valid (starts with ak_)
      // Old fake keys started with sl_live_
      const isValidKey = savedKey && savedKey.startsWith('ak_')

      if (isValidKey) {
        appKey.value = savedKey
        appSecret.value = savedSecret || ''
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
      window.$dialog.warning({
        title: '确认重新生成',
        content: '重新生成 AppKey 将导致旧 Key 立即失效。确定要继续吗？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          generateKey()
          message.success('新的 AppKey 已生成')
        }
      })
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
                  您的AppKey
                </label>
                <NInputGroup>
                  <NInput
                    value={appKey.value}
                    readonly
                    placeholder="生成中..."
                    loading={isGenerating.value}
                    style={{
                      flex: 1,
                      fontFamily: 'monospace',
                      color: 'var(--color-text-2)',
                      background: 'var(--color-fill-2)'
                    }}
                    inputProps={{
                      style: {
                        fontFamily: 'monospace',
                        color: 'var(--color-text-2)'
                      }
                    }}
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
                {appSecret.value ? (
                  <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-3)' }}>
                    * 已同步保存对应 AppSecret，验证步骤会自动使用它。
                  </p>
                ) : null}
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                <NButton onClick={() => emit('prev')}>上一步</NButton>
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
