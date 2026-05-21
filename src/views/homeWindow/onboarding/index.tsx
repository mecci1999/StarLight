import { defineComponent } from 'vue'
import OnboardingPage from '@/domains/admin/pages/OnboardingPage'

export default defineComponent({
  name: 'OnboardingLegacyEntry',
  setup() {
    return () => <OnboardingPage />
  }
})
