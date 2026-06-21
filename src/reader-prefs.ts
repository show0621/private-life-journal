export interface ReaderPreferences {
  fontScale: number;
  autoPrivacyShield: boolean;
}

const STORAGE_KEY = "life-journal-reader";
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.2;
const SCALE_STEP = 0.05;

export const DEFAULT_READER: ReaderPreferences = {
  fontScale: 0.88,
  autoPrivacyShield: true,
};

export function loadReaderPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_READER };
    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>;
    const fontScale = clampScale(parsed.fontScale ?? DEFAULT_READER.fontScale);
    return {
      fontScale,
      autoPrivacyShield: parsed.autoPrivacyShield ?? DEFAULT_READER.autoPrivacyShield,
    };
  } catch {
    return { ...DEFAULT_READER };
  }
}

export function saveReaderPreferences(prefs: ReaderPreferences): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      fontScale: clampScale(prefs.fontScale),
      autoPrivacyShield: prefs.autoPrivacyShield,
    })
  );
  applyReaderScale(prefs.fontScale);
}

function clampScale(value: number): number {
  const stepped = Math.round(value / SCALE_STEP) * SCALE_STEP;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, stepped));
}

export function applyReaderScale(scale?: number): void {
  const value = clampScale(scale ?? loadReaderPreferences().fontScale);
  document.documentElement.style.setProperty("--read-scale", String(value));
}

export function stepReaderScale(delta: number): number {
  const prefs = loadReaderPreferences();
  prefs.fontScale = clampScale(prefs.fontScale + delta * SCALE_STEP);
  saveReaderPreferences(prefs);
  return prefs.fontScale;
}

export function formatReaderScale(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}
