import {
  buy,
  cliExecute,
  drink,
  fullnessLimit,
  inebrietyLimit,
  myAdventures,
  myClass,
  myDaycount,
  myFamiliar,
  myFullness,
  myInebriety,
  myLevel,
  myPath,
  mySpleenUse,
  myTurncount,
  print,
  runChoice,
  spleenLimit,
  use,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  ascend,
  get,
  have,
  haveInCampground,
  Lifestyle,
  Macro,
  Paths,
  prepareAscension,
} from "libram";
import {
  Args,
  Task as BaseTask,
  CombatStrategy,
  Engine,
  getTasks,
  Quest,
  step,
} from "grimoire-kolmafia";

enum Leg {
  Aftercore = 0,
  GreyYou = 1,
  Casual = 2,
}

function getCurrentLeg(): number {
  if (myDaycount() > 1) return Leg.Aftercore;
  if (myPath() === "Grey You" || get("gooseReprocessed") !== "") return Leg.GreyYou;
  return Leg.Casual;
}

function canEat(): boolean {
  return (
    myFullness() < fullnessLimit() ||
    mySpleenUse() < spleenLimit() ||
    myInebriety() < inebrietyLimit() ||
    get("currentMojoFilters") < 3
  );
}

type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type WithRequired<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Required<T, K>;
type Task = WithRequired<BaseTask, "limit">;

function garboAscend(after: string[]): Task[] {
  return [
    {
      name: "Garbo",
      after: after,
      completed: () => (myAdventures() === 0 && !canEat()) || myInebriety() > inebrietyLimit(),
      do: () => cliExecute("garbo ascend"),
      limit: { tries: 1 },
    },
    {
      name: "Stooper",
      after: [...after, "Garbo"],
      do: () => cliExecute(`drink Sacramento wine`),
      completed: () =>
        myInebriety() > inebrietyLimit() ||
        (myInebriety() === inebrietyLimit() && myFamiliar() === $familiar`Stooper`),
      outfit: { equip: $items`mafia pinky ring`, familiar: $familiar`Stooper` },
      effects: $effects`Ode to Booze`,
      limit: { tries: 1 },
    },
    {
      name: "Caldera",
      after: [...after, "Stooper"],
      acquire: [{ item: $item`heat-resistant sheet metal`, price: 5000 }],
      do: () => $location`The Bubblin' Caldera`,
      completed: () => $location`The Bubblin' Caldera`.turnsSpent >= 5,
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      limit: { tries: 6 }, // Clear intro adventure
    },
    {
      name: "Overdrink",
      after: [...after, "Stooper"],
      do: () => drink($item`Schrödinger's thermos`),
      completed: () => myInebriety() > inebrietyLimit(),
      effects: $effects`Ode to Booze`,
      limit: { tries: 1 },
    },
    {
      name: "Overdrunk",
      after: [...after, "Overdrink"],
      completed: () => myAdventures() === 0 && myInebriety() > inebrietyLimit(),
      do: () => cliExecute("garbo"),
      limit: { tries: 1 },
    },
  ];
}

const AftercoreQuest: Quest<Task> = {
  name: "Aftercore",
  completed: () => getCurrentLeg() > Leg.Aftercore,
  tasks: [...garboAscend([])],
};

