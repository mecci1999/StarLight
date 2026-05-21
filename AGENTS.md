# StarLight Agent Guidelines

This document provides instructions for AI agents working on the StarLight codebase.

## Build, Lint, and Test Commands

### Development

```bash
npm run tauri:dev          # Start StarLight desktop app in dev mode
npm run dev                # Start Vue dev server only (port 6130)
```

### Build

```bash
npm run tauri:build        # Build desktop app for production
npm run tauri:build:debug  # Build with debug console
npm run build              # Build Vue app only
```

### Testing

```bash
npm run test:run           # Run all Vitest unit tests
npm run test:ui            # Run Vitest UI interface
npm run coverage           # Generate coverage report

# Run single test file
npx vitest run path/to/file.test.ts

# Run single test in watch mode
npx vitest path/to/file.test.ts
```

### Code Quality

```bash
npm run lint:staged        # Lint staged files
npm run commit             # Commit with commitizen
```

## Code Style Guidelines

### Formatting (Prettier)

- Single quotes (`'`) instead of double quotes
- No semicolons at line ends
- Print width: 120 characters
- 2-space indentation
- No trailing commas
- Spaces inside brackets: `{ foo: bar }`
- Arrow function parameters with parentheses: `(param) => {}`
- LF line endings

### ESLint Rules

- Use `const`/`let` instead of `var`
- Max 2 consecutive empty lines
- `any` type allowed
- No non-null assertion checks
- Vue 3 props destructure allowed

### Import Aliases

- `@/` → src directory
- `#/` → src/mobile directory
- `~/` → root directory

### Auto-imports (no need to import manually)

- Vue APIs (ref, computed, watch, etc.)
- Vue Router APIs
- Pinia APIs
- Naive UI: `useDialog`, `useMessage`, `useNotification`, `useLoadingBar`, `useModal`

### Naming Conventions

- Vue components: PascalCase (`MyComponent.vue`)
- Composables: camelCase with `use` prefix (`useFeature.ts`)
- Stores: camelCase with `use` suffix and `Store` prefix (`useUserStore.ts`)
- Types/interfaces: PascalCase (`UserProfile`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Error Handling

Use `AppException` from `@/common/exception`:

```typescript
throw new AppException('Error message', {
  type: ErrorType.Network,
  code: 500,
  details: { ... }
})
```

## Architecture Patterns

### Project Structure

- `src/api/` - API endpoints
- `src/components/` - Reusable Vue components
- `src/hooks/` - Vue composables
- `src/layout/` - Layout components
- `src/router/` - Vue Router config
- `src/services/` - HTTP/WebSocket services
- `src/store/` - Pinia stores
- `src/types/` - TypeScript definitions
- `src/utils/` - Utility functions
- `src/views/` - Page views
- `src/workers/` - Web Workers

### Component Patterns

- Vue 3 Composition API with `<script setup>`
- Components auto-imported from `src/components/`
- Naive UI component library

### State Management

- Pinia stores with persistence
- Use Composition API pattern for stores

### Styling

- UnoCSS (Atomic CSS) with Tailwind Preset
- SCSS with global variables from `@/styles/variable.scss`
- UnoCSS shortcuts available (`flex-center`, `absolute-center`)
- New or refactored client components should prefer sibling SCSS files (`Component.tsx` + `Component.scss`) with semantic class names
- Use SCSS for layout, spacing, typography, borders, colors, shadows, and component structure; avoid adding new atomic utility chains in newly touched components
- Consume design tokens via `var(--...)` from `@/styles/variable.scss`; do not hardcode theme values in component styles

## Commit Convention

Use conventional commits:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style/formatting
- `refactor` - Code refactoring
- `perf` - Performance optimization
- `test` - Test updates
- `build` - Build process/dependencies
