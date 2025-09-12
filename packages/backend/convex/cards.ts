import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { type Id, type Doc } from "./_generated/dataModel";

// Removed legacy scopes and helpers

// Removed legacy: getByIds (use user_cards + card_templates instead)

// Removed legacy: getUserInventory (use getMyUserCards)

// Legacy ownership mutation removed in V2

// Removed legacy: addCompleteCard (use card_templates creation instead)

// Removed legacy: addCardWithImage (use card_templates with storage instead)

// Removed legacy: filterCards helper

// V2: Create a card template from uploaded storage image and optional metadata
export const createTemplateV2 = mutation({
  args: {
    storageId: v.string(),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    atkPts: v.optional(v.number()),
    defPts: v.optional(v.number()),
    attribute: v.optional(v.string()),
    class: v.optional(v.string()),
    character: v.optional(v.string()),
    level: v.optional(v.number()),
    grantToCreator: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("createTemplateV2: unauthenticated");

    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!creator) throw new Error("createTemplateV2: user not found");

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl || typeof imageUrl !== "string") {
      throw new Error("createTemplateV2: invalid storageId or image url");
    }

    // Basic validations
    const typeLower = args.type.toLowerCase();
    if (!["monster", "spell", "trap"].includes(typeLower)) {
      throw new Error("createTemplateV2: type must be monster|spell|trap");
    }
    if (typeLower === "monster") {
      const atkOk = args.atkPts === undefined || (Number.isFinite(args.atkPts) && args.atkPts >= 0 && args.atkPts <= 5000);
      const defOk = args.defPts === undefined || (Number.isFinite(args.defPts) && args.defPts >= 0 && args.defPts <= 5000);
      const lvlOk = args.level === undefined || (Number.isFinite(args.level) && args.level >= 0 && args.level <= 10);
      if (!atkOk || !defOk || !lvlOk) throw new Error("createTemplateV2: invalid monster stats");
    }

    const templateId = await ctx.db.insert("card_templates", {
      name: args.name,
      type: typeLower,
      description: args.description,
      imageUrl,
      atkPts: args.atkPts,
      defPts: args.defPts,
      inGameAtkPts: undefined,
      inGameDefPts: undefined,
      attribute: args.attribute,
      class: args.class,
      character: args.character,
      level: args.level,
      matches: { wins: 0, total: 0 },
      cardWin: { global: 0, local: 0 },
      cardLose: { global: 0, local: 0 },
    });

    // Persist a workshop entry for audit/future features
    await ctx.db.insert("workshop_cards", {
      uploaderId: creator._id as Id<"users">,
      serverId: creator.serverId as Id<"servers">,
      storageId: args.storageId,
      imageUrl,
      name: args.name,
      type: typeLower,
      description: args.description,
      atkPts: args.atkPts,
      defPts: args.defPts,
      attribute: args.attribute,
      class: args.class,
      character: args.character,
      level: args.level,
      createdAt: new Date().toISOString(),
      templateId: templateId as Id<"card_templates">,
    });

    // Optionally grant one copy to creator on their server
    if (args.grantToCreator && creator.serverId) {
      const existing: Doc<"user_cards">[] = await ctx.db
        .query("user_cards")
        .withIndex("by_server_user", (q) => q.eq("serverId", creator.serverId as Id<"servers">).eq("userId", creator._id as Id<"users">))
        .collect();
      const same = existing.find((uc) => String(uc.cardTemplateId) === String(templateId));
      if (same) {
        await ctx.db.patch(same._id, { quantity: (same.quantity ?? 0) + 1 });
      } else {
        await ctx.db.insert("user_cards", {
          userId: creator._id as Id<"users">,
          serverId: creator.serverId as Id<"servers">,
          cardTemplateId: templateId as Id<"card_templates">,
          quantity: 1,
          acquiredAt: new Date().toISOString(),
        });
      }
    }

    return { templateId };
  },
});

// Legacy listings query removed in V2

// Legacy setListingStatus removed in V2

// V2 helpers for frontend
export const getAllTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("card_templates")
      .order("desc")
      .take(500);
    return templates.map((t) => ({
      _id: t._id,
      name: t.name,
      type: t.type,
      description: t.description ?? "",
      imageUrl: t.imageUrl,
      atkPts: t.atkPts ?? 0,
      defPts: t.defPts ?? 0,
      attribute: t.attribute ?? null,
      level: t.level ?? null,
    }));
  },
});

