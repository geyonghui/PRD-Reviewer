import { buildSystemPrompt, buildUserMessage } from "./prompt-builder";
import { chunkDocument } from "./markdown-utils";
import { parseIssue, deduplicateIssues } from "./issue-parser";
import { Issue, ReviewResult, ReviewSummary, Env } from "./types";

const DEFAULT_MODEL = "deepseek-v4-flash";
const MAX_CHARS = 10000;
const TIMEOUT_MS = 120000;

function parseJsonFromText(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      return null;
    }
  }
  return null;
}

async function callLLM(
  env: Env,
  content: string,
  sectionHint: string
): Promise<{ issues: Issue[]; summary: ReviewSummary | null }> {
  const response = await fetch(`${env.API_BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.MODEL_NAME || DEFAULT_MODEL,
      max_tokens: 4096,
      system: buildSystemPrompt(),
      messages: [
        { role: "user", content: buildUserMessage(content, sectionHint) },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock || !textBlock.text) {
    throw new Error("API returned no text content");
  }

  const parsed = parseJsonFromText(textBlock.text);
  if (!parsed || !Array.isArray(parsed.issues)) {
    throw new Error("Failed to parse API response as JSON");
  }

  return {
    issues: (parsed.issues as Record<string, unknown>[]).map(parseIssue),
    summary: parsed.summary as ReviewSummary | null,
  };
}

export async function handleReview(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as { content?: string };
    const { content } = body;

    if (!content || typeof content !== "string") {
      return Response.json({ error: "请提供文档内容" }, { status: 400 });
    }

    if (content.length < 100) {
      return Response.json({ error: "文档内容过少，建议补充后再检查" }, { status: 400 });
    }

    if (content.length > MAX_CHARS) {
      return Response.json({ error: `文档过长，最多支持${MAX_CHARS}字` }, { status: 400 });
    }

    const chunks = chunkDocument(content);
    const chunk = chunks[0];

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("请求超时，请重试")), TIMEOUT_MS)
    );

    const result = await Promise.race([
      callLLM(env, chunk.content, chunk.sectionHint),
      timeoutPromise,
    ]);

    const allIssues = result.issues;
    const dedupedIssues = deduplicateIssues(allIssues);

    const summary: ReviewSummary = result.summary || {
      totalIssues: dedupedIssues.length,
      highCount: dedupedIssues.filter((i) => i.severity === "high").length,
      mediumCount: dedupedIssues.filter((i) => i.severity === "medium").length,
      lowCount: dedupedIssues.filter((i) => i.severity === "low").length,
      positiveFeedback: [],
    };

    return Response.json({ issues: dedupedIssues, summary } satisfies ReviewResult);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "检查过程中出现错误，请重试";
    console.error("Review error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
