export interface ReaderPreferences {
  fontSize: number;
  autoPrivacyShield: boolean;
}

const STORAGE_KEY = "life-journal-reader";
export const MIN_READ_FONT = 11;
export const MAX_READ_FONT = 26;
const FONT_STEP = 1;

export const DEFAULT_READER: ReaderPreferences = {
  fontSize: 13,
  autoPrivacyShield: true,
};

export function loadReaderPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_READER };
    const parsed = JSON.parse(raw) as Partial<ReaderPreferences> & { fontScale?: number };
    const fontSize = clampFontSize(
      parsed.fontSize ??
        (parsed.fontScale != null ? Math.round(15 * parsed.fontScale) : DEFAULT_READER.fontSize)
    );
    return {
      fontSize,
      autoPrivacyShield: parsed.autoPrivacyShield ?? DEFAULT_READER.autoPrivacyShield,
    };
  } catch {
    return { ...DEFAULT_READER };
  }
}

export function saveReaderPreferences(prefs: ReaderPreferences): void {
  const next = {
    fontSize: clampFontSize(prefs.fontSize),
    autoPrivacyShield: prefs.autoPrivacyShield,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applyReaderFontSize(next.fontSize);
}

function clampFontSize(value: number): number {
  const rounded = Math.round(value);
  return Math.min(MAX_READ_FONT, Math.max(MIN_READ_FONT, rounded));
}

export function applyReaderFontSize(size?: number): void {
  const value = clampFontSize(size ?? loadReaderPreferences().fontSize);
  const px = `${value}px`;
  document.documentElement.style.setProperty("--read-font-size", px);
  document.querySelectorAll<HTMLElement>(".entry-readonly").forEach((el) => {
    el.style.setProperty("font-size", px, "important");
  });
}

export function setReaderFontSize(size: number): number {
  const prefs = loadReaderPreferences();
  prefs.fontSize = clampFontSize(size);
  saveReaderPreferences(prefs);
  return prefs.fontSize;
}

export function stepReaderFontSize(delta: number): number {
  return setReaderFontSize(loadReaderPreferences().fontSize + delta * FONT_STEP);
}

export function formatReaderFontSize(size: number): string {
  return `${size}px`;
}
