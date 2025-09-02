'use client';

import React, { useState } from 'react';
import type { Card } from './types';
import { CardDisplay, GraveyardPile, PlayerSection, EnemySection } from './components';

export default function BattlefieldPage() {
  const [playerHand, setPlayerHand] = useState<Card[]>([
    { id: '1', name: 'Blaze Knight', type: 'monster', image: '/assets/cards/Fire/BlazeKnight.png' },
    { id: '2', name: 'Phoenix Hatchling', type: 'monster', image: '/assets/cards/Fire/PhoenixHatchling.png' },
    { id: '3', name: 'Crimson Blade Mage', type: 'monster', image: '/assets/cards/Fire/CrimsonBladeMage.png' },
    { id: '4', name: 'Inferno Giant', type: 'monster', image: '/assets/cards/Fire/InfernoGiant.png' },
    { id: '5', name: 'Ashen Sovereign', type: 'monster', image: '/assets/cards/Fire/AshenSovereign.png' },
  ]);
  
  const [enemyHand, setEnemyHand] = useState<Card[]>([
    { id: 'e1', name: 'Hidden Card', type: 'monster' },
    { id: 'e2', name: 'Hidden Card', type: 'spell' },
    { id: 'e3', name: 'Hidden Card', type: 'trap' },
    { id: 'e4', name: 'Hidden Card', type: 'monster' },
  ]);

  const [playerField, setPlayerField] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [enemyField, setEnemyField] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [playerGraveyard, setPlayerGraveyard] = useState<Card[]>([]);
  const [enemyGraveyard, setEnemyGraveyard] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);


  return (
    <div 
      className="h-screen bg-cover bg-center bg-no-repeat flex flex-col"
      style={{ backgroundImage: 'url(/assets/backgrounds/battlefield.png)' }}
    >
      <div className="flex-1 flex bg-black/20 p-4">
        {/* Left Side - Large Card Display */}
        <div className="w-80 flex items-center justify-center pr-4">
          <CardDisplay card={selectedCard} />
        </div>

        {/* Center - Game Field */}
        <div className="flex-1 flex flex-col justify-center">
          <EnemySection 
            hand={enemyHand}
            field={enemyField}
            onCardSelect={setSelectedCard}
          />
          <PlayerSection 
            hand={playerHand}
            field={playerField}
            onCardSelect={setSelectedCard}
          />
        </div>

        {/* Right Side - Graveyards */}
        <div className="w-32 flex flex-col justify-center gap-8 pl-4 pr-4">
          <GraveyardPile cards={enemyGraveyard} label="" />
          <GraveyardPile cards={playerGraveyard} label="" />
        </div>
      </div>
    </div>
  );
}