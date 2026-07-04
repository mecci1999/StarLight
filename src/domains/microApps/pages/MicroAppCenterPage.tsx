import { defineComponent, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTag,
  NTabs,
  NTabPane,
  useMessage
} from 'naive-ui'
import type { DataTableColumns, TagProps } from 'naive-ui'
import PageHeader from '@/shared/layout/PageHeader'
import { getStoredUserInfo } from '@/services/authSession'
import { resolveUploadedFileUrl, uploadFile } from '@/api/file'
import {
  downloadMicroApp,
  getMicroApps,
  previewDownloadMicroApp,
  publishMicroApp,
  rollbackMicroApp,
  reviewMicroApp,
  updateMicroAppAccess,
  uploadMicroAppPackage,
  type MicroAppItem,
  type MicroAppManifest,
  type MicroAppVisibility,
  type MicroAppVersion
} from '@/api/microApps'
import {
  getInstalledMicroApps,
  installMicroAppLocally,
  prepareMicroAppPreview,
  type InstalledMicroApp
} from '../services/localMicroAppStore'
import { parseMicroAppZip } from '../services/localMicroAppStore'
import './MicroAppCenterPage.scss'

const userListFromText = (value: string) =>
  value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
const MICRO_APP_ICON_SIZE = 256

const releaseChannelLabel: Record<'stable' | 'beta' | 'dev', string> = {
  stable: '正式',
  beta: '灰度',
  dev: '开发'
}

type MicroAppPlatform = 'desktop' | 'app'

const platformOptions: Array<{ label: string; value: 'all' | MicroAppPlatform }> = [
  { label: '全部端', value: 'all' },
  { label: '桌面端', value: 'desktop' },
  { label: 'App 端', value: 'app' }
]

const platformLabel: Record<MicroAppPlatform, string> = {
  desktop: '桌面端',
  app: 'App 端'
}

const microAppVersionStatusLabel: Record<MicroAppVersion['status'], string> = {
  uploaded: '已上传',
  pending_review: '待审核',
  approved: '已审核',
  rejected: '已拒绝',
  published: '已发布',
  deprecated: '已废弃'
}

type AccessForm = {
  visibility: MicroAppVisibility
  allowedUsers: string
  rolloutUsers: string
  rolloutTenants: string
  rolloutPercent: number
  releaseChannel: 'stable' | 'beta' | 'dev'
}

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const readImageSize = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('图片读取失败'))
    }
    image.src = objectUrl
  })

