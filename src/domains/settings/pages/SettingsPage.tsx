import { NButton, NCard, NIcon, NRadioButton, NRadioGroup, NSwitch, NTag } from 'naive-ui'
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from '@tauri-apps/api/core'
import {
  InformationCircleOutline,
  BrushOutline,
  CloseCircleOutline,
  DesktopOutline,
  OpenOutline,
  LogInOutline,
  MoonOutline,
  SunnyOutline
} from '@vicons/ionicons5'
import { computed, defineComponent } from 'vue'
import PageHeader from '@/shared/layout/PageHeader'
import { useSettingStore } from '@/store/setting'
import { CloseBxEnum, ShowModeEnum, ThemeEnum } from '@/types/enums'
import './SettingsPage.scss'

type SettingSection = {
  key: string
  title: string
  description: string
  icon: typeof BrushOutline
}

const sections: SettingSection[] = [
  {
    key: 'appearance',
    title: '外观与主题',
    description: '控制客户端整体色彩、菜单展示和视觉效果。',
    icon: BrushOutline
  },
  {
    key: 'window',
    title: '窗口行为',
    description: '设置关闭、ESC 和托盘行为，贴合桌面客户端习惯。',
    icon: DesktopOutline
  },
  {
    key: 'login',
    title: '登录与启动',
    description: '管理自动登录和开机启动偏好。',
    icon: LogInOutline
  },
  {
    key: 'about',
    title: '关于应用',
    description: '查看当前安装的星光客户端版本。',
    icon: InformationCircleOutline
  }
]

