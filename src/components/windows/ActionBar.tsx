export default defineComponent({
  name: 'ActionBar',
  setup(props, { slots }) {
    return () => <div class="action-bar" data-tauri-drag-region></div>
  }
})
