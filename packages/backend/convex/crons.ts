import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "snapshotUsers",
  {
    hourUTC: 0,
    minuteUTC: 0,
  },
  internal.users.snapshotAllUsersInternal,
);

crons.interval(
  "cleanupAbandonedBattles",
  { minutes: 5 },
  internal.battle.cleanupAbandonedBattlesInternal,
);

export default crons;
