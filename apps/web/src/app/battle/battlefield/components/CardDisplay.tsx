import React from 'react';
import type { Card } from '../types';

interface CardDisplayProps {
  card: Card | null;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({ card }) => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="flex flex-col items-center">
      <div className="text-white text-xl mb-4" style={{ fontFamily: 'var(--font-pirata-one)' }}>Selected Card</div>
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
                  <div className="font-bold text-3xl mb-6" style={{ fontFamily: 'var(--font-pirata-one)' }}>{card.name}</div>
                  <div className="text-stone-300 text-xl" style={{ fontFamily: 'var(--font-pirata-one)' }}>{card.type}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-stone-400 text-xl" style={{ fontFamily: 'var(--font-pirata-one)' }}>No card selected</div>
          </div>
        )}
      </div>
      
      {/* ATK/DEF Stats below card */}
      {card && card.type === 'monster' && (
        <div className="mt-4 flex items-center justify-center gap-20 bg-black/60 px-4 py-2 rounded text-white font-bold">
          {/* DEF Stats with Heart Icon */}
          {(card.inGameDefPts !== undefined || card.defPts !== undefined) && (
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>{card.inGameDefPts ?? card.defPts}</span>
            </div>
          )}
          
          {/* ATK Stats with Sword Icon */}
          {(card.inGameAtkPts !== undefined || card.atkPts !== undefined) && (
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.92 5H5l6 13 6-13h-1.92L12 10.5 8.92 5zM12 2.5L8.5 9h7L12 2.5z"/>
              </svg>
              <span>{card.inGameAtkPts ?? card.atkPts}</span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
