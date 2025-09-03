'use client';

import React, { useState, useEffect } from 'react';
import type { Card } from './types';
import { CardDisplay, GraveyardPile, PlayerSection, EnemySection, FloatingCard, AnimatingCard } from './components';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGraveyard } from './hooks/useGraveyard';

export default function BattlefieldPage() {
  const [playerHand, setPlayerHand] = useState<Card[]>([
    { id: '1', name: 'Blaze Knight', type: 'monster', image: '/assets/cards/Fire/BlazeKnight.png' },
    { id: '2', name: 'Phoenix Hatchling', type: 'monster', image: '/assets/cards/Fire/PhoenixHatchling.png' },
    { id: '3', name: 'Crimson Blade Mage', type: 'monster', image: '/assets/cards/Fire/CrimsonBladeMage.png' },
    { id: '4', name: 'Inferno Giant', type: 'monster', image: '/assets/cards/Fire/InfernoGiant.png' },
    { id: '5', name: 'Ashen Sovereign', type: 'monster', image: '/assets/cards/Fire/AshenSovereign.png' },
  ]);
  
  const [enemyHand, setEnemyHand] = useState<Card[]>([
    { id: 'e1', name: 'Hidden Card', type: 'monster' },
    { id: 'e2', name: 'Hidden Card', type: 'spell' },
    { id: 'e3', name: 'Hidden Card', type: 'trap' },
    { id: 'e4', name: 'Hidden Card', type: 'monster' },
  ]);

  const [playerField, setPlayerField] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [enemyField, setEnemyField] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [playerGraveyard, setPlayerGraveyard] = useState<Card[]>([]);
  const [enemyGraveyard, setEnemyGraveyard] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [dragDropEnabled, setDragDropEnabled] = useState<boolean>(true);
  const [graveyardEnabled, setGraveyardEnabled] = useState<boolean>(true);

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


  return (
    <div 
      className="h-screen bg-cover bg-center bg-no-repeat flex flex-col"
      style={{ backgroundImage: 'url(/assets/backgrounds/battlefield.png)' }}
    >
      {/* Top Controls */}
      <div className="flex justify-end gap-4 p-4">
        <button
          onClick={() => setDragDropEnabled(!dragDropEnabled)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            dragDropEnabled 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          Drag & Drop: {dragDropEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setGraveyardEnabled(!graveyardEnabled)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            graveyardEnabled 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          Graveyard: {graveyardEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex-1 flex bg-black/20 p-4">
        {/* Left Side - Large Card Display */}
        <div className="w-80 flex items-center justify-center pr-4">
          <CardDisplay card={selectedCard} />
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
    </div>
  );
}