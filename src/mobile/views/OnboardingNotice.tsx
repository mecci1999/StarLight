import { defineComponent } from 'vue'
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'MobileOnboardingNotice',
  setup() {
    const router = useRouter()

    return () => (
      <div
        style={{
          padding: '40px 20px',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f7fa'
        }}>
        <NResult
          status="info"
          title="请前往电脑端接入"
          description="StarLight 移动端仅提供监控数据查看功能。为了获得完整体验并完成微服务系统接入，请在电脑端登录 StarLight。">
          {{
            footer: () => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: '#999' }}>已在电脑端完成接入？</p>
                <NButton type="primary" onClick={() => router.push('/mobile/home')}>
                  我已完成接入，进入首页
                </NButton>
              </div>
            )
          }}
        </NResult>
      </div>
    )
  }
})
