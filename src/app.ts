import {
  changePassword,
  createBackup,
  decryptVault,
  encryptVault,
  restoreBackup,
  verifyPassword,
} from "./crypto";
import { hashEntryPin, verifyEntryPin } from "./entry-lock";
import { truncateContent } from "./html";
import { loadSyncSettings, saveSyncSettings } from "./preferences";
import { bindRichEditor, getRichContent, renderRichToolbar } from "./rich-editor";
import { clearVault, hasVault, loadVault, saveVault } from "./storage";
import { scrollInputIntoView } from "./mobile";
import {
  loadNotificationPref,
  requestNotificationPermission,
  saveNotificationPref,
  startReminderLoop,
  stopReminderLoop,
} from "./notifications";
import {
  countForDate,
  eventsOnDate,
  formatDayLabel,
  formatMonthLabel,
  formatTimeLabel,
  getMonthGrid,
  getTodayReminders,
  shiftMonth,
  sortedTodos,
  todayKey,
  todosOnDate,
  WEEKDAY_LABELS,
} from "./planner";
import { pullFromCloud, pushToCloud, testCloudConnection } from "./sync";
import { getResolvedTheme, getStoredTheme, setStoredTheme } from "./theme";
import type { BackupFile, CalendarEvent, Entry, EntryType, SyncSettings, ThemeMode, TodoItem, VaultData } from "./types";
import { ENTRY_TYPE_LABELS, MOOD_OPTIONS } from "./types";
import {
  debounce,
  downloadJson,
  formatDateShort,
  formatDateTime,
  readJsonFile,
  todayTitle,
  uid,
} from "./utils";

const AUTO_LOCK_MS = 5 * 60 * 1000;

type View = "journal" | "calendar" | "todos" | "editor" | "settings" | "entry-unlock";

interface AppState {
  unlocked: boolean;
  password: string;
  salt?: ArrayBuffer;
  vaultUpdatedAt: number;
  entries: Entry[];
  todos: TodoItem[];
  events: CalendarEvent[];
  filter: EntryType | "all";
  tagFilter: string | null;
  search: string;
  showHidden: boolean;
  unlockedEntryIds: Set<string>;
  view: View;
  editingId: string | null;
  syncSettings: SyncSettings;
  lastActivity: number;
  calendarYear: number;
  calendarMonth: number;
  selectedDate: string;
  todoFilter: "all" | "active" | "done";
}

const now = new Date();
const state: AppState = {
  unlocked: false,
  password: "",
  vaultUpdatedAt: Date.now(),
  entries: [],
  todos: [],
  events: [],
  filter: "all",
  tagFilter: null,
  search: "",
  showHidden: false,
  unlockedEntryIds: new Set(),
  view: "journal",
  editingId: null,
  syncSettings: loadSyncSettings(),
  lastActivity: Date.now(),
  calendarYear: now.getFullYear(),
  calendarMonth: now.getMonth(),
  selectedDate: todayKey(),
  todoFilter: "active",
};

const root = document.getElementById("app")!;
let lockTimer: ReturnType<typeof setTimeout> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function touchActivity(): void {
  state.lastActivity = Date.now();
  resetLockTimer();
}

function resetLockTimer(): void {
  clearTimeout(lockTimer);
  if (!state.unlocked) return;
  lockTimer = setTimeout(() => lock(), AUTO_LOCK_MS);
}

function lock(): void {
  stopReminderLoop();
  state.unlocked = false;
  state.password = "";
  state.salt = undefined;
  state.entries = [];
  state.todos = [];
  state.events = [];
  state.view = "journal";
  state.editingId = null;
  state.unlockedEntryIds.clear();
  render();
}

function vaultData(): VaultData {
  return { entries: state.entries, todos: state.todos, events: state.events };
}

function loadVaultIntoState(data: VaultData & { salt: ArrayBuffer; updatedAt: number }): void {
  state.entries = data.entries;
  state.todos = data.todos;
  state.events = data.events;
  state.salt = data.salt;
  state.vaultUpdatedAt = data.updatedAt;
}

function beginReminderLoop(): void {
  startReminderLoop(
    () => ({ todos: state.todos, events: state.events }),
    (kind, id) => {
      const ts = Date.now();
      if (kind === "todo") {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.notifiedAt = ts;
      } else {
        const event = state.events.find((e) => e.id === id);
        if (event) event.notifiedAt = ts;
      }
      schedulePersist();
    }
  );
}

function isEntryHidden(entry: Entry): boolean {
  return !!entry.hidden;
}

function isEntryLocked(entry: Entry): boolean {
  return !!entry.locked && !!entry.lockHash;
}

function isEntryAccessible(entry: Entry): boolean {
  if (!isEntryLocked(entry)) return true;
  return state.unlockedEntryIds.has(entry.id);
}

async function persist(): Promise<void> {
  if (!state.unlocked) return;
  state.vaultUpdatedAt = Date.now();
  const buffer = await encryptVault(
    state.password,
    vaultData(),
    state.salt,
    state.vaultUpdatedAt
  );
  await saveVault(buffer);
  if (state.syncSettings.enabled && state.syncSettings.autoSync) {
    await runCloudSync(false);
  }
}

const schedulePersist = debounce(() => {
  void persist().catch((err) => showToast(String(err)));
}, 600);

function showToast(message: string): void {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast hidden";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el?.classList.add("hidden"), 2800);
}

function parseTags(raw: string): string[] {
  return [...new Set(raw.split(/[,，、]/).map((t) => t.trim()).filter(Boolean))];
}

