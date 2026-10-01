const buckets = new Map<string, number[]>();

export function resetAssistantRateLimit(): void {
  buckets.clear();
}

export function allowAssistantRequest(
  tenantId: string,
  now = Date.now(),
  limit = 20,
  windowMs = 60_000,
): boolean {
  const recent = (buckets.get(tenantId) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= limit) {
    buckets.set(tenantId, recent);
    return false;
  }
  recent.push(now);
  buckets.set(tenantId, recent);
  return true;
}
