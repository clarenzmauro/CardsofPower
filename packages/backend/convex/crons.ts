import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "snapshotUsers",
  {
    hourUTC: 0, // midnight UTC
    minuteUTC: 0,
  },
  internal.users.snapshotAllUsersInternal,
);

export default crons;
