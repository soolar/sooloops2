import { step } from "grimoire-kolmafia";
import { cliExecute, hippyStoneBroken, myStorageMeat, storageAmount, visitUrl } from "kolmafia";
import { $item, get } from "libram";
import { getCurrentLeg, Leg, Quest } from "./structure";
import { breakfast, garbo, pvp } from "./aftercore";
import { isHalloween } from "../constants";
import { cleanup } from "./casual";

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
    {
      name: "Run",
      after: ["Ascend", "Break Stone"],
      completed: () => get("csServicesPerformed").split(",").length >= 11,
      do: () => cliExecute("phccs"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Pull All",
      after: ["Ascend", "Run"],
      completed: () => myStorageMeat() === 0 && storageAmount($item`Law of Averages`) === 0, // arbitrary item
      do: (): void => {
        cliExecute("pull all");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
    ...breakfast(["Ascend", "Run", "Pull All"]),
    ...garbo(
      ["Ascend", "Run", "Pull All", "Breakfast"],
      false,
      isHalloween ? "garboween" : "garbo yachtzeechain",
      isHalloween ? "garboween" : undefined
    ),
    ...pvp(["Overdrink"], false),
    ...cleanup(["Ascend", "Overdrink", "Fights"]),
  ],
};