export default defineComponent({
  name: 'SettingsPage',
  setup() {
    const settingStore = useSettingStore()
    const appVersion = ref<string | null>(null)

    onMounted(async () => {
      try {
        if (isTauri()) appVersion.value = await getVersion()
      } catch {
        appVersion.value = null
      }
    })

    const themeLabel = computed(() => {
      if (settingStore.themes.pattern === ThemeEnum.OS) return '跟随系统'
      return settingStore.themes.content === ThemeEnum.DARK ? '深色模式' : '浅色模式'
    })

    const visualEffectCount = computed(
      () =>
        [settingStore.page.shadow, settingStore.page.blur, settingStore.showMode === ShowModeEnum.TEXT].filter(Boolean)
          .length
    )

    const resetInterface = () => {
      settingStore.setTheme(ThemeEnum.OS)
      settingStore.themes.versatile = 'default'
      settingStore.showMode = ShowModeEnum.ICON
      settingStore.page.shadow = true
      settingStore.page.blur = true
      settingStore.page.fonts = 'PingFang'
      window.$message.success('界面设置已恢复默认')
    }

    const renderSectionAnchor = (section: SettingSection) => {
      const Icon = section.icon
      return (
        <a class="settings-page__anchor" href={`#${section.key}`}>
          <NIcon size={18}>
            <Icon />
          </NIcon>
          <span>
            <strong>{section.title}</strong>
            <em>{section.description}</em>
          </span>
        </a>
      )
    }

    return () => (
      <div class="settings-page">
        <PageHeader title="应用设置" subtitle="管理星光客户端的显示、窗口、登录与启动偏好。">
          {{
            actions: () => (
              <NButton secondary onClick={resetInterface}>
                恢复界面默认
              </NButton>
            )
          }}
        </PageHeader>

        <div class="settings-page__shell">
          <aside class="settings-page__sidebar">
            <div class="settings-page__profile-card">
              <div class="settings-page__profile-orb">
                <NIcon size={24}>
                  {settingStore.themes.content === ThemeEnum.DARK ? <MoonOutline /> : <SunnyOutline />}
                </NIcon>
              </div>
              <div>
                <strong>{themeLabel.value}</strong>
                <span>{visualEffectCount.value} 项视觉增强已启用</span>
              </div>
            </div>
            <nav>
              {sections.filter((section) => section.key !== 'about' || appVersion.value).map(renderSectionAnchor)}
            </nav>
          </aside>

          <main class="settings-page__content">
            <section id="appearance">
              <NCard bordered={false} class="settings-page__card">
                <div class="settings-page__card-head">
                  <div>
                    <span>Appearance</span>
                    <h2>外观与主题</h2>
                    <p>桌面监控客户端需要高信息密度，但仍要保持长时间阅读舒适。</p>
                  </div>
                  <NTag bordered={false} type="info">
                    {themeLabel.value}
                  </NTag>
                </div>

                <div class="settings-page__fields">
                  <label class="settings-page__field settings-page__field--full">
                    <span>主题模式</span>
                    <NRadioGroup
                      value={settingStore.themes.pattern}
                      onUpdateValue={(value: ThemeEnum) => settingStore.setTheme(value)}>
                      <NRadioButton value={ThemeEnum.LIGHT}>浅色</NRadioButton>
                      <NRadioButton value={ThemeEnum.DARK}>深色</NRadioButton>
                      <NRadioButton value={ThemeEnum.OS}>跟随系统</NRadioButton>
                    </NRadioGroup>
                  </label>

                  <label class="settings-page__field">
                    <span>菜单展示</span>
                    <NRadioGroup
                      value={settingStore.showMode}
                      onUpdateValue={(value: ShowModeEnum) => (settingStore.showMode = value)}>
                      <NRadioButton value={ShowModeEnum.ICON}>图标</NRadioButton>
                      <NRadioButton value={ShowModeEnum.TEXT}>文字</NRadioButton>
                    </NRadioGroup>
                  </label>

                  <label class="settings-page__field">
                    <span>字体方案</span>
                    <NRadioGroup
                      value={settingStore.page.fonts}
                      onUpdateValue={(value: string) => (settingStore.page.fonts = value)}>
                      <NRadioButton value="PingFang">苹方</NRadioButton>
                      <NRadioButton value="System">系统</NRadioButton>
                    </NRadioGroup>
                  </label>

                  <div class="settings-page__toggle-card">
                    <div>
                      <strong>卡片阴影</strong>
                      <span>提升层级识别，适合长时间看板巡检。</span>
                    </div>
                    <NSwitch
                      value={settingStore.page.shadow}
                      onUpdateValue={(value: boolean) => (settingStore.page.shadow = value)}
                    />
                  </div>

                  <div class="settings-page__toggle-card">
                    <div>
                      <strong>背景模糊</strong>
                      <span>让弹层和浮窗更接近桌面客户端质感。</span>
                    </div>
                    <NSwitch
                      value={settingStore.page.blur}
                      onUpdateValue={(value: boolean) => (settingStore.page.blur = value)}
                    />
                  </div>
                </div>
              </NCard>
            </section>

            <section id="window">
              <NCard bordered={false} class="settings-page__card">
                <div class="settings-page__card-head">
                  <div>
                    <span>Window</span>
                    <h2>窗口行为</h2>
                    <p>控制关闭窗口、托盘和快捷键行为，避免误关监控客户端。</p>
                  </div>
                  <NIcon size={28} class="settings-page__card-icon">
                    <CloseCircleOutline />
                  </NIcon>
                </div>

                <div class="settings-page__fields">
                  <label class="settings-page__field settings-page__field--full">
                    <span>点击关闭按钮时</span>
                    <NRadioGroup
                      value={settingStore.tips.type}
                      onUpdateValue={(value: CloseBxEnum) => (settingStore.tips.type = value)}>
                      <NRadioButton value={CloseBxEnum.HIDE}>最小化到托盘</NRadioButton>
                      <NRadioButton value={CloseBxEnum.CLOSE}>直接退出程序</NRadioButton>
                    </NRadioGroup>
                  </label>

                  <div class="settings-page__toggle-card">
                    <div>
                      <strong>不再显示关闭确认</strong>
                      <span>启用后会直接按上方关闭策略执行。</span>
                    </div>
                    <NSwitch
                      value={settingStore.tips.notTips}
                      onUpdateValue={(value: boolean) => (settingStore.tips.notTips = value)}
                    />
                  </div>

                  <div class="settings-page__toggle-card">
                    <div>
                      <strong>ESC 关闭窗口</strong>
                      <span>在 Windows 客户端中使用 ESC 触发关闭逻辑。</span>
                    </div>
                    <NSwitch
                      value={settingStore.escClose}
                      onUpdateValue={(value: boolean) => (settingStore.escClose = value)}
                    />
                  </div>

                  <div class="settings-page__toggle-card settings-page__toggle-card--full">
                    <div>
                      <strong>微应用独立窗口</strong>
                      <span>
                        {settingStore.microApps.openInNewWindow
                          ? '进入微应用时打开独立桌面窗口，可与星光主界面并排使用。'
                          : '进入微应用时保留在星光客户端标签页内。'}
                      </span>
                    </div>
                    <div class="settings-page__toggle-action">
                      <NIcon size={18} aria-hidden="true">
                        <OpenOutline />
                      </NIcon>
                      <NSwitch
                        value={settingStore.microApps.openInNewWindow}
                        onUpdateValue={(value: boolean) => (settingStore.microApps.openInNewWindow = value)}
                      />
                    </div>
                  </div>
                </div>
              </NCard>
            </section>

            <section id="login">
              <NCard bordered={false} class="settings-page__card">
                <div class="settings-page__card-head">
                  <div>
                    <span>Login</span>
                    <h2>登录与启动</h2>
                    <p>适合运维值班场景，减少重复登录与启动成本。</p>
                  </div>
                  <NIcon size={28} class="settings-page__card-icon">
                    <LogInOutline />
                  </NIcon>
                </div>

                <div class="settings-page__fields settings-page__fields--single">
                  <div class="settings-page__toggle-card">
                    <div>
                      <strong>自动登录</strong>
                      <span>启动后尝试复用本地登录状态进入控制台。</span>
                    </div>
                    <NSwitch
                      value={settingStore.login.autoLogin}
                      onUpdateValue={(value: boolean) => (settingStore.login.autoLogin = value)}
                    />
                  </div>

                  <div class="settings-page__toggle-card">
                    <div>
                      <strong>开机启动</strong>
                      <span>随系统启动星光，便于持续监控。</span>
                    </div>
                    <NSwitch
                      value={settingStore.login.autoStartup}
                      onUpdateValue={(value: boolean) => (settingStore.login.autoStartup = value)}
                    />
                  </div>
                </div>
              </NCard>
            </section>

            {appVersion.value && (
              <section id="about">
                <NCard bordered={false} class="settings-page__card settings-page__about-card">
                  <div class="settings-page__card-head">
                    <div>
                      <span>About</span>
                      <h2>应用信息</h2>
                      <p>当前设备上安装的星光桌面客户端版本。</p>
                    </div>
                    <NIcon size={28} class="settings-page__card-icon">
                      <InformationCircleOutline />
                    </NIcon>
                  </div>

                  <div class="settings-page__about-version">
                    <span>当前版本</span>
                    <strong>v{appVersion.value}</strong>
                  </div>
                </NCard>
              </section>
            )}
          </main>
        </div>
      </div>
    )
  }
})
