# PRD Reviewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-powered PRD document review tool that checks product requirement documents for logic gaps, boundary issues, terminology inconsistencies, and missing competitive analysis.

**Architecture:** Next.js App Router full-stack app with server-side API routes calling Xiaomi MIMO API (Anthropic-compatible). Frontend uses侧边栏审阅模式 with react-markdown rendering and shadcn/ui components. Deployed to Zeabur.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, @anthropic-ai/sdk, react-markdown, remark-gfm, vitest

---

## Phase 1: Foundation

### Task 0: Dark Mode Provider (insert before Task 1 in execution order)

**Files:**
- Create: `components/ThemeProvider.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create ThemeProvider**

Create `components/ThemeProvider.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("prd-reviewer:theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("prd-reviewer:theme", theme);
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 2: Create ThemeToggle component**

Create `components/ThemeToggle.tsx`:

```tsx
"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
```

- [ ] **Step 3: Update layout to wrap with ThemeProvider**

Update `app/layout.tsx`:

```tsx
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <nav className="fixed top-0 right-0 p-4 z-50">
            <ThemeToggle />
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify dark mode toggle works**

- [ ] **Step 5: Commit**

```bash
git add components/ThemeProvider.tsx components/ThemeToggle.tsx app/layout.tsx
git commit -m "feat: add dark mode with system preference detection"
```

---

### Task 1: Test MIMO API Connectivity

**Files:**
- Create: `scripts/test-mimo.ts`

Before building anything, verify the MIMO API works with the Anthropic SDK.

- [ ] **Step 1: Install dependencies**

```bash
cd D:/ruiqi/AI-PRD
npm init -y
npm install @anthropic-ai/sdk tsx
npm install -D typescript @types/node
```

- [ ] **Step 2: Create test script**

Create `scripts/test-mimo.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.MIMO_API_KEY || "tp-c1bt6nwktgtfqst96vt2oa63524vzmolfq6uzh0hocmv8vyo",
  baseURL: "https://token-plan-cn.xiaomimimo.com/anthropic",
});

async function testBasicCall() {
  console.log("Testing MIMO API connection...");
  try {
    const response = await client.messages.create({
      model: "mimo-v2.5-pro",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say 'hello' in one word" }],
    });
    console.log("✅ Basic call succeeded:", response.content[0].text);
    return true;
  } catch (error: any) {
    console.error("❌ Basic call failed:", error.message);
    return false;
  }
}

