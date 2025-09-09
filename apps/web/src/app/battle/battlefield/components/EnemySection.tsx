import React from 'react';
import type { Card } from '../types';
import { HandCard } from './HandCard';
import { CardSlot } from './CardSlot';

interface EnemySectionProps {
  hand: Card[];
  field: (Card | null)[];
  onCardSelect: (card: Card | null) => void;
}

export const EnemySection: React.FC<EnemySectionProps> = ({ hand, field, onCardSelect }) => (
  <>
    {/* Enemy Hand - Full Width Rectangle */}
    <div className="mb-6">
      <div className="w-full h-32 bg-stone-900/40 rounded-lg backdrop-blur-sm border border-stone-600/50 flex items-center justify-center overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-3">
          {hand.map((card) => (
            <HandCard key={card.id} card={card} isHidden={true} />
          ))}
        </div>
      </div>
    </div>

    {/* Enemy Field */}
    <div className="flex justify-center mb-8">
      <div className="flex gap-3">
        {field.map((card, index) => (
          <CardSlot 
            key={`enemy-${index}`} 
            card={card} 
            onClick={() => onCardSelect(card)}
            faceDown={card?.position === 'defense'}
          />
        ))}
      </div>
    </div>
  </>
);
