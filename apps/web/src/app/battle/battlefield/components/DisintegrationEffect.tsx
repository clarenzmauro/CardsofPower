import React, { useState, useEffect } from 'react';
import type { Card } from '../types';

interface DisintegrationEffectProps {
  card: Card;
  position: { x: number; y: number };
  onComplete: () => void;
}

export const DisintegrationEffect: React.FC<DisintegrationEffectProps> = ({ 
  card, 
  position, 
  onComplete 
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  // Create particle effect for disintegration
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="absolute w-1 h-1 bg-amber-400 rounded-full animate-pulse"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 0.5}s`,
        opacity: 1 - progress,
        transform: `translateY(${progress * 50}px) scale(${1 - progress})`,
      }}
    />
  ));

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x - 40,
        top: position.y - 56,
        width: 80,
        height: 112,
      }}
    >
      {/* Card image with disintegration effect */}
      <div className="relative w-full h-full">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name}
            className="w-full h-full object-cover rounded-md"
            style={{
              clipPath: `polygon(0 0, 100% 0, 100% ${100 - progress * 100}%, 0 ${100 - progress * 100}%)`,
              filter: `brightness(${1 + progress * 0.5}) saturate(${1 - progress * 0.5})`,
            }}
          />
        ) : (
          <div
            className="w-full h-full bg-stone-600 rounded-md flex items-center justify-center text-white text-xs"
            style={{
              clipPath: `polygon(0 0, 100% 0, 100% ${100 - progress * 100}%, 0 ${100 - progress * 100}%)`,
              filter: `brightness(${1 + progress * 0.5}) saturate(${1 - progress * 0.5})`,
            }}
          >
            {card.name}
          </div>
        )}
        
        {/* Particle effects */}
        {particles}
        
        {/* Glowing border effect */}
        <div 
          className="absolute inset-0 border-2 border-amber-400 rounded-md"
          style={{
            opacity: 1 - progress,
            boxShadow: `0 0 ${20 * (1 - progress)}px rgba(251, 191, 36, 0.8)`,
          }}
        />
      </div>
    </div>
  );
};
