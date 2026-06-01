# PRD Reviewer

AI 驱动的产品需求文档（PRD）审查工具。上传或粘贴 Markdown 格式的 PRD，AI 自动检查逻辑遗漏、边界问题、术语一致性等。

## 功能

- **四大检查维度**：逻辑完整性、边界与异常、术语一致性、竞品与数据
- **流式输出**：SSE 实时展示审查进度
- **智能分块**：长文档自动按章节分块审查
- **历史记录**：保存审查结果，支持回看和对比
- **导出报告**：支持 Markdown / HTML / 剪贴板导出
- **暗色模式**：支持亮色/暗色/跟随系统

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vite + React 19 + TypeScript + Tailwind CSS 4 |
| 后端 | Cloudflare Workers |
| LLM | DeepSeek v4 Flash（Anthropic 兼容接口） |

## 开发

### 前置要求

- Node.js >= 18
- Wrangler CLI（`npm i -g wrangler`）

### 本地启动

```bash
# 后端
cd worker
cp .dev.vars.example .dev.vars  # 填入 API_KEY
npm install
npm run dev                      # 默认 http://localhost:8787

# 前端（新终端）
cd frontend
npm install
npm run dev                      # 默认 http://localhost:5173，自动代理 /api 到后端
```

### 环境变量

**Worker（`worker/.dev.vars`）：**

| 变量 | 说明 |
|------|------|
| `API_KEY` | LLM API 密钥 |

**Worker（`worker/wrangler.toml [vars]`）：**

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `API_BASE_URL` | API 基础地址 | `https://api.deepseek.com/anthropic` |
| `MODEL_NAME` | 模型名称 | `deepseek-v4-flash` |

**前端（`frontend/.env`）：**

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_URL` | Worker API 地址（留空用开发代理） | 空 |

### 部署

```bash
# 部署 Worker
cd worker
wrangler secret put API_KEY  # 设置密钥
wrangler deploy

# 部署前端到 Cloudflare Pages
cd frontend
npm run build
# 在 Cloudflare Pages 关联 dist/ 目录
```

## 项目结构

```
AI-PRD/
├── frontend/                  # Vite + React 前端
│   ├── src/
│   │   ├── components/        # UI 组件
│   │   │   ├── landing/       # 首页组件
│   │   │   ├── upload/        # 上传/输入组件
│   │   │   └── review/        # 审查结果组件
│   │   ├── pages/             # 路由页面
│   │   ├── lib/               # 工具函数（storage）
│   │   └── types.ts           # 类型定义
│   └── public/examples/       # 示例 PRD 文档
├── worker/                    # Cloudflare Worker 后端
│   └── src/
│       ├── index.ts           # 路由 + CORS
│       ├── review.ts          # 审查主逻辑 + LLM 调用
│       ├── prompt-builder.ts  # System/User Prompt 构建
│       ├── check-rules.ts     # 检查维度和规则定义
│       ├── issue-parser.ts    # LLM 输出解析 + 去重
│       ├── markdown-utils.ts  # 章节提取 + 文档分块
│       └── types.ts           # 类型定义
└── README.md
```

## License

MIT
