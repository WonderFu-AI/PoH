PoH（Palace of Hermes，赫尔墨斯的宫殿）是为当下最热门的 AI Agent [Hermes](https://github.com/NousResearch/hermes-agent) 开发的中文客户端，帮助用户以更轻松的方式安装和使用 Hermes。

---

## 主要功能

**安装简单**
- macOS 一键安装（bash 脚本），Windows 一键安装（PowerShell 脚本）
- 首次启动自动检测 Hermes 是否已安装，没有则自动触发安装流程
- 内置官方文档 Docs Skill，不用开浏览器也能查文档

**中文界面**
- 默认中文界面，可在设置里切换回英文
- 侧边栏精简为 5 个入口：Chat / 历史记录 / 设置 / AI 能力 / 高级
  - **设置** 包含：通用设置、Profiles（多账号）、模型管理、Gateway（消息网关）
  - **AI 能力** 包含：Skills（技能）、Persona（人格）、Memory（记忆）、Tools（工具）
  - **高级** 包含：定时任务、Office（3D 界面）

**对话能力**
- 流式输出：Markdown 实时渲染、代码高亮、token 用量统计
- 22 个斜杠命令（`/new`、`/clear`、`/fast`、`/web` 等）
- 会话管理：历史记录搜索、随时继续之前的对话

**多 AI 提供商支持（国产优先）**

| 提供商 | 说明 |
|--------|------|
| **MiniMax** | 全球版 + 国内版两个接口 |
| **GLM / 智谱 AI** | 国产开源大模型 |
| **Kimi / Moonshot** | 国产 AI 编程助手 |
| **Qwen / 通义千问** | 阿里云开源模型 |
| OpenRouter | 200+ 模型，一个 API key 用所有 |
| Anthropic | Claude 系列直连 |
| OpenAI | GPT 系列直连 |
| Google AI Studio | Gemini 系列 |
| xAI (Grok) | 马斯克旗下 Grok 模型 |
| Nous Portal | 免费额度 |
| 本地 LLM | 支持 LM Studio、Ollama、vLLM、llama.cpp |
| Hugging Face | 20+ 开源模型 |

**其他功能**
- 16 个消息网关：Telegram、Discord、Slack、WhatsApp、Signal、Email、微信企业版、钉钉、飞书等
- 定时任务：设置每日自动执行任务
- 进程生命周期修复：退出 PoH 时 Hermes Gateway 一起停止，不残留后台进程
- 自动更新：检测新版本并热更新

---

## 技术栈

Electron · React 19 · TypeScript · Tailwind CSS v4 · i18next · better-sqlite3 · Vitest

---

## 声明

本项目基于 [fathah/hermes-desktop](https://github.com/fathah/hermes-desktop) 修改。

本项目由 AI 驱动开发。

## License

MIT — see [LICENSE](LICENSE) file.
