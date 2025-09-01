'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ShopPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    // Navigate to different pages based on tab
    if (tab === 'trade') {
      router.push('/');
    } else if (tab === 'listing') {
      router.push('/');
    }
  };

  const handleBackClick = () => {
    router.back();
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
        {/* Back Button */}
        <Link href="/" className="fixed top-4 left-4 z-50">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/60 text-white border-white/40 hover:bg-black/80 transition-colors"
                >
                  ← Back to Home
                </Button>
              </Link>
        

        {/* Tab Navigation */}
        <div className="flex justify-center pt-2 pb-6">
          <div className="flex space-x-4">
            {/* Shop Tab */}
            <button
              onClick={() => handleTabClick('shop')}
              className={`relative transition-all duration-200 ${
                activeTab === 'shop' ? 'scale-110' : 'scale-100 opacity-70 hover:opacity-90'
              }`}
            >
              <Image
                src="/assets/icons/shop.png"
                alt="Shop"
                width={270}
                height={120}
                className="drop-shadow-lg"
              />
            </button>

            {/* Trade Tab */}
            <button
              onClick={() => handleTabClick('trade')}
              className={`relative transition-all duration-200 ${
                activeTab === 'trade' ? 'scale-110' : 'scale-100 opacity-70 hover:opacity-90'
              }`}
            >
              <Image
                src="/assets/icons/trade.png"
                alt="Trade"
                width={270}
                height={120}
                className="drop-shadow-lg"
              />
            </button>

            {/* Listing Tab */}
            <button
              onClick={() => handleTabClick('listing')}
              className={`relative transition-all duration-200 ${
                activeTab === 'listing' ? 'scale-110' : 'scale-100 opacity-70 hover:opacity-90'
              }`}
            >
              <Image
                src="/assets/icons/listing.png"
                alt="Listing"
                width={270}
                height={120}
                className="drop-shadow-lg"
              />
            </button>
          </div>
        </div>

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
            {/* This is where the shop content will go */}
            <div className="text-white text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Welcome to the Shop</h2>
              <p className="text-gray-300">Browse and purchase cards from other players</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}