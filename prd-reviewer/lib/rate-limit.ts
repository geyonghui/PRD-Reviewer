const requests = new Map<string, number[]>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const timestamps = requests.get(ip) || [];
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
