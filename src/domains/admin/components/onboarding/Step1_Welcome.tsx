import { defineComponent } from 'vue'
import StepLayout from './StepLayout'
import { NResult, NButton } from 'naive-ui'

export default defineComponent({
  name: 'Step1_Welcome',
  emits: ['next'],
  setup(props, { emit }) {
    return () => (
      <StepLayout
        title="欢迎接入星光"
        description="只需几步，即可将您的微服务系统接入星光监控平台，享受全方位的可观测性体验。">
        {{
          guide: () => (
            <div>
              <h3>您将完成以下步骤：</h3>
              <ul>
                <li>环境兼容性检查</li>
                <li>获取接入凭证 (AppKey)</li>
                <li>配置您的微服务应用</li>
                <li>验证数据上报状态</li>
              </ul>
            </div>
          ),
          default: () => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <NResult
                status="success"
                title="准备就绪"
                description="我们将引导您完成整个接入流程"
                class="welcome-result">
                {{
                  footer: () => (
                    <NButton type="primary" size="large" onClick={() => emit('next')}>
                      开始接入
                    </NButton>
                  )
                }}
              </NResult>
            </div>
          )
        }}
      </StepLayout>
    )
  }
})
