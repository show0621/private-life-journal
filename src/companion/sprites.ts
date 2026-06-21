import type { CompanionState } from "../types";
import { renderCompanionPortrait } from "./portraits";
import { RO_ADVENTURER_SPRITES, RO_COLORS } from "./ro-sprites";

export const SPRITE_COLORS: Record<string, string> = {
  ".": "transparent",
  ...RO_COLORS,
};

const DIGITAL_BASE: Record<string, string[]> = {
  "dig-ember-0": ["....RRRR....", "...RRRRRR...", "..RRRRRRRR..", "..RRRRRRRR..", "...RRRRRR...", "....RRRR....", "............", "............", "............", "............"],
  "dig-ember-1": ["....RRRR....", "...RRRRRR...", "..RRRRRRRR..", "..OO..OO....", ".ORRRRRROO...", "..ORRRR.....", "..OO..OO....", "...OOOO.....", "..OO..OO....", ".OO....OO..."],
  "dig-ember-2": ["...RRRRRR...", "..RRRRRRRR..", ".RRRRRRRRRR.", "..OO..OO....", ".ORRRRRROO...", "..ORRRR.....", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "dig-ember-3": ["...RRRRRR...", "..RRRRRRRR..", ".RRRRRRRRRR.", "..OO..OO....", ".ORRRRRROO...", ".ORRRRRROO..", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "dig-ember-4": ["..RRRRRRRR..", ".RRRRRRRRRR.", "RRRRRRRRRRRR", "..OO..OO....", ".ORRRRRROO...", ".ORRRRRROO..", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "dig-tide-0": ["....BBBB....", "...BBBBBB...", "..BBBBBBBB..", "..BBBBBBBB..", "...BBBBBB...", "....BBBB....", "............", "............", "............", "............"],
  "dig-tide-1": ["....BBBB....", "...BBBBBB...", "..BBBBBBBB..", "..OO..OO....", ".OBBBBBBOO...", "..OBBBB.....", "..OO..OO....", "...OOOO.....", "..OO..OO....", ".OO....OO..."],
  "dig-tide-2": ["...BBBBBB...", "..BBBBBBBB..", ".BBBBBBBBBB.", "..OO..OO....", ".OBBBBBBOO...", "..OBBBB.....", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "dig-tide-3": ["...BBBBBB...", "..BBBBBBBB..", ".BBBBBBBBBB.", "..OO..OO....", ".OBBBBBBOO...", ".OBBBBBBOO..", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "dig-tide-4": ["..BBBBBBBB..", ".BBBBBBBBBB.", "BBBBBBBBBBBB", "..OO..OO....", ".OBBBBBBOO...", ".OBBBBBBOO..", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "dig-leaf-0": ["....GGGG....", "...GGGGGG...", "..GGGGGGGG..", "..GGGGGGGG..", "...GGGGGG...", "....GGGG....", "............", "............", "............", "............"],
  "dig-leaf-1": ["....GGGG....", "...GGGGGG...", "..GGGGGGGG..", "..OO..OO....", ".OGGGGGGOO...", "..OGGGG.....", "..OO..OO....", "...OOOO.....", "..OO..OO....", ".OO....OO..."],
  "dig-leaf-2": ["...GGGGGG...", "..GGGGGGGG..", ".GGGGGGGGGG.", "..OO..OO....", ".OGGGGGGOO...", "..OGGGG.....", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "dig-leaf-3": ["...GGGGGG...", "..GGGGGGGG..", ".GGGGGGGGGG.", "..OO..OO....", ".OGGGGGGOO...", ".OGGGGGGOO..", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "dig-leaf-4": ["..GGGGGGGG..", ".GGGGGGGGGG.", "GGGGGGGGGGGG", "..OO..OO....", ".OGGGGGGOO...", ".OGGGGGGOO..", "..OO..OO....", "..OO....OO..", ".OO.....OO..", "OO......OO.."],
  "mob-bug": ["............", "...KK.......", "..KGGGK.....", ".KGGGGGK....", "..KGGGK.....", "...KK.......", "............", "............", "............", "............"],
  "mob-bunny": ["............", "..OOOO......", ".OWWWWWO....", ".OWWWWWO....", "..OO..OO....", "...OOO......", "............", "............", "............", "............"],
  "mob-ghost": ["............", "..WWWW......", ".WWWWWW.....", ".WWWWWW.....", ".WW..WW.....", "..WW..WW....", "............", "............", "............", "............"],
  "mob-demon": ["...RRRR.....", "..RRRRRR....", ".RRRRRRRR...", ".RRRRRRRR...", "..RR..RR....", "..RRRRRR....", "............", "............", "............", "............"],
  "mob-beast": ["............", "..HHHH......", ".HHHHHH.....", ".HHOOHH.....", ".HHHHHH.....", "..HH..HH....", "............", "............", "............", "............"],
  "mob-dragon": ["...RRRR.....", "..RRYYRR....", ".RRRRRRRR...", ".RRRRRRRR...", "..RR..RR....", "..RRRRRR....", "............", "............", "............", "............"],
};

function rowWidth(grid: string[]): number {
  return Math.max(...grid.map((r) => r.length), 8);
}

function shiftGrid(grid: string[], dy: number): string[] {
  if (dy === 0) return grid.map((r) => r.slice());
  const w = rowWidth(grid);
  const blank = ".".repeat(w);
  if (dy > 0) return [...grid.slice(dy).map((r) => r.padEnd(w, ".")), ...Array(dy).fill(blank)];
  const n = -dy;
  return [...Array(n).fill(blank), ...grid.slice(0, grid.length - n).map((r) => r.padEnd(w, "."))];
}

function tintGrid(grid: string[], map: Record<string, string>): string[] {
  return grid.map((row) =>
    row
      .split("")
      .map((ch) => map[ch] ?? ch)
      .join("")
  );
}

function buildDerived(): Record<string, string[]> {
  const out: Record<string, string[]> = { ...RO_ADVENTURER_SPRITES, ...DIGITAL_BASE };

  for (const key of Object.keys(RO_ADVENTURER_SPRITES)) {
    if (key.endsWith("-atk")) continue;
    out[`${key}-w2`] = shiftGrid(RO_ADVENTURER_SPRITES[key], 1);
  }

  for (const key of Object.keys(DIGITAL_BASE)) {
    out[`${key}-w2`] = shiftGrid(DIGITAL_BASE[key], 1);
    out[`${key}-atk`] = shiftGrid(DIGITAL_BASE[key], -1);
  }

  out["dig-ember-3a"] = tintGrid(DIGITAL_BASE["dig-ember-3"], { R: "R" });
  out["dig-ember-3b"] = tintGrid(DIGITAL_BASE["dig-ember-3"], { R: "Y", O: "R" });
  out["dig-ember-4a"] = tintGrid(DIGITAL_BASE["dig-ember-4"], { R: "R" });
  out["dig-ember-4b"] = tintGrid(DIGITAL_BASE["dig-ember-4"], { R: "Y", O: "R" });
  out["dig-tide-3a"] = tintGrid(DIGITAL_BASE["dig-tide-3"], { B: "B" });
  out["dig-tide-3b"] = tintGrid(DIGITAL_BASE["dig-tide-3"], { B: "M", O: "B" });
  out["dig-tide-4a"] = tintGrid(DIGITAL_BASE["dig-tide-4"], { B: "B" });
  out["dig-tide-4b"] = tintGrid(DIGITAL_BASE["dig-tide-4"], { B: "M", O: "B" });
  out["dig-leaf-3a"] = tintGrid(DIGITAL_BASE["dig-leaf-3"], { G: "G" });
  out["dig-leaf-3b"] = tintGrid(DIGITAL_BASE["dig-leaf-3"], { G: "g", O: "G" });
  out["dig-leaf-4a"] = tintGrid(DIGITAL_BASE["dig-leaf-4"], { G: "G" });
  out["dig-leaf-4b"] = tintGrid(DIGITAL_BASE["dig-leaf-4"], { G: "g", O: "G" });

  return out;
}

export const SPRITE_GRIDS = buildDerived();

export type SpritePose = "idle" | "walk" | "attack";

export function resolveSpriteKey(c: CompanionState, pose: SpritePose = "idle", walkFrame = 0): string {
  let key = baseSpriteKey(c);
  if (key === "none") return key;
  if (pose === "walk" && walkFrame % 2 === 1) {
    const w2 = `${key}-w2`;
    if (SPRITE_GRIDS[w2]) key = w2;
  }
  if (pose === "attack") {
    const atk = `${key}-atk`;
    if (SPRITE_GRIDS[atk]) key = atk;
  }
  return SPRITE_GRIDS[key] ? key : baseSpriteKey(c);
}

export function baseSpriteKey(c: CompanionState): string {
  if (c.mode === "none") return "none";
  if (c.mode === "adventurer" && c.adventurerClass) {
    const tier = c.level >= 15 ? 3 : c.level >= 8 ? 2 : 1;
    const wolf = c.adventurerClass === "hunter" && c.hasWolf ? "-wolf" : "";
    const base = `adv-${c.adventurerClass}-${tier}${wolf}`;
    return SPRITE_GRIDS[base] ? base : `adv-${c.adventurerClass}-1`;
  }
  if (c.mode === "digital" && c.digitalSpecies) {
    const stage = c.stage;
    if (stage >= 3 && c.digitalPath) {
      const branch = `dig-${c.digitalSpecies}-${stage}${c.digitalPath}`;
      if (SPRITE_GRIDS[branch]) return branch;
    }
    return `dig-${c.digitalSpecies}-${stage}`;
  }
  return "none";
}

export function spriteGridSize(key: string): { cols: number; rows: number } {
  const grid = SPRITE_GRIDS[key] ?? SPRITE_GRIDS["adv-knight-1"];
  return { cols: rowWidth(grid), rows: grid.length };
}

export function renderPixelSprite(key: string, extraClass = ""): string {
  const grid = SPRITE_GRIDS[key] ?? SPRITE_GRIDS["adv-knight-1"];
  const cols = rowWidth(grid);
  const cells = grid
    .join("")
    .split("")
    .map((ch) => {
      const color = SPRITE_COLORS[ch] ?? "transparent";
      const style = color === "transparent" ? "" : `background:${color}`;
      return `<i class="px-cell" style="${style}"></i>`;
    })
    .join("");
  return `<div class="pixel-sprite ${extraClass}" data-sprite="${key}" style="--px-cols:${cols}" aria-hidden="true">${cells}</div>`;
}

export function renderCompanionSprite(
  c: CompanionState,
  extraClass = "",
  pose: SpritePose = "idle",
  walkFrame = 0,
  walkDir = 1
): string {
  const portrait = renderCompanionPortrait(c, extraClass, pose, walkDir);
  if (portrait) return portrait;
  return renderPixelSprite(resolveSpriteKey(c, pose, walkFrame), extraClass);
}
