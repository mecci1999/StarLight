/**
 * 日志摄取页面
 */
import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NDataTable,
  NPagination,
  NTag,
  NModal,
  NCode,
  NEmpty,
  NSpin,
  NTooltip,
  NIcon,
  NGrid,
  NGridItem,
  NStatistic,
  NProgress,
  NUpload,
  NUploadDragger,
  NText,
  NAlert,
  NTabs,
  NTabPane,
  NForm,
  NFormItem,
  NSwitch,
  useMessage
} from 'naive-ui'
import {
  CloudUploadOutline,
  DocumentTextOutline,
  ServerOutline,
  SettingsOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  TimeOutline,
  RefreshOutline
} from '@vicons/ionicons5'
import { LogLevelEnum } from '@/types/logs'
import type { LogIngestParams, LogBatchIngestParams, LogEntry } from '@/types/logs'
import api from '@/api'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'LogIngest',
  setup() {
    const message = useMessage()

    // 响应式数据
    const loading = ref(false)
    const uploadLoading = ref(false)
    const activeTab = ref('single')
    const ingestHistory = ref<any[]>([])
    const showConfigModal = ref(false)

    // 单条日志摄取
    const singleLogForm = reactive<LogIngestParams>({
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      level: LogLevelEnum.INFO,
      service: '',
      message: '',
      hostname: '',
      containerId: '',
      metadata: {}
    })

    // 批量摄取配置
    const batchConfig = reactive({
      format: 'json', // json, csv, plain
      delimiter: '\n',
      timestampField: 'timestamp',
      levelField: 'level',
      serviceField: 'service',
      messageField: 'message',
      hostnameField: 'hostname',
      autoDetect: true
    })

    // 摄取统计
    const ingestStats = reactive({
      totalIngested: 0,
      successCount: 0,
      errorCount: 0,
      lastIngestTime: '',
      avgIngestRate: 0
    })

    // 日志级别选项
    const levelOptions = [
      { label: 'DEBUG', value: LogLevelEnum.DEBUG },
      { label: 'INFO', value: LogLevelEnum.INFO },
      { label: 'WARN', value: LogLevelEnum.WARN },
      { label: 'ERROR', value: LogLevelEnum.ERROR },
      { label: 'FATAL', value: LogLevelEnum.FATAL }
    ]

    // 格式选项
    const formatOptions = [
      { label: 'JSON', value: 'json' },
      { label: 'CSV', value: 'csv' },
      { label: '纯文本', value: 'plain' }
    ]

    // 摄取历史表格列
    const historyColumns = [
      {
        title: '时间',
        key: 'timestamp',
        width: 180,
        render: (row: any) => {
          return dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss')
        }
      },
      {
        title: '类型',
        key: 'type',
        width: 100,
        render: (row: any) => {
          return h(
            NTag,
            {
              type: row.type === 'single' ? 'info' : 'success',
              size: 'small'
            },
            () => (row.type === 'single' ? '单条' : '批量')
          )
        }
      },
      {
        title: '服务',
        key: 'service',
        width: 120,
        render: (row: any) => {
          return h(NTag, { size: 'small' }, () => row.service || '-')
        }
      },
      {
        title: '数量',
        key: 'count',
        width: 80,
        render: (row: any) => {
          return h('span', { class: 'font-medium' }, row.count.toLocaleString())
        }
      },
      {
        title: '状态',
        key: 'status',
        width: 100,
        render: (row: any) => {
          const isSuccess = row.status === 'success'
          return h(NSpace, { size: 'small', align: 'center' }, () => [
            h(NIcon, {
              component: isSuccess ? CheckmarkCircleOutline : CloseCircleOutline,
              color: isSuccess ? '#52c41a' : '#ff4d4f'
            }),
            h(
              'span',
              {
                style: { color: isSuccess ? '#52c41a' : '#ff4d4f' }
              },
              isSuccess ? '成功' : '失败'
            )
          ])
        }
      },
      {
        title: '耗时',
        key: 'duration',
        width: 100,
        render: (row: any) => {
          return `${row.duration}ms`
        }
      },
      {
        title: '错误信息',
        key: 'error',
        ellipsis: {
          tooltip: true
        },
        render: (row: any) => {
          return row.error || '-'
        }
      }
    ]

    // 单条日志摄取
    const ingestSingleLog = async () => {
      if (!singleLogForm.service || !singleLogForm.message) {
        message.error('请填写服务名称和日志消息')
        return
      }

      loading.value = true
      const startTime = Date.now()

      try {
        await api.logs.ingestLog(singleLogForm)

        const duration = Date.now() - startTime

        // 添加到历史记录
        ingestHistory.value.unshift({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'single',
          service: singleLogForm.service,
          count: 1,
          status: 'success',
          duration,
          error: null
        })

        // 更新统计
        ingestStats.totalIngested += 1
        ingestStats.successCount += 1
        ingestStats.lastIngestTime = dayjs().format('YYYY-MM-DD HH:mm:ss')

        message.success('日志摄取成功')

        // 重置表单
        singleLogForm.message = ''
        singleLogForm.metadata = {}
      } catch (error: any) {
        const duration = Date.now() - startTime

        // 添加到历史记录
        ingestHistory.value.unshift({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'single',
          service: singleLogForm.service,
          count: 1,
          status: 'error',
          duration,
          error: error.message || '摄取失败'
        })

        ingestStats.errorCount += 1
        message.error('日志摄取失败: ' + (error.message || '未知错误'))
        console.error('Ingest single log error:', error)
      } finally {
        loading.value = false
      }
    }

    // 批量日志摄取
    const ingestBatchLogs = async (logs: LogEntry[]) => {
      if (!logs || logs.length === 0) {
        message.error('没有有效的日志数据')
        return
      }

      uploadLoading.value = true
      const startTime = Date.now()

      try {
        const params: LogBatchIngestParams = {
          logs,
          batchSize: 1000,
          timeout: 30000
        }

        await api.logs.batchIngestLogs(params)

        const duration = Date.now() - startTime

        // 添加到历史记录
        ingestHistory.value.unshift({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'batch',
          service: logs[0]?.service || 'mixed',
          count: logs.length,
          status: 'success',
          duration,
          error: null
        })

        // 更新统计
        ingestStats.totalIngested += logs.length
        ingestStats.successCount += logs.length
        ingestStats.lastIngestTime = dayjs().format('YYYY-MM-DD HH:mm:ss')

        message.success(`成功摄取 ${logs.length} 条日志`)
      } catch (error: any) {
        const duration = Date.now() - startTime

        // 添加到历史记录
        ingestHistory.value.unshift({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'batch',
          service: logs[0]?.service || 'mixed',
          count: logs.length,
          status: 'error',
          duration,
          error: error.message || '批量摄取失败'
        })

        ingestStats.errorCount += logs.length
        message.error('批量摄取失败: ' + (error.message || '未知错误'))
        console.error('Batch ingest error:', error)
      } finally {
        uploadLoading.value = false
      }
    }

    // 文件上传处理
    const handleFileUpload = async (options: any) => {
      const { file } = options

      try {
        const text = await file.file.text()
        let logs: LogEntry[] = []

        if (batchConfig.format === 'json') {
          // JSON格式解析
          try {
            const data = JSON.parse(text)
            logs = Array.isArray(data) ? data : [data]
          } catch (e) {
            // 尝试按行解析JSON
            const lines = text.split(batchConfig.delimiter)
            logs = lines.filter((line: string) => line.trim()).map((line: string) => JSON.parse(line))
          }
        } else if (batchConfig.format === 'csv') {
          // CSV格式解析
          const lines = text.split('\n')
          const headers = lines[0].split(',')

          logs = lines
            .slice(1)
            .filter((line: string) => line.trim())
            .map((line: string) => {
              const values = line.split(',')
              const log: any = {}
              headers.forEach((header: string, index: number) => {
                log[header.trim()] = values[index]?.trim()
              })
              return log
            })
        } else {
          // 纯文本格式
          const lines = text.split(batchConfig.delimiter)
          logs = lines
            .filter((line: string) => line.trim())
            .map((line: string, index: number) => ({
              timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              level: LogLevelEnum.INFO,
              service: singleLogForm.service || 'unknown',
              message: line.trim(),
              hostname: singleLogForm.hostname || '',
              containerId: singleLogForm.containerId || ''
            }))
        }

        await ingestBatchLogs(logs)
      } catch (error: any) {
        message.error('文件解析失败: ' + (error.message || '未知错误'))
        console.error('File upload error:', error)
      }
    }

    // 刷新摄取历史
    const refreshHistory = () => {
      // 这里可以从后端获取摄取历史
      message.info('摄取历史已刷新')
    }

    // 计算摄取成功率
    const successRate = computed(() => {
      const total = ingestStats.successCount + ingestStats.errorCount
      return total > 0 ? ((ingestStats.successCount / total) * 100).toFixed(1) : '0'
    })

    // 生命周期
    onMounted(() => {
      // 初始化数据
    })

    return () => (
      <div class="log-ingest-container">
        {/* 统计概览 */}
        <NCard class="mb-4">
          <NGrid cols={4} xGap={16}>
            <NGridItem>
              <NStatistic label="总摄取量" value={ingestStats.totalIngested}>
                {{
                  prefix: () => h(NIcon, { component: DocumentTextOutline, color: '#1890ff' })
                }}
              </NStatistic>
            </NGridItem>
            <NGridItem>
              <NStatistic label="成功率" value={`${successRate.value}%`}>
                {{
                  prefix: () => h(NIcon, { component: CheckmarkCircleOutline, color: '#52c41a' })
                }}
              </NStatistic>
            </NGridItem>
            <NGridItem>
              <NStatistic label="错误数量" value={ingestStats.errorCount}>
                {{
                  prefix: () => h(NIcon, { component: CloseCircleOutline, color: '#ff4d4f' })
                }}
              </NStatistic>
            </NGridItem>
            <NGridItem>
              <NStatistic label="最后摄取" value={ingestStats.lastIngestTime || '暂无'}>
                {{
                  prefix: () => h(NIcon, { component: TimeOutline, color: '#722ed1' })
                }}
              </NStatistic>
            </NGridItem>
          </NGrid>
        </NCard>

        {/* 摄取操作 */}
        <NCard class="mb-4">
          <NTabs v-model:value={activeTab.value} type="line">
            {/* 单条摄取 */}
            <NTabPane name="single" tab="单条摄取">
              <NSpace vertical size="large">
                <NAlert type="info" title="单条日志摄取">
                  手动输入单条日志信息进行摄取，适用于测试和调试场景。
                </NAlert>

                <NForm labelPlacement="left" labelWidth="100px">
                  <NGrid cols={2} xGap={16}>
                    <NGridItem>
                      <NFormItem label="时间戳">
                        <NInput v-model:value={singleLogForm.timestamp} placeholder="YYYY-MM-DD HH:mm:ss" />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem>
                      <NFormItem label="日志级别">
                        <NSelect
                          v-model:value={singleLogForm.level}
                          options={levelOptions}
                          placeholder="选择日志级别"
                        />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem>
                      <NFormItem label="服务名称">
                        <NInput v-model:value={singleLogForm.service} placeholder="输入服务名称" />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem>
                      <NFormItem label="主机名">
                        <NInput v-model:value={singleLogForm.hostname} placeholder="输入主机名" />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem span={2}>
                      <NFormItem label="容器ID">
                        <NInput v-model:value={singleLogForm.containerId} placeholder="输入容器ID（可选）" />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem span={2}>
                      <NFormItem label="日志消息">
                        <NInput
                          v-model:value={singleLogForm.message}
                          type="textarea"
                          placeholder="输入日志消息内容"
                          rows={4}
                        />
                      </NFormItem>
                    </NGridItem>
                  </NGrid>

                  <div class="mt-4">
                    <NButton type="primary" size="large" onClick={ingestSingleLog} loading={loading.value}>
                      <NIcon component={CloudUploadOutline} class="mr-2" />
                      摄取日志
                    </NButton>
                  </div>
                </NForm>
              </NSpace>
            </NTabPane>

            {/* 批量摄取 */}
            <NTabPane name="batch" tab="批量摄取">
              <NSpace vertical size="large">
                <NAlert type="info" title="批量日志摄取">
                  支持上传JSON、CSV、纯文本格式的日志文件进行批量摄取。
                </NAlert>

                <div class="flex justify-between items-center">
                  <NSpace>
                    <NText>文件格式:</NText>
                    <NSelect v-model:value={batchConfig.format} options={formatOptions} style={{ width: '120px' }} />

                    <NButton size="small" onClick={() => (showConfigModal.value = true)}>
                      <NIcon component={SettingsOutline} class="mr-1" />
                      配置
                    </NButton>
                  </NSpace>
                </div>

                <NUpload accept=".json,.csv,.txt,.log" customRequest={handleFileUpload} showFileList={false}>
                  <NUploadDragger>
                    <div class="text-center py-8">
                      <NIcon size={48} component={CloudUploadOutline} class="text-gray-400 mb-4" />
                      <NText class="text-lg">点击或拖拽文件到此区域上传</NText>
                      <div class="text-sm text-gray-500 mt-2">支持 .json, .csv, .txt, .log 格式文件</div>
                    </div>
                  </NUploadDragger>
                </NUpload>

                {uploadLoading.value && (
                  <div class="text-center py-4">
                    <NSpin size="large" />
                    <div class="mt-2 text-gray-500">正在处理文件...</div>
                  </div>
                )}
              </NSpace>
            </NTabPane>
          </NTabs>
        </NCard>

        {/* 摄取历史 */}
        <NCard>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium">摄取历史</h3>
            <NButton size="small" onClick={refreshHistory}>
              <NIcon component={RefreshOutline} class="mr-1" />
              刷新
            </NButton>
          </div>

          {ingestHistory.value.length > 0 ? (
            <NDataTable
              columns={historyColumns}
              data={ingestHistory.value}
              bordered={false}
              striped
              size="small"
              maxHeight={400}
            />
          ) : (
            <NEmpty description="暂无摄取历史" />
          )}
        </NCard>

        {/* 批量摄取配置弹窗 */}
        <NModal v-model:show={showConfigModal.value} preset="card" title="批量摄取配置" style={{ width: '600px' }}>
          <NForm labelPlacement="left" labelWidth="120px">
            <NFormItem label="文件格式">
              <NSelect v-model:value={batchConfig.format} options={formatOptions} />
            </NFormItem>

            <NFormItem label="分隔符">
              <NInput v-model:value={batchConfig.delimiter} placeholder="行分隔符" />
            </NFormItem>

            <NFormItem label="自动检测">
              <NSwitch v-model:value={batchConfig.autoDetect} />
            </NFormItem>

            {!batchConfig.autoDetect && (
              <>
                <NFormItem label="时间戳字段">
                  <NInput v-model:value={batchConfig.timestampField} placeholder="timestamp" />
                </NFormItem>

                <NFormItem label="级别字段">
                  <NInput v-model:value={batchConfig.levelField} placeholder="level" />
                </NFormItem>

                <NFormItem label="服务字段">
                  <NInput v-model:value={batchConfig.serviceField} placeholder="service" />
                </NFormItem>

                <NFormItem label="消息字段">
                  <NInput v-model:value={batchConfig.messageField} placeholder="message" />
                </NFormItem>

                <NFormItem label="主机字段">
                  <NInput v-model:value={batchConfig.hostnameField} placeholder="hostname" />
                </NFormItem>
              </>
            )}
          </NForm>

          <div class="flex justify-end gap-2 mt-4">
            <NButton onClick={() => (showConfigModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={() => (showConfigModal.value = false)}>
              确定
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