function allTags(): string[] {
  const tags = new Set<string>();
  for (const entry of state.entries) {
    for (const tag of entry.tags ?? []) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function sortedEntries(): Entry[] {
  return [...state.entries].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

function filteredEntries(): Entry[] {
  const q = state.search.trim().toLowerCase();
  return sortedEntries().filter((entry) => {
    if (isEntryHidden(entry) && !state.showHidden) return false;
    if (state.filter !== "all" && entry.type !== state.filter) return false;
    if (state.tagFilter && !(entry.tags ?? []).includes(state.tagFilter)) return false;
    if (!q) return true;
    const haystack = [
      entry.title,
      truncateContent(entry.content, entry.format, 9999),
      ...(entry.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function getEntry(id: string): Entry | undefined {
  return state.entries.find((e) => e.id === id);
}

function upsertEntry(entry: Entry): void {
  const idx = state.entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) state.entries[idx] = entry;
  else state.entries.unshift(entry);
  schedulePersist();
}

function deleteEntry(id: string): void {
  state.entries = state.entries.filter((e) => e.id !== id);
  schedulePersist();
}

function upsertTodo(todo: TodoItem): void {
  const idx = state.todos.findIndex((t) => t.id === todo.id);
  if (idx >= 0) state.todos[idx] = todo;
  else state.todos.unshift(todo);
  schedulePersist();
}

function deleteTodo(id: string): void {
  state.todos = state.todos.filter((t) => t.id !== id);
  schedulePersist();
}

function upsertEvent(event: CalendarEvent): void {
  const idx = state.events.findIndex((e) => e.id === event.id);
  if (idx >= 0) state.events[idx] = event;
  else state.events.unshift(event);
  schedulePersist();
}

function deleteEvent(id: string): void {
  state.events = state.events.filter((e) => e.id !== id);
  schedulePersist();
}

function renderBrand(compact = false): string {
  return `
    <div class="brand">
      <p class="brand-mark">The Hideaway</p>
      <p class="brand-tagline">${compact ? "日記" : "青空の下、ことばを留めて"}</p>
    </div>
  `;
}

function badgeClass(type: EntryType): string {
  if (type === "diary") return "badge badge-diary";
  if (type === "note") return "badge badge-note";
  return "badge badge-quick";
}

function renderEntryCard(entry: Entry): string {
  const isLocked = isEntryLocked(entry);
  const isHidden = isEntryHidden(entry);
  const cardClass = [
    "entry-card",
    isHidden ? "is-hidden" : "",
    isLocked ? "is-locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <button class="${cardClass}" data-id="${entry.id}">
      <div class="entry-card-top">
        <span class="${badgeClass(entry.type)}">${ENTRY_TYPE_LABELS[entry.type]}</span>
        <span>
          ${isLocked ? "🔒" : ""}${isHidden ? "🙈" : ""}${entry.mood ?? ""}${entry.pinned ? " 📌" : ""}
        </span>
      </div>
      <h3>${escapeHtml(isLocked ? "已上鎖的記錄" : entry.title || "（無標題）")}</h3>
      <p>${isLocked ? "需要 PIN 碼才能查看" : escapeHtml(truncateContent(entry.content, entry.format)) || "（空白）"}</p>
      ${
        (entry.tags ?? []).length && !isLocked
          ? `<div class="entry-tags">${(entry.tags ?? [])
              .map((tag) => `<span class="entry-tag">#${escapeHtml(tag)}</span>`)
              .join("")}</div>`
          : ""
      }
      <div class="entry-meta">${formatDateTime(entry.updatedAt)}</div>
    </button>
  `;
}

function renderTagFilters(): string {
  const tags = allTags();
  if (!tags.length) return "";
  return `
    <div class="tag-filter">
      <button class="tag-chip ${state.tagFilter === null ? "active" : ""}" data-tag="">全部標籤</button>
      ${tags
        .map(
          (tag) => `
        <button class="tag-chip ${state.tagFilter === tag ? "active" : ""}" data-tag="${escapeHtml(tag)}">
          #${escapeHtml(tag)}
        </button>
      `
        )
        .join("")}
    </div>
  `;
}

async function runCloudSync(manual: boolean): Promise<void> {
  const settings = state.syncSettings;
  if (!settings.enabled || !settings.apiUrl || !settings.syncKey) {
    if (manual) showToast("請先完成雲端同步設定");
    return;
  }

  try {
    const localBuffer = await loadVault();
    if (!localBuffer) throw new Error("找不到本地資料");

    const remote = await pullFromCloud(settings);
    if (remote && remote.updatedAt > state.vaultUpdatedAt) {
      const shouldPull =
        !manual ||
        confirm("雲端有較新的備份，是否下載並覆蓋本機？（取消則改為上傳本機）");
      if (shouldPull) {
        const { entries, todos, events, salt, updatedAt } = await decryptVault(state.password, remote.buffer);
        loadVaultIntoState({ entries, todos, events, salt, updatedAt });
        await saveVault(remote.buffer);
        settings.lastSyncAt = Date.now();
        settings.lastSyncStatus = "ok";
        saveSyncSettings(settings);
        state.syncSettings = loadSyncSettings();
        if (manual) showToast("已從雲端同步");
        if (state.view === "journal" || state.view === "calendar" || state.view === "todos") render();
        return;
      }
    }

    await pushToCloud(settings, localBuffer, state.vaultUpdatedAt);
    settings.lastSyncAt = Date.now();
    settings.lastSyncStatus = "ok";
    saveSyncSettings(settings);
    state.syncSettings = loadSyncSettings();
    if (manual) showToast("已上傳至雲端");
  } catch (err) {
    settings.lastSyncStatus = "error";
    saveSyncSettings(settings);
    state.syncSettings = loadSyncSettings();
    if (manual) showToast(String(err));
  }
}

function renderAuth(): void {
  root.innerHTML = `
    <div class="auth-screen">
      <div class="auth-card glass-panel" id="auth-card"></div>
    </div>
  `;
  void setupAuth();
}

async function setupAuth(): Promise<void> {
  const exists = await hasVault();
  const card = document.getElementById("auth-card")!;
  card.innerHTML = exists ? renderUnlockForm() : renderSetupForm();
  bindAuthEvents(exists);
}

function renderSetupForm(): string {
  return `
    <div class="auth-brand">${renderBrand().trim()}</div>
    <h1>Welcome in</h1>
    <p>設定你的密碼。文字只留在這裡，由你加密保管。</p>
    <form id="setup-form">
      <div class="field">
        <label for="setup-password">密碼</label>
        <input id="setup-password" type="password" autocomplete="new-password" minlength="6" required placeholder="至少 6 個字元" enterkeyhint="next" />
      </div>
      <div class="field">
        <label for="setup-confirm">確認密碼</label>
        <input id="setup-confirm" type="password" autocomplete="new-password" minlength="6" required placeholder="再輸入一次" enterkeyhint="done" />
      </div>
      <p class="error-text" id="auth-error"></p>
      <button class="btn btn-primary btn-block" type="submit">開始使用</button>
    </form>
    <div class="security-note">
      資料預設只存在本機。可選擇開啟雲端同步（仍為加密資料），或定期匯出備份。
    </div>
  `;
}

function renderUnlockForm(): string {
  return `
    <div class="auth-brand">${renderBrand().trim()}</div>
    <p style="margin-top:-8px">輸入密碼，回到你的角落。</p>
    <form id="unlock-form">
      <div class="field">
        <label for="unlock-password">密碼</label>
        <input id="unlock-password" type="password" autocomplete="current-password" required placeholder="輸入密碼" enterkeyhint="go" />
      </div>
      <p class="error-text" id="auth-error"></p>
      <button class="btn btn-primary btn-block" type="submit">解鎖</button>
    </form>
    <div class="security-note">
      內容以 AES-256 加密儲存。若忘記密碼，只能清除資料重新開始（無法復原）。
    </div>
  `;
}

function bindAuthEvents(exists: boolean): void {
  const errorEl = document.getElementById("auth-error")!;

  if (exists) {
    document.getElementById("unlock-form")!.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      const password = (document.getElementById("unlock-password") as HTMLInputElement).value;
      const buffer = await loadVault();
      if (!buffer) {
        errorEl.textContent = "找不到資料，請重新建立。";
        return;
      }
      try {
        const { entries, todos, events, salt, updatedAt } = await decryptVault(password, buffer);
        state.unlocked = true;
        state.password = password;
        loadVaultIntoState({ entries, todos, events, salt, updatedAt });
        touchActivity();
        beginReminderLoop();
        render();
        if (state.syncSettings.enabled) void runCloudSync(false);
      } catch {
        errorEl.textContent = "密碼錯誤，請再試一次。";
      }
    });
    return;
  }

  document.getElementById("setup-form")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    const password = (document.getElementById("setup-password") as HTMLInputElement).value;
    const confirm = (document.getElementById("setup-confirm") as HTMLInputElement).value;
    if (password.length < 6) {
      errorEl.textContent = "密碼至少需要 6 個字元。";
      return;
    }
    if (password !== confirm) {
      errorEl.textContent = "兩次輸入的密碼不一致。";
      return;
    }
    state.entries = [];
    state.todos = [];
    state.events = [];
    state.vaultUpdatedAt = Date.now();
    const buffer = await encryptVault(password, vaultData(), undefined, state.vaultUpdatedAt);
    await saveVault(buffer);
    const data = await decryptVault(password, buffer);
    state.unlocked = true;
    state.password = password;
    loadVaultIntoState(data);
    touchActivity();
    beginReminderLoop();
    render();
  });
}

function renderAppHeader(options?: { showHiddenToggle?: boolean }): string {
  const showHiddenToggle = options?.showHiddenToggle ?? state.view === "journal";
  return `
    <header class="app-header">
      ${renderBrand(true)}
      <div class="header-actions">
        ${showHiddenToggle ? `<button class="icon-btn ${state.showHidden ? "active" : ""}" id="btn-hidden" title="顯示隱藏項目">🙈</button>` : ""}
        <button class="icon-btn mobile-hide" id="btn-theme" title="切換主題">${getResolvedTheme() === "light" ? "🌙" : "☀️"}</button>
        <button class="icon-btn" id="btn-settings" title="設定">⚙️</button>
        <button class="icon-btn" id="btn-lock" title="上鎖">🔒</button>
      </div>
    </header>
  `;
}

function renderBottomNav(active: "journal" | "calendar" | "todos"): string {
  const items = [
    { id: "journal", label: "日記" },
    { id: "calendar", label: "行事曆" },
    { id: "todos", label: "待辦" },
  ] as const;
  return `
    <nav class="bottom-nav">
      ${items
        .map(
          (item) => `
        <button class="nav-item ${active === item.id ? "active" : ""}" data-nav="${item.id}" type="button">
          ${item.label}
        </button>
      `
        )
        .join("")}
    </nav>
  `;
}

function renderTodayPanel(): string {
  const items = getTodayReminders(state.todos, state.events);
  if (!items.length) {
    return `
      <section class="line-card today-panel">
        <div class="section-head">
          <h3>今日</h3>
          <span class="section-note">${formatDayLabel(todayKey())}</span>
        </div>
        <p class="muted-copy">今天沒有行程或待辦，好好放鬆一下。</p>
      </section>
    `;
  }

  return `
    <section class="line-card today-panel">
      <div class="section-head">
        <h3>今日提醒</h3>
        <span class="section-note">${formatDayLabel(todayKey())}</span>
      </div>
      <ul class="reminder-list">
        ${items
          .map(
            (item) => `
          <li class="reminder-item">
            <span class="reminder-kind">${item.kind === "event" ? "行程" : "待辦"}</span>
            <span class="reminder-time">${formatTimeLabel(item.time)}</span>
            <span class="reminder-title">${escapeHtml(item.title)}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    </section>
  `;
}

function renderJournal(): string {
  const entries = filteredEntries();
  const tabs: Array<{ id: EntryType | "all"; label: string }> = [
    { id: "all", label: "全部" },
    { id: "diary", label: "日記" },
    { id: "note", label: "筆記" },
    { id: "quick", label: "隨手記" },
  ];

  return `
    <div class="screen with-nav">
      ${renderAppHeader()}
      ${renderTodayPanel()}

      <div class="tabs">
        ${tabs
          .map(
            (tab) => `
          <button class="tab ${state.filter === tab.id ? "active" : ""}" data-filter="${tab.id}">
            ${tab.label}
          </button>
        `
          )
          .join("")}
      </div>

      <div class="search-bar">
        <input id="search-input" type="search" placeholder="搜尋標題、內容或標籤…" value="${escapeHtml(state.search)}" />
      </div>

      ${renderTagFilters()}

      <div class="entry-list" id="entry-list">
        ${
          entries.length === 0
            ? `<div class="empty-state"><p>這裡還是空的</p><p>點右下角的 ＋ 寫下第一篇吧</p></div>`
            : entries.map(renderEntryCard).join("")
        }
      </div>
    </div>
    ${renderBottomNav("journal")}
    <button class="fab" id="btn-new" title="新增">+</button>
  `;
}

function renderCalendar(): string {
  const grid = getMonthGrid(state.calendarYear, state.calendarMonth);
  const dayEvents = eventsOnDate(state.events, state.selectedDate);
  const dayTodos = todosOnDate(state.todos, state.selectedDate).filter((t) => !t.done);

  return `
    <div class="screen with-nav">
      ${renderAppHeader()}

      <section class="line-card calendar-card">
        <div class="calendar-head">
          <button class="icon-line-btn" id="cal-prev" type="button">←</button>
          <h2>${formatMonthLabel(state.calendarYear, state.calendarMonth)}</h2>
          <button class="icon-line-btn" id="cal-next" type="button">→</button>
        </div>

        <div class="calendar-weekdays">
          ${WEEKDAY_LABELS.map((d) => `<span>${d}</span>`).join("")}
        </div>

        <div class="calendar-grid">
          ${grid
            .map((cell) => {
              const count = countForDate(state.todos, state.events, cell.date);
              return `
              <button
                type="button"
                class="calendar-day ${cell.inMonth ? "" : "is-out"} ${cell.isToday ? "is-today" : ""} ${state.selectedDate === cell.date ? "is-selected" : ""}"
                data-date="${cell.date}"
              >
                <span>${parseInt(cell.date.slice(8), 10)}</span>
                ${count ? `<i class="day-dot"></i>` : ""}
              </button>
            `;
            })
            .join("")}
        </div>
      </section>

      <section class="line-card day-panel">
        <div class="section-head">
          <h3>${formatDayLabel(state.selectedDate)}</h3>
        </div>

        <ul class="planner-list">
          ${
            dayEvents.length + dayTodos.length === 0
              ? `<li class="planner-empty">這天還沒有安排</li>`
              : [
                  ...dayEvents.map(
                    (e) => `
                <li class="planner-item" data-kind="event" data-id="${e.id}">
                  <span class="planner-time">${formatTimeLabel(e.time)}</span>
                  <span class="planner-title">${escapeHtml(e.title)}</span>
                  ${e.remind ? `<span class="planner-tag">提醒</span>` : ""}
                  <button type="button" class="item-delete" data-delete-event="${e.id}">×</button>
                </li>
              `
                  ),
                  ...dayTodos.map(
                    (t) => `
                <li class="planner-item" data-kind="todo" data-id="${t.id}">
                  <span class="planner-time">${formatTimeLabel(t.dueTime)}</span>
                  <span class="planner-title">${escapeHtml(t.title)}</span>
                  <span class="planner-tag">待辦</span>
                </li>
              `
                  ),
                ].join("")
          }
        </ul>

        <form class="planner-form" id="add-event-form">
          <input id="event-title" placeholder="新增行程或提醒" required enterkeyhint="done" autocapitalize="sentences" />
          <div class="planner-form-row">
            <input id="event-time" type="time" />
            <label class="inline-check"><input id="event-remind" type="checkbox" checked /> 提醒</label>
          </div>
          <button class="btn btn-primary btn-block btn-touch" type="submit">加入行事曆</button>
        </form>
      </section>
    </div>
    ${renderBottomNav("calendar")}
  `;
}

function renderTodos(): string {
  const todos = sortedTodos(state.todos, state.todoFilter);

  return `
    <div class="screen with-nav">
      ${renderAppHeader()}

      <section class="line-card">
        <form class="todo-add-form" id="add-todo-form">
          <input id="todo-title" placeholder="新增待辦事項…" required enterkeyhint="next" autocapitalize="sentences" />
          <div class="planner-form-row">
            <input id="todo-date" type="date" value="${todayKey()}" />
            <input id="todo-time" type="time" />
          </div>
          <label class="inline-check"><input id="todo-remind" type="checkbox" checked /> 到期提醒</label>
          <button class="btn btn-primary btn-block btn-touch" type="submit">加入待辦</button>
        </form>
      </section>

      <div class="filter-row">
        ${(["active", "all", "done"] as const)
          .map((f) => {
            const labels = { active: "進行中", all: "全部", done: "已完成" };
            return `<button type="button" class="filter-chip ${state.todoFilter === f ? "active" : ""}" data-todo-filter="${f}">${labels[f]}</button>`;
          })
          .join("")}
      </div>

      <div class="todo-list" id="todo-list">
        ${
          todos.length === 0
            ? `<div class="empty-state compact"><p>沒有待辦事項</p></div>`
            : todos
                .map(
                  (todo) => `
            <div class="todo-item ${todo.done ? "is-done" : ""}" data-id="${todo.id}">
              <label class="todo-check">
                <input type="checkbox" data-toggle-todo="${todo.id}" ${todo.done ? "checked" : ""} />
                <span>${escapeHtml(todo.title)}</span>
              </label>
              <div class="todo-meta">
                ${todo.dueDate ? `<span>${formatDateShort(todo.dueDate)}${todo.dueTime ? ` · ${todo.dueTime}` : ""}</span>` : ""}
                ${todo.remind ? `<span class="planner-tag">提醒</span>` : ""}
              </div>
              <button type="button" class="item-delete" data-delete-todo="${todo.id}">×</button>
            </div>
          `
                )
                .join("")
        }
      </div>
    </div>
    ${renderBottomNav("todos")}
  `;
}

function renderEntryUnlock(_entry: Entry): string {
  return `
    <div class="auth-screen">
      <div class="panel glass-panel">
        <h2>🔒 此記錄已上鎖</h2>
        <p>輸入這篇記錄的 PIN 碼以查看內容。</p>
        <form id="entry-unlock-form">
          <div class="field">
            <label for="entry-pin">PIN 碼</label>
            <input id="entry-pin" type="password" inputmode="numeric" autocomplete="off" required placeholder="輸入 PIN" />
          </div>
          <p class="error-text" id="entry-unlock-error"></p>
          <div class="editor-actions">
            <button type="button" class="btn btn-secondary" id="btn-unlock-back">返回</button>
            <button type="submit" class="btn btn-primary">解鎖</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderEditor(entry: Entry): string {
  return `
    <div class="editor-screen">
      <div class="editor-sticky-top">
        <button class="btn btn-secondary btn-touch" type="button" id="btn-back">← 返回</button>
        <button class="btn btn-primary btn-touch" type="submit" form="editor-form" id="btn-save-top">儲存</button>
      </div>

      <form class="editor-form" id="editor-form">
        <div class="field">
          <label for="entry-type">類型</label>
          <select id="entry-type">
            <option value="diary" ${entry.type === "diary" ? "selected" : ""}>日記</option>
            <option value="note" ${entry.type === "note" ? "selected" : ""}>筆記</option>
            <option value="quick" ${entry.type === "quick" ? "selected" : ""}>隨手記</option>
          </select>
        </div>

        <input class="editor-title" id="entry-title" placeholder="標題（可留空）" value="${escapeHtml(entry.title)}" enterkeyhint="next" autocapitalize="sentences" />

        <div class="field">
          <label for="entry-tags">標籤</label>
          <input id="entry-tags" placeholder="以逗號分隔，例如：工作, 心情, 旅行" value="${escapeHtml((entry.tags ?? []).join(", "))}" enterkeyhint="next" autocapitalize="off" />
        </div>

        ${
          entry.type === "diary"
            ? `
          <div class="field">
            <label>今日心情</label>
            <div class="mood-row" id="mood-row">
              ${MOOD_OPTIONS.map(
                (m) =>
                  `<button type="button" class="mood-btn ${entry.mood === m ? "selected" : ""}" data-mood="${m}">${m}</button>`
              ).join("")}
            </div>
          </div>
        `
            : ""
        }

        <div class="field">
          <label>內容</label>
          ${renderRichToolbar()}
          <div class="rich-editor" id="entry-content" contenteditable="true" autocapitalize="sentences" spellcheck="true"></div>
        </div>

        <details class="editor-advanced">
          <summary>隱私與進階</summary>
          <div class="privacy-row">
            <div class="privacy-toggles">
              <label class="privacy-toggle">
                <input type="checkbox" id="entry-hidden" ${entry.hidden ? "checked" : ""} />
                隱藏（不在清單顯示）
              </label>
              <label class="privacy-toggle">
                <input type="checkbox" id="entry-locked" ${entry.locked ? "checked" : ""} />
                上鎖（需 PIN 才能查看）
              </label>
            </div>
            <div class="field entry-pin-field" id="entry-pin-field" style="margin:0;${entry.locked ? "" : "display:none"}">
              <label for="entry-pin-set">${entry.lockHash ? "變更 PIN" : "設定 PIN"}</label>
              <input id="entry-pin-set" type="password" inputmode="numeric" autocomplete="new-password" placeholder="至少 4 碼" enterkeyhint="done" />
            </div>
          </div>

          <label class="privacy-toggle pin-row">
            <input type="checkbox" id="entry-pinned" ${entry.pinned ? "checked" : ""} />
            釘選置頂
          </label>

          <button class="btn btn-danger btn-block btn-touch" type="button" id="btn-delete">刪除此記錄</button>
        </details>

        <div class="editor-actions editor-actions-inline">
          <button class="btn btn-primary btn-block btn-touch" type="submit">儲存</button>
        </div>
      </form>

      <div class="editor-sticky-bottom">
        <button class="btn btn-primary btn-block btn-touch" type="submit" form="editor-form">儲存</button>
      </div>
    </div>
  `;
}

function renderSettings(): string {
  const theme = getStoredTheme();
  const sync = state.syncSettings;
  const syncStatusText = sync.lastSyncAt
    ? `上次同步：${formatDateTime(sync.lastSyncAt)}`
    : "尚未同步";
  const syncStatusClass = sync.lastSyncStatus === "error" ? "error" : sync.lastSyncStatus === "ok" ? "ok" : "";

  return `
    <div class="screen">
      <header class="app-header">
        <button class="btn btn-secondary" id="btn-back-settings">返回</button>
        <div class="brand" style="text-align:center">
          <p class="brand-mark" style="font-size:1.2rem">Settings</p>
        </div>
        <span style="width:72px"></span>
      </header>

      <div class="entry-list">
        <section class="entry-card ios-tip">
          <h3>iPhone 使用建議</h3>
          <p>在 Safari 點「分享」→「加入主畫面」，可像 App 一樣全螢幕使用，書寫與設定會更方便。</p>
        </section>

        <section class="entry-card">
          <h3>外觀</h3>
          <p>選擇深色、淺色或跟隨系統。</p>
          <div class="theme-options" style="margin-top:12px;">
            ${(["dark", "light", "system"] as ThemeMode[])
              .map((mode) => {
                const labels = { dark: "深色", light: "淺色", system: "跟隨系統" };
                return `<button type="button" class="theme-option ${theme === mode ? "active" : ""}" data-theme="${mode}">${labels[mode]}</button>`;
              })
              .join("")}
          </div>
        </section>

        <section class="entry-card">
          <h3>提醒通知</h3>
          <p>到期時以瀏覽器通知提醒你（需允許通知權限）。</p>
          <label class="inline-check" style="margin-top:12px;">
            <input type="checkbox" id="notify-enabled" ${loadNotificationPref() ? "checked" : ""} />
            啟用行程與待辦提醒
          </label>
          <button class="btn btn-secondary btn-block" type="button" id="btn-notify-permission" style="margin-top:12px;">
            請求通知權限
          </button>
        </section>

        <section class="entry-card">
          <h3>雲端同步（可選）</h3>
          <p>上傳的是<strong>已加密</strong>的保險庫，伺服器無法讀取內容。請使用強同步金鑰。</p>
          <form id="sync-form" style="margin-top:12px;">
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
              <input type="checkbox" id="sync-enabled" ${sync.enabled ? "checked" : ""} />
              啟用雲端同步
            </label>
            <div class="field">
              <label for="sync-api-url">同步 API 網址</label>
              <input id="sync-api-url" type="url" placeholder="https://your-worker.workers.dev" value="${escapeHtml(sync.apiUrl)}" />
            </div>
            <div class="field">
              <label for="sync-key">同步金鑰</label>
              <input id="sync-key" type="password" autocomplete="new-password" placeholder="自訂一組同步用金鑰" value="${escapeHtml(sync.syncKey)}" />
            </div>
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
              <input type="checkbox" id="sync-remember" ${sync.rememberSyncKey ? "checked" : ""} />
              記住同步金鑰（方便手機使用，但安全性較低）
            </label>
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
              <input type="checkbox" id="sync-auto" ${sync.autoSync ? "checked" : ""} />
              儲存時自動同步
            </label>
            <p class="error-text" id="sync-error"></p>
            <div class="editor-actions">
              <button class="btn btn-secondary" type="button" id="btn-test-sync">測試連線</button>
              <button class="btn btn-secondary" type="button" id="btn-sync-now">立即同步</button>
              <button class="btn btn-primary" type="submit">儲存同步設定</button>
            </div>
            <p class="sync-status ${syncStatusClass}">${syncStatusText}</p>
          </form>
        </section>

        <section class="entry-card">
          <h3>備份與還原</h3>
          <p>匯出加密備份到其他裝置，或從備份還原。</p>
          <div class="editor-actions" style="margin-top:12px;">
            <button class="btn btn-secondary" id="btn-export">匯出備份</button>
            <label class="btn btn-secondary" style="display:inline-grid; place-items:center;">
              匯入備份
              <input id="import-file" type="file" accept="application/json,.json" hidden />
            </label>
          </div>
        </section>

        <section class="entry-card">
          <h3>變更密碼</h3>
          <p>變更後需使用新密碼解鎖。</p>
          <form id="change-password-form" style="margin-top:12px;">
            <div class="field">
              <label for="old-password">目前密碼</label>
              <input id="old-password" type="password" autocomplete="current-password" required />
            </div>
            <div class="field">
              <label for="new-password">新密碼</label>
              <input id="new-password" type="password" autocomplete="new-password" minlength="6" required />
            </div>
            <div class="field">
              <label for="new-password-confirm">確認新密碼</label>
              <input id="new-password-confirm" type="password" autocomplete="new-password" minlength="6" required />
            </div>
            <p class="error-text" id="settings-error"></p>
            <button class="btn btn-primary" type="submit">更新密碼</button>
          </form>
        </section>

        <section class="entry-card">
          <h3>危險區域</h3>
          <p>清除所有本地資料。此操作無法復原。</p>
          <button class="btn btn-danger" id="btn-wipe" style="margin-top:12px;">清除全部資料</button>
        </section>
      </div>
    </div>
  `;
}

function render(): void {
  if (!state.unlocked) {
    renderAuth();
    return;
  }

  if (state.view === "entry-unlock" && state.editingId) {
    const entry = getEntry(state.editingId);
    if (entry) {
      root.innerHTML = renderEntryUnlock(entry);
      bindEntryUnlockEvents(entry);
      return;
    }
    state.view = "journal";
    state.editingId = null;
  }

  if (state.view === "settings") {
    root.innerHTML = renderSettings();
    bindSettingsEvents();
    return;
  }

  if (state.view === "editor" && state.editingId) {
    const entry = getEntry(state.editingId);
    if (entry) {
      root.innerHTML = renderEditor(entry);
      bindEditorEvents(entry);
      return;
    }
    state.view = "journal";
    state.editingId = null;
  }

  if (state.view === "calendar") {
    root.innerHTML = renderCalendar();
    bindCalendarEvents();
    return;
  }

  if (state.view === "todos") {
    root.innerHTML = renderTodos();
    bindTodoEvents();
    return;
  }

  root.innerHTML = renderJournal();
  bindJournalEvents();
}

function openNew(type: EntryType = "diary"): void {
  touchActivity();
  const entry: Entry = {
    id: uid(),
    type,
    title: type === "diary" ? `${todayTitle()} 的日記` : "",
    content: "",
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  upsertEntry(entry);
  state.editingId = entry.id;
  state.view = "editor";
  render();
}

function openEditor(id: string): void {
  touchActivity();
  const entry = getEntry(id);
  if (!entry) return;
  state.editingId = id;
  if (isEntryLocked(entry) && !isEntryAccessible(entry)) {
    state.view = "entry-unlock";
  } else {
    state.view = "editor";
  }
  render();
}

function bindEntryUnlockEvents(entry: Entry): void {
  document.getElementById("btn-unlock-back")!.addEventListener("click", () => {
    touchActivity();
    state.view = "journal";
    state.editingId = null;
    render();
  });

  document.getElementById("entry-unlock-form")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    touchActivity();
    const errorEl = document.getElementById("entry-unlock-error")!;
    errorEl.textContent = "";
    const pin = (document.getElementById("entry-pin") as HTMLInputElement).value;
    if (!entry.lockHash) {
      errorEl.textContent = "此記錄未設定 PIN。";
      return;
    }
    const ok = await verifyEntryPin(entry.id, pin, entry.lockHash);
    if (!ok) {
      errorEl.textContent = "PIN 碼錯誤。";
      return;
    }
    state.unlockedEntryIds.add(entry.id);
    state.view = "editor";
    render();
  });
}

function cycleTheme(): void {
  const order: ThemeMode[] = ["dark", "light", "system"];
  const current = getStoredTheme();
  const next = order[(order.indexOf(current) + 1) % order.length];
  setStoredTheme(next);
  render();
}

function bindSharedChrome(): void {
  document.getElementById("btn-lock")?.addEventListener("click", lock);
  document.getElementById("btn-hidden")?.addEventListener("click", () => {
    touchActivity();
    state.showHidden = !state.showHidden;
    render();
  });
  document.getElementById("btn-theme")?.addEventListener("click", cycleTheme);
  document.getElementById("btn-settings")?.addEventListener("click", () => {
    touchActivity();
    state.view = "settings";
    render();
  });

  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      touchActivity();
      state.view = (btn as HTMLElement).dataset.nav as View;
      render();
    });
  });
}

