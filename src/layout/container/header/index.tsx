import { NInput, NIcon, NBadge, NAvatar, NPopover, NButton, NDivider, NSelect, NPopselect } from 'naive-ui'
import {
  SearchOutline,
  NotificationsOutline,
  PersonOutline,
  SettingsOutline,
  LogOutOutline,
  ChevronDownOutline,
  TimeOutline
} from '@vicons/ionicons5'
import { defineComponent, ref, h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTimeStore } from '@/store/useTimeStore'
import './index.scss'

export default defineComponent({
  name: 'ContainerHeader',
  setup() {
    const router = useRouter()
    const timeStore = useTimeStore()
    const searchValue = ref('')
    const showUserPopover = ref(false)

    // User info
    const userInfo = {
      name: 'Admin',
      email: 'admin@starlight.com',
      avatar: '',
      role: 'Administrator'
    }

    const unreadCount = ref(3)

    const handleSearch = () => {
      if (searchValue.value.trim()) {
        console.log('Context Search:', searchValue.value)
      }
    }

    const goToSettings = () => {
      router.push('/home/system-settings')
      showUserPopover.value = false
    }

    const handleLogout = () => {
      console.log('Logout')
      showUserPopover.value = false
    }

    const renderUserPopover = () => {
      return (
        <div class="user-popover p-4 w-64">
          <div class="flex items-center gap-3 mb-4">
            <NAvatar size={48} round class="bg-[--color-primary-6] text-white">
              {userInfo.name.charAt(0)}
            </NAvatar>
            <div>
              <div class="font-bold text-[--color-text-1]">{userInfo.name}</div>
              <div class="text-xs text-[--color-text-3]">{userInfo.email}</div>
            </div>
          </div>
          <NDivider class="my-2" />
          <div class="flex flex-col gap-1">
            <NButton text class="justify-start w-full py-2 hover:text-[--color-primary-6]" onClick={goToSettings}>
              <template>
                {{
                  icon: () => (
                    <NIcon>
                      <SettingsOutline />
                    </NIcon>
                  )
                }}
              </template>
              Settings
            </NButton>
            <NButton
              text
              class="justify-start w-full py-2 text-[--color-danger-6] hover:text-[--color-danger-7]"
              onClick={handleLogout}>
              <template>
                {{
                  icon: () => (
                    <NIcon>
                      <LogOutOutline />
                    </NIcon>
                  )
                }}
              </template>
              Logout
            </NButton>
          </div>
        </div>
      )
    }

    return () => (
      <div class="container-header h-14 bg-[--color-bg-2] border-b border-[--color-border-2] flex items-center px-4 justify-between shadow-sm z-10 relative">
        {/* Left: Global Search */}
        <div class="flex-1 max-w-2xl flex items-center gap-4">
          <div class="relative w-full max-w-md group">
            <NInput
              v-model:value={searchValue.value}
              placeholder="Search services, logs, or traces (e.g. service:web env:prod)..."
              class="bg-[--color-fill-2] border-none rounded hover:bg-[--color-fill-3] transition-colors"
              onKeyup={(e: KeyboardEvent) => e.key === 'Enter' && handleSearch()}>
              {{
                prefix: () => (
                  <NIcon size={18} class="text-[--color-text-3] group-hover:text-[--color-primary-6] transition-colors">
                    <SearchOutline />
                  </NIcon>
                )
              }}
            </NInput>
          </div>
        </div>

        {/* Right: Time Picker & User Actions */}
        <div class="flex items-center gap-4">
          {/* Global Time Picker */}
          <div class="w-48">
            <NPopselect
              v-model:value={timeStore.timeRange}
              options={timeStore.timeOptions}
              trigger="click"
              onUpdateValue={(val) => timeStore.setTimeRange(val as any)}>
              <NButton class="w-full justify-between px-3" dashed>
                <div class="flex items-center gap-2">
                  <NIcon class="text-[--color-primary-6]">
                    <TimeOutline />
                  </NIcon>
                  <span class="text-xs font-medium">
                    {timeStore.timeOptions.find((o) => o.value === timeStore.timeRange)?.label}
                  </span>
                </div>
                <NIcon size={12}>
                  <ChevronDownOutline />
                </NIcon>
              </NButton>
            </NPopselect>
          </div>

          <div class="h-6 w-px bg-[--color-border-2] mx-1"></div>

          {/* Notifications */}
          <NBadge value={unreadCount.value} max={99} dot processing>
            <NButton text class="text-[--color-text-2] hover:text-[--color-primary-6] transition-colors">
              <NIcon size={20}>
                <NotificationsOutline />
              </NIcon>
            </NButton>
          </NBadge>

          {/* User Profile */}
          <NPopover
            trigger="click"
            placement="bottom-end"
            show={showUserPopover.value}
            onUpdateShow={(v) => (showUserPopover.value = v)}
            raw
            displayDirective="show">
            {{
              trigger: () => (
                <div class="flex items-center gap-2 cursor-pointer hover:bg-[--color-fill-2] py-1 px-2 rounded transition-colors">
                  <NAvatar size={28} round class="bg-[--color-primary-6] text-white text-xs font-bold">
                    {userInfo.name.charAt(0)}
                  </NAvatar>
                  <NIcon size={12} class="text-[--color-text-3]">
                    <ChevronDownOutline />
                  </NIcon>
                </div>
              ),
              default: renderUserPopover
            }}
          </NPopover>
        </div>
      </div>
    )
  }
})
