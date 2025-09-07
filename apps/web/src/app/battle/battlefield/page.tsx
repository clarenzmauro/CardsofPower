'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import type { Card, Player } from './types';
import { CardDisplay, GraveyardPile, PlayerSection, EnemySection, FloatingCard, AnimatingCard, HealthBar, Timer } from './components';
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

  const [playerHand, setPlayerHand] = useState<Card[]>(battle?.player?.hand ?? [
    { id: '1', name: 'Blaze Knight', type: 'monster', image: '/assets/cards/Fire/BlazeKnight.png' },
    { id: '2', name: 'Phoenix Hatchling', type: 'monster', image: '/assets/cards/Fire/PhoenixHatchling.png' },
    { id: '3', name: 'Crimson Blade Mage', type: 'monster', image: '/assets/cards/Fire/CrimsonBladeMage.png' },
    { id: '4', name: 'Inferno Giant', type: 'monster', image: '/assets/cards/Fire/InfernoGiant.png' },
    { id: '5', name: 'Ashen Sovereign', type: 'monster', image: '/assets/cards/Fire/AshenSovereign.png' },
  ]);
  
  const [enemyHand, setEnemyHand] = useState<Card[]>(battle?.enemy?.hand ?? [
    { id: 'e1', name: 'Hidden Card', type: 'monster' },
    { id: 'e2', name: 'Hidden Card', type: 'spell' },
    { id: 'e3', name: 'Hidden Card', type: 'trap' },
    { id: 'e4', name: 'Hidden Card', type: 'monster' },
  ]);

  const [playerField, setPlayerField] = useState<(Card | null)[]>(battle?.player?.field ?? [null, null, null, null, null]);
  const [enemyField, setEnemyField] = useState<(Card | null)[]>(battle?.enemy?.field ?? [null, null, null, null, null]);
  const [playerGraveyard, setPlayerGraveyard] = useState<Card[]>(battle?.player?.graveyard ?? []);
  const [enemyGraveyard, setEnemyGraveyard] = useState<Card[]>(battle?.enemy?.graveyard ?? []);
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
      // Move card from hand to field
      setPlayerHand(prev => prev.filter((_, index) => index !== fromIndex));
      setPlayerField(prev => {
        const newField = [...prev];
        newField[toSlotIndex] = card;
        return newField;
      });
    },
  });

  // Graveyard functionality
  const { animationState, sendToGraveyard, logGraveyardContents } = useGraveyard({
    enabled: graveyardEnabled,
    onCardToGraveyard: (card: Card, fromSlotIndex: number) => {
      // Remove card from field and add to graveyard (FILO - First In, Last Out)
      setPlayerField(prev => {
        const newField = [...prev];
        newField[fromSlotIndex] = null;
        return newField;
      });
      setPlayerGraveyard(prev => [...prev, card]); // Add to end of array (last out)
      setSelectedCard(null); // Deselect card
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
  const isWaiting = !battle || battle.status !== 'active' || !battle.hasStarted || battle.isPaused || !battle.enemy || battle.enemy.name === 'Waiting...';

  return (
    <div 
      className="h-screen bg-cover bg-center bg-no-repeat flex flex-col relative"
      style={{ backgroundImage: 'url(/assets/backgrounds/battlefield.png)' }}
    >
      {/* Timer at top middle */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
        {isWaiting ? (
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

      {/* First Turn Modal */}
      {(showFirstTurnModal || battle?.isPaused) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-stone-800 border border-stone-600 rounded-lg p-6 w-[320px] text-center shadow-xl">
            {showFirstTurnModal ? (
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
      )}
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