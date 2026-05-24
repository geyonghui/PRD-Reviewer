import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserMessage } from "@/lib/prompt-builder";
import { chunkDocument } from "@/lib/markdown-utils";
import { parseIssue, deduplicateIssues } from "@/lib/issue-parser";
import { checkRateLimit } from "@/lib/rate-limit";
import { Issue, ReviewResult, ReviewSummary } from "@/types";

const MIMO_MODEL = "mimo-v2.5-pro";

const client = new Anthropic({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_BASE_URL || "https://token-plan-cn.xiaomimimo.com/anthropic",
});

const MAX_CHARS = 10000;

function parseJsonFromText(text: string): Record<string, unknown> | null {
  // Try to extract JSON from the response text
  // MIMO may return JSON wrapped in ```json ... ``` blocks or just raw JSON
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

export async function POST(request: NextRequest) {
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
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "请提供文档内容" }, { status: 400 });
    }

    if (content.length < 100) {
      return NextResponse.json({ error: "文档内容过少，建议补充后再检查" }, { status: 400 });
    }

    if (content.length > MAX_CHARS) {
      return NextResponse.json({ error: `文档过长，最多支持${MAX_CHARS}字` }, { status: 400 });
    }

    const chunks = chunkDocument(content);
    const allIssues: Issue[] = [];
    let summary: ReviewSummary | null = null;

    for (const chunk of chunks) {
      let retries = 0;
      let success = false;

      while (retries < 2 && !success) {
        try {
          const apiCall = client.messages.create({
            model: MIMO_MODEL,
            max_tokens: 4096,
            system: buildSystemPrompt(),
            messages: [
              { role: "user", content: buildUserMessage(chunk.content, chunk.sectionHint) },
            ],
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("请求超时，请重试")), 60000)
          );

          const response = await Promise.race([apiCall, timeoutPromise]);

          const textBlock = response.content.find((b) => b.type === "text");
          if (textBlock && textBlock.type === "text") {
            const parsed = parseJsonFromText(textBlock.text);
            if (parsed && Array.isArray(parsed.issues)) {
              allIssues.push(...parsed.issues.map(parseIssue));
              if (parsed.summary && !summary) {
                summary = parsed.summary as ReviewResult["summary"];
              }
            }
          }
          success = true;
        } catch (error) {
          retries++;
          if (retries >= 2) {
            console.error(`Chunk failed after retries: ${chunk.sectionHint}`, error);
          }
        }
      }
    }

    const dedupedIssues = deduplicateIssues(allIssues);

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
