import { plainToHtml, sanitizeRichHtml } from "./html";

const COMMANDS: Array<{ cmd: string; label: string; title: string; value?: string }> = [
  { cmd: "bold", label: "B", title: "粗體" },
  { cmd: "italic", label: "I", title: "斜體" },
  { cmd: "underline", label: "U", title: "底線" },
  { cmd: "strikeThrough", label: "S", title: "刪除線" },
  { cmd: "formatBlock", label: "H2", title: "標題", value: "h2" },
  { cmd: "formatBlock", label: "H3", title: "小標", value: "h3" },
  { cmd: "insertUnorderedList", label: "•", title: "項目符號" },
  { cmd: "formatBlock", label: "❝", title: "引用", value: "blockquote" },
];

export const FONT_OPTIONS = [
  { label: "預設", value: "" },
  { label: "明朝", value: '"Noto Serif JP", "Noto Serif TC", "Yu Mincho", serif' },
  { label: "ゴシック", value: '"Noto Sans JP", "Segoe UI", "PingFang TC", sans-serif' },
  { label: "手書", value: '"Segoe Script", "KaiTi", cursive' },
];

export const SIZE_OPTIONS = [
  { label: "小", value: "14px" },
  { label: "中", value: "16px" },
  { label: "大", value: "20px" },
  { label: "特大", value: "26px" },
];

export const COLOR_OPTIONS = [
  { label: "預設", value: "" },
  { label: "墨", value: "#3d3a36" },
  { label: "藍", value: "#516b74" },
  { label: "灰", value: "#8a847a" },
  { label: "松", value: "#6d8f7f" },
  { label: "陽", value: "#b8925a" },
  { label: "淡", value: "#6d8a94" },
];

export function renderRichToolbar(): string {
  return `
    <div class="rich-toolbar" id="rich-toolbar">
      <div class="rich-toolbar-row">
        ${COMMANDS.map(
          (item) =>
            `<button type="button" class="rich-btn" data-cmd="${item.cmd}" data-value="${item.value ?? ""}" title="${item.title}">${item.label}</button>`
        ).join("")}
        <button type="button" class="rich-btn" data-cmd="createLink" title="連結">🔗</button>
        <button type="button" class="rich-btn" data-cmd="removeFormat" title="清除格式">⌫</button>
      </div>
      <div class="rich-toolbar-row rich-toolbar-meta">
        <select id="rich-font" class="rich-select" title="字體">
          ${FONT_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}
        </select>
        <select id="rich-size" class="rich-select" title="大小">
          ${SIZE_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}
        </select>
        <div class="color-palette" id="color-palette">
          ${COLOR_OPTIONS.map(
            (o) =>
              `<button type="button" class="color-dot ${o.value ? "" : "color-dot-default"}" data-color="${o.value}" title="${o.label}" ${o.value ? `style="--dot:${o.value}"` : ""}></button>`
          ).join("")}
        </div>
      </div>
    </div>
  `;
}

function applyInlineStyle(editor: HTMLElement, styles: Record<string, string>): void {
  editor.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  Object.assign(span.style, styles);
  try {
    range.surroundContents(span);
  } catch {
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }
  sel.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(span);
  next.collapse(false);
  sel.addRange(next);
}

function bindMetaControls(editor: HTMLElement, onChange: () => void): void {
  document.getElementById("rich-font")?.addEventListener("change", (e) => {
    const value = (e.target as HTMLSelectElement).value;
    if (value) applyInlineStyle(editor, { fontFamily: value });
    else document.execCommand("removeFormat", false);
    onChange();
  });

  document.getElementById("rich-size")?.addEventListener("change", (e) => {
    const value = (e.target as HTMLSelectElement).value;
    applyInlineStyle(editor, { fontSize: value });
    onChange();
  });

  document.getElementById("color-palette")?.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest(".color-dot") as HTMLElement | null;
    if (!btn) return;
    event.preventDefault();
    editor.focus();
    const color = btn.dataset.color ?? "";
    if (color) {
      document.execCommand("foreColor", false, color);
    } else {
      document.execCommand("removeFormat", false);
    }
    onChange();
  });
}

export function bindRichEditor(
  editor: HTMLElement,
  initialContent: string,
  format: string | undefined,
  onChange: () => void
): void {
  editor.innerHTML = sanitizeRichHtml(
    format === "html" || /<[^>]+>/.test(initialContent)
      ? initialContent
      : plainToHtml(initialContent)
  );
  editor.dataset.placeholder = "寫下此刻的想法…";
  editor.addEventListener("input", onChange);

  document.getElementById("rich-toolbar")?.addEventListener("click", (event) => {
    const btn = (event.target as HTMLElement).closest(".rich-btn") as HTMLElement | null;
    if (!btn) return;
    event.preventDefault();
    editor.focus();
    const cmd = btn.dataset.cmd!;
    const value = btn.dataset.value || undefined;

    if (cmd === "createLink") {
      const url = prompt("輸入連結網址：");
      if (url) document.execCommand("createLink", false, url);
      onChange();
      return;
    }

    document.execCommand(cmd, false, value);
    onChange();
  });

  bindMetaControls(editor, onChange);
}

export function getRichContent(editor: HTMLElement): { content: string; format: "html" } {
  const html = editor.innerHTML
    .replace(/<div><br><\/div>/gi, "")
    .replace(/^<br>$/i, "")
    .trim();
  if (!html || html === "<br>") return { content: "", format: "html" };
  return { content: sanitizeRichHtml(html), format: "html" };
}
