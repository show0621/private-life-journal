export async function hashEntryPin(entryId: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${entryId}:${pin}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyEntryPin(
  entryId: string,
  pin: string,
  lockHash: string
): Promise<boolean> {
  return (await hashEntryPin(entryId, pin)) === lockHash;
}

export function privacyLabel(entry: { hidden?: boolean; locked?: boolean }): string {
  const parts: string[] = [];
  if (entry.hidden) parts.push("隱藏");
  if (entry.locked) parts.push("上鎖");
  return parts.length ? parts.join(" · ") : "一般";
}
