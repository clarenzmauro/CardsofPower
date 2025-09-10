import React from 'react';
import type { Card } from '../types';
import { HandCard } from './HandCard';
import { CardSlot } from './CardSlot';

interface EnemySectionProps {
  hand: Card[];
  field: (Card | null)[];
  onCardSelect: (card: Card | null) => void;
  onFieldCardClick?: (slotIndex: number) => void;
  isAttackMode?: boolean;
}

export const EnemySection: React.FC<EnemySectionProps> = ({ hand, field, onCardSelect, onFieldCardClick, isAttackMode }) => (
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
        {field.map((card, index) => {
          const isAttackable = isAttackMode && card && card.type === 'monster';
          return (
            <CardSlot 
              key={`enemy-${index}`} 
              card={card} 
              onClick={() => {
                if (onFieldCardClick && isAttackable) {
                  onFieldCardClick(index);
                } else {
                  onCardSelect(card);
                }
              }}
              faceDown={card?.position === 'defense'}
              className={isAttackable ? 'ring-2 ring-red-500 ring-opacity-75 shadow-lg shadow-red-500/50 animate-pulse' : ''}
            />
          );
        })}
      </div>
    </div>
  </>
);
