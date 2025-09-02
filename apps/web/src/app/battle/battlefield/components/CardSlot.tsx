import React from 'react';
import type { Card } from '../types';

interface CardSlotProps {
  card: Card | null;
  onClick?: () => void;
  className?: string;
}

export const CardSlot: React.FC<CardSlotProps> = ({ card, onClick, className = "" }) => (
  <div 
    className={`w-28 h-40 bg-stone-400/30 border-2 border-stone-600/50 rounded-lg backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-stone-400/40 transition-colors ${className}`}
    onClick={onClick}
  >
    {card && (
      <div className="text-sm text-white text-center p-2">
        <div className="font-semibold truncate">{card.name}</div>
        <div className="text-stone-300 text-xs">{card.type}</div>
      </div>
    )}
  </div>
);