function bindJournalEvents(): void {
  bindSharedChrome();

  document.getElementById("btn-new")!.addEventListener("click", () => {
    const type = state.filter === "all" ? "diary" : state.filter;
    openNew(type);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      touchActivity();
      state.filter = (tab as HTMLElement).dataset.filter as EntryType | "all";
      render();
    });
  });

  document.querySelectorAll(".tag-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      touchActivity();
      const tag = (chip as HTMLElement).dataset.tag ?? "";
      state.tagFilter = tag || null;
      render();
    });
  });

  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  searchInput.addEventListener("input", () => {
    touchActivity();
    state.search = searchInput.value;
    const list = document.getElementById("entry-list")!;
    const entries = filteredEntries();
    list.innerHTML =
      entries.length === 0
        ? `<div class="empty-state"><p>沒有符合的結果</p></div>`
        : entries.map(renderEntryCard).join("");
    bindEntryCards();
  });

  bindEntryCards();
}

function bindCalendarEvents(): void {
  bindSharedChrome();

  document.getElementById("cal-prev")!.addEventListener("click", () => {
    touchActivity();
    const next = shiftMonth(state.calendarYear, state.calendarMonth, -1);
    state.calendarYear = next.year;
    state.calendarMonth = next.month;
    render();
  });

  document.getElementById("cal-next")!.addEventListener("click", () => {
    touchActivity();
    const next = shiftMonth(state.calendarYear, state.calendarMonth, 1);
    state.calendarYear = next.year;
    state.calendarMonth = next.month;
    render();
  });

  document.querySelectorAll(".calendar-day[data-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      touchActivity();
      state.selectedDate = (btn as HTMLElement).dataset.date!;
      render();
    });
  });

  document.getElementById("add-event-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    touchActivity();
    const title = (document.getElementById("event-title") as HTMLInputElement).value.trim();
    const time = (document.getElementById("event-time") as HTMLInputElement).value;
    const remind = (document.getElementById("event-remind") as HTMLInputElement).checked;
    if (!title) return;

    upsertEvent({
      id: uid(),
      title,
      date: state.selectedDate,
      time: time || undefined,
      remind,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    showToast("已加入行事曆");
    render();
  });

  document.querySelectorAll("[data-delete-event]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      touchActivity();
      deleteEvent((btn as HTMLElement).dataset.deleteEvent!);
      render();
    });
  });
}

