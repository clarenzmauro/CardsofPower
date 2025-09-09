import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { type Id } from "./_generated/dataModel";

// Turn/presence constants
const DEFAULT_TURN_DURATION_SEC = 30; // server default; client may override at creation
const MAX_TURNS_PER_PLAYER = 5;
const MAX_TOTAL_TURNS = MAX_TURNS_PER_PLAYER * 2;
const OFFLINE_DETECT_MS = 1500;
const REJOIN_GRACE_MS = 30000;

function computeCountdownSeconds(endsIso?: string): number {
  if (!endsIso) return 0;
  const nowMs = Date.now();
  const endMs = new Date(endsIso).getTime();
  if (!Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.floor((endMs - nowMs) / 1000));
}

async function finalizeIfTurnCapReached(
  ctx: any,
  battleId: Id<"battles">,
  battle: any
) {
  if (!battle) return;
  if (battle.turnNumber <= MAX_TOTAL_TURNS) return;

  const playerA = battle.playerA;
  const playerB = battle.playerB;
  if (!playerA || !playerB) return;

  let winnerId: Id<"users"> | undefined = undefined;
  if (playerA.hp > playerB.hp) winnerId = playerA.userId;
  else if (playerB.hp > playerA.hp) winnerId = playerB.userId;

  await ctx.db.patch(battleId, {
    status: "completed",
    winnerId,
    lastActionAt: new Date().toISOString(),
  });
}

async function autoAdvanceTurnIfExpired(
  ctx: any,
  battleId: Id<"battles">
) {
  const battle = await ctx.db.get(battleId);
  if (!battle) throw new Error("Battle not found");
  if (battle.status !== "active") return battle;
  if (!battle.hasStarted) return battle;

  const nowMs = Date.now();
  const endsMs = new Date(battle.turnEndsAt).getTime();

  // Runtime assertions
  if (typeof battle.turnDurationSec !== "number" || battle.turnDurationSec <= 0) {
    throw new Error("Invalid turnDurationSec");
  }
  if (!battle.playerA?.userId || !battle.playerB?.userId) {
    throw new Error("Battle players not initialized");
  }

  if (battle.isPaused) return battle;
  if (Number.isFinite(endsMs) && nowMs >= endsMs) {
    const isCurrentA = battle.currentTurnPlayerId === battle.playerA.userId;
    const nextPlayerId = isCurrentA ? battle.playerB.userId : battle.playerA.userId;
    const newEndsAt = new Date(nowMs + battle.turnDurationSec * 1000).toISOString();

    await ctx.db.patch(battleId, {
      currentTurnPlayerId: nextPlayerId,
      turnNumber: battle.turnNumber + 1,
      turnEndsAt: newEndsAt,
      lastActionAt: new Date().toISOString(),
    });

    const updated = await ctx.db.get(battleId);
    await finalizeIfTurnCapReached(ctx, battleId, updated);
    return await ctx.db.get(battleId);
  }

  return battle;
}

