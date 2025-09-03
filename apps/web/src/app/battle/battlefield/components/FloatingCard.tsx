import React from 'react';
import type { Card } from '../types';

interface FloatingCardProps {
  card: Card;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({ card, position, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-opacity duration-200"
      style={{
        left: position.x - 40, // Center the card on cursor
        top: position.y - 56,
        opacity: isVisible ? 0.9 : 0,
      }}
    >
      <div className="w-20 h-28 bg-stone-500/90 border-2 border-stone-400/80 rounded-md backdrop-blur-sm shadow-2xl transform rotate-12 scale-110 overflow-hidden">
        {card.image ? (
          <div className="w-full h-full relative">
            <img 
              src={card.image} 
              alt={card.name} 
              className="w-full h-full object-cover rounded-sm"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[9px] p-0.5 text-center">
              <div className="font-semibold truncate">{card.name}</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-xs text-white text-center p-1">
              <div className="font-semibold truncate">{card.name}</div>
              <div className="text-stone-300 text-[10px]">{card.type}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
