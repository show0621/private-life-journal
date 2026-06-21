import type {
  BackupFile,
  CalendarEvent,
  EncryptedPayload,
  Entry,
  TodoItem,
  VaultData,
  VaultPayload,
  VaultPayloadV2,
  VaultPayloadV3,
  CompanionState,
} from "./types";

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

async function decryptJson<T>(password: string, payload: EncryptedPayload): Promise<T> {
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
  let hidden = entry.hidden ?? false;
  let locked = entry.locked ?? false;

  if (entry.privacy === "hidden") hidden = true;
  if (entry.privacy === "locked") locked = true;

  const { privacy: _legacyPrivacy, ...rest } = entry;

  return {
    ...rest,
    tags: entry.tags ?? [],
    hidden,
    locked,
    format: entry.format ?? (/<[^>]+>/.test(entry.content) ? "html" : "text"),
  };
}

function normalizeTodo(todo: TodoItem): TodoItem {
  return {
    ...todo,
    done: !!todo.done,
    remind: todo.remind ?? false,
  };
}

function normalizeEvent(event: CalendarEvent): CalendarEvent {
  return {
    ...event,
    remind: event.remind ?? false,
  };
}

export function defaultCompanion(): CompanionState {
  return {
    mode: "none",
    level: 1,
    xp: 0,
    xpToNext: 100,
    stage: 0,
    hp: 30,
    maxHp: 30,
    weapons: [],
    battlesWon: 0,
    journalXpTotal: 0,
  };
}

function normalizeCompanion(_raw?: Partial<CompanionState> | null): CompanionState {
  return defaultCompanion();
}

function normalizePayload(raw: Entry[] | VaultPayloadV2 | VaultPayloadV3 | VaultPayload): VaultPayload {
  if (Array.isArray(raw)) {
    const entries = raw.map(normalizeEntry);
    const updatedAt = entries.reduce((max, e) => Math.max(max, e.updatedAt), Date.now());
    return { version: 4, entries, todos: [], events: [], companion: defaultCompanion(), updatedAt };
  }

  if (raw.version === 2) {
    const entries = raw.entries.map(normalizeEntry);
    return {
      version: 4,
      entries,
      todos: [],
      events: [],
      companion: defaultCompanion(),
      updatedAt: raw.updatedAt ?? entries.reduce((max, e) => Math.max(max, e.updatedAt), Date.now()),
    };
  }

  if (raw.version === 3) {
    const entries = raw.entries.map(normalizeEntry);
    const todos = (raw.todos ?? []).map(normalizeTodo);
    const events = (raw.events ?? []).map(normalizeEvent);
    return {
      version: 4,
      entries,
      todos,
      events,
      companion: defaultCompanion(),
      updatedAt: raw.updatedAt ?? Math.max(Date.now(), ...entries.map((e) => e.updatedAt), 0),
    };
  }

  const entries = raw.entries.map(normalizeEntry);
  const todos = (raw.todos ?? []).map(normalizeTodo);
  const events = (raw.events ?? []).map(normalizeEvent);
  return {
    version: 4,
    entries,
    todos,
    events,
    companion: normalizeCompanion(raw.companion),
    updatedAt: raw.updatedAt ?? Math.max(Date.now(), ...entries.map((e) => e.updatedAt), 0),
  };
}

export function buildVaultPayload(data: VaultData, updatedAt?: number): VaultPayload {
  const entries = data.entries.map(normalizeEntry);
  const todos = data.todos.map(normalizeTodo);
  const events = data.events.map(normalizeEvent);
  const stamps = [
    updatedAt ?? 0,
    ...entries.map((e) => e.updatedAt),
    ...todos.map((t) => t.updatedAt),
    ...events.map((e) => e.updatedAt),
  ];
  return {
    version: 4,
    entries,
    todos,
    events,
    companion: normalizeCompanion(data.companion),
    updatedAt: Math.max(Date.now(), ...stamps),
  };
}

export async function encryptVault(
  password: string,
  data: VaultData,
  existingSalt?: ArrayBuffer,
  updatedAt?: number
): Promise<ArrayBuffer> {
  const payload = buildVaultPayload(data, updatedAt);
  const encrypted = await encryptJson(password, payload, existingSalt);
  return new TextEncoder().encode(JSON.stringify(encrypted)).buffer;
}

export async function decryptVault(
  password: string,
  buffer: ArrayBuffer
): Promise<VaultData & { salt: ArrayBuffer; updatedAt: number }> {
  const payload = JSON.parse(new TextDecoder().decode(buffer)) as EncryptedPayload;
  const raw = await decryptJson<Entry[] | VaultPayloadV2 | VaultPayloadV3 | VaultPayload>(password, payload);
  const vault = normalizePayload(raw);
  return {
    entries: vault.entries,
    todos: vault.todos,
    events: vault.events,
    companion: vault.companion,
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
  return encryptVault(password, { entries, todos: [], events: [], companion: defaultCompanion() }, existingSalt);
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
  data: VaultData,
  existingSalt?: ArrayBuffer,
  updatedAt?: number
): Promise<BackupFile> {
  const encrypted = await encryptJson(password, buildVaultPayload(data, updatedAt), existingSalt);
  return {
    version: 1,
    exportedAt: Date.now(),
    ...encrypted,
  };
}

export async function restoreBackup(
  password: string,
  backup: BackupFile
): Promise<VaultData & { salt: ArrayBuffer; updatedAt: number }> {
  const raw = await decryptJson<Entry[] | VaultPayloadV2 | VaultPayloadV3 | VaultPayload>(password, backup);
  const vault = normalizePayload(raw);
  return {
    entries: vault.entries,
    todos: vault.todos,
    events: vault.events,
    companion: vault.companion,
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
  const data = await decryptVault(oldPassword, buffer);
  return encryptVault(
    newPassword,
    {
      entries: data.entries,
      todos: data.todos,
      events: data.events,
      companion: data.companion,
    },
    data.salt,
    data.updatedAt
  );
}
