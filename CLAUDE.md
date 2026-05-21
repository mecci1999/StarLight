# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StarLight (星光)** - A cross-platform desktop application for monitoring microservice application operational status, built with Tauri and Vue 3. Similar to Datadog, it provides professional monitoring experience across macOS, Windows, Linux, and mobile platforms.

## Tech Stack

- **Desktop Framework**: Tauri 2.x (Rust + Webview)
- **UI Framework**: Vue 3 (Composition API) + TypeScript
- **UI Components**: Naive UI
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Charts**: ECharts + vue-echarts
- **Styling**: UnoCSS + SCSS
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## Development Commands

### Desktop Development
```bash
npm run tauri:dev          # Start StarLight desktop app in dev mode
npm run dev                # Start Vue dev server only (port 6130)
```

### Build
```bash
npm run tauri:build        # Build desktop app for production
npm run tauri:build:debug    # Build with debug console
npm run build            # Build Vue app only
```

### Testing
```bash
npm run test:run          # Run Vitest unit tests
npm run test:ui           # Run Vitest UI interface
npm run coverage          # Generate coverage report
```

### Code Quality
```bash
npm run lint:staged       # Lint staged files
npm run commit            # Commit with commitizen
```

### Mobile
```bash
npm run tauri:ios:dev     # Start iOS app
npm run tauri:android:dev # Start Android app
npm run tauri:icon         # Generate app icons from starlight.png
```

## Key Project Structure

```
src/
├── api/              # API endpoints (auth, metrics, logs, trace, alerts, subscription)
├── components/       # Reusable Vue components
│   ├── charts/         # Chart components (Bar, Line, Pie, Topology, BaseChart)
│   └── common/       # Common components
├── hooks/            # Vue composables (useWindow, useLogin, useTauriListener
├── layout/           # Layout components (Header, Sidebar, Tabs
├── router/           # Vue Router configuration
├── services/         # HTTP, WebSocket services
├── store/            # Pinia stores (user, setting, loginHistory)
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── views/            # Page views
│   ├── homeWindow/   # Main desktop window
│   │   ├── monitor/  # Monitoring (Dashboard, Metrics, Trace, Realtime)
│   │   ├── log/      # Log management
│   │   ├── alert/    # Alert management
│   │   ├── service/  # Service topology & list
│   │   └── onboarding/ # User onboarding guide
│   └── loginWindow/  # Login window
│   └── mobile/       # Mobile views
└── workers/          # Web Workers (WebSocket, Timer, Fingerprint)
```

## Architecture Notes

### Core Features

1. **Service Overview** - Customizable dashboard with chart widgets
2. **Performance Monitoring** - Real-time metrics, dashboards, trace explorer
3. **Alert Management** - Alert rules, notification history
4. **Log Center** - Log management, exception analysis
5. **Trace Explorer** - Distributed tracing visualization
6. **Billing Management** - Subscription plans, usage tracking
7. **Onboarding** - User integration guide

### Key Patterns

- **Auto-imports**: Vue APIs, Pinia, and Naive UI are auto-imported via unplugin
- **Web Workers**: Heavy tasks (WebSocket, fingerprinting) run in workers
- **Path Aliases**: Use `@/` for src directory imports
- **State Persistence**: Pinia uses persistedstate plugin for state persistence
- **Multi-window**: Supports main window, login window, tray window

### Environment Variables

- `VITE_SERVICE_URL` - API endpoint (default: http://localhost:8080/api)
- Dev server runs on port 6130

## Existing Documentation

- [README.md](./README.md) - Project overview and quick start
- [CLIENT_ARCHITECTURE.md](./CLIENT_ARCHITECTURE.md) - Client architecture details
- [docs/integration_guide.md](./docs/integration_guide.md) - Integration guide for users
