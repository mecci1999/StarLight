import { NInput, NIcon, NBadge, NAvatar, NPopover, NButton, NCard, NDivider } from 'naive-ui'
import {
  SearchOutline,
  NotificationsOutline,
  PersonOutline,
  SettingsOutline,
  LogOutOutline,
  ChevronDownOutline
} from '@vicons/ionicons5'
import { defineComponent, ref, h } from 'vue'
import { useRouter } from 'vue-router'
import './index.scss'

export default defineComponent({
  name: 'ContainerHeader',
  setup() {
    const router = useRouter()
    const searchValue = ref('')
    const showUserPopover = ref(false)

    // 模拟用户信息
    const userInfo = {
      name: '张三',
      email: 'zhangsan@example.com',
      avatar: '',
      role: '系统管理员'
    }

    // 模拟未读消息数量
    const unreadCount = ref(5)

    // 处理搜索
    const handleSearch = () => {
      if (searchValue.value.trim()) {
        console.log('搜索:', searchValue.value)
        // 这里可以实现搜索逻辑
      }
    }

    // 处理消息通知点击
    const handleNotificationClick = () => {
      console.log('查看消息通知')
      // 这里可以跳转到消息页面或显示消息列表
    }

    // 进入设置页面
    const goToSettings = () => {
      router.push('/home/system-settings')
      showUserPopover.value = false
    }

    // 退出登录
    const handleLogout = () => {
      console.log('退出登录')
      // 这里可以实现退出登录逻辑
      showUserPopover.value = false
    }

    // 渲染用户头像弹窗内容
    const renderUserPopover = () => {
      return (
        <div class="user-popover">
          <div class="user-info">
            <NAvatar size={48} src={userInfo.avatar} fallbackSrc="" class="user-avatar-large">
              {userInfo.avatar ? null : userInfo.name.charAt(0)}
            </NAvatar>
            <div class="user-details">
              <div class="user-name">{userInfo.name}</div>
              <div class="user-email">{userInfo.email}</div>
              <div class="user-role">{userInfo.role}</div>
            </div>
          </div>

          <NDivider class="popover-divider" />

          <div class="user-actions">
            <NButton text class="action-btn" onClick={goToSettings}>
              <NIcon size={16} class="action-icon">
                {h(SettingsOutline)}
              </NIcon>
              <span>系统设置</span>
            </NButton>

            <NButton text class="action-btn logout-btn" onClick={handleLogout}>
              <NIcon size={16} class="action-icon">
                {h(LogOutOutline)}
              </NIcon>
              <span>退出登录</span>
            </NButton>
          </div>
        </div>
      )
    }

    return () => (
      <div class="container-header select-none" data-tauri-drag-region>
        {/* 搜索框 */}
        <div class="search-section">
          <NInput
            v-model:value={searchValue.value}
            placeholder="搜索服务、指标、日志..."
            class="search-input h-28px"
            onKeyup={(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}>
            {{
              prefix: () => (
                <NIcon size={16} class="search-icon">
                  {h(SearchOutline)}
                </NIcon>
              )
            }}
          </NInput>
        </div>

        {/* 右侧操作区 */}
        <div class="actions-section">
          {/* 消息通知 */}
          <div class="notification-wrapper">
            <NBadge value={unreadCount.value} max={99} show={unreadCount.value > 0}>
              <NButton text class="action-button notification-btn" onClick={handleNotificationClick}>
                <NIcon size={18}>{h(NotificationsOutline)}</NIcon>
              </NButton>
            </NBadge>
          </div>

          {/* 用户头像 */}
          <div class="user-wrapper">
            <NPopover
              trigger="click"
              placement="bottom-end"
              show={showUserPopover.value}
              onUpdateShow={(show: boolean) => {
                showUserPopover.value = show
              }}>
              {{
                trigger: () => (
                  <div class="user-trigger">
                    <NAvatar size={32} src={userInfo.avatar} fallbackSrc="" class="user-avatar">
                      {userInfo.avatar ? null : userInfo.name.charAt(0)}
                    </NAvatar>
                    <NIcon size={12} class="dropdown-icon">
                      {h(ChevronDownOutline)}
                    </NIcon>
                  </div>
                ),
                default: renderUserPopover
              }}
            </NPopover>
          </div>
        </div>
      </div>
    )
  }
})
