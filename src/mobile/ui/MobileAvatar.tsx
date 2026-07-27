import { Image } from 'vant'
import './MobileUI.scss'

export interface MobileAvatarProps {
  src?: string
  size?: number | string
  alt?: string
  onClick?: (event: MouseEvent) => void
}

export default defineComponent({
  name: 'MobileAvatar',
  props: {
    src: { type: String, default: '' },
    size: { type: [Number, String], default: 44 },
    alt: { type: String, default: '' },
    onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: null }
  },
  setup(props, { slots }) {
    const sizeStyle = computed(() => {
      const px = typeof props.size === 'number' ? `${props.size}px` : props.size
      return {
        width: px,
        height: px,
        minWidth: px,
        minHeight: px
      }
    })

    return () => (
      <div class="mobile-avatar" style={sizeStyle.value} onClick={props.onClick}>
        {props.src ? (
          <Image
            width={sizeStyle.value.width}
            height={sizeStyle.value.height}
            fit="cover"
            src={props.src}
            round
            alt={props.alt}
          />
        ) : (
          slots.fallback?.() || (
            <span class="mobile-avatar__fallback">{props.alt?.charAt(0)?.toUpperCase() || '?'}</span>
          )
        )}
      </div>
    )
  }
})