// Dictionary templates: global templates + server-scoped workshop templates
export const getDictionaryTemplates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("getDictionaryTemplates: unauthenticated");
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("getDictionaryTemplates: user not found");

    // Global templates (not server-scoped)
    const globalTemplates = await ctx.db
      .query("card_templates")
      .order("desc")
      .take(500);

    // Server-scoped workshop templates: find workshop_cards on my server, expand to templates
    let serverWorkshopTemplates: Array<Doc<"card_templates">> = [];
    if (me.serverId) {
      const workshop = await ctx.db
        .query("workshop_cards")
        .withIndex("by_server_createdAt", (q) => q.eq("serverId", me.serverId))
        .take(500);
      const templateIds = Array.from(new Set(
        workshop
          .map((w) => w.templateId)
          .filter((id): id is Id<"card_templates"> => !!id)
          .map((id) => String(id))
      ));

      if (templateIds.length > 0) {
        const fetched: Array<Doc<"card_templates"> | null> = await Promise.all(
          templateIds.map(async (tidStr) => ctx.db.get(tidStr as unknown as Id<"card_templates">))
        );
        serverWorkshopTemplates = fetched.filter((t): t is Doc<"card_templates"> => !!t);
      }
    }

    const mapOut = (t: Doc<"card_templates">) => ({
      _id: t._id,
      name: t.name,
      type: t.type,
      description: t.description ?? "",
      imageUrl: t.imageUrl,
      atkPts: t.atkPts ?? 0,
      defPts: t.defPts ?? 0,
      attribute: t.attribute ?? null,
      level: t.level ?? null,
    });

    return {
      globalTemplates: globalTemplates.map(mapOut),
      serverWorkshopTemplates: serverWorkshopTemplates.map(mapOut),
    };
  },
});

export const getMyUserCards = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("getMyUserCards: unauthenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me?.serverId) return [];

    const userCards = await ctx.db
      .query("user_cards")
      .withIndex("by_server_user", (q) => q.eq("serverId", me.serverId!).eq("userId", me._id))
      .collect();

    const enriched = await Promise.all(
      userCards.map(async (uc) => {
        const tmpl = await ctx.db.get(uc.cardTemplateId as Id<"card_templates">);
        // Compute an estimated value: median of active listings for this template on this server
        let estimatedValue: number | null = null;
        const listings = await ctx.db
          .query("listings")
          .withIndex("by_server_status", (q) => q.eq("serverId", uc.serverId).eq("status", "active"))
          .collect();
        const prices = listings
          .filter((l) => String(l.userCardId) !== String(uc._id))
          .map((l) => l.price)
          .filter((p) => typeof p === "number");
        if (prices.length > 0) {
          const sorted = prices.slice().sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          estimatedValue = sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
        }

        return {
          userCardId: uc._id,
          quantity: uc.quantity,
          estimatedValue,
          boughtFor: 0,
          template: tmpl
            ? {
                id: tmpl._id,
                name: tmpl.name,
                type: tmpl.type,
                imageUrl: tmpl.imageUrl,
                atkPts: tmpl.atkPts ?? 0,
                defPts: tmpl.defPts ?? 0,
                attribute: tmpl.attribute ?? null,
                level: tmpl.level ?? null,
                matches: tmpl.matches ?? { wins: 0, total: 0 },
                cardWin: tmpl.cardWin ?? { global: 0, local: 0 },
                cardLose: tmpl.cardLose ?? { global: 0, local: 0 },
              }
            : null,
        };
      })
    );

    return enriched;
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

// Legacy purchaseCard removed in V2

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
        const category: "trade" | "sale" = Number(l.price ?? 0) <= 1 ? "trade" : "sale";
        return {
          _id: l._id,
          userCardId: l.userCardId,
          price: l.price,
          status: l.status,
          createdAt: l.createdAt,
          category,
          seller: seller ? { id: seller._id, name: sellerName! } : null,
          template: template
            ? {
                id: template._id,
                name: template.name,
                type: template.type,
                description: template.description ?? "",
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

    // Prevent duplicate active listings for the same userCardId by the same seller
    const dup = await ctx.db
      .query("listings")
      .withIndex("by_userCard_status", (q) => q.eq("userCardId", userCardId as Id<"user_cards">).eq("status", "active"))
      .first();
    if (dup) throw new Error("createListingV2: card already listed");

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

export const unlistListingV2 = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("unlistListingV2: unauthenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("unlistListingV2: user not found");

    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("unlistListingV2: listing not found");
    if (String(listing.sellerId) !== String(me._id)) throw new Error("unlistListingV2: not your listing");
    if (listing.status !== "active") return { success: true };

    await ctx.db.patch(listingId, { status: "cancelled" });
    return { success: true };
  },
});
