# StarLight 客户端架构文档

## 1. 项目概述

StarLight 是 Darwin App 监控系统的跨平台客户端，旨在提供类似 Datadog 的专业监控体验。项目基于 **Tauri** 框架构建，兼顾高性能原生体验与 Web 开发效率，支持 macOS、Windows、Linux 桌面端及移动端。

## 2. 技术栈

- **核心框架**: [Tauri](https://tauri.app/) (Rust + Webview)
- **UI 框架**: Vue 3 (Composition API) + TSX
- **组件库**: [Naive UI](https://www.naiveui.com/)
- **编程语言**: TypeScript, Rust (Core), SCSS
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **构建工具**: Vite

## 3. 项目结构 (`src/`)

```
src/
├── api/                # 后端 API 接口定义 (Alerts, Auth, Logs, Metrics, User)
├── components/         # 公共 UI 组件
│   ├── charts/         # 可视化图表 (Line, Bar, Pie, Topology)
│   ├── common/         # 通用组件 (Loading, Provider, Screenshot)
│   └── WindowActionBar/ # 自定义窗口标题栏
├── hooks/              # Vue Composables (useLogin, useTauriListener, useWindow)
├── layout/             # 页面布局组件 (Header, Sidebar, Tabs)
├── mock/               # 模拟数据服务
├── router/             # 路由配置
├── services/           # 核心服务 (HTTP, WebSocket, Fingerprint)
├── store/              # Pinia 状态仓库 (Setting, User, LoginHistory)
├── styles/             # 全局样式与主题 (SCSS)
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数 (Crypto, RequestQueue)
├── views/              # 页面视图
│   ├── homeWindow/     # 主窗口视图
│   │   ├── monitor/    # 监控核心 (Dashboard, Metrics, Trace, Realtime)
│   │   ├── log/        # 日志分析 (Stream, Ingest, Config)
│   │   ├── alert/      # 告警管理
│   │   ├── service/    # 服务拓扑与列表
│   │   └── onboarding/ # 接入引导流程
│   ├── loginWindow/    # 登录窗口 (QR, Email, Register)
│   └── mobile/         # 移动端适配视图
└── workers/            # Web Workers (Timer, WebSocket, Fingerprint)
```

## 4. 核心功能模块

### 4.1 监控仪表盘 (Monitor)
- **Dashboard**: 可视化展示关键指标 (CPU, Memory, Network)。
- **Realtime**: 实时指标流展示。
- **Trace**: 分布式链路追踪可视化。
- **Metrics**: 多维指标查询与分析。

### 4.2 日志分析 (Log)
- **Log Stream**: 类似 `tail -f` 的实时日志流查看器。
- **Ingest**: 日志摄入配置。
- **Exception**: 异常日志聚合与分析。

### 4.3 服务治理 (Service)
- **Topology**: 服务依赖拓扑图 (基于 `api/service` 数据)。
- **Instance**: 服务实例列表与状态监控。

### 4.4 认证与安全 (Auth)
- 支持多种登录方式：
  - **扫码登录**: 配合移动端 App。
  - **账号/邮箱**: 传统登录方式。
- **指纹识别**: `services/fingerprint.ts` 用于设备指纹采集。

### 4.5 跨平台适配
- **桌面端**: 
  - 自定义窗口控制 (`useWindow`, `WindowActionBar`)。
  - 多窗口支持 (主窗口、登录窗口、托盘窗口)。
  - 快捷键与右键菜单管理。
- **移动端**: 
  - 独立的视图目录 `views/mobile`。
  - 响应式布局适配。

## 5. 关键实现细节

### 5.1 通信层
- **HTTP**: 封装 `services/http.ts`，统一处理请求拦截、Token 注入与错误处理。
- **WebSocket**: `services/webSocket.ts` 与 `workers/webSocket.worker.ts` 配合，在 Web Worker 中处理高频实时数据推送，避免阻塞主线程 UI 渲染。

### 5.2 数据可视化
- 封装了一套图表组件 (`components/charts`)，底层可能基于 ECharts 或 D3，统一了图表风格与交互体验。

### 5.3 性能优化
- **Web Workers**: 密集型任务（如 WebSocket 数据解包、指纹计算）放入 Worker 线程。
- **虚拟滚动**: 在日志流 (`Log Stream`) 等大量数据展示场景中应用。

## 6. 开发与构建

- **开发模式**: `npm run tauri dev`
- **构建打包**: `npm run tauri build` (自动生成 .dmg, .msi, .deb 等安装包)
