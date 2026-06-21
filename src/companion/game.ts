import type {
  AdventurerClass,
  CompanionState,
  CompanionWeapon,
  DigitalSpecies,
  EntryType,
  WeaponRarity,
} from "../types";
import { uid } from "../utils";

export const JOURNAL_XP: Record<EntryType, number> = {
  diary: 30,
  note: 20,
  quick: 15,
};

export const ADVENTURER_LABELS: Record<AdventurerClass, string> = {
  knight: "騎士",
  mage: "法師",
  hunter: "獵人",
};

export const DIGITAL_LABELS: Record<DigitalSpecies, string> = {
  ember: "焰系",
  tide: "潮系",
  leaf: "葉系",
};

export const STAGE_LABELS = ["數碼蛋", "幼年期", "成長期", "成熟期", "完全體"];

const WEAPON_POOL: Record<AdventurerClass, string[]> = {
  knight: ["木劍", "短劍", "長劍", "塔盾", "騎士矛", "細劍", "重盾"],
  mage: ["木杖", "水晶杖", "魔導書", "符文短杖", "星塵杖", "秘法珠"],
  hunter: ["短弓", "長弓", "獵刀", "投石器", "風羽弓", "陷阱包"],
};

const MONSTERS = [
  "波利",
  "綠棉蟲",
  "瘋兔",
  "小惡魔",
  "漂浮獸",
  "腐屍",
  "赤蠅",
  "蜂兵",
  "獸人戰士",
  "幽靈",
];

export function defaultCompanion(): CompanionState {
  return {
    mode: "none",
    level: 1,
    xp: 0,
    xpToNext: xpNeededForLevel(1),
    stage: 0,
    hp: 30,
    maxHp: 30,
    weapons: [],
    battlesWon: 0,
    journalXpTotal: 0,
    battleLog: [],
  };
}

export function xpNeededForLevel(level: number): number {
  return level * 80 + 20;
}

export function normalizeCompanion(raw?: Partial<CompanionState> | null): CompanionState {
  const base = defaultCompanion();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    weapons: raw.weapons ?? [],
    battleLog: raw.battleLog?.slice(-8) ?? [],
    xpToNext: raw.xpToNext ?? xpNeededForLevel(raw.level ?? 1),
  };
}

function rarityRoll(level: number): WeaponRarity {
  const roll = Math.random();
  if (level >= 10 && roll < 0.12) return "epic";
  if (level >= 5 && roll < 0.35) return "rare";
  return "common";
}

function atkForRarity(rarity: WeaponRarity, level: number): number {
  const base = rarity === "epic" ? 14 : rarity === "rare" ? 8 : 4;
  return base + Math.floor(level / 2);
}

function rollWeapon(cls: AdventurerClass, level: number): CompanionWeapon {
  const pool = WEAPON_POOL[cls];
  const name = pool[Math.floor(Math.random() * pool.length)];
  const rarity = rarityRoll(level);
  return {
    id: uid(),
    name,
    rarity,
    atk: atkForRarity(rarity, level),
    classTag: cls,
  };
}

function classPower(cls: AdventurerClass): number {
  if (cls === "knight") return 6;
  if (cls === "mage") return 8;
  return 5;
}

function equippedAtk(c: CompanionState): number {
  const w = c.weapons.find((x) => x.id === c.equippedWeaponId);
  return w?.atk ?? 0;
}

function pushLog(c: CompanionState, line: string): void {
  const log = c.battleLog ?? [];
  log.push(line);
  c.battleLog = log.slice(-8);
}

function applyLevelUps(c: CompanionState): string[] {
  const notes: string[] = [];
  while (c.xp >= c.xpToNext) {
    c.xp -= c.xpToNext;
    c.level += 1;
    c.xpToNext = xpNeededForLevel(c.level);
    c.maxHp += 8;
    c.hp = c.maxHp;
    notes.push(`升級！Lv.${c.level}`);

    if (c.mode === "digital") {
      const nextStage = stageForLevel(c.level);
      if (nextStage > c.stage) {
        c.stage = nextStage;
        notes.push(`進化為 ${STAGE_LABELS[c.stage]}！`);
      }
    }

    if (c.mode === "adventurer" && c.adventurerClass === "hunter" && c.level >= 5 && !c.hasWolf) {
      c.hasWolf = true;
      notes.push("獵人的狼夥伴加入了！");
    }
  }
  return notes;
}

export function stageForLevel(level: number): number {
  if (level >= 18) return 4;
  if (level >= 12) return 3;
  if (level >= 7) return 2;
  if (level >= 3) return 1;
  return 0;
}

export function grantJournalXp(c: CompanionState, amount: number, reason: string): string[] {
  if (c.mode === "none" || amount <= 0) return [];
  c.xp += amount;
  c.journalXpTotal += amount;
  pushLog(c, `${reason} +${amount} XP`);
  return applyLevelUps(c);
}

export function startAdventurer(_current: CompanionState, cls: AdventurerClass): CompanionState {
  const next = defaultCompanion();
  next.mode = "adventurer";
  next.adventurerClass = cls;
  next.stage = 1;
  next.hp = 40;
  next.maxHp = 40;
  const starter = rollWeapon(cls, 1);
  next.weapons = [starter];
  next.equippedWeaponId = starter.id;
  pushLog(next, `${ADVENTURER_LABELS[cls]} 開始冒險！`);
  return next;
}

export function startDigital(_current: CompanionState, species: DigitalSpecies): CompanionState {
  const next = defaultCompanion();
  next.mode = "digital";
  next.digitalSpecies = species;
  next.stage = 0;
  next.hp = 25;
  next.maxHp = 25;
  pushLog(next, `${DIGITAL_LABELS[species]} 數碼蛋開始 incubate…`);
  return next;
}

