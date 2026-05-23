# PRD Reviewer - 产品需求文档智能检查工具 设计文档

## Context

工业设计硕士生求职产品经理实习，需要一个结合AI的项目写进简历。项目定位为"AI效率工具"，核心功能是用AI检查PRD文档中的逻辑遗漏、边界考虑不全等问题。既要完整的产品设计（PRD、交互原型、测试报告），也要一个可运行的MVP原型。

## 技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js App Router + TypeScript | 全栈单代码库，API Route处理后端逻辑 |
| UI | Tailwind CSS + shadcn/ui | 快速搭建专业界面，组件可定制 |
| AI | 小米MIMO API（Anthropic兼容协议） | 用@anthropic-ai/sdk，改base URL即可 |
| 部署 | Zeabur | 国内平台，无超时限制，免费额度够用 |
| Markdown | react-markdown + remark-gfm + remark-slug | 支持PRD常见格式（表格、任务列表、代码块） |

## 设计规范

### 字体
- 中文：思源黑体（Noto Sans SC） via Google Fonts
- 英文/代码：Inter
- 等宽：JetBrains Mono

### 配色
- 主色：#2563EB（蓝色，专业感）
- 成功：#22C55E（绿色，已采纳）
- 警告：#F59E0B（橙色，中严重度）
- 危险：#EF4444（红色，高严重度）
- 信息：#3B82F6（蓝色，低严重度）
- 背景：#FFFFFF / #0F172A（暗色模式）

### 暗色模式
- 支持系统偏好自动切换 + 手动切换按钮
- 使用Tailwind的`dark:`前缀实现

### 间距与圆角
- 组件圆角：8px（rounded-lg）
- 卡片间距：16px（gap-4）
- 页面内边距：24px（p-6）

## 整体架构

```
用户浏览器
    │
    ▼
┌─────────────────────────────┐
│  Next.js Frontend           │
│  - Landing Page             │
│  - 上传页（粘贴/上传.md）    │
│  - 审阅页（侧边栏模式）      │
│  └─ react-markdown渲染      │
│  └─ shadcn/ui问题卡片        │
└──────────┬──────────────────┘
           │ fetch /api/review (SSE Streaming)
           ▼
┌─────────────────────────────┐
│  API Route: /api/review     │
│  ① 输入验证（长度/格式）     │
│  ② 长文档按章节分chunk       │
│  ③ 加载规则库 + 构造Prompt   │
│  ④ 调用MIMO (Anthropic SDK) │
│  ⑤ Tool Use强制结构化输出    │
│  ⑥ Streaming逐步返回结果    │
│  ⑦ 合并去重 + 错误重试       │
└──────────┬──────────────────┘
           │ Anthropic SDK
           ▼
┌─────────────────────────────┐
│  小米MIMO API                │
│  Base URL:                  │
│  https://token-plan-cn.     │
│  xiaomimimo.com/anthropic   │
└─────────────────────────────┘
```

## 页面设计

### Page 1: Landing Page (/)

- Hero区：产品名称 + 数据化价值主张（"平均每次检查发现8.5个问题，其中40%是人工容易遗漏的"）
- 功能亮点展示（4个卡片：逻辑检查、边界分析、术语一致性、竞品对比）
- 使用流程图（上传 → 分析 → 查看结果）
- 示例PRD快速体验入口
- 技术架构说明（简历加分项）
- 底部：GitHub链接 + 技术栈说明

### Page 2: 上传页 (/upload)

- 文本粘贴区（大文本框 + Markdown格式提示）
- 文件上传区（拖拽上传.md文件）
- 示例PRD选择器（3份不同行业的示例PRD）
- "开始检查"按钮（支持Cmd/Ctrl+Enter快捷键）

### Page 3: 审阅页 (/review)

