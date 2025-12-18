import { NIcon } from 'naive-ui'

export default defineComponent({
  name: 'SectionHeader',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    icon: { type: Object, required: false }
  },
  setup(props) {
    return () => (
      <div class="section-header">
        <div class="section-header-main">
          {props.icon ? (
            <NIcon size={22} class="mr-8px">
              {h(props.icon as any)}
            </NIcon>
          ) : null}
          <h1 class="section-title">{props.title}</h1>
        </div>
        {props.subtitle ? <p class="section-subtitle">{props.subtitle}</p> : null}
      </div>
    )
  }
})
