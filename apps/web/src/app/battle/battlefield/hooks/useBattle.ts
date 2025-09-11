import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/convex/_generated/api";
import { useState, useEffect } from "react";
import { type Id } from "@backend/convex/_generated/dataModel";
import type { Player, PreparationState } from '../types';

interface BattlefieldState {
  playerHand: any[];
  enemyHand: any[];
  playerField: any[];
  enemyField: any[];
  playerGraveyard: any[];
  enemyGraveyard: any[];
  selectedCard: any;
  turnCountdown: number;
  player: Player;
  enemy: Player; 
  isMyTurn: boolean;
  timer: {
    turnDurationSec: number;
  };
  preparation?: PreparationState;
}

export function useBattle(battleId: Id<"battles">) {
  const battleData = useQuery(api.battle.getBattle, { battleId });
  const [state, setState] = useState<BattlefieldState>({
    playerHand: [],
    enemyHand: [],
    playerField: Array(5).fill(null),
    enemyField: Array(5).fill(null),
    playerGraveyard: [],
    enemyGraveyard: [],
    selectedCard: null,
    turnCountdown: 30,
    player: { name: '', hp: 0, maxHp: 0 },
    enemy: { name: '', hp: 0, maxHp: 0 },
    isMyTurn: false,
    timer: { turnDurationSec: 30 }
  });

  const playCardMutation = useMutation(api.battle.playCard);
  const setCardPositionMutation = useMutation(api.battle.setCardPosition);
  const sendToGraveyardMutation = useMutation(api.battle.sendToGraveyard);
  const endTurnMutation = useMutation(api.battle.endTurn);
  const updateHpMutation = useMutation(api.battle.updateHp);
  const updatePresenceMutation = useMutation(api.battle.updatePresence);
  const heartbeatMutation = useMutation(api.battle.heartbeatBattle);
  const beginBattleMutation = useMutation(api.battle.beginBattle);
  const submitPreparationMutation = useMutation(api.battle.submitPreparation);
  const attackMutation = useMutation(api.battle.attack);
  const useCardEffectMutation = useMutation(api.battle.useCardEffect);

  useEffect(() => {
    if (!battleData) return;
    setState((prev) => ({
      ...battleData,
      turnCountdown: prev.turnCountdown,
    }));
  }, [battleData]);

  useEffect(() => {
    const interval = setInterval(() => {
      heartbeatMutation({ battleId }).catch(() => {});
      updatePresenceMutation().catch(() => {});
    }, 1000);
    return () => clearInterval(interval);
  }, [heartbeatMutation, updatePresenceMutation, battleId]);

  useEffect(() => {
    if (!battleData?.hasStarted || battleData?.isPaused || !battleData?.timer?.turnEndsAt) return;
    const serverNowMs = battleData.serverNow ? new Date(battleData.serverNow).getTime() : Date.now();
    const skewMs = Date.now() - serverNowMs; // positive if client clock is ahead

    const computeRemaining = () => {
      const endsMs = new Date(battleData.timer.turnEndsAt).getTime();
      const nowAdj = Date.now() - skewMs;
      const remainingMs = Math.max(0, endsMs - nowAdj);
      return Math.ceil(remainingMs / 1000);
    };

    // Initialize immediately
    setState((prev) => ({ ...prev, turnCountdown: computeRemaining() }));

    const interval = setInterval(() => {
      setState((prev) => ({ ...prev, turnCountdown: computeRemaining() }));
    }, 300);

    return () => clearInterval(interval);
  }, [battleData?.hasStarted, battleData?.isPaused, battleData?.timer?.turnEndsAt, battleData?.serverNow]);

  // Preparation countdown tracking
  const [prepCountdown, setPrepCountdown] = useState<number>(0);
  useEffect(() => {
    if (!battleData?.preparation?.isActive || !battleData?.preparation?.endsAt) return;
    const serverNowMs = battleData.serverNow ? new Date(battleData.serverNow).getTime() : Date.now();
    const skewMs = Date.now() - serverNowMs;

    const computeRemaining = () => {
      const endsMs = new Date(battleData.preparation!.endsAt!).getTime();
      const nowAdj = Date.now() - skewMs;
      const remainingMs = Math.max(0, endsMs - nowAdj);
      return Math.ceil(remainingMs / 1000);
    };

    setPrepCountdown(computeRemaining());
    const interval = setInterval(() => setPrepCountdown(computeRemaining()), 300);
    return () => clearInterval(interval);
  }, [battleData?.preparation?.isActive, battleData?.preparation?.endsAt, battleData?.serverNow]);

  const playCard = async (fromHandIndex: number, toSlotIndex: number, position?: "attack" | "defense") => {
    if (!battleData?.isMyTurn) return;
    await playCardMutation({ battleId, fromHandIndex, toSlotIndex, position, idempotencyKey: crypto.randomUUID() });
  };

  const setCardPosition = async (slotIndex: number, position: "attack" | "defense") => {
    if (!battleData?.isMyTurn) return;
    await setCardPositionMutation({ battleId, slotIndex, position, idempotencyKey: crypto.randomUUID() });
  };

  const sendToGraveyard = async (fieldIndex: number) => {
    if (!battleData?.isMyTurn) return;
    await sendToGraveyardMutation({ battleId, fromSlotIndex: fieldIndex, idempotencyKey: crypto.randomUUID() });
  };

  const endTurn = async () => {
    if (!battleData?.isMyTurn) return;
    await endTurnMutation({ battleId });
  };

  const beginBattle = async () => {
    if (!battleData?.isMyTurn || battleData?.hasStarted) return;
    await beginBattleMutation({ battleId });
  };

  const submitPreparation = async (
    lineup: Array<{ slotIndex: number; cardId: string; position: "attack" | "defense" }>
  ) => {
    if (!battleData?.preparation?.isActive) return;
    // Basic client-side validation
    if (lineup.length > 5) throw new Error("Too many cards");
    const uniqueSlots = new Set(lineup.map(i => i.slotIndex));
    if (uniqueSlots.size !== lineup.length) throw new Error("Duplicate slot indices");
    await submitPreparationMutation({ battleId, lineup, idempotencyKey: crypto.randomUUID() });
  };

  const updateHp = async (amount: number) => {
    await updateHpMutation({ battleId, target: "opponent", delta: amount });
  };

  const attack = async (attackerSlotIndex: number, targetSlotIndex: number) => {
    if (!battleData?.isMyTurn) return;
    return await attackMutation({ 
      battleId, 
      attackerSlotIndex, 
      targetSlotIndex, 
      idempotencyKey: crypto.randomUUID() 
    });
  };

  const useCardEffect = async (cardName: string) => {
    if (!battleData?.isMyTurn) return;
    return await useCardEffectMutation({ battleId, cardName });
  };

  return {
    ...state,
    hasStarted: battleData?.hasStarted ?? false,
    isMyTurn: battleData?.isMyTurn ?? false,
    status: battleData?.status,
    isPaused: battleData?.isPaused ?? false,
    timer: battleData?.timer,
    preparation: battleData?.preparation,
    prepCountdown,
    isInPreparation: !!battleData?.preparation?.isActive,
    iAmReady:
      battleData?.youAre === "A"
        ? !!battleData?.preparation?.playerAReady
        : !!battleData?.preparation?.playerBReady,
    opponentReady:
      battleData?.youAre === "A"
        ? !!battleData?.preparation?.playerBReady
        : !!battleData?.preparation?.playerAReady,
    playCard,
    setCardPosition,
    sendToGraveyard,
    endTurn,
    updateHp,
    beginBattle,
    submitPreparation,
    attack,
    useCardEffect,
  };
}
