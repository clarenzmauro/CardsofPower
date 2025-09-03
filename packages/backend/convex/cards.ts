import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * @description
 * Query to fetch all cards for the dictionary
 * 
 * @receives data from:
 * - cards table: all card documents
 * 
 * @sends data to:
 * - dictionary page: card grid display
 * 
 * @sideEffects:
 * - none
 */
export const getAll = query({
    handler: async (ctx: any) => {
        const cards = await ctx.db.query("cards").collect();
        
        if (!Array.isArray(cards)) {
            throw new Error("getAll: cards must be an array");
        }
        
        return cards;
    },
});

/**
 * @description
 * Query to get user's inventory for filtering owned cards.
 * 
 * @receives data from:
 * - users table: inventory array for current user
 * 
 * @sends data to:
 * - dictionary page: owned card filtering
 * 
 * @sideEffects:
 * - none
 */
export const getUserInventory = query({
    args: { userId: v.string() },
    handler: async (ctx: any, args: any) => {
        if (!args.userId) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.userId))
            .first();
        
        // return empty array for missing users
        if (!user) {
            return [];
        }
        
        if (!Array.isArray(user.inventory)) {
            throw new Error("getUserInventory: inventory must be an array");
        }

        // Defensive: limit to 100 cards to avoid runaway fetches
        const inventoryIds = user.inventory.slice(0, 100);

        // Fetch all card documents in parallel
        const cardPromises = inventoryIds.map((cardId: string) => ctx.db.get(cardId));
        const cards = await Promise.all(cardPromises);

        // Filter out nulls (missing cards)
        const validCards = cards.filter((c: any) => c !== null);

        // Assert at least two runtime checks
        if (!Array.isArray(validCards)) throw new Error("getUserInventory: result is not array");
        if (validCards.length > 0 && !validCards[0]._id) throw new Error("getUserInventory: card missing _id");

        return validCards;
    },
});

/**
 * @description
 * Mutation to update card ownership when purchased/sold.
 * 
 * @receives data from:
 * - client: cardId and new owner info
 * 
 * @sends data to:
 * - cards table: updated ownership data
 * 
 * @sideEffects:
 * - updates card ownership in database
 */
export const updateOwnership = mutation({
    args: {
        cardId: v.string(),
        isOwned: v.boolean(),
        ownerId: v.optional(v.string()),
        ownerUsername: v.optional(v.string())
    },
    handler: async (ctx: any, args: any) => {
        const cardId = args.cardId as any;
        
        const card = await ctx.db.get(cardId);
        
        if (!card) {
            throw new Error("updateOwnership: card not found");
        }
        
        await ctx.db.patch(cardId, {
            isOwned: args.isOwned,
            currentOwnerId: args.ownerId,
            currentOwnerUsername: args.ownerUsername,
        });
        
        return { success: true };
    },
});

// comment these out if you want to remove uploading cards easily
/**
 * @description
 * Mutation to add a card with all Firebase fields
 * 
 * @receives data from:
 * - client: complete card data object
 * 
 * @sends data to:
 * - cards table: new card document
 * 
 * @sideEffects:
 * - Creates new card record in database
 */
export const addCompleteCard = mutation({
    args: {
        // Basic Info
        name: v.string(),
        type: v.string(),
        description: v.optional(v.string()),
        imageUrl: v.string(),
        
        // Monster Stats
        atkPts: v.optional(v.number()),
        defPts: v.optional(v.number()),
        inGameAtkPts: v.optional(v.number()),
        inGameDefPts: v.optional(v.number()),
        
        // Monster Properties
        attribute: v.optional(v.string()),
        class: v.optional(v.string()),
        character: v.optional(v.string()),
        level: v.optional(v.number()),
        
        // Ownership & Market
        isOwned: v.boolean(),
        isListed: v.optional(v.boolean()),
        currentOwnerId: v.optional(v.string()),
        currentOwnerUsername: v.optional(v.string()),
        boughtFor: v.optional(v.number()),
        marketValue: v.optional(v.number()),
        marketCount: v.optional(v.number()),
        roi: v.optional(v.number()),
        passCount: v.optional(v.number()),
        
        // Statistics
        matches: v.optional(v.object({
            wins: v.number(),
            total: v.number()
        })),
        cardWin: v.optional(v.object({
            global: v.number(),
            local: v.number()
        })),
        cardLose: v.optional(v.object({
            global: v.number(),
            local: v.number()
        })),
    },
    handler: async (ctx, args) => {
        const cardId = await ctx.db.insert("cards", args);
        return { cardId };
    },
});

/**
 * @description
 * Mutation to add card with uploaded image
 * 
 * @receives data from:
 * - client: card data + storage ID
 * 
 * @sends data to:
 * - cards table: new card document
 * 
 * @sideEffects:
 * - Creates new card record with stored image URL
 */
export const addCardWithImage = mutation({
    args: {
        // Basic Info
        name: v.string(),
        type: v.string(),
        description: v.optional(v.string()),
        storageId: v.string(), // Reference to stored image
        
        // Monster Stats
        atkPts: v.optional(v.number()),
        defPts: v.optional(v.number()),
        inGameAtkPts: v.optional(v.number()),
        inGameDefPts: v.optional(v.number()),
        
        // Monster Properties
        attribute: v.optional(v.string()),
        class: v.optional(v.string()),
        character: v.optional(v.string()),
        level: v.optional(v.number()),
        
        // Ownership & Market
        isOwned: v.boolean(),
        isListed: v.optional(v.boolean()),
        currentOwnerId: v.optional(v.string()),
        currentOwnerUsername: v.optional(v.string()),
        boughtFor: v.optional(v.number()),
        marketValue: v.optional(v.number()),
        marketCount: v.optional(v.number()),
        roi: v.optional(v.number()),
        passCount: v.optional(v.number()),
        
        // Statistics
        matches: v.optional(v.object({
            wins: v.number(),
            total: v.number()
        })),
        cardWin: v.optional(v.object({
            global: v.number(),
            local: v.number()
        })),
        cardLose: v.optional(v.object({
            global: v.number(),
            local: v.number()
        })),
    },
    handler: async (ctx, args) => {
        // Get the image URL from storage
        const imageUrl = await ctx.storage.getUrl(args.storageId);
        
        if (!imageUrl) {
            throw new Error("Failed to get image URL from storage");
        }
        
        // Create card with the image URL
        const cardData = {
            ...args,
            imageUrl,
            storageId: undefined, // Remove storageId from card data
        };
        
        const cardId = await ctx.db.insert("cards", cardData);
        return { cardId, imageUrl };
    },
});
