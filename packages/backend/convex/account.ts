import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { type Doc, type Id } from "./_generated/dataModel";

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
    if (!identity?.subject) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    if (!user.serverId) throw new Error("User has no server");

    // Validate critical fields
    const goldCount = Number(user.goldCount ?? 0);
    const currentCardCount = Number(user.currentCardCount ?? 0);
    const gamesPlayed = Number(user.gamesPlayed ?? 0);
    const gamesWon = Number(user.gamesWon ?? 0);
    const gamesLost = Number(user.gamesLost ?? 0);

    if (!Number.isFinite(goldCount) || goldCount < 0) throw new Error("Invalid goldCount");
    if (!Number.isFinite(currentCardCount) || currentCardCount < 0) throw new Error("Invalid currentCardCount");
    if (!Number.isFinite(gamesPlayed) || gamesPlayed < 0) throw new Error("Invalid gamesPlayed");
    if (!Number.isFinite(gamesWon) || gamesWon < 0) throw new Error("Invalid gamesWon");
    if (!Number.isFinite(gamesLost) || gamesLost < 0) throw new Error("Invalid gamesLost");
    if (gamesWon + gamesLost > gamesPlayed) throw new Error("Invalid game stats");

    // Build top cards from server-scoped user_cards joined to card_templates
    // Limit to 3 for UI
    const userCards: Doc<"user_cards">[] = await ctx.db
      .query("user_cards")
      .withIndex("by_server_user", (q) => q.eq("serverId", user.serverId! as Id<"servers">).eq("userId", user._id as Id<"users">))
      .collect();

    const templates: Array<{ uc: Doc<"user_cards">; tmpl: Doc<"card_templates"> | null }> = await Promise.all(
      userCards.slice(0, 100).map(async (uc: Doc<"user_cards">) => {
        const tmpl = await ctx.db.get(uc.cardTemplateId as Id<"card_templates">);
        return { uc, tmpl };
      })
    );

    const scored = templates
      .filter((t) => t.tmpl !== null)
      .map(({ tmpl }) => {
        const templateDoc = tmpl as Doc<"card_templates">;
        const matches = Math.max(0, Number(templateDoc.matches?.total ?? 0));
        const wins = Math.max(0, Number(templateDoc.matches?.wins ?? 0));
        const winRate = matches > 0 ? (wins / matches) * 100 : 0;
        const typeString = String(templateDoc.type ?? "").toLowerCase();
        const normalizedType = ["monster", "spell", "trap"].includes(typeString)
          ? typeString
          : "monster";
        return {
          id: templateDoc._id,
          name: String(templateDoc.name ?? "Unnamed Card"),
          type: normalizedType,
          matches,
          winRate,
          imageUrl: templateDoc.imageUrl ?? null,
        };
      })
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 3);

    const topCards = scored;

    // Listed count migrated to listings table for server-scoped marketplace
    const myListings: Doc<"listings">[] = await ctx.db
      .query("listings")
      .withIndex("by_server_status", (q) => q.eq("serverId", user.serverId! as Id<"servers">).eq("status", "active"))
      .collect();
    const cardsListed = myListings.filter((l) => String(l.sellerId) === String(user._id)).length;

    const basePerLevel = 1000;
    const wealth = Math.floor(goldCount / basePerLevel) + 1;
    const currentLevelBase = (wealth - 1) * basePerLevel;
    const experience = goldCount - currentLevelBase;
    const maxExperience = basePerLevel;

    return {
      username: user.username || "Player",
      dateCreated: user.dateCreated ?? new Date().toISOString(),
      clerkId: user.clerkId ?? "",

      wealth,
      goldCount,
      highestGoldCount: Number(user.highestGoldCount ?? 0),
      level: wealth,
      experience,
      maxExperience,
      gamesPlayed,
      gamesWon,
      gamesLost,

      currentCardCount,
      highestCardCount: Number(user.highestCardCount ?? 0),
      cardsCreated: Number(user.cardsCreated ?? 0),
      cardsBought: Number(user.cardsBought ?? 0),
      cardsTraded: Number(user.cardsTraded ?? 0),
      cardsListed,

      topCards,
      winRate: gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0,
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

    // scope to current user's server
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("getLeaderboards: unauthenticated");
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me?.serverId) throw new Error("getLeaderboards: user has no server");

    // strategist (requires full compute)
    const users = await ctx.db
      .query("users")
      .withIndex("by_serverId", (q) => q.eq("serverId", me.serverId))
      .collect();
    const strategist = users
      .map((u) => {
        const games = u.gamesPlayed ?? 0;
        const wins = u.gamesWon ?? 0;
        const winRate = games > 0 ? (wins / games) * 100 : 0;
        return { username: u.username ?? "Player", winRate };
      })
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit);

    // king midas (indexed)
    const kingMidas = await ctx.db
      .query("users")
      .withIndex("by_serverId", (q) => q.eq("serverId", me.serverId))
      .order("desc")
      .take(limit)
      .then((users) =>
        users.map((u) => ({
          username: u.username ?? "Player",
          goldCount: Number(u.highestGoldCount ?? 0),
        }))
      );

    // card master (indexed)
    const cardMaster = await ctx.db
      .query("users")
      .withIndex("by_serverId", (q) => q.eq("serverId", me.serverId))
      .order("desc")
      .take(limit)
      .then((users) =>
        users.map((u) => ({
          username: u.username ?? "Player",
          cardCount: Number(u.currentCardCount ?? 0),
        }))
      );

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
    if (!currentUser) throw new Error("getUserRanks: user not found");

    // Win rate rank (must collect all users)
    const allUsers = await ctx.db.query("users").collect();
    const strategist = allUsers
      .map((u) => {
        const games = u.gamesPlayed ?? 0;
        const wins = u.gamesWon ?? 0;
        return {
          _id: u._id,
          score: games > 0 ? (wins / games) * 100 : 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .findIndex((u) => String(u._id) === String(currentUser._id)) + 1;

    // Indexed ranks
    const [goldUsers, cardUsers] = await Promise.all([
      ctx.db.query("users").withIndex("by_highest_gold_count").order("desc").collect(),
      ctx.db.query("users").withIndex("by_current_card_count").order("desc").collect(),
    ]);

    const kingMidas = goldUsers.findIndex(u => String(u._id) === String(currentUser._id)) + 1;
    const cardMaster = cardUsers.findIndex(u => String(u._id) === String(currentUser._id)) + 1;

    // Other ranks (must collect)
    const artisan = allUsers
      .map(u => ({ _id: u._id, score: u.cardsCreated ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .findIndex(u => String(u._id) === String(currentUser._id)) + 1;

    const shopRaider = allUsers
      .map(u => ({ _id: u._id, score: u.cardsBought ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .findIndex(u => String(u._id) === String(currentUser._id)) + 1;

    const friendly = allUsers
      .map(u => ({ 
        _id: u._id, 
        score: Array.isArray(u.friendIds) ? u.friendIds.length : 0
      }))
      .sort((a, b) => b.score - a.score)
      .findIndex(u => String(u._id) === String(currentUser._id)) + 1;

    return {
      strategist: Math.max(1, strategist),
      kingMidas: Math.max(1, kingMidas),
      cardMaster: Math.max(1, cardMaster),
      artisan: Math.max(1, artisan),
      shopRaider: Math.max(1, shopRaider),
      friendly: Math.max(1, friendly),
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

    const templates = await ctx.db.query("card_templates").collect();

    const computed = templates.map((t: any) => {
      const matchesTotal = Math.max(0, Number(t.matches?.total ?? 0));
      const wins = Math.max(0, Number(t.matches?.wins ?? 0));
      const winRate = matchesTotal > 0 ? (wins / matchesTotal) * 100 : 0;
      const normalizedType = ['monster', 'spell', 'trap'].includes(String(t.type ?? '').toLowerCase()) 
        ? String(t.type).toLowerCase() 
        : 'monster';

      const name = String(t.name ?? '').trim();
      if (name.length === 0) throw new Error('Invalid card template name');
      if (!Number.isFinite(matchesTotal) || matchesTotal < 0) throw new Error('Invalid matches count');

      return {
        id: t._id,
        name,
        type: normalizedType,
        matches: matchesTotal,
        winRate,
        imageUrl: t.imageUrl ?? null,
      };
    });

    const sorted = computed
      .sort((a, b) => metric === "matches" ? b.matches - a.matches : b.winRate - a.winRate)
      .slice(0, limit);

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
    const clerkId = args.userId ?? (await ctx.auth.getUserIdentity())?.subject;
    if (!clerkId)
      throw new Error("getEconomyStats: unauthenticated or missing userId");

    // validate inputs
    const range = (args.range ?? "30d").toString();
    const now = Date.now();
    const millisMap: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const cutoff = new Date(now - (millisMap[range] ?? millisMap["30d"])).toISOString();

    try {
      const snapshots = await ctx.db
        .query("user_snapshots")
        .withIndex("by_user_ts", (q: any) => q.eq("userId", clerkId).gte("ts", cutoff))
        .collect()
        .catch(() => []);

      if (Array.isArray(snapshots) && snapshots.length > 0) {
        const filtered = snapshots
          .map((s: any) => ({
            ts: s.ts,
            gold: Number(s.goldCount ?? 0),
            cards: Number(s.currentCardCount ?? 0),
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
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .first();

    const points = Math.min(
      10,
      range === "7d" ? 7 : range === "30d" ? 10 : range === "90d" ? 12 : 12
    );
    const goldNow = Number(user?.goldCount ?? 0);
    const cardsNow = Number(user?.currentCardCount ?? 0);

    const goldHistory = Array.from({ length: points }, (_, i) => {
      const ts = new Date(now - (points - 1 - i) * 86400000).toISOString();
      const value = Math.max(0, Math.round(goldNow * (0.6 + 0.4 * (i / (points - 1)))));
      return { ts, value };
    });

    const cardCountHistory = Array.from({ length: points }, (_, i) => {
      const ts = new Date(now - (points - 1 - i) * 86400000).toISOString();
      const value = Math.max(0, Math.round(cardsNow * (0.6 + 0.4 * (i / (points - 1)))));
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
    let targetUser;
    if (args.userId) {
      targetUser = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId)).first();
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.subject) throw new Error("updateUserStats: unauthenticated");
      targetUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }
    if (!targetUser) throw new Error("updateUserStats: user not found");

    const patch: Record<string, any> = {
      lastUpdatedAt: new Date().toISOString()
    };

    const numericFields: Array<[string, number | undefined]> = [
      ["gamesPlayed", args.gamesPlayedInc],
      ["gamesWon", args.gamesWonInc],
      ["gamesLost", args.gamesLostInc],
      ["goldCount", args.goldDelta],
      ["currentCardCount", args.cardCountDelta],
    ];

    for (const [field, inc] of numericFields) {
      if (inc === undefined) continue;
      
      if (typeof inc !== "number" || !Number.isFinite(inc)) {
        throw new Error(`updateUserStats: invalid numeric delta for ${field}`);
      }

      const current = Number((targetUser as Record<string, unknown>)[field] ?? 0);
      const next = Math.max(0, current + inc);
      patch[field] = next;

      // Update highest counters
      if (field === "goldCount" && next > Number(targetUser.highestGoldCount ?? 0)) {
        patch.highestGoldCount = next;
      }
      if (field === "currentCardCount" && next > Number(targetUser.highestCardCount ?? 0)) {
        patch.highestCardCount = next;
      }
    }

    await ctx.db.patch(targetUser._id, patch);
    const updated = await ctx.db.get(targetUser._id);
    if (!updated) throw new Error("updateUserStats: failed to fetch updated user");

    return { success: true, user: updated };
  },
});

/**
 * @description
 * Update user game statistics and track highest values
 *
 * @receives data from:
 * - game results, card transactions
 *
 * @sends data to:
 * - users table: updates statistics and historical highs
 *
 * @sideEffects:
 * - Updates user record with new statistics
 */
export const updateUserGameStats = mutation({
  args: {
    gamesPlayed: v.optional(v.number()),
    gamesWon: v.optional(v.number()),
    gamesLost: v.optional(v.number()),
    cardsBought: v.optional(v.number()),
    cardsTraded: v.optional(v.number()),
    cardsCreated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("updateUserGameStats: unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("updateUserGameStats: user not found");

    const patch: Record<string, any> = {};

    // update game stats
    if (args.gamesPlayed !== undefined) {
      patch.gamesPlayed = Number(user.gamesPlayed ?? 0) + args.gamesPlayed;
    }
    if (args.gamesWon !== undefined) {
      patch.gamesWon = Number(user.gamesWon ?? 0) + args.gamesWon;
    }
    if (args.gamesLost !== undefined) {
      patch.gamesLost = Number(user.gamesLost ?? 0) + args.gamesLost;
    }

    // update card txn stats
    if (args.cardsBought !== undefined) {
      patch.cardsBought = Number(user.cardsBought ?? 0) + args.cardsBought;
    }
    if (args.cardsTraded !== undefined) {
      patch.cardsTraded = Number(user.cardsTraded ?? 0) + args.cardsTraded;
    }
    if (args.cardsCreated !== undefined) {
      patch.cardsCreated = Number(user.cardsCreated ?? 0) + args.cardsCreated;
    }

    // udate historical highs
    const currentGold = Number(user.goldCount ?? 0);
    const currentHighestGold = Number(user.highestGoldCount ?? 0);
    if (currentGold > currentHighestGold) {
      patch.highestGoldCount = currentGold;
    }

    const currentCards = Number(user.currentCardCount ?? 0);
    const currentHighestCards = Number(user.highestCardCount ?? 0);
    if (currentCards > currentHighestCards) {
      patch.highestCardCount = currentCards;
    }

    patch.lastUpdatedAt = new Date().toISOString();

    await ctx.db.patch(user._id, patch);

    const updated = await ctx.db.get(user._id);
    return { success: true, user: updated };
  },
});

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
