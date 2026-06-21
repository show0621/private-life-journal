import type {
  AdventurerClass,
  CompanionState,
  CompanionWeapon,
  DigitalPath,
  DigitalSpecies,
  EntryType,
  WeaponRarity,
} from "../types";
import { uid } from "../utils";
import { baseSpriteKey } from "./sprites";

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

export const DIGITAL_PATH_LABELS: Record<DigitalSpecies, { a: string; b: string }> = {
  ember: { a: "炎帝線", b: "燄翼線" },
  tide: { a: "深潮線", b: "風暴線" },
  leaf: { a: "翠林線", b: "荊棘線" },
};

export const STAGE_LABELS = ["數碼蛋", "幼年期", "成長期", "成熟期", "完全體"];

export interface MonsterDef {
  name: string;
  sprite: string;
  tier: 1 | 2 | 3;
}

export const MONSTERS: MonsterDef[] = [
  { name: "波利", sprite: "mob-slime", tier: 1 },
  { name: "綠棉蟲", sprite: "mob-bug", tier: 1 },
  { name: "瘋兔", sprite: "mob-bunny", tier: 1 },
  { name: "小惡魔", sprite: "mob-demon", tier: 1 },
  { name: "漂浮獸", sprite: "mob-ghost", tier: 1 },
  { name: "腐屍", sprite: "mob-beast", tier: 1 },
  { name: "赤蠅", sprite: "mob-bug", tier: 1 },
  { name: "蜂兵", sprite: "mob-bug", tier: 1 },
  { name: "土人", sprite: "mob-beast", tier: 1 },
  { name: "蛇女", sprite: "mob-beast", tier: 2 },
  { name: "獸人戰士", sprite: "mob-beast", tier: 2 },
  { name: "幽靈", sprite: "mob-ghost", tier: 2 },
  { name: "邪骸浪人", sprite: "mob-beast", tier: 2 },
  { name: "赤蛇", sprite: "mob-beast", tier: 2 },
  { name: "殭屍", sprite: "mob-beast", tier: 2 },
  { name: "鬼火", sprite: "mob-ghost", tier: 2 },
  { name: "米諾斯", sprite: "mob-beast", tier: 3 },
  { name: "獸人酋長", sprite: "mob-beast", tier: 3 },
  { name: "德古拉", sprite: "mob-demon", tier: 3 },
  { name: "巴風特", sprite: "mob-demon", tier: 3 },
  { name: "幼龍", sprite: "mob-dragon", tier: 3 },
  { name: "冰波利", sprite: "mob-slime", tier: 1 },
  { name: "毒蘑菇", sprite: "mob-bug", tier: 1 },
  { name: "沙漠之狼", sprite: "mob-beast", tier: 2 },
  { name: "虎王", sprite: "mob-beast", tier: 3 },
];

const WEAPON_POOL: Record<AdventurerClass, string[]> = {
  knight: [
    "木劍",
    "短劍",
    "長劍",
    "細劍",
    "塔盾",
    "重盾",
    "騎士矛",
    "闊劍",
    "雙手劍",
    "聖十字",
    "合金盾",
    "符文刃",
    "龍鱗盾",
    "光之劍",
  ],
  mage: [
    "木杖",
    "水晶杖",
    "魔導書",
    "符文短杖",
    "星塵杖",
    "秘法珠",
    "元素珠",
    "閃電杖",
    "冰霜書",
    "烈焰杖",
    "虛空球",
    "時之杖",
    "賢者之書",
    "星辰法球",
  ],
  hunter: [
    "短弓",
    "長弓",
    "獵刀",
    "投石器",
    "風羽弓",
    "陷阱包",
    "連弩",
    "毒箭袋",
    "鷹眼弓",
    "獸牙匕首",
    "銀箭",
    "複合弓",
    "狼牙飾",
    "獵王弓",
  ],
};

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
    battleLog: raw.battleLog?.slice(-10) ?? [],
    xpToNext: raw.xpToNext ?? xpNeededForLevel(raw.level ?? 1),
  };
}

function rarityRoll(level: number): WeaponRarity {
  const roll = Math.random();
  if (level >= 12 && roll < 0.1) return "epic";
  if (level >= 6 && roll < 0.32) return "rare";
  return "common";
}

function atkForRarity(rarity: WeaponRarity, level: number): number {
  const base = rarity === "epic" ? 16 : rarity === "rare" ? 9 : 4;
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
  c.battleLog = log.slice(-10);
}

export interface LevelUpResult {
  notes: string[];
  evolved: boolean;
}

function applyLevelUps(c: CompanionState): LevelUpResult {
  const notes: string[] = [];
  let evolved = false;
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
        evolved = true;
        notes.push(`進化為 ${STAGE_LABELS[c.stage]}！`);
      }
    }

    if (c.mode === "adventurer" && c.adventurerClass === "hunter" && c.level >= 5 && !c.hasWolf) {
      c.hasWolf = true;
      notes.push("獵人的狼夥伴加入了！");
      evolved = true;
    }
  }
  return { notes, evolved };
}

