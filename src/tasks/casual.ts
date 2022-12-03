import { step } from "grimoire-kolmafia";
import {
  buy,
  cliExecute,
  Coinmaster,
  getWorkshed,
  haveEffect,
  hippyStoneBroken,
  inebrietyLimit,
  isAccessible,
  Item,
  itemAmount,
  myAdventures,
  myFamiliar,
  myInebriety,
  sellPrice,
  sellsItem,
  toInt,
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
  ascend,
  ChateauMantegna,
  get,
  have,
  haveInCampground,
  Lifestyle,
  Paths,
  prepareAscension,
} from "libram";
import { drive } from "libram/dist/resources/2017/AsdonMartin";
import { getCurrentLeg, Leg, Quest, Task } from "./structure";
import { breakfast, canEat, duplicate, garbo, pvp, stooperDrunk } from "./aftercore";
import { isHalloween, voaSober } from "../constants";

function cleanup(after: string[]): Task[] {
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

  const powersAndNuggies = $items`twinkly powder, hot powder, cold powder, spooky powder, stench powder, sleaze powder, twinkly nuggets, hot nuggets, cold nuggets, spooky nuggets, stench nuggets, sleaze nuggets`;

  return [
    {
      name: "Buy One-Day Tickets",
      completed: () => oneDayTickets.filter((ticket) => ticketsToBuy(ticket) > 0).length === 0,
      after: after,
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
      after: after,
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
    {
      name: "Wad Up",
      completed: () => powersAndNuggies.filter((it) => itemAmount(it) >= 5).length === 0,
      after: after,
      prepare: () => {
        // Finish unlocking guild
        visitUrl("guild.php?place=challenge");
        visitUrl("guild.php?place=malus");
      },
      do: () =>
        powersAndNuggies.forEach((it) => {
          // Can't use .filter because this might change as a result of prior smashing
          if (itemAmount(it) >= 5) {
            visitUrl(
              `guild.php?action=malussmash&pwd&whichitem=${toInt(it)}&quantity=1&smashall=1`
            );
          }
        }),
      limit: { tries: 1 },
    },
  ];
}

export const CasualQuest: Quest = {
  name: "Casual",
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.Casual,
      after: ["Grey You/Overdrunk", "Grey You/Fights"],
      do: (): void => {
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
      do: () => cliExecute("loopcasual fluffers=false stomach=10"),
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
    ...breakfast(["Ascend", "Run"]),
    ...garbo(
      ["Ascend", "Run", "Workshed", "Breakfast"],
      false,
      isHalloween ? "garboween" : "garbo yachtzeechain",
      isHalloween ? "garboween" : undefined
    ),
    ...pvp(["Overdrink"], false),
    ...cleanup(["Overdrink"]),
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
  ],
};
