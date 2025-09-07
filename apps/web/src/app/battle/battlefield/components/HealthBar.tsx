import React from 'react';
import type { Player } from '../types';

interface HealthBarProps {
  player: Player;
  isEnemy?: boolean;
}

export function HealthBar({ player, isEnemy = false }: HealthBarProps) {
  const healthPercentage = (player.hp / player.maxHp) * 100;
  
  return (
    <div className="flex flex-col items-right gap-2">
      {/* Player Name */}
      <span className="text-white font-bold text-lg">{player.name}</span>
      
      {/* HP Bar with Icon */}
      <div className="flex items-center gap-2">
        {/* Heart Icon */}
        <svg 
          className="w-6 h-6 text-red-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
            clipRule="evenodd" 
          />
        </svg>
        
        {/* HP Progress Bar */}
        <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
          <div 
            className="h-full bg-red-500 transition-all duration-300 ease-out"
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        
        {/* HP Text */}
        <span className="text-white font-semibold text-sm min-w-[60px]">
          {player.hp}/{player.maxHp}
        </span>
      </div>
    </div>
  );
}
