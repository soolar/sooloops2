import { cliExecute, hippyStoneBroken, myStorageMeat, storageAmount, visitUrl } from "kolmafia";
import { $item, get } from "libram";
import { getCurrentLeg, Leg, Quest } from "./structure";
import { breakfast, garbo, pvp } from "./aftercore";
import { cleanup } from "./casual";
import { addPtrackBreakpoint } from "../engine/profits";
import { isHalloween } from "../constants";

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
    ...breakfast("CS", ["Ascend", "Run", "Pull All"]),
    ...garbo("CS", ["Ascend", "Run", "Pull All", "Breakfast"], false),
    ...pvp(
      "CS",
      ["Ascend", "Run", "Pull All", "Breakfast", isHalloween ? "Freecandy" : "Garbo", "Overdrink"],
      false
    ),
    ...cleanup(["Ascend", "Overdrink", "Fights"]),
  ],
};
