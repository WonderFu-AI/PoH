// ── Shared Types ────────────────────────────────────────

export interface FieldDef {
  key: string;
  label: string;
  type: string;
  hint: string;
}

export interface SectionDef {
  title: string;
  items: FieldDef[];
}

// ── Providers ───────────────────────────────────────────

// Default base URLs (can be overridden per-provider)
export const PROVIDER_BASE_URLS: Record<string, string> = {
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  minimax: "https://api.minimax.io/v1",
  minimax_cn: "https://api.minimaxi.com/v1",
  deepseek: "https://api.deepseek.com/v1",
  kimi: "https://api.moonshot.ai/v1",
  kimi_cn: "https://api.moonshot.cn/v1",
  alibaba: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  xiaomi: "https://api.xiaomi.cn/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "", // native, not OpenAI-compatible
  openrouter: "https://openrouter.ai/api/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  xai: "https://api.x.ai/v1",
  huggingface: "https://router.huggingface.co/v1",
  nous: "", // OAuth-based, no standard base URL
  custom: "http://localhost:1234/v1",
};

// All known models per provider
export const PROVIDER_MODELS: Record<string, string[]> = {
  zhipu: [
    "glm-5",
    "glm-4-plus",
    "glm-4",
    "glm-4-flash",
    "glm-4v-plus",
    "glm-4v-flash",
  ],
  minimax: [
    "MiniMax-M2.7",
    "MiniMax-M2",
    "MiniMax-Text-01",
    "MiniMax-VL-01",
    "abab6.5",
    "abab6.5s",
  ],
  minimax_cn: [
    "MiniMax-M2.7",
    "MiniMax-M2",
    "MiniMax-Text-01",
    "MiniMax-VL-01",
    "abab6.5",
    "abab6.5s",
  ],
  deepseek: ["deepseek-r1", "deepseek-v3", "deepseek-coder"],
  kimi: [
    "kimi-for-coding",
    "kimi-k2.5",
    "moonshot-v1-8k",
    "moonshot-v1-32k",
    "moonshot-v1-128k",
  ],
  kimi_cn: [
    "kimi-for-coding",
    "kimi-k2.5",
    "moonshot-v1-8k",
    "moonshot-v1-32k",
    "moonshot-v1-128k",
  ],
  alibaba: [
    "qwen3-plus",
    "qwen3.5-plus",
    "qwq-32b",
    "qwen2.5-72b-instruct",
    "qwen2.5-32b-instruct",
    "qwen2.5-coder-32b-instruct",
    "qwen2.5-14b-instruct",
    "qwen2.5-7b-instruct",
  ],
  xiaomi: ["mimo-v2-pro", "mimo-v2-standard"],
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "o1",
    "o1-mini",
    "o1-preview",
    "o3-mini",
  ],
  anthropic: [
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-sonnet-4-5",
    "claude-haiku-4-5",
  ],
  openrouter: [
    "anthropic/claude-opus-4-7",
    "anthropic/claude-sonnet-4-6",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "google/gemini-2.5-pro",
    "google/gemini-2.5-flash",
    "deepseek/deepseek-r1",
    "deepseek/deepseek-v3",
    "qwen/qwen3-plus",
    "qwen/qwen2.5-72b-instruct",
    "mistralai/mistral-7b-instruct",
    "meta-llama/llama-3-3-70b-instruct",
  ],
  google: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ],
  xai: ["grok-3", "grok-2", "grok-2-mini"],
  huggingface: [
    "deepseek-ai/DeepSeek-V3.2",
    "meta-llama/Llama-3.3-70B-Instruct",
    "Qwen/Qwen3-235B-A22B",
    "mistralai/Mistral-7B-Instruct-v0.3",
  ],
  nous: ["hermes-3-llama-3-405b", "hermes-3-llama-3-70b"],
  custom: ["auto"],
};

