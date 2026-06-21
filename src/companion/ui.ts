import type { AdventurerClass, CompanionState, DigitalPath, DigitalSpecies } from "../types";
import {
  ADVENTURER_LABELS,
  companionTitle,
  DIGITAL_LABELS,
  DIGITAL_PATH_LABELS,
  needsDigitalPathChoice,
  STAGE_LABELS,
} from "./game";
import { renderCompanionSprite, renderPixelSprite } from "./sprites";

export type WalkerPlacement = "footer" | "editor";

let walkTimer: ReturnType<typeof setInterval> | undefined;
let walkEl: HTMLButtonElement | null = null;
let walkFrame = 0;
let companionRef: CompanionState | null = null;
let onTapRef: (() => void) | null = null;
let placementRef: WalkerPlacement = "footer";

function updateWalkerSprite(pose: "idle" | "walk" | "attack" = "walk"): void {
  if (!walkEl || !companionRef) return;
  const holder = walkEl.querySelector(".walker-sprite-wrap");
  if (!holder) return;
  holder.innerHTML = renderCompanionSprite(companionRef, "walker-sprite", pose, walkFrame);
}

export function mountCompanionWalker(
  c: CompanionState,
  onTap: () => void,
  placement: WalkerPlacement = "footer"
): void {
  destroyCompanionWalker();
  if (c.mode === "none") return;

  companionRef = c;
  onTapRef = onTap;
  placementRef = placement;

  const walkBtn = document.createElement("button");
  walkBtn.type = "button";
  walkBtn.className = `companion-walker companion-walker--${placement}`;
  walkBtn.title = companionTitle(c);
  walkBtn.innerHTML = `
    <div class="walker-sprite-wrap">${renderCompanionSprite(c, "walker-sprite", "idle", 0)}</div>
    <span class="walker-label">${companionTitle(c)}</span>
  `;
  walkBtn.addEventListener("click", onTap);
  document.body.appendChild(walkBtn);
  walkEl = walkBtn;

  walkFrame = 0;
  let dir = 1;
  let pos = placement === "editor" ? 20 : 12;

  walkTimer = setInterval(() => {
    if (!walkEl) return;
    walkFrame += 1;
    pos += dir * (placement === "editor" ? 1.5 : 2);
    const max = placement === "editor" ? Math.min(window.innerHeight * 0.35, 220) : Math.min(window.innerWidth - 80, 280);
    const min = placement === "editor" ? 8 : 8;
    if (pos <= min || pos >= max) dir *= -1;

    if (placement === "editor") {
      walkEl.style.setProperty("--walk-y", `${pos}px`);
      walkEl.style.setProperty("--walk-dir", "1");
    } else {
      walkEl.style.setProperty("--walk-x", `${pos}px`);
      walkEl.style.setProperty("--walk-dir", dir === 1 ? "1" : "-1");
    }
    updateWalkerSprite("walk");
  }, 140);
}

export function refreshCompanionWalker(c: CompanionState, placement?: WalkerPlacement): void {
  if (c.mode === "none") {
    destroyCompanionWalker();
    return;
  }
  if (!walkEl) {
    if (onTapRef) mountCompanionWalker(c, onTapRef, placement ?? placementRef);
    return;
  }
  companionRef = c;
  if (placement && placement !== placementRef) {
    if (onTapRef) mountCompanionWalker(c, onTapRef, placement);
    return;
  }
  updateWalkerSprite("idle");
  const label = walkEl.querySelector(".walker-label");
  if (label) label.textContent = companionTitle(c);
  walkEl.title = companionTitle(c);
}

export function destroyCompanionWalker(): void {
  clearInterval(walkTimer);
  walkTimer = undefined;
  walkEl?.remove();
  walkEl = null;
  companionRef = null;
}

export function getWalkerElement(): HTMLElement | null {
  return walkEl;
}