async function enforceRejoinOrLose(ctx: any, battle: any) {
  if (battle.status !== "active") return;

  const now = new Date();
  const nowMs = now.getTime();
  const offlineThresholdIso = new Date(nowMs - OFFLINE_DETECT_MS).toISOString();
  const rejoinDeadlineIso = new Date(nowMs + REJOIN_GRACE_MS).toISOString();

  const [presenceA, presenceB] = await Promise.all([
    ctx.db.query("presence")
      .withIndex("by_user", (q: any) => q.eq("user", battle.playerA.userId))
      .first(),
    ctx.db.query("presence")
      .withIndex("by_user", (q: any) => q.eq("user", battle.playerB.userId))
      .first(),
  ]);

  const checkPlayer = async (
    playerId: Id<"users">,
    rejoinDeadlineField: "playerARejoinDeadline" | "playerBRejoinDeadline",
    opponentId: Id<"users">
  ) => {
    const presence = playerId === battle.playerA.userId ? presenceA : presenceB;
    if (!presence) return;

    const isOffline = presence.updatedAt < offlineThresholdIso;
    const deadline = battle[rejoinDeadlineField];

    if (isOffline && !deadline) {
      // Pause timer on first offline detection
      if (!battle.isPaused) {
        await ctx.db.patch(battle._id, { isPaused: true, pausedAt: now.toISOString() });
      }
      await ctx.db.patch(battle._id, { [rejoinDeadlineField]: rejoinDeadlineIso });
    } else if (deadline && now > new Date(deadline)) {
      await ctx.db.patch(battle._id, {
        status: "completed",
        winnerId: opponentId,
        lastActionAt: now.toISOString(),
      });
    } else if (!isOffline && deadline) {
      // Resume timer by pushing out the turnEndsAt by paused duration
      let updates: any = { [rejoinDeadlineField]: undefined };
      if (battle.isPaused && battle.pausedAt) {
        const pausedMs = now.getTime() - new Date(battle.pausedAt).getTime();
        const newEndsAt = new Date(new Date(battle.turnEndsAt).getTime() + pausedMs).toISOString();
        updates = { ...updates, isPaused: false, pausedAt: undefined, turnEndsAt: newEndsAt };
      }
      await ctx.db.patch(battle._id, updates);
    }
  };

  await Promise.all([
    checkPlayer(battle.playerA.userId, "playerARejoinDeadline", battle.playerB.userId),
    checkPlayer(battle.playerB.userId, "playerBRejoinDeadline", battle.playerA.userId),
  ]);
}


