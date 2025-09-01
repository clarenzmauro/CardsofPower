"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Trophy, 
  Star, 
  TrendingUp,
  Award,
  Coins,
  Sword,
  Shield,
  Zap,
  BarChart3,
  PieChart
} from "lucide-react";

interface UserStats {
  username: string;
  level: number;
  experience: number;
  maxExperience: number;
  dateCreated: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  currentCardCount: number;
  highestCardCount: number;
  goldCount: number;
  highestGoldCount: number;
  cardsCreated: number;
  cardsBought: number;
  cardsTraded: number;
  cardsListed: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  change: number;
}

interface TopCard {
  id: string;
  name: string;
  type: "monster" | "spell" | "trap";
  matches: number;
  imageUrl?: string;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"account" | "battlefield" | "economy">("account");

  // Mock user data based on reference
  const userStats: UserStats = {
    username: "TestUser",
    level: 42,
    experience: 2850,
    maxExperience: 3000,
    dateCreated: "10/6/24",
    gamesPlayed: 127,
    gamesWon: 89,
    gamesLost: 38,
    currentCardCount: 87,
    highestCardCount: 120,
    goldCount: 2500,
    highestGoldCount: 4200,
    cardsCreated: 15,
    cardsBought: 45,
    cardsTraded: 12,
    cardsListed: 8
  };

  const topCards: TopCard[] = [
    { id: "1", name: "Sea Kraken", type: "monster", matches: 45 },
    { id: "2", name: "Lightning Strike", type: "spell", matches: 38 },
    { id: "3", name: "Shield Wall", type: "trap", matches: 32 }
  ];

  const leaderboards = {
    strategist: [
      { username: "Captain Blackbeard", winRate: 85.2 },
      { username: "Admiral Storm", winRate: 82.1 },
      { username: "TestUser", winRate: 70.1 },
      { username: "Pirate Jenny", winRate: 68.5 }
    ],
    kingMidas: [
      { username: "Gold Hoarder", goldCount: 5200 },
      { username: "Treasure King", goldCount: 4800 },
      { username: "TestUser", goldCount: 4200 },
      { username: "Rich Pirate", goldCount: 3900 }
    ],
    cardMaster: [
      { username: "Card Collector", cardCount: 150 },
      { username: "Deck Master", cardCount: 135 },
      { username: "TestUser", cardCount: 120 },
      { username: "Card Hoarder", cardCount: 110 }
    ]
  };

  const userRanks = {
    strategist: 3,
    kingMidas: 3,
    cardMaster: 3,
    artisan: 2,
    shopRaider: 4,
    friendly: 5
  };

