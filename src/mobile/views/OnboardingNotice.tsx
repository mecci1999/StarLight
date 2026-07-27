import { defineComponent } from 'vue'
import { Button } from 'vant'
import { PhDesktop } from '@phosphor-icons/vue'
import { useRouter } from 'vue-router'
import * as api from '@/api'
import { getStoredUserInfo, persistStoredUserInfo } from '@/services/authSession'
import type { UserInfoType } from '@/types/userInfo'
import './OnboardingNotice.scss'

export default defineComponent({
  name: 'MobileOnboardingNotice',
  setup() {
    const router = useRouter()
    const continuing = ref(false)

    const handleContinue = async () => {
      if (continuing.value) return
      continuing.value = true
      const storedUser = getStoredUserInfo()
      try {
        if (storedUser?.userId) {
          const userInfo = await api.getUserInfo(storedUser.userId)
          const isAdmin = typeof userInfo.isAdmin === 'boolean' ? userInfo.isAdmin : Boolean(storedUser.isAdmin)
          const nextUser: UserInfoType = {
            ...storedUser,
            ...userInfo,
            isAdmin
          }
          persistStoredUserInfo(nextUser)
          if (nextUser.isOnboardingCompleted) {
            router.push('/mobile/home')
            return
          }
        }
      } catch (error) {
        console.warn('Failed to refresh onboarding state for mobile notice:', error)
      } finally {
        continuing.value = false
      }

      router.push('/login')
    }

    return () => (
      <div class="mobile-onboarding-notice">
        <section class="mobile-onboarding-notice__card" aria-labelledby="mobile-onboarding-title">
          <div class="mobile-onboarding-notice__icon" aria-hidden="true">
            <PhDesktop size={28} />
          </div>
          <h1 id="mobile-onboarding-title" class="mobile-onboarding-notice__title">
            请前往电脑端接入
          </h1>
          <p class="mobile-onboarding-notice__description">
            星光移动端仅提供监控数据查看功能。为了获得完整体验并完成微服务系统接入，请在电脑端登录星光。
          </p>
          <div class="mobile-onboarding-notice__footer">
            <p class="mobile-onboarding-notice__hint">已在电脑端完成接入？</p>
            <Button
              type="primary"
              block
              loading={continuing.value}
              disabled={continuing.value}
              onClick={handleContinue}>
              我已完成接入，进入首页
            </Button>
          </div>
        </section>
      </div>
    )
  }
})