export const PROVIDERS = {
  // Order: Chinese domestic first, then international
  options: [
    { value: "zhipu", label: "智谱 GLM" },
    { value: "minimax", label: "MiniMax" },
    { value: "minimax_cn", label: "MiniMax 中国" },
    { value: "deepseek", label: "DeepSeek" },
    { value: "kimi", label: "Kimi / Moonshot" },
    { value: "kimi_cn", label: "Kimi 中国" },
    { value: "alibaba", label: "阿里云 通义千问" },
    { value: "xiaomi", label: "小米 MiMo" },
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "openrouter", label: "OpenRouter" },
    { value: "google", label: "Google AI Studio" },
    { value: "xai", label: "xAI (Grok)" },
    { value: "huggingface", label: "HuggingFace" },
    { value: "nous", label: "Nous Portal" },
    { value: "custom", label: "本地 / 自定义" },
  ],

  labels: {
    zhipu: "智谱 GLM",
    minimax: "MiniMax",
    minimax_cn: "MiniMax 中国",
    deepseek: "DeepSeek",
    kimi: "Kimi / Moonshot",
    kimi_cn: "Kimi 中国",
    alibaba: "阿里云 通义千问",
    xiaomi: "小米 MiMo",
    openrouter: "OpenRouter",
    anthropic: "Anthropic",
    openai: "OpenAI",
    google: "Google AI Studio",
    xai: "xAI (Grok)",
    huggingface: "HuggingFace",
    nous: "Nous Portal",
    custom: "本地 / 自定义",
  } as Record<string, string>,

  setup: [
    {
      id: "openrouter",
      name: "OpenRouter",
      desc: "200+ models",
      tag: "Recommended",
      envKey: "OPENROUTER_API_KEY",
      url: "https://openrouter.ai/keys",
      placeholder: "sk-or-v1-...",
      configProvider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      needsKey: true,
    },
    {
      id: "anthropic",
      name: "Anthropic",
      desc: "Claude models",
      tag: "",
      envKey: "ANTHROPIC_API_KEY",
      url: "https://console.anthropic.com/settings/keys",
      placeholder: "sk-ant-...",
      configProvider: "anthropic",
      baseUrl: "",
      needsKey: true,
    },
    {
      id: "openai",
      name: "OpenAI",
      desc: "GPT & Codex models",
      tag: "",
      envKey: "OPENAI_API_KEY",
      url: "https://platform.openai.com/api-keys",
      placeholder: "sk-...",
      configProvider: "openai",
      baseUrl: "",
      needsKey: true,
    },
    {
      id: "google",
      name: "Google AI Studio",
      desc: "Gemini models",
      tag: "",
      envKey: "GOOGLE_API_KEY",
      url: "https://aistudio.google.com/app/apikey",
      placeholder: "AIza...",
      configProvider: "google",
      baseUrl: "",
      needsKey: true,
    },
    {
      id: "xai",
      name: "xAI (Grok)",
      desc: "Grok models",
      tag: "",
      envKey: "XAI_API_KEY",
      url: "https://console.x.ai",
      placeholder: "xai-...",
      configProvider: "xai",
      baseUrl: "",
      needsKey: true,
    },
    {
      id: "nous",
      name: "Nous Portal",
      desc: "Free tier available",
      tag: "Free",
      envKey: "",
      url: "",
      placeholder: "",
      configProvider: "nous",
      baseUrl: "",
      needsKey: false,
    },
    {
      id: "local",
      name: "Local LLM",
      desc: "LM Studio, Ollama, etc.",
      tag: "No API key needed",
      envKey: "",
      url: "",
      placeholder: "",
      configProvider: "custom",
      baseUrl: "http://localhost:1234/v1",
      needsKey: false,
    },
  ],
};

export const LOCAL_PRESETS = [
  { id: "lmstudio", name: "LM Studio", port: "1234" },
  { id: "ollama", name: "Ollama", port: "11434" },
  { id: "vllm", name: "vLLM", port: "8000" },
  { id: "llamacpp", name: "llama.cpp", port: "8080" },
];

// ── Theme ───────────────────────────────────────────────

export const THEME_OPTIONS = [
  { value: "system" as const, label: "System" },
  { value: "light" as const, label: "Light" },
  { value: "dark" as const, label: "Dark" },
];

export const THEME_STORAGE_KEY = "hermes-theme";

// ── Settings API Key Sections ───────────────────────────

