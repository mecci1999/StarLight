import { defineComponent } from 'vue'
import { NSpace, NText } from 'naive-ui'
import './PageHeader.scss'

export default defineComponent({
  name: 'PageHeader',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    sticky: { type: Boolean, default: false },
    compact: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    return () => (
      <header
        class={[
          'page-header',
          props.compact ? 'page-header--compact' : 'page-header--default',
          props.sticky ? 'page-header--sticky' : ''
        ]}>
        <div>
          <h1 class="page-header__title">{props.title}</h1>
          {props.subtitle && (
            <NText depth={3} class="page-header__subtitle">
              {props.subtitle}
            </NText>
          )}
        </div>
        <NSpace align="center">
          {slots.meta?.()}
          {slots.actions?.()}
          {slots.extra?.()}
        </NSpace>
      </header>
    )
  }
})
