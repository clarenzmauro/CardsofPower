import React from 'react';
import type { Card } from '../types';

interface GraveyardPileProps {
  cards: Card[];
  label: string;
}

export const GraveyardPile: React.FC<GraveyardPileProps> = ({ cards, label }) => (
  <div className="flex flex-col items-center">
    <div className="text-white text-base mb-3">{label}</div>
    <div className="relative w-28 h-40">
      {cards.length > 0 ? (
        <>
          {/* Show last 3 cards as stack layers */}
          {cards.slice(-3).map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              className="absolute w-28 h-40 bg-stone-600/50 border border-stone-700/70 rounded-lg backdrop-blur-sm overflow-hidden"
              style={{
                top: `${index * 3}px`,
                left: `${index * 3}px`,
                zIndex: index
              }}
            >
              {card.image && (
                <img 
                  src={card.image} 
                  alt={card.name} 
                  className="w-full h-full object-cover rounded-md grayscale opacity-60"
                />
              )}
            </div>
          ))}
          {/* Top card with count */}
          <div className="absolute top-0 left-0 w-28 h-40 bg-stone-500/60 border border-stone-600/80 rounded-lg backdrop-blur-sm flex items-center justify-center z-10 overflow-hidden">
            {cards[cards.length - 1]?.image ? (
              <div className="w-full h-full relative">
                <img 
                  src={cards[cards.length - 1].image} 
                  alt={cards[cards.length - 1].name} 
                  className="w-full h-full object-cover rounded-md grayscale opacity-70"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-base font-bold">{cards.length}</span>
                </div>
              </div>
            ) : (
              <span className="text-white text-base font-bold">{cards.length}</span>
            )}
          </div>
        </>
      ) : (
        <div className="w-28 h-40 bg-stone-400/20 border-2 border-dashed border-stone-600/40 rounded-lg backdrop-blur-sm" />
      )}
    </div>
  </div>
);
