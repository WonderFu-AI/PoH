---
name: poh-docs
description: Official documentation search skill for Hermes Agent. Activates when users ask about Hermes features, setup, configuration, or usage. Searches the official docs and returns step-by-step guidance.
triggers:
  - "怎么用 hermes"
  - "如何使用 hermes"
  - "hermes 怎么设置"
  - "hermes help"
  - "hermes 入门"
  - "hermes 安装"
  - "hermes 配置"
  - "hermes gateway"
  - "hermes skills"
  - "hermes memory"
  - "hermes cron"
  - "hermes schedule"
  - "how to use hermes"
  - "hermes setup"
  - "hermes installation"
  - "configure hermes"
  - "hermes agent guide"
  - "hermes documentation"
  - "hermes 文档"
  - "hermes 技能"
  - "hermes 定时任务"
  - "hermes 消息网关"
---

# PoH Docs Skill — Hermes Agent 官方文档助手

## 用途

当用户询问 Hermes Agent 的使用方法、配置、特性时激活此技能。提供来自官方文档的准确指引。

## 搜索方法

官方文档位于 `~/.hermes/docs/` 或打包资源目录。使用 Hermes 的文件搜索工具查找相关内容：

```bash
# 搜索关键词（示例，实际使用 hermes 的 search_files 工具）
search_files("hermes docs", query="关键词", path="~/.hermes/docs/")
```

或者直接读取关键文档文件：
- `~/.hermes/docs/getting-started/quickstart.md` — 快速入门
- `~/.hermes/docs/getting-started/installation.md` — 安装指南
- `~/.hermes/docs/user-guide/configuration.md` — 配置指南
- `~/.hermes/docs/guides/work-with-skills.md` — Skills 使用
- `~/.hermes/docs/user-guide/features/cron.md` — 定时任务
- `~/.hermes/docs/user-guide/features/mcp.md` — MCP 配置
- `~/.hermes/docs/guides/use-soul-with-hermes.md` — SOUL 人格
- `~/.hermes/docs/reference/cli-commands.md` — CLI 命令参考

## 回答格式

找到文档内容后：
1. 用简洁的中文总结关键步骤（用户使用中文提问时）
2. 引用相关文档章节
3. 提供具体命令或操作指引
4. 如果文档内容不够，诚实告知用户并建议查看完整文档

## 重要原则

- **不推理**：只呈现文档中实际存在的内容，不凭记忆猜测
- **翻译回答**：用户使用中文时，用中文总结；使用英文时，用英文总结
- **指向行动**：给出用户可以立即执行的具体步骤
