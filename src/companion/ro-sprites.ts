/** Original RO-inspired chibi adventurer sprites (16–20px wide, not copied assets). */

export const RO_COLORS: Record<string, string> = {
  ".": "transparent",
  K: "#1a2433",
  O: "#f4c8a8",
  E: "#d8a880",
  S: "#c8d4e0",
  s: "#98a8b8",
  A: "#687888",
  D: "#3868c8",
  d: "#284878",
  R: "#d84848",
  Y: "#e8c848",
  W: "#eef4fc",
  w: "#98a8c0",
  H: "#886848",
  h: "#604830",
  M: "#6858c8",
  m: "#4030a0",
  P: "#8878e8",
  p: "#5848b8",
  T: "#c8a858",
  t: "#886830",
  F: "#f0e8ff",
  G: "#58a858",
  g: "#387838",
  L: "#a87848",
  l: "#684828",
  B: "#886038",
  b: "#503818",
  C: "#787878",
  c: "#505050",
  N: "#f8a0b0",
  n: "#e87898",
};

const W16 = 16;
const pad = (rows: string[], height: number, width = W16): string[] => {
  const blank = ".".repeat(width);
  const fixed = rows.map((r) => r.padEnd(width, ".").slice(0, width));
  while (fixed.length < height) fixed.push(blank);
  return fixed;
};

/** Swordman / Knight – silver armor, blue cape, red plume, sword & shield */
const KNIGHT_1 = pad(
  [
    "......RRRR......",
    ".....SSSSS......",
    "....SSSSSSS.....",
    "....SSSOOSS.....",
    ".....OO..OO.....",
    "....SSSSSSS.....",
    "...SSSDDSSS.....",
    "..SSSSSSSSSS....",
    "..OOSSSSSSOO....",
    "...SSSSSSSS.....",
    "...DDSSSSDD.....",
    "..DDDSSSSDDD....",
    "..DDDSSSSDDD....",
    "..DDD....DDD....",
    ".WK......HHH....",
    "..K......K.K....",
  ],
  18
);

const KNIGHT_2 = pad(
  [
    "......RRRR......",
    ".....SSSSS......",
    "....SSSSSSS.....",
    "....SSSYOSS.....",
    ".....OO..OO.....",
    "....SSSSSSS.....",
    "...SSSDDSSS.....",
    "..SSSSSSSSSS....",
    "..OOSSSSSSOO....",
    "...SSSSSSSS.....",
    "..DDSSSSSSDD....",
    ".DDDSSSSSSDDD...",
    ".DDDSSSSSSDDD...",
    ".DDDSSSSSSDDD...",
    "WK.......HHHH...",
    ".K.......K.K....",
  ],
  18
);

const KNIGHT_3 = pad(
  [
    "......RRRR......",
    "....SSSSSSS.....",
    "....SSSSSSS.....",
    "....SSSYOSS.....",
    ".....OO..OO.....",
    "...SSSSSSSSS....",
    "..SSSDDDDSSS....",
    ".SSSSSSSSSSSS...",
    ".OOSSSSSSSSOO...",
    "..SSSSSSSSSS....",
    ".DDSSSSSSSSDD...",
    "DDDSSSSSSSSDDD..",
    "DDDSSSSSSSSDDD..",
    "DDDSSSSSSSSDDD..",
    "WK........HHHH..",
    ".K........K.K...",
  ],
  18
);

const KNIGHT_ATK = pad(
  [
    "......RRRR......",
    ".....SSSSS......",
    "....SSSSSSS.....",
    "....SSSOOSS.....",
    ".....OO..OO.....",
    "....SSSSSSS.....",
    "...SSSDDSSS.....",
    "..SSSSSSSSSS....",
    "..OOSSSSSSOO....",
    "...SSSSSSSS.....",
    "...DDSSSSDD.....",
    "..DDDSSSSDDD....",
    "WWWWDDDSSSSDDD..",
    "...WWWW....DDD..",
    "....WK...HHH....",
    ".....K...K.K....",
  ],
  18
);

