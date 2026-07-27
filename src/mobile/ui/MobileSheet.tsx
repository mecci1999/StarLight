import { Popup } from 'vant'
import type { PopupPosition } from 'vant'
import './MobileUI.scss'

export interface MobileSheetProps {
  show?: boolean
  position?: PopupPosition
  title?: string
  round?: boolean
  closeable?: boolean
  closeOnClickOverlay?: boolean
  safeAreaInsetBottom?: boolean
}

export default defineComponent({
  name: 'MobileSheet',
  props: {
    show: { type: Boolean, default: false },
    position: { type: String as PropType<PopupPosition>, default: 'bottom' },
    title: { type: String, default: '' },
    round: { type: Boolean, default: true },
    closeable: { type: Boolean, default: true },
    closeOnClickOverlay: { type: Boolean, default: true },
    safeAreaInsetBottom: { type: Boolean, default: true }
  },
  emits: ['update:show'],
  setup(props, { slots, emit }) {
    const handleUpdateShow = (show: boolean) => {
      emit('update:show', show)
    }

    const popupClass = computed(() => [
      'mobile-sheet',
      `mobile-sheet--${props.position}`,
      props.round && 'mobile-sheet--round'
    ])

    return () => (
      <Popup
        show={props.show}
        onUpdate:show={handleUpdateShow}
        position={props.position}
        round={props.round}
        closeable={false}
        closeOnClickOverlay={props.closeOnClickOverlay}
        safeAreaInsetBottom={props.safeAreaInsetBottom}
        overlayClass="mobile-sheet__overlay"
        class={popupClass.value}
        v-slots={{
          default: () => (
            <>
              {(props.title || slots.header) && (
                <div class="mobile-sheet__header">
                  {slots.header ? slots.header() : <span class="mobile-sheet__title">{props.title}</span>}
                  {props.closeable && (
                    <button class="mobile-sheet__close" onClick={() => handleUpdateShow(false)} aria-label="关闭">
                      ✕
                    </button>
                  )}
                </div>
              )}
              <div class="mobile-sheet__body">{slots.default?.()}</div>
            </>
          )
        }}
      />
    )
  }
})
