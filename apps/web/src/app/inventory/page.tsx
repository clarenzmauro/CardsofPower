"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useDataCache } from "@/hooks/useCachedQuery";

type CardData = {
  _id: string;
  cardName: string;
  type: string;
  attribute?: string;
  class?: string;
  character?: string;
  level?: number;
  marketValue?: number;
  boughtFor?: number;
  imageUrl: string;
  cardWin?: { local: number };
  cardMatch?: { local: number };
};

export default function InventoryPage() {
  const { user } = useUser();
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const gold = "/assets/icons/gold.png";
  const goldCount = 100;

  // fetch data from convex
  const freshUserData = useQuery(api.users.current);
  const freshUserInventory = useQuery(
    api.cards.getUserInventory,
    user?.id ? { userId: user.id } : { userId: "" }
  );

  // cache
  const { cachedData: cachedUserData } = useDataCache(
    freshUserData,
    { key: `user_data_${user?.id || "anonymous"}`, ttl: 5 * 60 * 1000 },
    [freshUserData]
  );
  const { cachedData: cachedUserInventory } = useDataCache(
    freshUserInventory,
    { key: `user_inventory_${user?.id || "anonymous"}`, ttl: 5 * 60 * 1000 },
    [freshUserInventory, user?.id]
  );

  const userData = cachedUserData || freshUserData;
  const inventoryCards: CardData[] = cachedUserInventory || freshUserInventory || [];

  // filter based on search
  const filteredCards = useMemo(() => {
    if (!searchQuery) return inventoryCards;
    return inventoryCards.filter((card) =>
      card.cardName.toLowerCase().startsWith(searchQuery.toLowerCase())
    );
  }, [searchQuery, inventoryCards]);

  // calculate winrate
  const winRate = useMemo(() => {
    if (!selectedCard) return "N/A";
    const wins = selectedCard.cardWin?.local || 0;
    const total = selectedCard.cardMatch?.local || 0;
    if (!total) return "0%";
    return ((wins / total) * 100).toFixed(2) + "%";
  }, [selectedCard]);

    // handle search
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleCardClick = (card: any) => {
        setSelectedCard(card);
    };
    
  // ROI calculation
  const formattedROI = useMemo(() => {
    if (!selectedCard) return <span>0</span>;
    const marketValue = selectedCard.marketValue || 0;
    const boughtFor = selectedCard.boughtFor || 0;
    const roi = marketValue - boughtFor;
    if (roi > 0) {
      return <span className="text-green-500">+{roi}</span>;
    } else if (roi < 0) {
      return <span className="text-red-600">-{Math.abs(roi)}</span>;
    } else {
      return <span>{roi}</span>;
    }
  }, [selectedCard]);

  return (
    <main
      id="inventory"
      style={{
        backgroundImage: "url('/assets/backgrounds/inventory.jpg')",
        backgroundAttachment: "fixed",
      }}
      className="relative z-0 h-screen w-screen bg-cover sm:px-12 lg:px-24"
    >
      {/* back button */}
      <Link href="/" className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-black/60 text-white border-white/40 hover:bg-black/80 transition-colors"
        >
          ← Back to Home
        </Button>
      </Link>
  
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75 -z-10"></div>
  
      {/* Wrapper */}
      <div className="flex h-screen items-start text-white sm:pt-4 lg:pt-12">
        {/* Cards Section */}
        <div className="h-full w-[70%] overflow-y-scroll overflow-x-hidden pr-2">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="ms-10 lg:ms-0 sm:text-4xl lg:text-6xl">Inventory</h1>
  
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={handleSearch}
              className="px-4 sm:me-5 lg:me-12 bg-transparent border-2 rounded-xl outline-none"
            />
          </div>
  
          {/* Gold + Cards */}
          <div className="pb-4 flex flex-wrap gap-2">
            {/* Gold */}
            <div className="gold w-[18%] flex flex-col items-center my-auto">
              <img className="w-full" src={gold} alt="gold coins" />
              <p className="sm:text-2xl lg:text-3xl text-center">
                {goldCount}
              </p>
            </div>
  
            {/* Cards */}
            {filteredCards.map((card) => (
              <img
                key={card._id}
                src={card.imageUrl}
                alt={card.cardName || "Card Image"}
                onClick={() => handleCardClick(card)}
                className="w-[18%] object-contain cursor-pointer hover:scale-105 transition-transform"
              />
            ))}
          </div>
        </div>
  
        {/* Last Selected Card */}
        <div className="w-[30%] sm:ms-2 lg:ms-4">
          {selectedCard ? (
            <>
              <img
                className="mx-auto w-4/5 sm:my-2 lg:my-4"
                src={selectedCard.imageUrl}
                alt={selectedCard.cardName}
              />
  
              <div className="flex justify-between mx-auto sm:w-4/5 lg:w-full sm:text-sm lg:text-2xl">
                <div>
                  <p>Matches: {selectedCard.cardMatch?.local || 0}</p>
                  <p>Win Rate: {winRate}</p>
                </div>
  
                <div>
                  <p>Value: {selectedCard?.marketValue || 0}</p>
                  <p className="text-start">ROI: {formattedROI}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-2xl text-center">Please select a card</p>
          )}
        </div>
      </div>
    </main>
  );
}