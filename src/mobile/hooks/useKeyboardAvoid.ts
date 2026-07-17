import { onMounted, onUnmounted } from 'vue'

export function useKeyboardAvoid() {
  if (typeof window === 'undefined' || !window.visualViewport) return

  let scrollTimer: ReturnType<typeof setTimeout> | null = null

  const handleViewportResize = () => {
    if (scrollTimer) clearTimeout(scrollTimer)

    scrollTimer = setTimeout(() => {
      const el = document.activeElement as HTMLElement
      if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return

      el.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }, 350)
  }

  onMounted(() => {
    window.visualViewport!.addEventListener('resize', handleViewportResize)
  })

  onUnmounted(() => {
    window.visualViewport?.removeEventListener('resize', handleViewportResize)
    if (scrollTimer) clearTimeout(scrollTimer)
  })
}
