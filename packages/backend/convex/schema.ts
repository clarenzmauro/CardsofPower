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
    isForTrade: v.optional(v.boolean()),
    currentOwnerId: v.optional(v.string()),
    currentOwnerUsername: v.optional(v.string()),
    boughtFor: v.optional(v.number()),
    marketValue: v.optional(v.number()),
    marketCount: v.optional(v.number()),
    roi: v.optional(v.number()),
    passCount: v.optional(v.number()),

    // Statistics
    matches: v.optional(
      v.object({
        wins: v.number(),
        total: v.number(),
      })
    ),
    cardWin: v.optional(
      v.object({
        global: v.number(),
        local: v.number(),
      })
    ),
    cardLose: v.optional(
      v.object({
        global: v.number(),
        local: v.number(),
      })
    ),
  })
    .index("by_type", ["type"])
    .index("by_attribute", ["attribute"])
    .index("by_class", ["class"])
    .index("by_character", ["character"])
    .index("by_level", ["level"])
    .index("by_owner", ["currentOwnerId"])
    .index("by_is_listed_market_value", ["isListed", "marketValue"])
    .index("by_is_for_trade_market_value", ["isForTrade", "marketValue"]),

  users: defineTable({
    name: v.optional(v.string()),
    externalId: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    goldCount: v.number(),
    highestGoldCount: v.number(),
    inventory: v.array(v.string()),
    friendIds: v.optional(v.array(v.string())),
    currentCardCount: v.number(),
    highestCardCount: v.number(),
    gamesPlayed: v.number(),
    gamesWon: v.number(),
    gamesLost: v.number(),
    cardsCreated: v.number(),
    cardsBought: v.number(),
    cardsSold: v.optional(v.number()),
    cardsTraded: v.number(),
    profPicUrl: v.string(),
    dateCreated: v.string(),
    isOnline: v.optional(v.boolean()),
  })
    .index("byExternalId", ["externalId"])
    .index("by_clerk_id", ["clerkId"])
    .searchIndex("by_username", {
      searchField: "username",
    })
    .index("by_highest_gold_count", ["highestGoldCount"])
    .index("by_current_card_count", ["currentCardCount"]),

  friends: defineTable({
    userOneId: v.id("users"),
    userTwoId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked")
    ),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageTimestamp: v.optional(v.string()),
    createdAt: v.string(),
    isOnline: v.optional(v.boolean()),
  })
    .index("by_userOneId_userTwoId", ["userOneId", "userTwoId"])
    .index("by_userTwoId_userOneId", ["userTwoId", "userOneId"])
    .index("by_userOneId_status_timestamp", [
      "userOneId",
      "status",
      "lastMessageTimestamp",
    ])
    .index("by_userTwoId_status_timestamp", [
      "userTwoId",
      "status",
      "lastMessageTimestamp",
    ]),

  mails: defineTable({
    recipientId: v.optional(v.id("users")),
    subject: v.string(),
    content: v.string(),
    preview: v.optional(v.string()),
    isRead: v.boolean(),
    sentAt: v.string(),
    isSystem: v.optional(v.boolean()),
  })
    .index("by_recipientId_sentAt", ["recipientId", "sentAt"])
    .index("by_isSystem_sentAt", ["isSystem", "sentAt"]),

  messages: defineTable({
    conversationId: v.id("friends"),
    senderId: v.id("users"),
    content: v.string(),
    timestamp: v.string(),
    isSystem: v.optional(v.boolean()),
    isRead: v.optional(v.boolean()),
  }).index("by_conversationId_timestamp", ["conversationId", "timestamp"]),
  trades: defineTable({
    offerorId: v.id("users"),
    offerorCardId: v.id("cards"),
    receiverId: v.id("users"),
    receiverCardId: v.id("cards"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    createdAt: v.string(),
  })
    .index("by_offeror_status", ["offerorId", "status"])
    .index("by_receiver_status", ["receiverId", "status"])
    .index("by_offeror_receiver", ["offerorId", "receiverId"])
    .index("by_createdAt", ["createdAt"]),
  user_snapshots: defineTable({
    userId: v.string(),
    ts: v.string(),
    goldCount: v.number(),
    currentCardCount: v.number(),
  })
    .index("by_user_ts", ["userId", "ts"]),

  battles: defineTable({
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("completed")),
    createdAt: v.string(),
    lastActionAt: v.string(),
    lastActionIdempotencyKey: v.optional(v.string()),
    hostId: v.id("users"),
    opponentId: v.optional(v.id("users")),
    currentTurnPlayerId: v.id("users"),
    turnNumber: v.number(),
    turnEndsAt: v.string(),
    turnDurationSec: v.number(),
    winnerId: v.optional(v.id("users")),
    playerARejoinDeadline: v.optional(v.string()),
    playerBRejoinDeadline: v.optional(v.string()),
    playerA: v.object({
      userId: v.id("users"),
      name: v.string(),
      hp: v.number(),
      maxHp: v.number(),
      hand: v.array(v.object({
        id: v.string(),
        name: v.string(),
        type: v.union(v.literal("monster"), v.literal("spell"), v.literal("trap")),
        image: v.optional(v.string()),
      })),
      field: v.array(v.union(
        v.null(),
        v.object({
          id: v.string(),
          name: v.string(),
          type: v.union(v.literal("monster"), v.literal("spell"), v.literal("trap")),
          image: v.optional(v.string()),
        })
      )),
      graveyard: v.array(v.object({
        id: v.string(),
        name: v.string(),
        type: v.union(v.literal("monster"), v.literal("spell"), v.literal("trap")),
        image: v.optional(v.string()),
      })),
    }),
    playerB: v.object({
      userId: v.id("users"),
      name: v.string(),
      hp: v.number(),
      maxHp: v.number(),
      hand: v.array(v.object({
        id: v.string(),
        name: v.string(),
        type: v.union(v.literal("monster"), v.literal("spell"), v.literal("trap")),
        image: v.optional(v.string()),
      })),
      field: v.array(v.union(
        v.null(),
        v.object({
          id: v.string(),
          name: v.string(),
          type: v.union(v.literal("monster"), v.literal("spell"), v.literal("trap")),
          image: v.optional(v.string()),
        })
      )),
      graveyard: v.array(v.object({
        id: v.string(),
        name: v.string(),
        type: v.union(v.literal("monster"), v.literal("spell"), v.literal("trap")),
        image: v.optional(v.string()),
      })),
    }),
  })
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_hostId_status", ["hostId", "status"])
    .index("by_opponentId_status", ["opponentId", "status"]),

  presence: defineTable({
    user: v.id("users"),
    updatedAt: v.string(),
  })
    .index("by_user", ["user"]),
});
