import './MobileUI.scss'

export interface MobileSectionAction {
  label: string
  onClick: () => void
}

export interface MobileSectionProps {
  title?: string
  action?: MobileSectionAction
}

export default defineComponent({
  name: 'MobileSection',
  props: {
    title: { type: String, default: '' },
    action: { type: Object as PropType<MobileSectionAction>, default: null }
  },
  setup(props, { slots }) {
    return () => (
      <div class="mobile-section">
        {(props.title || props.action) && (
          <div class="mobile-section__header">
            {props.title && <span class="mobile-section__title">{props.title}</span>}
            {props.action && (
              <button class="mobile-section__action" onClick={props.action.onClick}>
                {props.action.label}
              </button>
            )}
          </div>
        )}
        {slots.default?.()}
      </div>
    )
  }
})
