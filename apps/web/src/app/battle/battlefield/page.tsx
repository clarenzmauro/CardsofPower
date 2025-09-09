'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import type { Card, Player } from './types';
import { CardDisplay, GraveyardPile, PlayerSection, EnemySection, FloatingCard, AnimatingCard, HealthBar, Timer, PrepOverlay } from './components';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGraveyard } from './hooks/useGraveyard';
import { useSearchParams } from 'next/navigation';
import { type Id } from '@cards-of-power/backend/convex/_generated/dataModel';
import { useBattle } from './hooks/useBattle';

function BattlefieldContent() {
  const searchParams = useSearchParams();
  const battleIdParam = searchParams.get('battleId');

  if (!battleIdParam) {
    return <div className="flex items-center justify-center min-h-screen bg-stone-900 text-stone-100">Loading battle...</div>;
  }

  const battleId = battleIdParam as Id<'battles'>;
  const battle = useBattle(battleId);

  // Derive state from server battle data
  const playerHand = battle?.playerHand ?? [];
  const enemyHand = battle?.enemyHand ?? [];
  const playerField = battle?.playerField ?? [null, null, null, null, null];
  const enemyField = battle?.enemyField ?? [null, null, null, null, null];
  const playerGraveyard = battle?.playerGraveyard ?? [];
  const enemyGraveyard = battle?.enemyGraveyard ?? [];
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [dragDropEnabled, setDragDropEnabled] = useState<boolean>(true);
  const [graveyardEnabled, setGraveyardEnabled] = useState<boolean>(true);

  // Player and Enemy data
  const [player, setPlayer] = useState<Player>({
    name: battle?.player?.name ?? "Player",
    hp: battle?.player?.hp ?? 8000,
    maxHp: battle?.player?.maxHp ?? 8000
  });
  
  const [enemy, setEnemy] = useState<Player>({
    name: battle?.enemy?.name ?? "Shadow Duelist",
    hp: battle?.enemy?.hp ?? 6500,
    maxHp: battle?.enemy?.maxHp ?? 8000
  });

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [maxTime] = useState<number>(30);

  // First turn modal state
  const [showFirstTurnModal, setShowFirstTurnModal] = useState<boolean>(true);
  const hasAnnouncedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!battle) return;
    if (hasAnnouncedRef.current) return;
    // Announce only once when battle data is available
    if (battle.player && battle.enemy && typeof battle.isMyTurn === 'boolean' && !battle.hasStarted) {
      hasAnnouncedRef.current = true;
      setShowFirstTurnModal(true);
    }
  }, [battle?.player, battle?.enemy, battle?.isMyTurn, battle?.hasStarted]);

  // Auto-dismiss modal when the game has started (opponent's view)
  useEffect(() => {
    if (battle?.hasStarted) {
      setShowFirstTurnModal(false);
    }
  }, [battle?.hasStarted]);

  // Drag and drop functionality
  const { dragState, getDragHandlers, getDropHandlers, logSlotContents, updateMousePosition } = useDragAndDrop({
    enabled: dragDropEnabled,
    onCardMove: (card: Card, fromIndex: number, toSlotIndex: number) => {
      // Send to backend; server will update state via subscription
      battle?.playCard?.(fromIndex, toSlotIndex);
    },
  });

  // Graveyard functionality
  const { animationState, sendToGraveyard, logGraveyardContents } = useGraveyard({
    enabled: graveyardEnabled,
    onCardToGraveyard: (card: Card, fromSlotIndex: number) => {
      // Trigger backend mutation; server will push new state
      battle?.sendToGraveyard?.(fromSlotIndex);
      setSelectedCard(null);
    },
  });

  // Log slot contents whenever field changes
  useEffect(() => {
    logSlotContents(playerField);
    logGraveyardContents(playerGraveyard);
  }, [playerField, playerGraveyard, logSlotContents, logGraveyardContents]);

  // Handle graveyard action
  const handleGraveyardCard = (slotIndex: number) => {
    const card = playerField[slotIndex];
    if (!card) return;

    // Get positions for animation
    const slotElement = document.querySelector(`[data-slot-index="${slotIndex}"]`);
    const graveyardElement = document.querySelector('[data-graveyard="player"]');
    
    if (slotElement && graveyardElement) {
      const slotRect = slotElement.getBoundingClientRect();
      const graveyardRect = graveyardElement.getBoundingClientRect();
      
      sendToGraveyard(
        card,
        slotIndex,
        { x: slotRect.left + slotRect.width / 2, y: slotRect.top + slotRect.height / 2 },
        { x: graveyardRect.left + graveyardRect.width / 2, y: graveyardRect.top + graveyardRect.height / 2 }
      );
    }
  };

  // Global drag tracking for better cursor following
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      if (dragState.isDragging) {
        e.preventDefault();
        updateMousePosition(e.clientX, e.clientY);
      }
    };

    if (dragState.isDragging) {
      document.addEventListener('dragover', handleGlobalDragOver, { passive: false });
      return () => {
        document.removeEventListener('dragover', handleGlobalDragOver);
      };
    }
  }, [dragState.isDragging]);


  const turnCountdown = battle?.hasStarted ? (battle?.turnCountdown ?? timeRemaining) : (battle?.timer?.turnDurationSec ?? maxTime);
  const turnMax = battle?.timer?.turnDurationSec ?? maxTime;
  const isMyTurn = battle?.isMyTurn ?? false;
  const playerName = battle?.player?.name ?? 'You';
  const enemyName = battle?.enemy?.name ?? 'Opponent';
  const isWaiting = !battle || battle.status !== 'active' || battle.isPaused || !battle.enemy || battle.enemy.name === 'Waiting...';
  const isWaitingForOpponent = battle && (
    (battle.status === 'waiting') || 
    (battle.status === 'active' && (!battle.enemy || battle.enemy.name === 'Waiting...'))
  );

  return (
    <div 
      className="h-screen bg-cover bg-center bg-no-repeat flex flex-col relative"
      style={{ backgroundImage: 'url(/assets/backgrounds/battlefield.png)' }}
    >
      {/* Timer at top middle (hidden during preparation) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
        {battle?.isInPreparation ? null : isWaiting ? (
          <div className="px-3 py-1 rounded text-sm font-semibold bg-stone-700/80 text-stone-100">
            Waiting for opponent...
          </div>
        ) : (
          <Timer timeRemaining={turnCountdown} maxTime={turnMax} />
        )}
      </div>

      <div className="flex-1 flex bg-black/20 p-4">
        {/* Left Side - Card Display with Health Bars */}
        <div className="w-80 flex flex-col justify-center items-center pr-4 gap-6">
          {/* Enemy Health Bar */}
          <HealthBar player={enemy} isEnemy={true} />
          
          {/* Selected Card Display */}
          <CardDisplay card={selectedCard} />
          
          {/* Player Health Bar */}
          <HealthBar player={player} isEnemy={false} />
        </div>

        {/* Center - Game Field */}
        <div className="flex-1 flex flex-col justify-center">
          <EnemySection 
            hand={enemyHand}
            field={enemyField}
            onCardSelect={setSelectedCard}
          />
          <PlayerSection 
            hand={playerHand}
            field={playerField}
            onCardSelect={setSelectedCard}
            getDragHandlers={getDragHandlers}
            getDropHandlers={getDropHandlers}
            dragState={dragState}
            selectedCard={selectedCard}
            onGraveyardCard={handleGraveyardCard}
          />
        </div>

        {/* Right Side - Graveyards */}
        <div className="w-32 flex flex-col justify-center gap-8 pl-4 pr-4">
          <GraveyardPile cards={enemyGraveyard} label="" />
          <div data-graveyard="player">
            <GraveyardPile cards={playerGraveyard} label="" />
          </div>
        </div>
      </div>

      {/* Floating Card Preview */}
      {dragState.isDragging && dragState.draggedCard && (
        <FloatingCard
          card={dragState.draggedCard}
          position={dragState.mousePosition}
          isVisible={dragState.isDragging}
        />
      )}

      {/* Animating Card to Graveyard */}
      {animationState.isAnimating && animationState.animatingCard && (
        <AnimatingCard
          card={animationState.animatingCard}
          startPosition={animationState.startPosition}
          endPosition={animationState.endPosition}
          isVisible={animationState.isAnimating}
        />
      )}

      {/* Waiting for Opponent Banner */}
      {isWaitingForOpponent && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="w-full py-4 text-center">
            <div className="text-stone-100 text-2xl font-bold">
              Waiting for an opponent...
            </div>
          </div>
        </div>
      )}

      {/* Preparation Overlay */}
      {battle?.isInPreparation ? (
        <PrepOverlay
          hand={playerHand}
          field={playerField}
          countdown={battle.prepCountdown ?? 0}
          durationSec={battle.preparation?.durationSec ?? 15}
          waitingForOpponent={!!battle.iAmReady && !battle.opponentReady}
          onSubmit={(lineup) => battle.submitPreparation?.(lineup)}
        />
      ) : null}

      {/* First Turn Modal */}
      {(!battle?.isInPreparation && (showFirstTurnModal && !isWaitingForOpponent)) || battle?.isPaused ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-[320px] text-center shadow-xl">
            {showFirstTurnModal && !isWaitingForOpponent ? (
              <>
                <div className="text-stone-200 text-lg mb-2">First turn</div>
                <div className="text-stone-100 text-2xl font-bold mb-4">
                  {isMyTurn ? 'You' : enemyName} go first
                </div>
                {isMyTurn ? (
                  <button
                    onClick={() => { battle?.beginBattle?.(); setShowFirstTurnModal(false); }}
                    className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-800 text-white font-semibold"
                  >
                    Begin
                  </button>
                ) : (
                  <div className="text-stone-300 text-sm">Waiting for {enemyName} to begin…</div>
                )}
              </>
            ) : (
              <>
                <div className="text-stone-200 text-lg mb-2">Game paused</div>
                <div className="text-stone-100 text-sm">Waiting for opponent to reconnect…</div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BattlefieldPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-stone-900 text-stone-100">Loading battle...</div>}>
      <BattlefieldContent />
    </Suspense>
  );
}