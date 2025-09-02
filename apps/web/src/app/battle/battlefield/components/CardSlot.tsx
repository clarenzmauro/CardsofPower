import React from 'react';
import type { Card } from '../types';

interface CardSlotProps {
  card: Card | null;
  onClick?: () => void;
  className?: string;
}

export const CardSlot: React.FC<CardSlotProps> = ({ card, onClick, className = "" }) => (
  <div 
    className={`w-28 h-40 bg-stone-400/30 border-2 border-stone-600/50 rounded-lg backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:bg-stone-400/40 transition-colors overflow-hidden ${className}`}
    onClick={onClick}
  >
    {card ? (
      <>
        {card.image ? (
          <div className="w-full h-full relative">
            <img 
              src={card.image} 
              alt={card.name} 
              className="w-full h-full object-cover rounded-md"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
              <div className="font-semibold truncate">{card.name}</div>
            </div>
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
