import React from 'react';
import type { Card } from '../types';

interface FloatingDragPreviewProps {
  card: Card;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const FloatingDragPreview: React.FC<FloatingDragPreviewProps> = ({
  card,
  position,
  isVisible,
}) => {
  if (!isVisible || !card) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-opacity duration-150"
      style={{
        left: position.x - 40, // Center the card on cursor (card width is ~80px)
        top: position.y - 56,  // Center the card on cursor (card height is ~112px)
        opacity: isVisible ? 0.8 : 0,
        transform: 'rotate(-5deg)', // Slight rotation for dynamic feel
      }}
    >
      <div className="relative">
        {/* Card shadow for depth */}
        <div className="absolute inset-0 bg-black/40 rounded-lg blur-sm transform translate-x-1 translate-y-1" />
        
        {/* Main card */}
        <div className="relative w-20 h-28 bg-stone-400/90 border-2 border-stone-600/80 rounded-lg overflow-hidden backdrop-blur-sm shadow-xl">
          {/* Card Image */}
          {card.image && (
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
          
          {/* Glowing border effect */}
          <div className="absolute inset-0 border-2 border-amber-400/50 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};
