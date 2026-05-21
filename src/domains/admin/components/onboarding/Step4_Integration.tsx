import { defineComponent, ref, onMounted, computed } from 'vue'
import StepLayout from './StepLayout'
import { NTabs, NTabPane, NCode, NButton, useMessage, NIcon } from 'naive-ui'
import { CopyOutline } from '@vicons/ionicons5'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import './Step4_Integration.scss'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)

export default defineComponent({
  name: 'Step4_Integration',
  props: {
    onNext: { type: Function, required: false },
    onPrev: { type: Function, required: false }
  },
  setup(props) {
    const message = useMessage()
    const activeTab = ref('nodejs')
    const appKey = ref('sl_live_xxxxxxxx')

    onMounted(() => {
      const savedKey = localStorage.getItem('starlight_onboarding_appkey')
      if (savedKey) {
        appKey.value = savedKey
      }
    })

    const codes = computed(() => ({
      nodejs: `const StarLight = require('@starlight/node-sdk');

              // 初始化 SDK
              StarLight.init({
                appKey: '${appKey.value}', 
                serviceName: 'my-service', // 请修改为您的服务名
                endpoint: 'https://api.your-starlight-domain.com'
              });

              // 示例：手动记录一个错误
              try {
                // your code
              } catch (e) {
                StarLight.captureException(e);
              }
`,
      go: `import "github.com/starlight/go-sdk"

          func main() {
              config := starlight.Config{
                  AppKey:      "${appKey.value}",
                  ServiceName: "my-service", // 请修改为您的服务名
                  Endpoint:    "https://api.your-starlight-domain.com",
              }
              
              // 初始化全局 Tracer
              starlight.Init(config)
              defer starlight.Close()
              
              // 您的业务代码...
          }
`,
      java: `import com.starlight.sdk.StarLight;

              public class App {
                  public static void main(String[] args) {
                      // 在应用启动时初始化
                      StarLight.init(
                          "${appKey.value}", 
                          "my-service", // 请修改为您的服务名
                          "https://api.your-starlight-domain.com"
                      );
                      
                      // 您的业务代码...
                  }
              }
`
    }))

    const copyCode = async () => {
      const code = codes.value[activeTab.value as keyof typeof codes.value]
      try {
        await writeText(code)
        message.success('代码已复制')
      } catch (err) {
        navigator.clipboard
          .writeText(code)
          .then(() => {
            message.success('代码已复制')
          })
          .catch(() => {
            message.error('复制失败')
          })
      }
    }

    return () => (
      <StepLayout title="集成 SDK" description="选择您的开发语言，复制并运行以下代码。">
        {{
          guide: () => (
            <div>
              <p>代码中已自动填入您的 AppKey。请将其粘贴到项目入口文件中。</p>
              <div style={{ marginTop: '20px' }}>
                <p class="step4-integration__note">
                  更多高级配置（如采样率、自定义标签）请参考{' '}
                  <a href="#" class="step4-integration__link">
                    完整文档
                  </a>
                  。
                </p>
              </div>
            </div>
          ),
          default: () => (
            <div class="step4-integration__content">
              <div class="step4-integration__copy">
                <NButton size="small" secondary onClick={copyCode}>
                  {{
                    icon: () => (
                      <NIcon>
                        <CopyOutline />
                      </NIcon>
                    ),
                    default: () => '复制代码'
                  }}
                </NButton>
              </div>

              <NTabs type="line" v-model:value={activeTab.value} class="integration-tabs">
                <NTabPane name="nodejs" tab="Node.js">
                  <NCode language="javascript" code={codes.value.nodejs} word-wrap hljs={hljs} />
                </NTabPane>
                <NTabPane name="go" tab="Go">
                  <NCode language="go" code={codes.value.go} word-wrap hljs={hljs} />
                </NTabPane>
                <NTabPane name="java" tab="Java">
                  <NCode language="java" code={codes.value.java} word-wrap hljs={hljs} />
                </NTabPane>
              </NTabs>

              <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <NButton onClick={() => props.onPrev?.()}>上一步</NButton>
                <NButton type="primary" onClick={() => props.onNext?.()}>
                  已完成配置，下一步
                </NButton>
              </div>
            </div>
          )
        }}
      </StepLayout>
    )
  }
})
