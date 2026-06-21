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

export function privacyLabel(privacy?: string): string {
  if (privacy === "hidden") return "隱藏";
  if (privacy === "locked") return "上鎖";
  return "一般";
}
