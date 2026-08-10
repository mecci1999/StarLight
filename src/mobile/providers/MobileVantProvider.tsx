import { computed, defineComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { ConfigProvider, type ConfigProviderThemeVars } from 'vant'
import 'vant/lib/index.css'
import { useSettingStore } from '@/store/setting'
import { ThemeEnum } from '@/types/enums'

const LIGHT_THEME_VARS: ConfigProviderThemeVars = {
  primaryColor: 'var(--color-primary-6)',
  successColor: 'var(--color-success-6)',
  dangerColor: 'var(--color-danger-6)',
  warningColor: 'var(--color-warning-6)',
  textColor: 'var(--color-text-1)',
  textColor2: 'var(--color-text-2)',
  textColor3: 'var(--color-text-3)',
  background: 'var(--color-bg-1)',
  background2: 'var(--color-bg-2)',
  borderColor: 'var(--color-border-1)',
  activeColor: 'var(--color-fill-2)',
  fieldLabelColor: 'var(--color-text-1)',
  fieldInputTextColor: 'var(--color-text-1)',
  fieldInputDisabledTextColor: 'var(--color-text-3)',
  fieldPlaceholderTextColor: 'var(--color-text-3)',
  fieldClearIconColor: 'var(--color-text-3)',
  fieldRightIconColor: 'var(--color-text-3)',
  cellTextColor: 'var(--color-text-1)',
  cellBackground: 'var(--color-bg-2)',
  cellBorderColor: 'var(--color-border-1)',
  cellActiveColor: 'var(--color-fill-2)',
  cellLabelColor: 'var(--color-text-3)',
  cellValueColor: 'var(--color-text-2)',
  cellRightIconColor: 'var(--color-text-3)',
  popupBackground: 'var(--color-bg-5)',
  popupCloseIconColor: 'var(--color-text-3)',
  overlayBackground: 'var(--color-mask-bg)',
  tabTextColor: 'var(--color-text-3)',
  tabActiveTextColor: 'var(--color-text-1)',
  tabsNavBackground: 'var(--color-bg-2)',
  tabsBottomBarColor: 'var(--color-primary-6)',
  paddingMd: 'var(--spacing-3)',
  radiusMd: 'var(--border-radius-medium)',
  radiusLg: 'var(--border-radius-large)'
}

const DARK_THEME_VARS: ConfigProviderThemeVars = {
  ...LIGHT_THEME_VARS,
  background: 'var(--color-bg-1)',
  background2: 'var(--color-bg-2)',
  borderColor: 'var(--color-border-2)',
  activeColor: 'var(--color-fill-3)'
}

export { DARK_THEME_VARS, LIGHT_THEME_VARS }

export default defineComponent({
  name: 'MobileVantProvider',
  props: {},
  setup(_, { slots }) {
    const settingStore = useSettingStore()
    const { themes } = storeToRefs(settingStore)
    const themeVars = computed(() => (themes.value.content === ThemeEnum.DARK ? DARK_THEME_VARS : LIGHT_THEME_VARS))

    return () => (
      <ConfigProvider themeVars={themeVars.value} themeVarsScope="global">
        {slots.default?.()}
      </ConfigProvider>
    )
  }
})
