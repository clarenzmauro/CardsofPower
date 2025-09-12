import React from 'react';
import type { Card } from '../types';

interface CardSlotProps {
  card: Card | null;
  onClick?: () => void;
  className?: string;
  dropHandlers?: React.HTMLAttributes<HTMLDivElement>;
  isDragOver?: boolean;
  isSelected?: boolean;
  onGraveyardClick?: () => void;
  onAttackClick?: () => void;
  onEffectClick?: () => void;
  faceDown?: boolean;
  showPositionBadge?: boolean;
}

export const CardSlot: React.FC<CardSlotProps> = ({ 
  card, 
  onClick, 
  className = "", 
  dropHandlers, 
  isDragOver = false, 
  isSelected = false, 
  onGraveyardClick,
  onAttackClick,
  onEffectClick,
  faceDown = false,
  showPositionBadge = false,
}) => (
  <div 
    className={`w-28 h-40 bg-stone-400/30 border-2 border-stone-600/50 rounded-lg backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:bg-stone-400/40 transition-all duration-300 ease-in-out overflow-hidden relative ${className} ${
      isDragOver 
        ? 'border-blue-400 bg-blue-400/20 scale-105 shadow-lg shadow-blue-400/30' 
        : ''
    } ${
      isSelected 
        ? 'border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/30' 
        : ''
    }`}
    onClick={onClick}
    {...dropHandlers}
  >
    {card ? (
      <>
        {card.image ? (
          <div className="w-full h-full relative animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <img 
              src={faceDown ? '/assets/cards/back-card.png' : card.image} 
              alt={card.name} 
              className="w-full h-full object-cover rounded-md"
            />
            {!faceDown && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                <div className="font-semibold truncate">{card.name}</div>
              </div>
            )}
            {showPositionBadge && (
              <div className={`${card.position === 'defense' ? 'bg-stone-700 text-stone-200' : 'bg-amber-700 text-white'} absolute top-1 right-1 text-[10px] px-1 py-0.5 rounded`}> 
                {card.position === 'defense' ? 'DEF' : 'ATK'}
              </div>
            )}
            {/* Action Buttons */}
            {isSelected && (
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {/* Attack Button - only for monster cards */}
                {card.type === 'monster' && onAttackClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAttackClick();
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 rounded shadow-lg transition-colors"
                  >
                    Attack
                  </button>
                )}
                
                {/* Effect Button - only for monster cards with character == "effect" */}
                {card.type === 'monster' && card.character === 'effect' && onEffectClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEffectClick();
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded shadow-lg transition-colors"
                  >
                    Effect
                  </button>
                )}
                
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-white text-center p-2">
            <div className="font-semibold truncate">{card.name}</div>
            <div className="text-stone-300 text-xs">{card.type}</div>
          </div>
        )}
      </>
    ) : null}
  </div>
);