export const getBattle = query({
  args: { battleId: v.id("battles") },
  handler: async (ctx, { battleId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const battle = await ctx.db.get(battleId);
    if (!battle) throw new Error("Battle not found");

    const isPlayerA = battle.playerA.userId === user._id;
    const isPlayerB = battle.playerB.userId === user._id;
    if (!isPlayerA && !isPlayerB) throw new Error("Not a participant");

    const player = isPlayerA ? battle.playerA : battle.playerB;
    const enemy = isPlayerA ? battle.playerB : battle.playerA;

    const normalizeField = (field: any[]) => {
      const normalized = Array(5).fill(null);
      field.slice(0, 5).forEach((card, i) => (normalized[i] = card));
      return normalized;
    };

    const nowIso = new Date().toISOString();
    const isInPreparation = !!battle.preparation?.isActive;
    const prepCountdown = isInPreparation ? computeCountdownSeconds(battle.preparation?.endsAt) : 0;
    const turnCountdown = !isInPreparation ? computeCountdownSeconds(battle.turnEndsAt) : 0;
    const iAmReady = isPlayerA ? !!battle.preparation?.playerAReady : !!battle.preparation?.playerBReady;
    const opponentReady = isPlayerA ? !!battle.preparation?.playerBReady : !!battle.preparation?.playerAReady;

    // Build enemyField with masking for defense position
    const maskedEnemyField = normalizeField(enemy.field).map((c: any) => {
      if (c && c.position === "defense") {
        return {
          id: c.id,
          type: c.type,
          position: "defense",
          image: "/assets/cards/back-card.png",
          name: "Hidden Card",
        };
      }
      return c;
    });

    return {
      playerHand: player.hand.slice(0, 10),
      enemyHand: enemy.hand.slice(0, 10).map(card => ({
        id: card.id,
        name: 'Hidden Card',
        type: card.type
      })),
      playerField: normalizeField(player.field),
      enemyField: maskedEnemyField,
      playerGraveyard: player.graveyard.slice(0, 100),
      enemyGraveyard: enemy.graveyard.slice(0, 100),
      selectedCard: null,
      player: {
        name: player.name,
        hp: player.hp,
        maxHp: player.maxHp
      },
      enemy: {
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.maxHp
      },
      timer: {
        turnEndsAt: battle.turnEndsAt,
        turnDurationSec: battle.turnDurationSec ?? DEFAULT_TURN_DURATION_SEC
      },
      preparation: battle.preparation,
      status: battle.status,
      isPaused: !!battle.isPaused,
      currentTurnPlayerId: battle.currentTurnPlayerId,
      hasStarted: !!battle.hasStarted,
      youAre: isPlayerA ? "A" : "B",
      isMyTurn: battle.currentTurnPlayerId === user._id,
      serverNow: nowIso,
      isInPreparation,
      prepCountdown,
      turnCountdown,
      iAmReady,
      opponentReady,
    };
  }
});

export const submitPreparation = mutation({
  args: {
    battleId: v.id("battles"),
    lineup: v.array(v.object({
      slotIndex: v.number(),
      cardId: v.string(),
      position: v.union(v.literal("attack"), v.literal("defense")),
    })),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, { battleId, lineup, idempotencyKey }) => {
    const FIELD_SIZE = 5;
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const battle = await ctx.db.get(battleId);
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "active") throw new Error("Battle not active");
    if (!battle.preparation?.isActive) throw new Error("Preparation not active");

    // Validate lineup
    if (lineup.length > FIELD_SIZE) throw new Error("Too many cards in lineup");
    for (const item of lineup) {
      if (item.slotIndex < 0 || item.slotIndex >= FIELD_SIZE) throw new Error("Invalid slot index");
    }
    const slotSet = new Set(lineup.map(l => l.slotIndex));
    if (slotSet.size !== lineup.length) throw new Error("Duplicate slot indices");

    const isHost = battle.hostId === user._id;
    const playerKey = isHost ? "playerA" : "playerB";
    const readyKey = isHost ? "playerAReady" : "playerBReady";
    const player = battle[playerKey];
    if (!player) throw new Error("Player not found");

    const handIds = new Set(player.hand.map((c: any) => c.id));
    for (const item of lineup) {
      if (!handIds.has(item.cardId)) throw new Error("Card not in hand");
    }

    // Apply lineup: remove from hand, place in field
    const newField = [...player.field];
    const usedIds = new Set<string>();
    for (const item of lineup) {
      if (newField[item.slotIndex]) throw new Error("Slot already occupied");
      if (usedIds.has(item.cardId)) throw new Error("Duplicate cardId");
      usedIds.add(item.cardId);
      const card = player.hand.find((c: any) => c.id === item.cardId);
      if (!card) throw new Error("Card missing");
      newField[item.slotIndex] = { ...card, position: item.position } as any;
    }
    const newHand = player.hand.filter((c: any) => !usedIds.has(c.id));

    const updates: any = {
      [playerKey]: { ...player, hand: newHand, field: newField },
      preparation: { ...battle.preparation, [readyKey]: true },
      lastActionAt: new Date().toISOString(),
    };

    const bothReady = (isHost ? true : battle.preparation.playerAReady) && (isHost ? battle.preparation.playerBReady : true);
    if (bothReady) {
      updates.preparation = { ...updates.preparation, isActive: false };
      updates.hasStarted = true;
      updates.turnEndsAt = new Date(Date.now() + battle.turnDurationSec * 1000).toISOString();
    }

    await ctx.db.patch(battleId, updates);
  },
});

export const listOpenBattles = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const battles = await ctx.db
      .query("battles")
      .filter(q => q.eq(q.field("status"), "waiting"))
      .collect();

    return battles.map(battle => ({
      id: battle._id,
      playerA: {
        name: battle.playerA.name
      },
      createdAt: battle._creationTime
    }));
  }
});

export const listJoinableBattles = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const waiting = await ctx.db
      .query("battles")
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .collect();

    const activeAsHost = await ctx.db
      .query("battles")
      .withIndex("by_hostId_status", (q: any) => q.eq("hostId", user._id).eq("status", "active"))
      .collect();
    const activeAsOpponent = await ctx.db
      .query("battles")
      .withIndex("by_opponentId_status", (q: any) => q.eq("opponentId", user._id).eq("status", "active"))
      .collect();

    const rejoinable = [...activeAsHost, ...activeAsOpponent].filter((b) => !b.winnerId);

    return [
      ...waiting.map((battle) => ({
        id: battle._id,
        mode: "waiting" as const,
        playerA: { name: battle.playerA.name },
        createdAt: battle._creationTime,
      })),
      ...rejoinable.map((battle) => ({
        id: battle._id,
        mode: "rejoin" as const,
        playerA: { name: battle.playerA.name },
        createdAt: battle._creationTime,
      })),
    ];
  },
});