export function hatchDigitalEgg(c: CompanionState): string[] {
  if (c.mode !== "digital" || c.stage > 0) return [];
  c.stage = 1;
  c.xp += 20;
  pushLog(c, "蛋孵化了！進入幼年期");
  return applyLevelUps(c);
}

export interface BattleResult {
  notes: string[];
  weapon?: CompanionWeapon;
}

export function runBattle(c: CompanionState): BattleResult {
  if (c.mode === "none") return { notes: ["請先選擇夥伴模式"] };
  if (c.mode === "digital" && c.stage === 0) {
    return { notes: ["數碼蛋還在孵化，寫日記或按「孵化」加速成長"] };
  }

  const now = Date.now();
  if (c.lastBattleAt && now - c.lastBattleAt < 8000) {
    return { notes: ["夥伴需要休息，稍後再戰"] };
  }
  c.lastBattleAt = now;

  const monster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
  const notes: string[] = [];
  let power = c.level * 5 + equippedAtk(c);

  if (c.mode === "adventurer" && c.adventurerClass) {
    power += classPower(c.adventurerClass);
    if (c.adventurerClass === "hunter" && c.hasWolf) power += 6;
  } else if (c.mode === "digital") {
    power += c.stage * 4 + 3;
  }

  const foeHp = 12 + c.level * 4 + Math.floor(Math.random() * 10);
  const win = power + Math.floor(Math.random() * 10) >= foeHp * 0.55;

  if (win) {
    c.battlesWon += 1;
    const xpGain = 18 + Math.floor(Math.random() * 22) + c.stage;
    c.xp += xpGain;
    pushLog(c, `打倒 ${monster}！+${xpGain} XP`);
    notes.push(`打倒 ${monster}！`);
    notes.push(...applyLevelUps(c));

    if (c.mode === "adventurer" && c.adventurerClass && Math.random() < 0.28) {
      const weapon = rollWeapon(c.adventurerClass, c.level);
      c.weapons.unshift(weapon);
      if (c.weapons.length > 12) c.weapons = c.weapons.slice(0, 12);
      notes.push(`獲得武器：${weapon.name}（${weapon.rarity}）`);
      pushLog(c, `獲得 ${weapon.name}`);
      return { notes, weapon };
    }
  } else {
    c.hp = Math.max(1, c.hp - 4);
    pushLog(c, `${monster} 逃走了，HP -4`);
    notes.push(`${monster} 太強了，下次再來`);
  }

  return { notes };
}

export function equipWeapon(c: CompanionState, weaponId: string): boolean {
  if (!c.weapons.some((w) => w.id === weaponId)) return false;
  c.equippedWeaponId = weaponId;
  return true;
}

export function companionTitle(c: CompanionState): string {
  if (c.mode === "none") return "尚未選擇夥伴";
  if (c.mode === "adventurer" && c.adventurerClass) {
    return `${ADVENTURER_LABELS[c.adventurerClass]} Lv.${c.level}`;
  }
  if (c.mode === "digital" && c.digitalSpecies) {
    return `${DIGITAL_LABELS[c.digitalSpecies]} · ${STAGE_LABELS[c.stage] ?? "蛋"} Lv.${c.level}`;
  }
  return `夥伴 Lv.${c.level}`;
}

export function spriteKey(c: CompanionState): string {
  if (c.mode === "none") return "none";
  if (c.mode === "adventurer" && c.adventurerClass) {
    const tier = c.level >= 15 ? 3 : c.level >= 8 ? 2 : 1;
    return `adv-${c.adventurerClass}-${tier}${c.adventurerClass === "hunter" && c.hasWolf ? "-wolf" : ""}`;
  }
  if (c.mode === "digital" && c.digitalSpecies) {
    return `dig-${c.digitalSpecies}-${c.stage}`;
  }
  return "none";
}

/** 8×10 pixel art color grids (original designs, not copied assets) */
export const SPRITE_GRIDS: Record<string, string[]> = {
  "adv-knight-1": ["..SSSS..", ".SSSSSS.", "SSSSSSSS", "..OOOO..", ".OSSSOO.", ".OSSSOO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-knight-2": ["..SSSS..", ".SSSSSS.", "SSSSSSSS", "..OOOO..", ".OSSSOO.", ".OSSSOO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-knight-3": ["..SSSS..", ".SSSSSS.", "SSSSSSSS", "..OOOO..", ".OSSSOO.", ".OSSSOO.", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-mage-1": ["...PP...", "..PPPP..", ".PPPPPP.", "..OOOO..", ".OOPPOO.", "..OPPO..", "..OO.OO.", "...OO...", "..OO.OO.", ".OO...OO"],
  "adv-mage-2": ["...PP...", "..PPPP..", ".PPPPPP.", "..OOOO..", ".OOPPOO.", "..OPPO..", "..OO.OO.", "...OO...", "..OO.OO.", ".OO...OO"],
  "adv-mage-3": ["...VV...", "..VVVV..", ".VVVVVV.", "..OOOO..", ".OOVVOO.", "..OVVO..", "..OO.OO.", "...OO...", "..OO.OO.", ".OO...OO"],
  "adv-hunter-1": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-hunter-2": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-hunter-2-wolf": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-hunter-3-wolf": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
  "adv-hunter-3": ["...GG...", "..GGGG..", ".GGGGGG.", "..OOOO..", ".OOGGOO.", "..OGGO..", "..OO.OO.", "..OO..OO", ".OO...OO", "OO....OO"],
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
};

export const SPRITE_COLORS: Record<string, string> = {
  ".": "transparent",
  S: "#8a9bab",
  O: "#f5dcc8",
  P: "#7b6cf6",
  V: "#b48cff",
  G: "#6fa86f",
  R: "#e85d4c",
  B: "#4a9fd4",
};
