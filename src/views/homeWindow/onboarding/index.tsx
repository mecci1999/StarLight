import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { NSteps, NStep, NButton, NIcon } from 'naive-ui'
import { RocketOutline } from '@vicons/ionicons5'
import WindowActionBar from '@/components/WindowActionBar'
import Step1_Welcome from './components/Step1_Welcome'
import Step2_Environment from './components/Step2_Environment'
import Step3_KeyConfig from './components/Step3_KeyConfig'
import Step4_Integration from './components/Step4_Integration'
import Step5_Verify from './components/Step5_Verify'
import './index.scss'

export default defineComponent({
  name: 'OnboardingWizard',
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
      if (currentStep.value < 5) {
        currentStep.value++
      }
    }

    const prevStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--
      }
    }

    const finishOnboarding = () => {
      // Save state that onboarding is done
      localStorage.setItem('onboarding_completed', 'true')
      router.push('/home/custom-dashboard')
    }

    const exitOnboarding = () => {
      router.push('/home')
    }

    const renderStepComponent = () => {
      switch (currentStep.value) {
        case 1:
          return <Step1_Welcome onNext={nextStep} />
        case 2:
          return <Step2_Environment onNext={nextStep} />
        case 3:
          return <Step3_KeyConfig onNext={nextStep} />
        case 4:
          return <Step4_Integration onNext={nextStep} />
        case 5:
          return <Step5_Verify onFinish={finishOnboarding} />
        default:
          return null
      }
    }

    return () => (
      <main
        class="onboarding-window bg-[--color-bg-1] size-full rounded-8px select-none text-[--color-text-1] relative"
        data-tauri-drag-region>
        {/* 窗口顶部操作栏 */}
        <WindowActionBar maxW={false} shrink={false} showSlot={true}>
          <div class="flex items-center gap-2 pl-20 pt-1">
            <NIcon size="20" color="var(--color-primary)">
              <RocketOutline />
            </NIcon>
            <span class="text-14px font-bold text-[--color-text-1]">StarLight 接入向导</span>
          </div>
        </WindowActionBar>

        <div class="onboarding-container">
          {/* Header 移入 WindowActionBar，此处移除或仅保留跳过按钮 */}
          <div class="header-actions absolute top-0 right-150px h-44px flex items-center z-50">
            <NButton text onClick={exitOnboarding} class="text-[--color-text-2] hover:text-[--color-primary] text-12px">
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
