export default {
  title: "Settings",
  sections: {
    hermesAgent: "About PoH",
    appearance: "Appearance",
    credentialPool: "Credential Pool",
  },
  theme: {
    label: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
  },
  notDetected: "Not detected",
  notAvailable: "—",
  saved: "Saved",
  updatedSuccessfully: "Updated successfully!",
  updateFailed: "Update failed.",
  migrationComplete:
    "Migration complete! Your config, keys, and data have been imported.",
  migrationFailed: "Migration failed.",
  logsExpanded: "▾",
  logsCollapsed: "▸",

  // Hermes Agent 信息
  engine: "Engine",
  released: "Released",
  desktop: "Desktop",
  python: "Python",
  openaiSdk: "OpenAI SDK",
  home: "Home",
  updating: "Updating…",
  installHermes: "Install PoH",
  installing: "Installing…",
  upToDate: "Up to date",
  updateEngine: "Update Engine",
  runDoctor: "Run Doctor",
  debugDump: "Debug Dump",
  running: "Running…",

  // OpenClaw 迁移
  openClawDetected: "OpenClaw Detected",
  openClawDesc:
    "Old OpenClaw config found. Migrate to PoH? Path: {{path}}",
  dontShowAgain: "Don't show again",
  migrating: "Migrating…",
  migrateToPoH: "Migrate to PoH",
  skip: "Skip",

  // 外观
  chooseTheme: "Changes apply immediately",
  language: "Language",
  english: "English",
  chinese: "中文",
  chooseLanguage: "Choose display language",

  // 网络
  network: "Network",
  forceIPv4: "Force IPv4",
  forceIPv4Hint: "Prefer IPv4 connections when enabled",
  httpProxy: "HTTP Proxy",
  httpProxyPlaceholder: "http://127.0.0.1:7890",
  httpProxyHint: "Leave empty to disable proxy",

  // 模型
  model: "Model",
  provider: {
    label: "Provider",
    auto: "Auto-detect",
    openrouter: "OpenRouter",
    anthropic: "Anthropic",
    openai: "OpenAI",
    google: "Google AI Studio",
    xai: "xAI (Grok)",
    nous: "Nous Portal",
    qwen: "Qwen",
    minimax: "MiniMax",
    custom: "Local / Custom",
  },
  providerHint: "Select AI provider",
  customProviderHint: "Use custom API address",
  modelName: "Model Name",
  modelNamePlaceholder: "e.g. gpt-4o-mini",
  modelNameHint: "Enter model name, e.g. gpt-4o-mini, claude-3-haiku, etc.",
  baseURL: "API URL",
  baseURLPlaceholder: "http://localhost:1234/v1",
  baseURLHint: "Custom provider API endpoint",

  // 凭证池
  credentialPool: "Credential Pool",
  credPoolHint: "Add multiple API keys per provider — PoH will rotate automatically",
  labelOptional: "Label (optional)",
  apiKey: "API Key",
  add: "Add",
  keyN: "Key {{n}}",
  empty: "Empty",
  remove: "Remove",

  // 数据
  data: "Data",
  dataHint: "Export or import a complete PoH backup",
  exportBackup: "Export Backup",
  backingUp: "Exporting…",
  importBackup: "Import Backup",
  importing: "Importing…",

  // 日志
  logs: "Logs",
  gateway: "Gateway",
  agent: "Agent",
  errors: "Errors",
  refresh: "Refresh",
  show: "Show",
  hide: "Hide",
} as const;
