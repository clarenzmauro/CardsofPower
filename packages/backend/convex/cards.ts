import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { type Id, type Doc } from "./_generated/dataModel";

const ListingsScope = v.union(
    v.literal("shop"),
    v.literal("trade"),
    v.literal("mine"),
    v.literal("my-trade"),
);

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
        return (await ctx.db.query("cards").collect()).slice(0, 100);
    },
});

export const getUnownedCount = query({
    handler: async (ctx: any) => {
        const unownedCards = await ctx.db
            .query("cards")
            .filter((q: any) => q.eq(q.field("isOwned"), false))
            .collect();
        
        const totalCards = await ctx.db.query("cards").collect();
        
        return {
            totalCards: totalCards.length,
            unownedCards: unownedCards.length,
            ownedCards: totalCards.length - unownedCards.length
        };
    },
});

/**
 * @description
 * Query to get multiple cards by their IDs
 * 
 * @receives data from:
 * - cardIds: array of card document IDs
 * 
 * @sends data to:
 * - showcase page: card data for display
 * 
 * @sideEffects:
 * - none
 */
export const getByIds = query({
    args: { cardIds: v.array(v.id("cards")) },
    handler: async (ctx, { cardIds }) => {
        if (!Array.isArray(cardIds)) {
            throw new Error("getByIds: cardIds must be an array");
        }
        
        const cards = await Promise.all(
            cardIds.map(async (cardId) => {
                const card = await ctx.db.get(cardId);
                if (!card) {
                    throw new Error(`getByIds: Card not found: ${cardId}`);
                }
                return card;
            })
        );
        
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
    handler: async (ctx, args) => {
        if (!args.userId) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
            .first();
        if (!user) return [];

        if (!Array.isArray(user.inventory)) {
            throw new Error("getUserInventory: inventory must be an array");
        }

        // Use the inventory array to get cards by their IDs
        if (user.inventory.length === 0) return [];
        
        const cards = await Promise.all(
            user.inventory.map(async (cardId: any) => {
                return await ctx.db.get(cardId);
            })
        );

        // Filter out any null results and ensure all cards exist
        const validCards = cards.filter(card => card !== null);
        
        if (!Array.isArray(validCards)) throw new Error("getUserInventory: cards must be array");
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

const filterCards = (cards: any[], args: any, currentUserId: string) => {
    let filteredCards = cards;

    if (args.minPrice !== undefined) {
        filteredCards = filteredCards.filter(
            (card) => card.marketValue !== undefined && card.marketValue >= args.minPrice
        );
    }

    if (args.maxPrice !== undefined) {
        filteredCards = filteredCards.filter(
            (card) => card.marketValue !== undefined && card.marketValue <= args.maxPrice
        );
    }

    if (args.searchQuery) {
        const query = args.searchQuery.toLowerCase();
        filteredCards = filteredCards.filter((card) =>
            card.name.toLowerCase().includes(query)
        );
    }

    return filteredCards.slice(0, 100); // Safety limit
};

export const getListings = query({
  args: {
    scope: ListingsScope,
    searchQuery: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    let cards: any[] = [];
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.currentUserId))
      .unique();
    if (!me?.serverId) return [];

    if (args.scope === "shop") {
      cards = await ctx.db
        .query("cards")
        .withIndex("by_is_listed_market_value", (q) =>
          q
            .eq("isListed", true)
            .gte("marketValue", args.minPrice ?? 0)
            .lte("marketValue", args.maxPrice ?? Number.MAX_SAFE_INTEGER)
        )
        .collect();
      cards = cards.filter((card) => card.currentOwnerId !== args.currentUserId);
      // Server scoping: only show listings from same server
      const sellerIds = [...new Set(cards.map((c) => c.currentOwnerId).filter(Boolean))];
      const sellers = await Promise.all(
        sellerIds.map((cid) => ctx.db.query("users").withIndex("byExternalId", (q: any) => q.eq("externalId", String(cid))).unique())
      );
      const sameServerSellerIds = new Set(
        sellers.filter((u: any) => u?.serverId && String(u.serverId) === String(me.serverId)).map((u: any) => String(u.clerkId ?? u.externalId))
      );
      cards = cards.filter((c) => sameServerSellerIds.has(String(c.currentOwnerId)));
    } else if (args.scope === "trade") {
      cards = await ctx.db
        .query("cards")
        .withIndex("by_is_for_trade_market_value", (q) =>
          q
            .eq("isForTrade", true)
            .gte("marketValue", args.minPrice ?? 0)
            .lte("marketValue", args.maxPrice ?? Number.MAX_SAFE_INTEGER)
        )
        .collect();
      cards = cards.filter((card) => card.currentOwnerId !== args.currentUserId);
      const sellerIds = [...new Set(cards.map((c) => c.currentOwnerId).filter(Boolean))];
      const sellers = await Promise.all(
        sellerIds.map((cid) => ctx.db.query("users").withIndex("byExternalId", (q: any) => q.eq("externalId", String(cid))).unique())
      );
      const sameServerSellerIds = new Set(
        sellers.filter((u: any) => u?.serverId && String(u.serverId) === String(me.serverId)).map((u: any) => String(u.clerkId ?? u.externalId))
      );
      cards = cards.filter((c) => sameServerSellerIds.has(String(c.currentOwnerId)));
    } else if (args.scope === "mine") {
      cards = await ctx.db
        .query("cards")
        .withIndex("by_owner", (q) =>
          q.eq("currentOwnerId", args.currentUserId)
        )
        .collect();
      cards = cards.filter((card) => card.isListed);
    } else if (args.scope === "my-trade") {
      cards = await ctx.db
        .query("cards")
        .withIndex("by_owner", (q) =>
          q.eq("currentOwnerId", args.currentUserId)
        )
        .collect();
      cards = cards.filter((card) => card.isForTrade === true);
    }

    if (!Array.isArray(cards)) throw new Error("getListings: cards must be an array");

    return filterCards(cards, args, args.currentUserId);
  },
});

export const setListingStatus = mutation({
  args: {
    cardId: v.id("cards"),
    mode: v.union(v.literal("sale"), v.literal("trade"), v.literal("unlist")),
    price: v.optional(v.number()),
    ownerId: v.string(),
  },
  handler: async (ctx, { cardId, mode, price, ownerId }) => {
    const card = await ctx.db.get(cardId);
    if (!card) throw new Error("setListingStatus: Card not found");
    if (card.currentOwnerId !== ownerId) {
      throw new Error("setListingStatus: Not card owner");
    }

    let isListed = false;
    let isForTrade = false;
    let marketValue: number | undefined;

    if (mode === "sale") {
      if (price === undefined || price <= 0) throw new Error("setListingStatus: Invalid price for sale");
      isListed = true;
      marketValue = price;
      isForTrade = false;
    } else if (mode === "trade") {
      isForTrade = true;
      isListed = false;
      marketValue = undefined;
    } else if (mode === "unlist") {
      isListed = false;
      marketValue = undefined;
      isForTrade = false;
    }

    await ctx.db.patch(cardId, {
      isListed,
      marketValue,
      isForTrade,
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
    if (!buyer.serverId || !seller.serverId || String(buyer.serverId) !== String(seller.serverId)) {
      throw new Error("purchaseCard: cross-server purchase denied");
    }
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

// V2: Server-scoped marketplace using listings/user_cards/card_templates
export const getServerListingsV2 = query({
  args: {
    scope: v.optional(v.union(v.literal("active"), v.literal("sold"), v.literal("cancelled"))),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { scope = "active", limit = 50 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("getServerListingsV2: unauthenticated");
    const me: Doc<"users"> | null = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me?.serverId) return [];

    const listings: Doc<"listings">[] = await ctx.db
      .query("listings")
      .withIndex("by_server_status", (q) => q.eq("serverId", me.serverId as Id<"servers">).eq("status", scope))
      .order("desc")
      .take(Math.max(1, Math.min(100, limit)));

    const results = await Promise.all(
      listings.map(async (l: Doc<"listings">) => {
        const [userCard, seller]: [Doc<"user_cards"> | null, Doc<"users"> | null] = await Promise.all([
          ctx.db.get(l.userCardId as Id<"user_cards">),
          ctx.db.get(l.sellerId as Id<"users">),
        ]);
        const templateId: Id<"card_templates"> | undefined = userCard?.cardTemplateId as Id<"card_templates"> | undefined;
        const template: Doc<"card_templates"> | null = templateId ? await ctx.db.get(templateId) : null;
        const sellerName: string | null = seller ? (seller.username ?? seller.name ?? "Player") : null;
        return {
          _id: l._id,
          price: l.price,
          status: l.status,
          createdAt: l.createdAt,
          seller: seller ? { id: seller._id, name: sellerName! } : null,
          template: template
            ? {
                id: template._id,
                name: template.name,
                type: template.type,
                imageUrl: template.imageUrl,
                atkPts: template.atkPts,
                defPts: template.defPts,
                attribute: template.attribute,
                level: template.level,
              }
            : null,
        };
      })
    );

    return results;
  },
});

export const createListingV2 = mutation({
  args: {
    userCardId: v.id("user_cards"),
    price: v.number(),
  },
  handler: async (ctx, { userCardId, price }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("createListingV2: unauthenticated");
    if (!Number.isFinite(price) || price <= 0) throw new Error("createListingV2: invalid price");

    const me: Doc<"users"> | null = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me?.serverId) throw new Error("createListingV2: user has no server");

    const userCard: Doc<"user_cards"> | null = await ctx.db.get(userCardId as Id<"user_cards">);
    if (!userCard) throw new Error("createListingV2: user card not found");
    if (String(userCard.userId) !== String(me._id)) throw new Error("createListingV2: not owner");
    if (String(userCard.serverId) !== String(me.serverId)) throw new Error("createListingV2: cross-server listing denied");
    if (!Number.isFinite(userCard.quantity) || userCard.quantity <= 0) throw new Error("createListingV2: no quantity to list");

    const listingId = await ctx.db.insert("listings", {
      serverId: me.serverId as Id<"servers">,
      sellerId: me._id as Id<"users">,
      userCardId: userCardId as Id<"user_cards">,
      price,
      status: "active",
      createdAt: new Date().toISOString(),
    });

    return { listingId };
  },
});

export const purchaseListingV2 = mutation({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, { listingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("purchaseListingV2: unauthenticated");
    const me: Doc<"users"> | null = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me?.serverId) throw new Error("purchaseListingV2: user has no server");

    const listing: Doc<"listings"> | null = await ctx.db.get(listingId as Id<"listings">);
    if (!listing) throw new Error("purchaseListingV2: listing not found");
    if (listing.status !== "active") throw new Error("purchaseListingV2: listing not active");
    if (String(listing.serverId) !== String(me.serverId)) throw new Error("purchaseListingV2: cross-server purchase denied");
    if (String(listing.sellerId) === String(me._id)) throw new Error("purchaseListingV2: cannot buy own listing");

    const [seller, userCard]: [Doc<"users"> | null, Doc<"user_cards"> | null] = await Promise.all([
      ctx.db.get(listing.sellerId as Id<"users">),
      ctx.db.get(listing.userCardId as Id<"user_cards">),
    ]);
    if (!seller || !userCard) throw new Error("purchaseListingV2: seller or user card missing");
    if (me.goldCount < listing.price) throw new Error("purchaseListingV2: insufficient gold");

    // Transfer: decrement seller quantity, increment or create buyer user_card
    const templateId: Id<"card_templates"> = userCard.cardTemplateId as Id<"card_templates">;
    const buyerExisting: Doc<"user_cards">[] = await ctx.db
      .query("user_cards")
      .withIndex("by_server_user", (q) => q.eq("serverId", me.serverId as Id<"servers">).eq("userId", me._id as Id<"users">))
      .collect();
    const sameTemplate = buyerExisting.find((uc) => String(uc.cardTemplateId) === String(templateId));

    await Promise.all([
      ctx.db.patch(me._id, {
        goldCount: me.goldCount - listing.price,
        highestGoldCount: Math.max(me.highestGoldCount, me.goldCount - listing.price),
        currentCardCount: me.currentCardCount + 1,
        highestCardCount: Math.max(me.highestCardCount, me.currentCardCount + 1),
        cardsBought: (me.cardsBought ?? 0) + 1,
      }),
      ctx.db.patch(seller._id, {
        goldCount: seller.goldCount + listing.price,
        highestGoldCount: Math.max(seller.highestGoldCount, seller.goldCount + listing.price),
        currentCardCount: Math.max(0, seller.currentCardCount - 1),
        cardsSold: (seller.cardsSold ?? 0) + 1,
      }),
      ctx.db.patch(listingId as Id<"listings">, { status: "sold" }),
      ctx.db.patch(userCard._id as Id<"user_cards">, { quantity: Math.max(0, (userCard.quantity ?? 0) - 1) }),
      (async () => {
        if (sameTemplate) {
          await ctx.db.patch(sameTemplate._id as Id<"user_cards">, { quantity: (sameTemplate.quantity ?? 0) + 1 });
        } else {
          await ctx.db.insert("user_cards", {
            userId: me._id as Id<"users">,
            serverId: me.serverId as Id<"servers">,
            cardTemplateId: templateId as Id<"card_templates">,
            quantity: 1,
            acquiredAt: new Date().toISOString(),
          });
        }
      })(),
    ]);

    return { success: true };
  },
});
