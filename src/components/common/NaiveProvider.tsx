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

// TODO(refactor-phase0): rename NavieProvider/NavieProviderContent after compatibility imports are cleaned up.
// The misspelling is retained temporarily to avoid breaking existing entrypoints during the refactor window.

const LIGHT_PRIMARY = {
  3: '#94bfff',
  5: '#4080ff',
  6: '#165dff',
  7: '#0e42d2'
}

const DARK_PRIMARY = {
  3: '#1d4ed8',
  5: '#3b82f6',
  6: '#60a5fa',
  7: '#93c5fd'
}

const createCommonTheme = (primary: typeof LIGHT_PRIMARY): GlobalThemeOverrides => ({
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
    borderHover: `1px solid ${primary[5]}`,
    borderFocus: `1px solid ${primary[6]}`,
    boxShadowFocus: `0 0 0 2px color-mix(in srgb, ${primary[6]} 20%, transparent)`,
    colorFocus: 'transparent',
    caretColor: primary[6]
  },
  Select: {
    peers: {
      InternalSelection: {
        borderActive: `1px solid ${primary[6]}`,
        borderFocus: `1px solid ${primary[5]}`,
        borderHover: `1px solid ${primary[5]}`,
        borderRadius: '4px',
        colorActive: 'var(--color-bg-2)',
        boxShadowActive: `0 0 8px 0 color-mix(in srgb, ${primary[6]} 40%, transparent)`,
        boxShadowFocus: `0 0 8px 0 color-mix(in srgb, ${primary[6]} 40%, transparent)`,
        boxShadowHover: 'none',
        caretColor: primary[6]
      }
    }
  },
  Checkbox: {
    colorChecked: primary[6],
    borderChecked: `1px solid ${primary[6]}`,
    borderFocus: `1px solid ${primary[6]}`,
    boxShadowFocus: `0 0 0 2px color-mix(in srgb, ${primary[6]} 30%, transparent)`,
    borderRadius: 'var(--border-radius-small)'
  },
  Tag: {
    borderRadius: 'var(--border-radius-medium)'
  },
  Button: {
    borderRadiusMedium: 'var(--border-radius-medium)',
    borderRadiusSmall: 'var(--border-radius-small)',
    borderRadiusLarge: 'var(--border-radius-large)',
    colorPrimary: primary[6],
    colorHoverPrimary: primary[5],
    colorPressedPrimary: primary[7],
    colorDisabledPrimary: primary[3],
    colorFocusPrimary: primary[7],
    borderPrimary: primary[6],
    borderFocusPrimary: primary[7],
    borderHoverPrimary: primary[5],
    borderPressedPrimary: primary[7],
    borderDisabledPrimary: primary[3],
    rippleColorPrimary: primary[7],
    colorHover: 'var(--color-fill-2)',
    colorPressed: 'var(--color-fill-3)',
    colorFocus: 'var(--color-fill-2)',
    textColor: 'var(--color-text-1)',
    textColorHover: primary[6],
    textColorPressed: primary[7],
    border: '1px solid var(--color-border-2)',
    borderHover: `1px solid ${primary[5]}`,
    borderPressed: `1px solid ${primary[7]}`,
    borderFocus: `1px solid ${primary[6]}`
  },
  Tabs: {
    tabTextColorSegment: 'var(--color-text-3)',
    tabPaddingMediumSegment: '4px',
    tabTextColorActiveLine: primary[6],
    tabTextColorHoverLine: primary[5],
    tabTextColorActiveBar: primary[6],
    tabTextColorHoverBar: primary[5],
    barColor: primary[6],
    tabFontWeightActive: '500'
  },
  Popover: {
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-large)',
    boxShadow: 'var(--shadow-center-2)'
  },
  Dropdown: {
    borderRadius: 'var(--border-radius-large)',
    optionTextColorHover: primary[6],
    optionColorHover: 'var(--color-fill-2)'
  },
  Avatar: {
    border: '1px solid var(--color-border-1)'
  },
  Switch: {
    railColorActive: primary[6],
    loadingColor: primary[6],
    boxShadowFocus: `0 0 0 2px color-mix(in srgb, ${primary[6]} 30%, transparent)`
  },
  Radio: {
    boxShadowActive: `inset 0 0 0 1px ${primary[6]}`,
    boxShadowFocus: `inset 0 0 0 1px ${primary[6]},0 0 0 2px color-mix(in srgb, ${primary[6]} 30%, transparent)`,
    boxShadowHover: `inset 0 0 0 1px ${primary[6]}`,
    dotColorActive: primary[6]
  },
  Message: {
    iconColorSuccess: 'var(--color-success-6)',
    iconColorInfo: primary[6],
    iconColorWarning: 'var(--color-warning-6)',
    iconColorError: 'var(--color-danger-6)',
    iconColorLoading: primary[6],
    loadingColor: primary[6],
    borderRadius: 'var(--border-radius-large)',
    padding: '10px 16px',
    contentColor: 'var(--color-text-1)'
  },
  Spin: {
    color: primary[6],
    textColor: 'var(--color-text-2)',
    opacitySpinning: '0.72'
  },
  Slider: {
    handleSize: '12px',
    fontSize: '10px',
    markFontSize: '8px',
    fillColor: primary[6],
    fillColorHover: primary[5],
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
    titleTextColor: 'var(--color-text-1)',
    color: 'var(--color-bg-2)',
    colorEmbedded: 'var(--color-bg-2)'
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
    itemTextColorHover: primary[6],
    itemTextColorActive: primary[6],
    itemTextColorChildActive: primary[6],
    itemIconColor: 'var(--color-text-3)',
    itemIconColorHover: primary[6],
    itemIconColorActive: primary[6],
    itemIconColorChildActive: primary[6],
    arrowColor: 'var(--color-text-3)',
    arrowColorHover: primary[6],
    arrowColorActive: primary[6],
    arrowColorChildActive: primary[6]
  }
})

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

    /** 浅色模式的主题颜色 */
    const lightThemeOverrides: GlobalThemeOverrides = {
      common: {
        primaryColor: '#165dff',
        primaryColorHover: '#4080ff',
        primaryColorPressed: '#0e42d2'
      },
      ...createCommonTheme(LIGHT_PRIMARY),
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
      ...createCommonTheme(DARK_PRIMARY),
      Scrollbar: {
        color: 'rgba(255, 255, 255, 0.2)',
        colorHover: 'rgba(255, 255, 255, 0.3)'
      }
    }

    /** 跟随系统主题模式切换主题 */
    const followOS = () => {
      globalTheme.name = prefers.matches ? darkTheme : lightTheme
      settingStore.applySystemTheme()
    }

    watchEffect((onCleanup) => {
      if (themes.value.pattern === ThemeEnum.OS) {
        followOS()
        prefers.addEventListener('change', followOS)
        onCleanup(() => prefers.removeEventListener('change', followOS))
      } else {
        // 判断content是否是深色还是浅色
        document.documentElement.dataset.theme = themes.value.content || ThemeEnum.LIGHT
        globalTheme.name = themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme
      }
    })

    return () => (
      <NConfigProvider
        themeOverrides={themes.value.content === ThemeEnum.DARK ? darkThemeOverrides : lightThemeOverrides}
        theme={globalTheme.name}
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
