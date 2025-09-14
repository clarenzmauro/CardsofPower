'use client';

import React, { useMemo } from 'react';
import type { Card } from '../types';
import { HandCard } from './HandCard';
import { Timer } from './Timer';

interface PrepOverlayProps {
  hand: Card[];
  field: (Card | null)[];
  countdown: number;
  durationSec: number;
  waitingForOpponent: boolean;
  onSubmit: (lineup: Array<{ slotIndex: number; cardId: string; position: 'attack' | 'defense' }>) => void;
}

const BACK_CARD_IMAGE = '/assets/cards/back-card.png';

export const PrepOverlay: React.FC<PrepOverlayProps> = ({
  hand,
  field,
  countdown,
  durationSec,
  waitingForOpponent,
  onSubmit,
}) => {
  const [prepHand, setPrepHand] = React.useState<Card[]>(hand);
  const [prepField, setPrepField] = React.useState<(Card | null)[]>(field);

  React.useEffect(() => {
    setPrepHand(hand);
  }, [hand]);
  React.useEffect(() => {
    setPrepField(field);
  }, [field]);

  // Handle card selection/deselection
  const handleCardClick = (card: Card) => {
    console.log('CARD CLICKED:', card.name, 'Type:', card.type);
    console.log('Waiting for opponent:', waitingForOpponent);
    
    if (waitingForOpponent) {
      console.log('Blocked: waiting for opponent');
      return;
    }
    
    // Only allow monster cards to be placed during preparation
    if (card.type !== 'monster') {
      console.log('Blocked: not a monster card');
      return;
    }

    // Check if card is already in field
    const cardInFieldIndex = prepField.findIndex(fieldCard => fieldCard?.id === card.id);
    console.log('Card in field index:', cardInFieldIndex);
    console.log('Current field:', prepField.map(c => c?.name || 'empty'));
    
    if (cardInFieldIndex !== -1) {
      // Card is in field, remove it (but keep in hand)
      console.log('Removing card from field');
      setPrepField(prev => {
        const next = [...prev];
        next[cardInFieldIndex] = null;
        return next;
      });
    } else {
      // Card is not in field, try to add it
      const emptySlotIndex = prepField.findIndex(slot => slot === null);
      console.log('Empty slot index:', emptySlotIndex);
      
      if (emptySlotIndex !== -1) {
        // Found empty slot, add card (but keep in hand)
        console.log('Adding card to field at slot', emptySlotIndex);
        setPrepField(prev => {
          const next = [...prev];
          next[emptySlotIndex] = { ...card, position: 'attack' };
          console.log('New field state:', next.map(c => c?.name || 'empty'));
          return next;
        });
      } else {
        console.log('No empty slots available');
      }
    }
  };

  const readyDisabled = useMemo(() => waitingForOpponent || countdown <= 0, [waitingForOpponent, countdown]);

  const togglePosition = (slotIndex: number) => {
    setPrepField(prev => {
      const next = [...prev];
      const card = next[slotIndex];
      if (!card) return next;
      const position = card.position === 'defense' ? 'attack' : 'defense';
      next[slotIndex] = { ...card, position };
      return next;
    });
  };

  const handleReady = () => {
    const lineup = prepField
      .map((c, i) => (c ? { slotIndex: i, cardId: c.id, position: c.position === 'defense' ? 'defense' : 'attack' } : null))
      .filter(Boolean) as Array<{ slotIndex: number; cardId: string; position: 'attack' | 'defense' }>;

    // Assertions
    const ids = new Set<string>();
    for (const item of lineup) {
      if (item.slotIndex < 0 || item.slotIndex >= 5) throw new Error('Invalid slot index');
      if (ids.has(item.cardId)) throw new Error('Duplicate card');
      ids.add(item.cardId);
    }
    onSubmit(lineup);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ backgroundImage: 'url(/assets/backgrounds/battlefield.png)' }}>
      {/* scrim */}
      <div className="absolute inset-0 bg-black/50" />

      {/* content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Header + Timer */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <Timer timeRemaining={countdown} maxTime={durationSec} />
        </div>

        <div className="bg-stone-800/80 border border-stone-600 rounded-xl p-5 w-full max-w-5xl shadow-2xl">
          <div className="text-center mb-4">
            <div className="text-stone-200 text-lg">Preparation Phase</div>
            <div className="text-stone-400 text-sm">Click cards to select (max 5). Tap a slot to toggle Attack/Defense.</div>
          </div>

          {/* Slots */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-3">
              {prepField.map((card, index) => (
                <div
                  key={`prep-slot-${index}`}
                  onClick={() => togglePosition(index)}
                >
                  <div className="w-28 h-40 bg-stone-400/30 border-2 border-stone-600/50 rounded-lg overflow-hidden relative flex items-center justify-center">
                    {card ? (
                      <img
                        src={card.position === 'defense' ? BACK_CARD_IMAGE : (card.image ?? '/assets/cards/blank.png')}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    {card ? (
                      <div className={`${card.position === 'defense' ? 'bg-stone-700 text-stone-200' : 'bg-amber-700 text-white'} absolute top-1 right-1 text-[10px] px-1 py-0.5 rounded`}>
                        {card.position === 'defense' ? 'DEF' : 'ATK'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hand / Click Selection */}
          <div>
            <div className="w-full h-32 bg-stone-900/40 rounded-lg backdrop-blur-sm border border-stone-600/50 flex items-center justify-center overflow-x-auto overflow-y-hidden p-4">
              <div className="flex gap-3">
                {prepHand.map((card, index) => {
                  const isSelected = prepField.some(fieldCard => fieldCard?.id === card.id);
                  return (
                    <div key={card.id} className="relative">
                      <HandCard
                        card={card}
                        onClick={() => {
                          console.log('HandCard onClick triggered for:', card.name);
                          handleCardClick(card);
                        }}
                        isDragging={false}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-amber-400 rounded-lg pointer-events-none animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleReady}
              disabled={readyDisabled}
              className={`px-5 py-2 rounded font-semibold text-white ${readyDisabled ? 'bg-stone-600 cursor-not-allowed' : 'bg-amber-700 hover:bg-amber-800'} `}
            >
              {waitingForOpponent ? 'Waiting for opponent…' : 'Ready'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


