import { defineComponent } from 'vue'
import LogStreamContent from '@/domains/logs/components/LogStreamContent'

// TODO(refactor-phase0): remove this legacy log-stream compatibility entry after remaining external/manual entrypoints are retired.
// The domain-owned LogStreamContent is now the single implementation owner.
export default defineComponent({
  name: 'LogStreamLegacyEntry',
  setup() {
    return () => <LogStreamContent />
  }
})