```
┌──────────────────────────────────────────┐
│  顶部：文档标题 + 检查状态 + 取消按钮     │
├────────────────────┬─────────────────────┤
│                    │                     │
│  左侧（60%）       │  右侧（40%）        │
│  Markdown渲染      │  问题列表           │
│  - 标题层级        │  - 按维度分组       │
│  - 表格/列表       │  - 按严重程度排序   │
│  - 代码块          │  - 可展开/收起      │
│                    │  - 点击定位到文档   │
│                    │  - 复制/忽略按钮    │
│                    │                     │
├────────────────────┴─────────────────────┤
│  底部：导出报告（Markdown格式）           │
└──────────────────────────────────────────┘
```

**质量总览区（审阅页顶部）：**
```
📊 检查完成：共发现 12 个问题
🔴 高严重度：3个  🟠 中严重度：5个  🔵 低严重度：4个

✅ 写得好的部分：
- 需求背景描述充分，市场数据支撑有力
- 用户登录流程主路径清晰
```

## 交互设计

### 分析中状态

步骤动画实时更新：
```
✓ 逻辑完整性 — 发现3个问题
✓ 边界与异常 — 发现4个问题
⏳ 术语一致性 — 分析中...
○ 竞品与数据 — 等待中
```

### 问题定位机制

1. AI返回问题时带章节标题作为锚点
2. Markdown渲染时给每个标题生成id
3. 点击问题卡片 → `scrollIntoView` 滚动到对应位置并高亮

### 采纳/忽略闭环

- 每个问题可标记"已采纳"（变绿）或"忽略"（变灰）
- 状态通过Issue ID持久化到localStorage
- 刷新页面后状态恢复

### 置信度展示

AI返回的置信度（0-1）转为用户可理解的标签：
- 0.8-1.0 → "高置信度"（绿色标签）
- 0.5-0.8 → "中置信度"（橙色标签）
- 0-0.5 → "建议确认"（灰色标签）

### 重新检查

- 审阅页顶部显示"重新检查"按钮
- 点击后清空当前结果，回到分析状态
- 用户修改文档后可直接重新检查，无需回到上传页

### 严重程度视觉区分

- 高严重度：红色标签
- 中严重度：橙色标签
- 低严重度：蓝色标签

### 错误状态

- API调用失败：显示错误提示 + "重试"按钮
- 文档过短：提示"文档内容过少，建议补充后再检查"
- 网络断开：离线提示

### 快捷键

- `Cmd/Ctrl + Enter`：开始检查
- `↑ ↓`：在问题列表中上下导航
- `Space`：展开/收起问题详情
- `Esc`：关闭当前问题

### 导出功能

导出完整审阅报告，格式更丰富：
```
PRD Review Report - [文档名]
检查时间：2026-05-24
共发现 12 个问题（高3/中5/低4）

## 写得好的部分
- 需求背景描述充分
- 用户登录流程主路径清晰

## 高严重度问题
1. [逻辑完整性] 用户登录流程 - 未说明验证码失败降级方案
   建议：补充语音验证码备选方案...

## 中严重度问题
2. [术语一致性] 全文 - "用户"与"客户"混用
   建议：统一为"用户"...
```

- 支持复制单条问题（方便发给同事）
- 支持一键复制全部问题

### 移动端适配

- 侧边栏改为底部抽屉（上滑展开）
- 文档全屏显示
- 问题数量悬浮在右下角

## Prompt工程设计

### System Prompt结构

```
[角色定义]
你是一位资深产品经理，专门负责PRD文档评审。

[检查规则库 - 4个维度，每条规则带正反面示例]

维度1：逻辑完整性（5条规则）
- 需求目标可衡量
- 用户故事完整（角色+场景+价值）
- 功能描述无歧义
- 数据流清晰
- 验收标准明确

维度2：边界与异常（5条规则）
- 网络异常处理
- 并发场景考虑
- 数据边界处理（空/超长/格式错误）
- 权限降级方案
- 超时处理

维度3：术语一致性（3条规则）
- 同一概念命名统一
- 专业术语有定义
- 缩写首次出现时解释

维度4：竞品与数据（3条规则）
- 包含竞品对比
- 需求优先级有依据
- 核心指标（KPI）已定义

[输出要求]
- 合并相似问题，避免重复
- 每个问题带置信度评分
- 包含正向反馈（写得好的部分）
- 精确到章节定位
```

