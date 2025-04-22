import {
  dateZhCN,
  darkTheme,
  lightTheme,
  GlobalThemeOverrides,
  zhCN,
  NConfigProvider,
  NLoadingBarProvider,
  NDialogProvider,
  NNotificationProvider,
  NModalProvider,
  NMessageProvider
} from 'naive-ui'
import { useSettingStore } from '@/store/setting'
import { ThemeEnum } from '@/types/enums'
import NavieProviderContent from './NavieProviderContent'
import { defineProps } from 'vue'

export default defineComponent({
  name: 'NavieProvider',
  props: {
    notificMax: {
      type: Number,
      default: 3
    },
    messageMax: {
      type: Number,
      default: 3
    }
  },
  setup(props, { slots }) {
    const settingStore = useSettingStore()
    const { themes } = storeToRefs(settingStore)

    /**监听深色主题颜色变化*/
    const globalTheme = reactive<any>({ name: themes.value.content })
    const prefers = matchMedia('(prefers-color-scheme: dark)')

    const commonTheme: GlobalThemeOverrides = {
      Input: {
        borderRadius: '4px',
        borderHover: '0',
        border: '0',
        borderDisabled: '0',
        borderFocus: '0',
        boxShadowFocus: '0'
      },
      Checkbox: {
        colorChecked: 'var(--color-primary-6)',
        borderChecked: '1px solid var(--color-primary-6)',
        borderFocus: '1px solid var(--color-primary-6)',
        boxShadowFocus: '0 0 0 2px rgba(22,93,255, 0.3)'
      },
      Tag: {
        borderRadius: '4px'
      },
      Button: {
        borderRadiusMedium: '6px',
        borderRadiusSmall: '4px',
        colorPrimary: 'var(--color-primary-6)',
        colorHoverPrimary: 'var(--color-primary-5)',
        colorPressedPrimary: 'var(--color-primary-7)',
        colorDisabledPrimary: 'var(--color-primary-3)',
        colorFocusPrimary: 'var(--color-primary-7)',
        colorSecondary: 'var(--color-secondary)',
        colorSecondaryHover: 'var(--color-secondary-hover)',
        borderPrimary: 'var(--color-primary-6)',
        borderFocusPrimary: 'var(--color-primary-7)',
        borderHoverPrimary: 'var(--color-primary-5)',
        borderPressedPrimary: 'var(--color-primary-7)',
        borderDisabledPrimary: 'var(--color-primary-3)',
        rippleColorPrimary: 'var(--color-primary-7)'
      },
      Tabs: {
        tabTextColorSegment: '#707070',
        tabPaddingMediumSegment: '4px',
        tabTextColorActiveLine: 'var(--color-primary-6)',
        tabTextColorHoverLine: 'var(--color-primary-6)',
        tabTextColorActiveBar: 'var(--color-primary-6)',
        tabTextColorHoverBar: 'var(--color-primary-6)',
        barColor: 'var(--color-primary-6)'
      },
      Popover: {
        padding: '5px',
        borderRadius: '8px'
      },
      Dropdown: {
        borderRadius: '8px'
      },
      Avatar: {
        border: '1px solid #fff'
      },
      Switch: {
        railColorActive: 'var(--color-primary-6)',
        loadingColor: 'var(--color-primary-6)',
        boxShadowFocus: '0 0 0 2px rgba(22,93,255, 0.3)'
      },
      Radio: {
        boxShadowActive: 'inset 0 0 0 1px var(--color-primary-6)',
        boxShadowFocus: 'inset 0 0 0 1px var(--color-primary-6),0 0 0 2px rgba(22,93,255, 0.3)',
        boxShadowHover: 'inset 0 0 0 1px var(--color-primary-6)',
        dotColorActive: 'var(--color-primary-6)'
      },
      Message: {
        iconColorSuccess: 'var(--color-primary-6)',
        iconColorLoading: 'var(--color-primary-6)',
        loadingColor: 'var(--color-primary-6)',
        borderRadius: '8px'
      },
      Slider: {
        handleSize: '12px',
        fontSize: '10px',
        markFontSize: '8px',
        fillColor: 'var(--color-primary-6)',
        fillColorHover: 'var(--color-primary-6)',
        indicatorBorderRadius: '8px'
      },
      Notification: {
        borderRadius: '8px'
      },
      Modal: {
        boxShadow: 'var(--shadow-center-3)'
      }
    }

    /** 浅色模式的主题颜色 */
    const lightThemeOverrides: GlobalThemeOverrides = {
      common: {
        primaryColor: '#165dff',
        primaryColorHover: '#4080ff',
        primaryColorPressed: '#0e42d2'
      },
      ...commonTheme,
      Scrollbar: {
        color: '#d5d5d5',
        colorHover: '#c5c5c5'
      },
      Skeleton: {
        color: 'rgba(200, 200, 200, 0.6)',
        colorEnd: 'rgba(200, 200, 200, 0.2)'
      }
    }

    /** 深色模式的主题颜色 */
    const darkThemeOverrides: GlobalThemeOverrides = {
      common: {
        primaryColor: '#3c7eff',
        primaryColorHover: '#306fff',
        primaryColorPressed: '#689fff'
      },
      ...commonTheme,
      Scrollbar: {
        color: 'rgba(255, 255, 255, 0.2)',
        colorHover: 'rgba(255, 255, 255, 0.3)'
      }
    }

    /** 跟随系统主题模式切换主题 */
    const followOS = () => {
      globalTheme.name = prefers.matches ? darkTheme : lightTheme
      document.documentElement.dataset.theme = prefers.matches ? ThemeEnum.DARK : ThemeEnum.LIGHT
      themes.value.content = prefers.matches ? ThemeEnum.DARK : ThemeEnum.LIGHT
    }

    watchEffect(() => {
      if (themes.value.pattern === ThemeEnum.OS) {
        followOS()
        themes.value.pattern = ThemeEnum.OS
        prefers.addEventListener('change', followOS)
      } else {
        // 判断content是否是深色还是浅色
        document.documentElement.dataset.theme = themes.value.content || ThemeEnum.LIGHT
        globalTheme.name = themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme
        prefers.removeEventListener('change', followOS)
      }
    })

    return () => (
      <NConfigProvider
        themeOverrides={themes.value.content === ThemeEnum.DARK ? darkThemeOverrides : lightThemeOverrides}
        theme={globalTheme}
        locale={zhCN}
        dateLocale={dateZhCN}>
        <NLoadingBarProvider>
          <NDialogProvider>
            <NNotificationProvider max={props.notificMax}>
              <NMessageProvider max={props.messageMax}>
                <NModalProvider>
                  {slots.default?.()}
                  <NavieProviderContent />
                </NModalProvider>
              </NMessageProvider>
            </NNotificationProvider>
          </NDialogProvider>
        </NLoadingBarProvider>
      </NConfigProvider>
    )
  }
})
