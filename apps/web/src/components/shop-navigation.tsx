'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ShopNavigationProps {
  activeTab: 'shop' | 'trade' | 'listing';
}

/**
 * Renders a shop navigation bar with a fixed "Back to Home" button and three tab icons (Shop, Trade, Listing).
 *
 * The active tab is visually emphasized; clicking a tab performs client-side navigation:
 * - `shop` → `/shop`
 * - `trade` → `/shop/trade`
 * - `listing` → `/shop/listing`
 *
 * @param activeTab - Which tab is currently active; controls the highlighted/scaled tab (`'shop' | 'trade' | 'listing'`).
 * @returns A React element containing the back button and the centered tab navigation.
 */
export default function ShopNavigation({ activeTab }: ShopNavigationProps) {
  const router = useRouter();

  const handleTabClick = (tab: string) => {
    // Navigate to different pages based on tab
    if (tab === 'shop') {
      router.push('/shop');
    } else if (tab === 'trade') {
      router.push('/shop/trade');
    } else if (tab === 'listing') {
      router.push('/shop/listing');
    }
  };

  return (
    <>
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
    </>
  );
}