export const createBattle = mutation({
  args: {
    turnDurationSec: v.number(),
  },
  handler: async (ctx, { turnDurationSec }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (turnDurationSec <= 0) throw new Error("Invalid turn duration");

    const now = new Date().toISOString();
    const turnEndsAt = new Date(Date.now() + turnDurationSec * 1000).toISOString();

    // Build initial hand from user's actual inventory
    const MAX_HAND_SIZE = 10;
    const inventoryIds = Array.isArray(user.inventory) ? user.inventory.slice(0, MAX_HAND_SIZE) : [];
    const inventoryCards = await Promise.all(
      inventoryIds.map(async (cardId: any) => await ctx.db.get(cardId))
    );
    const initialHand = inventoryCards
      .filter((c: any) => !!c)
      .slice(0, MAX_HAND_SIZE)
      .map((c: any) => ({
        id: c._id as Id<"cards">,
        name: String(c.name ?? "Unknown"),
        type: (c.type === "monster" || c.type === "spell" || c.type === "trap") ? c.type : "monster",
        image: c.imageUrl as string | undefined,
      }));

    const FIELD_SIZE = 5;
    const battleId = await ctx.db.insert("battles", {
      status: "waiting",
      createdAt: now,
      lastActionAt: now,
      hasStarted: false,
      hostId: user._id,
      opponentId: undefined,
      currentTurnPlayerId: user._id,
      turnNumber: 1,
      turnEndsAt,
      turnDurationSec: turnDurationSec || DEFAULT_TURN_DURATION_SEC,
      preparation: {
        isActive: false,
        durationSec: 60, // dev; default should be 60
        endsAt: undefined,
        playerAReady: false,
        playerBReady: false,
      },
      playerA: {
        userId: user._id,
        name: user.username ?? "Player",
        hp: 8000,
        maxHp: 8000,
        hand: initialHand,
        field: Array(FIELD_SIZE).fill(null),
        graveyard: []
      },
      playerB: {
        userId: user._id,
        name: "Waiting...",
        hp: 8000,
        maxHp: 8000,
        hand: [],
        field: Array(FIELD_SIZE).fill(null),
        graveyard: []
      }
    });

    if (!battleId) throw new Error("Failed to create battle");
    return battleId;
  }
});

export const joinBattle = mutation({
  args: {
    battleId: v.id("battles"),
  },
  handler: async (ctx, { battleId }) => {
    const user = await getCurrentUser(ctx);
    const battle = await ctx.db.get(battleId);
    if (!battle) throw new Error("Battle not found");
    if (!user) throw new Error("Not authenticated");
    if (battle.hostId === user._id) throw new Error("Cannot join your own battle");
    if (battle.status !== "waiting") throw new Error("Battle not joinable");

    const FIELD_SIZE = 5;
    const MAX_HAND_SIZE = 10;
    const now = new Date();
    const turnEndsAt = new Date(now.getTime() + battle.turnDurationSec * 1000).toISOString();

    // Build opponent initial hand from their actual inventory
    const opponentInventoryIds = Array.isArray(user.inventory) ? user.inventory.slice(0, MAX_HAND_SIZE) : [];
    const opponentInventoryCards = await Promise.all(
      opponentInventoryIds.map(async (cardId: any) => await ctx.db.get(cardId))
    );
    const initialHand = opponentInventoryCards
      .filter((c: any) => !!c)
      .slice(0, MAX_HAND_SIZE)
      .map((c: any) => ({
        id: c._id as Id<"cards">,
        name: String(c.name ?? "Unknown"),
        type: (c.type === "monster" || c.type === "spell" || c.type === "trap") ? c.type : "monster",
        image: c.imageUrl as string | undefined,
      }));

    await ctx.db.patch(battleId, {
      status: "active",
      opponentId: user._id,
      currentTurnPlayerId: Math.random() > 0.5 ? battle.hostId : user._id,
      turnNumber: 1,
      turnEndsAt,
      hasStarted: false,
      preparation: {
        isActive: true,
        durationSec: battle.preparation?.durationSec ?? 15,
        endsAt: new Date(now.getTime() + (battle.preparation?.durationSec ?? 15) * 1000).toISOString(),
        playerAReady: false,
        playerBReady: false,
      },
      playerB: {
        userId: user._id,
        name: user.username ?? "Opponent",
        hp: 8000,
        maxHp: 8000,
        hand: initialHand,
        field: Array(FIELD_SIZE).fill(null),
        graveyard: []
      }
    });

    return battleId;
  }
});

