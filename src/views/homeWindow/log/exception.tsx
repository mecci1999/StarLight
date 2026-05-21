import { defineComponent } from 'vue'
import ExceptionAnalysisContent from '@/domains/logs/components/ExceptionAnalysisContent'

// TODO(refactor-phase0): remove this legacy exception-analysis compatibility entry after remaining external/manual entrypoints are retired.
// The domain-owned ExceptionAnalysisContent is now the single implementation owner.
export default defineComponent({
  name: 'ExceptionAnalysisLegacyEntry',
  setup() {
    return () => <ExceptionAnalysisContent />
  }
})
