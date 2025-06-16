import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import WindowActionBar from '@/components/WindowActionBar'
import ContainerTabs from './tabs'
import Header from './header/index'

export default defineComponent({
  name: 'HomeContainer',
  setup(props, { slots }) {
    return () => (
      <div class="flex-1 h-full bg-[--color-bg-1] overflow-hidden" data-tauri-drag-region>
        {/* 窗口顶部操作栏 */}
        <WindowActionBar maxW={true} shrink={false} showSlot>
          {{
            default: () => {
              // 顶部操作栏 包括搜索框 消息通知 头像等'
              return <Header />
            }
          }}
        </WindowActionBar>
        {/* 二级菜单页签 */}
        <ContainerTabs />
        {/* 主内容区域 */}
        <div class="flex-1 overflow-hidden">
          <RouterView />
        </div>
      </div>
    )
  }
})
