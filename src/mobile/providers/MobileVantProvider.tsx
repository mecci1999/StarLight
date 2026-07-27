import { computed, defineComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { ConfigProvider, type ConfigProviderThemeVars } from 'vant'
import 'vant/lib/index.css'
import { useSettingStore } from '@/store/setting'
import { ThemeEnum } from '@/types/enums'

const LIGHT_THEME_VARS: ConfigProviderThemeVars = {
  primaryColor: 'var(--color-primary-6)',
  successColor: 'var(--color-success-6)',
  textColor: 'var(--color-text-1)',
  textColor2: 'var(--color-text-2)',
  background: 'var(--color-bg-1)',
  background2: 'var(--color-bg-2)',
  borderColor: 'var(--color-border-1)',
  activeColor: 'var(--color-fill-2)',
  paddingMd: 'var(--spacing-3)',
  radiusMd: 'var(--border-radius-medium)',
  radiusLg: 'var(--border-radius-large)'
}

const DARK_THEME_VARS: ConfigProviderThemeVars = {
  ...LIGHT_THEME_VARS,
  activeColor: 'var(--color-fill-3)'
}

export default defineComponent({
  name: 'MobileVantProvider',
  props: {},
  setup(_, { slots }) {
    const settingStore = useSettingStore()
    const { themes } = storeToRefs(settingStore)
    const themeVars = computed(() => (themes.value.content === ThemeEnum.DARK ? DARK_THEME_VARS : LIGHT_THEME_VARS))

    return () => (
      <ConfigProvider themeVars={themeVars.value} themeVarsScope="local">
        {slots.default?.()}
      </ConfigProvider>
    )
  }
})
