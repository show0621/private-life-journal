export function sanitizeRichHtml(html: string): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("*").forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.removeProperty("color");
      el.style.removeProperty("background-color");
      el.style.removeProperty("background");
      if (el.getAttribute("style") === "") el.removeAttribute("style");
    }
    if (el.tagName === "FONT") {
      el.removeAttribute("color");
    }
  });
  return doc.body.innerHTML;
}

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
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
