import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { type Doc, type Id } from "./_generated/dataModel";

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

// Removed legacy: createUserCardsFromOwned (relied on legacy ownership fields)

// Removed legacy: backfillLegacyListingsToV2 (legacy ownership migration)



// Remove legacy fields from cards that no longer exist in the schema
// Fields scrubbed: currentOwnerId, currentOwnerUsername, isListed, isOwned, marketCount, marketValue, passCount, roi, boughtFor
export const scrubLegacyCardFields = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 500 }) => {
    const MAX = Math.max(1, Math.min(1000, Math.floor(limit)));
    const cards: Doc<"cards">[] = await ctx.db.query("cards").take(MAX);

    let updated = 0;
    for (const card of cards) {
      // Build patch only for fields present to avoid extra writes
      const patch: Partial<Record<string, unknown>> = {};
      const legacyKeys: Array<keyof typeof card> = [
        "currentOwnerId" as keyof typeof card,
        "currentOwnerUsername" as keyof typeof card,
        "isListed" as keyof typeof card,
        "isOwned" as keyof typeof card,
        "marketCount" as keyof typeof card,
        "marketValue" as keyof typeof card,
        "passCount" as keyof typeof card,
        "roi" as keyof typeof card,
        "boughtFor" as keyof typeof card,
      ];

      let needsPatch = false;
      for (const key of legacyKeys) {
        if (Object.prototype.hasOwnProperty.call(card, key)) {
          patch[String(key)] = undefined;
          needsPatch = true;
        }
      }

      // Normalize type to lowercase set {monster|spell|trap}
      if (typeof (card as Record<string, unknown>)["type"] === "string") {
        const t = String((card as Record<string, unknown>)["type"]).toLowerCase();
        if (t !== (card as unknown as { type: string }).type) {
          patch["type"] = t;
          needsPatch = true;
        }
      }

      if (needsPatch) {
        await ctx.db.patch(card._id, patch as Record<string, unknown>);
        updated += 1;
      }
    }

    return { scanned: cards.length, updated };
  },
});