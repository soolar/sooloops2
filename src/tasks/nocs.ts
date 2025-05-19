import { cleanup } from "./casual";
import { Quest } from "./structure";

export const NoCSQuest: Quest = {
  name: "No CS Cleanup",
  tasks: cleanup(["Aftercore/Overdrunk", "Aftercore/Fights"], false),
};
