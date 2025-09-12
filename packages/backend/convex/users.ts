import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { type Id } from "./_generated/dataModel";

/**
 * @description
 * Query to get current user data from Clerk webhook
 *
 * @receives data from:
 * - users table: user document by Clerk external ID
 *
 * @sends data to:
 * - client-side: current user profile data
 *
 * @sideEffects:
 * - none
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    // Runtime assertions
    if (typeof user.goldCount !== "number" || user.goldCount < 0)
      throw new Error("current: invalid goldCount");
    if (typeof user.currentCardCount !== "number" || user.currentCardCount < 0)
      throw new Error("current: invalid currentCardCount");

    // Fetch friends (limit 100 for safety)
    const [friendsOne, friendsTwo] = await Promise.all([
      ctx.db
        .query("friends")
        .withIndex("by_userOneId_userTwoId", (q) => q.eq("userOneId", user._id))
        .collect(),
      ctx.db
        .query("friends")
        .withIndex("by_userTwoId_userOneId", (q) => q.eq("userTwoId", user._id))
        .collect(),
    ]);

    if (!Array.isArray(friendsOne) || !Array.isArray(friendsTwo)) {
      throw new Error("current: friends not array");
    }
    const friendsCount = [...friendsOne, ...friendsTwo].slice(0, 100).length;

    // Fetch unread mail count (limit 1000 for safety)
    const mail = await ctx.db
      .query("mails")
      .withIndex("by_recipientId_sentAt", (q) =>
        q.eq("recipientId", user._id as Id<"users">)
      )
      .collect();
    if (!Array.isArray(mail)) throw new Error("current: mail not array");
    const unreadMailCount = mail.filter((m) => m.isRead === false).length;

    // Fetch messages sent by user (limit 100 for safety)
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq("senderId", String(user._id)))
      .collect();
    if (!Array.isArray(messages))
      throw new Error("current: messages not array");
    const messagesSentCount = messages.length > 100 ? 100 : messages.length;

    return {
      _id: user._id,
      name: user.name ?? "",
      clerkId: user.clerkId ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      goldCount: user.goldCount,
      highestGoldCount: user.highestGoldCount,
      inventory: Array.isArray(user.inventory) ? user.inventory : [],
      currentCardCount: user.currentCardCount,
      highestCardCount: user.highestCardCount,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      gamesLost: user.gamesLost,
      cardsCreated: user.cardsCreated,
      cardsBought: user.cardsBought,
      cardsTraded: user.cardsTraded,
      profPicUrl: user.profPicUrl ?? "",
      dateCreated: user.dateCreated ?? "",
      hasSeenShowcase: user.hasSeenShowcase ?? false,
      friendsCount,
      unreadMailCount,
      messagesSentCount,
    };
  },
});

// Removed legacy: setupInitialCards (inventory/cards ownership)

// Removed legacy: selectStarterCardsBalanced (inventory/cards ownership)

/**
 * @description
 * Internal mutation to upsert user data from Clerk webhook
 *
 * @receives data from:
 * - Clerk webhook: complete user JSON data
 *
 * @sends data to:
 * - users table: updated or new user document
 *
 * @sideEffects:
 * - Creates or updates user record in database
 * - Assigns 10 starter cards to new users
 */
export const upsertFromClerk = mutation({
  args: {
    data: v.object({
      clerkId: v.string(),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      username: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  },
  async handler(ctx, { data }) {
    const userAttributes = {
      name:
        `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() ||
        data.username ||
        "Anonymous",
      clerkId: data.clerkId,
      username: data.username || data.first_name || "Player",
      email: data.email || "",
      goldCount: 300,
      highestGoldCount: 300,
      inventory: [],
      currentCardCount: 0,
      highestCardCount: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      cardsCreated: 0,
      cardsBought: 0,
      cardsSold: 0,
      cardsTraded: 0,
      profPicUrl: "assets/profile/prof_pic1.jpg",
      dateCreated: new Date().toISOString(),
      friendIds: [],
      hasSeenShowcase: false,
    };

    const user = await userByExternalId(ctx, data.clerkId);

    // Defensive: legacy inventory retained as empty array, but not used further
    if (!Array.isArray(userAttributes.inventory))
      throw new Error("upsertFromClerk: inventory must be an array");
    if (userAttributes.inventory.some((id) => typeof id !== "string"))
      throw new Error("upsertFromClerk: all inventory items must be strings");

    if (user === null) {
      console.log(
        `upsertFromClerk: Creating NEW user for clerkId: ${data.clerkId}`
      );
      const newUserId = await ctx.db.insert("users", {
        ...userAttributes,
        currentCardCount: 0,
        highestCardCount: 0,
        inventory: [],
      });
      return { userId: newUserId, isNewUser: true };
    } else {
      console.log(
        `upsertFromClerk: Updating EXISTING user for clerkId: ${data.clerkId}`
      );
      await ctx.db.patch(user._id, {
        ...userAttributes,
        inventory: user.inventory ?? [],
        friendIds: user.friendIds ?? [],
        hasSeenShowcase: user.hasSeenShowcase ?? false,
      });
      return { userId: user._id, isNewUser: false };
    }
  },
});

/**
 * @description
 * Internal mutation to delete user data from Clerk webhook, and clean up related friends, mail, and messages.
 *
 * @receives data from:
 * - Clerk webhook: Clerk user ID to delete
 *
 * @sends data to:
 * - users table: deletes user document
 * - friends table: deletes all friend relationships for user
 * - mail table: deletes all mail for user
 * - messages table: deletes all messages sent by user
 *
 * @sideEffects:
 * - Removes user record and related data from database
 */
export const deleteFromClerk = mutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (!user) {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`
      );
      return;
    }

    // Delete all friend relationships (both directions)
    const [friends, friendsReverse] = await Promise.all([
      ctx.db
        .query("friends")
        .withIndex("by_userOneId_userTwoId", (q) => q.eq("userOneId", user._id))
        .collect(),
      ctx.db
        .query("friends")
        .withIndex("by_userTwoId_userOneId", (q) => q.eq("userTwoId", user._id))
        .collect(),
    ]);
    for (const f of [...(friends ?? []), ...(friendsReverse ?? [])]) {
      if (f?._id) await ctx.db.delete(f._id);
    }

    // Delete all mail for this user
    const mail = await ctx.db
      .query("mails")
      .withIndex("by_recipientId_sentAt", (q) =>
        q.eq("recipientId", user._id as Id<"users">)
      )
      .collect();
    for (const m of mail ?? []) {
      if (m?._id) await ctx.db.delete(m._id);
    }

    // Delete all messages sent by this user
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq("senderId", String(user._id)))
      .collect();
    for (const msg of messages ?? []) {
      if (msg?._id) await ctx.db.delete(msg._id);
    }

    // Delete the user
    await ctx.db.delete(user._id);
  },
});

