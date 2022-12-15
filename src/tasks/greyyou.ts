import { CombatStrategy, step } from "grimoire-kolmafia";
import {
  autosell,
  buy,
  buyUsingStorage,
  cliExecute,
  descToItem,
  getFuel,
  getWorkshed,
  handlingChoice,
  hippyStoneBroken,
  itemAmount,
  myAdventures,
  myClass,
  myLevel,
  myStorageMeat,
  myTurncount,
  restoreMp,
  runChoice,
  runCombat,
  storageAmount,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $location,
  $skill,
  ascend,
  AsdonMartin,
  ensureEffect,
  get,
  getKramcoWandererChance,
  have,
  Lifestyle,
  Macro,
  Pantogram,
  Paths,
  prepareAscension,
  RetroCape,
  set,
  SourceTerminal,
} from "libram";
import { getCurrentLeg, Leg, Quest, Task } from "./structure";
import { breakfast, garbo, pvp } from "./aftercore";
import { isHalloween } from "../constants";

const gear: Task[] = [
  {
    name: "Lucky Gold Ring",
    after: [],
    completed: () => have($item`lucky gold ring`),
    do: () => cliExecute("pull lucky gold ring"),
    limit: { tries: 1 },
  },
  {
    name: "Pointer Finger",
    after: [],
    completed: () => have($item`mafia thumb ring`),
    do: () => cliExecute("pull mafia thumb ring"),
    limit: { tries: 1 },
  },
  {
    name: "Harness",
    after: [],
    // eslint-disable-next-line libram/verify-constants
    completed: () => have($item`Trainbot harness`),
    do: () => cliExecute("pull Trainbot harness"),
    limit: { tries: 1 },
  },
  {
    name: "Crown",
    after: [],
    completed: () => have($item`Crown of Thrones`),
    do: () => cliExecute("pull Crown of Thrones"),
    limit: { tries: 1 },
  },
  {
    name: "Diaper",
    after: [],
    completed: () => have($item`repaid diaper`),
    do: () => cliExecute("pull repaid diaper"),
    limit: { tries: 1 },
  },
  {
    name: "Specs",
    after: [],
    completed: () => have($item`Mr. Cheeng's spectacles`),
    do: () => cliExecute("pull Mr. Cheeng's spectacles"),
    limit: { tries: 1 },
  },
  {
    name: "Asdon",
    after: [],
    completed: () => have($item`Asdon Martin keyfob`) || have($item`cold medicine cabinet`),
    do: () => cliExecute("pull Asdon Martin keyfob"),
    limit: { tries: 1 },
  },
];

