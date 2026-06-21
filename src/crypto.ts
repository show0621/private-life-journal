import type { BackupFile, EncryptedPayload, Entry, VaultPayload } from "./types";

const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

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

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptJson(
  password: string,
  payload: unknown,
  existingSalt?: ArrayBuffer
): Promise<EncryptedPayload> {
  const salt = existingSalt ?? crypto.getRandomValues(new Uint8Array(SALT_BYTES)).buffer;
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  return {
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(cipher),
  };
}

async function decryptJson<T>(
  password: string,
  payload: EncryptedPayload
): Promise<T> {
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const cipher = base64ToBuffer(payload.data);
  const key = await deriveKey(password, salt);

  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, cipher);
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    throw new Error("密碼錯誤或資料已損壞");
  }
}

function normalizeEntry(entry: Entry): Entry {
  return {
    ...entry,
    tags: entry.tags ?? [],
    privacy: entry.privacy ?? "normal",
    format: entry.format ?? (/<[^>]+>/.test(entry.content) ? "html" : "text"),
  };
}

function normalizePayload(raw: Entry[] | VaultPayload): VaultPayload {
  if (Array.isArray(raw)) {
    const entries = raw.map(normalizeEntry);
    const updatedAt = entries.reduce((max, e) => Math.max(max, e.updatedAt), Date.now());
    return { version: 2, entries, updatedAt };
  }
  const entries = raw.entries.map(normalizeEntry);
  return {
    version: 2,
    entries,
    updatedAt: raw.updatedAt ?? entries.reduce((max, e) => Math.max(max, e.updatedAt), Date.now()),
  };
}

export function buildVaultPayload(entries: Entry[], updatedAt?: number): VaultPayload {
  const normalized = entries.map(normalizeEntry);
  return {
    version: 2,
    entries: normalized,
    updatedAt: updatedAt ?? Math.max(Date.now(), ...normalized.map((e) => e.updatedAt), 0),
  };
}

export async function encryptVault(
  password: string,
  entries: Entry[],
  existingSalt?: ArrayBuffer,
  updatedAt?: number
): Promise<ArrayBuffer> {
  const payload = buildVaultPayload(entries, updatedAt);
  const encrypted = await encryptJson(password, payload, existingSalt);
  return new TextEncoder().encode(JSON.stringify(encrypted)).buffer;
}

export async function decryptVault(
  password: string,
  buffer: ArrayBuffer
): Promise<{ entries: Entry[]; salt: ArrayBuffer; updatedAt: number }> {
  const payload = JSON.parse(new TextDecoder().decode(buffer)) as EncryptedPayload;
  const raw = await decryptJson<Entry[] | VaultPayload>(password, payload);
  const vault = normalizePayload(raw);
  return {
    entries: vault.entries,
    salt: base64ToBuffer(payload.salt),
    updatedAt: vault.updatedAt,
  };
}

/** @deprecated use encryptVault */
export async function encryptEntries(
  password: string,
  entries: Entry[],
  existingSalt?: ArrayBuffer
): Promise<ArrayBuffer> {
  return encryptVault(password, entries, existingSalt);
}

/** @deprecated use decryptVault */
export async function decryptEntries(
  password: string,
  buffer: ArrayBuffer
): Promise<{ entries: Entry[]; salt: ArrayBuffer }> {
  const result = await decryptVault(password, buffer);
  return { entries: result.entries, salt: result.salt };
}

export async function createBackup(
  password: string,
  entries: Entry[],
  existingSalt?: ArrayBuffer,
  updatedAt?: number
): Promise<BackupFile> {
  const encrypted = await encryptJson(password, buildVaultPayload(entries, updatedAt), existingSalt);
  return {
    version: 1,
    exportedAt: Date.now(),
    ...encrypted,
  };
}

export async function restoreBackup(
  password: string,
  backup: BackupFile
): Promise<{ entries: Entry[]; salt: ArrayBuffer; updatedAt: number }> {
  const raw = await decryptJson<Entry[] | VaultPayload>(password, backup);
  const vault = normalizePayload(raw);
  return {
    entries: vault.entries,
    salt: base64ToBuffer(backup.salt),
    updatedAt: vault.updatedAt,
  };
}

export async function verifyPassword(password: string, buffer: ArrayBuffer): Promise<boolean> {
  try {
    await decryptVault(password, buffer);
    return true;
  } catch {
    return false;
  }
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  buffer: ArrayBuffer
): Promise<ArrayBuffer> {
  const { entries, salt, updatedAt } = await decryptVault(oldPassword, buffer);
  return encryptVault(newPassword, entries, salt, updatedAt);
}
