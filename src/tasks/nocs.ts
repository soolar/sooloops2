import { breakfast, breakStone, garbo, pvp, stooperDrunk } from "./aftercore";
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

export const AftercoreQuestNoAscend: Quest = {
  name: "Aftercore No Ascend",
  tasks: [
    breakStone,
    ...breakfast("Aftercore-No-Ascend", []),
    ...garbo("Aftercore-No-Ascend", ["Breakfast"], false),
    ...pvp("Aftercore-No-Ascend", ["Black Heart"], false),
    ...cleanup(["Fights"]),
  ],
};
