import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/convex/_generated/api";
import { useState, useEffect } from "react";
import { type Id } from "@backend/convex/_generated/dataModel";
import type { Player } from '../types';

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
  const sendToGraveyardMutation = useMutation(api.battle.sendToGraveyard);
  const endTurnMutation = useMutation(api.battle.endTurn);
  const updateHpMutation = useMutation(api.battle.updateHp);
  const updatePresenceMutation = useMutation(api.battle.updatePresence);
  const heartbeatMutation = useMutation(api.battle.heartbeatBattle);
  const beginBattleMutation = useMutation(api.battle.beginBattle);

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

  const playCard = async (fromHandIndex: number, toSlotIndex: number) => {
    if (!battleData?.isMyTurn) return;
    await playCardMutation({ battleId, fromHandIndex, toSlotIndex, idempotencyKey: crypto.randomUUID() });
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

  const updateHp = async (amount: number) => {
    await updateHpMutation({ battleId, target: "opponent", delta: amount });
  };

  return {
    ...state,
    hasStarted: battleData?.hasStarted ?? false,
    isMyTurn: battleData?.isMyTurn ?? false,
    status: battleData?.status,
    isPaused: battleData?.isPaused ?? false,
    timer: battleData?.timer,
    playCard,
    sendToGraveyard,
    endTurn,
    updateHp,
    beginBattle,
  };
}