export function renderCompanionScreen(c: CompanionState): string {
  const log = (c.battleLog ?? []).slice().reverse();

  if (c.mode === "none") {
    return `
      <div class="companion-screen">
        ${renderAppHeaderPlaceholder()}
        <div class="companion-setup line-card">
          <h2>選擇你的夥伴</h2>
          <p class="muted-copy">寫日記與打怪都能升級。像素夥伴會在畫面走動，編輯日記時也會在旁陪伴。</p>

          <section class="companion-pick">
            <h3>冒險者（RO 風格）</h3>
            <p class="muted-copy">選職業、打怪掉武器。獵人 Lv.5 會有狼夥伴。</p>
            <div class="companion-class-grid">
              ${(["knight", "mage", "hunter"] as AdventurerClass[])
                .map(
                  (cls) => `
                <button type="button" class="companion-pick-btn" data-start-adv="${cls}">
                  ${renderPixelSprite(`adv-${cls}-1`, "pick-sprite")}
                  <span>${ADVENTURER_LABELS[cls]}</span>
                </button>`
                )
                .join("")}
            </div>
          </section>

          <section class="companion-pick">
            <h3>數碼夥伴（原創像素）</h3>
            <p class="muted-copy">從蛋開始，成長期後可選進化分支，一路到完全體。</p>
            <div class="companion-class-grid">
              ${(["ember", "tide", "leaf"] as DigitalSpecies[])
                .map(
                  (sp) => `
                <button type="button" class="companion-pick-btn" data-start-dig="${sp}">
                  ${renderPixelSprite(`dig-${sp}-0`, "pick-sprite")}
                  <span>${DIGITAL_LABELS[sp]}</span>
                </button>`
                )
                .join("")}
            </div>
          </section>
        </div>
        ${renderBottomNavPlaceholder("companion")}
      </div>
    `;
  }

  const weapons =
    c.mode === "adventurer"
      ? c.weapons
          .map(
            (w) => `
        <button type="button" class="weapon-chip ${c.equippedWeaponId === w.id ? "active" : ""}" data-equip="${w.id}">
          ${w.name} <small>${w.rarity} +${w.atk}</small>
        </button>`
          )
          .join("") || `<p class="muted-copy">還沒有武器，去打怪吧！</p>`
      : "";

  const branchPick = needsDigitalPathChoice(c)
    ? `
      <div class="evo-branch-pick line-card" style="margin-top:14px;padding:14px;">
        <h3>選擇進化分支</h3>
        <p class="muted-copy">成熟期起將依此分支成長（不可回頭）</p>
        <div class="companion-class-grid" style="margin-top:10px;">
          ${(["a", "b"] as DigitalPath[])
            .map(
              (path) => `
            <button type="button" class="companion-pick-btn" data-dig-path="${path}">
              ${renderPixelSprite(`dig-${c.digitalSpecies}-3${path}`, "pick-sprite")}
              <span>${DIGITAL_PATH_LABELS[c.digitalSpecies!][path]}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>`
    : "";

  return `
    <div class="companion-screen">
      ${renderAppHeaderPlaceholder()}
      <div class="companion-panel line-card">
        <div class="companion-hero">
          <div class="hero-sprite-wrap">${renderCompanionSprite(c, "hero-sprite")}</div>
          <div>
            <h2>${companionTitle(c)}</h2>
            <p class="muted-copy">HP ${c.hp}/${c.maxHp} · 戰鬥 ${c.battlesWon} 次 · 日記 XP ${c.journalXpTotal}</p>
            <div class="xp-bar"><div class="xp-fill" style="width:${Math.min(100, (c.xp / c.xpToNext) * 100)}%"></div></div>
            <p class="xp-text">${c.xp} / ${c.xpToNext} XP</p>
          </div>
        </div>

        <div class="battle-arena" id="battle-arena" aria-hidden="true">
          <div class="battle-side battle-side--hero">${renderCompanionSprite(c, "arena-sprite arena-hero")}</div>
          <div class="battle-vs">VS</div>
          <div class="battle-side battle-side--foe">${renderPixelSprite("mob-slime", "arena-sprite arena-foe")}</div>
        </div>

        ${
          c.mode === "digital" && c.stage === 0
            ? `<button type="button" class="btn btn-primary btn-block btn-touch" id="btn-hatch">孵化數碼蛋</button>`
            : `<button type="button" class="btn btn-primary btn-block btn-touch" id="btn-battle">探索打怪</button>`
        }

        ${
          c.mode === "digital"
            ? `<p class="muted-copy" style="margin-top:12px">進化：${STAGE_LABELS.map((s, i) => `<span class="${i <= c.stage ? "evo-on" : ""}">${s}</span>`).join(" → ")}</p>`
            : ""
        }

        ${branchPick}

        ${c.mode === "adventurer" && c.hasWolf ? `<p class="muted-copy">🐺 狼夥伴同行中</p>` : ""}

        ${
          c.mode === "adventurer"
            ? `<div class="weapon-list"><h3>武器庫</h3><div class="weapon-grid">${weapons}</div></div>`
            : ""
        }

        <div class="battle-log">
          <h3>冒險日誌</h3>
          ${log.length ? log.map((l) => `<p>${escapeHtml(l)}</p>`).join("") : `<p class="muted-copy">還沒有紀錄</p>`}
        </div>

        <button type="button" class="btn btn-secondary btn-block" id="btn-companion-reset" style="margin-top:16px">重新選擇夥伴</button>
      </div>
      ${renderBottomNavPlaceholder("companion")}
    </div>
  `;
}

export function setBattleArenaMonster(spriteKey: string): void {
  const foe = document.querySelector(".arena-foe");
  if (foe) foe.outerHTML = renderPixelSprite(spriteKey, "arena-sprite arena-foe");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAppHeaderPlaceholder(): string {
  return "<!--APP_HEADER-->";
}

function renderBottomNavPlaceholder(active: string): string {
  return `<!--BOTTOM_NAV:${active}-->`;
}

export function injectCompanionChrome(html: string, header: string, nav: string): string {
  return html.replace("<!--APP_HEADER-->", header).replace("<!--BOTTOM_NAV:companion-->", nav);
}
