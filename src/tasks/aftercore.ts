import { CombatStrategy } from "grimoire-kolmafia";
import {
  abort,
  availableAmount,
  cliExecute,
  closetAmount,
  currentPvpStances,
  formatDateTime,
  fullnessLimit,
  hippyStoneBroken,
  inebrietyLimit,
  maximize,
  myAdventures,
  myAscensions,
  myFamiliar,
  myFullness,
  myInebriety,
  mySpleenUse,
  numericModifier,
  putCloset,
  putShop,
  pvpAttacksLeft,
  spleenLimit,
  takeCloset,
  todayToString,
  toInt,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $location,
  $skill,
  get,
  have,
  Macro,
  set,
  uneffect,
} from "libram";
import { acceptablePvpStances, melfDupeItem, voaDrunk } from "../constants";
import { getCurrentLeg, Leg, Quest, Task } from "./structure";

export function canEat(): boolean {
  return (
    myFullness() < fullnessLimit() ||
    mySpleenUse() < spleenLimit() ||
    myInebriety() < inebrietyLimit() ||
    get("currentMojoFilters") < 3
  );
}

export function stooperDrunk(): boolean {
  return (
    myInebriety() > inebrietyLimit() ||
    (myInebriety() === inebrietyLimit() && myFamiliar() === $familiar`Stooper`)
  );
}

export function breakfast(after: string[]): Task[] {
  return [
    {
      name: "Old Man",
      after: after,
      completed: () => have($item`little bitty bathysphere`),
      do: () => {
        visitUrl("oldman.php", false);
        visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
      },
      limit: { tries: 1 },
    },
    {
      name: "Breakfast",
      after: [...after, "Old Man"],
      completed: () => get("breakfastCompleted"),
      do: () => cliExecute("breakfast"),
      limit: { tries: 1 },
    },
    {
      name: "Pirate Bellow",
      after: [...after, "Breakfast"],
      completed: () => get("_pirateBellowUsed"),
      do: () => useSkill($skill`Pirate Bellow`),
      limit: { tries: 1 },
    },
  ];
}

export function duplicate(after: string[]): Task[] {
  return [
    {
      name: "Duplicate Prep",
      after: after,
      completed: () => $location`The Deep Machine Tunnels`.turnsSpent >= 5,
      do: $location`The Deep Machine Tunnels`,
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: {
        offhand: $item`Drunkula's wineglass`,
        familiar: $familiar`Machine Elf`,
        modifier: "muscle",
      },
      limit: { tries: 5 },
    },
    {
      name: "Duplicate",
      after: [...after, "Duplicate Prep"],
      ready: () =>
        closetAmount(melfDupeItem) > 0 && $location`The Deep Machine Tunnels`.turnsSpent === 5,
      completed: () => get("lastDMTDuplication") === myAscensions(),
      prepare: (): void => {
        set("choiceAdventure1125", `1&iid=${toInt(melfDupeItem)}`);
        takeCloset(1, melfDupeItem);
      },
      do: $location`The Deep Machine Tunnels`,
      post: (): void => {
        putCloset(1, melfDupeItem);
        putShop(0, 0, 1, melfDupeItem);
      },
      choices: { 1119: 4 },
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: {
        offhand: $item`Drunkula's wineglass`,
        familiar: $familiar`Machine Elf`,
        modifier: "muscle",
      },
      limit: { tries: 1 },
    },
  ];
}

