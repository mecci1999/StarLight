import { defineComponent } from 'vue'
import { NCard } from 'naive-ui'

export default defineComponent({
  name: 'StepLayout',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' }
  },
  setup(props, { slots }) {
    return () => (
      <div class="step-layout">
        <div class="step-guide">
          <h1>{props.title}</h1>
          <p class="description">{props.description}</p>
          <div class="guide-content">{slots.guide?.()}</div>
        </div>
        <div class="step-content">
          <NCard class="content-card" bordered={false}>
            {slots.default?.()}
          </NCard>
        </div>
      </div>
    )
  }
})