export const beginBattle = mutation({
  args: { battleId: v.id("battles") },
  handler: async (ctx, { battleId }) => {
    const user = await getCurrentUser(ctx);
    const battle = await ctx.db.get(battleId);
    if (!battle) throw new Error("Battle not found");
    if (!user) throw new Error("Not authenticated");
    if (battle.status !== "active") throw new Error("Battle not active");
    if (battle.hasStarted) return;
    if (battle.preparation?.isActive) throw new Error("Cannot begin during preparation");

    // Require both players to be present before starting
    if (!battle.opponentId) throw new Error("Cannot start battle without opponent");
    
    // Only the currentTurnPlayer can begin
    if (battle.currentTurnPlayerId !== user._id) throw new Error("Only current player can begin");

    const turnEndsAt = new Date(Date.now() + battle.turnDurationSec * 1000).toISOString();
    await ctx.db.patch(battleId, {
      hasStarted: true,
      turnEndsAt,
      lastActionAt: new Date().toISOString(),
    });
  }
});

export const playCard = mutation({
  args: {
    battleId: v.id("battles"),
    fromHandIndex: v.number(),
    toSlotIndex: v.number(),
    position: v.optional(v.union(v.literal("attack"), v.literal("defense"))),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, { battleId, fromHandIndex, toSlotIndex, position, idempotencyKey }) => {
    const FIELD_SIZE = 5;
    const GRAVEYARD_LIMIT = 100;

    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    let battle = await autoAdvanceTurnIfExpired(ctx, battleId);
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "active") throw new Error("Battle not active");
    if (!battle.hasStarted) throw new Error("Battle has not begun");
    if (battle.isPaused) throw new Error("Battle is paused");
    if (battle.preparation?.isActive) throw new Error("Preparation active");
    if (battle.currentTurnPlayerId !== user._id) throw new Error("Not your turn");

    const player = battle.hostId === user._id ? battle.playerA : battle.playerB;
    if (!player) throw new Error("Player not found");

    if (fromHandIndex < 0 || fromHandIndex >= player.hand.length) throw new Error("Invalid hand index");
    if (toSlotIndex < 0 || toSlotIndex >= FIELD_SIZE) throw new Error("Invalid slot index");
    if (!player.hand[fromHandIndex]) throw new Error("No card at hand index");
    if (player.field[toSlotIndex]) throw new Error("Slot already occupied");

    if (battle.lastActionIdempotencyKey === idempotencyKey) return;

    const newHand = player.hand.filter((_: any, i: number) => i !== fromHandIndex);
    const newField = [...player.field];
    const baseCard = player.hand[fromHandIndex];
    newField[toSlotIndex] = position ? { ...baseCard, position } : baseCard;

    const updateKey = battle.hostId === user._id ? "playerA" : "playerB";
    await ctx.db.patch(battleId, {
      lastActionAt: new Date().toISOString(),
      lastActionIdempotencyKey: idempotencyKey,
      [updateKey]: {
        ...player,
        hand: newHand,
        field: newField,
        graveyard: player.graveyard.slice(-GRAVEYARD_LIMIT),
      },
    });
  },
});

