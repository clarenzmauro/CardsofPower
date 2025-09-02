'use client';

import React, { useState } from 'react';

interface Card {
  id: string;
  name: string;
  image?: string;
  type: 'monster' | 'spell' | 'trap';
}

export default function BattlefieldPage() {
  const [playerHand, setPlayerHand] = useState<Card[]>([
    { id: '1', name: 'Fire Dragon', type: 'monster' },
    { id: '2', name: 'Lightning Bolt', type: 'spell' },
    { id: '3', name: 'Shield Wall', type: 'trap' },
    { id: '4', name: 'Water Elemental', type: 'monster' },
    { id: '5', name: 'Heal', type: 'spell' },
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

  const CardSlot = ({ card, onClick, className = "" }: { card: Card | null, onClick?: () => void, className?: string }) => (
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

  const HandCard = ({ card, onClick, isHidden = false }: { card: Card, onClick?: () => void, isHidden?: boolean }) => (
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

  const GraveyardPile = ({ cards, label }: { cards: Card[], label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-white text-base mb-3">{label}</div>
      <div className="relative w-28 h-40">
        {cards.length > 0 ? (
          <>
            {cards.slice(-3).map((_, index) => (
              <div
                key={index}
                className="absolute w-28 h-40 bg-stone-600/50 border border-stone-700/70 rounded-lg backdrop-blur-sm"
                style={{
                  top: `${index * 3}px`,
                  left: `${index * 3}px`,
                  zIndex: index
                }}
              />
            ))}
            <div className="absolute top-0 left-0 w-28 h-40 bg-stone-500/60 border border-stone-600/80 rounded-lg backdrop-blur-sm flex items-center justify-center z-10">
              <span className="text-white text-base font-bold">{cards.length}</span>
            </div>
          </>
        ) : (
          <div className="w-28 h-40 bg-stone-400/20 border-2 border-dashed border-stone-600/40 rounded-lg backdrop-blur-sm" />
        )}
      </div>
    </div>
  );

  const CardDisplay = ({ card }: { card: Card | null }) => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex flex-col items-center">
        <div className="text-white text-xl mb-6">Selected Card</div>
        <div className="w-64 h-96 bg-stone-400/30 border-2 border-stone-600/50 rounded-lg backdrop-blur-sm flex items-center justify-center">
          {card ? (
            <div className="text-white text-center p-6">
              <div className="font-bold text-3xl mb-6">{card.name}</div>
              <div className="text-stone-300 text-xl mb-6">{card.type}</div>
              {card.image && (
                <img src={card.image} alt={card.name} className="w-full h-48 object-cover rounded mt-6" />
              )}
            </div>
          ) : (
            <div className="text-stone-400 text-xl">No card selected</div>
          )}
        </div>
      </div>
    </div>
  );

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
          {/* Enemy Hand - Full Width Rectangle */}
          <div className="mb-6">
            <div className="w-full h-32 bg-stone-900/40 rounded-lg backdrop-blur-sm border border-stone-600/50 flex items-center justify-center overflow-x-auto overflow-y-hidden p-4">
              <div className="flex gap-3">
                {enemyHand.map((card) => (
                  <HandCard key={card.id} card={card} isHidden={true} />
                ))}
              </div>
            </div>
          </div>

          {/* Enemy Field */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-3">
              {enemyField.map((card, index) => (
                <CardSlot 
                  key={`enemy-${index}`} 
                  card={card} 
                  onClick={() => setSelectedCard(card)}
                />
              ))}
            </div>
          </div>

          {/* Player Field */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-3">
              {playerField.map((card, index) => (
                <CardSlot 
                  key={`player-${index}`} 
                  card={card} 
                  onClick={() => setSelectedCard(card)}
                />
              ))}
            </div>
          </div>

          {/* Player Hand - Full Width Rectangle */}
          <div>
            <div className="w-full h-32 bg-stone-900/40 rounded-lg backdrop-blur-sm border border-stone-600/50 flex items-center justify-center overflow-x-auto overflow-y-hidden p-4">
              <div className="flex gap-3">
                {playerHand.map((card) => (
                  <HandCard 
                    key={card.id} 
                    card={card} 
                    onClick={() => setSelectedCard(card)}
                  />
                ))}
              </div>
            </div>
          </div>
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