  const winRate = userStats.gamesPlayed > 0 ? (userStats.gamesWon / userStats.gamesPlayed) * 100 : 0;
  const goldPercentage = ((userStats.goldCount - userStats.highestGoldCount) / userStats.highestGoldCount * 100);
  const cardPercentage = ((userStats.currentCardCount - userStats.highestCardCount) / userStats.highestCardCount * 100);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "monster": return <Sword size={16} className="text-red-400" />;
      case "spell": return <Zap size={16} className="text-blue-400" />;
      case "trap": return <Shield size={16} className="text-green-400" />;
      default: return <Star size={16} />;
    }
  };

  return (
    <div 
      style={{ backgroundImage: "url('/assets/backgrounds/account.png')" }}
      className="h-screen w-screen bg-cover bg-center flex text-black"
    >
      <div className="flex w-full h-full">
        {/* LEFT SIDEBAR */}
        <div className="w-1/5 bg-[rgba(125,75,26,0.9)] backdrop-blur-sm border-r border-[rgba(69,26,3,0.5)] flex flex-col">
          <div className="p-4 border-b border-[rgba(69,26,3,0.3)]">
            {/* Back button */}
            <Link href="/" className="block mb-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-black/60 text-white border-white/40 hover:bg-black/80 transition-colors"
              >
                ← Back to Home
              </Button>
            </Link>
            
            <h1 className="text-xl font-[var(--font-pirata-one)] text-black mb-4">
              Account
            </h1>
            
            {/* Navigation tabs */}
            <div className="space-y-2">
              <Button
                variant={activeTab === "account" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("account")}
                className={`w-full justify-start ${
                  activeTab === "account" 
                    ? "bg-[rgb(69,26,3)] text-white" 
                    : "text-black hover:bg-black/10"
                }`}
              >
                <User size={16} className="mr-2" />
                Account
              </Button>
              
              <Button
                variant={activeTab === "battlefield" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("battlefield")}
                className={`w-full justify-start ${
                  activeTab === "battlefield" 
                    ? "bg-[rgb(69,26,3)] text-white" 
                    : "text-black hover:bg-black/10"
                }`}
              >
                <Sword size={16} className="mr-2" />
                Battlefield
              </Button>
              
              <Button
                variant={activeTab === "economy" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("economy")}
                className={`w-full justify-start ${
                  activeTab === "economy" 
                    ? "bg-[rgb(69,26,3)] text-white" 
                    : "text-black hover:bg-black/10"
                }`}
              >
                <Coins size={16} className="mr-2" />
                Economy
              </Button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 bg-[rgba(125,75,26,0.7)] backdrop-blur-s overflow-y-auto">
          {activeTab === "account" && (
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                <div className="flex items-start gap-6">
                  {/* Profile Picture */}
                  <div className="w-32 h-32 bg-[rgb(69,26,3)] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-[var(--font-pirata-one)] text-4xl">
                      {userStats.username.charAt(0)}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-[rgba(69,26,3,0.1)] p-3 rounded border border-[rgba(69,26,3,0.3)]">
                      <span className="font-[var(--font-pirata-one)] text-black font-semibold">
                        {userStats.username}
                      </span>
                    </div>
                    <div className="bg-[rgba(69,26,3,0.1)] p-3 rounded border border-[rgba(69,26,3,0.3)]">
                      <span className="font-[var(--font-pirata-one)] text-black">
                        Account ID: {userStats.username}
                      </span>
                    </div>
                    <div className="bg-[rgba(69,26,3,0.1)] p-3 rounded border border-[rgba(69,26,3,0.3)]">
                      <span className="font-[var(--font-pirata-one)] text-black">
                        Date Created: {userStats.dateCreated}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Cards Section */}
              <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                <h3 className="text-lg font-[var(--font-pirata-one)] text-black font-bold mb-4">
                  Cards (3 most used)
                </h3>
                <div className="flex gap-4">
                  {topCards.map((card, index) => (
                    <div 
                      key={card.id}
                      className="w-32 h-48 bg-[rgba(69,26,3,0.2)] border-2 border-[rgba(69,26,3,0.4)] rounded-lg overflow-hidden flex flex-col items-center justify-center"
                    >
                      {getTypeIcon(card.type)}
                      <span className="font-[var(--font-pirata-one)] text-black text-xs mt-2 text-center px-2">
                        {card.name}
                      </span>
                      <span className="font-[var(--font-pirata-one)] text-black/70 text-xs">
                        {card.matches} matches
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Display */}
              <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                <div className="text-right space-y-2">
                  <p className="font-[var(--font-pirata-one)] text-black">
                    Matches Played: {userStats.gamesPlayed}
                  </p>
                  <p className="font-[var(--font-pirata-one)] text-black">
                    Cards Owned: {userStats.currentCardCount}
                  </p>
                </div>
              </div>

              {/* Leaderboard Section */}
              <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                <h3 className="text-xl font-[var(--font-pirata-one)] text-black font-bold mb-4">
                  Leaderboard
                </h3>
                <h4 className="text-lg font-[var(--font-pirata-one)] text-black font-semibold mb-4">
                  Server Rankings
                </h4>

                {/* Rank Circles */}
                <div className="flex justify-between mb-6">
                  {Object.entries(userRanks).map(([category, rank]) => (
                    <div 
                      key={category}
                      className="w-20 h-20 rounded-full bg-[rgba(139,115,85,0.8)] border-2 border-[rgb(212,175,55)] flex items-center justify-center"
                    >
                      <span className="text-xl font-[var(--font-pirata-one)] text-[rgb(42,24,16)] font-bold">
                        {rank}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Leaderboard Lists */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-[var(--font-pirata-one)] text-black font-semibold mb-2">
                      Strategist (WinRate)
                    </h5>
                    <div className="bg-[rgba(69,26,3,0.1)] p-3 rounded max-h-40 overflow-y-auto">
                      {leaderboards.strategist.map((player, i) => (
                        <div 
                          key={i} 
                          className={`py-1 font-[var(--font-pirata-one)] text-sm ${
                            player.username === userStats.username ? 'text-[rgb(69,26,3)] font-bold' : 'text-black'
                          }`}
                        >
                          {player.username} ({player.winRate.toFixed(1)}%)
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-[var(--font-pirata-one)] text-black font-semibold mb-2">
                      King Midas (Gold)
                    </h5>
                    <div className="bg-[rgba(69,26,3,0.1)] p-3 rounded max-h-40 overflow-y-auto">
                      {leaderboards.kingMidas.map((player, i) => (
                        <div 
                          key={i} 
                          className={`py-1 font-[var(--font-pirata-one)] text-sm ${
                            player.username === userStats.username ? 'text-[rgb(69,26,3)] font-bold' : 'text-black'
                          }`}
                        >
                          {player.username} ({player.goldCount.toLocaleString()})
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-[var(--font-pirata-one)] text-black font-semibold mb-2">
                      Card Master
                    </h5>
                    <div className="bg-[rgba(69,26,3,0.1)] p-3 rounded max-h-40 overflow-y-auto">
                      {leaderboards.cardMaster.map((player, i) => (
                        <div 
                          key={i} 
                          className={`py-1 font-[var(--font-pirata-one)] text-sm ${
                            player.username === userStats.username ? 'text-[rgb(69,26,3)] font-bold' : 'text-black'
                          }`}
                        >
                          {player.username} ({player.cardCount})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "battlefield" && (
            <div className="p-6 space-y-6">
              {/* Top Stats Circles */}
              <div className="flex justify-around">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex flex-col items-center justify-center text-white shadow-lg">
                  <span className="text-2xl font-[var(--font-pirata-one)] font-bold">
                    {userStats.gamesPlayed}
                  </span>
                  <span className="text-sm font-[var(--font-pirata-one)]">Matches</span>
                </div>
                
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex flex-col items-center justify-center text-white shadow-lg">
                  <span className="text-2xl font-[var(--font-pirata-one)] font-bold">
                    {winRate.toFixed(1)}%
                  </span>
                  <span className="text-sm font-[var(--font-pirata-one)]">Win Rate</span>
                </div>
                
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex flex-col items-center justify-center text-white shadow-lg">
                  <span className="text-2xl font-[var(--font-pirata-one)] font-bold">
                    {userStats.currentCardCount}/{userStats.highestCardCount}
                  </span>
                  <span className="text-sm font-[var(--font-pirata-one)]">Cards</span>
                </div>
              </div>

              {/* Battle Statistics */}
              <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Basic Stats */}
                <div className="space-y-4">
                  <div className="bg-[rgba(255,255,255,0.9)] p-3 rounded">
                    <span className="font-[var(--font-pirata-one)] text-black">
                      Matches Won: {userStats.gamesWon}
                    </span>
                  </div>
                  <div className="bg-[rgba(255,255,255,0.9)] p-3 rounded">
                    <span className="font-[var(--font-pirata-one)] text-black">
                      Matches Lost: {userStats.gamesLost}
                    </span>
                  </div>
                  <div className="bg-[rgba(255,255,255,0.9)] p-3 rounded">
                    <span className="font-[var(--font-pirata-one)] text-black">
                      Highest Card Count: {userStats.highestCardCount}
                    </span>
                  </div>
                  <div className="bg-[rgba(255,255,255,0.9)] p-3 rounded">
                    <span className="font-[var(--font-pirata-one)] text-black">
                      Highest Gold Count: {userStats.highestGoldCount}
                    </span>
                  </div>
                </div>

                {/* Middle Column - Card Stats */}
                <div className="space-y-4">
                  <div className="bg-[rgba(255,255,255,0.9)] p-3 rounded">
                    <span className="font-[var(--font-pirata-one)] text-black">
                      Highest Card Win Rate: Sea Kraken (85.2%)
                    </span>
                  </div>
                  <div className="bg-[rgba(255,255,255,0.9)] p-3 rounded">
                    <span className="font-[var(--font-pirata-one)] text-black">
                      Lowest Card Win Rate: Weak Spell (42.1%)
                    </span>
                  </div>
                  <div className="bg-[rgba(255,255,255,0.9)] p-3 rounded">
                    <span className="font-[var(--font-pirata-one)] text-black">
                      Most Used Card: Sea Kraken (45 matches)
                    </span>
                  </div>
                  <div className="bg-[rgba(255,255,255,0.9)] p-3 rounded">
                    <span className="font-[var(--font-pirata-one)] text-black">
                      Most Expensive Card: Legendary Dragon (1,500G)
                    </span>
                  </div>
                </div>

                {/* Right Column - Radar Chart Placeholder */}
                <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 size={64} className="mx-auto text-black/50 mb-2" />
                    <p className="font-[var(--font-pirata-one)] text-black/70">
                      Battle Stats Chart
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "economy" && (
            <div className="p-6 space-y-6">
              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-6">
                {/* Gold Count Chart */}
                <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                  <h3 className="text-lg font-[var(--font-pirata-one)] text-black font-bold mb-4">
                    Gold Count Graph
                  </h3>
                  <div className="flex items-end gap-4 h-32 mb-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-16 bg-yellow-500 rounded-t flex items-end justify-center"
                        style={{ height: `${(userStats.goldCount / userStats.highestGoldCount) * 100}%` }}
                      >
                      </div>
                      <span className="text-xs font-[var(--font-pirata-one)] text-black mt-2">Current</span>
                      <span className="text-xs font-[var(--font-pirata-one)] text-black/60">
                        {userStats.goldCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 bg-yellow-600 rounded-t h-full"></div>
                      <span className="text-xs font-[var(--font-pirata-one)] text-black mt-2">Highest</span>
                      <span className="text-xs font-[var(--font-pirata-one)] text-black/60">
                        {userStats.highestGoldCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-[var(--font-pirata-one)] text-sm ${
                      goldPercentage >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {goldPercentage >= 0 ? '+' : ''}{goldPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Card Count Chart */}
                <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                  <h3 className="text-lg font-[var(--font-pirata-one)] text-black font-bold mb-4">
                    Card Count Graph
                  </h3>
                  <div className="flex items-end gap-4 h-32 mb-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-16 bg-blue-500 rounded-t"
                        style={{ height: `${(userStats.currentCardCount / userStats.highestCardCount) * 100}%` }}
                      >
                      </div>
                      <span className="text-xs font-[var(--font-pirata-one)] text-black mt-2">Current</span>
                      <span className="text-xs font-[var(--font-pirata-one)] text-black/60">
                        {userStats.currentCardCount}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 bg-blue-600 rounded-t h-full"></div>
                      <span className="text-xs font-[var(--font-pirata-one)] text-black mt-2">Highest</span>
                      <span className="text-xs font-[var(--font-pirata-one)] text-black/60">
                        {userStats.highestCardCount}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-[var(--font-pirata-one)] text-sm ${
                      cardPercentage >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {cardPercentage >= 0 ? '+' : ''}{cardPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Pie Chart Section */}
              <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-[var(--font-pirata-one)] text-black font-bold">
                    Card Stats Graph
                  </h3>
                  <select className="bg-white border border-black rounded px-2 py-1 font-[var(--font-pirata-one)] text-sm">
                    <option>Card Type</option>
                    <option>Card Attribute</option>
                    <option>Card Class</option>
                    <option>ROI</option>
                    <option>Winrate</option>
                  </select>
                </div>
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <PieChart size={64} className="mx-auto text-black/50 mb-2" />
                    <p className="font-[var(--font-pirata-one)] text-black/70">
                      Card Distribution Chart
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}