export function garboAscend(after: string[], garbo: string): Task[] {
  return [
    {
      name: "Garbo",
      after: after,
      completed: () => (myAdventures() === 0 && !canEat()) || stooperDrunk(),
      do: () => {
        if (have($item`can of Rain-Doh`) && !have($item`Rain-Doh blue balls`))
          use($item`can of Rain-Doh`);
        cliExecute(garbo);
      },
      limit: { tries: 1 },
      tracking: "Garbo",
    },
    {
      name: "Wish",
      after: [...after],
      completed: () => get("_genieWishesUsed") >= 3 || !have($item`genie bottle`),
      do: () => cliExecute(`genie wish for more wishes`),
      limit: { tries: 3 },
    },
    {
      name: "Stooper",
      after: [...after, "Garbo", "Wish"],
      do: () => cliExecute("drink stillsuit distillate"),
      completed: () => stooperDrunk(),
      outfit: { familiar: $familiar`Stooper` },
      effects: $effects`Ode to Booze`,
      limit: { tries: 1 },
    },
    {
      name: "Caldera",
      after: [...after, "Stooper"],
      acquire: [{ item: $item`heat-resistant sheet metal`, price: 5000, optional: true }],
      prepare: () => useSkill($skill`Cannelloni Cocoon`),
      do: $location`The Bubblin' Caldera`,
      completed: () =>
        $location`The Bubblin' Caldera`.turnsSpent >= 7 ||
        $location`The Bubblin' Caldera`.noncombatQueue.includes("Lava Dogs"),
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: { modifier: "muscle", familiar: $familiar`Stooper` },
      limit: { tries: 10 }, // Clear intro adventure
    },
    {
      name: "Overdrink",
      after: [...after, "Stooper"],
      do: () => cliExecute(`CONSUME NIGHTCAP NOMEAT VALUE ${voaDrunk}`),
      completed: () => myInebriety() > inebrietyLimit(),
      limit: { tries: 1 },
    },
    ...duplicate([...after, "Overdrink"]),
    {
      name: "Black Heart",
      after: [...after, "Overdrink", "Duplicate"],
      completed: () =>
        get("_interviewMasquerade") || availableAmount($item`plastic vampire fangs`) === 0,
      outfit: {
        offhand: $item`Drunkula's wineglass`,
        acc3: $item`plastic vampire fangs`,
      },
      do: (): void => {
        visitUrl("place.php?whichplace=town&action=town_vampout");
        cliExecute("choice-goal");
      },
      limit: { tries: 1 },
    },
    {
      name: "Overdrunk",
      after: [...after, "Overdrink", "Duplicate"],
      prepare: () => uneffect($effect`Drenched in Lava`),
      completed: () => myAdventures() === 0 && myInebriety() > inebrietyLimit(),
      do: () => cliExecute("garbo ascend"),
      limit: { tries: 1 },
      tracking: "Garbo",
    },
  ];
}

export function pvp(after: string[], ascend = true): Task[] {
  const todayStr = formatDateTime("yyyyMMdd", todayToString(), "MMdd");
  const year = toInt(formatDateTime("yyyyMMdd", todayToString(), "yyyy"));
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const isSeasonEnd =
    ["0229", "0430", "0630", "0831", "1031", "1231"].indexOf(todayStr) !== -1 ||
    (todayStr === "0228" && !isLeap);
  const useAll = isSeasonEnd || ascend;
  const excessFites = () => {
    if (pvpAttacksLeft() === 0) {
      return 0;
    }
    maximize("adv,0.7fites,familiar Left-Hand Man,-tie", true);
    return Math.max(
      pvpAttacksLeft() + 10 + numericModifier("Generated:_spec", "PvP Fights") - 100,
      0
    );
  };
  const fitesToUse = () => (useAll ? pvpAttacksLeft() : excessFites());

  return [
    {
      name: "Fights",
      after: after,
      ready: () => hippyStoneBroken(),
      do: () => {
        cliExecute("unequip");
        cliExecute("UberPvPOptimizer");
        const stance = Object.keys(currentPvpStances()).find(
          (stance) => acceptablePvpStances.find((acceptable) => stance === acceptable) !== undefined
        );
        if (stance === undefined) {
          abort(
            "Couldn't find an acceptable pvp stance. Please update constants.ts with one from this season."
          );
        }
        const toUse = fitesToUse();
        cliExecute(`pvp${toUse > 0 ? ` ${toUse}` : ""} loot ${stance}`);
      },
      completed: () => fitesToUse() <= 0,
      limit: { tries: 1 },
      post: () => cliExecute("refresh inv"),
    },
  ];
}

export const AftercoreQuest: Quest = {
  name: "Aftercore",
  completed: () => getCurrentLeg() > Leg.Aftercore,
  tasks: [
    ...breakfast([]),
    ...garboAscend(["Breakfast"], "garbo yachtzeechain ascend"),
    ...pvp(["Overdrunk"]),
  ],
};