/**
 * @description
 * Helper function to get current user or throw error.
 *
 * @receives data from:
 * - Clerk auth context: current user identity
 *
 * @sends data to:
 * - calling functions: current user document or throws error
 *
 * @sideEffects:
 * - none
 */
export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

/**
 * @description
 * Helper function to get current user or return null.
 *
 * @receives data from:
 * - Clerk auth context: current user identity
 *
 * @sends data to:
 * - calling functions: current user document or null
 *
 * @sideEffects:
 * - none
 */
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;
  return await userByExternalId(ctx, identity.subject);
}

/**
 * @description
 * Helper function to get user by Clerk external ID (supports migration from clerkId).
 *
 * @receives data from:
 * - Clerk user ID: external ID from Clerk
 *
 * @sends data to:
 * - calling functions: user document or null
 *
 * @sideEffects:
 * - none
 */
async function userByExternalId(ctx: QueryCtx, clerkId: string) {
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .unique();

  if (!user) {
    user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", clerkId))
      .unique();
  }

  return user;
}

// Removed legacy: addCardToInventory

// Removed legacy: removeCardFromInventory

export const updateProfPicUrl = mutation({
  args: {
    userId: v.string(),
    profPicUrl: v.string(),
  },
  handler: async (ctx, { userId, profPicUrl }) => {
    // Basic runtime validations
    if (typeof profPicUrl !== "string" || profPicUrl.length === 0) {
      throw new Error(
        "updateProfPicUrl: profPicUrl must be a non-empty string"
      );
    }
    // Enforce path under assets/profile/
    if (!profPicUrl.startsWith("assets/profile/")) {
      throw new Error(
        "updateProfPicUrl: profPicUrl must start with assets/profile/"
      );
    }

    const user = await userByExternalId(ctx, userId);
    if (!user) throw new Error("updateProfPicUrl: User not found");

    await ctx.db.patch(user._id, { profPicUrl });
    return { success: true };
  },
});

export const markShowcaseCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("markShowcaseCompleted: Not authenticated");

    const user = await userByExternalId(ctx, identity.subject);
    if (!user) throw new Error("markShowcaseCompleted: User not found");

    await ctx.db.patch(user._id, { hasSeenShowcase: true });
    return { success: true };
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!me) return null;
    return {
      _id: me._id,
      clerkId: me.clerkId ?? null,
      username: me.username ?? null,
      serverId: me.serverId ?? null,
    };
  },
});

export const assignServerOnFirstAuth = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject)
      throw new Error("assignServerOnFirstAuth: Not authenticated");

    const user = await userByExternalId(ctx, identity.subject);
    if (!user) throw new Error("assignServerOnFirstAuth: User not found");

    // If already assigned, no-op
    if (user.serverId)
      return { serverId: user.serverId, alreadyAssigned: true };

    // Find the least-full active server
    let server = await ctx.db
      .query("servers")
      .withIndex("by_status_memberCount", (q) => q.eq("status", "active"))
      .order("asc")
      .first();

    // Create a new server if none or full
    if (
      !server ||
      typeof server.capacity !== "number" ||
      server.memberCount >= server.capacity
    ) {
      const activeCount = await ctx.db
        .query("servers")
        .withIndex("by_status_createdAt", (q) => q.eq("status", "active"))
        .collect();
      const name = `server-${(activeCount?.length ?? 0) + 1}`;
      const serverId = await ctx.db.insert("servers", {
        name,
        capacity: 10,
        memberCount: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      });
      server = await ctx.db.get(serverId);
    }

    if (!server)
      throw new Error("assignServerOnFirstAuth: Failed to resolve server");
    const nextCount = (server.memberCount ?? 0) + 1;
    if (!Number.isFinite(nextCount) || nextCount < 1) {
      throw new Error("assignServerOnFirstAuth: Invalid memberCount increment");
    }

    // Atomically update server count and user assignment
    await ctx.db.patch(server._id, { memberCount: nextCount });
    await ctx.db.patch(user._id, { serverId: server._id });

    return { serverId: server._id, alreadyAssigned: false };
  },
});

export const snapshotAllUsersInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
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
