import type { CompanionState } from "../types";

export const SPRITE_COLORS: Record<string, string> = {
  ".": "transparent",
  S: "#8a9bab",
  O: "#f5dcc8",
  P: "#7b6cf6",
  V: "#b48cff",
  G: "#6fa86f",
  R: "#e85d4c",
  B: "#4a9fd4",
  Y: "#e8c547",
  K: "#2d3436",
  M: "#b088ff",
  C: "#55efc4",
  W: "#dfe6e9",
  H: "#636e72",
};

const BASE: Record<string, string[]> = {
  "adv-knight-1": ["..SSSS..", ".SSSSSS.", "SSSSSSSS", "..OOOO..", ".OSSSOO.", ".OSSSOO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-knight-2": ["..SSSS..", ".SSSSSS.", "SSSSSSSS", "..OOOO..", ".OSSSOO.", ".OSSSOO.", "..OO.OO.", ".OO..OO.", ".OO...OO", "OO....OO"],
  "adv-knight-3": [".SSSSSS.", "SSSSSSSS", "SSSSSSSS", "..OOOO..", ".OSSSOO.", ".OSSSOO.", "..OO.OO.", ".OO..OO.", ".OO...OO", "OO....OO"],
  "adv-mage-1": ["...PP...", "..PPPP..", ".PPPPPP.", "..OOOO..", ".OOPPOO.", "..OPPO..", "..OO.OO.", "...OO...", "..OO.OO.", ".OO...OO"],
  "adv-mage-2": ["...PP...", "..PPPP..", ".PPPPPP.", "..OOOO..", ".OOPPOO.", "..OPPO..", "..OO.OO.", "..OO.OO.", ".OO...OO", ".OO...OO"],
  "adv-mage-3": ["...VV...", "..VVVV..", ".VVVVVV.", "..OOOO..", ".OOVVOO.", "..OVVO..", "..OO.OO.", "...OO...", "..OO.OO.", ".OO...OO"],
  "adv-hunter-1": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-hunter-2": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", ".OO..OO.", ".OO...OO", "OO....OO"],
  "adv-hunter-2-wolf": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", ".OO..OO.", ".OO...OO", "OO....OO"],
  "adv-hunter-3": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", ".OO..OO.", ".OO...OO", "OO....OO"],
  "adv-hunter-3-wolf": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", ".OO..OO.", ".OO...OO", "OO....OO"],
  "dig-ember-0": ["...RR...", "..RRRR..", ".RRRRRR.", ".RRRRRR.", "..RRRR..", "...RR...", "........", "........", "........", "........"],
  "dig-ember-1": ["...RR...", "..RRRR..", ".RRRRRR.", "..OOOO..", ".ORRROO.", "..ORRO..", "..OO.OO.", "...OO...", "..OO.OO.", ".OO...OO"],
  "dig-ember-2": ["..RRRR..", ".RRRRRR.", "RRRRRRRR", "..OOOO..", ".ORRROO.", "..ORRO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "dig-ember-3": ["..RRRR..", ".RRRRRR.", "RRRRRRRR", "..OOOO..", ".ORRROO.", ".ORRROO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "dig-ember-4": [".RRRRRR.", "RRRRRRRR", "RRRRRRRR", "..OOOO..", ".ORRROO.", ".ORRROO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "dig-tide-0": ["...BB...", "..BBBB..", ".BBBBBB.", ".BBBBBB.", "..BBBB..", "...BB...", "........", "........", "........", "........"],
  "dig-tide-1": ["...BB...", "..BBBB..", ".BBBBBB.", "..OOOO..", ".OBBBOO.", "..OBBO..", "..OO.OO.", "...OO...", "..OO.OO.", ".OO...OO"],
  "dig-tide-2": ["..BBBB..", ".BBBBBB.", "BBBBBBBB", "..OOOO..", ".OBBBOO.", "..OBBO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "dig-tide-3": ["..BBBB..", ".BBBBBB.", "BBBBBBBB", "..OOOO..", ".OBBBOO.", ".OBBBOO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "dig-tide-4": [".BBBBBB.", "BBBBBBBB", "BBBBBBBB", "..OOOO..", ".OBBBOO.", ".OBBBOO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "dig-leaf-0": ["...GG...", "..GGGG..", ".GGGGGG.", ".GGGGGG.", "..GGGG..", "...GG...", "........", "........", "........", "........"],
  "dig-leaf-1": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OGGGOO.", "..OGGO..", "..OO.OO.", "...OO...", "..OO.OO.", ".OO...OO"],
  "dig-leaf-2": ["..GGGG..", ".GGGGGG.", "GGGGGGGG", "..OOOO..", ".OGGGOO.", "..OGGO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "dig-leaf-3": ["..GGGG..", ".GGGGGG.", "GGGGGGGG", "..OOOO..", ".OGGGOO.", ".OGGGOO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "dig-leaf-4": [".GGGGGG.", "GGGGGGGG", "GGGGGGGG", "..OOOO..", ".OGGGOO.", ".OGGGOO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "mob-slime": ["........", "..CC....", ".CCCC...", ".CCCC...", "..CC....", "........", "........", "........", "........", "........"],
  "mob-bug": ["........", "...KK...", "..KGGK..", ".KGGGGK.", "..KGGK..", "...KK...", "........", "........", "........", "........"],
  "mob-bunny": ["........", "..OOOO..", ".OWWWWO.", ".OWWWWO.", "..O..O..", "...OO...", "........", "........", "........", "........"],
  "mob-ghost": ["........", "..WWWW..", ".WWWWWW.", ".WW.WW.", ".WWWWWW.", "..W..W..", "........", "........", "........", "........"],
  "mob-demon": ["...RR...", "..RRRR..", ".RRRRRR.", ".RRRRRR.", "..R..R..", "..RRRR..", "........", "........", "........", "........"],
  "mob-beast": ["........", "..HHHH..", ".HHHHHH.", ".HHOOHH.", ".HHHHHH.", "..H..H..", "........", "........", "........", "........"],
  "mob-dragon": ["...RR...", "..RRRR..", ".RRYYRR.", ".RRRRRR.", "..R..R..", "..RRRR..", "........", "........", "........", "........"],
};

function shiftGrid(grid: string[], dy: number): string[] {
  if (dy === 0) return grid;
  const blank = "........";
  if (dy > 0) return [...grid.slice(dy), ...Array(dy).fill(blank)];
  return [...Array(-dy).fill(blank), ...grid.slice(0, grid.length + dy)];
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
  const out: Record<string, string[]> = { ...BASE };

  for (const key of Object.keys(BASE)) {
    out[`${key}-w2`] = shiftGrid(BASE[key], 1);
    out[`${key}-atk`] = shiftGrid(BASE[key], -1);
  }

  out["dig-ember-3a"] = tintGrid(BASE["dig-ember-3"], { R: "R" });
  out["dig-ember-3b"] = tintGrid(BASE["dig-ember-3"], { R: "Y", O: "R" });
  out["dig-ember-4a"] = tintGrid(BASE["dig-ember-4"], { R: "R" });
  out["dig-ember-4b"] = tintGrid(BASE["dig-ember-4"], { R: "Y", O: "R" });
  out["dig-tide-3a"] = tintGrid(BASE["dig-tide-3"], { B: "B" });
  out["dig-tide-3b"] = tintGrid(BASE["dig-tide-3"], { B: "M", O: "B" });
  out["dig-tide-4a"] = tintGrid(BASE["dig-tide-4"], { B: "B" });
  out["dig-tide-4b"] = tintGrid(BASE["dig-tide-4"], { B: "M", O: "B" });
  out["dig-leaf-3a"] = tintGrid(BASE["dig-leaf-3"], { G: "G" });
  out["dig-leaf-3b"] = tintGrid(BASE["dig-leaf-3"], { G: "C", O: "G" });
  out["dig-leaf-4a"] = tintGrid(BASE["dig-leaf-4"], { G: "G" });
  out["dig-leaf-4b"] = tintGrid(BASE["dig-leaf-4"], { G: "C", O: "G" });

  return out;
}

export const SPRITE_GRIDS = buildDerived();

export type SpritePose = "idle" | "walk" | "attack";

export function resolveSpriteKey(c: CompanionState, pose: SpritePose = "idle", walkFrame = 0): string {
  let key = baseSpriteKey(c);
  if (key === "none") return key;
  if (pose === "walk" && walkFrame % 2 === 1) key += "-w2";
  if (pose === "attack") key += "-atk";
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

export function renderCompanionSprite(c: CompanionState, extraClass = "", pose: SpritePose = "idle", walkFrame = 0): string {
  return renderPixelSprite(resolveSpriteKey(c, pose, walkFrame), extraClass);
}
