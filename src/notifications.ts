import { toRemindAt } from "./planner";
import type { CalendarEvent, TodoItem } from "./types";

const PREF_KEY = "life-journal-notifications";
const CHECK_MS = 30_000;

let timer: ReturnType<typeof setInterval> | undefined;
let getData: (() => { todos: TodoItem[]; events: CalendarEvent[] }) | undefined;
let onNotified: ((kind: "todo" | "event", id: string) => void) | undefined;

export function loadNotificationPref(): boolean {
  return localStorage.getItem(PREF_KEY) === "1";
}

export function saveNotificationPref(enabled: boolean): void {
  localStorage.setItem(PREF_KEY, enabled ? "1" : "0");
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

function shouldNotify(remind: boolean | undefined, notifiedAt: number | undefined, at: number): boolean {
  if (!remind) return false;
  if (Date.now() < at) return false;
  if (notifiedAt && notifiedAt >= at) return false;
  return true;
}

function showNotification(title: string, body: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: `hideaway-${Date.now()}` });
  } catch {
    // ignore
  }
}

export function checkReminders(
  todos: TodoItem[],
  events: CalendarEvent[],
  notify: (kind: "todo" | "event", id: string) => void
): void {
  if (!loadNotificationPref()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  for (const event of events) {
    const at = toRemindAt(event.date, event.time);
    if (shouldNotify(event.remind, event.notifiedAt, at)) {
      showNotification("今日行程", event.time ? `${event.time} · ${event.title}` : event.title);
      notify("event", event.id);
    }
  }

  for (const todo of todos) {
    if (todo.done || !todo.dueDate) continue;
    const at = toRemindAt(todo.dueDate, todo.dueTime);
    if (shouldNotify(todo.remind, todo.notifiedAt, at)) {
      showNotification("待辦提醒", todo.dueTime ? `${todo.dueTime} · ${todo.title}` : todo.title);
      notify("todo", todo.id);
    }
  }
}

export function startReminderLoop(
  dataFn: () => { todos: TodoItem[]; events: CalendarEvent[] },
  notifiedFn: (kind: "todo" | "event", id: string) => void
): void {
  stopReminderLoop();
  getData = dataFn;
  onNotified = notifiedFn;
  const tick = () => {
    if (!getData || !onNotified) return;
    checkReminders(getData().todos, getData().events, onNotified);
  };
  tick();
  timer = setInterval(tick, CHECK_MS);
}

export function stopReminderLoop(): void {
  clearInterval(timer);
  timer = undefined;
  getData = undefined;
  onNotified = undefined;
}