/** Mage / Wizard – violet hat & robe, wooden staff */
const MAGE_1 = pad(
  [
    "......PPPP......",
    ".....PPPPPP.....",
    "....PPPPPPPP....",
    "....PPPSSPPP....",
    ".....OO..OO.....",
    "....MMMMMMMM....",
    "...MMMMMMMMMM...",
    "..MMMMMMMMMMMM..",
    "..OOmmmmmmOO....",
    "...mmmmmmmm.....",
    "...mmmmmmmm.....",
    "..mmmm..mmmm....",
    "..mmmm..mmmm....",
    ".TT.......TT....",
    ".tt.......tt....",
    ".....FF.........",
  ],
  18
);

const MAGE_2 = pad(
  [
    ".....PPPPPP.....",
    "....PPPPPPPP....",
    "....PPPPPPPP....",
    "....PPPSSPPP....",
    ".....OO..OO.....",
    "...MMMMMMMMMM...",
    "..MMMMMMMMMMMM..",
    ".MMMMMMMMMMMMMM.",
    ".OOmmmmmmmmOO...",
    "..mmmmmmmmmm....",
    "..mmmmmmmmmm....",
    ".mmmm....mmmm...",
    ".mmmm....mmmm...",
    "TT..........TT..",
    "tt..........tt..",
    "....FF..FF......",
  ],
  18
);

const MAGE_3 = pad(
  [
    "....PPPPPPPP....",
    "...PPPPPPPPPP...",
    "...PPPPPPPPPP...",
    "...PPPPSSPPP....",
    "....OO....OO....",
    "..MMMMMMMMMMMM..",
    ".MMMMMMMMMMMMMM.",
    "MMMMMMMMMMMMMMMM",
    "OOmmmmmmmmmmOO..",
    ".mmmmmmmmmmmm...",
    ".mmmmmmmmmmmm...",
    "mmmm......mmmm..",
    "mmmm......mmmm..",
    "TT............TT",
    "tt............tt",
    "..FFFF..FFFF....",
  ],
  18
);

const MAGE_ATK = pad(
  [
    "......PPPP......",
    ".....PPPPPP.....",
    "....PPPPPPPP....",
    "....PPPSSPPP....",
    ".....OO..OO.....",
    "....MMMMMMFF....",
    "...MMMMMMFFFF...",
    "..MMMMMMMMFFFF..",
    "..OOmmmmFFFOOO..",
    "...mmmmFFFF.....",
    "...mmmmmmmm.....",
    "..mmmm..mmmm....",
    "..mmmm..mmmm....",
    ".TT...FFFF..TT..",
    ".tt.......tt....",
    ".....FFFFFF.....",
  ],
  18
);

/** Archer / Hunter – green tunic, bow; wolf variant is wider */
const HUNTER_1 = pad(
  [
    ".....GGGGG......",
    "....GGGOOGG.....",
    ".....OO..OO.....",
    "....GGGGGGGG....",
    "...GGGLLGGGG....",
    "..GGGGGGGGGG....",
    "..OOGGGGGGOO....",
    "...GGGGGGGG.....",
    "...GG....GG.....",
    "..GG......GG....",
    "..GG......GG....",
    ".....BBBBB......",
    "....BB...BB.....",
    "................",
    "................",
    "................",
  ],
  18
);

const HUNTER_2 = pad(
  [
    ".....GGGGG......",
    "....GGGOOGG.....",
    ".....OO..OO.....",
    "....GGGGGGGG....",
    "...GGGLLLGGG....",
    "..GGGGGGGGGG....",
    "..OOGGGGGGOO....",
    "...GGGGGGGG.....",
    "..GGG....GGG....",
    "..GG......GG....",
    "..GG......GG....",
    "....BBBBBBB.....",
    "...BB.....BB....",
    "................",
    "................",
    "................",
  ],
  18
);

const HUNTER_3 = pad(
  [
    ".....GGGGG......",
    "....GGGOOGG.....",
    ".....OO..OO.....",
    "...GGGGGGGGG....",
    "..GGGLLLLLGGG...",
    ".GGGGGGGGGGGG...",
    ".OOGGGGGGGGOO...",
    "..GGGGGGGGGG....",
    "..GGG....GGG....",
    "..GG......GG....",
    "..GG......GG....",
    "...BBBBBBBBB....",
    "..BB.......BB...",
    "................",
    "................",
    "................",
  ],
  18
);

