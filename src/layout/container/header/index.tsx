import { NInput, NIcon, NBadge, NAvatar, NPopover, NButton, NDivider, NTag } from 'naive-ui'
import { SearchOutline, NotificationsOutline, LogOutOutline, ChevronDownOutline } from '@vicons/ionicons5'
import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '@/api/auth'
import { clearStoredAuthSession, getMetricsDatasetScopeLabel, getStoredUserInfo } from '@/services/authSession'
import './index.scss'

export default defineComponent({
  name: 'ContainerHeader',
  setup() {
    const router = useRouter()
    const searchValue = ref('')
    const showUserPopover = ref(false)
    const userInfo = computed(() => {
      const stored = getStoredUserInfo() || {}
      return {
        name: stored.nickName || stored.email || 'StarLight User',
        email: stored.email || '未绑定邮箱',
        avatar: stored.avatar || '',
        role: stored.isAdmin ? '管理员' : '普通用户',
        scopeLabel: getMetricsDatasetScopeLabel(stored)
      }
    })

    const unreadCount = ref(3)

    const handleSearch = () => {
      if (searchValue.value.trim()) {
        console.log('Context Search:', searchValue.value)
      }
    }

    const handleLogout = async () => {
      try {
        await logout()
      } catch (error) {
        console.error('Logout request failed:', error)
      }
      clearStoredAuthSession()
      showUserPopover.value = false
      await router.replace('/login')
    }

    const renderUserPopover = () => {
      return (
        <div class="user-popover">
          <div class="user-info">
            <NAvatar size={48} round class="user-avatar-large">
              {userInfo.value.name.charAt(0)}
            </NAvatar>
            <div class="user-details">
              <div class="user-name">{userInfo.value.name}</div>
              <div class="user-email">{userInfo.value.email}</div>
              <div class="user-tags-row">
                <span class="user-role">{userInfo.value.role}</span>
                <NTag size="small" bordered={false} type="info">
                  {userInfo.value.scopeLabel}
                </NTag>
              </div>
            </div>
          </div>
          <NDivider class="popover-divider" />
          <div class="user-meta-row">
            <span class="meta-label">当前视角</span>
            <NTag size="small" bordered={false} type="info">
              {userInfo.value.scopeLabel}
            </NTag>
          </div>
          <div class="user-actions">
            <NButton text class="action-btn logout-btn" onClick={handleLogout}>
              {{
                icon: () => (
                  <NIcon class="action-icon">
                    <LogOutOutline />
                  </NIcon>
                ),
                default: () => '退出登录'
              }}
            </NButton>
          </div>
        </div>
      )
    }

    return () => (
      <div class="container-header" data-tauri-drag-region>
        <div class="header-side header-side-left" data-tauri-drag-region></div>

        <div class="search-section no-drag">
          <div class="search-input">
            <NInput
              v-model:value={searchValue.value}
              placeholder="搜索服务、日志或链路（示例：service:web env:prod）..."
              onKeyup={(e: KeyboardEvent) => e.key === 'Enter' && handleSearch()}>
              {{
                prefix: () => (
                  <NIcon size={18} class="search-icon">
                    <SearchOutline />
                  </NIcon>
                )
              }}
            </NInput>
          </div>
        </div>

        <div class="actions-section no-drag">
          <div class="notification-wrapper">
            <NBadge value={unreadCount.value} max={99} dot>
              <NButton text class="action-button">
                <NIcon size={18}>
                  <NotificationsOutline />
                </NIcon>
              </NButton>
            </NBadge>
          </div>

          <div class="user-wrapper">
            <NPopover
              trigger="click"
              placement="bottom-end"
              show={showUserPopover.value}
              onUpdateShow={(v) => (showUserPopover.value = v)}
              displayDirective="show"
              z-index={1000}>
              {{
                trigger: () => (
                  <div class="user-trigger">
                    <NAvatar size={28} round class="user-trigger__avatar">
                      {userInfo.value.name.charAt(0)}
                    </NAvatar>
                    <div class="user-info">
                      <span class="user-name">{userInfo.value.name}</span>
                      <span class="user-email">{userInfo.value.role}</span>
                    </div>
                    <NIcon size={12} class="dropdown-icon">
                      <ChevronDownOutline />
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
