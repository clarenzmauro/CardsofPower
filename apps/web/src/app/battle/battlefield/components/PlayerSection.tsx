import React from 'react';
import type { Card } from '../types';
import { HandCard } from './HandCard';
import { CardSlot } from './CardSlot';

interface PlayerSectionProps {
  hand: Card[];
  field: (Card | null)[];
  onCardSelect: (card: Card | null) => void;
  onHandSelect?: (handIndex: number) => void;
  onSlotClick?: (slotIndex: number) => void;
  onFieldCardClick?: (slotIndex: number) => void;
  selectedCard?: Card | null;
  onGraveyardCard?: (slotIndex: number) => void;
  getDragHandlers?: (card: Card, index: number) => any;
  getDropHandlers?: (slotIndex: number, isEmpty: boolean) => any;
}

export const PlayerSection: React.FC<PlayerSectionProps> = ({ 
  hand, 
  field, 
  onCardSelect, 
  onHandSelect,
  onSlotClick,
  onFieldCardClick,
  selectedCard,
  onGraveyardCard,
  getDragHandlers,
  getDropHandlers
}) => (
  <>
    {/* Player Field */}
    <div className="flex justify-center mb-8">
      <div className="flex gap-3">
        {field.map((card, index) => (
          <div 
            key={`player-${index}`} 
            data-slot-index={index}
            {...(getDropHandlers ? getDropHandlers(index, !card) : {})}
          >
            <CardSlot 
              card={card} 
              onClick={() => {
                if (card) {
                  onCardSelect(card);
                  onFieldCardClick?.(index);
                } else {
                  onCardSelect(null);
                  onSlotClick?.(index);
                }
              }}
              showPositionBadge={!!card}
              isSelected={selectedCard?.id === card?.id}
              onGraveyardClick={onGraveyardCard ? () => onGraveyardCard(index) : undefined}
              // Field cards are NOT draggable - only hand cards can be dragged
            />
          </div>
        ))}
      </div>
    </div>

    {/* Player Hand - Full Width Rectangle */}
    <div>
      <div className="w-full h-32 bg-stone-900/40 rounded-lg backdrop-blur-sm border border-stone-600/50 flex items-center justify-center overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-3">
          {hand.map((card, index) => (
            <div
              key={card.id}
              {...(getDragHandlers ? getDragHandlers(card, index) : {})}
            >
              <HandCard 
                card={card} 
                onClick={() => { onCardSelect(card); onHandSelect?.(index); }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);
