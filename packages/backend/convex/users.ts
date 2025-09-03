import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

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
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("current: user not found");

    // Runtime assertions
    if (typeof user.goldCount !== "number" || user.goldCount < 0)
      throw new Error("current: invalid goldCount");
    if (typeof user.currentCardCount !== "number" || user.currentCardCount < 0)
      throw new Error("current: invalid currentCardCount");

    // Return all relevant fields for the client
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
        })
    },
    async handler(ctx, { data }) {
        const userAttributes = {
            name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || data.username || "Anonymous",
            clerkId: data.clerkId, 
            username: data.username || data.first_name || "Player",
            email: data.email || "",
            goldCount: 300,
            highestGoldCount: 300,
            inventory: v.array(v.id("cards")),
            currentCardCount: 0,
            highestCardCount: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            cardsCreated: 0,
            cardsBought: 0,
            cardsTraded: 0,
            profPicUrl: "prof_pic1.jpg",
            dateCreated: new Date().toISOString()
        };

        const user = await userByExternalId(ctx, data.clerkId);

        // Defensive: inventory must be an array of strings (card IDs)
        if (!Array.isArray(userAttributes.inventory)) {
            throw new Error("upsertFromClerk: inventory must be an array");
        }
        if (userAttributes.inventory.some(id => typeof id !== "string")) {
            throw new Error("upsertFromClerk: all inventory items must be strings");
        }

        if (user === null) {
            return await ctx.db.insert("users", { ...userAttributes, inventory: [] });
        } else {
            await ctx.db.patch(user._id, { ...userAttributes, inventory: user.inventory ?? [] });
            return user._id;
        }
    },
});

/**
 * @description
 * Internal mutation to delete user data from Clerk webhook
 *
 * @receives data from:
 * - Clerk webhook: Clerk user ID to delete
 *
 * @sends data to:
 * - users table: deletes user document
 *
 * @sideEffects:
 * - Removes user record from database
 */
export const deleteFromClerk = mutation({
    args: { clerkUserId: v.string() },
    async handler(ctx, { clerkUserId }) {
        const user = await userByExternalId(ctx, clerkUserId);

        if (user !== null) {
            await ctx.db.delete(user._id);
        } else {
            console.warn(
                `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
            );
        }
    },
});

/**
 * @description
 * Helper function to get current user or throw error
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
 * Helper function to get current user or return null
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
    if (identity === null) {
        return null;
    }
    return await userByExternalId(ctx, identity.subject);
}

/**
 * @description
 * Helper function to get user by Clerk external ID (supports migration from clerkId)
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
      const currentInventory = Array.isArray(user.inventory) ? user.inventory : [];
  
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