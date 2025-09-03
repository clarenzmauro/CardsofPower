import React from 'react';
import type { Card } from '../types';

interface AnimatingCardProps {
  card: Card;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  isVisible: boolean;
}

export const AnimatingCard: React.FC<AnimatingCardProps> = ({ 
  card, 
  startPosition, 
  endPosition, 
  isVisible 
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: startPosition.x - 40,
        top: startPosition.y - 56,
        transform: `translate(${endPosition.x - startPosition.x}px, ${endPosition.y - startPosition.y}px)`,
        transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <div className="w-20 h-28 bg-stone-500/90 border-2 border-stone-400/80 rounded-md backdrop-blur-sm shadow-2xl overflow-hidden">
        {card.image ? (
          <div className="w-full h-full relative">
            <img 
              src={card.image} 
              alt={card.name} 
              className="w-full h-full object-cover rounded-sm grayscale"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[9px] p-0.5 text-center">
              <div className="font-semibold truncate">{card.name}</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center grayscale">
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
