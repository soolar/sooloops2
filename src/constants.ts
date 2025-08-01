import { holiday } from "kolmafia";
import { $item, get } from "libram";

export const acceptablePvpStances = [
  "Freshest Taste",
  "Ready to Melt",
  "Thirrrsty forrr Booze",
  "Lightest Load",
  "Fashion Show",
  "Freshman Rule!",
  "All Bundled Up",
  "Safari Chic",
  "Optimal Dresser",
  "Motivated by Irony",
];

export const isHalloween = holiday().includes("Halloween");

export const voaHalloween = 16169;
export const voaGarbo = get("valueOfAdventure");
export const voaSober = isHalloween ? voaHalloween : voaGarbo;
export const voaDrunk = isHalloween ? voaHalloween : Math.round(voaSober * 0.7);

export const melfDupeItem = $item`Daily Affirmation: Always be Collecting`;

export const doTTT = false;