export const SETTINGS_SECTIONS: SectionDef[] = [
  {
    title: "LLM Providers",
    items: [
      {
        key: "OPENROUTER_API_KEY",
        label: "OpenRouter API Key",
        type: "password",
        hint: "200+ models via OpenRouter (recommended)",
      },
      {
        key: "OPENAI_API_KEY",
        label: "OpenAI API Key",
        type: "password",
        hint: "Direct access to GPT models",
      },
      {
        key: "ANTHROPIC_API_KEY",
        label: "Anthropic API Key",
        type: "password",
        hint: "Direct access to Claude models",
      },
      {
        key: "GROQ_API_KEY",
        label: "Groq API Key",
        type: "password",
        hint: "Used for voice tools and STT",
      },
      {
        key: "GLM_API_KEY",
        label: "z.ai / GLM API Key",
        type: "password",
        hint: "ZhipuAI GLM models",
      },
      {
        key: "KIMI_API_KEY",
        label: "Kimi / Moonshot API Key",
        type: "password",
        hint: "Moonshot AI coding models",
      },
      {
        key: "MINIMAX_API_KEY",
        label: "MiniMax API Key",
        type: "password",
        hint: "MiniMax models (global)",
      },
      {
        key: "MINIMAX_CN_API_KEY",
        label: "MiniMax China API Key",
        type: "password",
        hint: "MiniMax models (China endpoint)",
      },
      {
        key: "OPENCODE_ZEN_API_KEY",
        label: "OpenCode Zen API Key",
        type: "password",
        hint: "Curated GPT, Claude, Gemini models",
      },
      {
        key: "OPENCODE_GO_API_KEY",
        label: "OpenCode Go API Key",
        type: "password",
        hint: "Open models (GLM, Kimi, MiniMax)",
      },
      {
        key: "HF_TOKEN",
        label: "Hugging Face Token",
        type: "password",
        hint: "20+ open models via HF Inference",
      },
      {
        key: "GOOGLE_API_KEY",
        label: "Google AI Studio Key",
        type: "password",
        hint: "Direct access to Gemini models",
      },
      {
        key: "XAI_API_KEY",
        label: "xAI (Grok) API Key",
        type: "password",
        hint: "Direct access to Grok models",
      },
    ],
  },
  {
    title: "Tool API Keys",
    items: [
      {
        key: "EXA_API_KEY",
        label: "Exa Search API Key",
        type: "password",
        hint: "AI-native web search",
      },
      {
        key: "PARALLEL_API_KEY",
        label: "Parallel API Key",
        type: "password",
        hint: "AI-native web search and extract",
      },
      {
        key: "TAVILY_API_KEY",
        label: "Tavily API Key",
        type: "password",
        hint: "Web search for AI agents",
      },
      {
        key: "FIRECRAWL_API_KEY",
        label: "Firecrawl API Key",
        type: "password",
        hint: "Web search, extract, and crawl",
      },
      {
        key: "FAL_KEY",
        label: "FAL.ai Key",
        type: "password",
        hint: "Image generation with FAL.ai",
      },
      {
        key: "HONCHO_API_KEY",
        label: "Honcho API Key",
        type: "password",
        hint: "Cross-session AI user modeling",
      },
    ],
  },
  {
    title: "Browser & Automation",
    items: [
      {
        key: "BROWSERBASE_API_KEY",
        label: "Browserbase API Key",
        type: "password",
        hint: "Cloud browser automation",
      },
      {
        key: "BROWSERBASE_PROJECT_ID",
        label: "Browserbase Project ID",
        type: "text",
        hint: "Project ID for Browserbase",
      },
    ],
  },
  {
    title: "Voice & STT",
    items: [
      {
        key: "VOICE_TOOLS_OPENAI_KEY",
        label: "OpenAI Voice Key",
        type: "password",
        hint: "For Whisper STT and TTS",
      },
    ],
  },
  {
    title: "Research & Training",
    items: [
      {
        key: "TINKER_API_KEY",
        label: "Tinker API Key",
        type: "password",
        hint: "RL training service",
      },
      {
        key: "WANDB_API_KEY",
        label: "Weights & Biases Key",
        type: "password",
        hint: "Experiment tracking and metrics",
      },
    ],
  },
];

// ── Gateway Sections ────────────────────────────────────

