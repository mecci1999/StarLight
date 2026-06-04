import { defineComponent } from 'vue'
import { NSpace } from 'naive-ui'
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
        <div class="page-header__main">
          <h1 class="page-header__title">{props.title}</h1>
          {props.subtitle ? <span class="page-header__subtitle">{props.subtitle}</span> : null}
        </div>
        <NSpace class="page-header__actions" align="center">
          {slots.meta?.()}
          {slots.actions?.()}
          {slots.extra?.()}
        </NSpace>
      </header>
    )
  }
})