const HUNTER_ATK = pad(
  [
    ".....GGGGG......",
    "....GGGOOGG.....",
    ".....OO..OO.....",
    "....GGGGGGGG....",
    "...GGGLLGGGG....",
    "..GGGGGGGGGG....",
    "..OOGGGGGGOO....",
    "...GGGGGGGG.....",
    "...GG....GG.....",
    "..GG......GG....",
    "BBBBBB....GG....",
    "BB..BB....GG....",
    ".....BB.........",
    "................",
    "................",
    "................",
  ],
  18
);

const W20 = 20;
const pad20 = (rows: string[], height: number): string[] => pad(rows, height, W20);

const HUNTER_2_WOLF = pad20(
  [
    "....................",
    "..CC....GGGGG.......",
    ".CCCO...GGGOOGG.....",
    "CCCOC....OO..OO.....",
    ".CCC....GGGGGGGG....",
    "..CC...GGGLLGGGG....",
    ".......GGGGGGGGGG...",
    ".......OOGGGGGGOO...",
    "........GGGGGGGG....",
    "........GG....GG....",
    ".......GG......GG...",
    "...........BBBBB....",
    "..........BB...BB...",
    "....................",
    "....................",
    "....................",
  ],
  18
);

const HUNTER_3_WOLF = pad20(
  [
    "....................",
    "..CC....GGGGG.......",
    ".CCCO...GGGOOGG.....",
    "CCCOC....OO..OO.....",
    ".CCC...GGGGGGGGG....",
    "..CC..GGGLLLGGGG....",
    "......GGGGGGGGGGG...",
    "......OOGGGGGGOO....",
    ".......GGGGGGGGG....",
    ".......GGG....GGG...",
    "......GG......GG....",
    ".........BBBBBBB....",
    "........BB.....BB...",
    "....................",
    "....................",
    "....................",
  ],
  18
);

/** Pink slime – RO poring homage (original 12px) */
const PORING = pad(
  [
    "....NNNN....",
    "...NNNNNN...",
    "..NNNNNNNN..",
    "..NNOONNNN..",
    ".NNNNNNNNNN.",
    ".NNNNNNNNNN.",
    "..NNNNNNNN..",
    "...NNNNNN...",
    "....NNNN....",
  ],
  12,
  12
);

export const RO_ADVENTURER_SPRITES: Record<string, string[]> = {
  "adv-knight-1": KNIGHT_1,
  "adv-knight-2": KNIGHT_2,
  "adv-knight-3": KNIGHT_3,
  "adv-knight-1-atk": KNIGHT_ATK,
  "adv-knight-2-atk": KNIGHT_ATK,
  "adv-knight-3-atk": KNIGHT_ATK,
  "adv-mage-1": MAGE_1,
  "adv-mage-2": MAGE_2,
  "adv-mage-3": MAGE_3,
  "adv-mage-1-atk": MAGE_ATK,
  "adv-mage-2-atk": MAGE_ATK,
  "adv-mage-3-atk": MAGE_ATK,
  "adv-hunter-1": HUNTER_1,
  "adv-hunter-2": HUNTER_2,
  "adv-hunter-3": HUNTER_3,
  "adv-hunter-1-atk": HUNTER_ATK,
  "adv-hunter-2-atk": HUNTER_ATK,
  "adv-hunter-3-atk": HUNTER_ATK,
  "adv-hunter-2-wolf": HUNTER_2_WOLF,
  "adv-hunter-3-wolf": HUNTER_3_WOLF,
  "adv-hunter-2-wolf-atk": HUNTER_ATK,
  "adv-hunter-3-wolf-atk": HUNTER_ATK,
  "mob-slime": PORING,
};

export function roWalkFrame(baseKey: string, frame: number): string {
  if (frame % 2 === 0) return baseKey;
  return `${baseKey}-w2`;
}
