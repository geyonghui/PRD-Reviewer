import { buildSystemPrompt, buildUserMessage } from "./prompt-builder";
import { chunkDocument } from "./markdown-utils";
import { parseIssue, deduplicateIssues } from "./issue-parser";
import { Issue, ReviewResult, ReviewSummary, Env } from "./types";

const DEFAULT_MODEL = "deepseek-v4-flash";
const MAX_CHARS = 30000;
const TIMEOUT_MS = 120000;
const MAX_RETRIES = 2;

// ==================== 公共工具函数 ====================

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

function validateContent(content: unknown): string | null {
  if (!content || typeof content !== "string") {
    return "请提供文档内容";
  }
  if (content.length < 100) {
    return "文档内容过少，建议补充后再检查";
  }
  if (content.length > MAX_CHARS) {
    return `文档过长，最多支持${MAX_CHARS}字`;
  }
  return null;
}

async function callLLMWithRetry(
  env: Env,
  content: string,
  sectionHint: string,
  retries = MAX_RETRIES
): Promise<{ issues: Issue[]; summary: ReviewSummary | null }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callLLM(env, content, sectionHint);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // 只对可重试的错误进行重试（网络超时、5xx、429）
      if (attempt < retries) {
        const msg = lastError.message;
        const isRetryable =
          msg.includes("超时") ||
          msg.includes("timeout") ||
          msg.includes("429") ||
          msg.includes("500") ||
          msg.includes("502") ||
          msg.includes("503");
        if (isRetryable) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }
      throw lastError;
    }
  }
  throw lastError || new Error("未知错误");
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

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock || !textBlock.text) {
    throw new Error("API returned no text content");
  }

  const parsed = parseJsonFromText(textBlock.text);
  if (!parsed || !Array.isArray(parsed.issues)) {
    throw new Error("AI 返回格式异常，请重试");
  }

  const rawIssues = (parsed.issues as Record<string, unknown>[]).map(parseIssue);
  const issues = rawIssues.filter((i): i is Issue => i !== null);

  return {
    issues,
    summary: parsed.summary as ReviewSummary | null,
  };
}

/** 公共审查逻辑：接收已验证的 content，返回去重后的结果 */
async function reviewDocument(
  content: string,
  env: Env,
  onChunkDone?: (index: number, total: number, chunkIssues: Issue[]) => void
): Promise<ReviewResult> {
  const chunks = chunkDocument(content);
  const allIssues: Issue[] = [];
  let lastSummary: ReviewSummary | null = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("请求超时，请重试")), TIMEOUT_MS)
    );

    const result = await Promise.race([
      callLLMWithRetry(env, chunk.content, chunk.sectionHint),
      timeoutPromise,
    ]);

    allIssues.push(...result.issues);
    if (result.summary) {
      lastSummary = result.summary;
    }
    onChunkDone?.(i, chunks.length, result.issues);
  }

  const dedupedIssues = deduplicateIssues(allIssues);

  const summary: ReviewSummary = lastSummary || {
    totalIssues: dedupedIssues.length,
    highCount: dedupedIssues.filter((i) => i.severity === "high").length,
    mediumCount: dedupedIssues.filter((i) => i.severity === "medium").length,
    lowCount: dedupedIssues.filter((i) => i.severity === "low").length,
    positiveFeedback: [],
  };

  return { issues: dedupedIssues, summary };
}

// ==================== HTTP Handlers ====================

export async function handleReview(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as { content?: unknown };
    const validationError = validateContent(body.content);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const result = await reviewDocument(body.content as string, env);
    return Response.json(result satisfies ReviewResult);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "检查过程中出现错误，请重试";
    console.error("Review error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function handleReviewStream(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as { content?: unknown };
    const validationError = validateContent(body.content);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const content = body.content as string;
    const chunks = chunkDocument(content);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(event: string, data: unknown) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        }

        try {
          sendEvent("start", { totalChunks: chunks.length });

          const result = await reviewDocument(content, env, (index, total, chunkIssues) => {
            sendEvent("chunk_start", { index, total });
            sendEvent("chunk_done", {
              index,
              total,
              issues: chunkIssues,
              chunkIssueCount: chunkIssues.length,
            });
          });

          sendEvent("done", { issues: result.issues, summary: result.summary });
          controller.close();
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "检查过程中出现错误，请重试";
          sendEvent("error", { error: message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "检查过程中出现错误，请重试";
    return Response.json({ error: message }, { status: 500 });
  }
}
