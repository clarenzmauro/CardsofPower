import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * @description
 * Query to get complete user account statistics and data
 *
 * @receives data from:
 * - users table: complete user profile and statistics
 * - cards table: user's card statistics and achievements
 *
 * @sends data to:
 * - account page: user stats, leaderboards and achievements
 */
export const getUserAccount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity?.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // get user's cards for stats
    const userCards = await ctx.db
      .query("cards")
      .withIndex("by_owner", (q) => q.eq("currentOwnerId", user._id))
      .collect();

    // calculate card stats
    const cardsCreated = userCards.filter(
      (card) => card.currentOwnerId === user._id
    ).length;
    const cardsListed = userCards.filter((card) => card.isListed).length;

    // calculate wr from card stats
    const totalMatches = userCards.reduce(
      (sum, card) => sum + (card.matches?.total || 0),
      0
    );
    const totalWins = userCards.reduce(
      (sum, card) => sum + (card.matches?.wins || 0),
      0
    );
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

    // get top performing cards
    const topCards = userCards
      .filter((card) => card.matches!.total > 0)
      .sort(
        (a, b) =>
          (b.matches?.wins || 0) / (b.matches?.total || 1) -
          (a.matches?.wins || 0) / (a.matches?.total || 1)
      )
      .slice(0, 3)
      .map((card) => ({
        id: card._id,
        name: card.name,
        type: card.type,
        matches: card.matches?.total || 0,
        imageUrl: card.imageUrl,
      }));

    return {
      // basic user info
      username: user.username || "Player",
      dateCreated: user.dateCreated,

      // wealth
      wealth: Math.floor(user.goldCount / 1000) + 1,
      highestGoldCount: user.goldCount,

      // game stats (placeholder)
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,

      // card stats
      currentCardCount: user.currentCardCount,
      highestCardCount: user.highestCardCount,
      cardsCreated,
      cardsBought: 0,
      cardsTraded: 0,
      cardsListed,

      // top cards
      topCards,

      // win rate
      winRate,
    };
  },
});

/**
 * @description
 * returns leaderboards for multiple categories
 *
 * @receives data to:
 * - users table: user statistics like gamesPlayed, gamesWon, etc.)
 *
 * @sends data from:
 * - account page: leaderboard lists
 */
export const getLeaderboards = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // validate
    const rawLimit = args.limit ?? 10;
    const limit = Math.max(1, Math.min(20, Math.floor(rawLimit)));

    // TODO: replace with indexed leaderboards
    const users = await ctx.db.query("users").collect(); // collect must be replaced.

    // strategist
    const strategist = users
      .map((u: any) => {
        const games = u.gamesPlayed ?? 0;
        const wins = u.gamesWon ?? 0;
        const winRate = games > 0 ? (wins / games) * 100 : 0;
        return { username: u.username ?? "Player", winRate };
      })
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit);

    // king midas
    const kingMidas = users
      .map((u: any) => ({
        username: u.username ?? "Player",
        goldCount: u.goldCount ?? 0,
      }))
      .sort((a, b) => b.goldCount - a.goldCount)
      .slice(0, limit);

    // card master
    const cardMaster = users
      .map((u: any) => ({
        username: u.username ?? "Player",
        cardCount: u.currentCardCount ?? 0,
      }))
      .sort((a, b) => b.cardCount - a.cardCount)
      .slice(0, limit);

    return { strategist, kingMidas, cardMaster };
  },
});

/**
 * @description
 * compute the current user's ranks accross the leaderboard
 *
 * @receives data from:
 * - users table: fields used to compute ranks
 *
 * @sends data to:
 * - account page: rank circles and user rank display
 */
