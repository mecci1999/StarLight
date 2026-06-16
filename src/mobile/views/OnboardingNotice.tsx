import { defineComponent } from 'vue'
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import * as api from '@/api'
import { getStoredUserInfo, persistStoredUserInfo } from '@/services/authSession'

export default defineComponent({
  name: 'MobileOnboardingNotice',
  setup() {
    const router = useRouter()

    const handleContinue = async () => {
      const storedUser = getStoredUserInfo()
      if (storedUser?.userId) {
        try {
          const userInfo = await api.getUserInfo(storedUser.userId)
          const nextUser = {
            ...storedUser,
            ...userInfo,
            isAdmin:
              typeof (userInfo as any)?.isAdmin === 'boolean' ? (userInfo as any).isAdmin : Boolean(storedUser.isAdmin)
          }
          persistStoredUserInfo(nextUser)
          if ((nextUser as any)?.isOnboardingCompleted) {
            router.push('/mobile/home')
            return
          }
        } catch (error) {
          console.warn('Failed to refresh onboarding state for mobile notice:', error)
        }
      }

      router.push('/login')
    }

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
          description="星光移动端仅提供监控数据查看功能。为了获得完整体验并完成微服务系统接入，请在电脑端登录星光。">
          {{
            footer: () => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: '#999' }}>已在电脑端完成接入？</p>
                <NButton type="primary" onClick={handleContinue}>
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
