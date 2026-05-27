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

  return `你是一位资深产品经理，专门负责PRD（产品需求文档）评审。你必须使用中文进行所有输出，包括问题描述、修改建议和正面反馈。你的任务是检查PRD文档中的问题，并给出具体的修改建议。

## 检查维度和规则

${rulesText}

## 输出要求

你必须返回一个JSON对象，不要包含任何其他文字，只返回纯JSON。JSON格式如下：

\`\`\`json
{
  "issues": [
    {
      "dimension": "logic|boundary|terminology|competitor",
      "severity": "high|medium|low",
      "section": "所在章节标题",
      "description": "问题描述",
      "suggestion": "具体修改建议",
      "confidence": 0.0到1.0之间的数字,
      "positiveNote": "该章节写得好的部分（可选）"
    }
  ],
  "summary": {
    "totalIssues": 问题总数,
    "highCount": 高严重度数量,
    "mediumCount": 中严重度数量,
    "lowCount": 低严重度数量,
    "positiveFeedback": ["写得好的部分1", "写得好的部分2"]
  }
}
\`\`\`

## 检查规则

1. 每个问题必须包含上述所有字段
2. dimension必须是 logic、boundary、terminology、competitor 之一
3. severity必须是 high、medium、low 之一
4. confidence是0-1之间的小数
5. 合并相似问题，避免重复
6. 在summary.positiveFeedback中列出文档写得好的部分
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

请按照检查规则逐一分析，返回JSON格式的检查结果。只返回JSON，不要包含其他文字。`;
}
