export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

function isUnreadableColor(color: string): boolean {
  const c = color.trim().toLowerCase();
  if (!c) return false;
  if (c === "inherit" || c === "transparent") return false;

  const rgb = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) {
    const [, r, g, b] = rgb.map(Number);
    return r > 210 && g > 210 && b > 210;
  }

  if (c.startsWith("#") && c.length >= 4) {
    const hex = c.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((x) => x + x)
            .join("")
        : hex.slice(0, 6);
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return r > 210 && g > 210 && b > 210;
  }

  return false;
}

export function sanitizeRichHtml(html: string): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("*").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const color = el.style.color;
    if (color && isUnreadableColor(color)) {
      el.style.removeProperty("color");
    }
    if (el.getAttribute("style") === "") el.removeAttribute("style");
    if (el.tagName === "FONT") el.removeAttribute("color");
  });
  return doc.body.innerHTML;
}

export function toPreviewText(content: string, format?: string): string {
  if (format === "html" || /<[^>]+>/.test(content)) {
    return stripHtml(content);
  }
  return content.replace(/\s+/g, " ").trim();
}

export function plainToHtml(text: string): string {
  if (!text) return "";
  if (/<[^>]+>/.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeInline(p.replace(/\n/g, "<br>"))}</p>`)
    .join("");
}

function escapeInline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function truncateContent(content: string, format?: string, max = 120): string {
  const clean = toPreviewText(content, format);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}
