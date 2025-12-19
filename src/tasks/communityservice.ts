import {
  abort,
  buy,
  cliExecute,
  Coinmaster,
  hippyStoneBroken,
  isAccessible,
  Item,
  itemAmount,
  myStorageMeat,
  sellPrice,
  sellsItem,
  storageAmount,
  toInt,
  use,
  visitUrl,
} from "kolmafia";
import { $familiar, $item, $items, ChateauMantegna, get, have, haveInCampground } from "libram";
import { getCurrentLeg, Leg, Quest, Task } from "./structure";
import { breakfast, garbo, pvp } from "./aftercore";
import { addPtrackBreakpoint } from "../engine/profits";
import { doTTT, isHalloween } from "../constants";

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

export const CSQuest: Quest = {
  name: "Community Service",
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.CommunityService,
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      do: () => cliExecute("phccs_gash softcore"),
      limit: { tries: 1 },
    },
    {
      name: "Break Stone",
      completed: () => hippyStoneBroken(),
      after: ["Ascend"],
      do: (): void => {
        const smashText = visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true);
        if (smashText.indexOf("Pledge allegiance to") >= 0) {
          visitUrl("peevpee.php?action=pledge&place=fight&pwd");
        }
      },
      limit: { tries: 1 },
    },
    addPtrackBreakpoint("Pre-CS-Run", ["Ascend", "Break Stone"]),
    {
      name: "Run",
      after: ["Ascend", "Break Stone", "Breakpoint Pre-CS-Run"],
      completed: () => get("csServicesPerformed").split(",").length >= 11,
      do: () => cliExecute("phccs"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    addPtrackBreakpoint("Post-CS-Run", ["Ascend", "Run"]),
    {
      name: "Pull All",
      after: ["Ascend", "Run", "Breakpoint Post-CS-Run"],
      completed: () => myStorageMeat() === 0 && storageAmount($item`Law of Averages`) === 0, // arbitrary item
      do: (): void => {
        cliExecute("pull all");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Unlock Guild",
      after: ["Ascend", "Run", "Breakpoint Post-CS-Run", "Pull All"],
      completed: () => false,
      do: (): void => {
        abort();
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
    ...breakfast("CS", ["Ascend", "Run", "Pull All", "Unlock Guild"]),
    ...garbo("CS", ["Ascend", "Run", "Pull All", "Unlock Guild", "Breakfast"], false),
    ...pvp(
      "CS",
      [
        "Ascend",
        "Run",
        "Pull All",
        "Breakfast",
        isHalloween ? "Freecandy" : doTTT ? "Chrono" : "Garbo",
        "Overdrink",
      ],
      false
    ),
    ...cleanup(["Ascend", "Overdrink", "Fights"], true),
  ],
};
