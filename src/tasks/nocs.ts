import { pvp } from "./aftercore";
import { cleanup } from "./communityservice";
import { Quest } from "./structure";

export const NoCSQuest: Quest = {
  name: "No CS Cleanup",
  tasks: cleanup(["Aftercore/Overdrunk", "Aftercore/Fights"]),
};

export const CleanupQuest: Quest = {
  name: "Cleanup",
  tasks: [...pvp("Cleanup", []), ...cleanup(["Fights"])],
};
