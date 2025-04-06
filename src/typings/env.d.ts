/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 服务端项目地址
  readonly VITE_SERVICE_URL: string
  // 项目名称
  readonly VITE_APP_NAME: string
  // 项目标题
  readonly VITE_APP_TITLE: string
  // 是否开启打包文件大小结果分析
  readonly VITE_VISUALIZER?: 'Y' | 'N'
  // 是否开启打包压缩
  readonly VITE_COMPRESS?: 'Y' | 'N'
  // 压缩算法类型
  readonly VITE_COMPRESS_TYPE?: 'gzip' | 'brotliCompress' | 'deflate' | 'deflateRaw'
  // 密码加密密钥
  readonly PASSWORD_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**使用 window.$message 来调用 Message 组件的方法。由于 TypeScript 编译器无法识别全局变量 $message 的类型，
我们可以使用 if (window.$message) 来进行判断，避免出现类型错误。*/
declare interface Window {
  $message: ReturnType<typeof useMessage>
  $notification: ReturnType<typeof useNotification>
  $loadingBar: ReturnType<typeof useLoadingBar>
  $dialog: ReturnType<typeof useDialog>
  $modal: ReturnType<typeof useModal>
}
