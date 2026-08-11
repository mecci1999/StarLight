import { defineComponent, ref, h, computed } from 'vue'
import {
  MobileButton,
  MobileCard,
  MobileList,
  MobileListItem,
  MobileSheet,
  MobileRadio,
  MobileSwitch
} from '@/mobile/ui'
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from '@tauri-apps/api/core'
import { PhSignIn, PhMoon, PhArrowsClockwise } from '@phosphor-icons/vue'
import { mobileFeedback } from '@/mobile/services/mobileFeedback'
import {
  getClientNotificationPermission,
  canOpenClientNotificationSettings,
  openClientNotificationSettings,
  requestClientNotificationPermission,
  type ClientNotificationNativePermissionStatus
} from '@/services/clientNotifications'
import { useSettingStore } from '@/store/setting'
import { ShowModeEnum, ThemeEnum } from '@/types/enums'
import pkg from '~/package.json'
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
    const appVersion = ref(pkg.version)
    const notificationPermission = ref<ClientNotificationNativePermissionStatus>('not-requested')
    const notificationPermissionLoading = ref(false)
    const activeThemeLabel = computed(() => {
      if (settingStore.themes.pattern === ThemeEnum.OS) {
        return settingStore.themes.content === ThemeEnum.DARK ? '深色' : '浅色'
      }
      return settingStore.themes.content === ThemeEnum.DARK ? '深色' : '浅色'
    })

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

    const notificationPermissionLabel = computed(() => {
      const labels: Record<ClientNotificationNativePermissionStatus, string> = {
        'not-requested': '未请求',
        granted: '已允许',
        default: '未决定',
        denied: '未允许',
        'check-failed': '暂时无法确认',
        'request-failed': '请求未完成'
      }
      return labels[notificationPermission.value]
    })

    const notificationPermissionActionLabel = computed(() => {
      if (notificationPermission.value === 'granted') return '已开启'
      if (notificationPermission.value === 'denied' && canOpenClientNotificationSettings()) return '前往系统设置'
      if (notificationPermission.value === 'check-failed' || notificationPermission.value === 'request-failed')
        return '重试'
      return '开启通知'
    })

    const requestNotificationPermission = async () => {
      notificationPermissionLoading.value = true
      const result = await requestClientNotificationPermission()
      notificationPermission.value = result.status
      notificationPermissionLoading.value = false

      if (result.status === 'granted') {
        mobileFeedback.success('系统通知已开启')
        return
      }
      if (result.status === 'denied') {
        mobileFeedback.warning('系统通知未开启，应用内通知仍会正常显示')
        return
      }
      mobileFeedback.warning('暂时无法开启系统通知，应用内通知仍会正常显示')
    }

    const handleNotificationPermissionAction = async () => {
      if (notificationPermission.value !== 'denied' || !canOpenClientNotificationSettings()) {
        await requestNotificationPermission()
        return
      }

      notificationPermissionLoading.value = true
      const opened = await openClientNotificationSettings()
      notificationPermissionLoading.value = false
      if (!opened) mobileFeedback.warning('无法打开系统设置，请稍后重试，应用内通知仍会正常显示')
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

    onMounted(async () => {
      try {
        if (isTauri()) appVersion.value = await getVersion()
      } catch {
        appVersion.value = pkg.version
      }
      notificationPermission.value = (await getClientNotificationPermission()).status
    })

    return () => (
      <div class="mobile-settings">
        <div class="mobile-settings__header">
          <h1 class="mobile-settings__title">设置</h1>
          <p class="mobile-settings__subtitle">管理应用外观、偏好和登录选项</p>
        </div>

        <MobileCard size="small" bordered={false} class="mobile-settings__nav-card">
          <div class="mobile-settings__anchors">
            {sections.map((section) => (
              <button
                type="button"
                key={section.key}
                class="mobile-settings__anchor"
                onClick={() => scrollToSection(section.key)}>
                {h(section.icon, { size: 18 })}
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </MobileCard>

        <div id="mobile-settings-appearance">
          <MobileCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              {h(PhMoon, { size: 20 })}
              <span>外观</span>
            </div>
            <MobileList class="mobile-settings__list">
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__field">
                  <div class="mobile-settings__field-label">
                    <span>主题模式</span>
                    {settingStore.themes.pattern === ThemeEnum.OS && (
                      <small>跟随系统 · 当前{activeThemeLabel.value}</small>
                    )}
                  </div>
                  <MobileRadio
                    modelValue={settingStore.themes.pattern}
                    onUpdate:modelValue={(value: ThemeEnum) => settingStore.setTheme(value)}
                    direction="horizontal"
                    options={[
                      { label: '浅色', value: ThemeEnum.LIGHT },
                      { label: '深色', value: ThemeEnum.DARK },
                      { label: '跟随系统', value: ThemeEnum.OS }
                    ]}
                  />
                </div>
              </MobileListItem>
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__field">
                  <div class="mobile-settings__field-label">菜单展示</div>
                  <MobileRadio
                    modelValue={settingStore.showMode}
                    onUpdate:modelValue={(value: ShowModeEnum) => setShowMode(value)}
                    direction="horizontal"
                    options={[
                      { label: '图标', value: ShowModeEnum.ICON },
                      { label: '文字', value: ShowModeEnum.TEXT }
                    ]}
                  />
                </div>
              </MobileListItem>
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__field">
                  <div class="mobile-settings__field-label">字体方案</div>
                  <MobileRadio
                    modelValue={settingStore.page.fonts}
                    onUpdate:modelValue={(value: string) => setFontScheme(value)}
                    direction="horizontal"
                    options={[
                      { label: '苹方', value: 'PingFang' },
                      { label: '系统', value: 'System' }
                    ]}
                  />
                </div>
              </MobileListItem>
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__toggle-row">
                  <div class="mobile-settings__toggle-text">
                    <strong>卡片阴影</strong>
                    <span>提升层级识别</span>
                  </div>
                  <MobileSwitch modelValue={settingStore.page.shadow} onUpdate:modelValue={toggleShadow} />
                </div>
              </MobileListItem>
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__toggle-row">
                  <div class="mobile-settings__toggle-text">
                    <strong>背景模糊</strong>
                    <span>浮窗质感更接近桌面客户端</span>
                  </div>
                  <MobileSwitch modelValue={settingStore.page.blur} onUpdate:modelValue={toggleBlur} />
                </div>
              </MobileListItem>
            </MobileList>
          </MobileCard>
        </div>

        <div id="mobile-settings-preferences">
          <MobileCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              {h(PhSignIn, { size: 20 })}
              <span>偏好</span>
            </div>
            <MobileList class="mobile-settings__list">
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__placeholder-row">
                  <strong>语言</strong>
                  <span>开发中</span>
                </div>
              </MobileListItem>
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__placeholder-row">
                  <strong>时区</strong>
                  <span>开发中</span>
                </div>
              </MobileListItem>
            </MobileList>
          </MobileCard>
        </div>

        <div id="mobile-settings-login">
          <MobileCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              {h(PhSignIn, { size: 20 })}
              <span>登录</span>
            </div>
            <MobileList class="mobile-settings__list">
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__toggle-row">
                  <div class="mobile-settings__toggle-text">
                    <strong>自动登录</strong>
                    <span>启动后复用本地登录状态</span>
                  </div>
                  <MobileSwitch modelValue={settingStore.login.autoLogin} onUpdate:modelValue={toggleAutoLogin} />
                </div>
              </MobileListItem>
            </MobileList>
          </MobileCard>
        </div>

        <div id="mobile-settings-about">
          <MobileCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              {h(PhSignIn, { size: 20 })}
              <span>关于</span>
            </div>
            <MobileList class="mobile-settings__list">
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__version-row">
                  <span class="mobile-settings__version-label">应用版本</span>
                  <output class="mobile-settings__version-value" aria-label={`当前应用版本 ${appVersion.value}`}>
                    v{appVersion.value}
                  </output>
                </div>
              </MobileListItem>
              <MobileListItem class="mobile-settings__list-item">
                <div class="mobile-settings__notification-row">
                  <div class="mobile-settings__toggle-text">
                    <strong>系统通知</strong>
                    <span>状态：{notificationPermissionLabel.value}，应用内通知始终可用</span>
                  </div>
                  <MobileButton
                    size="small"
                    type="primary"
                    loading={notificationPermissionLoading.value}
                    disabled={notificationPermission.value === 'granted'}
                    onClick={handleNotificationPermissionAction}>
                    {notificationPermissionActionLabel.value}
                  </MobileButton>
                </div>
              </MobileListItem>
            </MobileList>
          </MobileCard>
        </div>

        <div id="mobile-settings-reset">
          <MobileCard size="small" bordered={false} class="mobile-settings__section-card">
            <div class="mobile-settings__section-header">
              {h(PhArrowsClockwise, { size: 20 })}
              <span>重置</span>
            </div>
            <div class="mobile-settings__reset-area">
              <p class="mobile-settings__reset-desc">将所有设置恢复为默认值</p>
              <MobileButton type="danger" block onClick={openResetConfirm}>
                恢复默认设置
              </MobileButton>
            </div>
          </MobileCard>
        </div>

        <MobileSheet
          show={showResetConfirm.value}
          onUpdate:show={(v: boolean) => {
            showResetConfirm.value = v
          }}
          position="bottom">
          <div class="mobile-settings__reset-sheet">
            <h3>确认重置</h3>
            <p>此操作将把所有设置恢复为默认值，包括主题、字体、菜单展示等。确定要继续吗？</p>
            <div class="mobile-settings__reset-actions">
              <MobileButton type="danger" block onClick={handleResetDefaults}>
                确认重置
              </MobileButton>
              <MobileButton type="ghost" block onClick={closeResetConfirm}>
                取消
              </MobileButton>
            </div>
          </div>
        </MobileSheet>
      </div>
    )
  }
})
