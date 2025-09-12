import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  servers: defineTable({
    name: v.string(),
    capacity: v.number(),
    memberCount: v.number(),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdAt: v.string(),
  })
    .index("by_status_memberCount", ["status", "memberCount"]) 
    .index("by_status_createdAt", ["status", "createdAt"]),

  // Card templates are global definitions, not owned by users
  card_templates: defineTable({
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

    // Statistics (template-level, aggregated elsewhere)
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
    .index("by_name_type", ["name", "type"]) 
    .index("by_attribute", ["attribute"]) 
    .index("by_class", ["class"]) 
    .index("by_character", ["character"]) 
    .index("by_level", ["level"]),

  // Per-user ownership of card templates, scoped to a server
  user_cards: defineTable({
    userId: v.id("users"),
    serverId: v.id("servers"),
    cardTemplateId: v.id("card_templates"),
    quantity: v.number(),
    acquiredAt: v.string(),
  })
    .index("by_user", ["userId"]) 
    .index("by_server_user", ["serverId", "userId"]) 
    .index("by_template", ["cardTemplateId"]),

  // Server-scoped listings for marketplace transactions
  listings: defineTable({
    serverId: v.id("servers"),
    sellerId: v.id("users"),
    userCardId: v.id("user_cards"),
    price: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("cancelled")
    ),
    createdAt: v.string(),
  })
    .index("by_server_createdAt", ["serverId", "createdAt"]) 
    .index("by_server_status", ["serverId", "status"]) 
    .index("by_seller_status", ["sellerId", "status"]),

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
    serverId: v.optional(v.id("servers")),
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
    hasSeenShowcase: v.optional(v.boolean()),
  })
    .index("byExternalId", ["externalId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_serverId", ["serverId"])
    .searchIndex("by_username", {
      searchField: "username",
    })
    .index("by_highest_gold_count", ["highestGoldCount"])
    .index("by_current_card_count", ["currentCardCount"]),

  friends: defineTable({
    serverId: v.optional(v.id("servers")),
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
    ])
    .index("by_server_userOne_status_timestamp", [
      "serverId",
      "userOneId",
      "status",
      "lastMessageTimestamp",
    ])
    .index("by_server_userTwo_status_timestamp", [
      "serverId",
      "userTwoId",
      "status",
      "lastMessageTimestamp",
    ]),

  mails: defineTable({
    serverId: v.optional(v.id("servers")),
    recipientId: v.optional(v.id("users")),
    subject: v.string(),
    content: v.string(),
    preview: v.optional(v.string()),
    isRead: v.boolean(),
    sentAt: v.string(),
    isSystem: v.optional(v.boolean()),
  })
    .index("by_recipientId_sentAt", ["recipientId", "sentAt"])
    .index("by_isSystem_sentAt", ["isSystem", "sentAt"]) 
    .index("by_server_sentAt", ["serverId", "sentAt"]),

  messages: defineTable({
    serverId: v.optional(v.id("servers")),
    conversationId: v.id("friends"),
    senderId: v.id("users"),
    content: v.string(),
    timestamp: v.string(),
    isSystem: v.optional(v.boolean()),
    isRead: v.optional(v.boolean()),
  })
    .index("by_conversationId_timestamp", ["conversationId", "timestamp"]) 
    .index("by_server_conversation_timestamp", ["serverId", "conversationId", "timestamp"]),
  trades: defineTable({
    serverId: v.optional(v.id("servers")),
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
    .index("by_createdAt", ["createdAt"]) 
    .index("by_server_status", ["serverId", "status"]) 
    .index("by_server_createdAt", ["serverId", "createdAt"]),
  user_snapshots: defineTable({
    userId: v.string(),
    ts: v.string(),
    goldCount: v.number(),
    currentCardCount: v.number(),
  })
    .index("by_user_ts", ["userId", "ts"]),

  battles: defineTable({
    serverId: v.optional(v.id("servers")),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("completed")),
    createdAt: v.string(),
    lastActionAt: v.string(),
    lastActionIdempotencyKey: v.optional(v.string()),
    hasStarted: v.boolean(),
    isPaused: v.optional(v.boolean()),
    pausedAt: v.optional(v.string()),
    hostId: v.id("users"),
    opponentId: v.optional(v.id("users")),
    currentTurnPlayerId: v.id("users"),
    turnNumber: v.number(),
    turnEndsAt: v.string(),
    turnDurationSec: v.number(),
    winnerId: v.optional(v.id("users")),
    playerARejoinDeadline: v.optional(v.string()),
    playerBRejoinDeadline: v.optional(v.string()),
    preparation: v.object({
      isActive: v.boolean(),
      durationSec: v.number(),
      endsAt: v.optional(v.string()),
      playerAReady: v.boolean(),
      playerBReady: v.boolean(),
    }),
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
          position: v.optional(v.union(v.literal("attack"), v.literal("defense"))),
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
          position: v.optional(v.union(v.literal("attack"), v.literal("defense"))),
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
    .index("by_server_status_createdAt", ["serverId", "status", "createdAt"])
    .index("by_hostId_status", ["hostId", "status"])
    .index("by_opponentId_status", ["opponentId", "status"]),

  presence: defineTable({
    user: v.id("users"),
    updatedAt: v.string(),
  })
    .index("by_user", ["user"]),
});