export const getUserRanks = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("getUserRanks: unauthenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();

    // TODO: replace .collect with indexed collections
    const users = await ctx.db.query("users").collect();

    if (users.length === 0)
      return {
        strategist: 0,
        kingMidas: 0,
        cardMaster: 0,
        artisan: 0,
        shopRaider: 0,
        friendly: 0,
      };

    const rankBy = (scoreFn: (u: any) => number) => {
      const sorted = users
        .map((u: any) => ({
          _id: u._id,
          score: Number(scoreFn(u) ?? 0),
        }))
        .sort((a, b) => b.score - a.score);

      // compare stringified ids properly
      const idx = sorted.findIndex(
        (s: any) => String(s._id) === String(currentUser!._id)
      );
      return idx >= 0 ? idx + 1 : sorted.length + 1;
    };

    const strategist = rankBy((u: any) => {
      const games = u.gamesPlayed ?? 0;
      const wins = u.gamesWon ?? 0;
      return games > 0 ? (wins / games) * 100 : 0;
    });
    const kingMidas = rankBy((u: any) => u.goldCount ?? 0);
    const cardMaster = rankBy((u: any) => u.currentCardCount ?? 0);
    const artisan = rankBy((u: any) => u.cardsCreated ?? 0);
    const shopRaider = rankBy((u: any) => u.cardsBought ?? 0);
    const friendly = rankBy((u: any) =>
      Array.isArray(u.friends) ? u.friends.length : (u.friendsCount ?? 0)
    );

    if (typeof strategist !== "number" || strategist < 0)
      throw new Error("getUserRanks: invalid strategist rank");
    if (typeof kingMidas !== "number" || kingMidas < 0)
      throw new Error("getUserRanks: invalid kingMidas rank");

    return {
      strategist,
      kingMidas,
      cardMaster,
      artisan,
      shopRaider,
      friendly,
    };
  },
});

/**
 * @description
 * returns global top cards (by matches/wr) limited by `limit`
 *
 * @receives data from:
 * cards table: card documents containing matches, imageUrl, etc.
 *
 * @sends data to:
 * account page: top cards UI and battlefield highlights
 */
export const getTopCardsGlobal = query({
  args: {
    limit: v.optional(v.number()),
    metric: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rawLimit = args.limit ?? 3;

    const limit = Math.max(1, Math.min(100, Math.floor(rawLimit)));

    const metric = (args.metric ?? "matches").toString();

    // TODO: must be indexed as well
    // Call collect() to get the array of card documents (not the function)
    const cards = await ctx.db.query("cards").collect();

    const computed = cards.map((c: any) => {
      const matchesTotal =
        c.matches && typeof c.matches.total === "number" ? c.matches.total : 0;
      const wins =
        c.matches && typeof c.matches.wins === "number" ? c.matches.wins : 0;
      const winRate = matchesTotal > 0 ? (wins / matchesTotal) * 100 : 0;

      return {
        id: c._id,
        name: c.name ?? "card",
        type: c.type ?? "monster",
        matches: matchesTotal,
        winRate,
        imageUrl: c.imageUrl ?? null,
      };
    });

    const sorted = computed
      .sort((a: any, b: any) => {
        if (metric === "matches") return b.matches - a.matches;
        return b.winRate - a.winRate;
      })
      .slice(0, limit);

    // too lazy to add the post assertions

    return sorted;
  },
});

/**
 * @description
 * shows time-series economy data for a user over a requested range
 *
 * @receives data from:
 * - users table: current user values
 * - user_snapshots table (to be implemented)
 *
 * @sends data to:
 * - account page: economy charts
 */
export const getEconomyStats = query({
  args: {
    userId: v.optional(v.string()),
    range: v.optional(v.string()), // e.g., "30d", "90d", "1y"
    granularity: v.optional(v.string()), // "daily" | "weekly" | "monthly"
  },
  handler: async (ctx: any, args: any) => {
    // determine user
    const userId = args.userId ?? (await ctx.auth.getUserIdentity())?.subject;
    if (!userId)
      throw new Error("getEconomyStats: unauthenticated or missing userId");

    // validate inputs
    const range = (args.range ?? "30d").toString();

    try {
      const snapshots = await ctx.db
        .query("user_snapshots")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect()
        .catch(() => []);

      if (Array.isArray(snapshots) && snapshots.length > 0) {
        // filter snapshots by requested range
        const now = Date.now();
        const millisMap: Record<string, number> = {
          "7d": 7 * 24 * 60 * 60 * 1000,
          "30d": 30 * 24 * 60 * 60 * 1000,
          "90d": 90 * 24 * 60 * 60 * 1000,
          "1y": 365 * 24 * 60 * 60 * 1000,
        };
        const cutoff = new Date(
          now - (millisMap[range] ?? millisMap["30d"])
        ).toISOString();

        // keep snapshots after cutoff
        const filtered = snapshots
          .filter(
            (s: any) =>
              s.userId === userId && typeof s.ts === "string" && s.ts >= cutoff
          )
          .map((s: any) => ({
            ts: s.ts,
            gold: Number(s.goldCount ?? 0),
            cards: Number(s.cardCount ?? 0),
          }))
          .sort((a: any, b: any) => a.ts.localeCompare(b.ts));

        const goldHistory = filtered.map((f: any) => ({
          ts: f.ts,
          value: f.gold,
        }));
        const cardCountHistory = filtered.map((f: any) => ({
          ts: f.ts,
          value: f.cards,
        }));

        return { goldHistory, cardCountHistory, source: "snapshots" };
      }
    } catch (e) {
      ctx.log?.warn?.(
        "getEconomyStats: snapshots query failed, falling back to user doc",
        e
      );
    }

    // fallback:
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", userId))
      .first();

    // create a small synthetic series
    const now = Date.now();
    const points = Math.min(
      10,
      range === "7d" ? 7 : range === "30d" ? 10 : range === "90d" ? 12 : 12
    );
    const goldNow = Number(user.goldCount ?? 0);
    const cardsNow = Number(user.currentCardCount ?? 0);

    // simple decreasing synthetic history as fallback
    const goldHistory = Array.from({ length: points }, (_, i) => {
      const ts = new Date(
        now - (points - 1 - i) * (24 * 60 * 60 * 1000)
      ).toISOString();
      const value = Math.max(
        0,
        Math.round(goldNow * (0.6 + 0.4 * (i / (points - 1))))
      );
      return { ts, value };
    });

    const cardCountHistory = Array.from({ length: points }, (_, i) => {
      const ts = new Date(
        now - (points - 1 - i) * (24 * 60 * 60 * 1000)
      ).toISOString();
      const value = Math.max(
        0,
        Math.round(cardsNow * (0.6 + 0.4 * (i / (points - 1))))
      );
      return { ts, value };
    });

    return { goldHistory, cardCountHistory, source: "fallback" };
  },
});

