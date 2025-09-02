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
        return await getCurrentUser(ctx);
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
            dateCreated: new Date().toISOString()
        };

        const user = await userByExternalId(ctx, data.clerkId);
        if (user === null) {
            return await ctx.db.insert("users", userAttributes);
        } else {
            await ctx.db.patch(user._id, userAttributes);
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
