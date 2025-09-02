import React from 'react';
import type { Card } from '../types';

interface CardDisplayProps {
  card: Card | null;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({ card }) => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="flex flex-col items-center">
      <div className="text-white text-xl mb-6">Selected Card</div>
      <div className="w-64 h-96 bg-stone-400/30 border-2 border-stone-600/50 rounded-lg backdrop-blur-sm overflow-hidden">
        {card ? (
          <>
            {card.image ? (
              <div className="w-full h-full relative">
                <img 
                  src={card.image} 
                  alt={card.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white text-center p-6">
                  <div className="font-bold text-3xl mb-6">{card.name}</div>
                  <div className="text-stone-300 text-xl">{card.type}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-stone-400 text-xl">No card selected</div>
          </div>
        )}
      </div>
    </div>
  </div>
);
