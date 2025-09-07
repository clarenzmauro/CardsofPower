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

export const getShopCards = query({
  args: {
    searchQuery: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all listed cards first (limit 100 for safety)
    let cards = await ctx.db
      .query("cards")
      .withIndex("by_is_listed_market_value", (q) =>
        q.eq("isListed", true)
      )
      .collect();

    if (!Array.isArray(cards)) {
      throw new Error("getShopCards: cards must be an array");
    }

    // Apply price filters if provided
    if (args.minPrice !== undefined) {
      cards = cards.filter((card) => 
        card.marketValue !== undefined && card.marketValue >= args.minPrice!
      );
    }
    if (args.maxPrice !== undefined) {
      cards = cards.filter((card) =>
        card.marketValue !== undefined && card.marketValue <= args.maxPrice!
      );
    }

    // Filter out user's own cards
    cards = cards.filter((card) => 
      card.currentOwnerId !== args.currentUserId
    );

    // Apply search filter if provided
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      cards = cards.filter((card) =>
        card.name.toLowerCase().includes(query)
      );
    }

    return cards.slice(0, 100); // Safety limit
  },
});

export const getMyListings = query({
  args: {
    searchQuery: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    let cards = await ctx.db
      .query("cards")
      .withIndex("by_owner", (q) =>
        q.eq("currentOwnerId", args.currentUserId)
      )
      .collect();

    if (!Array.isArray(cards)) {
      throw new Error("getMyListings: cards must be an array");
    }

    cards = cards.filter((card) => card.isListed);

    if (args.minPrice !== undefined) {
      cards = cards.filter((card) => 
        card.marketValue !== undefined && card.marketValue >= args.minPrice!
      );
    }
    if (args.maxPrice !== undefined) {
      cards = cards.filter((card) =>
        card.marketValue !== undefined && card.marketValue <= args.maxPrice!
      );
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      cards = cards.filter((card) =>
        card.name.toLowerCase().includes(query)
      );
    }

    return cards.slice(0, 100);
  },
});

export const getTradeListings = query({
  args: {
    searchQuery: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    let cards = await ctx.db
      .query("cards")
      .withIndex("by_is_for_trade_market_value", (q) =>
        q.eq("isForTrade", true)
      )
      .collect();

    if (!Array.isArray(cards)) {
      throw new Error("getTradeListings: cards must be an array");
    }

    cards = cards.filter((card) => card.currentOwnerId !== args.currentUserId);

    if (args.minPrice !== undefined) {
      cards = cards.filter((card) =>
        card.marketValue !== undefined && card.marketValue >= args.minPrice!
      );
    }
    if (args.maxPrice !== undefined) {
      cards = cards.filter((card) =>
        card.marketValue !== undefined && card.marketValue <= args.maxPrice!
      );
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      cards = cards.filter((card) =>
        card.name.toLowerCase().includes(query)
      );
    }

    return cards.slice(0, 100); // Safety limit
  },
});

export const listCardForSale = mutation({
  args: {
    cardId: v.id("cards"),
    price: v.number(),
    ownerId: v.string(),
  },
  handler: async (ctx, { cardId, price, ownerId }) => {
    const card = await ctx.db.get(cardId);
    if (!card) throw new Error("listCardForSale: Card not found");
    if (card.currentOwnerId !== ownerId) {
      throw new Error("listCardForSale: Not card owner");
    }
    if (price <= 0) throw new Error("listCardForSale: Invalid price");

    await ctx.db.patch(cardId, {
      isListed: true,
      marketValue: price,
      isForTrade: false,
    });

    return { success: true };
  },
});

export const unlistCard = mutation({
  args: {
    cardId: v.id("cards"),
    ownerId: v.string(),
  },
  handler: async (ctx, { cardId, ownerId }) => {
    const card = await ctx.db.get(cardId);
    if (!card) throw new Error("unlistCard: Card not found");
    if (card.currentOwnerId !== ownerId) {
      throw new Error("unlistCard: Not card owner");
    }

    await ctx.db.patch(cardId, {
      isListed: false,
      marketValue: undefined,
      isForTrade: false,
    });

    return { success: true };
  },
});

export const listCardForTrade = mutation({
  args: {
    cardId: v.id("cards"),
    ownerId: v.string(),
  },
  handler: async (ctx, { cardId, ownerId }) => {
    const card = await ctx.db.get(cardId);
    if (!card) throw new Error("listCardForTrade: Card not found");
    if (card.currentOwnerId !== ownerId) {
      throw new Error("listCardForTrade: Not card owner");
    }

    await ctx.db.patch(cardId, {
      isForTrade: true,
      isListed: false,
      marketValue: undefined,
    });

    return { success: true };
  },
});

const userByExternalId = async (ctx: any, externalId: string) => {
  if (!externalId) throw new Error("userByExternalId: Missing externalId");
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", externalId))
    .first();

  if (!user) return null;
  if (!user._id) throw new Error("userByExternalId: Invalid user document");
  
  return user;
};

export const purchaseCard = mutation({
  args: {
    cardId: v.id("cards"),
  },
  handler: async (ctx, { cardId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("purchaseCard: Not authenticated");
    const buyerId = identity.subject;

    const card = await ctx.db.get(cardId);
    if (!card) throw new Error("purchaseCard: Card not found");
    if (!card.isListed) throw new Error("purchaseCard: Card not listed");
    if (card.currentOwnerId === buyerId) throw new Error("purchaseCard: Cannot buy your own card");

    const [buyer, seller] = await Promise.all([
      userByExternalId(ctx, buyerId),
      userByExternalId(ctx, card.currentOwnerId ?? "")
    ]);

    if (!buyer || !seller) throw new Error("purchaseCard: User not found");
    if (buyer.goldCount < (card.marketValue ?? 0)) throw new Error("purchaseCard: Insufficient funds");

    const price = card.marketValue ?? 0;
    const buyerInventory = Array.isArray(buyer.inventory) ? buyer.inventory : [];
    const sellerInventory = Array.isArray(seller.inventory) ? seller.inventory : [];

    await Promise.all([
      ctx.db.patch(buyer._id, {
        goldCount: buyer.goldCount - price,
        highestGoldCount: Math.max(buyer.highestGoldCount, buyer.goldCount - price),
        inventory: [...buyerInventory, cardId],
        currentCardCount: buyer.currentCardCount + 1,
        highestCardCount: Math.max(buyer.highestCardCount, buyer.currentCardCount + 1),
        cardsBought: buyer.cardsBought + 1,
      }),
      ctx.db.patch(seller._id, {
        goldCount: seller.goldCount + price,
        highestGoldCount: Math.max(seller.highestGoldCount, seller.goldCount + price),
        inventory: sellerInventory.filter((id: string) => id !== cardId),
        currentCardCount: seller.currentCardCount - 1,
        cardsSold: (seller.cardsSold ?? 0) + 1,
      }),
      ctx.db.patch(cardId, {
        isListed: false,
        currentOwnerId: buyerId,
        currentOwnerUsername: buyer.username,
        boughtFor: price,
      })
    ]);

    return { success: true };
  },
});
