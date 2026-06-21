import type { CloudVaultRecord, SyncSettings } from "./types";

export async function hashSyncKey(passphrase: string): Promise<string> {
  const encoded = new TextEncoder().encode(passphrase);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

async function requestCloud(
  settings: SyncSettings,
  method: "GET" | "PUT",
  body?: CloudVaultRecord
): Promise<Response> {
  const apiUrl = normalizeApiUrl(settings.apiUrl);
  if (!apiUrl) throw new Error("請設定同步 API 網址");
  if (!settings.syncKey) throw new Error("請設定同步金鑰");

  const syncId = await hashSyncKey(settings.syncKey);
  return fetch(`${apiUrl}/vault`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Sync-Key": syncId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function pushToCloud(
  settings: SyncSettings,
  buffer: ArrayBuffer,
  updatedAt: number
): Promise<void> {
  const record: CloudVaultRecord = {
    data: bufferToBase64(buffer),
    updatedAt,
  };
  const res = await requestCloud(settings, "PUT", record);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "上傳失敗");
  }
}

export async function pullFromCloud(
  settings: SyncSettings
): Promise<{ buffer: ArrayBuffer; updatedAt: number } | null> {
  const res = await requestCloud(settings, "GET");
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "下載失敗");
  }
  const record = (await res.json()) as CloudVaultRecord;
  return {
    buffer: base64ToBuffer(record.data),
    updatedAt: record.updatedAt,
  };
}

export async function testCloudConnection(settings: SyncSettings): Promise<boolean> {
  const apiUrl = normalizeApiUrl(settings.apiUrl);
  if (!apiUrl) throw new Error("請設定同步 API 網址");
  const res = await fetch(`${apiUrl}/health`, { method: "GET" });
  return res.ok;
}
