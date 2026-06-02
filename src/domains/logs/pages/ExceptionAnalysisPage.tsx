import { defineComponent } from 'vue'
import ExceptionAnalysisContent from '@/domains/logs/components/ExceptionAnalysisContent'

export default defineComponent({
  name: 'ExceptionAnalysisPage',
  setup() {
    return () => <ExceptionAnalysisContent />
  }
})
