'use client';

import React, { useState } from 'react';
import ShopNavigation from '@/components/shop-navigation';

import { useQuery, useMutation } from 'convex/react';
import { api } from "@backend/convex/_generated/api";
import { useUser } from '@clerk/nextjs';
import { type Id } from "@backend/convex/_generated/dataModel";

export default function ListingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const cards = useQuery(api.cards.getShopCards, {
    searchQuery,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    currentUserId: useUser().user?.id ?? '',
  }) ?? [];
  const isLoading = !cards;

  const { user } = useUser();
  const myListings = useQuery(api.cards.getMyListings, { 
    currentUserId: user?.id ?? ''
  }) ?? [];
  const unlistCard = useMutation(api.cards.unlistCard);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);

  const handleUnlist = async (cardId: string) => {
    if (!user?.id) return;
    try {
      await unlistCard({ cardId: cardId as Id<"cards">, ownerId: user.id });
    } catch (error) {
      console.error('Unlist error:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/backgrounds/shop.png')",
        }}
      />
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Navigation Component */}
        <ShopNavigation activeTab="listing" />

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
          <div className="bg-black bg-opacity-30 rounded-lg min-h-96 p-6">
            {isLoading ? (
              <div className="text-white text-center py-20">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">My Listings</h2>
                  <button
                    onClick={() => setIsListingModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                  >
                    List New Card
                  </button>
                </div>

                {myListings.length === 0 ? (
                  <div className="text-white text-center py-20">
                    <p>You have no listed cards</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {myListings.map((card) => (
                      <div key={card._id} className="bg-white bg-opacity-10 rounded-lg p-4">
                        <div className="text-white mb-2">{card.name}</div>
                        <div className="text-yellow-400 mb-2">{card.marketValue} gold</div>
                        <button
                          onClick={() => unlistCard({ cardId: card._id, ownerId: user?.id ?? '' })}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm w-full"
                        >
                          Unlist
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}