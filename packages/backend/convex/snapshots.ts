import { internalMutation } from "./_generated/server";

export const snapshotAllUsersInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Fetch users (can paginate in future if needed)
    const users = await ctx.db.query("users").collect();

    const nowIso = new Date().toISOString();

    for (const user of users) {
      const clerkId = String(user.clerkId ?? "");
      if (!clerkId) continue;

      const gold = Number(user.goldCount ?? 0);
      const cards = Number(user.currentCardCount ?? 0);

      if (!Number.isFinite(gold) || gold < 0) continue;
      if (!Number.isFinite(cards) || cards < 0) continue;

      await ctx.db.insert("user_snapshots", {
        userId: clerkId,
        ts: nowIso,
        goldCount: gold,
        currentCardCount: cards,
      });
    }

    return { success: true, count: users.length, ts: nowIso };
  },
});
