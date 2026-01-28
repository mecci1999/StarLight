/**
 * 日志配置页面
 */
import { defineComponent, ref, reactive, onMounted, computed, h } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NSwitch,
  NInputNumber,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NTabs,
  NTabPane,
  NTag,
  NAlert,
  NIcon,
  NPopconfirm,
  NDataTable,
  NModal,
  useMessage
} from 'naive-ui'
import {
  SettingsOutline,
  SaveOutline,
  RefreshOutline,
  AddOutline,
  TrashOutline,
  CreateOutline
} from '@vicons/ionicons5'
import SectionHeader from '@/components/common/SectionHeader'

export default defineComponent({
  name: 'LogConfig',
  setup() {
    const message = useMessage()

    // 响应式数据
    const loading = ref(false)
    const saving = ref(false)
    const activeTab = ref('general')
    const showRuleModal = ref(false)
    const editingRule = ref<any>(null)

    // 通用配置
    const generalConfig = reactive({
      // 日志保留设置
      retentionDays: 30,
      maxLogSize: 100, // GB
      compressionEnabled: true,

      // 性能设置
      batchSize: 1000,
      flushInterval: 5000, // ms
      maxMemoryUsage: 512, // MB

      // 索引设置
      indexingEnabled: true,
      fullTextSearch: true,
      indexFields: ['timestamp', 'level', 'service', 'message'],

      // 监控设置
      metricsEnabled: true,
      alertsEnabled: true,
      healthCheckInterval: 60000 // ms
    })

    // 存储配置
    const storageConfig = reactive({
      // 存储引擎
      engine: 'elasticsearch', // elasticsearch, mongodb, file

      // Elasticsearch配置
      elasticsearch: {
        hosts: ['http://localhost:9200'],
        username: '',
        password: '',
        indexPrefix: 'logs',
        shards: 1,
        replicas: 0,
        refreshInterval: '1s'
      },

      // MongoDB配置
      mongodb: {
        uri: 'mongodb://localhost:27017',
        database: 'logs',
        collection: 'entries',
        maxPoolSize: 10
      },

      // 文件存储配置
      file: {
        directory: '/var/log/app',
        rotationSize: 100, // MB
        rotationTime: '1d',
        compressionLevel: 6
      }
    })

    // 过滤规则
    const filterRules = ref([
      {
        id: '1',
        name: '过滤调试日志',
        enabled: true,
        condition: {
          field: 'level',
          operator: 'equals',
          value: 'DEBUG'
        },
        action: 'drop',
        description: '丢弃所有DEBUG级别的日志'
      },
      {
        id: '2',
        name: '敏感信息脱敏',
        enabled: true,
        condition: {
          field: 'message',
          operator: 'contains',
          value: 'password'
        },
        action: 'mask',
        description: '对包含密码的日志进行脱敏处理'
      }
    ])

    // 存储引擎选项
    const engineOptions = [
      { label: 'Elasticsearch', value: 'elasticsearch' },
      { label: 'MongoDB', value: 'mongodb' },
      { label: '文件存储', value: 'file' }
    ]

    // 操作符选项
    const operatorOptions = [
      { label: '等于', value: 'equals' },
      { label: '不等于', value: 'not_equals' },
      { label: '包含', value: 'contains' },
      { label: '不包含', value: 'not_contains' },
      { label: '正则匹配', value: 'regex' },
      { label: '大于', value: 'greater_than' },
      { label: '小于', value: 'less_than' }
    ]

    // 动作选项
    const actionOptions = [
      { label: '丢弃', value: 'drop' },
      { label: '脱敏', value: 'mask' },
      { label: '转换', value: 'transform' },
      { label: '路由', value: 'route' }
    ]

    // 过滤规则表格列
    const ruleColumns = [
      {
        title: '规则名称',
        key: 'name',
        width: 150
      },
      {
        title: '状态',
        key: 'enabled',
        width: 80,
        render: (row: any) => {
          return h(
            NTag,
            {
              type: row.enabled ? 'success' : 'default',
              size: 'small'
            },
            () => (row.enabled ? '启用' : '禁用')
          )
        }
      },
      {
        title: '条件',
        key: 'condition',
        render: (row: any) => {
          const { field, operator, value } = row.condition
          return `${field} ${operator} ${value}`
        }
      },
      {
        title: '动作',
        key: 'action',
        width: 100,
        render: (row: any) => {
          return h(NTag, { size: 'small' }, () => row.action)
        }
      },
      {
        title: '描述',
        key: 'description',
        ellipsis: {
          tooltip: true
        }
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (row: any) => {
          return h(NSpace, { size: 'small' }, () => [
            h(
              NButton,
              {
                size: 'small',
                onClick: () => editRule(row)
              },
              () => h(NIcon, { component: CreateOutline })
            ),

            h(
              NPopconfirm,
              {
                onPositiveClick: () => deleteRule(row.id)
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'error'
                    },
                    () => h(NIcon, { component: TrashOutline })
                  ),
                default: () => '确定删除此规则？'
              }
            )
          ])
        }
      }
    ]

    // 新增/编辑规则表单
    const ruleForm = reactive({
      name: '',
      enabled: true,
      condition: {
        field: 'level',
        operator: 'equals',
        value: ''
      },
      action: 'drop',
      description: ''
    })

    // 保存配置
    const saveConfig = async () => {
      saving.value = true

      try {
        // 这里调用API保存配置
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟API调用

        message.success('配置保存成功')
      } catch (error: any) {
        message.error('配置保存失败: ' + (error.message || '未知错误'))
        console.error('Save config error:', error)
      } finally {
        saving.value = false
      }
    }

    // 重置配置
    const resetConfig = async () => {
      loading.value = true

      try {
        // 这里调用API重置配置
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟API调用

        message.success('配置重置成功')
      } catch (error: any) {
        message.error('配置重置失败: ' + (error.message || '未知错误'))
        console.error('Reset config error:', error)
      } finally {
        loading.value = false
      }
    }

    // 测试连接
    const testConnection = async () => {
      loading.value = true

      try {
        // 这里调用API测试连接
        await new Promise((resolve) => setTimeout(resolve, 2000)) // 模拟API调用

        message.success('连接测试成功')
      } catch (error: any) {
        message.error('连接测试失败: ' + (error.message || '未知错误'))
        console.error('Test connection error:', error)
      } finally {
        loading.value = false
      }
    }

    // 新增规则
    const addRule = () => {
      editingRule.value = null
      Object.assign(ruleForm, {
        name: '',
        enabled: true,
        condition: {
          field: 'level',
          operator: 'equals',
          value: ''
        },
        action: 'drop',
        description: ''
      })
      showRuleModal.value = true
    }

    // 编辑规则
    const editRule = (rule: any) => {
      editingRule.value = rule
      Object.assign(ruleForm, { ...rule })
      showRuleModal.value = true
    }

    // 删除规则
    const deleteRule = (id: string) => {
      const index = filterRules.value.findIndex((rule) => rule.id === id)
      if (index > -1) {
        filterRules.value.splice(index, 1)
        message.success('规则删除成功')
      }
    }

    // 保存规则
    const saveRule = () => {
      if (!ruleForm.name || !ruleForm.condition.value) {
        message.error('请填写完整的规则信息')
        return
      }

      if (editingRule.value) {
        // 编辑模式
        Object.assign(editingRule.value, { ...ruleForm })
        message.success('规则更新成功')
      } else {
        // 新增模式
        const newRule = {
          id: Date.now().toString(),
          ...ruleForm
        }
        filterRules.value.push(newRule)
        message.success('规则添加成功')
      }

      showRuleModal.value = false
    }

    // 计算存储使用情况
    const storageUsage = computed(() => {
      // 这里可以从API获取实际的存储使用情况
      return {
        used: 45.6, // GB
        total: generalConfig.maxLogSize,
        percentage: ((45.6 / generalConfig.maxLogSize) * 100).toFixed(1)
      }
    })

    // 生命周期
    onMounted(() => {
      // 加载配置数据
    })

    return () => (
      <div class="p-24px h-full bg-gray-50/50 flex flex-col overflow-hidden">
        {/* 页面头部 */}
        <div class="flex justify-between items-start mb-6 shrink-0">
          <SectionHeader title="日志配置" subtitle="管理系统日志的采集、存储和保留策略" icon={SettingsOutline} />

          <NSpace>
            <NButton onClick={resetConfig} loading={loading.value}>
              <NIcon component={RefreshOutline} class="mr-1" />
              重置
            </NButton>

            <NButton type="primary" onClick={saveConfig} loading={saving.value}>
              <NIcon component={SaveOutline} class="mr-1" />
              保存配置
            </NButton>
          </NSpace>
        </div>

        <div class="flex-1 overflow-auto">
          <NTabs v-model:value={activeTab.value} type="line" animated>
            {/* 通用配置 */}
            <NTabPane name="general" tab="通用配置">
              <NSpace vertical size="large" class="pb-24px">
                {/* 存储使用情况 */}
                <NCard title="存储使用情况" bordered={false} class="shadow-sm rounded-lg">
                  <NGrid cols={3} xGap={16}>
                    <NGridItem>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-blue-500">{storageUsage.value.used} GB</div>
                        <div class="text-sm text-gray-500">已使用</div>
                      </div>
                    </NGridItem>
                    <NGridItem>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-green-500">{storageUsage.value.total} GB</div>
                        <div class="text-sm text-gray-500">总容量</div>
                      </div>
                    </NGridItem>
                    <NGridItem>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-orange-500">{storageUsage.value.percentage}%</div>
                        <div class="text-sm text-gray-500">使用率</div>
                      </div>
                    </NGridItem>
                  </NGrid>
                </NCard>

                {/* 日志保留设置 */}
                <NCard title="日志保留设置" bordered={false} class="shadow-sm rounded-lg">
                  <NForm labelPlacement="left" labelWidth="150px">
                    <NGrid cols={2} xGap={16}>
                      <NGridItem>
                        <NFormItem label="保留天数">
                          <NInputNumber
                            v-model:value={generalConfig.retentionDays}
                            min={1}
                            max={365}
                            style={{ width: '100%' }}
                          />
                        </NFormItem>
                      </NGridItem>
                      <NGridItem>
                        <NFormItem label="最大存储 (GB)">
                          <NInputNumber
                            v-model:value={generalConfig.maxLogSize}
                            min={1}
                            max={1000}
                            style={{ width: '100%' }}
                          />
                        </NFormItem>
                      </NGridItem>
                      <NGridItem>
                        <NFormItem label="启用压缩">
                          <NSwitch v-model:value={generalConfig.compressionEnabled} />
                        </NFormItem>
                      </NGridItem>
                    </NGrid>
                  </NForm>
                </NCard>

                {/* 性能设置 */}
                <NCard title="性能设置" bordered={false} class="shadow-sm rounded-lg">
                  <NForm labelPlacement="left" labelWidth="150px">
                    <NGrid cols={2} xGap={16}>
                      <NGridItem>
                        <NFormItem label="批处理大小">
                          <NInputNumber
                            v-model:value={generalConfig.batchSize}
                            min={100}
                            max={10000}
                            style={{ width: '100%' }}
                          />
                        </NFormItem>
                      </NGridItem>
                      <NGridItem>
                        <NFormItem label="刷新间隔 (ms)">
                          <NInputNumber
                            v-model:value={generalConfig.flushInterval}
                            min={1000}
                            max={60000}
                            style={{ width: '100%' }}
                          />
                        </NFormItem>
                      </NGridItem>
                      <NGridItem>
                        <NFormItem label="最大内存 (MB)">
                          <NInputNumber
                            v-model:value={generalConfig.maxMemoryUsage}
                            min={128}
                            max={2048}
                            style={{ width: '100%' }}
                          />
                        </NFormItem>
                      </NGridItem>
                    </NGrid>
                  </NForm>
                </NCard>

                {/* 索引设置 */}
                <NCard title="索引设置" bordered={false} class="shadow-sm rounded-lg">
                  <NForm labelPlacement="left" labelWidth="150px">
                    <NGrid cols={2} xGap={16}>
                      <NGridItem>
                        <NFormItem label="启用索引">
                          <NSwitch v-model:value={generalConfig.indexingEnabled} />
                        </NFormItem>
                      </NGridItem>
                      <NGridItem>
                        <NFormItem label="全文搜索">
                          <NSwitch v-model:value={generalConfig.fullTextSearch} />
                        </NFormItem>
                      </NGridItem>
                    </NGrid>
                  </NForm>
                </NCard>
              </NSpace>
            </NTabPane>

            {/* 存储配置 */}
            <NTabPane name="storage" tab="存储配置">
              <NSpace vertical size="large" class="pb-24px">
                <NCard title="存储引擎" bordered={false} class="shadow-sm rounded-lg">
                  <NForm labelPlacement="left" labelWidth="120px">
                    <NFormItem label="引擎类型">
                      <NSelect
                        v-model:value={storageConfig.engine}
                        options={engineOptions}
                        style={{ width: '200px' }}
                      />
                    </NFormItem>
                  </NForm>
                </NCard>

                {/* Elasticsearch配置 */}
                {storageConfig.engine === 'elasticsearch' && (
                  <NCard title="Elasticsearch 配置" bordered={false} class="shadow-sm rounded-lg">
                    <NForm labelPlacement="left" labelWidth="120px">
                      <NGrid cols={2} xGap={16}>
                        <NGridItem span={2}>
                          <NFormItem label="主机地址">
                            <NInput
                              v-model:value={storageConfig.elasticsearch.hosts[0]}
                              placeholder="http://localhost:9200"
                            />
                          </NFormItem>
                        </NGridItem>
                        <NGridItem>
                          <NFormItem label="用户名">
                            <NInput v-model:value={storageConfig.elasticsearch.username} placeholder="用户名（可选）" />
                          </NFormItem>
                        </NGridItem>
                        <NGridItem>
                          <NFormItem label="密码">
                            <NInput
                              v-model:value={storageConfig.elasticsearch.password}
                              type="password"
                              placeholder="密码（可选）"
                            />
                          </NFormItem>
                        </NGridItem>
                        <NGridItem>
                          <NFormItem label="索引前缀">
                            <NInput v-model:value={storageConfig.elasticsearch.indexPrefix} placeholder="logs" />
                          </NFormItem>
                        </NGridItem>
                        <NGridItem>
                          <NFormItem label="分片数">
                            <NInputNumber
                              v-model:value={storageConfig.elasticsearch.shards}
                              min={1}
                              max={10}
                              style={{ width: '100%' }}
                            />
                          </NFormItem>
                        </NGridItem>
                      </NGrid>

                      <div class="mt-4">
                        <NButton onClick={testConnection} loading={loading.value}>
                          测试连接
                        </NButton>
                      </div>
                    </NForm>
                  </NCard>
                )}

                {/* MongoDB配置 */}
                {storageConfig.engine === 'mongodb' && (
                  <NCard title="MongoDB 配置" bordered={false} class="shadow-sm rounded-lg">
                    <NForm labelPlacement="left" labelWidth="120px">
                      <NGrid cols={2} xGap={16}>
                        <NGridItem span={2}>
                          <NFormItem label="连接URI">
                            <NInput v-model:value={storageConfig.mongodb.uri} placeholder="mongodb://localhost:27017" />
                          </NFormItem>
                        </NGridItem>
                        <NGridItem>
                          <NFormItem label="数据库">
                            <NInput v-model:value={storageConfig.mongodb.database} placeholder="logs" />
                          </NFormItem>
                        </NGridItem>
                        <NGridItem>
                          <NFormItem label="集合">
                            <NInput v-model:value={storageConfig.mongodb.collection} placeholder="entries" />
                          </NFormItem>
                        </NGridItem>
                      </NGrid>

                      <div class="mt-4">
                        <NButton onClick={testConnection} loading={loading.value}>
                          测试连接
                        </NButton>
                      </div>
                    </NForm>
                  </NCard>
                )}

                {/* 文件存储配置 */}
                {storageConfig.engine === 'file' && (
                  <NCard title="文件存储配置" bordered={false} class="shadow-sm rounded-lg">
                    <NForm labelPlacement="left" labelWidth="120px">
                      <NGrid cols={2} xGap={16}>
                        <NGridItem span={2}>
                          <NFormItem label="存储目录">
                            <NInput v-model:value={storageConfig.file.directory} placeholder="/var/log/app" />
                          </NFormItem>
                        </NGridItem>
                        <NGridItem>
                          <NFormItem label="轮转大小 (MB)">
                            <NInputNumber
                              v-model:value={storageConfig.file.rotationSize}
                              min={1}
                              max={1000}
                              style={{ width: '100%' }}
                            />
                          </NFormItem>
                        </NGridItem>
                        <NGridItem>
                          <NFormItem label="轮转时间">
                            <NSelect
                              v-model:value={storageConfig.file.rotationTime}
                              options={[
                                { label: '每小时', value: '1h' },
                                { label: '每天', value: '1d' },
                                { label: '每周', value: '1w' }
                              ]}
                              style={{ width: '100%' }}
                            />
                          </NFormItem>
                        </NGridItem>
                      </NGrid>
                    </NForm>
                  </NCard>
                )}
              </NSpace>
            </NTabPane>

            {/* 过滤规则 */}
            <NTabPane name="filters" tab="过滤规则">
              <NSpace vertical size="large" class="pb-24px">
                <div class="flex justify-between items-center">
                  <h3 class="text-lg font-medium">过滤规则管理</h3>
                  <NButton type="primary" onClick={addRule}>
                    <NIcon component={AddOutline} class="mr-1" />
                    新增规则
                  </NButton>
                </div>

                <NAlert type="info">过滤规则用于在日志摄取过程中对日志进行预处理，包括丢弃、脱敏、转换等操作。</NAlert>

                <NCard bordered={false} class="shadow-sm rounded-lg">
                  <NDataTable columns={ruleColumns} data={filterRules.value} bordered={false} striped />
                </NCard>
              </NSpace>
            </NTabPane>
          </NTabs>
        </div>

        {/* 规则编辑弹窗 */}
        <NModal
          v-model:show={showRuleModal.value}
          preset="card"
          title={editingRule.value ? '编辑规则' : '新增规则'}
          style={{ width: '600px' }}>
          <NForm labelPlacement="left" labelWidth="100px">
            <NFormItem label="规则名称">
              <NInput v-model:value={ruleForm.name} placeholder="输入规则名称" />
            </NFormItem>

            <NFormItem label="启用状态">
              <NSwitch v-model:value={ruleForm.enabled} />
            </NFormItem>

            <NFormItem label="匹配字段">
              <NSelect
                v-model:value={ruleForm.condition.field}
                options={[
                  { label: '日志级别', value: 'level' },
                  { label: '服务名称', value: 'service' },
                  { label: '日志消息', value: 'message' },
                  { label: '主机名', value: 'hostname' }
                ]}
              />
            </NFormItem>

            <NFormItem label="操作符">
              <NSelect v-model:value={ruleForm.condition.operator} options={operatorOptions} />
            </NFormItem>

            <NFormItem label="匹配值">
              <NInput v-model:value={ruleForm.condition.value} placeholder="输入匹配值" />
            </NFormItem>

            <NFormItem label="执行动作">
              <NSelect v-model:value={ruleForm.action} options={actionOptions} />
            </NFormItem>

            <NFormItem label="规则描述">
              <NInput v-model:value={ruleForm.description} type="textarea" placeholder="输入规则描述" rows={3} />
            </NFormItem>
          </NForm>

          <div class="flex justify-end gap-2 mt-4">
            <NButton onClick={() => (showRuleModal.value = false)}>取消</NButton>
            <NButton type="primary" onClick={saveRule}>
              保存
            </NButton>
          </div>
        </NModal>
      </div>
    )
  }
})