### 检查规则库

独立维护在 `lib/check-rules.ts`，可迭代配置：

```typescript
export const checkDimensions = [
  {
    id: 'logic',
    name: '逻辑完整性',
    rules: [
      {
        id: 'logic-1',
        name: '需求目标可衡量',
        description: '需求目标必须包含可量化的指标',
        goodExample: '注册转化率提升15%',
        badExample: '提升用户体验',
        severity: 'high'
      },
      // ... 约16条规则
    ]
  },
  // 4个维度
]
```

### 严重程度分级标准

- **高（High）**：逻辑硬伤，不改会导致开发返工（如缺少异常流程）
- **中（Medium）**：影响质量但可后补（如术语不一致）
- **低（Low）**：优化建议（如竞品分析不够详细）

### Tool Use输出格式

```json
{
  "issues": [
    {
      "dimension": "logic",
      "severity": "high",
      "section": "用户登录流程",
      "description": "未说明验证码发送失败时的降级方案",
      "suggestion": "建议补充：验证码发送失败时，提供'语音验证码'备选方案，并限制重试次数为3次",
      "confidence": 0.92,
      "positiveNote": "登录流程的主路径描述清晰"
    }
  ],
  "summary": {
    "totalIssues": 12,
    "highCount": 3,
    "mediumCount": 5,
    "lowCount": 4,
    "positiveFeedback": "整体结构完整，需求背景描述充分"
  }
}
```

## 数据流与状态管理

### 状态结构

```typescript
AppState = {
  document: {
    content: string,          // Markdown原文
    fileName: string,         // 文件名
    sections: Section[],      // 解析后的章节结构
  },
  
  review: {
    status: 'idle' | 'analyzing' | 'done' | 'error' | 'cancelled',
    currentStep: string,      // 当前检查维度
    progress: { total: number, completed: number },
    issues: Issue[],
    error?: string,
    startedAt: number,
    abortController?: AbortController,
  },
  
  issueActions: {
    [issueId]: 'active' | 'adopted' | 'ignored'
  }
}
```

### Issue ID生成规则

`dimension + section + 问题前20字的djb2 hash`，保证同一问题ID稳定，采纳/忽略状态不丢失。示例：`logic-用户登录流程-a3f2b1`

### 核心流程

```
用户上传.md文件
    │
    ▼
解析Markdown → 提取章节结构 → 存入document状态
    │
    ▼
POST /api/review { content, sections }
    │
    ▼
┌─ API Route ─────────────────────────────┐
│ ① 验证输入（长度≤10000字，格式校验）     │
│ ② 超长文档 → 按章节拆分为多个chunk       │
│ ③ 对每个chunk调用MIMO API               │
│ ④ Streaming返回：每完成一个维度实时推送  │
│ ⑤ 合并所有chunk的issues + 去重          │
│ ⑥ 失败重试1次，仍失败返回部分结果+错误提示│
└──────────┬─────────────────────────────┘
           │ SSE/Streaming
           ▼
┌─ 前端状态更新 ──────────────────────────┐
│ review.status: 'analyzing'              │
│ review.currentStep: '边界与异常'          │
│ review.issues: [逐步追加...]              │
│ review.progress: { total: 4, completed: 2 }│
└──────────┬─────────────────────────────┘
           │ 完成
           ▼
保存到 localStorage（支持刷新恢复）
    │
    ▼
用户操作：采纳/忽略 → 更新状态 → 实时保存
```

## 项目文件结构

