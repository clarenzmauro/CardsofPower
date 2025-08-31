"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useDataCache, cacheManager } from "@/hooks/useCachedQuery";

type CardData = {
  _id: string;
  name: string;
  type: string;
  attribute?: string;
  class?: string;
  character?: string;
  level?: number;
  marketValue?: number;
  boughtFor?: number;
  imageUrl: string;
  isOwned: boolean;
  matches?: {
    wins: number;
    total: number;
  };
};

/**
 * @description
 * Dictionary page showing card information in a searchable grid layout with filtering.
 *
 * @receives data from:
 * - Convex: card data from database as well as user inventory
 * - Clerk: current user context
 *
 * @sends data to:
 * - Client-side search filtering and card selection
 * - Card ownership status calculation
 *
 * @sideEffects:
 * - None
 */
export default function DictionaryPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCardType, setSelectedCardType] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // fetch data from convex
  const freshCards = useQuery(api.cards.getAll);
  const freshUserInventory = useQuery(
    api.cards.getUserInventory,
    user?.id ? { userId: user.id } : { userId: "" }
  );
  const freshUserData = useQuery(api.users.getCurrentUser);

  // cache data with TTL
  const { cachedData: cachedCards, isCacheLoaded: cardsCacheLoaded } =
    useDataCache(freshCards, { key: "cards_all", ttl: 10 * 60 * 1000 }, [
      freshCards,
    ]);

  const {
    cachedData: cachedUserInventory,
    isCacheLoaded: inventoryCacheLoaded,
  } = useDataCache(
    freshUserInventory,
    { key: `user_inventory_${user?.id || "anonymous"}`, ttl: 5 * 60 * 1000 },
    [freshUserInventory, user?.id]
  );

  const { cachedData: cachedUserData, isCacheLoaded: userDataCacheLoaded } =
    useDataCache(
      freshUserData,
      { key: `user_data_${user?.id || "anonymous"}`, ttl: 15 * 60 * 1000 },
      [freshUserData, user?.id]
    );

  // prefer cached data, fall back to fresh data
  const cards = cachedCards || freshCards;
  const userInventory = cachedUserInventory || freshUserInventory;
  const userData = cachedUserData || freshUserData;

  // calculate winrate
  const winRate = useMemo(() => {
    if (!selectedCard?.matches) return "N/A";
    const { wins, total } = selectedCard.matches;
    if (!wins || !total) return "0%";
    return ((wins / total) * 100).toFixed(2) + "%";
  }, [selectedCard]);

  // calculate ROI with color formatting
  const formattedROI = useMemo(() => {
    if (!selectedCard?.marketValue || !selectedCard?.boughtFor) return <span>0</span>;
    const roi = selectedCard.marketValue - selectedCard.boughtFor;
    if (roi > 0) {
      return <span className="text-green-500">+{roi}</span>;
    } else if (roi < 0) {
      return <span className="text-red-600">-{Math.abs(roi)}</span>;
    } else {
      return <span>{roi}</span>;
    }
  }, [selectedCard]);

  // filter and sort cards
  const filteredCards = useMemo(() => {
    if (!cards) return [];

    return cards
      .filter((card) => {
        const matchesSearch = card.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesType = !selectedCardType || card.type === selectedCardType;
        const matchesAttribute =
          !selectedAttribute || card.attribute === selectedAttribute;
        const matchesClass = !selectedClass || card.class === selectedClass;
        const matchesCharacter =
          !selectedCharacter || card.character === selectedCharacter;
        const matchesLevel =
          !selectedLevel || card.level === parseInt(selectedLevel);

        return (
          matchesSearch &&
          matchesType &&
          matchesAttribute &&
          matchesClass &&
          matchesCharacter &&
          matchesLevel
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    cards,
    searchQuery,
    selectedCardType,
    selectedAttribute,
    selectedClass,
    selectedCharacter,
    selectedLevel,
  ]);

  // isOwned by user?
  const isCardOwned = (cardId: string) => {
    return userInventory?.includes(cardId) || false;
  };

  // handle card selection
  const handleCardClick = (card: any) => {
    setSelectedCard(card);
  };

  // handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // handle type change and reset related filters
  const handleTypeChange = (type: string) => {
    setSelectedCardType(type);
    setSelectedAttribute("");
    setSelectedClass("");
    setSelectedCharacter("");
    setSelectedLevel("");
  };

  // manage loading state
  useEffect(() => {
    if (cachedCards && cardsCacheLoaded) {
      setIsLoading(false);
      return;
    }

    if (cardsCacheLoaded && inventoryCacheLoaded && userDataCacheLoaded) {
      const hasFreshCards = freshCards !== undefined;
      const hasFreshInventory = freshUserInventory !== undefined;
      const hasFreshUserData = freshUserData !== undefined;

      if (hasFreshCards && hasFreshInventory && hasFreshUserData) {
        setIsLoading(false);
      }
    }
  }, [
    freshCards,
    cachedCards,
    cardsCacheLoaded,
    freshUserInventory,
    cachedUserInventory,
    inventoryCacheLoaded,
    freshUserData,
    cachedUserData,
    userDataCacheLoaded,
  ]);

  // clear user caches when user changes
  useEffect(() => {
    if (user?.id) {
      const previousUserId = localStorage.getItem("last_user_id");
      if (previousUserId && previousUserId !== user.id) {
        cacheManager.clearUserCaches(previousUserId);
      }
      localStorage.setItem("last_user_id", user.id);
    }
  }, [user?.id]);

  return (
    <main
      id="dictionary"
      className="bg-cover bg-center bg-no-repeat px-6 lg:px-12 h-screen"
      style={{
        backgroundImage: "url('/assets/backgrounds/dictionary.jpg')",
        backgroundAttachment: "fixed",
      }}
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

      {/* overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {isLoading ? (
        <div className="relative z-10 flex flex-col items-center justify-center h-screen pt-8 lg:pt-16 text-white">
          <div className="text-2xl mb-4 font-bold">Loading Cards...</div>
          <div className="w-64 bg-gray-200 rounded-full h-3 mb-4 dark:bg-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: "60%" }}
            ></div>
          </div>
          <div className="text-lg opacity-90">
            {cachedCards && cardsCacheLoaded ? (
              <p>Loading latest data...</p>
            ) : (
              <p>Please wait...</p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-10 pt-8 lg:pt-16 pb-8 text-white h-screen">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div className="flex flex-col ml-10 lg:ml-0">
              <h1 className="text-4xl lg:text-6xl font-bold text-shadow-lg">
                Dictionary
              </h1>
            </div>

            <div className="flex gap-2 mr-5 lg:mr-12">
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={handleSearch}
                className="px-4 py-2 bg-black/40 border-2 border-white/40 rounded-xl outline-none text-white placeholder:text-white/70 focus:border-white/80 focus:bg-black/60 transition-all flex-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mr-5 lg:mr-12 mb-6 text-sm lg:text-lg">
            {/* card type */}
            <select
              value={selectedCardType}
              onChange={(e) => {
                handleTypeChange(e.target.value);
              }}
              className="px-3 py-2 bg-black/40 border-2 border-white/40 rounded-xl outline-none text-white focus:border-white/80 focus:bg-black/60 transition-all"
            >
              <option value="" className="text-black bg-white">
                Card Type
              </option>
              <option value="monster" className="text-black bg-white">
                Monster
              </option>
              <option value="trap" className="text-black bg-white">
                Trap
              </option>
              <option value="spell" className="text-black bg-white">
                Spell
              </option>
            </select>

            {/* monster-specific filters */}
            {selectedCardType === "monster" && (
              <>
                <select
                  value={selectedAttribute}
                  onChange={(e) => setSelectedAttribute(e.target.value)}
                  className="px-3 py-2 bg-black/40 border-2 border-white/40 rounded-xl outline-none text-white focus:border-white/80 focus:bg-black/60 transition-all"
                >
                  <option value="" className="text-black bg-white">
                    Attribute
                  </option>
                  <option value="fire" className="text-black bg-white">
                    Fire
                  </option>
                  <option value="water" className="text-black bg-white">
                    Water
                  </option>
                  <option value="wind" className="text-black bg-white">
                    Wind
                  </option>
                  <option value="earth" className="text-black bg-white">
                    Earth
                  </option>
                  <option value="dark" className="text-black bg-white">
                    Dark
                  </option>
                  <option value="light" className="text-black bg-white">
                    Light
                  </option>
                  <option value="divine" className="text-black bg-white">
                    Divine
                  </option>
                </select>

                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 bg-black/40 border-2 border-white/40 rounded-xl outline-none text-white focus:border-white/80 focus:bg-black/60 transition-all"
                >
                  <option value="" className="text-black bg-white">
                    Class
                  </option>
                  <option value="warrior" className="text-black bg-white">
                    Warrior
                  </option>
                  <option value="beast" className="text-black bg-white">
                    Beast
                  </option>
                  <option value="fairy" className="text-black bg-white">
                    Fairy
                  </option>
                  <option value="spellcaster" className="text-black bg-white">
                    Spellcaster
                  </option>
                  <option value="serpent" className="text-black bg-white">
                    Serpent
                  </option>
                  <option value="dragon" className="text-black bg-white">
                    Dragon
                  </option>
                  <option value="rock" className="text-black bg-white">
                    Rock
                  </option>
                  <option value="machine" className="text-black bg-white">
                    Machine
                  </option>
                </select>

                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="px-3 py-2 bg-black/40 border-2 border-white/40 rounded-xl outline-none text-white focus:border-white/80 focus:bg-black/60 transition-all"
                >
                  <option value="" className="text-black bg-white">
                    Character
                  </option>
                  <option value="normal" className="text-black bg-white">
                    Normal
                  </option>
                  <option value="effect" className="text-black bg-white">
                    Effect
                  </option>
                  <option value="fusion" className="text-black bg-white">
                    Fusion
                  </option>
                  <option value="ritual" className="text-black bg-white">
                    Ritual
                  </option>
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-2 bg-black/40 border-2 border-white/40 rounded-xl outline-none text-white focus:border-white/80 focus:bg-black/60 transition-all"
                >
                  <option value="" className="text-black bg-white">
                    Select Level
                  </option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                    <option
                      key={level}
                      value={level.toString()}
                      className="text-black bg-white"
                    >
                      {level}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            {/* cards collection */}
            <div className="flex-1">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 h-fit max-h-[70vh]">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  Card Collection
                </h3>
                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent max-h-[60vh]">
                  <div className="flex flex-wrap gap-3 justify-start">
                    {filteredCards
                      .filter((card) => isCardOwned(card._id))
                      .map((card) => (
                        <div
                          key={card._id}
                          className="group cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10"
                          onClick={() => handleCardClick(card)}
                        >
                          <div className="relative">
                            <Image
                              src={card.imageUrl}
                              alt={card.name}
                              width={120}
                              height={160}
                              className="object-contain rounded-lg shadow-lg group-hover:shadow-2xl transition-shadow"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                          </div>
                        </div>
                      ))}

                    {filteredCards
                      .filter((card) => !isCardOwned(card._id))
                      .map((card) => (
                        <div
                          key={card._id}
                          className="group cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10"
                          onClick={() => handleCardClick(card)}
                        >
                          <div className="relative">
                            <Image
                              src={card.imageUrl}
                              alt={card.name}
                              width={120}
                              height={160}
                              className="object-contain rounded-lg shadow-lg group-hover:shadow-2xl transition-shadow grayscale group-hover:grayscale-0"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                          </div>
                        </div>
                      ))}

                    {filteredCards.length === 0 && (
                      <div className="w-full text-center text-white/80 py-12">
                        No cards found matching your filters.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* selected card details */}
            <div className="xl:w-80 flex-shrink-0 mb-8">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 sticky top-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                {selectedCard ? (
                  <>
                    <h3 className="text-xl font-semibold mb-4 text-center">
                      {selectedCard.name}
                    </h3>
                    <Image
                      src={selectedCard.imageUrl}
                      alt={selectedCard.name}
                      width={240}
                      height={320}
                      className={`mx-auto w-full object-contain rounded-lg shadow-xl mb-4 ${
                        !isCardOwned(selectedCard._id) ? "grayscale" : ""
                      }`}
                    />

                    <div className="space-y-3 text-sm lg:text-base">
                      <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                        <span className="font-medium">Type:</span>
                        <span className="capitalize">{selectedCard.type}</span>
                      </div>

                      {selectedCard.attribute && (
                        <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                          <span className="font-medium">Attribute:</span>
                          <span className="capitalize">
                            {selectedCard.attribute}
                          </span>
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
                        <span>{selectedCard.matches?.total || 0}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                        <span className="font-medium">Win Rate:</span>
                        <span className="font-bold">{winRate}</span>
                      </div>

                      {selectedCard.marketValue && (
                        <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                          <span className="font-medium">Value:</span>
                          <span>{selectedCard.marketValue}</span>
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
        </div>
      )}
    </main>
  );
}
