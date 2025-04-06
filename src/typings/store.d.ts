/** pinia的store的命名空间 */
declare namespace STO {
  import { ShowModeEnum, ThemeEnum } from '@/enums'
  import { UserState } from '@/services/types'
  /**
   * 设置
   * @param themes 主题设置
   * @param tips 关闭提示
   * @param escClose 是否启用ESC关闭窗口
   * @param login 用户登录设置
   * @param page 界面设置
   */
  type Setting = {
    /** 主题设置 */
    themes: {
      content: ThemeEnum
      pattern: string
      versatile: string
    }
    /** 关闭提示 */
    tips: {
      type: string
      /** 不再显示提示 */
      notTips: boolean
    }
    /** 是否启用ESC关闭窗口 */
    escClose: boolean
    /** 菜单显示模式 */
    showMode: ShowModeEnum
    /** 登录设置 */
    login: {
      /** 是否启用自动登录 */
      autoLogin: boolean
      /** 开机启动 */
      autoStartup: boolean
    }
    /** 界面设置 */
    page: {
      /** 是否开启阴影 */
      shadow: boolean
      /** 字体 */
      fonts: string
      /** 高斯模糊 */
      blur: boolean
    }
  }

  /**
   * 插件管理弹窗数据类型
   * @param state 插件状态
   * @param version 插件版本
   * @param isAdd 是否添加侧边栏
   * @param isAnimate 是否动画效果
   * @param { OPT.L.Common } 通用默认侧边栏
   */
  type Plugins<T> = {
    state: T
    version?: string
    isAdd: boolean
    dot?: boolean
    progress: number
    miniShow: boolean
  } & OPT.L.Common
}
