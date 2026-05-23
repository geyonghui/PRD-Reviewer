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
        goodExample: `网络断开时，显示“网络异常，请检查网络”提示，缓存用户输入内容`,
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
        goodExample: `输入框最多50字符，超出部分截断并提示；为空时显示“请输入内容”占位符`,
        badExample: "用户可以输入内容",
        severity: "medium",
      },
      {
        id: "boundary-4",
        name: "权限降级方案",
        description: "应说明权限不足时的降级方案和提示信息",
        goodExample: `未登录用户点击收藏，弹出登录引导弹窗；普通用户点击管理按钮，按钮置灰并提示“需要管理员权限”`,
        badExample: "（未提及权限不足的处理）",
        severity: "medium",
      },
      {
        id: "boundary-5",
        name: "超时处理",
        description: "应说明长时间无响应时的处理方式",
        goodExample: `API请求超过10秒未返回，显示“请求超时，请重试”，自动重试1次`,
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
        goodExample: `全文统一使用“用户”指代产品使用者`,
        badExample: `文档中混用“用户”、“客户”、“使用者”、“会员”`,
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