function bindTodoEvents(): void {
  bindSharedChrome();

  document.getElementById("add-todo-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    touchActivity();
    const title = (document.getElementById("todo-title") as HTMLInputElement).value.trim();
    const dueDate = (document.getElementById("todo-date") as HTMLInputElement).value;
    const dueTime = (document.getElementById("todo-time") as HTMLInputElement).value;
    const remind = (document.getElementById("todo-remind") as HTMLInputElement).checked;
    if (!title) return;

    upsertTodo({
      id: uid(),
      title,
      done: false,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      remind,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    showToast("已加入待辦");
    render();
  });

  document.querySelectorAll("[data-todo-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      touchActivity();
      state.todoFilter = (btn as HTMLElement).dataset.todoFilter as AppState["todoFilter"];
      render();
    });
  });

  document.querySelectorAll("[data-toggle-todo]").forEach((input) => {
    input.addEventListener("change", () => {
      touchActivity();
      const id = (input as HTMLInputElement).dataset.toggleTodo!;
      const todo = state.todos.find((t) => t.id === id);
      if (!todo) return;
      todo.done = (input as HTMLInputElement).checked;
      todo.updatedAt = Date.now();
      upsertTodo(todo);
      render();
    });
  });

  document.querySelectorAll("[data-delete-todo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      touchActivity();
      deleteTodo((btn as HTMLElement).dataset.deleteTodo!);
      render();
    });
  });
}

