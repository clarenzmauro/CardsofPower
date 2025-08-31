import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * @description
 * Query to get current user data
 * 
 * @receives data from:
 * - users table: user document by clerk ID
 * 
 * @sends data to:
 * - various pages: user profile data
 * 
 * @sideEffects:
 * - none
 */
export const getCurrentUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        
        if (!identity) {
            throw new Error("getCurrentUser: not authenticated");
        }
        
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
        
        if (!user) {
            return null;
        }
        
        return user;
    },
});

/**
 * @description
 * Mutation to create a new user on first login.
 * 
 * @receives data from:
 * - Clerk auth: user identity data
 * 
 * @sends data to:
 * - users table: new user document
 * 
 * @sideEffects:
 * - Creates new user record in database
 */
export const createUser = mutation({
    args: {
        username: v.string(),
        email: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        
        if (!identity) {
            throw new Error("createUser: not authenticated");
        }
        
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
        
        if (existingUser) {
            throw new Error("createUser: user already exists");
        }
        
        const userId = await ctx.db.insert("users", {
            clerkId: identity.subject,
            username: args.username,
            email: args.email,
            goldCount: 300,
            inventory: [],
            currentCardCount: 0,
            highestCardCount: 0,
            profPicUrl: "prof_pic1.jpg",
            dateCreated: new Date().toISOString()
        });
        
        return { userId };
    },
});
