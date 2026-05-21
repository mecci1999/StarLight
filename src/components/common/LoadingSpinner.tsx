import logoImage from '@/assets/images/avatar/star_1.svg'
import { NFlex, NProgress, NSpin } from 'naive-ui'
import { defineComponent } from 'vue'
import './LoadingSpinner.scss'

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
      <div data-tauri-drag-region class="loading-spinner">
        <div class="loading-spinner__content">
          {/* Logo Area */}
          <div class="loading-spinner__logo-wrap">
            {/* Glow effect behind logo */}
            <div class="loading-spinner__glow" />
            <div class="loading-spinner__logo-card">
              <img src={logoImage} class="loading-spinner__logo" alt="Logo" />
            </div>
          </div>

          <div class="loading-spinner__progress">
            {/* Progress Bar */}
            <div class="loading-spinner__progress-track">
              <NProgress
                type="line"
                showIndicator={false}
                color="var(--color-primary-6)"
                railColor="var(--color-fill-2)"
                percentage={props.percentage}
                height={6}
                processing
                class="loading-spinner__progress-bar"
              />
            </div>

            {/* Status Text */}
            <div class="loading-spinner__status">
              {props.percentage < 100 && <NSpin size={16} stroke="var(--color-primary-6)" />}
              <span class="loading-spinner__status-text">{props.loadingText}</span>
              {props.percentage > 0 && (
                <span class="loading-spinner__status-badge">{Math.round(props.percentage)}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
})
