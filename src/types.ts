export type EntryType = "diary" | "note" | "quick";
export type ContentFormat = "text" | "html";
export type ThemeMode = "dark" | "light" | "system";
export type EntryPrivacy = "normal" | "hidden" | "locked";

export interface Entry {
  id: string;
  type: EntryType;
  title: string;
  content: string;
  format?: ContentFormat;
  tags?: string[];
  mood?: string;
  privacy?: EntryPrivacy;
  lockHash?: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface VaultPayload {
  version: 2;
  entries: Entry[];
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
