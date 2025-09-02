import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	cards: defineTable({
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
	}).index("by_type", ["type"])
	 .index("by_attribute", ["attribute"])
	 .index("by_class", ["class"])
	 .index("by_character", ["character"])
	 .index("by_level", ["level"])
	 .index("by_owner", ["currentOwnerId"]),

	users: defineTable({
		name: v.optional(v.string()),
		externalId: v.optional(v.string()),
		clerkId: v.optional(v.string()),
		username: v.optional(v.string()),
		email: v.optional(v.string()),
		goldCount: v.number(),
		highestGoldCount: v.number(),
		inventory: v.array(v.string()),
		currentCardCount: v.number(),
		highestCardCount: v.number(),
		gamesPlayed: v.number(),
		gamesWon: v.number(),
		gamesLost: v.number(),
		cardsCreated: v.number(),
		cardsBought: v.number(),
		cardsTraded: v.number(),
		profPicUrl: v.string(),
		dateCreated: v.string()
	}).index("byExternalId", ["externalId"])
	 .index("by_clerk_id", ["clerkId"]),
});