function bindEntryCards(): void {
  document.querySelectorAll(".entry-card[data-id]").forEach((card) => {
    card.addEventListener("click", () => {
      openEditor((card as HTMLElement).dataset.id!);
    });
  });
}

function bindEditorEvents(entry: Entry): void {
  const editor = document.getElementById("entry-content") as HTMLElement;
  bindRichEditor(editor, entry.content, entry.format, () => {
    touchActivity();
    schedulePersist();
  });

  const typeSelect = document.getElementById("entry-type") as HTMLSelectElement;
  typeSelect.addEventListener("change", () => {
    touchActivity();
    entry.type = typeSelect.value as EntryType;
    if (entry.type === "diary" && !entry.title) entry.title = `${todayTitle()} 的日記`;
    render();
  });

  document.getElementById("mood-row")?.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-mood]") as HTMLElement | null;
    if (!target) return;
    touchActivity();
    entry.mood = target.dataset.mood;
    document.querySelectorAll(".mood-btn").forEach((btn) => btn.classList.remove("selected"));
    target.classList.add("selected");
  });

  document.getElementById("btn-back")!.addEventListener("click", () => {
    touchActivity();
    state.view = "journal";
    state.editingId = null;
    render();
  });

  document.getElementById("btn-delete")!.addEventListener("click", () => {
    if (!confirm("確定要刪除這則記錄嗎？")) return;
    touchActivity();
    deleteEntry(entry.id);
    state.view = "journal";
    state.editingId = null;
    render();
  });

  document.getElementById("entry-locked")!.addEventListener("change", () => {
    const locked = (document.getElementById("entry-locked") as HTMLInputElement).checked;
    const pinField = document.getElementById("entry-pin-field")!;
    pinField.style.display = locked ? "" : "none";
  });

  document.getElementById("editor-form")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    touchActivity();
    const rich = getRichContent(editor);
    const hidden = (document.getElementById("entry-hidden") as HTMLInputElement).checked;
    const locked = (document.getElementById("entry-locked") as HTMLInputElement).checked;
    const pinInput = (document.getElementById("entry-pin-set") as HTMLInputElement).value;

    entry.title = (document.getElementById("entry-title") as HTMLInputElement).value.trim();
    entry.content = rich.content;
    entry.format = rich.format;
    entry.tags = parseTags((document.getElementById("entry-tags") as HTMLInputElement).value);
    entry.pinned = (document.getElementById("entry-pinned") as HTMLInputElement).checked;
    entry.hidden = hidden;
    entry.locked = locked;
    delete entry.privacy;
    entry.updatedAt = Date.now();

    if (locked) {
      if (pinInput) {
        if (pinInput.length < 4) {
          showToast("PIN 至少需要 4 碼");
          return;
        }
        entry.lockHash = await hashEntryPin(entry.id, pinInput);
      } else if (!entry.lockHash) {
        showToast("上鎖記錄請設定 PIN");
        return;
      }
    } else {
      entry.lockHash = undefined;
      state.unlockedEntryIds.delete(entry.id);
    }

    upsertEntry(entry);
    state.view = "journal";
    state.editingId = null;
    render();
    showToast("已儲存");
  });

  document.getElementById("entry-title")?.addEventListener("focus", (e) => {
    scrollInputIntoView(e.target as HTMLElement);
  });

  document.getElementById("entry-tags")?.addEventListener("focus", (e) => {
    scrollInputIntoView(e.target as HTMLElement);
  });

  editor.addEventListener("focus", () => {
    scrollInputIntoView(editor);
  });

  document.getElementById("entry-title")?.addEventListener("input", () => {
    touchActivity();
    schedulePersist();
  });
}