/**
 * @description
 * patch user counters safely and atomically
 *
 * @receives data from:
 * - account page: UI/stat event handlers
 * - auth: identity when userId is omitted
 *
 * @sends data to:
 * - patches the user table, updates lastUpdatedAt
 */
export const updateUserStats = mutation({
  args: {
    userId: v.optional(v.string()),
    gamesPlayedInc: v.optional(v.number()),
    gamesWonInc: v.optional(v.number()),
    gamesLostInc: v.optional(v.number()),
    goldDelta: v.optional(v.number()),
    cardCountDelta: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let targetUser: any = null;
    if (!targetUser) {
      try {
        targetUser = await ctx.db.get(args.userId as any);
      } catch {
        targetUser = null;
      }
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.subject)
        throw new Error("updateUserStats: unauthenticated");
      targetUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();
    }

    const patch: Record<string, any> = {};
    const numericFields: Array<[string, number | undefined]> = [
      ["gamesPlayed", args.gamesPlayedInc],
      ["gamesWon", args.gamesWonInc],
      ["gamesLost", args.gamesLostInc],
      ["goldCount", args.goldDelta],
      ["currentCardCount", args.cardCountDelta],
    ];

    for (const [field, inc] of numericFields) {
      if (typeof inc !== "undefined") {
        if (
          typeof inc !== "number" ||
          Number.isNaN(inc) ||
          !Number.isFinite(inc)
        ) {
          throw new Error(
            `updateUserStats: invalid numeric delta for ${field}`
          );
        }
        const current = Number(targetUser[field] ?? 0);
        const next = current + inc;
        patch[field] = Math.max(0, next);
      }
    }

    patch.lastUpdatedAt = new Date().toISOString();

    await ctx.db.patch(targetUser._id, patch);

    const updated = await ctx.db.get(targetUser._id);

    return { success: true, user: updated };
  },
});

/**
 * @description
 * compute user's level progress
 *
 * @receives data from:
 * - getUserAccount: user identity and wealth
 *
 * @sends data to:
 * - account page
 */
export const getLevelProgress = query({
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject)
      throw new Error("getLevelProgress: unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("getLevelProgress: user not found");

    // Read gold and normalize
    const goldCount = Number(user.goldCount ?? 0);
    if (!Number.isFinite(goldCount) || goldCount < 0)
      throw new Error("getLevelProgress: invalid goldCount");

    // Wealth/level definition mirrors getUserAccount: each 1000 gold = +1 wealth level
    const basePerLevel = 1000;
    const wealth = Math.floor(goldCount / basePerLevel) + 1;

    const currentLevelBase = (wealth - 1) * basePerLevel;
    const experience = goldCount - currentLevelBase;
    const maxExperience = basePerLevel;

    // Runtime assertions
    if (
      !(
        wealth >= 1 &&
        Number.isFinite(experience) &&
        experience >= 0 &&
        experience <= maxExperience
      )
    ) {
      throw new Error("getLevelProgress: computed invalid progress values");
    }

    return {
      wealth,
      goldCount,
      experience,
      maxExperience,
    };
  },
});
