import { step } from "grimoire-kolmafia";
import {
  buy,
  cliExecute,
  Coinmaster,
  getWorkshed,
  haveEffect,
  hippyStoneBroken,
  isAccessible,
  Item,
  itemAmount,
  sellPrice,
  sellsItem,
  toInt,
  use,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $path,
  ascend,
  ChateauMantegna,
  get,
  have,
  haveInCampground,
  KolGender,
  Lifestyle,
  prepareAscension,
} from "libram";
import { drive } from "libram/dist/resources/2017/AsdonMartin";
import { getCurrentLeg, Leg, Quest, Task } from "./structure";
import { breakfast, garbo, pvp } from "./aftercore";
import { addPtrackBreakpoint } from "../engine/profits";

export function cleanup(after: string[], afterCS: boolean): Task[] {
  const oneDayTickets = $items`one-day ticket to The Glaciest, one-day ticket to Dinseylandfill, one-day ticket to That 70s Volcano, Merc Core deployment orders, one-day ticket to Spring Break Beach`;
  const ticketSeller = (ticket: Item) =>
    Coinmaster.all().find((coinmaster) => sellsItem(coinmaster, ticket));
  const ticketsToBuy = (ticket: Item) => {
    const seller = ticketSeller(ticket);
    if (seller && isAccessible(seller)) {
      return Math.floor(itemAmount(seller.item) / sellPrice(seller, ticket));
    }
    return 0;
  };

  const barrels = $items`little firkin, normal barrel, big tun, weathered barrel, dusty barrel, disintegrating barrel, moist barrel, rotting barrel, mouldering barrel, barnacled barrel`;
  const barrelCount = () =>
    barrels.map((barrel) => itemAmount(barrel)).reduce((total, current) => total + current, 0);

  return [
    addPtrackBreakpoint("Pre-Cleanup", after),
    {
      name: "Buy One-Day Tickets",
      completed: () => oneDayTickets.filter((ticket) => ticketsToBuy(ticket) > 0).length === 0,
      after: [...after, "Breakpoint Pre-Cleanup"],
      do: () =>
        oneDayTickets
          .filter((ticket) => ticketsToBuy(ticket) > 0)
          .forEach((ticket) => {
            const seller = ticketSeller(ticket);
            if (seller) {
              buy(seller, ticketsToBuy(ticket), ticket);
            }
          }),
      limit: { tries: 1 },
    },
    {
      name: "Smash Barrels",
      completed: () => barrelCount() === 0,
      after: [...after, "Breakpoint Pre-Cleanup"],
      do: (): void => {
        if (barrelCount() > 1) {
          const firstBarrel = barrels.find((barrel) => itemAmount(barrel) > 0);
          if (firstBarrel) {
            visitUrl(`inv_use.php?pwd&whichitem=${toInt(firstBarrel)}&choice=1`);
            while (barrelCount() > 1) {
              visitUrl("choice.php?pwd&whichchoice=1101&option=2");
            }
          }
        }
        if (barrelCount() === 1) {
          const remainingBarrel = barrels.find((barrel) => itemAmount(barrel) > 0);
          if (remainingBarrel) {
            use(1, remainingBarrel);
          }
        }
      },
      limit: { tries: 1 },
    },
    addPtrackBreakpoint("Post-Cleanup", [
      ...after,
      "Breakpoint Pre-Cleanup",
      "Buy One-Day Tickets",
      "Smash Barrels",
    ]),
    ...(afterCS
      ? [
          {
            name: "Chateau Sleep",
            after: ["Ascend", "Overdrink", "Fights"],
            completed: () =>
              !ChateauMantegna.have() || ChateauMantegna.getCeiling() === "artificial skylight",
            do: () => ChateauMantegna.changeCeiling("artificial skylight"),
            limit: { tries: 1 },
          },
          {
            name: "Sleep",
            completed: () => haveInCampground($item`clockwork maid`),
            after: ["Ascend", "Overdrink", "Fights"],
            do: (): void => {
              if (!haveInCampground($item`clockwork maid`)) {
                if (!have($item`clockwork maid`)) buy(1, $item`clockwork maid`, 48000);
                use($item`clockwork maid`);
              }
            },
            outfit: { modifier: "adv,0.7fites", familiar: $familiar`Left-Hand Man` },
            limit: { tries: 1 },
          },
        ]
      : []),
  ];
}

export const CasualQuest: Quest = {
  name: "Casual",
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.Casual,
      after: ["Community Service/Overdrunk", "Community Service/Fights"],
      do: (): void => {
        prepareAscension({
          garden: "packet of thanksgarden seeds",
          eudora: "GameInformPowerDailyPro subscription card",
          chateau: {
            desk: "continental juice bar",
            nightstand: "electric muscle stimulator",
            ceiling: "ceiling fan",
          },
        });

        ascend({
          path: $path`Unrestricted`,
          playerClass: $class`Seal Clubber`,
          lifestyle: Lifestyle.casual,
          kolGender: KolGender.male,
          moon: "knoll",
          consumable: $item`astral six-pack`,
          pet: $item`astral pet sweater`,
        });
      },
      limit: { tries: 1 },
    },
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
      name: "Guild Leader",
      after: ["Ascend"],
      completed: () => get("questG09Muscle") !== "unstarted",
      do: () => visitUrl("guild.php?place=challenge"),
      limit: { tries: 1 },
    },
    {
      name: "Meat Golem",
      after: ["Ascend"],
      completed: () => haveInCampground($item`meat golem`),
      do: () => use(1, $item`meat golem`),
      limit: { tries: 1 },
    },
    {
      name: "Run",
      after: ["Ascend", "Break Stone", "Guild Leader", "Meat Golem"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopcasual fluffers=false stomach=10 liver=15"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Workshed",
      after: ["Ascend", "Run"],
      completed: () => getWorkshed() !== $item`Asdon Martin keyfob` || get("_workshedItemUsed"),
      do: (): void => {
        if (haveEffect($effect`Driving Observantly`) < 900)
          drive($effect`Driving Observantly`, 900 - haveEffect($effect`Driving Observantly`));
        use($item`cold medicine cabinet`);
      },
      limit: { tries: 1 },
    },
    ...breakfast("Casual", ["Ascend", "Run"]),
    ...garbo("Casual", ["Ascend", "Run", "Workshed", "Breakfast"], false),
    ...pvp("Casual", ["Ascend", "Overdrink"], false),
    ...cleanup(["Ascend", "Overdrink"], true),
  ],
};
