import { defineComponent, ref } from 'vue'
import StepLayout from './StepLayout'
import { NTabs, NTabPane, NCode, NButton } from 'naive-ui'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)

export default defineComponent({
  name: 'Step4_Integration',
  emits: ['next'],
  setup(props, { emit }) {
    const activeTab = ref('nodejs')

    const codes = {
      nodejs: `const StarLight = require('@starlight/node-sdk');

StarLight.init({
  appKey: 'sl_live_7a8b9c0d...', // 填入上一步获取的 Key
  serviceName: 'my-service',
  endpoint: 'https://api.your-starlight-domain.com'
});

`,
      go: `import "github.com/starlight/go-sdk"

func main() {
    config := starlight.Config{
        AppKey:      "sl_live_7a8b9c0d...",
        ServiceName: "my-service",
        Endpoint:    "https://api.your-starlight-domain.com",
    }
    starlight.Init(config)
    defer starlight.Close()
}
    
`,
      java: `import com.starlight.sdk.StarLight;

public class App {
    public static void main(String[] args) {
        StarLight.init(
            "sl_live_7a8b9c0d...", 
            "my-service",
            "https://api.your-starlight-domain.com"
        );
    }
}
    
`
    }

    return () => (
      <StepLayout title="集成 SDK" description="选择您的开发语言，复制并运行以下代码。">
        {{
          guide: () => (
            <div>
              <p>我们支持多种主流编程语言。如果您使用的语言不在列表中，请参考 REST API 文档。</p>
            </div>
          ),
          default: () => (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <NTabs type="line" v-model:value={activeTab.value} class="integration-tabs">
                <NTabPane name="nodejs" tab="Node.js">
                  <NCode language="javascript" code={codes.nodejs} word-wrap hljs={hljs} />
                </NTabPane>
                <NTabPane name="go" tab="Go">
                  <NCode language="go" code={codes.go} word-wrap hljs={hljs} />
                </NTabPane>
                <NTabPane name="java" tab="Java">
                  <NCode language="java" code={codes.java} word-wrap hljs={hljs} />
                </NTabPane>
              </NTabs>

              <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <NButton type="primary" onClick={() => emit('next')}>
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