export default defineComponent({
  name: 'MicroAppCenterPage',
  setup() {
    const router = useRouter()
    const message = useMessage()
    const loading = ref(false)
    const apps = ref<MicroAppItem[]>([])
    const installedApps = ref<InstalledMicroApp[]>([])
    const activeTab = ref('market')
    const appKeyword = ref('')
    const platformFilter = ref<'all' | MicroAppPlatform>('all')
    const uploadVisible = ref(false)
    const accessVisible = ref(false)
    const selectedApp = ref<MicroAppItem | null>(null)
    const selectedFileName = ref('')
    const selectedIconName = ref('')
    const iconUploading = ref(false)
    const packageUploading = ref(false)
    const previewLoading = ref(false)
    const packageBase64 = ref('')
    const currentUser = computed(() => getStoredUserInfo())
    const isAdmin = computed(() => Boolean(currentUser.value?.isAdmin))
    const currentUserId = computed(() => currentUser.value?.userId || '')

    const uploadForm = ref({
      appId: '',
      name: '',
      version: '1.0.0',
      entry: 'index.html',
      description: '',
      icon: '',
      iconFileId: '',
      visibility: 'tenant' as MicroAppVisibility,
      allowedUsers: '',
      rolloutUsers: '',
      rolloutTenants: '',
      rolloutPercent: 100,
      releaseChannel: 'stable' as 'stable' | 'beta' | 'dev'
    })

    const accessForm = ref<AccessForm>({
      visibility: 'tenant' as MicroAppVisibility,
      allowedUsers: '',
      rolloutUsers: '',
      rolloutTenants: '',
      rolloutPercent: 100,
      releaseChannel: 'stable' as 'stable' | 'beta' | 'dev'
    })

    const loadApps = async () => {
      loading.value = true
      try {
        apps.value = await getMicroApps()
        installedApps.value = getInstalledMicroApps()
      } finally {
        loading.value = false
      }
    }

    onMounted(loadApps)

    const pendingVersions = computed(() =>
      apps.value
        .flatMap((app) => (app.versions || []).map((version) => ({ app, version })))
        .filter((item) => item.version.status === 'pending_review')
    )

    const approvedVersions = computed(() =>
      apps.value.flatMap((app) => app.versions || []).filter((version) => version.status === 'approved')
    )

    const isStablePublished = (app: MicroAppItem) =>
      Boolean(app.latestPublished && (app.releaseChannel || 'stable') === 'stable')

    const isRolloutVisible = (app: MicroAppItem) => {
      if (!app.latestPublished) return false
      const channel = app.releaseChannel || 'stable'
      if (channel === 'stable') return true
      const userId = currentUserId.value
      if (!userId) return false
      return (app.rolloutUsers || []).includes(userId) || Number(app.rolloutPercent || 0) >= 100
    }

    const getAppPlatforms = (app: MicroAppItem): MicroAppPlatform[] => {
      const permissions = app.latestPublished?.manifest.permissions
      const rawPlatforms =
        permissions && typeof permissions === 'object'
          ? (permissions as Record<string, unknown>).platforms ||
            (permissions as Record<string, unknown>).targetPlatforms
          : undefined
      if (!Array.isArray(rawPlatforms)) return ['desktop', 'app']
      const normalized = rawPlatforms
        .map((item) => String(item).toLowerCase())
        .map((item) => (item === 'mobile' || item === 'ios' || item === 'android' ? 'app' : item))
        .filter((item): item is MicroAppPlatform => item === 'desktop' || item === 'app')
      return normalized.length ? Array.from(new Set(normalized)) : ['desktop', 'app']
    }

    const matchesKeyword = (app: MicroAppItem) => {
      const keyword = appKeyword.value.trim().toLowerCase()
      if (!keyword) return true
      return [app.name, app.appId, app.description, app.latestPublished?.manifest.description]
        .filter((item): item is string => Boolean(item))
        .some((item) => item.toLowerCase().includes(keyword))
    }

    const visibleApps = computed(() =>
      apps.value.filter((app) => {
        if (isAdmin.value && isStablePublished(app)) return true
        return isRolloutVisible(app)
      })
    )

    const filteredVisibleApps = computed(() =>
      visibleApps.value.filter((app) => {
        const platformMatched = platformFilter.value === 'all' || getAppPlatforms(app).includes(platformFilter.value)
        return platformMatched && matchesKeyword(app)
      })
    )

    const myApps = computed(() => apps.value.filter((app) => app.ownerUserId === currentUserId.value))

    const adminApps = computed(() => apps.value)

    const overviewItems = computed(() => [
      {
        label: '可用应用',
        value: visibleApps.value.length,
        note: isAdmin.value ? '正式发布应用管理员可直接打开' : '可下载并进入的微应用'
      },
      { label: '我的上传', value: myApps.value.length, note: '查看自己提交的审核状态' },
      { label: '本地已安装', value: installedApps.value.length, note: '支持返回和切换已打开应用' },
      {
        label: isAdmin.value ? '待治理版本' : '灰度应用',
        value: isAdmin.value
          ? pendingVersions.value.length
          : visibleApps.value.filter((app) => (app.releaseChannel || 'stable') !== 'stable').length,
        note: isAdmin.value ? '仅管理员处理审核发布' : '只展示命中灰度范围的应用'
      }
    ])

    const openUpload = () => {
      selectedFileName.value = ''
      selectedIconName.value = ''
      packageBase64.value = ''
      uploadForm.value = {
        ...uploadForm.value,
        icon: '',
        iconFileId: ''
      }
      uploadVisible.value = true
    }

    const handleIconChange = async (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (!file) return
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        message.error('请上传 PNG、JPG 或 WebP 格式的应用图标')
        input.value = ''
        return
      }
      const size = await readImageSize(file)
      if (size.width !== MICRO_APP_ICON_SIZE || size.height !== MICRO_APP_ICON_SIZE) {
        message.error(`应用图标必须是 ${MICRO_APP_ICON_SIZE}×${MICRO_APP_ICON_SIZE}px 正方形图片`)
        input.value = ''
        return
      }
      iconUploading.value = true
      try {
        const uploaded = await uploadFile({
          scene: 'micro-app-icon',
          bizType: 'micro-app',
          bizId: uploadForm.value.appId || undefined,
          fileName: file.name,
          mimeType: file.type,
          fileBase64: await readFileAsBase64(file),
          metadata: { width: size.width, height: size.height, expectedSize: MICRO_APP_ICON_SIZE }
        })
        uploadForm.value.icon = resolveUploadedFileUrl(uploaded)
        uploadForm.value.iconFileId = uploaded.fileId || uploaded.objectKey || ''
        selectedIconName.value = file.name
        message.success('应用图标已上传')
      } finally {
        iconUploading.value = false
      }
    }

    const handleFileChange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (!file.name.endsWith('.zip')) {
        message.error('请上传 .zip 格式的 H5 dist 包')
        return
      }
      selectedFileName.value = file.name
      packageBase64.value = await readFileAsBase64(file)
      try {
        const parsed = parseMicroAppZip(packageBase64.value)
        uploadForm.value = {
          ...uploadForm.value,
          appId: parsed.manifest.appId,
          name: parsed.manifest.name,
          version: parsed.manifest.version,
          entry: parsed.manifest.entry,
          description: parsed.manifest.description || uploadForm.value.description
        }
        message.success('已解析 manifest.json')
      } catch (error) {
        packageBase64.value = ''
        message.error(error instanceof Error ? error.message : 'zip 包解析失败')
      }
    }

    const buildPreviewPayload = (manifest: MicroAppManifest, version?: MicroAppVersion) => ({
      ticket: '',
      user: currentUser.value,
      app: {
        appId: manifest.appId,
        name: manifest.name,
        description: manifest.description,
        preview: true
      },
      version: version || {
        appId: manifest.appId,
        version: manifest.version,
        manifest,
        status: 'uploaded',
        packageSha256: 'preview',
        packageSize: 0
      },
      endpoints: {
        exchangeSession: '',
        scopedApi: ''
      },
      previewMode: true
    })

    const openPreview = async (base64: string, manifest: MicroAppManifest, version?: MicroAppVersion) => {
      const record = await prepareMicroAppPreview(base64, manifest, buildPreviewPayload(manifest, version))
      uploadVisible.value = false
      await router.push({
        path: `/home/micro-apps/${record.key}`,
        query: { preview: '1', previewKey: record.key, title: record.title }
      })
    }

    const previewSelectedPackage = async () => {
      if (!packageBase64.value) {
        message.error('请先选择微应用 zip 包')
        return
      }
      previewLoading.value = true
      try {
        const parsed = parseMicroAppZip(packageBase64.value)
        await openPreview(packageBase64.value, parsed.manifest)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '微应用预览失败')
      } finally {
        previewLoading.value = false
      }
    }

    const previewReviewVersion = async (version: MicroAppVersion) => {
      previewLoading.value = true
      try {
        const detail = await previewDownloadMicroApp({ appId: version.appId, version: version.version })
        if (!detail.packageBase64) throw new Error('预览包内容为空')
        await openPreview(detail.packageBase64, detail.manifest, detail)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '待审核微应用预览失败')
      } finally {
        previewLoading.value = false
      }
    }

    const handleUpload = async () => {
      if (!packageBase64.value) {
        message.error('请先选择微应用 zip 包')
        return
      }

      const manifest: MicroAppManifest = {
        appId: uploadForm.value.appId,
        name: uploadForm.value.name,
        version: uploadForm.value.version,
        entry: uploadForm.value.entry,
        description: uploadForm.value.description,
        icon: uploadForm.value.icon,
        iconFileId: uploadForm.value.iconFileId,
        permissions: { userInfo: true }
      }
      packageUploading.value = true
      try {
        await uploadMicroAppPackage({
          manifest,
          packageBase64: packageBase64.value,
          visibility: uploadForm.value.visibility,
          allowedUsers: userListFromText(uploadForm.value.allowedUsers),
          rolloutUsers: userListFromText(uploadForm.value.rolloutUsers),
          rolloutTenants: userListFromText(uploadForm.value.rolloutTenants),
          rolloutPercent: Number(uploadForm.value.rolloutPercent),
          releaseChannel: uploadForm.value.releaseChannel
        })
        uploadVisible.value = false
        message.success('微应用已提交审核')
        await loadApps()
        activeTab.value = 'mine'
      } catch (error) {
        message.error(error instanceof Error ? error.message : '微应用上传失败')
      } finally {
        packageUploading.value = false
      }
    }

    const handleReview = async (version: MicroAppVersion, decision: 'approved' | 'rejected') => {
      await reviewMicroApp({
        appId: version.appId,
        version: version.version,
        decision,
        reason: decision === 'rejected' ? '管理员拒绝上线' : ''
      })
      await loadApps()
    }

    const handlePublish = async (version: MicroAppVersion) => {
      await publishMicroApp({ appId: version.appId, version: version.version })
      await loadApps()
    }

    const openAccess = (app: MicroAppItem) => {
      selectedApp.value = app
      accessForm.value = {
        visibility: app.visibility,
        allowedUsers: (app.allowedUsers || []).join('\n'),
        rolloutUsers: (app.rolloutUsers || []).join('\n'),
        rolloutTenants: (app.rolloutTenants || []).join('\n'),
        rolloutPercent: app.rolloutPercent ?? 100,
        releaseChannel: app.releaseChannel || 'stable'
      }
      accessVisible.value = true
    }

    const saveAccess = async () => {
      if (!selectedApp.value) return
      await updateMicroAppAccess({
        appId: selectedApp.value.appId,
        visibility: accessForm.value.visibility,
        allowedUsers: userListFromText(accessForm.value.allowedUsers),
        rolloutUsers: userListFromText(accessForm.value.rolloutUsers),
        rolloutTenants: userListFromText(accessForm.value.rolloutTenants),
        rolloutPercent: Number(accessForm.value.rolloutPercent),
        releaseChannel: accessForm.value.releaseChannel
      })
      accessVisible.value = false
      await loadApps()
    }

    const downloadAndOpen = async (app: MicroAppItem) => {
      const version = await downloadMicroApp({ appId: app.appId, version: app.latestPublished?.version })
      await installMicroAppLocally(version)
      message.success('微应用已下载到本地')
      installedApps.value = getInstalledMicroApps()
      router.push({
        path: `/home/micro-apps/${app.appId}`,
        query: { app: app.appId, version: version.version, title: version.manifest.name || app.name }
      })
    }

    const openInstalledApp = (app: InstalledMicroApp) => {
      router.push({
        path: `/home/micro-apps/${app.appId}`,
        query: { app: app.appId, version: app.version, title: app.manifest.name || app.appId }
      })
    }

    const handleRollback = async (app: MicroAppItem) => {
      await rollbackMicroApp({ appId: app.appId })
      message.success('已触发回滚')
      await loadApps()
    }

    const statusTag = (status: MicroAppVersion['status']) => {
      const type: NonNullable<TagProps['type']> =
        status === 'published'
          ? 'success'
          : status === 'rejected'
            ? 'error'
            : status === 'approved'
              ? 'info'
              : 'warning'
      return <NTag type={type}>{microAppVersionStatusLabel[status]}</NTag>
    }

    const appColumns: DataTableColumns<MicroAppItem> = [
      {
        title: '应用',
        key: 'name',
        render: (row) => (
          <div class="micro-app-center__app-cell">
            <strong>{row.name}</strong>
            <span>{row.appId}</span>
          </div>
        )
      },
      {
        title: '发布环境',
        key: 'releaseChannel',
        render: (row) => <NTag>{releaseChannelLabel[row.releaseChannel || 'stable']}</NTag>
      },
      {
        title: '当前版本',
        key: 'version',
        render: (row) =>
          row.latestPublished ? <NTag type="success">{row.latestPublished.version}</NTag> : <NTag>未发布</NTag>
      },
      {
        title: '操作',
        key: 'actions',
        render: (row) => (
          <NSpace class="micro-app-center__row-actions">
            <NButton size="small" type="primary" disabled={!row.latestPublished} onClick={() => downloadAndOpen(row)}>
              进入应用
            </NButton>
          </NSpace>
        )
      }
    ]

    const myAppColumns: DataTableColumns<MicroAppItem> = [
      {
        title: '应用',
        key: 'name',
        render: (row) => (
          <div class="micro-app-center__app-cell">
            <strong>{row.name}</strong>
            <span>{row.appId}</span>
          </div>
        )
      },
      { title: '版本数', key: 'versions', render: (row) => `${row.versions?.length || 0} 个` },
      {
        title: '最新状态',
        key: 'status',
        render: (row) => (row.versions?.[0] ? statusTag(row.versions[0].status) : <NTag>未提交</NTag>)
      },
      {
        title: '当前发布',
        key: 'published',
        render: (row) =>
          row.latestPublished ? <NTag type="success">{row.latestPublished.version}</NTag> : <NTag>未发布</NTag>
      }
    ]

    const adminColumns: DataTableColumns<MicroAppItem> = [
      ...appColumns.slice(0, 3),
      {
        title: '所有者',
        key: 'ownerUserId',
        render: (row) => <span class="micro-app-center__muted micro-app-center__muted--inline">{row.ownerUserId}</span>
      },
      { title: '灰度名单', key: 'rolloutUsers', render: (row) => `${row.rolloutUsers?.length || 0} 人` },
      {
        title: '管理操作',
        key: 'adminActions',
        render: (row) => (
          <NSpace class="micro-app-center__row-actions">
            <NButton size="small" type="primary" disabled={!row.latestPublished} onClick={() => downloadAndOpen(row)}>
              进入应用
            </NButton>
            {isAdmin.value && (
              <NButton size="small" secondary onClick={() => openAccess(row)}>
                权限/灰度
              </NButton>
            )}
            {isAdmin.value && (
              <NButton size="small" secondary disabled={!row.latestPublished} onClick={() => handleRollback(row)}>
                回滚
              </NButton>
            )}
          </NSpace>
        )
      }
    ]

    return () => (
      <div class="micro-app-center">
        <PageHeader
          title="微应用"
          subtitle={
            isAdmin.value
              ? '管理微应用发布、权限和灰度，同时可直接进入正式应用'
              : '查看可用应用、进入应用，并跟踪自己上传的微应用状态'
          }>
          {{
            actions: () => (
              <NButton type="primary" onClick={openUpload}>
                上传微应用包
              </NButton>
            )
          }}
        </PageHeader>

        <section class="micro-app-center__overview" aria-label="微应用治理概览">
          {overviewItems.value.map((item) => (
            <article class="micro-app-center__stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </section>

        <section class="micro-app-center__workflow" aria-label="微应用使用说明">
          <div class="micro-app-center__workflow-main">
            <h2>{isAdmin.value ? '管理员视图与用户视图分离' : '应用列表与本地打开共存'}</h2>
            <p>
              {isAdmin.value
                ? '管理员可打开正式发布应用，并在治理区处理审核、发布、权限与灰度；灰度环境仍按名单和比例控制。'
                : '你可以进入可用应用，也可以在切到其他页面后回到本地打开区继续进入已安装微应用。'}
            </p>
          </div>
          {/* <div class="micro-app-center__workflow-steps">
            <span>应用列表</span>
            <span>我的上传</span>
            <span>本地打开</span>
            {isAdmin.value && <span>管理员治理</span>}
          </div> */}
        </section>

        <NTabs value={activeTab.value} onUpdateValue={(value: string) => (activeTab.value = value)}>
          <NTabPane name="market" tab="应用列表">
            <section class="micro-app-center__catalog" aria-label="微应用目录">
              <div class="micro-app-center__catalog-toolbar">
                <NInput v-model:value={appKeyword.value} clearable placeholder="搜索应用名称、AppId 或描述" />
                <NSelect v-model:value={platformFilter.value} options={platformOptions} />
              </div>

              {filteredVisibleApps.value.length ? (
                <div class="micro-app-center__app-grid">
                  {filteredVisibleApps.value.map((app) => (
                    <article class="micro-app-center__app-card" key={app.appId}>
                      <div class="micro-app-center__app-card-header">
                        <div class="micro-app-center__app-icon">
                          {app.latestPublished?.manifest.icon ? (
                            <img src={app.latestPublished.manifest.icon} alt={`${app.name} 图标`} />
                          ) : (
                            app.name.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div class="micro-app-center__app-title-block">
                          <strong>{app.name}</strong>
                          <span>{app.appId}</span>
                        </div>
                      </div>
                      <p>
                        {app.description ||
                          app.latestPublished?.manifest.description ||
                          '暂无应用描述，建议上传方补充使用场景和能力说明。'}
                      </p>
                      <div class="micro-app-center__app-tags">
                        {getAppPlatforms(app).map((platform) => (
                          <NTag size="small" key={platform}>
                            {platformLabel[platform]}
                          </NTag>
                        ))}
                        <NTag size="small" type={(app.releaseChannel || 'stable') === 'stable' ? 'success' : 'warning'}>
                          {releaseChannelLabel[app.releaseChannel || 'stable']}
                        </NTag>
                        {app.latestPublished && <NTag size="small">v{app.latestPublished.version}</NTag>}
                      </div>
                      <div class="micro-app-center__app-card-footer">
                        <span>{app.latestPublished ? '已发布，可进入' : '尚未发布'}</span>
                        <NButton
                          size="small"
                          type="primary"
                          disabled={!app.latestPublished}
                          onClick={() => downloadAndOpen(app)}>
                          进入应用
                        </NButton>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <NEmpty description="没有匹配的微应用，试试切换端类型或搜索关键词。" />
              )}
            </section>
          </NTabPane>

          <NTabPane name="mine" tab={`我的上传 (${myApps.value.length})`}>
            <NCard bordered={false} class="micro-app-center__card micro-app-center__table-card">
              <NDataTable
                loading={loading.value}
                columns={myAppColumns}
                data={myApps.value}
                pagination={{ pageSize: 8 }}
              />
            </NCard>
          </NTabPane>

          <NTabPane name="local" tab={`本地打开 (${installedApps.value.length})`}>
            <div class="micro-app-center__local-grid">
              {installedApps.value.length ? (
                installedApps.value.map((app) => (
                  <article class="micro-app-center__local-card" key={`${app.appId}-${app.version}`}>
                    <div class="micro-app-center__local-main">
                      <strong>{app.manifest.name}</strong>
                      <span>
                        {app.appId} / {app.version}
                      </span>
                    </div>
                    <NButton size="small" type="primary" onClick={() => openInstalledApp(app)}>
                      进入应用
                    </NButton>
                  </article>
                ))
              ) : (
                <NEmpty description="暂无本地已安装微应用，先从应用列表进入一个应用。" />
              )}
            </div>
          </NTabPane>

          {isAdmin.value && (
            <NTabPane name="admin" tab={`管理员治理 (${pendingVersions.value.length})`}>
              <NCard bordered={false} class="micro-app-center__card micro-app-center__table-card" title="全部微应用">
                <NDataTable
                  loading={loading.value}
                  columns={adminColumns}
                  data={adminApps.value}
                  pagination={{ pageSize: 8 }}
                />
              </NCard>
              <div class="micro-app-center__review-grid">
                {pendingVersions.value.length ? (
                  pendingVersions.value.map(({ app, version }) => (
                    <NCard
                      key={`${version.appId}-${version.version}`}
                      bordered={false}
                      class="micro-app-center__card micro-app-center__review-card"
                      title={`${app.name} / ${version.version}`}>
                      <NDescriptions column={1} bordered size="small">
                        <NDescriptionsItem label="AppId">{version.appId}</NDescriptionsItem>
                        <NDescriptionsItem label="入口文件">{version.manifest.entry}</NDescriptionsItem>
                        <NDescriptionsItem label="包大小">
                          {Math.round(version.packageSize / 1024)} KB
                        </NDescriptionsItem>
                        <NDescriptionsItem label="SHA256">{version.packageSha256}</NDescriptionsItem>
                        <NDescriptionsItem label="扫描结果">
                          {version.scanReport?.issues?.length
                            ? version.scanReport.issues
                                .map((issue) => `${issue.level}: ${issue.file} ${issue.message}`)
                                .join('；')
                            : '未发现风险'}
                        </NDescriptionsItem>
                      </NDescriptions>
                      <NSpace class="micro-app-center__card-actions">
                        <NButton secondary loading={previewLoading.value} onClick={() => previewReviewVersion(version)}>
                          预览应用
                        </NButton>
                        <NButton type="primary" onClick={() => handleReview(version, 'approved')}>
                          审核通过
                        </NButton>
                        <NButton type="error" secondary onClick={() => handleReview(version, 'rejected')}>
                          拒绝
                        </NButton>
                      </NSpace>
                    </NCard>
                  ))
                ) : (
                  <NEmpty description="暂无待审核版本" />
                )}
              </div>
              <NCard
                bordered={false}
                class="micro-app-center__card micro-app-center__publish-card"
                title="已审核版本发布">
                {approvedVersions.value.length ? (
                  approvedVersions.value.map((version) => (
                    <div class="micro-app-center__publish-row" key={`${version.appId}-${version.version}`}>
                      <span>
                        {version.appId} / {version.version}
                      </span>
                      <NButton size="small" type="primary" onClick={() => handlePublish(version)}>
                        发布上线
                      </NButton>
                    </div>
                  ))
                ) : (
                  <NEmpty description="暂无可发布版本" />
                )}
              </NCard>
            </NTabPane>
          )}
        </NTabs>

        <NModal v-model:show={uploadVisible.value} preset="card" title="上传微应用包" class="micro-app-center__modal">
          <NForm labelPlacement="top">
            <NFormItem label="AppId">
              <NInput v-model:value={uploadForm.value.appId} placeholder="demo-dashboard" />
            </NFormItem>
            <NFormItem label="名称">
              <NInput v-model:value={uploadForm.value.name} placeholder="Demo Dashboard" />
            </NFormItem>
            <NFormItem label="版本">
              <NInput v-model:value={uploadForm.value.version} />
            </NFormItem>
            <NFormItem label="入口文件">
              <NInput v-model:value={uploadForm.value.entry} />
            </NFormItem>
            <NFormItem label="描述">
              <NInput v-model:value={uploadForm.value.description} type="textarea" />
            </NFormItem>
            <NFormItem label={`应用图标（${MICRO_APP_ICON_SIZE}×${MICRO_APP_ICON_SIZE}px，PNG/JPG/WebP）`}>
              <label class="micro-app-center__file-picker">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleIconChange} />
                <span>{iconUploading.value ? '上传中…' : '选择图标'}</span>
              </label>
              <span class="micro-app-center__muted">{selectedIconName.value || '尚未选择图标'}</span>
            </NFormItem>
            {isAdmin.value && (
              <NFormItem label="使用权限">
                <NSelect
                  v-model:value={uploadForm.value.visibility}
                  options={[
                    { label: '公开', value: 'public' },
                    { label: '租户内', value: 'tenant' },
                    { label: '白名单', value: 'allowlist' }
                  ]}
                />
              </NFormItem>
            )}
            {isAdmin.value && (
              <NFormItem label="使用白名单 userId（一行一个）">
                <NInput v-model:value={uploadForm.value.allowedUsers} type="textarea" />
              </NFormItem>
            )}
            {isAdmin.value && (
              <NFormItem label="灰度名单 userId（一行一个，留空表示全量）">
                <NInput v-model:value={uploadForm.value.rolloutUsers} type="textarea" />
              </NFormItem>
            )}
            {isAdmin.value && (
              <NFormItem label="灰度租户 tenantId（一行一个，留空表示不限租户）">
                <NInput v-model:value={uploadForm.value.rolloutTenants} type="textarea" />
              </NFormItem>
            )}
            {isAdmin.value && (
              <NFormItem label="灰度百分比 0-100">
                <NInput v-model:value={uploadForm.value.rolloutPercent} />
              </NFormItem>
            )}
            {isAdmin.value && (
              <NFormItem label="发布渠道">
                <NSelect
                  v-model:value={uploadForm.value.releaseChannel}
                  options={[
                    { label: 'Stable', value: 'stable' },
                    { label: 'Beta', value: 'beta' },
                    { label: 'Dev', value: 'dev' }
                  ]}
                />
              </NFormItem>
            )}
            <NFormItem label="H5 dist zip 包（根目录必须包含 manifest.json 和入口文件）">
              <label class="micro-app-center__file-picker">
                <input type="file" accept=".zip,application/zip" onChange={handleFileChange} />
                <span>选择 zip 包</span>
              </label>
              <span class="micro-app-center__muted">{selectedFileName.value || '尚未选择文件'}</span>
            </NFormItem>
          </NForm>
          <NSpace justify="end">
            <NButton disabled={packageUploading.value} onClick={() => (uploadVisible.value = false)}>
              取消
            </NButton>
            <NButton
              secondary
              loading={previewLoading.value}
              disabled={!packageBase64.value || packageUploading.value}
              onClick={previewSelectedPackage}>
              上传前预览
            </NButton>
            <NButton
              type="primary"
              loading={packageUploading.value}
              disabled={!packageBase64.value}
              onClick={handleUpload}>
              {packageUploading.value ? '上传中…' : '提交微应用'}
            </NButton>
          </NSpace>
        </NModal>

        <NModal v-model:show={accessVisible.value} preset="card" title="权限与灰度名单" class="micro-app-center__modal">
          <NForm labelPlacement="top">
            <NFormItem label="使用权限">
              <NSelect
                v-model:value={accessForm.value.visibility}
                options={[
                  { label: '公开', value: 'public' },
                  { label: '租户内', value: 'tenant' },
                  { label: '白名单', value: 'allowlist' }
                ]}
              />
            </NFormItem>
            <NFormItem label="使用白名单 userId（一行一个）">
              <NInput v-model:value={accessForm.value.allowedUsers} type="textarea" />
            </NFormItem>
            <NFormItem label="灰度名单 userId（一行一个，留空表示全量）">
              <NInput v-model:value={accessForm.value.rolloutUsers} type="textarea" />
            </NFormItem>
            <NFormItem label="灰度租户 tenantId（一行一个，留空表示不限租户）">
              <NInput v-model:value={accessForm.value.rolloutTenants} type="textarea" />
            </NFormItem>
            <NFormItem label="灰度百分比 0-100">
              <NInput v-model:value={accessForm.value.rolloutPercent} />
            </NFormItem>
            <NFormItem label="发布渠道">
              <NSelect
                v-model:value={accessForm.value.releaseChannel}
                options={[
                  { label: 'Stable', value: 'stable' },
                  { label: 'Beta', value: 'beta' },
                  { label: 'Dev', value: 'dev' }
                ]}
              />
            </NFormItem>
          </NForm>
          <NSpace justify="end">
            <NButton onClick={() => (accessVisible.value = false)}>取消</NButton>
            <NButton type="primary" onClick={saveAccess}>
              保存
            </NButton>
          </NSpace>
        </NModal>
      </div>
    )
  }
})