export const GATEWAY_SECTIONS: SectionDef[] = [
  {
    title: "Messaging Platforms",
    items: [
      {
        key: "TELEGRAM_BOT_TOKEN",
        label: "Telegram Bot Token",
        type: "password",
        hint: "Get from @BotFather on Telegram",
      },
      {
        key: "TELEGRAM_ALLOWED_USERS",
        label: "Telegram Allowed Users",
        type: "text",
        hint: "Comma-separated Telegram user IDs",
      },
      {
        key: "DISCORD_BOT_TOKEN",
        label: "Discord Bot Token",
        type: "password",
        hint: "From the Discord Developer Portal",
      },
      {
        key: "DISCORD_ALLOWED_CHANNELS",
        label: "Discord Allowed Channels",
        type: "text",
        hint: "Comma-separated channel IDs (optional)",
      },
      {
        key: "SLACK_BOT_TOKEN",
        label: "Slack Bot Token",
        type: "password",
        hint: "xoxb-... token from Slack app settings",
      },
      {
        key: "SLACK_APP_TOKEN",
        label: "Slack App Token",
        type: "password",
        hint: "xapp-... token for Socket Mode",
      },
      {
        key: "WHATSAPP_API_URL",
        label: "WhatsApp API URL",
        type: "text",
        hint: "WhatsApp Business API or whatsapp-web.js URL",
      },
      {
        key: "WHATSAPP_API_TOKEN",
        label: "WhatsApp API Token",
        type: "password",
        hint: "Auth token for WhatsApp API",
      },
      {
        key: "SIGNAL_PHONE_NUMBER",
        label: "Signal Phone Number",
        type: "text",
        hint: "Phone number registered with signal-cli",
      },
      {
        key: "MATRIX_HOMESERVER",
        label: "Matrix Homeserver",
        type: "text",
        hint: "e.g. https://matrix.org",
      },
      {
        key: "MATRIX_USER_ID",
        label: "Matrix User ID",
        type: "text",
        hint: "e.g. @hermes:matrix.org",
      },
      {
        key: "MATRIX_ACCESS_TOKEN",
        label: "Matrix Access Token",
        type: "password",
        hint: "Access token for Matrix login",
      },
      {
        key: "MATTERMOST_URL",
        label: "Mattermost URL",
        type: "text",
        hint: "Your Mattermost server URL",
      },
      {
        key: "MATTERMOST_TOKEN",
        label: "Mattermost Token",
        type: "password",
        hint: "Personal access token",
      },
      {
        key: "EMAIL_IMAP_SERVER",
        label: "Email IMAP Server",
        type: "text",
        hint: "e.g. imap.gmail.com",
      },
      {
        key: "EMAIL_SMTP_SERVER",
        label: "Email SMTP Server",
        type: "text",
        hint: "e.g. smtp.gmail.com",
      },
      {
        key: "EMAIL_ADDRESS",
        label: "Email Address",
        type: "text",
        hint: "Your email address",
      },
      {
        key: "EMAIL_PASSWORD",
        label: "Email Password",
        type: "password",
        hint: "App password (not your main password)",
      },
      {
        key: "SMS_PROVIDER",
        label: "SMS Provider",
        type: "text",
        hint: "twilio or vonage",
      },
      {
        key: "TWILIO_ACCOUNT_SID",
        label: "Twilio Account SID",
        type: "text",
        hint: "From Twilio dashboard",
      },
      {
        key: "TWILIO_AUTH_TOKEN",
        label: "Twilio Auth Token",
        type: "password",
        hint: "Twilio authentication token",
      },
      {
        key: "TWILIO_PHONE_NUMBER",
        label: "Twilio Phone Number",
        type: "text",
        hint: "Your Twilio phone number",
      },
      {
        key: "BLUEBUBBLES_URL",
        label: "BlueBubbles Server URL",
        type: "text",
        hint: "e.g. http://localhost:1234",
      },
      {
        key: "BLUEBUBBLES_PASSWORD",
        label: "BlueBubbles Password",
        type: "password",
        hint: "Server password",
      },
      {
        key: "DINGTALK_APP_KEY",
        label: "DingTalk App Key",
        type: "password",
        hint: "From DingTalk developer console",
      },
      {
        key: "DINGTALK_APP_SECRET",
        label: "DingTalk App Secret",
        type: "password",
        hint: "DingTalk app secret",
      },
      {
        key: "FEISHU_APP_ID",
        label: "Feishu App ID",
        type: "text",
        hint: "From Feishu developer console",
      },
      {
        key: "FEISHU_APP_SECRET",
        label: "Feishu App Secret",
        type: "password",
        hint: "Feishu app secret",
      },
      {
        key: "WECOM_CORP_ID",
        label: "WeCom Corp ID",
        type: "text",
        hint: "Your WeCom corporation ID",
      },
      {
        key: "WECOM_AGENT_ID",
        label: "WeCom Agent ID",
        type: "text",
        hint: "WeCom agent ID",
      },
      {
        key: "WECOM_SECRET",
        label: "WeCom Secret",
        type: "password",
        hint: "WeCom agent secret",
      },
      {
        key: "WEIXIN_BOT_TOKEN",
        label: "WeChat (Weixin) Bot Token",
        type: "password",
        hint: "iLink Bot API token",
      },
      {
        key: "WEBHOOK_SECRET",
        label: "Webhook Secret",
        type: "password",
        hint: "Shared secret for webhook auth",
      },
      {
        key: "HA_URL",
        label: "Home Assistant URL",
        type: "text",
        hint: "e.g. http://homeassistant.local:8123",
      },
      {
        key: "HA_TOKEN",
        label: "Home Assistant Token",
        type: "password",
        hint: "Long-lived access token",
      },
    ],
  },
];

