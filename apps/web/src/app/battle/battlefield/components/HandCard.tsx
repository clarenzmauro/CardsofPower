import React from 'react';
import type { Card } from '../types';

interface HandCardProps {
  card: Card;
  onClick?: () => void;
  isHidden?: boolean;
}

export const HandCard: React.FC<HandCardProps> = ({ card, onClick, isHidden = false }) => (
  <div 
    className="w-20 h-28 bg-stone-500/40 border border-stone-600/60 rounded-md backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-stone-500/50 transition-colors mx-1"
    onClick={onClick}
  >
    <div className="text-xs text-white text-center p-1">
      {isHidden ? (
        <div className="font-semibold">???</div>
      ) : (
        <>
          <div className="font-semibold truncate">{card.name}</div>
          <div className="text-stone-300 text-[10px]">{card.type}</div>
        </>
      )}
    </div>
  </div>
);
