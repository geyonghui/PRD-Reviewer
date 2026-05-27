import { handleReview } from "./review";
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
  const allowed = ALLOWED_ORIGINS.find((o) => origin.startsWith(o));
  return allowed || null;
}

// 简易 IP 限流：每 IP 每分钟最多 10 次请求
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 10;
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= maxRequests) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

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

    // IP 限流
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (isRateLimited(ip)) {
      return Response.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: corsHeaders }
      );
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

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};
