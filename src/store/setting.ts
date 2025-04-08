import { defineStore } from 'pinia'
import { type } from '@tauri-apps/plugin-os'
import { ThemeEnum, StoresEnum, ShowModeEnum, CloseBxEnum } from '@/types/enums'

const isDesktop = computed(() => {
  return type() === 'windows' || type() === 'linux' || type() === 'macos'
})

export const useSettingStore = defineStore(StoresEnum.SETTING, {
  state: (): STO.Setting => ({
    themes: {
      content: '',
      pattern: '',
      versatile: isDesktop.value ? 'default' : 'simple'
    },
    escClose: true,
    showMode: ShowModeEnum.ICON,
    tips: {
      type: CloseBxEnum.HIDE,
      notTips: false
    },
    login: {
      autoLogin: false,
      autoStartup: false
    },
    page: {
      shadow: true,
      fonts: 'PingFang',
      blur: true
    }
  }),
  actions: {
    /**
     * 初始化主题
     */
    initTheme(theme: string) {
      this.themes.content = theme
      document.documentElement.dataset.theme = theme
      this.themes.pattern = theme
    },
    /**
     * 切换主题
     */
    setTheme(theme: string) {
      if (theme === ThemeEnum.OS) {
        this.themes.pattern = theme
        const os = matchMedia('(prefers-color-scheme: dark)').matches ? ThemeEnum.DARK : ThemeEnum.LIGHT
        document.documentElement.dataset.theme = os
        this.themes.content = os
      } else {
        this.themes.pattern = theme
        document.documentElement.dataset.theme = theme
        this.themes.content = theme
      }
    }
  },
  share: {
    enable: true,
    initialize: true
  }
})
