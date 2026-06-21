export type FxKind = "attack" | "evolve" | "hit";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnBurst(host: HTMLElement, kind: FxKind): void {
  const layer = document.createElement("div");
  layer.className = `companion-fx companion-fx--${kind}`;
  const count = kind === "evolve" ? 14 : 6;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "companion-fx-particle";
    p.style.setProperty("--fx-i", String(i));
    layer.appendChild(p);
  }
  host.appendChild(layer);
  setTimeout(() => layer.remove(), kind === "evolve" ? 1200 : 700);
}

export async function playAttackFx(target?: HTMLElement | null): Promise<void> {
  const el = (target ?? document.querySelector(".companion-walker")) as HTMLElement | null;
  if (!el) return;
  el.classList.add("is-attacking");
  spawnBurst(el, "attack");
  await wait(520);
  el.classList.remove("is-attacking");
}

export async function playEvolveFx(target?: HTMLElement | null): Promise<void> {
  const el = (target ??
    document.querySelector(".hero-sprite-wrap") ??
    document.querySelector(".companion-walker")) as HTMLElement | null;
  if (!el) return;
  el.classList.add("is-evolving");
  spawnBurst(el, "evolve");
  document.body.classList.add("companion-evolve-flash");
  await wait(1100);
  el.classList.remove("is-evolving");
  document.body.classList.remove("companion-evolve-flash");
}

export async function playBattleArenaFx(
  heroEl: HTMLElement,
  monsterEl: HTMLElement,
  win: boolean
): Promise<void> {
  heroEl.classList.add("is-attacking");
  monsterEl.classList.add("is-hit");
  spawnBurst(heroEl, "attack");
  if (win) spawnBurst(monsterEl, "hit");
  await wait(560);
  heroEl.classList.remove("is-attacking");
  monsterEl.classList.remove("is-hit");
}
