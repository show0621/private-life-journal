export type EntryType = "diary" | "note" | "quick";
export type ContentFormat = "text" | "html";
export type ThemeMode = "dark" | "light" | "system";
/** @deprecated Legacy single-choice privacy; migrated to hidden/locked flags on load */
export type EntryPrivacy = "normal" | "hidden" | "locked";

export interface Entry {
  id: string;
  type: EntryType;
  title: string;
  content: string;
  format?: ContentFormat;
  tags?: string[];
  mood?: string;
  /** @deprecated Use hidden/locked instead */
  privacy?: EntryPrivacy;
  hidden?: boolean;
  locked?: boolean;
  lockHash?: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  dueTime?: string;
  remind?: boolean;
  notifiedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  note?: string;
  date: string;
  time?: string;
  remind?: boolean;
  notifiedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  entries: Entry[];
  todos: TodoItem[];
  events: CalendarEvent[];
}

export interface VaultPayloadV2 {
  version: 2;
  entries: Entry[];
  updatedAt: number;
}

export interface VaultPayload {
  version: 3;
  entries: Entry[];
  todos: TodoItem[];
  events: CalendarEvent[];
  updatedAt: number;
}

export interface EncryptedPayload {
  salt: string;
  iv: string;
  data: string;
}

export interface BackupFile {
  version: 1;
  exportedAt: number;
  salt: string;
  iv: string;
  data: string;
}

export interface SyncSettings {
  enabled: boolean;
  apiUrl: string;
  syncKey: string;
  rememberSyncKey: boolean;
  autoSync: boolean;
  lastSyncAt?: number;
  lastSyncStatus?: "ok" | "error";
}

export interface CloudVaultRecord {
  data: string;
  updatedAt: number;
}

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  diary: "日記",
  note: "筆記",
  quick: "隨手記",
};

export const MOOD_OPTIONS = ["😊", "😌", "😐", "😔", "😤", "🥹", "✨", "💭"];

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  enabled: false,
  apiUrl: "",
  syncKey: "",
  rememberSyncKey: false,
  autoSync: false,
};
