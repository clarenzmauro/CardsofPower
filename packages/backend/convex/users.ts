import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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
    if (!identity?.subject) throw new Error("current user: unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("current: user not found");

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

    // Fetch messages sent by user (limit 1000 for safety)
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq("senderId", String(user._id)))
      .collect();
    if (!Array.isArray(messages))
      throw new Error("current: messages not array");
    const messagesSentCount = messages.length > 1000 ? 1000 : messages.length;

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
      friendsCount,
      unreadMailCount,
      messagesSentCount,
    };
  },
});

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
      cardsTraded: 0,
      profPicUrl: "prof_pic1.jpg",
      dateCreated: new Date().toISOString(),
      friendIds: [],
    };

    const user = await userByExternalId(ctx, data.clerkId);

    // Defensive: inventory must be an array of strings (card IDs)
    if (!Array.isArray(userAttributes.inventory)) {
      throw new Error("upsertFromClerk: inventory must be an array");
    }
    if (userAttributes.inventory.some((id) => typeof id !== "string")) {
      throw new Error("upsertFromClerk: all inventory items must be strings");
    }

    if (user === null) {
      return await ctx.db.insert("users", { ...userAttributes, inventory: [] });
    } else {
      await ctx.db.patch(user._id, {
        ...userAttributes,
        inventory: user.inventory ?? [],
        friendIds: user.friendIds ?? [],
      });
      return user._id;
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

/**
 * @description
 * Mutation to add a card ID to a user's inventory.
 *
 * @receives data from:
 * - client: userId (Clerk ID) and cardId (Convex ID)
 *
 * @sends data to:
 * - users table: updated user document with new card in inventory
 *
 * @sideEffects:
 * - Adds cardId to user's inventory array
 * - Increments currentCardCount and cardsCreated for the user
 */
export const addCardToInventory = mutation({
  args: {
    userId: v.string(),
    cardId: v.id("cards"),
  },
  handler: async (ctx, { userId, cardId }) => {
    const user = await userByExternalId(ctx, userId);

    if (!user) {
      throw new Error("addCardToInventory: User not found");
    }

    // Ensure inventory is an array before pushing
    const currentInventory = Array.isArray(user.inventory)
      ? user.inventory
      : [];

    // Ensure the card is not already in the inventory (defensive check)
    if (currentInventory.includes(cardId)) {
      console.warn(`Card ${cardId} already in user ${userId}'s inventory.`);
      return user._id; // Return user ID even if card already exists
    }

    await ctx.db.patch(user._id, {
      inventory: [...currentInventory, cardId],
      currentCardCount: user.currentCardCount + 1,
      cardsCreated: user.cardsCreated + 1,
    });

    return user._id;
  },
});
