import type { CalendarEvent, TodoItem } from "./types";

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLabel(key: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseDateKey(key));
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month, 1));
}

export function formatTimeLabel(time?: string): string {
  if (!time) return "全天";
  return time;
}

export function toRemindAt(date: string, time?: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "09:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

export interface CalendarCell {
  date: string;
  inMonth: boolean;
  isToday: boolean;
}

export function getMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const today = todayKey();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const key = dateKey(d);
    cells.push({
      date: key,
      inMonth: d.getMonth() === month,
      isToday: key === today,
    });
  }

  return cells;
}

export function eventsOnDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events
    .filter((e) => e.date === date)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
}

export function todosOnDate(todos: TodoItem[], date: string): TodoItem[] {
  return todos
    .filter((t) => t.dueDate === date)
    .sort((a, b) => (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99"));
}

export function countForDate(
  todos: TodoItem[],
  events: CalendarEvent[],
  date: string
): number {
  return (
    todos.filter((t) => t.dueDate === date && !t.done).length +
    events.filter((e) => e.date === date).length
  );
}

export interface ReminderItem {
  kind: "todo" | "event";
  id: string;
  title: string;
  date: string;
  time?: string;
  done?: boolean;
}

export function getTodayReminders(todos: TodoItem[], events: CalendarEvent[]): ReminderItem[] {
  const today = todayKey();
  const items: ReminderItem[] = [];

  for (const event of eventsOnDate(events, today)) {
    items.push({
      kind: "event",
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
    });
  }

  for (const todo of todosOnDate(todos, today)) {
    if (!todo.done) {
      items.push({
        kind: "todo",
        id: todo.id,
        title: todo.title,
        date: todo.dueDate!,
        time: todo.dueTime,
        done: todo.done,
      });
    }
  }

  return items.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
}

export function sortedTodos(todos: TodoItem[], filter: "all" | "active" | "done"): TodoItem[] {
  let list = [...todos];
  if (filter === "active") list = list.filter((t) => !t.done);
  if (filter === "done") list = list.filter((t) => t.done);

  return list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const ad = a.dueDate || "9999-99-99";
    const bd = b.dueDate || "9999-99-99";
    if (ad !== bd) return ad.localeCompare(bd);
    return b.updatedAt - a.updatedAt;
  });
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
