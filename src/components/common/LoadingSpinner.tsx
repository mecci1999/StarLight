import logoImage from '@/assets/images/avatar/star_1.svg'
import { NFlex, NProgress, NSpin } from 'naive-ui'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LoadingSpinner',
  props: {
    percentage: {
      type: Number,
      default: 0
    },
    loadingText: {
      type: String,
      default: 'Loading...'
    }
  },
  setup(props) {
    return () => (
      <div data-tauri-drag-region class="flex items-center justify-center size-full bg-[--color-bg-1]">
        <div class="flex flex-col items-center gap-32px">
          {/* Logo Area */}
          <div class="relative flex items-center justify-center">
            {/* Glow effect behind logo */}
            <div class="absolute w-80px h-80px bg-[--color-primary-6] opacity-20 blur-20px rounded-full animate-pulse" />
            <div class="relative z-10 p-16px bg-[--color-bg-2] rounded-24px shadow-sm border border-[--color-border-1]">
              <img src={logoImage} class="w-64px h-64px object-contain" alt="Logo" />
            </div>
          </div>

          <div class="w-280px flex flex-col gap-16px">
            {/* Progress Bar */}
            <div class="flex flex-col gap-8px">
              <NProgress
                type="line"
                showIndicator={false}
                color="var(--color-primary-6)"
                railColor="var(--color-fill-2)"
                percentage={props.percentage}
                height={6}
                processing
                class="rounded-full overflow-hidden"
              />
            </div>

            {/* Status Text */}
            <div class="flex items-center justify-center gap-8px">
              {props.percentage < 100 && <NSpin size={16} stroke="var(--color-primary-6)" />}
              <span class="text-15px text-[--color-text-2] font-medium tracking-wide">{props.loadingText}</span>
              {props.percentage > 0 && (
                <span class="text-12px text-[--color-text-3] font-mono bg-[--color-fill-2] px-6px py-2px rounded-4px">
                  {Math.round(props.percentage)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
})
