const buckets = new Map<string, number[]>();

export function resetAssistantRateLimit(): void {
  buckets.clear();
}

export function allowAssistantRequest(
  userId: string,
  now = Date.now(),
  limit = 20,
  windowMs = 60_000,
): boolean {
  const recent = (buckets.get(userId) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= limit) {
    buckets.set(userId, recent);
    return false;
  }
  recent.push(now);
  buckets.set(userId, recent);
  return true;
}
