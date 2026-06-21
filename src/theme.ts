import type { ThemeMode } from "./types";

const STORAGE_KEY = "life-journal-theme";

export function getStoredTheme(): ThemeMode {
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return "light";
}

export function setStoredTheme(mode: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(mode: ThemeMode): "light" | "dark" {
  const resolved = resolveTheme(mode);
  document.documentElement.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "light" ? "#f5f0e8" : "#1a1814");
  return resolved;
}

export function getResolvedTheme(): "light" | "dark" {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" ? "light" : "dark";
}

export function initTheme(): ThemeMode {
  const mode = getStoredTheme();
  applyTheme(mode);
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });
  return mode;
}
