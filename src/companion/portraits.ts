import type { AdventurerClass, CompanionState } from "../types";
import type { SpritePose } from "./sprites";

const BASE = import.meta.env.BASE_URL;

const PICK_PORTRAITS: Record<AdventurerClass, string> = {
  hunter: `${BASE}companion/hunter-windhawk.png`,
  knight: `${BASE}companion/knight-lord.png`,
  mage: `${BASE}companion/mage-high.png`,
};

export interface PortraitSpec {
  src: string;
  scale: number;
  flip?: boolean;
}

export function getCompanionPortrait(c: CompanionState, _pose: SpritePose = "idle"): PortraitSpec | null {
  if (c.mode !== "adventurer" || !c.adventurerClass) return null;

  const tier = c.level >= 15 ? 3 : c.level >= 8 ? 2 : 1;

  if (c.adventurerClass === "hunter") {
    const scale = tier === 1 ? 0.72 : tier === 2 ? 0.86 : 1;
    return { src: `${BASE}companion/hunter-windhawk.png`, scale };
  }
  if (c.adventurerClass === "knight") {
    const scale = tier === 1 ? 0.78 : tier === 2 ? 0.9 : 1;
    return { src: `${BASE}companion/knight-lord.png`, scale };
  }
  if (c.adventurerClass === "mage") {
    const scale = tier === 1 ? 0.76 : tier === 2 ? 0.88 : 1;
    return { src: `${BASE}companion/mage-high.png`, scale };
  }
  return null;
}

export function renderCompanionPortrait(
  c: CompanionState,
  extraClass = "",
  pose: SpritePose = "idle",
  walkDir = 1
): string | null {
  const spec = getCompanionPortrait(c, pose);
  if (!spec) return null;
  const flip = walkDir < 0 ? " companion-portrait--flip" : "";
  const atk = pose === "attack" ? " companion-portrait--attack" : "";
  const scale = spec.scale.toFixed(2);
  return `<img src="${spec.src}" class="companion-portrait ${extraClass}${flip}${atk}" style="--portrait-scale:${scale}" alt="" draggable="false" loading="lazy" />`;
}

export function renderAdventurerPickPortrait(cls: AdventurerClass): string {
  return `<img src="${PICK_PORTRAITS[cls]}" class="companion-portrait companion-portrait--pick" alt="" draggable="false" loading="lazy" />`;
}
