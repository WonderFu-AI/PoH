export default {
  title: "模型与凭证",
  subtitle: "管理已添加的模型配置，点击卡片切换当前使用的模型",

  // 弹窗
  addModel: "添加模型",
  editModel: "编辑模型",
  editCurrent: "编辑当前配置",
  provider: "服务商",
  providerHint: "选择 AI 服务商",
  providerRequired: "请选择服务商",
  apiKey: "API Key",
  apiKeyPlaceholder: "输入你的 API Key",
  apiKeyRequired: "请输入 API Key",
  modelName: "模型名称",
  modelNameHint: "选择或输入模型名称，Auto 为自动识别",
  auto: "自动",
  baseURL: "API 地址",
  baseURLPlaceholder: "http://localhost:1234/v1",
  save: "保存",
  cancel: "取消",
  update: "更新",
  delete: "删除",
  edit: "编辑",
  activeSaved: "已保存为当前配置",

  // 卡片
  currentConfig: "当前配置",
  savedPresets: "已保存的预设",
  empty: "暂无模型配置，点击上方按钮添加",
  active: "使用中",
  configs: "个配置",
  rotate: "轮换",

  // 提示
  noProvider: "未设置服务商",

  // 模型选项
  "provider.minimax": "MiniMax",
  "provider.openai": "OpenAI",
  "provider.anthropic": "Anthropic",
  "provider.openrouter": "OpenRouter",
  "provider.qwen": "Qwen",
  "provider.google": "Google",
  "provider.xai": "xAI",
  "provider.nous": "Nous",
  "provider.custom": "自定义",
} as const;
