import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const backfillServers = internalMutation({
  args: {
    capacity: v.optional(v.number()),
    namePrefix: v.optional(v.string()),
  },
  handler: async (ctx, { capacity = 10, namePrefix = "server" }) => {
    // Ensure at least one active server exists
    const activeServers = await ctx.db
      .query("servers")
      .withIndex("by_status_memberCount", (q) => q.eq("status", "active"))
      .collect();
    if (activeServers.length === 0) {
      await ctx.db.insert("servers", {
        name: `${namePrefix}-1`,
        capacity,
        memberCount: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }
  },
});

export const assignUsersToServersBatch = internalMutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    // Find users missing serverId
    const users = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.gte("clerkId", ""))
      .collect();
    const toAssign = users.filter((u: any) => u.serverId === undefined).slice(0, limit);
    if (toAssign.length === 0) return { assigned: 0 };

    for (const user of toAssign) {
      // Pick an active server with space
      let server = await ctx.db
        .query("servers")
        .withIndex("by_status_memberCount", (q) => q.eq("status", "active"))
        .order("asc")
        .first();

      if (!server || server.memberCount >= server.capacity) {
        // Create a new server
        const countActive = await ctx.db
          .query("servers")
          .withIndex("by_status_createdAt", (q) => q.eq("status", "active"))
          .collect();
        const name = `server-${countActive.length + 1}`;
        const serverId = await ctx.db.insert("servers", {
          name,
          capacity: 10,
          memberCount: 0,
          status: "active",
          createdAt: new Date().toISOString(),
        });
        server = await ctx.db.get(serverId);
      }

      if (!server) continue;

      await ctx.db.patch(server._id, { memberCount: server.memberCount + 1 });
      await ctx.db.patch(user._id, { serverId: server._id });
    }
    return { assigned: toAssign.length };
  },
});

export const materializeCardTemplates = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 200 }) => {
    const cards = await ctx.db.query("cards").take(limit);
    let created = 0;
    for (const card of cards) {
      // Check template exists by name+type
      const existing = await ctx.db
        .query("card_templates")
        .withIndex("by_name_type", (q) => q.eq("name", card.name).eq("type", card.type))
        .unique();
      if (!existing) {
        await ctx.db.insert("card_templates", {
          name: card.name,
          type: card.type,
          description: card.description,
          imageUrl: card.imageUrl,
          atkPts: card.atkPts,
          defPts: card.defPts,
          inGameAtkPts: card.inGameAtkPts,
          inGameDefPts: card.inGameDefPts,
          attribute: card.attribute,
          class: card.class,
          character: card.character,
          level: card.level,
          matches: card.matches,
          cardWin: card.cardWin,
          cardLose: card.cardLose,
        });
        created += 1;
      }
    }
    return { created };
  },
});

export const createUserCardsFromOwned = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 200 }) => {
    // Find owned cards
    const owned = await ctx.db
      .query("cards")
      .withIndex("by_owner", (q) => q.gte("currentOwnerId", ""))
      .collect();
    const slice = owned.slice(0, limit);
    let created = 0;
    for (const card of slice) {
      if (card.isOwned !== true || !card.currentOwnerId) continue;

      // Resolve user by matching currentOwnerId to either externalId or _id string
      const ownerExternal = await ctx.db
        .query("users")
        .withIndex("byExternalId", (q) => q.eq("externalId", String(card.currentOwnerId)))
        .unique();
      let user = ownerExternal;
      if (!user) {
        // Fallback: maybe currentOwnerId already is a users doc id string
        try {
          const possible = await ctx.db.get(card.currentOwnerId as any);
          if (possible && possible._id && (possible as any).email) {
            user = possible as any;
          }
        } catch {}
      }
      if (!user) continue;

      // Ensure user has serverId
      if (!user.serverId) {
        const active = await ctx.db
          .query("servers")
          .withIndex("by_status_memberCount", (q) => q.eq("status", "active"))
          .order("asc")
          .first();
        if (active) {
          await ctx.db.patch(user._id, { serverId: active._id });
          await ctx.db.patch(active._id, { memberCount: active.memberCount + 1 });
          user = await ctx.db.get(user._id);
        }
      }

      // Find template
      const template = await ctx.db
        .query("card_templates")
        .withIndex("by_name_type", (q) => q.eq("name", card.name).eq("type", card.type))
        .unique();
      if (!template || !user?.serverId) continue;

      // Create one row per card
      await ctx.db.insert("user_cards", {
        userId: user._id,
        serverId: user.serverId,
        cardTemplateId: template._id,
        quantity: 1,
        acquiredAt: new Date().toISOString(),
      });
      created += 1;
    }
    return { created };
  },
});