export const sendToGraveyard = mutation({
  args: {
    battleId: v.id("battles"),
    fromSlotIndex: v.number(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, { battleId, fromSlotIndex, idempotencyKey }) => {
    const FIELD_SIZE = 5;
    const GRAVEYARD_LIMIT = 100;

    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    let battle = await autoAdvanceTurnIfExpired(ctx, battleId);
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "active") throw new Error("Battle not active");
    if (!battle.hasStarted) throw new Error("Battle has not begun");
    if (battle.isPaused) throw new Error("Battle is paused");
    if (battle.preparation?.isActive) throw new Error("Preparation active");
    if (battle.currentTurnPlayerId !== user._id) throw new Error("Not your turn");

    const player = battle.hostId === user._id ? battle.playerA : battle.playerB;
    if (!player) throw new Error("Player not found");

    if (fromSlotIndex < 0 || fromSlotIndex >= FIELD_SIZE) throw new Error("Invalid slot index");
    if (!player.field[fromSlotIndex]) throw new Error("No card at slot index");

    if (battle.lastActionIdempotencyKey === idempotencyKey) return;

    const card = player.field[fromSlotIndex];
    const newField = [...player.field];
    newField[fromSlotIndex] = null;
    const { position: _ignoredPosition, ...cardForGraveyard } = (card ?? {}) as any;
    const newGraveyard = [...player.graveyard, cardForGraveyard].slice(-GRAVEYARD_LIMIT);

    const updateKey = battle.hostId === user._id ? "playerA" : "playerB";
    await ctx.db.patch(battleId, {
      lastActionAt: new Date().toISOString(),
      lastActionIdempotencyKey: idempotencyKey,
      [updateKey]: {
        ...player,
        field: newField,
        graveyard: newGraveyard,
      },
    });
  },
});

export const updateHp = mutation({
  args: {
    battleId: v.id("battles"),
    target: v.union(v.literal("self"), v.literal("opponent")),
    delta: v.number(),
  },
  handler: async (ctx, { battleId, target, delta }) => {
    const user = await getCurrentUser(ctx);
    let battle = await autoAdvanceTurnIfExpired(ctx, battleId);
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "active") throw new Error("Battle not active");
    if (!battle.hasStarted) throw new Error("Battle has not begun");
    if (battle.isPaused) throw new Error("Battle is paused");
    if (battle.preparation?.isActive) throw new Error("Preparation active");

    const isHost = battle.hostId === user!._id;
    const playerKey = isHost ? "playerA" : "playerB";
    const opponentKey = isHost ? "playerB" : "playerA";
    const targetKey = target === "self" ? playerKey : opponentKey;

    const player = battle[playerKey];
    const opponent = battle[opponentKey];
    if (!player || !opponent) throw new Error("Player data missing");

    const targetPlayer = target === "self" ? player : opponent;
    const newHp = Math.max(0, Math.min(targetPlayer.maxHp, targetPlayer.hp + delta));

    const updates = {
      [targetKey]: {
        ...targetPlayer,
        hp: newHp,
      },
      lastActionAt: new Date().toISOString(),
    };

    if (newHp === 0) {
      updates.status = "completed";
      updates.winnerId = target === "self" ? opponent.userId : player.userId;
    }

    await ctx.db.patch(battleId, updates);
  },
});

export const endTurn = mutation({
  args: {
    battleId: v.id("battles"),
  },
  handler: async (ctx, { battleId }) => {
    const user = await getCurrentUser(ctx);
    const battle = await ctx.db.get(battleId);
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "active") throw new Error("Battle not active");
    if (!battle.hasStarted) throw new Error("Battle has not begun");
    if (battle.currentTurnPlayerId !== user!._id) throw new Error("Not your turn");
    if (battle.isPaused) throw new Error("Battle is paused");
    if (battle.preparation?.isActive) throw new Error("Preparation active");

    const isHost = battle.hostId === user!._id;
    const nextPlayerId = isHost ? battle.playerB.userId : battle.playerA.userId;
    const turnEndsAt = new Date(Date.now() + battle.turnDurationSec * 1000).toISOString();

    await ctx.db.patch(battleId, {
      currentTurnPlayerId: nextPlayerId,
      turnNumber: battle.turnNumber + 1,
      turnEndsAt,
      lastActionAt: new Date().toISOString(),
    });

    const updated = await ctx.db.get(battleId);
    await finalizeIfTurnCapReached(ctx, battleId, updated);
  },
});

