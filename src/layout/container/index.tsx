import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import WindowActionBar from '@/components/WindowActionBar'
import ContainerTabs from './tabs'
import Header from './header/index'
import './index.scss'

export default defineComponent({
  name: 'HomeContainer',
  setup(props, { slots }) {
    return () => (
      <section class="flex flex-col flex-1 h-full bg-[--color-bg-1]" data-tauri-drag-region>
        {/* 窗口顶部操作栏 */}
        <WindowActionBar maxW={true} shrink={false} showSlot>
          {{
            default: () => {
              return (
                <div class="flex-1 flex h-full items-center">
                  {/* 二级菜单页签 */}
                  <ContainerTabs />
                  {/* 顶部操作栏 包括搜索框 消息通知 头像等 */}
                  <Header />
                </div>
              )
            }
          }}
        </WindowActionBar>
        {/* 主内容区域 */}
        <main class="service-main flex-1 overflow-hidden">
          <RouterView />
        </main>
      </section>
    )
  }
})
