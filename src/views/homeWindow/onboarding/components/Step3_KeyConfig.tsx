import { defineComponent, ref } from 'vue'
import StepLayout from './StepLayout'
import { NInput, NInputGroup, NButton, NIcon, useMessage } from 'naive-ui'
import { CopyOutline, RefreshOutline } from '@vicons/ionicons5'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

export default defineComponent({
  name: 'Step3_KeyConfig',
  emits: ['next'],
  setup(props, { emit }) {
    const message = useMessage()
    // Mock AppKey
    const appKey = ref('sl_live_7a8b9c0d1e2f3g4h5i6j7k8l9m0n')

    const copyKey = async () => {
      try {
        await writeText(appKey.value)
        message.success('AppKey 已复制到剪贴板')
      } catch (err) {
        message.error('复制失败')
      }
    }

    const regenerateKey = () => {
      message.warning('生成新 Key 会导致旧 Key 失效，当前仅为演示')
    }

    return () => (
      <StepLayout title="配置凭证" description="AppKey 是您的服务接入 StarLight 的唯一凭证，请妥善保管。">
        {{
          guide: () => (
            <div>
              <p>请将此 Key 配置到您的 SDK 初始化代码或 Agent 配置文件中。</p>
              <p style={{ color: '#d03050', fontWeight: 'bold' }}>注意：不要将 AppKey 泄露给未授权的第三方。</p>
            </div>
          ),
          default: () => (
            <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div class="key-display">
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Your AppKey</label>
                <NInputGroup>
                  <NInput value={appKey.value} readonly style={{ flex: 1, fontFamily: 'monospace' }} />
                  <NButton type="primary" ghost onClick={copyKey}>
                    {{
                      icon: () => (
                        <NIcon>
                          <CopyOutline />
                        </NIcon>
                      )
                    }}
                  </NButton>
                  <NButton secondary type="warning" onClick={regenerateKey}>
                    {{
                      icon: () => (
                        <NIcon>
                          <RefreshOutline />
                        </NIcon>
                      )
                    }}
                  </NButton>
                </NInputGroup>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                <NButton type="primary" onClick={() => emit('next')}>
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