// Toggle a card's position during battle
export const setCardPosition = mutation({
  args: {
    battleId: v.id("battles"),
    slotIndex: v.number(),
    position: v.union(v.literal("attack"), v.literal("defense")),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, { battleId, slotIndex, position, idempotencyKey }) => {
    const FIELD_SIZE = 5;
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    let battle = await autoAdvanceTurnIfExpired(ctx, battleId);
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "active") throw new Error("Battle not active");
    if (!battle.hasStarted) throw new Error("Battle has not begun");
    if (battle.isPaused) throw new Error("Battle is paused");
    if (battle.preparation?.isActive) throw new Error("Preparation active");
    if (battle.currentTurnPlayerId !== user._id) throw new Error("Not your turn");

    if (slotIndex < 0 || slotIndex >= FIELD_SIZE) throw new Error("Invalid slot index");

    const isHost = battle.hostId === user._id;
    const playerKey = isHost ? "playerA" : "playerB";
    const player = battle[playerKey];
    if (!player) throw new Error("Player not found");

    const card = player.field[slotIndex];
    if (!card) throw new Error("No card at slot index");

    if (battle.lastActionIdempotencyKey === idempotencyKey) return;

    const newField = [...player.field];
    newField[slotIndex] = { ...card, position };

    await ctx.db.patch(battleId, {
      lastActionAt: new Date().toISOString(),
      lastActionIdempotencyKey: idempotencyKey,
      [playerKey]: {
        ...player,
        field: newField,
      },
    });
  },
});

export const leaveOrCancel = mutation({
  args: {
    battleId: v.id("battles"),
  },
  handler: async (ctx, { battleId }) => {
    const user = await getCurrentUser(ctx);
    const battle = await ctx.db.get(battleId);
    if (!battle) throw new Error("Battle not found");

    if (battle.status === "waiting") {
      if (battle.hostId !== user!._id) throw new Error("Only host can cancel");
      await ctx.db.delete(battleId);
      return;
    }

    if (battle.status !== "active") throw new Error("Battle not active");

    const isHost = battle.hostId === user!._id;
    const winnerId = isHost ? battle.playerB.userId : battle.playerA.userId;

    await ctx.db.patch(battleId, {
      status: "completed",
      winnerId,
      lastActionAt: new Date().toISOString(),
    });
  },
});

export const heartbeatBattle = mutation({
  args: {
    battleId: v.id("battles"),
  },
  handler: async (ctx, { battleId }) => {
    const battle = await ctx.db.get(battleId);
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "active") {
      return {
        turnEndsAt: battle.turnEndsAt,
        currentTurnPlayerId: battle.currentTurnPlayerId,
        turnNumber: battle.turnNumber,
        status: battle.status,
        winnerId: battle.winnerId,
        serverNow: new Date().toISOString(),
        isInPreparation: !!battle.preparation?.isActive,
        turnCountdown: computeCountdownSeconds(battle.turnEndsAt),
        prepCountdown: computeCountdownSeconds(battle.preparation?.endsAt),
      };
    }

    // Finalize preparation if it expired
    if (battle.preparation?.isActive && battle.preparation.endsAt) {
      const nowMs = Date.now();
      const endsMs = new Date(battle.preparation.endsAt).getTime();
      if (Number.isFinite(endsMs) && nowMs >= endsMs) {
        await ctx.db.patch(battleId, {
          preparation: { ...battle.preparation, isActive: false },
          hasStarted: true,
          turnEndsAt: new Date(nowMs + battle.turnDurationSec * 1000).toISOString(),
        });
      }
    }

    await autoAdvanceTurnIfExpired(ctx, battleId);
    await enforceRejoinOrLose(ctx, battle);

    const updatedBattle = await ctx.db.get(battleId);
    if (!updatedBattle) throw new Error("Battle disappeared");

    // In case auto-advance incremented turn beyond cap, finalize
    await finalizeIfTurnCapReached(ctx, battleId, updatedBattle);

    return {
      turnEndsAt: updatedBattle.turnEndsAt,
      currentTurnPlayerId: updatedBattle.currentTurnPlayerId,
      turnNumber: updatedBattle.turnNumber,
      status: updatedBattle.status,
      winnerId: updatedBattle.winnerId,
      isPaused: !!updatedBattle.isPaused,
      preparation: updatedBattle.preparation,
      serverNow: new Date().toISOString(),
      isInPreparation: !!updatedBattle.preparation?.isActive,
      turnCountdown: computeCountdownSeconds(updatedBattle.turnEndsAt),
      prepCountdown: computeCountdownSeconds(updatedBattle.preparation?.endsAt),
    };
  },
});

