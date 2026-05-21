import { defineComponent } from 'vue'
import { NCard, NEmpty, NSpin } from 'naive-ui'
import './PanelCanvas.scss'

export default defineComponent({
  name: 'PanelCanvas',
  props: {
    loading: { type: Boolean, default: false },
    empty: { type: Boolean, default: false },
    emptyDescription: { type: String, default: '当前面板暂无内容' },
    title: { type: String, default: '' }
  },
  setup(props, { slots }) {
    return () => (
      <div class="panel-canvas">
        {props.title ? <div class="panel-canvas__title">{props.title}</div> : null}
        {props.loading ? (
          <div class="panel-canvas__loading">
            <NSpin size="large" />
          </div>
        ) : props.empty ? (
          <NCard bordered={false} class="panel-canvas__empty-card">
            <NEmpty description={props.emptyDescription} class="panel-canvas__empty" />
          </NCard>
        ) : (
          slots.default?.()
        )}
      </div>
    )
  }
})
