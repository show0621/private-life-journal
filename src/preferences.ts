import { DEFAULT_SYNC_SETTINGS, type SyncSettings } from "./types";

const SYNC_KEY = "life-journal-sync";

export function loadSyncSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (!raw) return { ...DEFAULT_SYNC_SETTINGS };
    return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SYNC_SETTINGS };
  }
}

export function saveSyncSettings(settings: SyncSettings): void {
  const toSave: SyncSettings = {
    ...settings,
    syncKey: settings.rememberSyncKey ? settings.syncKey : "",
  };
  localStorage.setItem(SYNC_KEY, JSON.stringify(toSave));
}