const GyouQuest: Quest<Task> = {
  name: "Grey You",
  completed: () => getCurrentLeg() > Leg.GreyYou,
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.GreyYou,
      after: ["Aftercore/Overdrunk"],
      do: () => {
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
          $item`astral mask`
        );
        if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
          runChoice(-1);
      },
      limit: { tries: 1 },
    },
    {
      name: "Run",
      after: ["Ascend"],
      completed: () => step("questL13Final") !== -1,
      do: () => cliExecute("loopgyou delaytower pulls=19"),
      limit: { tries: 1 },
    },
    {
      name: "Hotres",
      after: ["Ascend", "Run"],
      acquire: [
        { item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) },
      ],
      completed: () => have($item`heat-resistant gloves`) && have($item`lava-proof pants`),
      do: $location`LavaCo™ Lamp Factory`,
      combat: new CombatStrategy()
        .macro(
          () =>
            new Macro().externalIf(
              !have($effect`Everything Looks Yellow`),
              new Macro().item($item`yellow rocket`),
              // eslint-disable-next-line libram/verify-constants
              new Macro().skill($skill`Double Nanovision`).repeat()
            ),
          [$monster`factory worker (male)`, $monster`factory worker (female)`]
        )
        // eslint-disable-next-line libram/verify-constants
        .macro(new Macro().skill($skill`Infinite Loop`).repeat()),
      outfit: () => {
        if (!have($effect`Everything Looks Yellow`)) return {};
        else return { modifier: "item" };
      },
      limit: { soft: 10 },
    },
    {
      name: "Drill",
      after: ["Ascend", "Run"],
      completed: () => have($item`high-temperature mining drill`),
      do: () => cliExecute("pull high-temperature mining drill"),
      limit: { tries: 1 },
    },
    {
      name: "Volcano Initial",
      after: ["Ascend", "Hotres", "Drill"],
      completed: () => myTurncount() >= 1000,
      do: () => cliExecute(`minevolcano ${1000 - myTurncount()}`),
      limit: { tries: 1 },
    },
    {
      name: "Tower",
      after: ["Ascend", "Volcano Initial"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopgyou delaytower"),
      limit: { tries: 1 },
    },
    {
      name: "Volcano Final",
      after: ["Ascend", "Hotres", "Drill", "Tower"],
      completed: () => myAdventures() <= 40,
      do: () => cliExecute(`minevolcano ${1000 - myTurncount()}`),
      limit: { tries: 1 },
    },
    {
      name: "Prism",
      after: ["Ascend", "Volcano Final"],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myClass() !== $class`Grey Goo`,
      do: () => cliExecute("loopgyou class=1"),
      limit: { tries: 1 },
    },
    {
      name: "Level",
      after: ["Ascend", "Prism"],
      completed: () => myLevel() >= 13,
      do: () => cliExecute("loopcasual goal=level"),
      limit: { tries: 1 },
    },
    ...garboAscend(["Ascend", "Prism", "Level"]),
  ],
};

const CasualQuest: Quest<Task> = {
  name: "Casual",
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.Casual,
      after: ["Grey You/Overdrunk"],
      do: () => {
        prepareAscension({
          workshed: "Asdon Martin keyfob",
          garden: "packet of thanksgarden seeds",
          eudora: "GameInformPowerDailyPro subscription card",
          chateau: {
            desk: "continental juice bar",
            nightstand: "electric muscle stimulator",
            ceiling: "ceiling fan",
          },
        });

        ascend(
          Paths.Unrestricted,
          $class`Seal Clubber`,
          Lifestyle.casual,
          "knoll",
          $item`astral six-pack`,
          $item`astral pet sweater`
        );
      },
      limit: { tries: 1 },
    },
    {
      name: "Garbo",
      after: ["Ascend"],
      completed: () => (myAdventures() === 0 && !canEat()) || myInebriety() > inebrietyLimit(),
      do: () => cliExecute("garbo ascend"),
      limit: { tries: 1 },
    },
    {
      name: "Nightcap",
      after: ["Ascend", "Garbo"],
      completed: () => myInebriety() > inebrietyLimit(),
      do: () => cliExecute("CONSUME NIGHTCAP"),
      limit: { tries: 1 },
    },
    {
      name: "Sleep",
      completed: () => haveInCampground($item`clockwork maid`),
      after: ["Ascend", "Nightcap"],
      do: () => {
        if (!haveInCampground($item`clockwork maid`)) {
          if (!have($item`clockwork maid`)) buy(1, $item`clockwork maid`, 48000);
          use($item`clockwork maid`);
        }
      },
      outfit: { modifier: "adv", familiar: $familiar`Trick-or-Treating Tot` },
      limit: { tries: 1 },
    },
  ],
};

export const args = Args.create("loop", "A script for a full loop.", {
  actions: Args.number({
    help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
  }),
});
export function main(command?: string): void {
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  const tasks = getTasks([AftercoreQuest, GyouQuest, CasualQuest]);
  const engine = new Engine<never, Task>(tasks);

  let actions = args.actions ?? Infinity;
  while (actions > 0) {
    const task = engine.tasks.find((t) => engine.available(t));
    if (!task) break;
    engine.execute(task);
    actions--;
  }

  const task = engine.tasks.find((t) => engine.available(t));
  if (args.actions !== undefined && task) {
    print(`Next: ${task.name}`, "blue");
  } else if (!task) {
    const uncompletedTasks = engine.tasks.filter((t) => !t.completed()).map((t) => t.name);
    if (uncompletedTasks.length > 0) {
      print("Uncompleted Tasks:");
      for (const name of uncompletedTasks) {
        print(name);
      }
    }
  }
}