function bindSettingsEvents(): void {
  document.getElementById("btn-back-settings")!.addEventListener("click", () => {
    touchActivity();
    state.view = "journal";
    render();
  });

  document.getElementById("notify-enabled")!.addEventListener("change", async () => {
    touchActivity();
    const enabled = (document.getElementById("notify-enabled") as HTMLInputElement).checked;
    saveNotificationPref(enabled);
    if (enabled) {
      const perm = await requestNotificationPermission();
      if (perm !== "granted") showToast("請在瀏覽器設定中允許通知");
      else showToast("提醒已啟用");
    }
  });

  document.getElementById("btn-notify-permission")!.addEventListener("click", async () => {
    touchActivity();
    const perm = await requestNotificationPermission();
    if (perm === "granted") showToast("已允許通知");
    else if (perm === "unsupported") showToast("此瀏覽器不支援通知");
    else showToast("通知權限未開啟");
  });

  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      touchActivity();
      setStoredTheme((btn as HTMLElement).dataset.theme as ThemeMode);
      render();
    });
  });

  document.getElementById("sync-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    touchActivity();
    const errorEl = document.getElementById("sync-error")!;
    errorEl.textContent = "";
    const settings: SyncSettings = {
      enabled: (document.getElementById("sync-enabled") as HTMLInputElement).checked,
      apiUrl: (document.getElementById("sync-api-url") as HTMLInputElement).value.trim(),
      syncKey: (document.getElementById("sync-key") as HTMLInputElement).value,
      rememberSyncKey: (document.getElementById("sync-remember") as HTMLInputElement).checked,
      autoSync: (document.getElementById("sync-auto") as HTMLInputElement).checked,
      lastSyncAt: state.syncSettings.lastSyncAt,
      lastSyncStatus: state.syncSettings.lastSyncStatus,
    };
    if (settings.enabled && (!settings.apiUrl || !settings.syncKey)) {
      errorEl.textContent = "啟用同步時，請填寫 API 網址與同步金鑰。";
      return;
    }
    saveSyncSettings(settings);
    state.syncSettings = loadSyncSettings();
    showToast("同步設定已儲存");
  });

  document.getElementById("btn-test-sync")!.addEventListener("click", async () => {
    touchActivity();
    const errorEl = document.getElementById("sync-error")!;
    errorEl.textContent = "";
    const settings: SyncSettings = {
      ...state.syncSettings,
      apiUrl: (document.getElementById("sync-api-url") as HTMLInputElement).value.trim(),
      syncKey: (document.getElementById("sync-key") as HTMLInputElement).value,
    };
    try {
      const ok = await testCloudConnection(settings);
      errorEl.textContent = ok ? "" : "連線失敗";
      showToast(ok ? "連線成功" : "連線失敗");
    } catch (err) {
      errorEl.textContent = String(err);
      showToast("連線失敗");
    }
  });

  document.getElementById("btn-sync-now")!.addEventListener("click", () => {
    touchActivity();
    state.syncSettings = {
      ...state.syncSettings,
      enabled: true,
      apiUrl: (document.getElementById("sync-api-url") as HTMLInputElement).value.trim(),
      syncKey: (document.getElementById("sync-key") as HTMLInputElement).value,
      autoSync: (document.getElementById("sync-auto") as HTMLInputElement).checked,
    };
    void runCloudSync(true).then(() => render());
  });

  document.getElementById("btn-export")!.addEventListener("click", async () => {
    touchActivity();
    const backup = await createBackup(
      state.password,
      vaultData(),
      state.salt,
      state.vaultUpdatedAt
    );
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`hideaway-backup-${stamp}.json`, backup);
    showToast("備份已下載");
  });

  document.getElementById("import-file")!.addEventListener("change", async (e) => {
    touchActivity();
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const errorEl = document.getElementById("settings-error");
    try {
      const backup = await readJsonFile<BackupFile>(file);
      if (backup.version !== 1 || !backup.data) throw new Error("invalid");
      const password = prompt("請輸入備份檔的密碼（通常與目前密碼相同）：");
      if (!password) return;
      const { entries, todos, events, salt, updatedAt } = await restoreBackup(password, backup);
      if (!confirm("匯入會覆蓋目前裝置上的所有記錄，確定繼續？")) return;
      loadVaultIntoState({ entries, todos, events, salt, updatedAt });
      await persist();
      showToast("備份已還原");
      state.view = "journal";
      render();
    } catch {
      if (errorEl) errorEl.textContent = "匯入失敗：密碼錯誤或檔案格式不正確。";
      showToast("匯入失敗");
    } finally {
      input.value = "";
    }
  });

  document.getElementById("change-password-form")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    touchActivity();
    const errorEl = document.getElementById("settings-error")!;
    errorEl.textContent = "";
    const oldPassword = (document.getElementById("old-password") as HTMLInputElement).value;
    const newPassword = (document.getElementById("new-password") as HTMLInputElement).value;
    const confirmPassword = (document.getElementById("new-password-confirm") as HTMLInputElement).value;

    if (newPassword.length < 6) {
      errorEl.textContent = "新密碼至少需要 6 個字元。";
      return;
    }
    if (newPassword !== confirmPassword) {
      errorEl.textContent = "兩次輸入的新密碼不一致。";
      return;
    }

    const buffer = await loadVault();
    if (!buffer) {
      errorEl.textContent = "找不到資料。";
      return;
    }

    const ok = await verifyPassword(oldPassword, buffer);
    if (!ok) {
      errorEl.textContent = "目前密碼錯誤。";
      return;
    }

    const next = await changePassword(oldPassword, newPassword, buffer);
    await saveVault(next);
    const data = await decryptVault(newPassword, next);
    state.password = newPassword;
    loadVaultIntoState(data);
    errorEl.textContent = "";
    showToast("密碼已更新");
  });

  document.getElementById("btn-wipe")!.addEventListener("click", async () => {
    if (!confirm("確定要清除所有資料嗎？此操作無法復原。")) return;
    if (!confirm("再次確認：所有日記與筆記都會被永久刪除。")) return;
    await clearVault();
    lock();
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

["click", "keydown", "touchstart", "mousemove"].forEach((event) => {
  document.addEventListener(
    event,
    () => {
      if (state.unlocked) touchActivity();
    },
    { passive: true }
  );
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.unlocked) lock();
});

render();
