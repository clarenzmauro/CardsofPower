import React from 'react';
import type { Card } from '../types';

interface HandCardProps {
  card: Card;
  onClick?: () => void;
  isHidden?: boolean;
}

export const HandCard: React.FC<HandCardProps> = ({ card, onClick, isHidden = false }) => (
  <div 
    className="w-20 h-28 bg-stone-500/40 border border-stone-600/60 rounded-md backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-stone-500/50 transition-colors mx-1 overflow-hidden"
    onClick={onClick}
  >
    {isHidden ? (
      <div className="w-full h-full bg-stone-600/60 flex items-center justify-center">
        <img 
          src="/assets/cards/back-card.png" 
          alt="Hidden card" 
          className="w-full h-full object-cover rounded-sm"
        />
      </div>
    ) : (
      <>
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
          <div className="text-xs text-white text-center p-1">
            <div className="font-semibold truncate">{card.name}</div>
            <div className="text-stone-300 text-[10px]">{card.type}</div>
          </div>
        )}
      </>
    )}
  </div>
);
