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
        borderRadius: '10px',
        borderHover: '0',
        border: '0',
        borderDisabled: '0',
        borderFocus: '0',
        boxShadowFocus: '0'
      },
      Checkbox: {
        colorChecked: '#165dff',
        borderChecked: '1px solid #165dff',
        borderFocus: '1px solid #165dff',
        boxShadowFocus: '0 0 0 2px rgba(22,93,255, 0.3)'
      },
      Tag: {
        borderRadius: '4px'
      },
      Button: {
        borderRadiusMedium: '10px',
        borderRadiusSmall: '6px',
        colorPrimary: '#165dff'
      },
      Tabs: {
        tabTextColorSegment: '#707070',
        tabPaddingMediumSegment: '4px',
        tabTextColorActiveLine: '#165dff',
        tabTextColorHoverLine: '#165dff',
        tabTextColorActiveBar: '#165dff',
        tabTextColorHoverBar: '#165dff',
        barColor: '#165dff'
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
        railColorActive: '#165dff',
        loadingColor: '#165dff',
        boxShadowFocus: '0 0 0 2px rgba(22,93,255, 0.3)'
      },
      Radio: {
        boxShadowActive: 'inset 0 0 0 1px #165dff',
        boxShadowFocus: 'inset 0 0 0 1px #165dff,0 0 0 2px rgba(22,93,255, 0.3)',
        boxShadowHover: 'inset 0 0 0 1px #165dff',
        dotColorActive: '#165dff'
      },
      Message: {
        iconColorSuccess: '#165dff',
        iconColorLoading: '#165dff',
        loadingColor: '#165dff',
        borderRadius: '8px'
      },
      Slider: {
        handleSize: '12px',
        fontSize: '10px',
        markFontSize: '8px',
        fillColor: '#165dff',
        fillColorHover: '#165dff',
        indicatorBorderRadius: '8px'
      },
      Notification: {
        borderRadius: '8px'
      }
    }

    /** 浅色模式的主题颜色 */
    const lightThemeOverrides: GlobalThemeOverrides = {
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
