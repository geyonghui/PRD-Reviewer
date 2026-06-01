import { handleReview, handleReviewStream } from "./review";
import { Env } from "./types";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://prd-reviewer.pages.dev",
];

function getCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function isAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin") || "";
  // 严格匹配：origin 必须完全等于白名单地址，或以 "/" 结尾的路径变体
  const allowed = ALLOWED_ORIGINS.find(
    (o) => origin === o || origin.startsWith(o + "/")
  );
  return allowed || null;
}

// 注意：Cloudflare Worker 是无状态的，内存 Map 限流不生效。
// 如需限流，请在 Cloudflare Dashboard 配置内置 Rate Limiting 规则，
// 或使用 Durable Objects / KV 实现分布式限流。

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = isAllowedOrigin(request);

    // 拒绝非允许来源
    if (!origin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const corsHeaders = getCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/review") {
      const response = await handleReview(request, env);
      const newHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    if (request.method === "POST" && url.pathname === "/api/review-stream") {
      const response = await handleReviewStream(request, env);
      const newHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value);
      }
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};