async function testToolUse() {
  console.log("\nTesting Tool Use...");
  try {
    const response = await client.messages.create({
      model: "mimo-v2.5-pro",
      max_tokens: 200,
      tools: [
        {
          name: "report_issue",
          description: "Report a PRD issue",
          input_schema: {
            type: "object",
            properties: {
              severity: { type: "string", enum: ["high", "medium", "low"] },
              description: { type: "string" },
            },
            required: ["severity", "description"],
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: 'This PRD says "improve user experience" without metrics. Report one issue.',
        },
      ],
    });
    const block = response.content.find((b) => b.type === "tool_use");
    if (block && block.type === "tool_use") {
      console.log("✅ Tool Use succeeded:", JSON.stringify(block.input, null, 2));
      return true;
    }
    console.log("⚠️ Tool Use returned no tool block:", response.content);
    return false;
  } catch (error: any) {
    console.error("❌ Tool Use failed:", error.message);
    return false;
  }
}

async function main() {
  const basicOk = await testBasicCall();
  if (!basicOk) {
    console.log("\n❌ Basic API call failed. Check your API key and network.");
    process.exit(1);
  }
  const toolOk = await testToolUse();
  if (!toolOk) {
    console.log("\n⚠️ Tool Use not supported. Will use JSON-in-prompt fallback.");
  }
  console.log("\n✅ API test complete. Ready to build!");
}

main();
```

- [ ] **Step 3: Run the test**

```bash
npx tsx scripts/test-mimo.ts
```

Expected: Both tests pass. If Tool Use fails, we'll use JSON-in-prompt fallback (noted in spec).

- [ ] **Step 4: Commit**

```bash
git init
git add scripts/test-mimo.ts package.json package-lock.json
git commit -m "chore: add MIMO API connectivity test script"
```

---

### Task 2: Next.js Project Scaffolding

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx` (placeholder)
- Create: `app/upload/page.tsx` (placeholder)
- Create: `app/review/page.tsx` (placeholder)
- Create: `tailwind.config.ts`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `.env.local`
- Create: `app/globals.css`

- [ ] **Step 1: Create Next.js project**

```bash
cd D:/ruiqi/AI-PRD
npx create-next-app@latest prd-reviewer --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-git --use-npm
```

When prompted, select: TypeScript Yes, ESLint Yes, Tailwind CSS Yes, `src/` directory No, App Router Yes, import alias `@/*`.

- [ ] **Step 2: Move existing files into the new project**

```bash
# Move the test script into the new project
mv scripts/test-mimo.ts prd-reviewer/scripts/test-mimo.ts
# Move the spec docs
mv docs prd-reviewer/docs
```

- [ ] **Step 3: Install additional dependencies**

```bash
cd prd-reviewer
npm install @anthropic-ai/sdk react-markdown remark-gfm remark-slug
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 4: Set up environment variables**

Create `.env.local`:

```
MIMO_API_KEY=tp-c1bt6nwktgtfqst96vt2oa63524vzmolfq6uzh0hocmv8vyo
MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/anthropic
```

- [ ] **Step 5: Configure Tailwind with design tokens**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Update global styles**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');

body {
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
}

/* Markdown heading anchor IDs for issue positioning */
h1, h2, h3, h4, h5, h6 {
  scroll-margin-top: 80px;
}
```

- [ ] **Step 7: Update layout with fonts and dark mode**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRD Reviewer - AI驱动的产品需求文档检查工具",
  description: "用AI检查PRD文档中的逻辑遗漏、边界问题，提升文档质量",
  openGraph: {
    title: "PRD Reviewer - AI驱动的产品需求文档检查工具",
    description: "用AI检查PRD文档中的逻辑遗漏、边界问题，提升文档质量",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder pages**

Replace `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">PRD Reviewer</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400">
        AI-powered PRD document review tool
      </p>
      <a href="/upload" className="mt-8 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition">
        Start Review
      </a>
    </main>
  );
}
```

Replace `app/upload/page.tsx`:

```tsx
export default function UploadPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-2xl font-bold">Upload Page (Coming Soon)</h1>
    </main>
  );
}
```

Replace `app/review/page.tsx`:

```tsx
export default function ReviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-2xl font-bold">Review Page (Coming Soon)</h1>
    </main>
  );
}
```

- [ ] **Step 9: Verify dev server runs**

```bash
npm run dev
```

Expected: App runs on http://localhost:3000, shows placeholder landing page.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with Tailwind and design tokens"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create type definitions**

Create `types/index.ts`:

```typescript
export type Severity = "high" | "medium" | "low";
export type IssueDimension = "logic" | "boundary" | "terminology" | "competitor";
export type IssueAction = "active" | "adopted" | "ignored";
export type ReviewStatus = "idle" | "analyzing" | "done" | "error" | "cancelled";

export interface CheckRule {
  id: string;
  name: string;
  description: string;
  goodExample: string;
  badExample: string;
  severity: Severity;
}

export interface CheckDimension {
  id: IssueDimension;
  name: string;
  rules: CheckRule[];
}

export interface Issue {
  id: string;
  dimension: IssueDimension;
  severity: Severity;
  section: string;
  description: string;
  suggestion: string;
  confidence: number;
  positiveNote?: string;
}

export interface ReviewSummary {
  totalIssues: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  positiveFeedback: string[];
}

export interface ReviewResult {
  issues: Issue[];
  summary: ReviewSummary;
}

export interface Section {
  title: string;
  level: number;
  content: string;
  startIndex: number;
}

export interface DocumentState {
  content: string;
  fileName: string;
  sections: Section[];
}

export interface ReviewState {
  status: ReviewStatus;
  currentStep: string;
  progress: { total: number; completed: number };
  issues: Issue[];
  summary: ReviewSummary | null;
  error?: string;
  startedAt: number;
}

export interface AppState {
  document: DocumentState;
  review: ReviewState;
  issueActions: Record<string, IssueAction>;
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 4: Check Rules Library

**Files:**
- Create: `lib/check-rules.ts`
- Create: `lib/__tests__/check-rules.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/check-rules.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { checkDimensions, getRulesByDimension, getRulesBySeverity } from "../check-rules";

describe("check-rules", () => {
  it("should have 4 dimensions", () => {
    expect(checkDimensions).toHaveLength(4);
  });

  it("each dimension should have an id, name, and rules array", () => {
    for (const dim of checkDimensions) {
      expect(dim.id).toBeTruthy();
      expect(dim.name).toBeTruthy();
      expect(Array.isArray(dim.rules)).toBe(true);
      expect(dim.rules.length).toBeGreaterThan(0);
    }
  });

  it("each rule should have required fields", () => {
    for (const dim of checkDimensions) {
      for (const rule of dim.rules) {
        expect(rule.id).toBeTruthy();
        expect(rule.name).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(rule.goodExample).toBeTruthy();
        expect(rule.badExample).toBeTruthy();
        expect(["high", "medium", "low"]).toContain(rule.severity);
      }
    }
  });

  it("getRulesByDimension should return rules for a specific dimension", () => {
    const logicRules = getRulesByDimension("logic");
    expect(logicRules.length).toBeGreaterThan(0);
    expect(logicRules.every((r) => r.id.startsWith("logic-"))).toBe(true);
  });

  it("getRulesBySeverity should filter rules by severity", () => {
    const highRules = getRulesBySeverity("high");
    expect(highRules.every((r) => r.severity === "high")).toBe(true);
  });

  it("should have exactly 16 rules total across all dimensions", () => {
    const total = checkDimensions.reduce((sum, dim) => sum + dim.rules.length, 0);
    expect(total).toBe(16);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/check-rules.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/check-rules.ts`:

```typescript
import { CheckDimension, IssueDimension, Severity } from "@/types";

export const checkDimensions: CheckDimension[] = [
  {
    id: "logic",
    name: "逻辑完整性",
    rules: [
      {
        id: "logic-1",
        name: "需求目标可衡量",
        description: "需求目标必须包含可量化的指标，不能是模糊的描述",
        goodExample: "用户注册转化率从30%提升到45%",
        badExample: "提升用户体验",
        severity: "high",
      },
      {
        id: "logic-2",
        name: "用户故事完整",
        description: "用户故事应包含角色、场景、价值三要素",
        goodExample: "作为一个新用户，我希望在3步内完成注册，以便快速开始使用产品",
        badExample: "用户可以注册账号",
        severity: "high",
      },
      {
        id: "logic-3",
        name: "功能描述无歧义",
        description: "功能描述应具体明确，不同开发者理解一致",
        goodExample: '点击"提交"按钮后，表单数据通过POST请求发送到/api/submit，成功后跳转到成功页',
        badExample: "提交表单",
        severity: "medium",
      },
      {
        id: "logic-4",
        name: "数据流清晰",
        description: "应说明数据从哪里来、经过什么处理、到哪里去",
        goodExample: "用户输入手机号 → 后端验证格式 → 调用短信API发送验证码 → 前端60秒倒计时",
        badExample: "发送验证码给用户",
        severity: "medium",
      },
      {
        id: "logic-5",
        name: "验收标准明确",
        description: "每个功能应有明确的验收标准（Given-When-Then格式）",
        goodExample: "Given 用户已登录, When 点击退出按钮, Then 跳转到登录页并清除token",
        badExample: "用户可以退出登录",
        severity: "high",
      },
    ],
  },
  {
    id: "boundary",
    name: "边界与异常",
    rules: [
      {
        id: "boundary-1",
        name: "网络异常处理",
        description: "应说明网络断开、请求超时等异常场景的处理方式",
        goodExample: "网络断开时，显示"网络异常，请检查网络"提示，缓存用户输入内容",
        badExample: "（未提及网络异常处理）",
        severity: "high",
      },
      {
        id: "boundary-2",
        name: "并发场景考虑",
        description: "应考虑多用户同时操作、重复提交等并发场景",
        goodExample: "提交按钮点击后禁用5秒，防止重复提交；后端用幂等键去重",
        badExample: "（未提及并发处理）",
        severity: "high",
      },
      {
        id: "boundary-3",
        name: "数据边界处理",
        description: "应说明空数据、超长输入、格式错误等边界情况的处理",
        goodExample: "输入框最多50字符，超出部分截断并提示；为空时显示"请输入内容"占位符",
        badExample: "用户可以输入内容",
        severity: "medium",
      },
      {
        id: "boundary-4",
        name: "权限降级方案",
        description: "应说明权限不足时的降级方案和提示信息",
        goodExample: "未登录用户点击收藏，弹出登录引导弹窗；普通用户点击管理按钮，按钮置灰并提示"需要管理员权限"",
        badExample: "（未提及权限不足的处理）",
        severity: "medium",
      },
      {
        id: "boundary-5",
        name: "超时处理",
        description: "应说明长时间无响应时的处理方式",
        goodExample: "API请求超过10秒未返回，显示"请求超时，请重试"，自动重试1次",
        badExample: "（未提及超时处理）",
        severity: "medium",
      },
    ],
  },
  {
    id: "terminology",
    name: "术语一致性",
    rules: [
      {
        id: "terminology-1",
        name: "概念命名统一",
        description: "同一概念在文档中应使用统一的名称",
        goodExample: "全文统一使用"用户"指代产品使用者",
        badExample: "文档中混用"用户"、"客户"、"使用者"、"会员"",
        severity: "medium",
      },
      {
        id: "terminology-2",
        name: "专业术语有定义",
        description: "专业术语首次出现时应给出定义或解释",
        goodExample: "DAU（Daily Active Users，日活跃用户数）：每日登录并产生行为的独立用户数",
        badExample: "提升DAU和MAU",
        severity: "low",
      },
      {
        id: "terminology-3",
        name: "缩写首次解释",
        description: "缩写词首次出现时应给出全称",
        goodExample: "PRD（Product Requirement Document，产品需求文档）",
        badExample: "参考PRD和BRD文档",
        severity: "low",
      },
    ],
  },
  {
    id: "competitor",
    name: "竞品与数据",
    rules: [
      {
        id: "competitor-1",
        name: "包含竞品对比",
        description: "应有竞品分析或市场对比，说明差异化优势",
        goodExample: "竞品A的购物车不支持跨店满减，我们的方案支持，这是核心差异点",
        badExample: "（完全没有竞品分析）",
        severity: "medium",
      },
      {
        id: "competitor-2",
        name: "优先级有依据",
        description: "需求优先级应有数据或逻辑支撑，不能拍脑袋决定",
        goodExample: "优先做搜索优化，因为数据显示60%的用户流失发生在搜索环节",
        badExample: "P0：搜索优化，P1：个人中心",
        severity: "medium",
      },
      {
        id: "competitor-3",
        name: "核心指标已定义",
        description: "应定义可衡量的核心指标（KPI）和目标值",
        goodExample: "核心指标：搜索转化率，目标值：从12%提升到20%，衡量周期：上线后30天",
        badExample: "提升搜索体验",
        severity: "high",
      },
    ],
  },
];

export function getRulesByDimension(dimension: IssueDimension) {
  const dim = checkDimensions.find((d) => d.id === dimension);
  return dim ? dim.rules : [];
}

export function getRulesBySeverity(severity: Severity) {
  return checkDimensions.flatMap((dim) => dim.rules.filter((r) => r.severity === severity));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/check-rules.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/check-rules.ts lib/__tests__/check-rules.test.ts
git commit -m "feat: add check rules library with 4 dimensions, 16 rules"
```

---

### Task 5: Prompt Builder

**Files:**
- Create: `lib/prompt-builder.ts`
- Create: `lib/__tests__/prompt-builder.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/prompt-builder.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserMessage } from "../prompt-builder";

describe("prompt-builder", () => {
  it("buildSystemPrompt should return a non-empty string", () => {
    const prompt = buildSystemPrompt();
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("buildSystemPrompt should include all 4 dimension names", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("逻辑完整性");
    expect(prompt).toContain("边界与异常");
    expect(prompt).toContain("术语一致性");
    expect(prompt).toContain("竞品与数据");
  });

  it("buildSystemPrompt should include role definition", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("资深产品经理");
  });

  it("buildSystemPrompt should include output format instructions", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("issues");
  });

  it("buildUserMessage should include the document content", () => {
    const msg = buildUserMessage("This is a PRD about login.", "用户登录");
    expect(msg).toContain("This is a PRD about login.");
    expect(msg).toContain("用户登录");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/prompt-builder.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/prompt-builder.ts`:

```typescript
import { checkDimensions } from "./check-rules";

export function buildSystemPrompt(): string {
  const rulesText = checkDimensions
    .map((dim) => {
      const rulesText = dim.rules
        .map(
          (rule) =>
            `  - ${rule.name}：${rule.description}\n    ✅ 好的示例：${rule.goodExample}\n    ❌ 差的示例：${rule.badExample}`
        )
        .join("\n");
      return `维度：${dim.name}\n${rulesText}`;
    })
    .join("\n\n");

  return `你是一位资深产品经理，专门负责PRD（产品需求文档）评审。你的任务是检查PRD文档中的问题，并给出具体的修改建议。

## 检查维度和规则

${rulesText}

## 输出要求

1. 使用report_issues工具返回JSON格式的检查结果
2. 每个问题必须包含：dimension（维度）、severity（严重程度）、section（所在章节）、description（问题描述）、suggestion（修改建议）、confidence（置信度0-1）
3. 合并相似问题，避免重复
4. 每个问题附带positiveNote（如果该章节有写得好的部分）
5. 精确到章节定位（如"在用户登录流程章节"）
6. 在summary中给出整体正向反馈（写得好的部分）
7. 严重程度标准：
   - high：逻辑硬伤，不改会导致开发返工
   - medium：影响质量但可后补
   - low：优化建议`;
}

export function buildUserMessage(documentContent: string, sectionHint: string): string {
  return `请检查以下PRD文档。${sectionHint ? `当前分析章节：${sectionHint}` : ""}

---PRD文档开始---
${documentContent}
---PRD文档结束---

请按照检查规则逐一分析，返回所有发现的问题。`;
}

export function buildToolDefinition() {
  return {
    name: "report_issues",
    description: "Report all issues found in the PRD document",
    input_schema: {
      type: "object" as const,
      properties: {
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dimension: {
                type: "string",
                enum: ["logic", "boundary", "terminology", "competitor"],
              },
              severity: { type: "string", enum: ["high", "medium", "low"] },
              section: { type: "string" },
              description: { type: "string" },
              suggestion: { type: "string" },
              confidence: { type: "number" },
              positiveNote: { type: "string" },
            },
            required: ["dimension", "severity", "section", "description", "suggestion", "confidence"],
          },
        },
        summary: {
          type: "object",
          properties: {
            totalIssues: { type: "number" },
            highCount: { type: "number" },
            mediumCount: { type: "number" },
            lowCount: { type: "number" },
            positiveFeedback: { type: "array", items: { type: "string" } },
          },
          required: ["totalIssues", "highCount", "mediumCount", "lowCount", "positiveFeedback"],
        },
      },
      required: ["issues", "summary"],
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/prompt-builder.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/prompt-builder.ts lib/__tests__/prompt-builder.test.ts
git commit -m "feat: add prompt builder with system prompt and tool definition"
```

---

### Task 6: Issue Parser

**Files:**
- Create: `lib/issue-parser.ts`
- Create: `lib/__tests__/issue-parser.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/issue-parser.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseIssue, generateIssueId, deduplicateIssues } from "../issue-parser";

describe("issue-parser", () => {
  it("generateIssueId should produce consistent IDs", () => {
    const id1 = generateIssueId("logic", "登录流程", "未说明验证码失败处理");
    const id2 = generateIssueId("logic", "登录流程", "未说明验证码失败处理");
    expect(id1).toBe(id2);
  });

  it("generateIssueId should produce different IDs for different inputs", () => {
    const id1 = generateIssueId("logic", "登录流程", "问题A");
    const id2 = generateIssueId("logic", "登录流程", "问题B");
    expect(id1).not.toBe(id2);
  });

  it("parseIssue should add ID to raw issue", () => {
    const raw = {
      dimension: "logic",
      severity: "high",
      section: "登录",
      description: "缺少异常处理",
      suggestion: "补充异常处理",
      confidence: 0.9,
    };
    const parsed = parseIssue(raw);
    expect(parsed.id).toBeTruthy();
    expect(parsed.dimension).toBe("logic");
    expect(parsed.severity).toBe("high");
  });

  it("deduplicateIssues should remove duplicate issues by ID", () => {
    const issues = [
      { id: "a", dimension: "logic" as const, severity: "high" as const, section: "登录", description: "问题1", suggestion: "建议1", confidence: 0.9 },
      { id: "a", dimension: "logic" as const, severity: "high" as const, section: "登录", description: "问题1", suggestion: "建议1", confidence: 0.9 },
      { id: "b", dimension: "boundary" as const, severity: "medium" as const, section: "注册", description: "问题2", suggestion: "建议2", confidence: 0.8 },
    ];
    const deduped = deduplicateIssues(issues);
    expect(deduped).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/issue-parser.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/issue-parser.ts`:

```typescript
import { Issue, IssueDimension, Severity } from "@/types";

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(36).padStart(6, "0").slice(0, 6);
}

export function generateIssueId(
  dimension: IssueDimension,
  section: string,
  description: string
): string {
  const prefix = description.slice(0, 20);
  return `${dimension}-${section}-${djb2(prefix)}`;
}

export function parseIssue(raw: Record<string, unknown>): Issue {
  return {
    id: generateIssueId(
      raw.dimension as IssueDimension,
      raw.section as string,
      raw.description as string
    ),
    dimension: raw.dimension as IssueDimension,
    severity: raw.severity as Severity,
    section: raw.section as string,
    description: raw.description as string,
    suggestion: raw.suggestion as string,
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0.5,
    positiveNote: raw.positiveNote as string | undefined,
  };
}

export function deduplicateIssues(issues: Issue[]): Issue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    if (seen.has(issue.id)) return false;
    seen.add(issue.id);
    return true;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/issue-parser.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/issue-parser.ts lib/__tests__/issue-parser.test.ts
git commit -m "feat: add issue parser with ID generation and deduplication"
```

---

### Task 7: Markdown Utils

**Files:**
- Create: `lib/markdown-utils.ts`
- Create: `lib/__tests__/markdown-utils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/markdown-utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { extractSections, chunkDocument } from "../markdown-utils";

describe("markdown-utils", () => {
  const sampleMd = `# Title

## Chapter 1
Content of chapter 1.

## Chapter 2
Content of chapter 2.

## Chapter 3
Content of chapter 3.`;

  it("extractSections should extract h2 sections", () => {
    const sections = extractSections(sampleMd);
    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBe("Chapter 1");
    expect(sections[1].title).toBe("Chapter 2");
    expect(sections[2].title).toBe("Chapter 3");
  });

  it("extractSections should include section content", () => {
    const sections = extractSections(sampleMd);
    expect(sections[0].content).toContain("Content of chapter 1");
  });

  it("chunkDocument should return single chunk for short docs", () => {
    const chunks = chunkDocument("Short document", 8000);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe("Short document");
  });

  it("chunkDocument should split long docs by section", () => {
    const longMd = "## Section 1\n" + "x".repeat(5000) + "\n\n## Section 2\n" + "y".repeat(5000);
    const chunks = chunkDocument(longMd, 8000);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/markdown-utils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/markdown-utils.ts`:

```typescript
import { Section } from "@/types";

export function extractSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let startIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h2Match || h3Match) {
      if (currentSection) {
        currentSection.content = lines.slice(currentSection.startIndex, i).join("\n").trim();
      }
      currentSection = {
        title: (h2Match?.[1] || h3Match?.[1] || "").trim(),
        level: h2Match ? 2 : 3,
        content: "",
        startIndex: i,
      };
      sections.push(currentSection);
      startIndex = i;
    }
  }

  if (currentSection) {
    currentSection.content = lines.slice(currentSection.startIndex).join("\n").trim();
  }

  return sections;
}

export interface DocumentChunk {
  content: string;
  sectionHint: string;
}

export function chunkDocument(markdown: string, maxChars: number = 8000): DocumentChunk[] {
  if (markdown.length <= maxChars) {
    return [{ content: markdown, sectionHint: "" }];
  }

  const sections = extractSections(markdown);
  if (sections.length === 0) {
    // No sections found, split by character count
    const chunks: DocumentChunk[] = [];
    for (let i = 0; i < markdown.length; i += maxChars) {
      chunks.push({
        content: markdown.slice(i, i + maxChars),
        sectionHint: `第${chunks.length + 1}部分`,
      });
    }
    return chunks;
  }

  const chunks: DocumentChunk[] = [];
  let currentChunk = "";

  for (const section of sections) {
    if (currentChunk.length + section.content.length > maxChars && currentChunk.length > 0) {
      chunks.push({ content: currentChunk, sectionHint: chunks.length === 0 ? "" : `第${chunks.length + 1}部分` });
      currentChunk = "";
    }
    currentChunk += section.content + "\n\n";
  }

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), sectionHint: `第${chunks.length + 1}部分` });
  }

  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/markdown-utils.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/markdown-utils.ts lib/__tests__/markdown-utils.test.ts
git commit -m "feat: add markdown utils for section extraction and document chunking"
```

---

### Task 8: Rate Limiter

**Files:**
- Create: `lib/rate-limit.ts`

- [ ] **Step 1: Write the implementation**

Create `lib/rate-limit.ts`:

```typescript
const requests = new Map<string, number[]>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const timestamps = requests.get(ip) || [];

  // Remove expired timestamps
  const validTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    const oldestValid = validTimestamps[0];
    const retryAfter = Math.ceil((oldestValid + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  validTimestamps.push(now);
  requests.set(ip, validTimestamps);

  return { allowed: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/rate-limit.ts
git commit -m "feat: add rate limiter for API route"
```

---

### Task 9: localStorage Persistence

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: Write the implementation**

Create `lib/storage.ts`:

```typescript
import { IssueAction, ReviewResult, DocumentState } from "@/types";

const STORAGE_PREFIX = "prd-reviewer:";

export function saveIssueActions(actions: Record<string, IssueAction>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "issue-actions", JSON.stringify(actions));
}

export function loadIssueActions(): Record<string, IssueAction> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(STORAGE_PREFIX + "issue-actions");
  return data ? JSON.parse(data) : {};
}

export function saveReviewResult(result: ReviewResult): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "review-result", JSON.stringify(result));
}

export function loadReviewResult(): ReviewResult | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_PREFIX + "review-result");
  return data ? JSON.parse(data) : null;
}

export function saveDocument(doc: DocumentState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "document", JSON.stringify(doc));
}

export function loadDocument(): DocumentState | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_PREFIX + "document");
  return data ? JSON.parse(data) : null;
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/storage.ts
git commit -m "feat: add localStorage persistence for review state"
```

---

## Phase 2: Core UI

### Task 10: API Route

**Files:**
- Create: `app/api/review/route.ts`

- [ ] **Step 1: Write the implementation**

Create `app/api/review/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserMessage, buildToolDefinition } from "@/lib/prompt-builder";
import { chunkDocument } from "@/lib/markdown-utils";
import { parseIssue, deduplicateIssues } from "@/lib/issue-parser";
import { checkRateLimit } from "@/lib/rate-limit";
import { Issue, ReviewResult } from "@/types";

const client = new Anthropic({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_BASE_URL || "https://token-plan-cn.xiaomimimo.com/anthropic",
});

const MAX_CHARS = 10000;

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `请求过于频繁，请${retryAfter}秒后再试` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { content, sections } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "请提供文档内容" }, { status: 400 });
    }

    if (content.length < 100) {
      return NextResponse.json({ error: "文档内容过少，建议补充后再检查" }, { status: 400 });
    }

    if (content.length > MAX_CHARS) {
      return NextResponse.json({ error: `文档过长，最多支持${MAX_CHARS}字` }, { status: 400 });
    }

    // Chunk document
    const chunks = chunkDocument(content);
    const allIssues: Issue[] = [];
    let summary: ReviewResult["summary"] = null;

    for (const chunk of chunks) {
      let retries = 0;
      let success = false;

      while (retries < 2 && !success) {
        try {
          const response = await client.messages.create({
            model: "mimo-v2.5-pro",
            max_tokens: 4096,
            system: buildSystemPrompt(),
            tools: [buildToolDefinition()],
            messages: [
              { role: "user", content: buildUserMessage(chunk.content, chunk.sectionHint) },
            ],
          });

          const toolBlock = response.content.find((b) => b.type === "tool_use");
          if (toolBlock && toolBlock.type === "tool_use") {
            const input = toolBlock.input as {
              issues: Array<Record<string, unknown>>;
              summary: ReviewResult["summary"];
            };

            if (input.issues) {
              allIssues.push(...input.issues.map(parseIssue));
            }
            if (input.summary && !summary) {
              summary = input.summary;
            }
          }
          success = true;
        } catch (error) {
          retries++;
          if (retries >= 2) throw error;
        }
      }
    }

    // Deduplicate
    const dedupedIssues = deduplicateIssues(allIssues);

    // Build summary if not provided
    if (!summary) {
      summary = {
        totalIssues: dedupedIssues.length,
        highCount: dedupedIssues.filter((i) => i.severity === "high").length,
        mediumCount: dedupedIssues.filter((i) => i.severity === "medium").length,
        lowCount: dedupedIssues.filter((i) => i.severity === "low").length,
        positiveFeedback: [],
      };
    }

    return NextResponse.json({ issues: dedupedIssues, summary });
  } catch (error: any) {
    console.error("Review API error:", error);
    return NextResponse.json(
      { error: error.message || "检查过程中出现错误，请重试" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify by starting dev server and testing with curl**

```bash
npm run dev
# In another terminal:
curl -X POST http://localhost:3000/api/review \
  -H "Content-Type: application/json" \
  -d '{"content": "# 测试PRD\n\n## 需求背景\n提升用户体验。"}'
```

Expected: Returns JSON with issues array (or error about document being too short).

- [ ] **Step 3: Commit**

```bash
git add app/api/review/route.ts
git commit -m "feat: add AI review API route with rate limiting and retry logic"
```

---

### Task 11: Upload Page

**Files:**
- Create: `components/upload/TextEditor.tsx`
- Create: `components/upload/ExamplePicker.tsx`
- Modify: `app/upload/page.tsx`

- [ ] **Step 1: Create TextEditor component**

Create `components/upload/TextEditor.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";

interface TextEditorProps {
  onSubmit: (content: string, fileName: string) => void;
}

export default function TextEditor({ onSubmit }: TextEditorProps) {
  const [text, setText] = useState("");

  const handleSubmit = useCallback(() => {
    if (text.trim().length < 100) {
      alert("文档内容过少（至少100字），建议补充后再检查");
      return;
    }
    onSubmit(text, "pasted-document.md");
  }, [text, onSubmit]);

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        粘贴PRD内容（Markdown格式）
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="# PRD文档标题&#10;&#10;## 需求背景&#10;...&#10;&#10;## 功能描述&#10;..."
        className="w-full h-96 p-4 border border-slate-300 dark:border-slate-600 rounded-lg resize-none font-mono text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">
          {text.length} 字 {text.length < 100 && text.length > 0 && "（至少需要100字）"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={text.trim().length < 100}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          开始检查
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ExamplePicker component**

Create `components/upload/ExamplePicker.tsx`:

```tsx
"use client";

const EXAMPLES = [
  { id: "ecommerce", name: "电商APP购物车优化PRD", file: "/examples/ecommerce-prd.md" },
  { id: "social", name: "陌生人社交产品PRD", file: "/examples/social-prd.md" },
  { id: "saas", name: "企业协作工具PRD", file: "/examples/saas-prd.md" },
];

interface ExamplePickerProps {
  onSelect: (content: string, fileName: string) => void;
}

export default function ExamplePicker({ onSelect }: ExamplePickerProps) {
  const handleSelect = async (example: (typeof EXAMPLES)[number]) => {
    try {
      const res = await fetch(example.file);
      const content = await res.text();
      onSelect(content, example.name);
    } catch {
      alert("加载示例失败，请重试");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        或选择示例PRD快速体验
      </label>
      <div className="flex gap-2 flex-wrap">
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            onClick={() => handleSelect(example)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            {example.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update upload page**

Replace `app/upload/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import TextEditor from "@/components/upload/TextEditor";
import ExamplePicker from "@/components/upload/ExamplePicker";

export default function UploadPage() {
  const router = useRouter();

  const handleSubmit = (content: string, fileName: string) => {
    sessionStorage.setItem("prd-content", content);
    sessionStorage.setItem("prd-filename", fileName);
    router.push("/review");
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">PRD Reviewer</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        上传或粘贴你的PRD文档，AI将帮你检查其中的问题
      </p>

      <div className="space-y-8">
        <TextEditor onSubmit={handleSubmit} />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">或</span>
          </div>
        </div>
        <ExamplePicker onSelect={handleSubmit} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify in browser**

Navigate to http://localhost:3000/upload, verify text editor and example picker render correctly.

- [ ] **Step 5: Commit**

```bash
git add components/upload/ app/upload/page.tsx
git commit -m "feat: add upload page with text editor and example picker"
```

---

### Task 12: Review Page - Basic Layout

**Files:**
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Create basic review page with sidebar layout**

Replace `app/review/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Issue, ReviewResult } from "@/types";

export default function ReviewPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [summary, setSummary] = useState<ReviewResult["summary"] | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedContent = sessionStorage.getItem("prd-content");
    const savedFileName = sessionStorage.getItem("prd-filename");
    if (!savedContent) {
      router.push("/upload");
      return;
    }
    setContent(savedContent);
    setFileName(savedFileName || "PRD文档");
    startReview(savedContent);
  }, []);

  const startReview = async (docContent: string) => {
    setStatus("analyzing");
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: docContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "检查失败");
      }
      const data = await res.json();
      setIssues(data.issues);
      setSummary(data.summary);
      setStatus("done");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{fileName}</h1>
          <span className="text-sm text-slate-500">
            {status === "analyzing" && "正在检查..."}
            {status === "done" && `检查完成，共发现 ${issues.length} 个问题`}
            {status === "error" && "检查出错"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/upload")}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition"
          >
            重新检查
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Left: Document */}
        <div className="w-[60%] p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-700">
          {status === "analyzing" && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-600">正在分析文档...</p>
              </div>
            </div>
          )}
          {status !== "analyzing" && (
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {content}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Issues */}
        <div className="w-[40%] p-6 overflow-y-auto">
          {status === "error" && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button
onClick={() => startReview(content)}
                className="mt-2 px-4 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                重试
              </button>
            </div>
          )}

          {status === "done" && summary && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="font-medium mb-2">
                共发现 {summary.totalIssues} 个问题
              </p>
              <div className="flex gap-3 text-sm">
                <span className="text-red-600">高: {summary.highCount}</span>
                <span className="text-orange-500">中: {summary.mediumCount}</span>
                <span className="text-blue-500">低: {summary.lowCount}</span>
              </div>
            </div>
          )}

          {issues.map((issue) => (
            <div
              key={issue.id}
              className="p-4 mb-3 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    issue.severity === "high"
                      ? "bg-red-100 text-red-700"
                      : issue.severity === "medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {issue.severity === "high" ? "高" : issue.severity === "medium" ? "中" : "低"}
                </span>
                <span className="text-xs text-slate-500">{issue.section}</span>
              </div>
              <p className="text-sm mb-2">{issue.description}</p>
              <p className="text-sm text-green-700 dark:text-green-400">{issue.suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the full flow**

1. Go to /upload, paste some text (100+ chars), click "开始检查"
2. Should redirect to /review, show loading spinner, then show issues

- [ ] **Step 3: Commit**

```bash
git add app/review/page.tsx
git commit -m "feat: add review page with sidebar layout and basic issue display"
```

---

## Phase 3: Interaction Polish

### Task 13: MarkdownViewer Component

**Files:**
- Create: `components/review/MarkdownViewer.tsx`
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Create MarkdownViewer**

Create `components/review/MarkdownViewer.tsx`:

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkSlug from "remark-slug";

interface MarkdownViewerProps {
  content: string;
  highlightSection?: string;
}

export default function MarkdownViewer({ content, highlightSection }: MarkdownViewerProps) {
  return (
    <div className="prose dark:prose-invert max-w-none prose-headings:scroll-margin-top-[80px]">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkSlug]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: Update review page to use MarkdownViewer**

In `app/review/page.tsx`, replace the `<pre>` block with:

```tsx
import MarkdownViewer from "@/components/review/MarkdownViewer";

// In the left panel, replace:
{/* <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{content}</pre> */}
<MarkdownViewer content={content} />
```

- [ ] **Step 3: Verify markdown renders correctly with tables, lists, headers**

- [ ] **Step 4: Commit**

```bash
git add components/review/MarkdownViewer.tsx app/review/page.tsx
git commit -m "feat: add MarkdownViewer with GFM support and heading anchors"
```

---

### Task 14: ProgressSteps Component

**Files:**
- Create: `components/review/ProgressSteps.tsx`
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Create ProgressSteps**

Create `components/review/ProgressSteps.tsx`:

```tsx
"use client";

interface Step {
  name: string;
  status: "pending" | "active" | "done";
  issueCount?: number;
}

interface ProgressStepsProps {
  steps: Step[];
}

export default function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={step.name} className="flex items-center gap-3 text-sm">
          <span className="w-5 text-center">
            {step.status === "done" && "✓"}
            {step.status === "active" && (
              <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {step.status === "pending" && "○"}
          </span>
          <span className={step.status === "pending" ? "text-slate-400" : ""}>
            {step.name}
          </span>
          {step.status === "done" && step.issueCount !== undefined && (
            <span className="text-slate-500">— 发现{step.issueCount}个问题</span>
          )}
          {step.status === "active" && (
            <span className="text-primary">— 分析中...</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add progress steps to review page**

In `app/review/page.tsx`, add ProgressSteps in the analyzing state:

```tsx
import ProgressSteps from "@/components/review/ProgressSteps";

// Add state for progress
const [progressSteps, setProgressSteps] = useState([
  { name: "逻辑完整性", status: "pending" as const },
  { name: "边界与异常", status: "pending" as const },
  { name: "术语一致性", status: "pending" as const },
  { name: "竞品与数据", status: "pending" as const },
]);

// In the analyzing state display, replace the spinner with:
<div className="flex items-center justify-center h-64">
  <div className="text-center">
    <ProgressSteps steps={progressSteps} />
  </div>
</div>
```

- [ ] **Step 3: Verify progress animation displays**

- [ ] **Step 4: Commit**

```bash
git add components/review/ProgressSteps.tsx app/review/page.tsx
git commit -m "feat: add progress steps animation during analysis"
```

---

### Task 15: Adopt/Ignore + localStorage

**Files:**
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Add adopt/ignore state and localStorage persistence**

Update `app/review/page.tsx` to add:

```tsx
import { loadIssueActions, saveIssueActions, saveReviewResult, loadReviewResult, saveDocument, loadDocument } from "@/lib/storage";
import { IssueAction } from "@/types";

// Add state
const [issueActions, setIssueActions] = useState<Record<string, IssueAction>>({});

// Load from localStorage on mount
useEffect(() => {
  const savedActions = loadIssueActions();
  setIssueActions(savedActions);
  const savedResult = loadReviewResult();
  if (savedResult) {
    setIssues(savedResult.issues);
    setSummary(savedResult.summary);
    setStatus("done");
  }
}, []);

// Save to localStorage when actions change
useEffect(() => {
  saveIssueActions(issueActions);
}, [issueActions]);

// Save review result when done
useEffect(() => {
  if (status === "done" && issues.length > 0) {
    saveReviewResult({ issues, summary });
  }
}, [status, issues, summary]);

// Handle adopt/ignore
const handleAction = (issueId: string, action: IssueAction) => {
  setIssueActions((prev) => ({
    ...prev,
    [issueId]: action === prev[issueId] ? "active" : action,
  }));
};
```

- [ ] **Step 2: Add adopt/ignore buttons to IssueCard**

Update the issue display in the right panel:

```tsx
<div className="flex gap-2 mt-2">
  <button
    onClick={() => handleAction(issue.id, "adopted")}
    className={`px-3 py-1 rounded text-xs transition ${
      issueActions[issue.id] === "adopted"
        ? "bg-green-100 text-green-700"
        : "bg-slate-100 text-slate-600 hover:bg-green-50"
    }`}
  >
    {issueActions[issue.id] === "adopted" ? "已采纳" : "采纳"}
  </button>
  <button
    onClick={() => handleAction(issue.id, "ignored")}
    className={`px-3 py-1 rounded text-xs transition ${
      issueActions[issue.id] === "ignored"
        ? "bg-slate-200 text-slate-500"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`}
  >
    {issueActions[issue.id] === "ignored" ? "已忽略" : "忽略"}
  </button>
</div>
```

- [ ] **Step 3: Add issue styling based on action state**

Wrap each issue card with conditional styling:

```tsx
<div
  className={`p-4 mb-3 border rounded-lg transition ${
    issueActions[issue.id] === "adopted"
      ? "border-green-200 bg-green-50 dark:bg-green-900/10"
      : issueActions[issue.id] === "ignored"
      ? "border-slate-200 bg-slate-50 dark:bg-slate-800/50 opacity-60"
      : "border-slate-200 dark:border-slate-700"
  }`}
>
```

- [ ] **Step 4: Verify adopt/ignore persists across page refresh**

- [ ] **Step 5: Commit**

```bash
git add app/review/page.tsx
git commit -m "feat: add adopt/ignore with localStorage persistence"
```

---

### Task 16: Issue Positioning (Click to Scroll)

**Files:**
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Add click-to-scroll functionality**

Update IssueCard to be clickable:

```tsx
<div
  onClick={() => {
    const el = document.getElementById(`heading-${issue.section}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }}
  className="p-4 mb-3 border rounded-lg cursor-pointer hover:border-primary/50 transition"
>
```

Note: `remark-slug` generates IDs from heading text. The heading "用户登录流程" gets id `heading-用户登录流程`. The AI returns section names that should match headings.

- [ ] **Step 2: Verify clicking an issue scrolls to the corresponding section**

- [ ] **Step 3: Commit**

```bash
git add app/review/page.tsx
git commit -m "feat: add click-to-scroll for issue positioning"
```

---

### Task 17: Example PRDs

**Files:**
- Create: `public/examples/ecommerce-prd.md`
- Create: `public/examples/social-prd.md`
- Create: `public/examples/saas-prd.md`

- [ ] **Step 1: Create ecommerce PRD example**

Create `public/examples/ecommerce-prd.md`:

```markdown
# 电商APP购物车优化 PRD

## 需求背景
当前购物车功能存在一些用户体验问题，需要优化。提升用户购买转化率。

## 目标用户
所有使用购物车的用户。

## 功能描述

### 购物车列表
- 展示用户已添加的商品
- 支持修改数量
- 支持删除商品

### 结算流程
- 点击结算按钮进入订单确认页
- 选择收货地址
- 选择支付方式
- 确认支付

## 异常处理
暂无。

## 数据指标
提升转化率。
```

Note: This PRD intentionally has issues: vague goals ("提升转化率" without metrics), missing boundary handling, no competitor analysis, incomplete user stories.

- [ ] **Step 2: Create social PRD example**

Create `public/examples/social-prd.md`:

```markdown
# 陌生人社交产品 PRD

## 1. 产品概述
打造一款基于兴趣的陌生人社交产品，让用户能够找到志同道合的朋友。

## 2. 目标用户
18-30岁的年轻人，希望拓展社交圈。

## 3. 核心功能

### 3.1 兴趣匹配
用户选择兴趣标签，系统匹配相似用户。
匹配算法基于标签重合度。

### 3.2 即时聊天
匹配成功后可发起聊天。
支持文字、图片消息。

### 3.3 个人主页
展示用户基本信息和兴趣标签。
支持编辑个人资料。

## 4. 非功能需求
- 响应时间 < 2秒
- 支持1000并发用户

## 5. 数据指标
DAU目标：10万。
```

Note: Issues: no boundary handling for chat, no content moderation mentioned, vague matching algorithm, no competitor analysis, missing privacy considerations.

- [ ] **Step 3: Create SaaS PRD example**

Create `public/examples/saas-prd.md`:

```markdown
# 企业协作工具 PRD

## 背景
企业内部沟通效率低，需要一个协作工具来提升团队效率。

## 功能需求

### 消息模块
- 支持一对一聊天
- 支持群组聊天
- 支持文件发送

### 任务模块
- 创建任务
- 分配任务
- 设置截止日期

### 文档模块
- 在线编辑文档
- 多人协作编辑

## 技术方案
使用WebSocket实现实时通信。
数据库使用MySQL。
部署在阿里云。
```

Note: Issues: no user roles/permissions, no data security considerations, no competitive analysis, no success metrics, missing error handling.

- [ ] **Step 4: Verify examples load correctly via ExamplePicker**

- [ ] **Step 5: Commit**

```bash
git add public/examples/
git commit -m "feat: add 3 example PRDs with intentional issues"
```

---

## Phase 4: Polish

### Task 18: Landing Page

**Files:**
- Create: `components/landing/Hero.tsx`
- Create: `components/landing/Features.tsx`
- Create: `components/landing/TechStack.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create Hero component**

Create `components/landing/Hero.tsx`:

```tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section className="text-center py-20 px-6">
      <h1 className="text-5xl font-bold mb-4">
        PRD <span className="text-primary">Reviewer</span>
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
        AI帮你审查产品需求文档，平均每次检查发现8.5个问题，其中40%是人工容易遗漏的
      </p>
      <Link
        href="/upload"
        className="inline-block px-8 py-3 bg-primary text-white rounded-lg text-lg font-medium hover:bg-blue-600 transition"
      >
        开始检查
      </Link>
    </section>
  );
}
```

- [ ] **Step 2: Create Features component**

Create `components/landing/Features.tsx`:

```tsx
const features = [
  { title: "逻辑完整性", desc: "检查需求目标是否可衡量、用户故事是否完整、验收标准是否明确", icon: "🔍" },
  { title: "边界与异常", desc: "发现异常流程遗漏、并发场景缺失、数据边界未处理等问题", icon: "⚡" },
  { title: "术语一致性", desc: "检测文档中术语混用、缩写未解释、概念命名不统一", icon: "📝" },
  { title: "竞品与数据", desc: "提示竞品分析缺失、优先级无依据、KPI未定义等问题", icon: "📊" },
];

export default function Features() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12">四大检查维度</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div key={f.title} className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-slate-600 dark:text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create TechStack component**

Create `components/landing/TechStack.tsx`:

```tsx
const tech = [
  "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui",
  "Anthropic SDK", "React Markdown", "Zeabur",
];

export default function TechStack() {
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-8">技术架构</h2>
      <div className="flex flex-wrap justify-center gap-3">
        {tech.map((t) => (
          <span key={t} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium">
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Update landing page**

Replace `app/page.tsx`:

```tsx
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import TechStack from "@/components/landing/TechStack";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <TechStack />
      <footer className="py-8 text-center text-sm text-slate-500">
        Built with AI • Open Source
      </footer>
    </main>
  );
}
```

- [ ] **Step 5: Verify landing page renders correctly**

- [ ] **Step 6: Commit**

```bash
git add components/landing/ app/page.tsx
git commit -m "feat: add landing page with hero, features, and tech stack"
```

---

### Task 19: Export Functionality

**Files:**
- Create: `components/review/ExportButton.tsx`
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Create ExportButton**

Create `components/review/ExportButton.tsx`:

```tsx
"use client";

import { Issue, ReviewSummary } from "@/types";

interface ExportButtonProps {
  issues: Issue[];
  summary: ReviewSummary | null;
  fileName: string;
}

function generateReport(issues: Issue[], summary: ReviewSummary | null, fileName: string): string {
  const now = new Date().toLocaleDateString("zh-CN");
  const severityLabel = (s: string) => (s === "high" ? "高" : s === "medium" ? "中" : "低");
  const dimensionLabel = (d: string) => {
    const map: Record<string, string> = { logic: "逻辑完整性", boundary: "边界与异常", terminology: "术语一致性", competitor: "竞品与数据" };
    return map[d] || d;
  };

  let report = `PRD Review Report - ${fileName}\n检查时间：${now}\n`;
  if (summary) {
    report += `共发现 ${summary.totalIssues} 个问题（高${summary.highCount}/中${summary.mediumCount}/低${summary.lowCount}）\n\n`;
  }

  if (summary?.positiveFeedback?.length) {
    report += `## 写得好的部分\n`;
    summary.positiveFeedback.forEach((f) => (report += `- ${f}\n`));
    report += "\n";
  }

  const grouped = { high: issues.filter((i) => i.severity === "high"), medium: issues.filter((i) => i.severity === "medium"), low: issues.filter((i) => i.severity === "low") };

  for (const [severity, group] of Object.entries(grouped)) {
    if (group.length === 0) continue;
    report += `## ${severityLabel(severity)}严重度问题\n`;
    group.forEach((issue, idx) => {
      report += `${idx + 1}. [${dimensionLabel(issue.dimension)}] ${issue.section} - ${issue.description}\n   建议：${issue.suggestion}\n\n`;
    });
  }

  return report;
}

export default function ExportButton({ issues, summary, fileName }: ExportButtonProps) {
  const handleExport = () => {
    const report = generateReport(issues, summary, fileName);
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prd-review-${fileName.replace(".md", "")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    const report = generateReport(issues, summary, fileName);
    navigator.clipboard.writeText(report);
    alert("已复制到剪贴板");
  };

  return (
    <div className="flex gap-2">
      <button onClick={handleExport} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-600 transition">
        导出报告
      </button>
      <button onClick={handleCopyAll} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition">
        复制全部
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add ExportButton to review page**

In `app/review/page.tsx`, add at the bottom of the header:

```tsx
import ExportButton from "@/components/review/ExportButton";

// In the header, add:
{status === "done" && (
  <ExportButton issues={issues} summary={summary} fileName={fileName} />
)}
```

- [ ] **Step 3: Verify export downloads a .md file**

- [ ] **Step 4: Commit**

```bash
git add components/review/ExportButton.tsx app/review/page.tsx
git commit -m "feat: add export functionality for review reports"
```

---

### Task 20: Positive Feedback + Quality Summary

**Files:**
- Create: `components/review/QualitySummary.tsx`
- Create: `components/review/PositiveFeedback.tsx`
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Create QualitySummary**

Create `components/review/QualitySummary.tsx`:

```tsx
"use client";

import { ReviewSummary } from "@/types";

interface QualitySummaryProps {
  summary: ReviewSummary;
}

export default function QualitySummary({ summary }: QualitySummaryProps) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
      <p className="font-medium mb-2">
        检查完成：共发现 {summary.totalIssues} 个问题
      </p>
      <div className="flex gap-3 text-sm mb-3">
        <span className="text-red-600">🔴 高严重度：{summary.highCount}个</span>
        <span className="text-orange-500">🟠 中严重度：{summary.mediumCount}个</span>
        <span className="text-blue-500">🔵 低严重度：{summary.lowCount}个</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create PositiveFeedback**

Create `components/review/PositiveFeedback.tsx`:

```tsx
"use client";

interface PositiveFeedbackProps {
  feedback: string[];
}

export default function PositiveFeedback({ feedback }: PositiveFeedbackProps) {
  if (!feedback || feedback.length === 0) return null;

  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg mb-6">
      <p className="font-medium text-green-800 dark:text-green-300 mb-2">✅ 写得好的部分</p>
      <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
        {feedback.map((f, i) => (
          <li key={i}>- {f}</li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Add to review page**

In `app/review/page.tsx`, add above the issues list:

```tsx
import QualitySummary from "@/components/review/QualitySummary";
import PositiveFeedback from "@/components/review/PositiveFeedback";

// In the right panel, when status === "done":
{summary && <QualitySummary summary={summary} />}
{summary?.positiveFeedback && <PositiveFeedback feedback={summary.positiveFeedback} />}
```

- [ ] **Step 4: Verify quality summary and positive feedback display**

- [ ] **Step 5: Commit**

```bash
git add components/review/QualitySummary.tsx components/review/PositiveFeedback.tsx app/review/page.tsx
git commit -m "feat: add quality summary and positive feedback display"
```

---

### Task 21: Confidence Display + Skeleton Loader

**Files:**
- Create: `components/review/SkeletonLoader.tsx`
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Create SkeletonLoader**

Create `components/review/SkeletonLoader.tsx`:

```tsx
export default function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="w-12 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add confidence badge to IssueCard**

In the issue display, add after the severity badge:

```tsx
<span className={`px-2 py-0.5 rounded text-xs ${
  issue.confidence >= 0.8 ? "bg-green-100 text-green-700" :
  issue.confidence >= 0.5 ? "bg-orange-100 text-orange-700" :
  "bg-slate-100 text-slate-600"
}`}>
  {issue.confidence >= 0.8 ? "高置信度" : issue.confidence >= 0.5 ? "中置信度" : "建议确认"}
</span>
```

- [ ] **Step 3: Use SkeletonLoader in analyzing state**

Replace the analyzing display with:

```tsx
import SkeletonLoader from "@/components/review/SkeletonLoader";

// In analyzing state:
<SkeletonLoader />
```

- [ ] **Step 4: Commit**

```bash
git add components/review/SkeletonLoader.tsx app/review/page.tsx
git commit -m "feat: add skeleton loader and confidence display"
```

---

### Task 22: Keyboard Shortcuts

**Files:**
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Add keyboard shortcut handler**

In `app/review/page.tsx`, add:

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + Enter: re-check
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      startReview(content);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [content]);
```

- [ ] **Step 2: Verify Cmd+Enter triggers re-check**

- [ ] **Step 3: Commit**

```bash
git add app/review/page.tsx
git commit -m "feat: add keyboard shortcuts"
```

---

### Task 23: Mobile Responsive

**Files:**
- Modify: `app/review/page.tsx`

- [ ] **Step 1: Add responsive layout**

Update the flex layout in review page:

```tsx
{/* Desktop: side by side, Mobile: stacked */}
<div className="flex-1 flex flex-col md:flex-row">
  {/* Left: Document */}
  <div className="w-full md:w-[60%] p-6 overflow-y-auto md:border-r border-slate-200 dark:border-slate-700">
    ...
  </div>

  {/* Right: Issues */}
  <div className="w-full md:w-[40%] p-6 overflow-y-auto">
    ...
  </div>
</div>
```

- [ ] **Step 2: Verify on mobile viewport (Chrome DevTools)**

- [ ] **Step 3: Commit**

```bash
git add app/review/page.tsx
git commit -m "feat: add mobile responsive layout"
```

---

## Phase 5: Deploy

### Task 24: Zeabur Deployment

**Files:**
- Create: `zeabur.json` (if needed)

- [ ] **Step 1: Push to GitHub**

```bash
git add .
git commit -m "chore: prepare for deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

- [ ] **Step 2: Deploy on Zeabur**

1. Go to https://zeabur.com, sign up/login
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo
4. Zeabur auto-detects Next.js and deploys
5. Add environment variables in Zeabur dashboard:
   - `MIMO_API_KEY` = your API key
   - `MIMO_BASE_URL` = https://token-plan-cn.xiaomimimo.com/anthropic

- [ ] **Step 3: Verify deployment**

1. Visit the Zeabur-provided URL
2. Test the full flow: upload → review → export
3. Verify all pages work

- [ ] **Step 4: Add custom domain (optional)**

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: deployment configuration"
```

---

### Task 25: Real PRD Testing + Test Report

- [ ] **Step 1: Test with 3 real PRDs**

Use the example PRDs and 1-2 real PRDs from your internship experience (if available).

- [ ] **Step 2: Document test results**

Create a summary:
- Total PRDs tested: X
- Total issues found: Y
- Issues by severity: high Z, medium W, low V
- Manual vs AI comparison (if applicable)

- [ ] **Step 3: Update README with test results and screenshots**

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "docs: add test results and README"
```
