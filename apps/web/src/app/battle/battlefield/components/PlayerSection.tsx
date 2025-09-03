import React from 'react';
import type { Card } from '../types';
import { HandCard } from './HandCard';
import { CardSlot } from './CardSlot';

interface PlayerSectionProps {
  hand: Card[];
  field: (Card | null)[];
  onCardSelect: (card: Card | null) => void;
  getDragHandlers?: (card: Card, index: number) => React.HTMLAttributes<HTMLDivElement>;
  getDropHandlers?: (slotIndex: number, isEmpty: boolean) => React.HTMLAttributes<HTMLDivElement>;
  dragState?: { isDragging: boolean; draggedCard: Card | null; draggedFromIndex: number | null; dragOverSlot: number | null };
  selectedCard?: Card | null;
  onGraveyardCard?: (slotIndex: number) => void;
}

export const PlayerSection: React.FC<PlayerSectionProps> = ({ 
  hand, 
  field, 
  onCardSelect, 
  getDragHandlers, 
  getDropHandlers, 
  dragState,
  selectedCard,
  onGraveyardCard
}) => (
  <>
    {/* Player Field */}
    <div className="flex justify-center mb-8">
      <div className="flex gap-3">
        {field.map((card, index) => (
          <div key={`player-${index}`} data-slot-index={index}>
            <CardSlot 
              card={card} 
              onClick={() => onCardSelect(card)}
              dropHandlers={getDropHandlers ? getDropHandlers(index, !card) : undefined}
              isDragOver={dragState?.dragOverSlot === index}
              isSelected={selectedCard?.id === card?.id}
              onGraveyardClick={onGraveyardCard ? () => onGraveyardCard(index) : undefined}
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
            <HandCard 
              key={card.id} 
              card={card} 
              onClick={() => onCardSelect(card)}
              dragHandlers={getDragHandlers ? getDragHandlers(card, index) : undefined}
              isDragging={dragState?.draggedCard?.id === card.id}
            />
          ))}
        </div>
      </div>
    </div>
  </>
);
