import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { type Id } from "./_generated/dataModel";

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

    return await ctx.db.get(battleId);
  }

  return battle;
}

async function enforceRejoinOrLose(ctx: any, battle: any) {
  if (battle.status !== "active") return;

  const now = new Date();
  const nowMs = now.getTime();
  const offlineThresholdIso = new Date(nowMs - 1500).toISOString();
  const rejoinDeadlineIso = new Date(nowMs + 30000).toISOString();

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

    return {
      playerHand: player.hand.slice(0, 10),
      enemyHand: enemy.hand.slice(0, 10).map(card => ({
        id: card.id,
        name: 'Hidden Card',
        type: card.type
      })),
      playerField: normalizeField(player.field),
      enemyField: normalizeField(enemy.field),
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
        turnDurationSec: battle.turnDurationSec
      },
      status: battle.status,
      isPaused: !!battle.isPaused,
      currentTurnPlayerId: battle.currentTurnPlayerId,
      hasStarted: !!battle.hasStarted,
      youAre: isPlayerA ? "A" : "B",
      isMyTurn: battle.currentTurnPlayerId === user._id,
      serverNow: new Date().toISOString()
    };
  }
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

    const initialHand = Array(5).fill(null).map((_, i) => ({
      id: `card-${i}` as Id<"cards">,
      name: `Starter Card ${i + 1}`,
      type: "monster" as const,
      image: `/assets/cards/starter-${i + 1}.png`
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
      turnDurationSec: turnDurationSec,
      playerA: {
        userId: user._id,
        name: user.username ?? "Player",
        hp: 8000,
        maxHp: 8000,
        hand: initialHand.slice(0, 10),
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

    const initialHand = Array(5).fill(null).map((_, i) => ({
      id: `card-${i}` as Id<"cards">,
      name: `Starter Card ${i + 1}`,
      type: "monster" as const,
      image: `/assets/cards/starter-${i + 1}.png`
    })).slice(0, MAX_HAND_SIZE);

    await ctx.db.patch(battleId, {
      status: "active",
      opponentId: user._id,
      currentTurnPlayerId: Math.random() > 0.5 ? battle.hostId : user._id,
      turnNumber: 1,
      turnEndsAt,
      hasStarted: true, // Auto-start the game when second player joins
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
    idempotencyKey: v.string(),
  },
  handler: async (ctx, { battleId, fromHandIndex, toSlotIndex, idempotencyKey }) => {
    const FIELD_SIZE = 5;
    const GRAVEYARD_LIMIT = 100;

    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    let battle = await autoAdvanceTurnIfExpired(ctx, battleId);
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "active") throw new Error("Battle not active");
    if (!battle.hasStarted) throw new Error("Battle has not begun");
    if (battle.currentTurnPlayerId !== user._id) throw new Error("Not your turn");

    const player = battle.hostId === user._id ? battle.playerA : battle.playerB;
    if (!player) throw new Error("Player not found");

    if (fromHandIndex < 0 || fromHandIndex >= player.hand.length) throw new Error("Invalid hand index");
    if (toSlotIndex < 0 || toSlotIndex >= FIELD_SIZE) throw new Error("Invalid slot index");
    if (!player.hand[fromHandIndex]) throw new Error("No card at hand index");
    if (player.field[toSlotIndex]) throw new Error("Slot already occupied");

    if (battle.lastActionIdempotencyKey === idempotencyKey) return;

    const newHand = player.hand.filter((i: number) => i !== fromHandIndex);
    const newField = [...player.field];
    newField[toSlotIndex] = player.hand[fromHandIndex];

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
    if (battle.currentTurnPlayerId !== user._id) throw new Error("Not your turn");

    const player = battle.hostId === user._id ? battle.playerA : battle.playerB;
    if (!player) throw new Error("Player not found");

    if (fromSlotIndex < 0 || fromSlotIndex >= FIELD_SIZE) throw new Error("Invalid slot index");
    if (!player.field[fromSlotIndex]) throw new Error("No card at slot index");

    if (battle.lastActionIdempotencyKey === idempotencyKey) return;

    const card = player.field[fromSlotIndex];
    const newField = [...player.field];
    newField[fromSlotIndex] = null;
    const newGraveyard = [...player.graveyard, card].slice(-GRAVEYARD_LIMIT);

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

    const isHost = battle.hostId === user!._id;
    const nextPlayerId = isHost ? battle.playerB.userId : battle.playerA.userId;
    const turnEndsAt = new Date(Date.now() + battle.turnDurationSec * 1000).toISOString();

    await ctx.db.patch(battleId, {
      currentTurnPlayerId: nextPlayerId,
      turnNumber: battle.turnNumber + 1,
      turnEndsAt,
      lastActionAt: new Date().toISOString(),
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
      };
    }

    await autoAdvanceTurnIfExpired(ctx, battleId);
    await enforceRejoinOrLose(ctx, battle);

    const updatedBattle = await ctx.db.get(battleId);
    if (!updatedBattle) throw new Error("Battle disappeared");

    return {
      turnEndsAt: updatedBattle.turnEndsAt,
      currentTurnPlayerId: updatedBattle.currentTurnPlayerId,
      turnNumber: updatedBattle.turnNumber,
      status: updatedBattle.status,
      winnerId: updatedBattle.winnerId,
      isPaused: !!updatedBattle.isPaused,
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

