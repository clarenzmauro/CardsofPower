"use client";

import React, { useState } from "react";
import ShopNavigation from "@/components/shop-navigation";

import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { type Id } from "@backend/convex/_generated/dataModel";
import { toast } from "sonner";

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [buying, setBuying] = useState<Record<Id<"cards">, boolean>>({})

  const { user } = useUser();
  const cards = useQuery(api.cards.getListings, {
    scope: "shop",
    searchQuery,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    currentUserId: user?.id ?? "",
  });
  const isLoading = !cards;
  const purchaseCard = useMutation(api.cards.purchaseCard);
  const shopListings = cards ?? [];

  const handlePurchase = async (cardId: Id<"cards">) => {
    if (!user?.id) {
      toast.error("You must be signed in to buy cards.");
      return;
    }
    setBuying((prev) => ({ ...prev, [cardId]: true }));
    try {
      const result = await purchaseCard({ cardId });
      if (!result?.success) throw new Error("Purchase failed");
      toast.success("Purchase successful");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Purchase failed";
      if (message.toLowerCase().includes("insufficient")) {
        toast.error("Insufficient gold to buy this card.");
      } else {
        toast.error(message);
      }
    } finally {
      setBuying((prev) => ({ ...prev, [cardId]: false }));
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
        <ShopNavigation activeTab="shop" />

        {/* Search Bar */}
        <div className="flex justify-center px-4 mb-6">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2 w-full max-w-lg border border-white/20">
            <div className="flex space-x-2">
              {/* Search by name */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Min price */}
              <div className="w-24">
                <input
                  type="text"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setMinPrice(val);
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Max price */}
              <div className="w-24">
                <input
                  type="text"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setMaxPrice(val);
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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
            ) : shopListings.length === 0 ? (
              <div className="text-white text-center py-20">No results found</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shopListings.map((card) => (
                  <div
                    key={card._id}
                    className="bg-black/40 rounded-lg p-4 border border-white/20 hover:border-white/40 transition-colors flex flex-col"
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
                      <div className="text-white font-bold mb-1">Card Stats</div>
                      <div>Type: {card.type ?? 'N/A'}</div>
                      <div>Attribute: {card.attribute ?? 'N/A'}</div>
                      <div>Level: {card.level ?? 'N/A'}</div>
                      <div>ATK: {card.atkPts ?? 'N/A'}</div>
                      <div>DEF: {card.defPts ?? 'N/A'}</div>
                      <div>Owner: {card.currentOwnerUsername ?? 'Unknown'}</div>
                    </div>
                    <div className="text-yellow-400 font-bold mb-2">
                      {card.marketValue ?? 0} gold
                    </div>
                    <div className="mt-auto">
                      <button
                        onClick={() => handlePurchase(card._id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm w-full"
                        disabled={!user || !!buying[card._id]}
                      >
                        {buying[card._id] ? "Buying..." : "Buy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