export interface PlatformDef {
  key: string;
  label: string;
  description: string;
  group: "china" | "international" | "other";
  fields: string[]; // env keys that belong to this platform
}

// Order: Chinese platforms first (most popular first), then international
export const GATEWAY_PLATFORMS: PlatformDef[] = [
  // ── 中国平台 ──────────────────────────────────────────
  {
    key: "feishu",
    label: "飞书",
    description: "连接飞书工作区",
    group: "china",
    fields: ["FEISHU_APP_ID", "FEISHU_APP_SECRET"],
  },
  {
    key: "dingtalk",
    label: "钉钉",
    description: "连接钉钉工作区",
    group: "china",
    fields: ["DINGTALK_CLIENT_ID", "DINGTALK_CLIENT_SECRET"],
  },
  {
    key: "wecom",
    label: "企业微信",
    description: "连接企业微信",
    group: "china",
    fields: ["WECOM_BOT_ID", "WECOM_SECRET"],
  },
  {
    key: "weixin",
    label: "微信",
    description: "通过 iLink Bot API 连接微信",
    group: "china",
    fields: ["WEIXIN_ACCOUNT_ID", "WEIXIN_TOKEN"],
  },
  // ── 国际平台 ──────────────────────────────────────────
  {
    key: "telegram",
    label: "Telegram",
    description: "通过 Bot API 连接 Telegram",
    group: "international",
    fields: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_ALLOWED_USERS"],
  },
  {
    key: "discord",
    label: "Discord",
    description: "通过 Bot Token 连接 Discord",
    group: "international",
    fields: ["DISCORD_BOT_TOKEN", "DISCORD_ALLOWED_CHANNELS"],
  },
  {
    key: "slack",
    label: "Slack",
    description: "连接 Slack 工作区",
    group: "international",
    fields: ["SLACK_BOT_TOKEN", "SLACK_APP_TOKEN"],
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "通过 WhatsApp Business API 连接",
    group: "international",
    fields: ["WHATSAPP_API_URL", "WHATSAPP_API_TOKEN"],
  },
  {
    key: "signal",
    label: "Signal",
    description: "通过 signal-cli 连接",
    group: "international",
    fields: ["SIGNAL_PHONE_NUMBER"],
  },
  {
    key: "matrix",
    label: "Matrix",
    description: "连接 Matrix/Element 房间",
    group: "international",
    fields: ["MATRIX_HOMESERVER", "MATRIX_USER_ID", "MATRIX_ACCESS_TOKEN"],
  },
  {
    key: "mattermost",
    label: "Mattermost",
    description: "连接 Mattermost 服务器",
    group: "international",
    fields: ["MATTERMOST_URL", "MATTERMOST_TOKEN"],
  },
  {
    key: "email",
    label: "Email",
    description: "通过 IMAP/SMTP 收发邮件",
    group: "international",
    fields: [
      "EMAIL_IMAP_SERVER",
      "EMAIL_SMTP_SERVER",
      "EMAIL_ADDRESS",
      "EMAIL_PASSWORD",
    ],
  },
  {
    key: "sms",
    label: "SMS",
    description: "通过 Twilio 收发短信",
    group: "international",
    fields: [
      "SMS_PROVIDER",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_PHONE_NUMBER",
    ],
  },
  {
    key: "bluebubbles",
    label: "iMessage",
    description: "通过 BlueBubbles 服务器连接",
    group: "international",
    fields: ["BLUEBUBBLES_URL", "BLUEBUBBLES_PASSWORD"],
  },
  // ── 其他 ──────────────────────────────────────────────
  {
    key: "webhooks",
    label: "Webhooks",
    description: "通过 HTTP Webhook 接收消息",
    group: "other",
    fields: ["WEBHOOK_SECRET"],
  },
  {
    key: "home_assistant",
    label: "Home Assistant",
    description: "连接 Home Assistant",
    group: "other",
    fields: ["HA_URL", "HA_TOKEN"],
  },
];

// ── Install ─────────────────────────────────────────────

export const INSTALL_CMD =
  "curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash";