```
prd-reviewer/
├── app/
│   ├── layout.tsx                # 全局布局（字体、导航、暗色模式）
│   ├── page.tsx                  # Landing Page
│   ├── upload/page.tsx           # 上传页
│   ├── review/page.tsx           # 审阅页
│   └── api/review/route.ts       # AI检查API
│
├── components/
│   ├── ui/                       # shadcn/ui组件
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── TechStack.tsx
│   ├── upload/
│   │   ├── FileDropZone.tsx
│   │   ├── TextEditor.tsx
│   │   └── ExamplePicker.tsx
│   └── review/
│       ├── MarkdownViewer.tsx
│       ├── IssueList.tsx
│       ├── IssueCard.tsx
│       ├── ProgressSteps.tsx
│       ├── QualitySummary.tsx
│       ├── PositiveFeedback.tsx  # 正向反馈展示
│       ├── SkeletonLoader.tsx    # 加载骨架屏
│       └── ExportButton.tsx
│
├── lib/
│   ├── check-rules.ts            # 检查规则库
│   ├── prompt-builder.ts         # Prompt构造器
│   ├── issue-parser.ts           # 结果解析
│   ├── markdown-utils.ts         # Markdown工具
│   ├── storage.ts                # localStorage持久化
│   └── rate-limit.ts             # 频率限制
│
├── public/examples/              # 示例PRD
│   ├── ecommerce-prd.md
│   ├── social-prd.md
│   └── saas-prd.md
│
├── types/index.ts
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 长文档处理策略

- 按h2标题（`##`）拆分为多个chunk
- 每个chunk上限8000字，超出则继续按h3拆分
- 每个chunk独立调用MIMO API，最后合并去重
- 如果文档≤8000字，单次调用即可

## MIMO兼容性说明

- MIMO声称兼容Anthropic协议，需先跑通最小调用测试
- 如果Tool Use不支持，降级方案：用JSON Schema约束 + Prompt指令强制JSON输出
- 测试脚本：`scripts/test-mimo.ts`

## 实现分阶段

为控制范围，按以下顺序实现：

**Phase 1 - 核心功能（MVP）**
- 项目脚手架 + API Route + MIMO调用
- 上传页（文本粘贴）+ 审阅页（基础侧边栏）
- 检查规则库（16条规则）
- 基础问题列表展示

**Phase 2 - 交互完善**
- 文件拖拽上传
- 分析进度动画
- 问题定位（点击滚动）
- 采纳/忽略 + localStorage持久化
- 示例PRD

**Phase 3 - 体验打磨**
- Landing Page
- 导出功能
- 快捷键
- 移动端适配
- 质量总览区

**Phase 4 - 部署上线**
- Zeabur部署
- 环境变量配置
- 真实PRD测试 + 测试报告

## 示例PRD

内置3份示例PRD供用户体验：
- 电商类：电商APP购物车优化PRD（约1500字，埋入6个问题）
- 社交类：陌生人社交产品PRD（约2000字，埋入8个问题）
- SaaS类：企业协作工具PRD（约1200字，埋入5个问题）

每份PRD故意埋入典型问题（逻辑遗漏、边界缺失、术语混用等），让用户能直观看到检查效果。

## 频率限制

API Route加简单的频率限制，防止滥用：
- 基于IP的内存计数器
- 每分钟最多10次请求
- 超限返回429 + "请求过于频繁，请稍后再试"

## SEO与分享

Landing Page需要完整的SEO配置：
- Title: "PRD Reviewer - AI驱动的产品需求文档检查工具"
- Description: "用AI检查PRD文档中的逻辑遗漏、边界问题，提升文档质量"
- Open Graph tags（图片、标题、描述）
- 支持微信/LinkedIn分享时的卡片展示

## 简历加分项

1. **Landing Page**：产品介绍页，展示功能亮点、使用流程、技术架构图
2. **数据埋点**：记录检查次数、常见问题类型分布，面试时展示数据
3. **开源**：GitHub仓库，展示代码质量和工程能力
4. **测试报告**：对3份真实PRD的检查结果对比（人工 vs AI）

## 验证方式

1. **API连通性**：写最小脚本测试MIMO API能否正常调用
2. **功能验证**：用3份示例PRD跑完整流程，检查问题检出质量
3. **UI验证**：检查侧边栏定位、采纳/忽略、导出等交互
4. **部署验证**：Zeabur部署后，从不同设备访问测试
5. **性能验证**：检查大文档（5000字+）的响应时间
