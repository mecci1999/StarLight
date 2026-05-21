import { defineComponent } from 'vue'
import LogConfigContent from '@/domains/logs/components/LogConfigContent'

// TODO(refactor-phase0): remove this legacy log-config compatibility entry after remaining external/manual entrypoints are retired.
// The domain-owned LogConfigContent is now the single implementation owner.
export default defineComponent({
  name: 'LogConfigLegacyEntry',
  setup() {
    return () => <LogConfigContent />
  }
})
