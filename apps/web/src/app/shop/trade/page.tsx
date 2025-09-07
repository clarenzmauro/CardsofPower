"use client";

import React, { useState } from "react";
import ShopNavigation from "@/components/shop-navigation";

import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { type Id } from "@backend/convex/_generated/dataModel";
import Image from "next/image";

export default function TradePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const cards =
    useQuery(api.cards.getShopCards, {
      searchQuery,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      currentUserId: useUser().user?.id ?? "",
    }) ?? [];
  const isLoading = !cards;

  // for main area
  const { user } = useUser();
  const [selectedTradeCard, setSelectedTradeCard] =
    useState<Id<"cards"> | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const myTradeableCards =
    useQuery(api.cards.getMyListings, {
      currentUserId: user?.id ?? "",
    })?.filter((card) => card.isForTrade) ?? [];

  const tradeableCards =
    useQuery(api.cards.getTradeListings, {
      searchQuery,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      currentUserId: user?.id ?? "",
    }) ?? [];

  const unlistCard = useMutation(api.cards.unlistCard);
  const listForTrade = useMutation(api.cards.listCardForTrade);

  const handleUnlist = async (cardId: string) => {
    if (!user?.id) return;
    try {
      await unlistCard({ cardId: cardId as Id<"cards">, ownerId: user.id });
    } catch (error) {
      console.error("Unlist error:", error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-y-auto">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-10"
        style={{
          backgroundImage: "url('/assets/backgrounds/shop.png')",
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Navigation Component */}
        <ShopNavigation activeTab="trade" />

        {/* Search Bar */}
        <div className="flex justify-center px-4 mb-6">
          <div className="bg-white bg-opacity-80 rounded-md shadow-md p-2 w-full max-w-lg">
            <div className="flex space-x-2">
              {/* Search by name */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent text-gray-700"
                />
              </div>

              {/* Min price */}
              <div className="w-24">
                <input
                  type="text"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent text-gray-700"
                />
              </div>

              {/* Max price */}
              <div className="w-24">
                <input
                  type="text"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-8 pb-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 min-h-96">
            {isLoading ? (
              <div className="text-white text-center py-20">Loading...</div>
            ) : (
              <div className="space-y-8">
                {/* Available Trades Section */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Available Trades
                  </h2>
                  {tradeableCards.length === 0 ? (
                    <p className="text-gray-300">
                      No tradeable cards available
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {tradeableCards.map((card) => (
                        <div
                          key={card._id}
                          className="bg-black/40 rounded-lg p-4 border border-white/20 hover:border-white/40 transition-colors"
                        >
                          <div className="text-white mb-2">{card.name}</div>
                          <div className="text-yellow-400 mb-2">
                            Owner: {card.currentOwnerUsername}
                          </div>
                          <button
                            onClick={() => setSelectedTradeCard(card._id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm w-full mb-2"
                          >
                            Initiate Trade
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* My Tradeable Cards Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      My Tradeable Cards
                    </h2>
                    <button
                      onClick={() => setIsListModalOpen(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                    >
                      List Card for Trade
                    </button>
                  </div>
                  {myTradeableCards.length === 0 ? (
                    <p className="text-gray-300">
                      You have no cards listed for trade
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {myTradeableCards.map((card) => (
                        <div
                          key={card._id}
                          className="bg-black/40 rounded-lg p-4 border border-white/20 hover:border-white/40 transition-colors"
                        >
                          <div className="h-60 flex items-center justify-center mb-2">
                            <img
                              src={card.imageUrl ?? "/assets/cards/blank.png"}
                              alt={card.name}
                              className="h-full w-auto object-contain"
                            />
                          </div>
                          <div className="text-white font-bold mb-1">{card.name}</div>
                          <div className="text-sm text-white/80 space-y-1 mb-2">
                            <div>Description: {card.description ?? 'No description available'}</div>
                            <div>Type: {card.type ?? 'N/A'}</div>
                            <div>Attribute: {card.attribute ?? 'N/A'}</div>
                            <div>Level: {card.level ?? 'N/A'}</div>
                            <div>ATK: {card.atkPts ?? 'N/A'}</div>
                            <div>DEF: {card.defPts ?? 'N/A'}</div>
                          </div>
                          <button
                            onClick={() =>
                              unlistCard({
                                cardId: card._id,
                                ownerId: user?.id ?? "",
                              })
                            }
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm w-full"
                          >
                            Remove from Trade
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