export const GyouQuest: Quest = {
  name: "Grey You",
  completed: () => getCurrentLeg() > Leg.GreyYou,
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.GreyYou,
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      do: (): void => {
        prepareAscension({
          eudora: "Our Daily Candles™ order form",
        });
        ascend(
          Paths.GreyYou,
          // eslint-disable-next-line libram/verify-constants
          $class`Grey Goo`,
          Lifestyle.softcore,
          "vole",
          $item`astral six-pack`,
          $item`astral pistol`
        );
        if (visitUrl("choice.php").includes("somewhat-human-shaped mass of grey goo nanites"))
          runChoice(1);
      },
      limit: { tries: 1 },
    },
    ...gear,
    {
      name: "Break Stone",
      completed: () => hippyStoneBroken(),
      do: (): void => {
        const smashText = visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true);
        if (smashText.indexOf("Pledge allegiance to") >= 0) {
          visitUrl("peevpee.php?action=pledge&place=fight&pwd");
        }
      },
      limit: { tries: 1 },
    },
    {
      name: "Run",
      after: ["Ascend", "Break Stone", ...gear.map((task) => task.name)],
      completed: () =>
        step("questL13Final") !== -1 && get("gooseReprocessed").split(",").length >= 73,
      do: () => cliExecute("loopgyou delaytower tune=wombat"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "In-Run Farm Initial",
      after: ["Ascend", "Run", ...gear.map((task) => task.name)],
      completed: () => myTurncount() >= 1000,
      do: (): void => {
        cliExecute("ashq import <bestbjorn.ash>; enthrone_familiar(get_best_bjorn());");
        visitUrl("adventure.php?snarfblat=559");
        if (handlingChoice()) {
          runChoice(2);
        } else {
          runCombat();
        }
      },
      prepare: (): void => {
        cliExecute("ccs slap");
        // Swap to asdon when all extrovermectins are done
        if (
          have($item`Asdon Martin keyfob`) &&
          getWorkshed() === $item`cold medicine cabinet` &&
          get("_coldMedicineConsults") >= 5
        ) {
          use($item`Asdon Martin keyfob`);
        }
      },
      post: getExtros,
      outfit: {
        familiar: $familiar`Temporal Riftlet`,
        // eslint-disable-next-line libram/verify-constants
        back: $item`Trainbot harness`,
        hat: $item`Crown of Thrones`,
        // eslint-disable-next-line libram/verify-constants
        shirt: $item`Jurassic Parka`,
        weapon: $item`June cleaver`,
        offhand: $item`KoL Con 13 snowglobe`,
        pants: $item`repaid diaper`,
        acc1: $item`lucky gold ring`,
        acc2: $item`mafia thumb ring`,
        acc3: $item`Mr. Cheeng's spectacles`,
        modifier: "familiar weight",
      },
      limit: { tries: 550 },
      tracking: "GooFarming",
    },
    {
      name: "Pull All",
      after: ["Ascend", "In-Run Farm Initial"],
      completed: () => myStorageMeat() === 0 && storageAmount($item`Law of Averages`) === 0, // arbitrary item,
      do: (): void => {
        cliExecute("pull all");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Tower",
      after: ["Ascend", "Pull All", "In-Run Farm Initial"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopgyou delaytower"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "In-Run Farm Final",
      after: ["Ascend", "Tower", ...gear.map((task) => task.name)],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myAdventures() <= 40 || myClass() !== $class`Grey Goo`,
      // eslint-disable-next-line libram/verify-constants
      do: () => $location`Crimbo Train (Caboose)`,
      prepare: () => cliExecute("ccs slap"),
      outfit: {
        familiar: $familiar`Temporal Riftlet`,
        // eslint-disable-next-line libram/verify-constants
        back: $item`Trainbot harness`,
        hat: $item`Crown of Thrones`,
        // eslint-disable-next-line libram/verify-constants
        shirt: $item`Jurassic Parka`,
        weapon: $item`June cleaver`,
        offhand: $item`KoL Con 13 snowglobe`,
        pants: $item`repaid diaper`,
        acc1: $item`lucky gold ring`,
        acc2: $item`mafia thumb ring`,
        acc3: $item`Mr. Cheeng's spectacles`,
        famequip: $item`razor fang`,
      },
      limit: { tries: 350 },
      tracking: "GooFarming",
    },
    {
      name: "Prism",
      after: ["Ascend", "In-Run Farm Final"],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myClass() !== $class`Grey Goo`,
      do: () => cliExecute("loopgyou class=1"),
      limit: { tries: 1 },
    },
    {
      name: "Level",
      after: ["Ascend", "Prism", "Pull All"],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myClass() !== $class`Grey Goo` && myLevel() >= 13,
      do: () => cliExecute("loopcasual goal=level"),
      limit: { tries: 1 },
    },
    ...breakfast(["Ascend", "Prism", "Pull All", "Level"]),
    ...garbo(
      ["Ascend", "Prism", "Pull All", "Level", "Breakfast"],
      true,
      isHalloween ? "garboween ascend" : "railo ascend",
      isHalloween ? "garboween ascend" : "railo ascend"
    ),
    ...pvp(["Overdrunk"]),
  ],
};

function getExtros(): void {
  if (getWorkshed() !== $item`cold medicine cabinet`) return;
  if (get("_coldMedicineConsults") >= 5 || get("_nextColdMedicineConsult") > totalTurnsPlayed()) {
    return;
  }
  const options = visitUrl("campground.php?action=workshed");
  let match;
  const regexp = /descitem\((\d+)\)/g;
  while ((match = regexp.exec(options)) !== null) {
    const item = descToItem(match[1]);
    if (item === $item`Extrovermectin™`) {
      visitUrl("campground.php?action=workshed");
      runChoice(5);
      return;
    }
  }
}
