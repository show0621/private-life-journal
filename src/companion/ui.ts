import type { AdventurerClass, CompanionState, DigitalSpecies } from "../types";
import {
  ADVENTURER_LABELS,
  companionTitle,
  DIGITAL_LABELS,
  SPRITE_COLORS,
  SPRITE_GRIDS,
  spriteKey,
  STAGE_LABELS,
} from "./game";

export function renderPixelSprite(key: string, extraClass = ""): string {
  const grid = SPRITE_GRIDS[key] ?? SPRITE_GRIDS["dig-ember-0"];
  const cells = grid
    .join("")
    .split("")
    .map((ch) => {
      const color = SPRITE_COLORS[ch] ?? "transparent";
      const style = color === "transparent" ? "" : `background:${color}`;
      return `<i class="px-cell" style="${style}"></i>`;
    })
    .join("");
  return `<div class="pixel-sprite ${extraClass}" data-sprite="${key}" aria-hidden="true">${cells}</div>`;
}

let walkTimer: ReturnType<typeof setInterval> | undefined;
let walkEl: HTMLElement | null = null;

export function mountCompanionWalker(c: CompanionState, onTap: () => void): void {
  destroyCompanionWalker();
  if (c.mode === "none") return;

  const key = spriteKey(c);
  const walkBtn = document.createElement("button");
  walkBtn.type = "button";
  walkBtn.className = "companion-walker";
  walkBtn.title = companionTitle(c);
  walkBtn.innerHTML = `
    ${renderPixelSprite(key, "walker-sprite")}
    <span class="walker-label">${companionTitle(c)}</span>
  `;
  walkBtn.addEventListener("click", onTap);
  document.body.appendChild(walkBtn);
  walkEl = walkBtn;

  let dir = 1;
  let x = 12;
  walkTimer = setInterval(() => {
    if (!walkEl) return;
    x += dir * 2;
    if (x <= 8 || x >= Math.min(window.innerWidth - 80, 280)) dir *= -1;
    walkEl.style.setProperty("--walk-x", `${x}px`);
    walkEl.style.setProperty("--walk-dir", dir === 1 ? "1" : "-1");
  }, 120);
}

export function refreshCompanionWalker(c: CompanionState): void {
  if (!walkEl || c.mode === "none") return;
  const key = spriteKey(c);
  const sprite = walkEl.querySelector(".walker-sprite");
  if (sprite) {
    sprite.outerHTML = renderPixelSprite(key, "walker-sprite");
  }
  const label = walkEl.querySelector(".walker-label");
  if (label) label.textContent = companionTitle(c);
  walkEl.title = companionTitle(c);
}

export function destroyCompanionWalker(): void {
  clearInterval(walkTimer);
  walkTimer = undefined;
  walkEl?.remove();
  walkEl = null;
}

export function renderCompanionScreen(c: CompanionState): string {
  const key = spriteKey(c);
  const log = (c.battleLog ?? []).slice().reverse();

  if (c.mode === "none") {
    return `
      <div class="companion-screen">
        ${renderAppHeaderPlaceholder()}
        <div class="companion-setup line-card">
          <h2>選擇你的夥伴</h2>
          <p class="muted-copy">寫日記與打怪都能升級。像素人物會在畫面下方走動陪伴你。</p>

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
            <p class="muted-copy">從蛋開始孵化，寫日記推進成長，一路進化到完全體。</p>
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

  return `
    <div class="companion-screen">
      ${renderAppHeaderPlaceholder()}
      <div class="companion-panel line-card">
        <div class="companion-hero">
          ${renderPixelSprite(key, "hero-sprite")}
          <div>
            <h2>${companionTitle(c)}</h2>
            <p class="muted-copy">HP ${c.hp}/${c.maxHp} · 戰鬥 ${c.battlesWon} 次 · 日記 XP ${c.journalXpTotal}</p>
            <div class="xp-bar"><div class="xp-fill" style="width:${Math.min(100, (c.xp / c.xpToNext) * 100)}%"></div></div>
            <p class="xp-text">${c.xp} / ${c.xpToNext} XP</p>
          </div>
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** placeholders replaced by app.ts render functions */
function renderAppHeaderPlaceholder(): string {
  return "<!--APP_HEADER-->";
}

function renderBottomNavPlaceholder(active: string): string {
  return `<!--BOTTOM_NAV:${active}-->`;
}

export function injectCompanionChrome(html: string, header: string, nav: string): string {
  return html.replace("<!--APP_HEADER-->", header).replace("<!--BOTTOM_NAV:companion-->", nav);
}
