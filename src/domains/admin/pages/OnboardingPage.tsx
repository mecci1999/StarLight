import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { NSteps, NStep, NButton, NIcon } from 'naive-ui'
import { RocketOutline } from '@vicons/ionicons5'
import { getStoredUserInfo, persistStoredUserInfo } from '@/services/authSession'
import * as api from '@/api'
import WindowActionBar from '@/components/WindowActionBar'
import Step1_Welcome from '@/domains/admin/components/onboarding/Step1_Welcome'
import Step2_Environment from '@/domains/admin/components/onboarding/Step2_Environment'
import Step3_KeyConfig from '@/domains/admin/components/onboarding/Step3_KeyConfig'
import Step4_Integration from '@/domains/admin/components/onboarding/Step4_Integration'
import Step5_Verify from '@/domains/admin/components/onboarding/Step5_Verify'
import './onboarding.scss'
import './OnboardingPageLocal.scss'

export default defineComponent({
  name: 'AdminOnboardingPage',
  setup() {
    const router = useRouter()
    const currentStep = ref(1)

    onMounted(async () => {
      try {
        const win = getCurrentWebviewWindow()
        await win.show()
        await win.setFocus()
      } catch (e) {
        console.warn('Failed to show window:', e)
      }
    })

    const nextStep = () => {
      if (currentStep.value < 5) currentStep.value++
    }

    const prevStep = () => {
      if (currentStep.value > 1) currentStep.value--
    }

    const finishOnboarding = async () => {
      const storedUser = getStoredUserInfo()
      if (storedUser?.userId) {
        try {
          const userInfo = await api.getUserInfo(storedUser.userId)
          persistStoredUserInfo({
            ...storedUser,
            ...userInfo,
            isAdmin:
              typeof (userInfo as any)?.isAdmin === 'boolean' ? (userInfo as any).isAdmin : Boolean(storedUser.isAdmin)
          })
        } catch (error) {
          console.warn('Failed to refresh user info after onboarding verification:', error)
        }
      }

      router.push('/home/overview')
    }

    const exitOnboarding = () => {
      router.push('/home')
    }

    const renderStepComponent = () => {
      switch (currentStep.value) {
        case 1:
          return <Step1_Welcome onNext={nextStep} />
        case 2:
          return <Step2_Environment onNext={nextStep} onPrev={prevStep} />
        case 3:
          return <Step3_KeyConfig onNext={nextStep} onPrev={prevStep} />
        case 4:
          return <Step4_Integration onNext={nextStep} onPrev={prevStep} />
        case 5:
          return <Step5_Verify onFinish={finishOnboarding} onPrev={prevStep} />
        default:
          return null
      }
    }

    return () => (
      <main class="onboarding-window" data-tauri-drag-region>
        <WindowActionBar maxW={false} shrink={false} showSlot={true}>
          <div class="onboarding-window__title-bar">
            <NIcon size="20" color="var(--color-primary)">
              <RocketOutline />
            </NIcon>
            <span class="onboarding-window__title">星光接入向导</span>
          </div>
        </WindowActionBar>

        <div class="onboarding-container">
          <div class="onboarding-window__header-actions">
            <NButton text onClick={exitOnboarding} class="onboarding-window__skip">
              跳过向导
            </NButton>
          </div>

          <div class="main-content">
            <div class="steps-wrapper">
              <NSteps current={currentStep.value} status="process" size="small">
                <NStep title="欢迎" description="开始接入" />
                <NStep title="环境检查" description="确保兼容性" />
                <NStep title="配置凭证" description="获取 AppKey" />
                <NStep title="集成 SDK" description="代码接入" />
                <NStep title="验证" description="测试连接" />
              </NSteps>
            </div>

            <div class="step-content-area">{renderStepComponent()}</div>
          </div>
        </div>
      </main>
    )
  }
})
