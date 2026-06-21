import { plainToHtml, sanitizeRichHtml } from "./html";

const COMMANDS: Array<{ cmd: string; label: string; title: string; value?: string }> = [
  { cmd: "bold", label: "B", title: "粗體" },
  { cmd: "italic", label: "I", title: "斜體" },
  { cmd: "underline", label: "U", title: "底線" },
  { cmd: "formatBlock", label: "H2", title: "標題", value: "h2" },
  { cmd: "formatBlock", label: "H3", title: "小標", value: "h3" },
  { cmd: "insertUnorderedList", label: "•", title: "項目符號" },
  { cmd: "formatBlock", label: "❝", title: "引用", value: "blockquote" },
];

export function renderRichToolbar(): string {
  return `
    <div class="rich-toolbar" id="rich-toolbar">
      ${COMMANDS.map(
        (item) =>
          `<button type="button" class="rich-btn" data-cmd="${item.cmd}" data-value="${item.value ?? ""}" title="${item.title}">${item.label}</button>`
      ).join("")}
      <button type="button" class="rich-btn" data-cmd="createLink" title="連結">🔗</button>
      <button type="button" class="rich-btn" data-cmd="removeFormat" title="清除格式">⌫</button>
    </div>
  `;
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
}

export function getRichContent(editor: HTMLElement): { content: string; format: "html" } {
  const html = editor.innerHTML
    .replace(/<div><br><\/div>/gi, "")
    .replace(/^<br>$/i, "")
    .trim();
  if (!html || html === "<br>") return { content: "", format: "html" };
  return { content: sanitizeRichHtml(html), format: "html" };
}
