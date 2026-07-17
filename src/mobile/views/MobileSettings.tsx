import { defineComponent, ref, h } from 'vue'
import { NButton, NCard, NIcon, NList, NListItem, NModal, NRadioButton, NRadioGroup, NSwitch } from 'naive-ui'
import { PhSignIn, PhMoon, PhArrowsClockwise } from '@phosphor-icons/vue'
import { useSettingStore } from '@/store/setting'
import { ShowModeEnum, ThemeEnum } from '@/types/enums'
import './MobileSettings.scss'

type SettingSection = {
  key: string
  title: string
  icon: any
}

const sections: SettingSection[] = [
  { key: 'appearance', title: '外观', icon: PhMoon },
  { key: 'preferences', title: '偏好', icon: PhSignIn },
  { key: 'login', title: '登录', icon: PhSignIn },
  { key: 'about', title: '关于', icon: PhSignIn },
  { key: 'reset', title: '重置', icon: PhArrowsClockwise }
]

export default defineComponent({
  name: 'MobileSettings',
  setup() {
    const settingStore = useSettingStore()
    const showResetConfirm = ref(false)

    const toggleShadow = (v: boolean) => {
      settingStore.page.shadow = v
    }

    const toggleBlur = (v: boolean) => {
      settingStore.page.blur = v
    }

    const toggleAutoLogin = (v: boolean) => {
      settingStore.login.autoLogin = v
    }

    const setFontScheme = (v: string) => {
      settingStore.page.fonts = v
    }

    const setShowMode = (v: ShowModeEnum) => {
      settingStore.showMode = v
    }

    const openResetConfirm = () => {
      showResetConfirm.value = true
    }

    const closeResetConfirm = () => {
      showResetConfirm.value = false
    }

    const handleResetDefaults = () => {
      settingStore.setTheme(ThemeEnum.OS)
      settingStore.themes.versatile = 'default'
      settingStore.showMode = ShowModeEnum.ICON
      settingStore.page.shadow = true
      settingStore.page.blur = true
      settingStore.page.fonts = 'PingFang'
      closeResetConfirm()
      window.$message.success('所有设置已恢复默认')
    }

    const scrollToSection = (key: string) => {
      const el = document.getElementById(`mobile-settings-${key}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    return () => (
      <div class="mobile-settings">
        <div class="mobile-settings__header">
          <h1 class="mobile-settings__title">设置</h1>
          <p class="mobile-settings__subtitle">管理应用外观、偏好和登录选项</p>
        </div>

        <NCard size="small" bordered={false} class="mobile-settings__nav-card">
          <div class="mobile-settings__anchors">
            {sections.map((section) => (
              <div key={section.key} class="mobile-settings__anchor" onClick={() => scrollToSection(section.key)}>
                <NIcon size={18}>{h(section.icon)}</NIcon>
                <span>{section.title}</span>
              </div>
            ))}
          </div>
        </NCard>

        <div id="mobile-settings-appearance">
          <NCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              <NIcon size={20}>
                <PhMoon />
              </NIcon>
              <span>外观</span>
            </div>
            <NList class="mobile-settings__list">
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__field">
                      <div class="mobile-settings__field-label">主题模式</div>
                      <NRadioGroup
                        size="small"
                        value={settingStore.themes.pattern}
                        onUpdateValue={(value: ThemeEnum) => settingStore.setTheme(value)}>
                        <NRadioButton value={ThemeEnum.LIGHT}>浅色</NRadioButton>
                        <NRadioButton value={ThemeEnum.DARK}>深色</NRadioButton>
                        <NRadioButton value={ThemeEnum.OS}>跟随系统</NRadioButton>
                      </NRadioGroup>
                    </div>
                  )
                }}
              </NListItem>
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__field">
                      <div class="mobile-settings__field-label">菜单展示</div>
                      <NRadioGroup
                        size="small"
                        value={settingStore.showMode}
                        onUpdateValue={(value: ShowModeEnum) => setShowMode(value)}>
                        <NRadioButton value={ShowModeEnum.ICON}>图标</NRadioButton>
                        <NRadioButton value={ShowModeEnum.TEXT}>文字</NRadioButton>
                      </NRadioGroup>
                    </div>
                  )
                }}
              </NListItem>
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__field">
                      <div class="mobile-settings__field-label">字体方案</div>
                      <NRadioGroup
                        size="small"
                        value={settingStore.page.fonts}
                        onUpdateValue={(value: string) => setFontScheme(value)}>
                        <NRadioButton value="PingFang">苹方</NRadioButton>
                        <NRadioButton value="System">系统</NRadioButton>
                      </NRadioGroup>
                    </div>
                  )
                }}
              </NListItem>
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__toggle-row">
                      <div class="mobile-settings__toggle-text">
                        <strong>卡片阴影</strong>
                        <span>提升层级识别</span>
                      </div>
                      <NSwitch value={settingStore.page.shadow} onUpdateValue={toggleShadow} />
                    </div>
                  )
                }}
              </NListItem>
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__toggle-row">
                      <div class="mobile-settings__toggle-text">
                        <strong>背景模糊</strong>
                        <span>浮窗质感更接近桌面客户端</span>
                      </div>
                      <NSwitch value={settingStore.page.blur} onUpdateValue={toggleBlur} />
                    </div>
                  )
                }}
              </NListItem>
            </NList>
          </NCard>
        </div>

        <div id="mobile-settings-preferences">
          <NCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              <NIcon size={20}>
                <PhSignIn />
              </NIcon>
              <span>偏好</span>
            </div>
            <NList class="mobile-settings__list">
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__placeholder-row">
                      <strong>语言</strong>
                      <span>开发中</span>
                    </div>
                  )
                }}
              </NListItem>
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__placeholder-row">
                      <strong>时区</strong>
                      <span>开发中</span>
                    </div>
                  )
                }}
              </NListItem>
            </NList>
          </NCard>
        </div>

        <div id="mobile-settings-login">
          <NCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              <NIcon size={20}>
                <PhSignIn />
              </NIcon>
              <span>登录</span>
            </div>
            <NList class="mobile-settings__list">
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__toggle-row">
                      <div class="mobile-settings__toggle-text">
                        <strong>自动登录</strong>
                        <span>启动后复用本地登录状态</span>
                      </div>
                      <NSwitch value={settingStore.login.autoLogin} onUpdateValue={toggleAutoLogin} />
                    </div>
                  )
                }}
              </NListItem>
            </NList>
          </NCard>
        </div>

        <div id="mobile-settings-about">
          <NCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              <NIcon size={20}>
                <PhSignIn />
              </NIcon>
              <span>关于</span>
            </div>
            <NList class="mobile-settings__list">
              <NListItem class="mobile-settings__list-item">
                {{
                  default: () => (
                    <div class="mobile-settings__placeholder-row">
                      <strong>应用版本</strong>
                      <span>星光 Odyssey v0.1.0</span>
                    </div>
                  )
                }}
              </NListItem>
            </NList>
          </NCard>
        </div>

        <div id="mobile-settings-reset">
          <NCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              <NIcon size={20}>
                <PhArrowsClockwise />
              </NIcon>
              <span>重置</span>
            </div>
            <div class="mobile-settings__reset-area">
              <p class="mobile-settings__reset-desc">将所有设置恢复为默认值</p>
              <NButton type="warning" block onClick={openResetConfirm}>
                恢复默认设置
              </NButton>
            </div>
          </NCard>
        </div>

        <NModal
          v-model:show={showResetConfirm.value}
          preset="dialog"
          title="确认重置"
          positive-text="确认重置"
          negative-text="取消"
          type="warning"
          onPositiveClick={handleResetDefaults}
          onNegativeClick={closeResetConfirm}
          onUpdateShow={(v: boolean) => {
            showResetConfirm.value = v
          }}>
          此操作将把所有设置恢复为默认值，包括主题、字体、菜单展示等。确定要继续吗？
        </NModal>
      </div>
    )
  }
})