export const presence = query({
  args: {
    battleId: v.id("battles"),
  },
  handler: async (ctx, { battleId }) => {
    const battle = await ctx.db.get(battleId);
    if (!battle) throw new Error("Battle not found");

    const hostPresence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("user", battle.hostId))
      .first();

    const opponentPresence = battle.opponentId
      ? await ctx.db
          .query("presence")
          .withIndex("by_user", (q) => q.eq("user", battle.opponentId!))
          .first()
      : null;

    return {
      hostConnected: !!hostPresence,
      opponentConnected: !!opponentPresence,
    };
  },
});

export const updatePresence = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("user", user._id))
      .first();

    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: now });
    } else {
      await ctx.db.insert("presence", {
        user: user._id,
        updatedAt: now,
      });
    }
  },
});

export const cleanupAbandonedBattlesInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    
    // Get all active battles
    const activeBattles = await ctx.db
      .query("battles")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    let cleanedCount = 0;
    
    for (const battle of activeBattles) {
      // Skip battles that don't have both players
      if (!battle.hostId || !battle.opponentId) continue;
      
      // Get presence for both players
      const [hostPresence, opponentPresence] = await Promise.all([
        ctx.db.query("presence")
          .withIndex("by_user", (q) => q.eq("user", battle.hostId!))
          .first(),
        ctx.db.query("presence")
          .withIndex("by_user", (q) => q.eq("user", battle.opponentId!))
          .first(),
      ]);
      
      // Check if both players are offline for more than 5 minutes
      const hostOffline = !hostPresence || hostPresence.updatedAt < fiveMinutesAgo;
      const opponentOffline = !opponentPresence || opponentPresence.updatedAt < fiveMinutesAgo;
      
      if (hostOffline && opponentOffline) {
        // Both players have been offline for more than 5 minutes, delete the battle
        await ctx.db.delete(battle._id);
        cleanedCount++;
      }
    }
    
    // Also clean up completed battles older than 24 hours
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const oldCompletedBattles = await ctx.db
      .query("battles")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "completed"),
          q.lt(q.field("lastActionAt"), oneDayAgo)
        )
      )
      .collect();
    
    for (const battle of oldCompletedBattles) {
      await ctx.db.delete(battle._id);
      cleanedCount++;
    }
    
    // Clean up waiting battles where host is offline for >5 minutes
    const waitingBattles = await ctx.db
      .query("battles")
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .collect();
    
    for (const battle of waitingBattles) {
      // Check if host is offline for >5 minutes
      const hostPresence = await ctx.db.query("presence")
        .withIndex("by_user", (q) => q.eq("user", battle.hostId))
        .first();
      
      const hostOffline = !hostPresence || hostPresence.updatedAt < fiveMinutesAgo;
      if (hostOffline) {
        await ctx.db.delete(battle._id);
        cleanedCount++;
      }
    }
    
    console.log(`Cleaned up ${cleanedCount} abandoned battles at ${now.toISOString()}`);
    return { cleanedCount, timestamp: now.toISOString() };
  },
});

