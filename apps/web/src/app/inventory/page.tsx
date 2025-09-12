"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useDataCache } from "@/hooks/useCachedQuery";
import { type Id } from "@backend/convex/_generated/dataModel";

type CardData = {
  _id: string;
  name: string;
  type: string;
  description?: string;
  imageUrl: string;
  atkPts?: number;
  defPts?: number;
  attribute?: string | null;
  level?: number | null;
  matches?: { wins: number; total: number };
  cardWin?: { global: number; local: number };
  cardLose?: { global: number; local: number };
  estimatedValue?: number | null;
  boughtFor?: number;
};

export default function InventoryPage() {
  const { user } = useUser();
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [listPrice, setListPrice] = useState<string>("");
  const gold = "/assets/icons/gold.png";

  // fetch data from convex (V2)
  const freshUserData = useQuery(api.users.current);
  const myUserCards = useQuery(api.cards.getMyUserCards);
  const myWorkshopCards = useQuery(api.cards.getMyWorkshopCards);
  const activeListings = useQuery(api.cards.getServerListingsV2, { scope: "active" }) ?? [];
  const createListing = useMutation(api.cards.createListingV2);

  // cache
  const { cachedData: cachedUserData } = useDataCache(
    freshUserData,
    { key: `user_data_${user?.id || "anonymous"}`, ttl: 5 * 60 * 1000 },
    [freshUserData]
  );
  const { cachedData: cachedMyUserCards } = useDataCache(
    myUserCards,
    { key: `user_inventory_v2_${user?.id || "anonymous"}`, ttl: 5 * 60 * 1000 },
    [myUserCards, user?.id]
  );
  const { cachedData: cachedMyWorkshopCards } = useDataCache(
    myWorkshopCards,
    { key: `user_workshop_cards_${user?.id || "anonymous"}`, ttl: 5 * 60 * 1000 },
    [myWorkshopCards, user?.id]
  );

  const userData = cachedUserData || freshUserData;
  const goldCount = userData?.goldCount ?? 0;
  const v2 = (cachedMyUserCards || myUserCards || []) as Array<{ userCardId: string; quantity: number; estimatedValue?: number | null; boughtFor?: number; template: any }>;
  const workshop = (cachedMyWorkshopCards || myWorkshopCards || []) as Array<CardData>;
  const activeUserCardIds = new Set<string>((activeListings as any[]).map(l => String((l as any)?.userCardId ?? "")));
  const inventoryFromTemplates: CardData[] = v2
    .filter((x) => !!x.template)
    .map((x) => ({
      _id: x.userCardId,
      name: x.template.name,
      type: x.template.type,
      description: x.template.description ?? "",
      imageUrl: x.template.imageUrl,
      atkPts: x.template.atkPts,
      defPts: x.template.defPts,
      attribute: x.template.attribute ?? null,
      level: x.template.level ?? null,
      matches: x.template.matches ?? { wins: 0, total: 0 },
      cardWin: x.template.cardWin ?? { global: 0, local: 0 },
      cardLose: x.template.cardLose ?? { global: 0, local: 0 },
      estimatedValue: x.estimatedValue ?? null,
      boughtFor: x.boughtFor ?? 0,
    }));

  // Tag workshop cards so UI can disable listing
  const inventoryFromWorkshop: CardData[] = workshop.map((w) => ({
    ...w,
    _id: String(w._id),
    estimatedValue: null,
    boughtFor: 0,
  }));

  const inventoryCards: CardData[] = [...inventoryFromTemplates, ...inventoryFromWorkshop];

  // filter based on search
  const filteredCards = useMemo(() => {
    if (!searchQuery) return inventoryCards;
    return inventoryCards.filter((card) =>
      card.name.toLowerCase().startsWith(searchQuery.toLowerCase())
    );
  }, [searchQuery, inventoryCards]);

  // calculate winrate
  const winRate = useMemo(() => {
    if (!selectedCard) return "N/A";
    const total = selectedCard.matches?.total || 0;
    const wins = selectedCard.cardWin?.local || 0;
    if (!total) return "0%";
    return ((wins / total) * 100).toFixed(2) + "%";
  }, [selectedCard]);

    // handle search
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleCardClick = (card: CardData) => {
        setSelectedCard(card);
    };
    
  // ROI calculation
  const formattedROI = useMemo(() => {
    if (!selectedCard) return <span>0</span>;
    const marketValue = selectedCard.estimatedValue || 0;
    const boughtFor = selectedCard.boughtFor || 0;
    const roi = marketValue - boughtFor;
    if (roi > 0) return <span className="text-green-500">+{roi}</span>;
    if (roi < 0) return <span className="text-red-600">-{Math.abs(roi)}</span>;
    return <span>{roi}</span>;
  }, [selectedCard]);

  const handleListForSale = async () => {
    if (!selectedCard) return;
    if (activeUserCardIds.has(String(selectedCard._id))) {
      alert("This card is already listed.");
      return;
    }
    const priceNum = Number(listPrice);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return;
    try {
      await createListing({ userCardId: selectedCard._id as unknown as Id<"user_cards">, price: priceNum });
      setListPrice("");
    } catch {}
  };

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
                alt={card.name || "Card Image"}
                onClick={() => handleCardClick(card)}
                className="w-[18%] object-contain cursor-pointer hover:scale-105 transition-transform"
              />
            ))}
          </div>
        </div>
  
        {/* selected card details */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md xl:w-80 flex-shrink-0 mb-8 ml-0 sm:ml-6 md:ml-10">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 sticky top-4 max-h-[80vh] min-h-[320px] flex flex-col overflow-y-auto">
            {selectedCard ? (
              <>
                <h3 className="text-xl font-semibold mb-4 text-center break-words">
                  {selectedCard.name}
                </h3>
                <img
                  src={selectedCard.imageUrl}
                  alt={selectedCard.name}
                  className="mx-auto w-full max-h-[20%] h-[20%] object-contain rounded-lg shadow-xl mb-4"
                  style={{ minHeight: "64px" }}
                />
                {selectedCard.description && (
                  <div className="mb-3 p-2 bg-white/10 rounded-lg text-center text-sm lg:text-base break-words">
                    <span className="ml-1">{selectedCard.description}</span>
                  </div>
                )}
                <div className="space-y-3 text-sm lg:text-base">
                  <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                    <span className="font-medium">Type:</span>
                    <span className="capitalize">{selectedCard.type}</span>
                  </div>
                  {selectedCard.attribute && (
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="font-medium">Attribute:</span>
                      <span className="capitalize">{selectedCard.attribute}</span>
                    </div>
                  )}
                  {selectedCard.level && (
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="font-medium">Level:</span>
                      <span>{selectedCard.level}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                    <span className="font-medium">Matches:</span>
                    <span>{selectedCard.matches?.total ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                    <span className="font-medium">Win Rate:</span>
                    <span className="font-bold">{winRate}</span>
                  </div>
                  {selectedCard.estimatedValue !== undefined && selectedCard.estimatedValue !== null && (
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="font-medium">Value:</span>
                      <span>{selectedCard.estimatedValue}</span>
                    </div>
                  )}
                  {selectedCard.boughtFor !== undefined && (
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="font-medium">ROI:</span>
                      <span className="font-bold">{formattedROI}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg opacity-80">Please select a card</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}