import { visitUrl } from "kolmafia";
import { $item, get } from "libram";

export const acceptablePvpStances = [
  "Freshest Taste",
  "Ready to Melt",
  "Thirrrsty forrr Booze",
  "Lightest Load",
];

export const isHalloween = visitUrl("place.php?whichplace=town&action=town_trickortreat").includes(
  "Trick-or-Treating"
);

export const voaHalloween = 21169;
export const voaGarbo = get("valueOfAdventure");
export const voaSober = isHalloween ? voaHalloween : voaGarbo;
export const voaDrunk = isHalloween ? voaHalloween : Math.round(voaSober * 0.7);

export const melfDupeItem = $item`Daily Affirmation: Always be Collecting`;