export function stageForLevel(level: number): number {
  if (level >= 18) return 4;
  if (level >= 12) return 3;
  if (level >= 7) return 2;
  if (level >= 3) return 1;
  return 0;
}

export function needsDigitalPathChoice(c: CompanionState): boolean {
  return c.mode === "digital" && c.stage >= 2 && !c.digitalPath;
}

export function setDigitalPath(c: CompanionState, path: DigitalPath): string[] {
  if (c.mode !== "digital" || !c.digitalSpecies) return [];
  c.digitalPath = path;
  const label = DIGITAL_PATH_LABELS[c.digitalSpecies][path];
  pushLog(c, `選擇進化分支：${label}`);
  return [`進化分支：${label}`];
}

export function grantJournalXp(c: CompanionState, amount: number, reason: string): string[] {
  if (c.mode === "none" || amount <= 0) return [];
  c.xp += amount;
  c.journalXpTotal += amount;
  pushLog(c, `${reason} +${amount} XP`);
  return applyLevelUps(c).notes;
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
  pushLog(next, `${DIGITAL_LABELS[species]} 數碼蛋開始孵化…`);
  return next;
}

export function hatchDigitalEgg(c: CompanionState): string[] {
  if (c.mode !== "digital" || c.stage > 0) return [];
  c.stage = 1;
  c.xp += 20;
  pushLog(c, "蛋孵化了！進入幼年期");
  return applyLevelUps(c).notes;
}

function pickMonster(level: number): MonsterDef {
  const maxTier = level >= 14 ? 3 : level >= 7 ? 2 : 1;
  const pool = MONSTERS.filter((m) => m.tier <= maxTier);
  return pool[Math.floor(Math.random() * pool.length)] ?? MONSTERS[0];
}

export interface BattleResult {
  notes: string[];
  weapon?: CompanionWeapon;
  monster: MonsterDef;
  win: boolean;
  evolved: boolean;
}

export function runBattle(c: CompanionState): BattleResult {
  const monster = pickMonster(c.level);
  if (c.mode === "none") {
    return { notes: ["請先選擇夥伴模式"], monster, win: false, evolved: false };
  }
  if (c.mode === "digital" && c.stage === 0) {
    return { notes: ["數碼蛋還在孵化，寫日記或按「孵化」加速成長"], monster, win: false, evolved: false };
  }

  const now = Date.now();
  if (c.lastBattleAt && now - c.lastBattleAt < 6000) {
    return { notes: ["夥伴需要休息，稍後再戰"], monster, win: false, evolved: false };
  }
  c.lastBattleAt = now;

  const notes: string[] = [];
  let power = c.level * 5 + equippedAtk(c);

  if (c.mode === "adventurer" && c.adventurerClass) {
    power += classPower(c.adventurerClass);
    if (c.adventurerClass === "hunter" && c.hasWolf) power += 6;
  } else if (c.mode === "digital") {
    power += c.stage * 4 + 3;
    if (c.digitalPath === "b") power += 2;
  }

  const foeHp = 10 + monster.tier * 8 + c.level * 3 + Math.floor(Math.random() * 8);
  const win = power + Math.floor(Math.random() * 12) >= foeHp * 0.52;
  let evolved = false;

  if (win) {
    c.battlesWon += 1;
    const xpGain = 16 + Math.floor(Math.random() * 24) + c.stage + monster.tier * 2;
    c.xp += xpGain;
    pushLog(c, `打倒 ${monster.name}！+${xpGain} XP`);
    notes.push(`打倒 ${monster.name}！`);
    const levelUp = applyLevelUps(c);
    notes.push(...levelUp.notes);
    evolved = levelUp.evolved;

    if (c.mode === "adventurer" && c.adventurerClass && Math.random() < 0.3) {
      const weapon = rollWeapon(c.adventurerClass, c.level);
      c.weapons.unshift(weapon);
      if (c.weapons.length > 16) c.weapons = c.weapons.slice(0, 16);
      notes.push(`獲得武器：${weapon.name}（${weapon.rarity}）`);
      pushLog(c, `獲得 ${weapon.name}`);
      return { notes, weapon, monster, win, evolved };
    }
  } else {
    c.hp = Math.max(1, c.hp - 4);
    pushLog(c, `${monster.name} 逃走了，HP -4`);
    notes.push(`${monster.name} 太強了，下次再來`);
  }

  return { notes, monster, win, evolved };
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
    let branch = "";
    if (c.stage >= 3 && c.digitalPath) {
      branch = ` · ${DIGITAL_PATH_LABELS[c.digitalSpecies][c.digitalPath]}`;
    }
    return `${DIGITAL_LABELS[c.digitalSpecies]} · ${STAGE_LABELS[c.stage] ?? "蛋"} Lv.${c.level}${branch}`;
  }
  return `夥伴 Lv.${c.level}`;
}

/** @deprecated use baseSpriteKey from sprites.ts */
export function spriteKey(c: CompanionState): string {
  return baseSpriteKey(c);
}
