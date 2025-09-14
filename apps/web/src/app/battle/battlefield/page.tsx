'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import type { Card, Player } from './types';
import { CardDisplay, GraveyardPile, PlayerSection, EnemySection, AnimatingCard, HealthBar, Timer, PrepOverlay, FloatingDragPreview } from './components';
import { useGraveyard } from './hooks/useGraveyard';
import { useDragAndDrop } from './hooks/useDragAndDrop';
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
  const [dragDropEnabled, setDragDropEnabled] = useState<boolean>(false);
  const [graveyardEnabled, setGraveyardEnabled] = useState<boolean>(true);

  // Player and Enemy data from server battle data
  const player: Player = {
    name: battle?.player?.name ?? "Player",
    hp: battle?.player?.hp ?? 8000,
    maxHp: battle?.player?.maxHp ?? 8000,
  };

  const enemy: Player = {
    name: battle?.enemy?.name ?? "Shadow Duelist",
    hp: battle?.enemy?.hp ?? 8000,
    maxHp: battle?.enemy?.maxHp ?? 8000,
  };

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [maxTime] = useState<number>(30);

  // First turn modal state
  const [showFirstTurnModal, setShowFirstTurnModal] = useState<boolean>(true);
  const hasAnnouncedRef = useRef<boolean>(false);
  const [showTurnAnnouncement, setShowTurnAnnouncement] = useState<boolean>(false);
  const prevWasInPreparation = useRef<boolean | null>(null);

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

  // Show who goes first right after preparation ends
  useEffect(() => {
    const isInPrep = !!battle?.isInPreparation;
    const prev = prevWasInPreparation.current;
    prevWasInPreparation.current = isInPrep;
    if (prev === true && isInPrep === false && battle?.status === 'active' && !battle?.isPaused) {
      setShowTurnAnnouncement(true);
      const t = setTimeout(() => setShowTurnAnnouncement(false), 2000);
      return () => clearTimeout(t);
    }
  }, [battle?.isInPreparation, battle?.status, battle?.isPaused]);

  // Enable drag & drop for battle phase
  const { dragState, getDragHandlers, getDropHandlers, logSlotContents, updateMousePosition } = useDragAndDrop({
    enabled: dragDropEnabled,
    onCardMove: (card: Card, fromIndex: number, toSlotIndex: number) => {
      // Only allow monster cards to be placed during battle
      if (card.type !== 'monster') {
        return;
      }
      // Use existing battle system to place card
      if (battle?.playCard) {
        battle.playCard(fromIndex, toSlotIndex, 'attack');
      }
    },
  });


  // Graveyard functionality
  const { animationState, sendToGraveyard, logGraveyardContents } = useGraveyard({
    enabled: graveyardEnabled,
    onCardToGraveyard: (_card: Card, _fromSlotIndex: number) => {
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
    if (!battle?.hasStarted) return;
    if (!battle?.isMyTurn) return;

    // Get positions for animation
    const slotElement = document.querySelector(`[data-slot-index="${slotIndex}"]`);
    const graveyardElement = document.querySelector('[data-graveyard="player"]');
    
    if (slotElement && graveyardElement) {
      const slotRect = slotElement.getBoundingClientRect();
      const graveyardRect = graveyardElement.getBoundingClientRect();

      battle?.sendToGraveyard?.(slotIndex);
      
      sendToGraveyard(
        card,
        slotIndex,
        { x: slotRect.left + slotRect.width / 2, y: slotRect.top + slotRect.height / 2 },
        { x: graveyardRect.left + graveyardRect.width / 2, y: graveyardRect.top + graveyardRect.height / 2 }
      );
    }
  };

  // Enable/disable interactions based on turn and battle state
  useEffect(() => {
    const canInteract = !!(battle && battle.status === 'active' && !battle.isPaused && !battle.isInPreparation && battle.isMyTurn);
    setDragDropEnabled(canInteract); // Enable drag & drop during battle phase
    setGraveyardEnabled(canInteract);
  }, [battle?.status, battle?.isPaused, battle?.isInPreparation, battle?.isMyTurn]);

  // Click-to-place state
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);
  const [showPositionPicker, setShowPositionPicker] = useState<boolean>(false);
  const [showFieldActionModal, setShowFieldActionModal] = useState<boolean>(false);
  const [activeFieldSlotIndex, setActiveFieldSlotIndex] = useState<number | null>(null);

  // Attack state
  const [isAttackMode, setIsAttackMode] = useState<boolean>(false);
  const [attackerSlotIndex, setAttackerSlotIndex] = useState<number | null>(null);

  // Attack functions
  const startAttack = (slotIndex: number) => {
    const card = playerField[slotIndex];
    if (!card || card.type !== 'monster') return;
    
    setAttackerSlotIndex(slotIndex);
    setIsAttackMode(true);
    setShowFieldActionModal(false);
    setActiveFieldSlotIndex(null);
  };

  const cancelAttack = () => {
    setIsAttackMode(false);
    setAttackerSlotIndex(null);
  };

  const executeAttack = async (targetSlotIndex: number) => {
    if (attackerSlotIndex === null) return;
    
    try {
      const result = await battle?.attack?.(attackerSlotIndex, targetSlotIndex);
      console.log('Attack result:', result);
      
      // Reset attack state
      setIsAttackMode(false);
      setAttackerSlotIndex(null);
    } catch (error) {
      console.error('Attack failed:', error);
      // Reset attack state on error
      setIsAttackMode(false);
      setAttackerSlotIndex(null);
    }
  };

  const onEnemyFieldClick = (slotIndex: number) => {
    if (!battle?.hasStarted || !battle?.isMyTurn) return;
    
    if (isAttackMode && attackerSlotIndex !== null) {
      const targetCard = enemyField[slotIndex];
      if (targetCard && targetCard.type === 'monster') {
        executeAttack(slotIndex);
      }
    }
  };

  const onHandSelect = (handIndex: number) => {
    if (!battle?.hasStarted || !battle?.isMyTurn) return;
    setSelectedHandIndex(handIndex);
  };

  const onSlotClick = (slotIndex: number) => {
    if (!battle?.hasStarted || !battle?.isMyTurn) return;
    if (selectedHandIndex == null) return; // require a selected hand card first
    if (playerField[slotIndex]) return; // only empty slots
    setPendingSlotIndex(slotIndex);
    setShowPositionPicker(true);
  };

  const onFieldCardClick = (slotIndex: number) => {
    if (!battle?.hasStarted || !battle?.isMyTurn) return;
    if (!playerField[slotIndex]) return;
    setActiveFieldSlotIndex(slotIndex);
    setShowFieldActionModal(true);
  };

  const placeSelectedCard = async (position: 'attack' | 'defense') => {
    try {
      if (selectedHandIndex == null || pendingSlotIndex == null) return;
      await battle?.playCard?.(selectedHandIndex, pendingSlotIndex, position);
    } finally {
      setShowPositionPicker(false);
      setPendingSlotIndex(null);
      setSelectedHandIndex(null);
    }
  };

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
          <div className="px-3 py-1 rounded text-sm font-semibold bg-stone-700/80 text-stone-100" style={{ fontFamily: 'var(--font-pirata-one)' }}>
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
            onFieldCardClick={onEnemyFieldClick}
            isAttackMode={isAttackMode}
          />
          <PlayerSection 
            hand={playerHand} 
            field={playerField} 
            onCardSelect={setSelectedCard}
            onHandSelect={setSelectedHandIndex}
            onSlotClick={onSlotClick}
            onFieldCardClick={onFieldCardClick}
            selectedCard={selectedCard}
            onGraveyardCard={handleGraveyardCard}
            getDragHandlers={getDragHandlers}
            getDropHandlers={getDropHandlers}
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

      {/* Floating Drag Preview */}
      {dragState.isDragging && dragState.draggedCard && (
        <FloatingDragPreview
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
            <div className="text-stone-100 text-2xl font-bold" style={{ fontFamily: 'var(--font-pirata-one)' }}>
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

      {/* Post-preparation first turn announcement */}
      {!battle?.isInPreparation && showTurnAnnouncement && !isWaitingForOpponent ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-[320px] text-center shadow-xl">
            <div className="text-stone-200 text-lg mb-2" style={{ fontFamily: 'var(--font-pirata-one)' }}>First turn</div>
            <div className="text-stone-100 text-2xl font-bold" style={{ fontFamily: 'var(--font-pirata-one)' }}>
              {isMyTurn ? 'You' : enemyName} go first
            </div>
          </div>
        </div>
      ) : null}

      {/* First Turn Modal */}
      {(!battle?.isInPreparation && (showFirstTurnModal && !isWaitingForOpponent)) || battle?.isPaused ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-[320px] text-center shadow-xl">
            {showFirstTurnModal && !isWaitingForOpponent ? (
              <>
                <div className="text-stone-200 text-lg mb-2" style={{ fontFamily: 'var(--font-pirata-one)' }}>First turn</div>
                <div className="text-stone-100 text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-pirata-one)' }}>
                  {isMyTurn ? 'You' : enemyName} go first
                </div>
                {isMyTurn ? (
                  <button
                    onClick={() => { battle?.beginBattle?.(); setShowFirstTurnModal(false); }}
                    className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-800 text-white font-semibold"
                    style={{ fontFamily: 'var(--font-pirata-one)' }}
                  >
                    Begin
                  </button>
                ) : (
                  <div className="text-stone-300 text-sm" style={{ fontFamily: 'var(--font-pirata-one)' }}>Waiting for {enemyName} to begin…</div>
                )}
              </>
            ) : (
              <>
                <div className="text-stone-200 text-lg mb-2" style={{ fontFamily: 'var(--font-pirata-one)' }}>Game paused</div>
                <div className="text-stone-100 text-sm" style={{ fontFamily: 'var(--font-pirata-one)' }}>Waiting for opponent to reconnect…</div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* End Turn Button */}
      {!battle?.isInPreparation && battle?.status === 'active' && !battle?.isPaused && isMyTurn && !isAttackMode ? (
        <div className="fixed bottom-4 right-4 z-20 sm:bottom-6 sm:right-6">
          <button
            onClick={() => battle?.endTurn?.()}
            className="w-20 h-16 sm:w-24 sm:h-20 cursor-pointer rounded-lg bg-transparent border-none p-0"
            aria-label="End Turn"
          >
            <img
              src="/assets/icons/end-turn.png"
              alt="End Turn"
              className="w-full h-full object-contain"
            />
          </button>
        </div>
      ) : null}

      {/* Cancel Attack Button */}
      {isAttackMode && (
        <div className="fixed bottom-4 right-4 z-20 sm:bottom-6 sm:right-6">
          <button
            onClick={cancelAttack}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            style={{ fontFamily: 'var(--font-pirata-one)' }}
          >
            Cancel Attack
          </button>
        </div>
      )}

      {/* Attack Mode Indicator */}
      {isAttackMode && attackerSlotIndex !== null && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
          <div className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-700/90 text-white border border-red-500" style={{ fontFamily: 'var(--font-pirata-one)' }}>
            Select enemy monster to attack
          </div>
        </div>
      )}

      {/* Attack/Defense Picker */}
      {showPositionPicker && pendingSlotIndex != null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-[320px] text-center shadow-xl">
            <div className="text-stone-200 text-lg mb-4" style={{ fontFamily: 'var(--font-pirata-one)' }}>Choose position</div>
            <div className="flex gap-4 justify-center mb-4">
              <button
                onClick={() => placeSelectedCard('attack')}
                className="w-20 h-16 cursor-pointer rounded-lg bg-transparent border-none p-0"
                aria-label="Attack"
              >
                <img
                  src="/assets/icons/attack-button.png"
                  alt="Attack"
                  className="w-full h-full object-contain"
                />
              </button>
              <button
                onClick={() => placeSelectedCard('defense')}
                className="w-20 h-16 cursor-pointer rounded-lg bg-transparent border-none p-0"
                aria-label="Defense"
              >
                <img
                  src="/assets/icons/defense-button.png"
                  alt="Defense"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>
            <button
              onClick={() => {
                setShowPositionPicker(false);
                setPendingSlotIndex(null);
                setSelectedHandIndex(null);
              }}
              className="text-stone-300 text-sm underline"
              style={{ fontFamily: 'var(--font-pirata-one)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Field Card Actions: Attack/Effect/Position/Graveyard */}
      {showFieldActionModal && activeFieldSlotIndex != null && playerField[activeFieldSlotIndex] && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-[320px] text-center shadow-xl">
            <div className="text-stone-200 text-lg mb-4" style={{ fontFamily: 'var(--font-pirata-one)' }}>Card actions</div>
            <div className="flex gap-4 justify-center mb-4 flex-wrap">
              {/* Monster Card Actions */}
              {playerField[activeFieldSlotIndex]?.type === 'monster' && (
                <>
                  {/* Attack Button - always show for monsters */}
                  <button
                    onClick={() => {
                      if (activeFieldSlotIndex !== null) {
                        startAttack(activeFieldSlotIndex);
                      }
                    }}
                    className="w-20 h-16 cursor-pointer rounded-lg bg-transparent border-none p-0"
                    aria-label="Attack"
                  >
                    <img
                      src="/assets/icons/attack-button.png"
                      alt="Attack"
                      className="w-full h-full object-contain"
                    />
                  </button>
                  
                  {/* Use Effect Button - only show for effect monsters */}
                  {playerField[activeFieldSlotIndex]?.character === 'effect' && (
                    <button
                      onClick={async () => {
                        const card = playerField[activeFieldSlotIndex!];
                        if (!card) return;
                        try {
                          const result = await battle?.useCardEffect?.(card.name);
                          console.log('Effect result:', result);
                        } catch (error) {
                          console.error('Effect failed:', error);
                        }
                        setShowFieldActionModal(false);
                        setActiveFieldSlotIndex(null);
                      }}
                      className="w-20 h-16 cursor-pointer rounded-lg bg-transparent border-none p-0"
                      aria-label="Use Effect"
                    >
                      <img
                        src="/assets/icons/effect-button.png"
                        alt="Use Effect"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  )}
                </>
              )}
              
              {/* Position Change Button - only for defense position cards */}
              {playerField[activeFieldSlotIndex]?.position === 'defense' && (
                <button
                  onClick={async () => {
                    const current = playerField[activeFieldSlotIndex!];
                    if (!current) return;
                    await battle?.setCardPosition?.(activeFieldSlotIndex!, 'attack');
                    setShowFieldActionModal(false);
                    setActiveFieldSlotIndex(null);
                  }}
                  className="w-20 h-16 cursor-pointer rounded-lg bg-transparent border-none p-0"
                  aria-label="Set to Attack"
                >
                  <img
                    src="/assets/icons/attack-button.png"
                    alt="Attack"
                    className="w-full h-full object-contain"
                  />
                </button>
              )}
              
            </div>
            <button
              onClick={() => { setShowFieldActionModal(false); setActiveFieldSlotIndex(null); }}
              className="text-stone-300 text-sm underline"
              style={{ fontFamily: 'var(--font-pirata-one)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function BattlefieldPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-stone-900 text-stone-100" style={{ fontFamily: 'var(--font-pirata-one)' }}>Loading battle...</div>}>
      <BattlefieldContent />
    </Suspense>
  );
}