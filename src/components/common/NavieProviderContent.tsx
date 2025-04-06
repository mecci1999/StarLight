export default defineComponent({
  name: 'NavieProviderContent',
  setup(props, { slots }) {
    window.$loadingBar = useLoadingBar()
    window.$dialog = useDialog()
    window.$message = useMessage()
    window.$notification = useNotification()
    window.$modal = useModal()

    return () => <div></div>
  }
})
