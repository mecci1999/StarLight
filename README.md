# StarLight 星光

### 这是一款用于监听微服务应用运行状态的软件

## 用户接入指南 (User Integration Guide)

为了帮助新用户顺利接入微服务系统并了解平台功能，我们提供了完整的接入引导流程。

### 快速开始

1.  **获取凭证**: 登录 StarLight 客户端，在设置中生成 AppKey。
2.  **查看详细文档**: 请阅读 [系统接入引导指南](docs/integration_guide.md) 以获取完整的架构要求、SDK 集成文档和 API 规范。
3.  **配置 Agent/SDK**: 用户在其微服务中集成我们的 SDK（或配置标准 OpenTelemetry Exporter），填入：
    -   **Endpoint**: `https://api.your-starlight-domain.com/api/metrics/v1/ingest`
    -   **Headers**: `x-app-key: <用户的AppKey>`

### 更多资源
*   [系统架构与接入检查清单](docs/integration_guide.md#1-系统架构要求-system-architecture-requirements)
*   [多语言 SDK 文档](docs/integration_guide.md#3-多语言接入文档-integration-documentation)
