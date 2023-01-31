import { Quest as BaseQuest, Task as BaseTask, Limit } from "grimoire-kolmafia";
import { myDaycount, myPath } from "kolmafia";
import { get } from "libram";

export type Task = BaseTask & {
  tracking?: string;
  limit: Limit;
};
export type Quest = BaseQuest<Task>;

export enum Leg {
  Aftercore = 0,
  CommunityService = 1,
  Casual = 2,
}

export function getCurrentLeg(): number {
  if (myDaycount() > 1)
		return Leg.Aftercore;
  if (myPath() === "Community Service" || get("csServicesPerformed") !== "")
    return Leg.CommunityService;
  return Leg.Casual;
}
