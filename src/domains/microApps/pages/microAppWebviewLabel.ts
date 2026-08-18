const encodeSegment = (value: string) =>
  Array.from(value)
    .map((character) => character.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')

// Tauri labels reject dots, while canonical package versions commonly contain them.
// Hex keeps the identity reversible for the Rust navigation guard.
export const microAppWebviewLabel = (appId: string, version: string) =>
  `micro_app_v1_${encodeSegment(appId)}:${encodeSegment(version)}`

export const microAppHostWindowLabel = (appId: string, version: string) =>
  `micro_host_v1_${encodeSegment(appId)}:${encodeSegment(version)}`

export const microAppWebviewLabelPrefix = (appId: string) => `micro_app_v1_${encodeSegment(appId)}:`

export const isMicroAppWebviewLabelForApp = (label: string, appId: string) =>
  label.startsWith(microAppWebviewLabelPrefix(appId))

export const microAppHostWindowLabelPrefix = (appId: string) => `micro_host_v1_${encodeSegment(appId)}:`

export const isMicroAppHostWindowLabelForApp = (label: string, appId: string) =>
  label.startsWith(microAppHostWindowLabelPrefix(appId))
