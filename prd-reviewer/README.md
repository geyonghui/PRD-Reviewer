# PRD Reviewer - 产品需求文档智能检查工具

> AI驱动的PRD审查工具，帮助产品经理快速发现文档中的逻辑漏洞、边界问题和术语不一致。

## 功能特性

- **拖拽上传** — 支持 .md / .markdown / .txt 文件拖拽或点击上传
- **文本粘贴** — 直接在编辑器中粘贴 Markdown 内容
- **示例文档** — 内置电商、SaaS、社交三类PRD示例，一键体验
- **AI智能检查** — 基于小米MIMO大模型，从4个维度16条规则审查PRD
  - 逻辑完整性：需求目标可衡量、用户故事完整、验收标准明确等
  - 边界与异常：网络异常处理、并发场景、数据边界、超时处理等
  - 术语一致性：概念命名统一、专业术语定义、缩写首次解释等
  - 竞品与数据：竞品对比、优先级依据、核心指标定义等
- **侧边栏审阅** — 左侧文档预览 + 右侧问题列表，点击问题自动定位
- **采纳/忽略** — 对每个问题标记处理状态
- **导出报告** — 一键导出 Markdown 格式的审查报告
- **深色模式** — 支持亮色/暗色主题切换

## 技术栈

- **前端框架：** Next.js 15 + React 19 + TypeScript
- **样式方案：** Tailwind CSS v4
- **AI模型：** 小米 MIMO v2.5-pro（兼容 Anthropic 接口协议）
- **Markdown渲染：** react-markdown + remark-gfm + @tailwindcss/typography
- **测试框架：** Vitest
- **部署平台：** Vercel

## 快速开始

### 环境要求

- Node.js 18.18+
- npm 10+

### 安装

```bash
git clone https://github.com/geyonghui/PRD-Reviewer.git
cd PRD-Reviewer
npm install
```

### 配置环境变量

创建 `.env.local` 文件：

```env
MIMO_API_KEY=你的MIMO_API_KEY
MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/anthropic
```

### 运行

```bash
npm run dev
```

打开 http://localhost:3000 即可使用。

## 项目结构

```
prd-reviewer/
├── app/
│   ├── api/review/route.ts    # AI审查API接口
│   ├── upload/page.tsx        # 上传页面
│   ├── review/page.tsx        # 审阅页面
│   └── page.tsx               # 首页
├── components/
│   ├── upload/                # 上传相关组件
│   ├── review/                # 审阅相关组件
│   └── landing/               # 首页组件
├── lib/
│   ├── prompt-builder.ts      # AI提示词构建
│   ├── check-rules.ts         # 4维度16条检查规则
│   ├── issue-parser.ts        # 问题解析与去重
│   ├── markdown-utils.md      # Markdown分块处理
│   └── storage.ts             # 本地存储管理
└── types/index.ts             # TypeScript类型定义
```

## 部署

### Vercel（推荐）

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入 GitHub 仓库
3. 添加环境变量 `MIMO_API_KEY` 和 `MIMO_BASE_URL`
4. 部署完成

### 本地构建

```bash
npm run build
npm start
```

## License

MIT
