"use client";

import React, { useMemo, useState } from "react";
import ShopNavigation from "@/components/shop-navigation";

import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { type Id } from "@backend/convex/_generated/dataModel";
import { toast } from "sonner";

export default function TradePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Server-scoped listings (active)
  const listingsAll = useQuery(api.cards.getServerListingsV2, { scope: "active" }) ?? [];
  const listings = (listingsAll as any[]).filter(l => (l as any)?.category === "trade");
  const isLoading = !listings;

  // for main area
  const { user } = useUser();
  const [selectedTradeListing, setSelectedTradeListing] =
    useState<Id<"listings"> | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedListCard, setSelectedListCard] = useState<Id<"user_cards"> | null>(
    null
  );
  const [listing, setListing] = useState(false);
  const [removing, setRemoving] = useState<Record<Id<"listings">, boolean>>({});
  const [confirmUnlistId, setConfirmUnlistId] = useState<Id<"listings"> | null>(
    null
  );
  const [confirmListOpen, setConfirmListOpen] = useState(false);

  // Identify my listings by filtering server listings
  const me = useQuery(api.users.getMe);
  const myTradeableCards = useMemo(() => {
    const mine = (listings as any[])?.filter(l => String(l?.seller?.id ?? "") === String(me?._id ?? "")) ?? [];
    return mine;
  }, [listings, me?._id]);

  const tradeableCards = useMemo(() => {
    const items = (listings as any[]) ?? [];
    // Basic client-side filter by name/price if template present
    const filtered = items.filter((l) => {
      const name: string = l?.template?.name ?? "";
      const price: number = Number(l?.price ?? 0);
      // Exclude my own listings from Available Trades
      if (String(l?.seller?.id ?? "") === String(me?._id ?? "")) return false;
      if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (minPrice && Number(minPrice) > 0 && price < Number(minPrice)) return false;
      if (maxPrice && Number(maxPrice) > 0 && price > Number(maxPrice)) return false;
      return true;
    });
    return filtered;
  }, [listings, searchQuery, minPrice, maxPrice, me?._id]);

  const unlistListing = useMutation(api.cards.unlistListingV2);
  const createListing = useMutation(api.cards.createListingV2);
  const purchaseListing = useMutation(api.cards.purchaseListingV2);

  const handleUnlist = async (listingId: string) => {
    if (!user?.id) {
      toast.error("You must be signed in to modify listings.");
      return;
    }
    const id = listingId as Id<"listings">;
    setRemoving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await unlistListing({ listingId: id });
      if (!res?.success) throw new Error("Unlist failed");
      toast.success("Removed from trade");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unlist failed";
      toast.error(message);
    } finally {
      setRemoving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const inventory = useQuery(api.cards.getMyUserCards);
  const eligibleForTrade = useMemo(() => {
    const items = (inventory as any[]) ?? [];
    const myActiveListings = new Set<string>(
      ((listings as any[]) ?? [])
        .filter(l => String(l?.seller?.id ?? "") === String(me?._id ?? ""))
        .map(l => String(l?.userCardId ?? ""))
    );
    // Exclude user_cards that are already listed by me
    const filtered = items.filter((uc: any) => !myActiveListings.has(String(uc?.userCardId ?? "")));
    return filtered.slice(0, 100);
  }, [inventory, listings, me?._id]);

  const closeListModal = () => {
    setIsListModalOpen(false);
    setSelectedListCard(null);
    setListing(false);
  };

  const handleListForTrade = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to list cards.");
      return;
    }
    if (!selectedListCard) {
      toast.error("Select a card to list for trade.");
      return;
    }
    setListing(true);
    try {
      const res = await createListing({ userCardId: selectedListCard as any, price: 1 });
      if (!res?.listingId) throw new Error("Listing failed");
      toast.success("Card listed for trade");
      closeListModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Listing failed";
      toast.error(message);
    } finally {
      setListing(false);
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
            ) : (
              <div className="space-y-8">
                {/* Available Trades Section */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Available Trades
                  </h2>
                  {tradeableCards.length === 0 ? (
                    <p className="text-gray-300">
                      {searchQuery || minPrice || maxPrice
                        ? "No results found"
                        : "No tradeable cards available"}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {tradeableCards.map((l: any) => (
                        <div
                          key={l._id}
                          className="bg-black/40 rounded-lg p-4 border border-white/20 hover:border-white/40 transition-colors"
                        >
                          <div className="text-white mb-2">{l?.template?.name ?? "Unnamed"}</div>
                          <div className="text-white/80 mb-2">Seller: {l?.seller?.name ?? "Player"}</div>
                          <button
                            onClick={async () => {
                              try {
                                await purchaseListing({ listingId: l._id as Id<"listings"> });
                                toast.success("Purchased!");
                              } catch (e: unknown) {
                                const m = e instanceof Error ? e.message : "Purchase failed";
                                toast.error(m);
                              }
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm w-full mb-2"
                          >
                            Buy
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
                      {searchQuery || minPrice || maxPrice
                        ? "No results found"
                        : "You have no cards listed for trade"}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {myTradeableCards.map((l: any) => (
                        <div
                          key={l._id}
                          className="bg-black/40 rounded-lg p-4 border border-white/20 hover:border-white/40 transition-colors"
                        >
                          <div className="h-60 flex items-center justify-center mb-2">
                            <img
                              src={l?.template?.imageUrl ?? "/assets/cards/blank.png"}
                              alt={l?.template?.name ?? "Card"}
                              className="h-full w-auto object-contain"
                            />
                          </div>
                          <div className="text-white font-bold mb-1">
                            {l?.template?.name ?? "Unnamed"}
                          </div>
                          <div className="text-sm text-white/80 space-y-1 mb-2">
                            <div className="text-white font-bold mb-1">
                              Card Stats
                            </div>
                            <div>Type: {l?.template?.type ?? "N/A"}</div>
                            <div>Level: {l?.template?.level ?? "N/A"}</div>
                            <div>ATK: {l?.template?.atkPts ?? "N/A"}</div>
                            <div>DEF: {l?.template?.defPts ?? "N/A"}</div>
                          </div>
                          <button
                            onClick={() => setConfirmUnlistId(l._id as Id<"listings">)}
                            disabled={!!removing[l._id as Id<"listings">]}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm w-full"
                          >
                            {removing[l._id as Id<"listings">]
                              ? "Removing..."
                              : "Remove from Trade"}
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

        {/* List for Trade Modal */}
        {isListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={closeListModal}
            />
            <div className="relative z-10 bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  List Card for Trade
                </h3>
                <button
                  onClick={closeListModal}
                  className="text-white hover:text-orange-500"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search my cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="max-h-80 overflow-y-auto border border-white/20 rounded p-4 bg-black/20">
                {eligibleForTrade.length === 0 ? (
                  <div className="text-center text-white/60 py-10">
                    No eligible cards found
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {eligibleForTrade.map((uc: any) => (
                      <button
                        key={uc.userCardId}
                        onClick={() => setSelectedListCard(uc.userCardId as Id<"user_cards">)}
                        className={`rounded border p-2 bg-black/40 hover:border-orange-400 text-left ${selectedListCard === uc.userCardId ? "border-orange-500 ring-2 ring-orange-300" : "border-white/20"}`}
                      >
                        <div className="h-28 flex items-center justify-center mb-2">
                          <img
                            src={uc?.template?.imageUrl ?? "/assets/cards/blank.png"}
                            alt={uc?.template?.name ?? "Card"}
                            className="h-full w-auto object-contain"
                          />
                        </div>
                        <div className="font-medium text-sm text-white">
                          {uc?.template?.name ?? "Unnamed"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedListCard && (
                <div className="mt-4 p-3 border border-white/20 rounded bg-black/20">
                  <div className="text-sm text-white/80">Selected card:</div>
                  <div className="font-semibold text-white">
                    {eligibleForTrade.find((c: any) => String(c.userCardId) === String(selectedListCard))
                      ?.template?.name ?? "Unknown card"}
                  </div>
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={closeListModal}
                  className="px-4 py-2 rounded border border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedListCard) {
                      toast.error("Select a card to list for trade.");
                      return;
                    }
                    setConfirmListOpen(true);
                  }}
                  disabled={!selectedListCard || listing}
                  className={`px-4 py-2 rounded text-white ${!selectedListCard || listing ? "bg-orange-300" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  {listing ? "Listing..." : "List for Trade"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Remove from Trade Modal */}
        {confirmUnlistId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setConfirmUnlistId(null)}
            />
            <div className="relative z-10 bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-2">
                Remove card from trade listing?
              </h3>
              <p className="text-white/80 mb-4">
                This will stop others from seeing this card as tradeable.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmUnlistId(null)}
                  className="px-4 py-2 rounded border border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const id = confirmUnlistId;
                    if (id) handleUnlist(id);
                    setConfirmUnlistId(null);
                  }}
                  className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700"
                  disabled={!!removing[confirmUnlistId!]}
                >
                  {confirmUnlistId && removing[confirmUnlistId]
                    ? "Removing..."
                    : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm List for Trade Modal */}
        {confirmListOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setConfirmListOpen(false)}
            />
            <div className="relative z-10 bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-2">
                List this card for trade?
              </h3>
              <p className="text-white/80 mb-4">
                Others will be able to propose trades for this card.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmListOpen(false)}
                  className="px-4 py-2 rounded border border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleListForTrade();
                    setConfirmListOpen(false);
                  }}
                  disabled={listing}
                  className={`px-4 py-2 rounded text-white ${listing ? "bg-orange-300" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  {listing ? "Listing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
