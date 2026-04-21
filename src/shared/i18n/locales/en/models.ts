export default {
  title: "Models & Credentials",
  subtitle: "Manage your model configurations, click a card to set it as active",

  // Modal
  addModel: "Add Model",
  editModel: "Edit Model",
  editCurrent: "Edit Current Config",
  provider: "Provider",
  providerHint: "Select AI provider",
  providerRequired: "Please select a provider",
  apiKey: "API Key",
  apiKeyPlaceholder: "Enter your API Key",
  apiKeyRequired: "Please enter an API Key",
  modelName: "Model Name",
  modelNameHint: "Select or enter model name, Auto for auto-detection",
  auto: "Auto",
  baseURL: "API URL",
  baseURLPlaceholder: "http://localhost:1234/v1",
  save: "Save",
  cancel: "Cancel",
  update: "Update",
  delete: "Delete",
  edit: "Edit",
  activeSaved: "Saved as active config",

  // Cards
  currentConfig: "Current Config",
  savedPresets: "Saved Presets",
  empty: "No models added yet, click the button above to add",
  active: "Active",
  configs: "configs",
  rotate: "Rotate",

  // Hints
  noProvider: "No provider set",

  // Provider labels
  "provider.minimax": "MiniMax",
  "provider.openai": "OpenAI",
  "provider.anthropic": "Anthropic",
  "provider.openrouter": "OpenRouter",
  "provider.qwen": "Qwen",
  "provider.google": "Google",
  "provider.xai": "xAI",
  "provider.nous": "Nous",
  "provider.custom": "Custom",
} as const;
