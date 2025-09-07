import { useQuery, useMutation } from "convex/react";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { useState, useEffect } from "react";
import { type Id } from "@cards-of-power/backend/convex/_generated/dataModel";

interface BattlefieldState {
  playerHand: any[];
  enemyHand: any[];
  playerField: any[];
  enemyField: any[];
  playerGraveyard: any[];
  enemyGraveyard: any[];
  selectedCard: any;
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
  });

  const playCardMutation = useMutation(api.battle.playCard);
  const sendToGraveyardMutation = useMutation(api.battle.sendToGraveyard);
  const endTurnMutation = useMutation(api.battle.endTurn);
  const updateHpMutation = useMutation(api.battle.updateHp);
  const updatePresenceMutation = useMutation(api.battle.updatePresence);

  useEffect(() => {
    if (!battleData) return;
    setState(battleData);
  }, [battleData]);

  useEffect(() => {
    const interval = setInterval(() => {
      updatePresenceMutation();
    }, 4000);
    return () => clearInterval(interval);
  }, [updatePresenceMutation]);

  const playCard = async (fromHandIndex: number, toSlotIndex: number) => {
    await playCardMutation({ battleId, fromHandIndex, toSlotIndex, idempotencyKey: crypto.randomUUID() });
  };

  const sendToGraveyard = async (fieldIndex: number) => {
    await sendToGraveyardMutation({ battleId, fromSlotIndex: fieldIndex, idempotencyKey: crypto.randomUUID() });
  };

  const endTurn = async () => {
    await endTurnMutation({ battleId });
  };

  const updateHp = async (amount: number) => {
    await updateHpMutation({ battleId, target: "opponent", delta: amount });
  };

  return {
    ...state,
    playCard,
    sendToGraveyard,
    endTurn,
    updateHp,
  };
}
