import { useSettingStore } from '@/store/setting'
import { ThemeEnum } from '@/types/enums'
import {
  darkTheme,
  dateZhCN,
  GlobalThemeOverrides,
  lightTheme,
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NModalProvider,
  NNotificationProvider,
  zhCN
} from 'naive-ui'
import NavieProviderContent from './NavieProviderContent'

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
      common: {
        borderRadius: '4px',
        borderRadiusSmall: '2px',
        fontSize: '14px',
        fontSizeSmall: '12px',
        fontSizeMedium: '14px',
        fontSizeLarge: '16px',
        fontSizeHuge: '20px',
        lineHeight: '1.5',
        heightTiny: '24px',
        heightSmall: '28px',
        heightMedium: '32px',
        heightLarge: '36px',
        heightHuge: '40px'
      },
      Input: {
        borderRadius: 'var(--border-radius-medium)',
        borderHover: '1px solid var(--color-primary-5)',
        borderFocus: '1px solid var(--color-primary-6)',
        boxShadowFocus: '0 0 0 2px rgba(22,93,255, 0.2)',
        colorFocus: 'transparent',
        caretColor: 'var(--color-primary-6)'
      },
      Checkbox: {
        colorChecked: 'var(--color-primary-6)',
        borderChecked: '1px solid var(--color-primary-6)',
        borderFocus: '1px solid var(--color-primary-6)',
        boxShadowFocus: '0 0 0 2px rgba(22,93,255, 0.3)',
        borderRadius: 'var(--border-radius-small)'
      },
      Tag: {
        borderRadius: 'var(--border-radius-medium)'
      },
      Button: {
        borderRadiusMedium: 'var(--border-radius-medium)',
        borderRadiusSmall: 'var(--border-radius-small)',
        borderRadiusLarge: 'var(--border-radius-large)',
        // Primary Type
        colorPrimary: 'var(--color-primary-6)',
        colorHoverPrimary: 'var(--color-primary-5)',
        colorPressedPrimary: 'var(--color-primary-7)',
        colorDisabledPrimary: 'var(--color-primary-3)',
        colorFocusPrimary: 'var(--color-primary-7)',
        borderPrimary: 'var(--color-primary-6)',
        borderFocusPrimary: 'var(--color-primary-7)',
        borderHoverPrimary: 'var(--color-primary-5)',
        borderPressedPrimary: 'var(--color-primary-7)',
        borderDisabledPrimary: 'var(--color-primary-3)',
        rippleColorPrimary: 'var(--color-primary-7)',
        // Default Type (Secondary in design system usually maps to default button style tweaks)
        colorHover: 'var(--color-fill-2)',
        colorPressed: 'var(--color-fill-3)',
        colorFocus: 'var(--color-fill-2)',
        textColor: 'var(--color-text-1)',
        textColorHover: 'var(--color-primary-6)',
        textColorPressed: 'var(--color-primary-7)',
        border: '1px solid var(--color-border-2)',
        borderHover: '1px solid var(--color-primary-5)',
        borderPressed: '1px solid var(--color-primary-7)',
        borderFocus: '1px solid var(--color-primary-6)'
      },
      Tabs: {
        tabTextColorSegment: 'var(--color-text-3)',
        tabPaddingMediumSegment: '4px',
        tabTextColorActiveLine: 'var(--color-primary-6)',
        tabTextColorHoverLine: 'var(--color-primary-5)',
        tabTextColorActiveBar: 'var(--color-primary-6)',
        tabTextColorHoverBar: 'var(--color-primary-5)',
        barColor: 'var(--color-primary-6)',
        tabFontWeightActive: '500'
      },
      Popover: {
        padding: '8px 12px',
        borderRadius: 'var(--border-radius-large)',
        boxShadow: 'var(--shadow-center-2)'
      },
      Dropdown: {
        borderRadius: 'var(--border-radius-large)',
        optionTextColorHover: 'var(--color-primary-6)',
        optionColorHover: 'var(--color-fill-2)'
      },
      Avatar: {
        border: '1px solid var(--color-border-1)'
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
        iconColorSuccess: 'var(--color-success-6)',
        iconColorInfo: 'var(--color-primary-6)',
        iconColorWarning: 'var(--color-warning-6)',
        iconColorError: 'var(--color-danger-6)',
        iconColorLoading: 'var(--color-primary-6)',
        loadingColor: 'var(--color-primary-6)',
        borderRadius: 'var(--border-radius-large)',
        padding: '10px 16px',
        contentColor: 'var(--color-text-1)'
      },
      Slider: {
        handleSize: '12px',
        fontSize: '10px',
        markFontSize: '8px',
        fillColor: 'var(--color-primary-6)',
        fillColorHover: 'var(--color-primary-5)',
        indicatorBorderRadius: 'var(--border-radius-large)'
      },
      Notification: {
        borderRadius: 'var(--border-radius-large)',
        boxShadow: 'var(--shadow-center-3)',
        headerTextColor: 'var(--color-text-1)',
        contentTextColor: 'var(--color-text-2)'
      },
      Modal: {
        boxShadow: 'var(--shadow-center-3)',
        borderRadius: 'var(--border-radius-large)'
      },
      Card: {
        borderRadius: 'var(--border-radius-large)',
        borderColor: 'var(--color-border-2)',
        textColor: 'var(--color-text-1)',
        titleTextColor: 'var(--color-text-1)'
      },
      Table: {
        borderRadius: 'var(--border-radius-medium)',
        thColor: 'var(--color-fill-2)',
        thTextColor: 'var(--color-text-2)',
        thFontWeight: '500',
        tdTextColor: 'var(--color-text-1)',
        borderColor: 'var(--color-border-1)',
        tdColorHover: 'var(--color-fill-1)'
      },
      Menu: {
        itemTextColor: 'var(--color-text-2)',
        itemTextColorHover: 'var(--color-primary-6)',
        itemTextColorActive: 'var(--color-primary-6)',
        itemTextColorChildActive: 'var(--color-primary-6)',
        itemIconColor: 'var(--color-text-3)',
        itemIconColorHover: 'var(--color-primary-6)',
        itemIconColorActive: 'var(--color-primary-6)',
        itemIconColorChildActive: 'var(--color-primary-6)',
        arrowColor: 'var(--color-text-3)',
        arrowColorHover: 'var(--color-primary-6)',
        arrowColorActive: 'var(--color-primary-6)',
        arrowColorChildActive: 'var(--color-primary-6)'
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
