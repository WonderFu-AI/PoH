export default {
  title: "工具",
  web: {
    label: "网页搜索",
    description: "搜索网页并从网址提取内容",
  },
  browser: {
    label: "浏览器",
    description: "导航、点击、输入和操作网页",
  },
  terminal: {
    label: "终端",
    description: "执行 shell 命令和脚本",
  },
  file: {
    label: "文件操作",
    description: "读取、写入、搜索和管理文件",
  },
  code_execution: {
    label: "代码执行",
    description: "直接执行 Python 和 shell 代码",
  },
  vision: { label: "视觉", description: "分析图像和视觉内容" },
  image_gen: {
    label: "图片生成",
    description: "使用 DALL-E 等模型生成图片",
  },
  tts: { label: "文字转语音", description: "将文字转换为语音" },
  skills: {
    label: "技能",
    description: "创建、管理和执行可复用技能",
  },
  memory: {
    label: "记忆",
    description: "存储和检索持久化知识",
  },
  session_search: {
    label: "会话搜索",
    description: "搜索过去的对话",
  },
  clarify: {
    label: "澄清问题",
    description: "在需要时向用户请求澄清",
  },
  delegation: {
    label: "委托",
    description: "派生子智能体并行执行任务",
  },
  cronjob: {
    label: "定时任务",
    description: "创建和管理计划任务",
  },
  moa: {
    label: "混合智能体",
    description: "协调多个 AI 模型协同工作",
  },
  todo: {
    label: "任务规划",
    description: "为复杂任务创建和管理待办列表",
  },
  mcpServers: "MCP 服务器",
  mcpServersDescription: "在 config.yaml 中配置的 Model Context Protocol 服务器。通过终端中的 <code>hermes mcp add/remove</code> 进行管理。",
  http: "HTTP",
  stdio: "stdio",
  disabled: "已禁用",
} as const;
