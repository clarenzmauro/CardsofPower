"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  User,
  Star,
  Coins,
  Sword,
  Shield,
  Zap,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { NivoSimpleBar } from "@/components/ui/nivo-bar";
import { NivoSimplePie } from "@/components/ui/nivo-pie";
import { NivoSimpleRadar } from "@/components/ui/nivo-radar";

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

interface TopCard {
  id: string;
  name: string;
  type: "monster" | "spell" | "trap";
  matches: number;
  imageUrl?: string;
}

interface TimeSeriesPoint {
  ts: string;
  value: number;
}

/**
 * @description
 * Brief description of function purpose and functionality.
 *
 * @receives data from:
 * - account.ts; getUserAccount: user document and computed stats
 * - account.ts; getTopCardsGlobal: array of top cards
 * - account.ts; getLeaderboards: leaderboard lists
 * - account.ts; getUserRanks: user rank positions
 * - account.ts; getEconomyStats: time-series gold and card counts
 *
 * @sends data to:
 * - account page; UI rendering: user stats, leaderboards, top cards, economy charts
 *
 * @sideEffects:
 * - none (client-side read-only mapping of backend query results)
 */
export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<
    "account" | "battlefield" | "economy"
  >("account");

  // state initialized empty; populated from Convex queries
  const [userStats, setUserStats] = useState<UserStats>({
    username: "",
    level: 1,
    experience: 0,
    maxExperience: 1000,
    dateCreated: "",
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    currentCardCount: 0,
    highestCardCount: 0,
    goldCount: 0,
    highestGoldCount: 0,
    cardsCreated: 0,
    cardsBought: 0,
    cardsTraded: 0,
    cardsListed: 0,
  });
  const [topCards, setTopCards] = useState<TopCard[]>([]);
  const [leaderboards, setLeaderboards] = useState({
    strategist: [] as Array<{ username: string; winRate: number }>,
    kingMidas: [] as Array<{ username: string; goldCount: number }>,
    cardMaster: [] as Array<{ username: string; cardCount: number }>,
  });
  const [userRanks, setUserRanks] = useState({
    strategist: 0,
    kingMidas: 0,
    cardMaster: 0,
    artisan: 0,
    shopRaider: 0,
    friendly: 0,
  });

  // backend queries, keep mock state until queries resolve.
  const accountQ = useQuery(api.account.getUserAccount);
  const leaderboardsQ = useQuery(api.account.getLeaderboards, { limit: 4 });
  const userRanksQ = useQuery(api.account.getUserRanks);
  const economyQ = useQuery(api.account.getEconomyStats, {
    range: "30d",
    granularity: "daily",
  });

  // TODO: replace with real chart state when economy charts consume history
  const setGoldHistory = (_points: TimeSeriesPoint[]) => {};
  const setCardCountHistory = (_points: TimeSeriesPoint[]) => {};

  const currentUser = useQuery(api.users.current);
  const updateProfPic = useMutation(api.users.updateProfPicUrl);

  const [pendingProfPic, setPendingProfPic] = useState<string | null>(null);
  const [showProfPicPicker, setShowProfPicPicker] = useState<boolean>(false);

  const availableProfPics: string[] = [
    "assets/profile/prof_pic1.jpg",
    "assets/profile/prof_pic2.jpg",
    "assets/profile/prof_pic3.jpg",
    "assets/profile/prof_pic4.jpg",
    "assets/profile/prof_pic5.jpg",
    "assets/profile/prof_pic6.jpg",
    "assets/profile/prof_pic7.jpg",
    "assets/profile/prof_pic8.jpg",
  ];

  const saveProfilePicture = async () => {
    if (!pendingProfPic) return;
    const userId = currentUser?.clerkId ?? "";
    if (!userId) return;
    await updateProfPic({ userId, profPicUrl: pendingProfPic });
    setPendingProfPic(null);
    setShowProfPicPicker(false);
  };

  

  // map getUserAccount to userStats and topCards
  useEffect(() => {
    if (!accountQ) return;
    try {
      setUserStats({
        username: String(accountQ.username ?? "Player"),
        dateCreated: String(accountQ.dateCreated ?? ""),
        level: Number(accountQ.level ?? 1),
        experience: Number(accountQ.experience ?? 0),
        maxExperience: Number(accountQ.maxExperience ?? 1000),
        gamesPlayed: Number(accountQ.gamesPlayed ?? 0),
        gamesWon: Number(accountQ.gamesWon ?? 0),
        gamesLost: Number(accountQ.gamesLost ?? 0),
        currentCardCount: Number(accountQ.currentCardCount ?? 0),
        highestCardCount: Number(accountQ.highestCardCount ?? 0),
        goldCount: Number(accountQ.goldCount ?? 0),
        highestGoldCount: Number(accountQ.highestGoldCount ?? 0),
        cardsCreated: Number(accountQ.cardsCreated ?? 0),
        cardsBought: Number(accountQ.cardsBought ?? 0),
        cardsTraded: Number(accountQ.cardsTraded ?? 0),
        cardsListed: Number(accountQ.cardsListed ?? 0),
      });
      if (Array.isArray(accountQ.topCards)) {
        setTopCards(accountQ.topCards as TopCard[]);
      }
    } catch (e) {
      console.warn("Mapping getUserAccount failed", e);
    }
  }, [accountQ]);

  // map leaderboards
  useEffect(() => {
    if (!leaderboardsQ) return;
    try {
      setLeaderboards({
        strategist: Array.isArray(leaderboardsQ.strategist)
          ? leaderboardsQ.strategist.map(item => ({
              username: item.username,
              winRate: Number(item.winRate ?? 0)
            }))
          : [],
        kingMidas: Array.isArray(leaderboardsQ.kingMidas)
          ? leaderboardsQ.kingMidas.map(item => ({
              username: item.username,
              goldCount: Number(item.goldCount ?? 0)
            }))
          : [],
        cardMaster: Array.isArray(leaderboardsQ.cardMaster)
          ? leaderboardsQ.cardMaster.map(item => ({
              username: item.username,
              cardCount: Number(item.cardCount ?? 0)
            }))
          : [],
      });
    } catch (e) {
      console.warn("Mapping getLeaderboards failed", e);
    }
  }, [leaderboardsQ]);

  // map user ranks
  useEffect(() => {
    if (!userRanksQ) return;
    try {
      setUserRanks({
        strategist: Number(userRanksQ.strategist ?? 0),
        kingMidas: Number(userRanksQ.kingMidas ?? 0),
        cardMaster: Number(userRanksQ.cardMaster ?? 0),
        artisan: Number(userRanksQ.artisan ?? 0),
        shopRaider: Number(userRanksQ.shopRaider ?? 0),
        friendly: Number(userRanksQ.friendly ?? 0),
      });
    } catch (e) {
      console.warn("Mapping getUserRanks failed", e);
    }
  }, [userRanksQ]);

  // map getEconomyStats -> local time-series used by charts
  useEffect(() => {
    if (!economyQ) return;
    try {
      if (Array.isArray((economyQ as any).goldHistory)) {
        setGoldHistory(
          (economyQ as any).goldHistory.map((p: any) => ({
            ts: String(p.ts ?? ""),
            value: Number(p.value ?? 0),
          }))
        );
      }
      if (Array.isArray((economyQ as any).cardCountHistory)) {
        setCardCountHistory(
          (economyQ as any).cardCountHistory.map((p: any) => ({
            ts: String(p.ts ?? ""),
            value: Number(p.value ?? 0),
          }))
        );
      }
    } catch (e) {
      console.warn("Mapping getEconomyStats failed", e);
    }
  }, [economyQ]);

  // winRate is now calculated in the backend from user games
  const winRate = accountQ ? (accountQ.winRate ?? 0) : 0;
  const goldPercentage =
    ((userStats.goldCount - userStats.highestGoldCount) /
      (userStats.highestGoldCount || 1)) *
    100;
  const cardPercentage =
    ((userStats.currentCardCount - userStats.highestCardCount) /
      (userStats.highestCardCount || 1)) *
    100;

  const goldData = [
    { name: "Current", value: Math.max(0, Number(userStats.goldCount || 0)) },
    { name: "Highest", value: Math.max(0, Number(userStats.highestGoldCount || 0)) },
  ];

  const cardData = [
    { name: "Current", value: Math.max(0, Number(userStats.currentCardCount || 0)) },
    { name: "Highest", value: Math.max(0, Number(userStats.highestCardCount || 0)) },
  ];

  // Radar data computed from existing stats (clamped to 0-100)
  const radarData: Array<{ subject: string; A: number }> = (() => {
    const clampPercentage = (value: number): number => {
      const numeric = Number.isFinite(value) ? value : 0;
      if (numeric < 0) return 0;
      if (numeric > 100) return 100;
      return numeric;
    };

    const percent = (numerator: number, denominator: number): number => {
      const n = Number(numerator ?? 0);
      const d = Number(denominator ?? 0);
      if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
      return (n / d) * 100;
    };

    // 1) Win Rate is already returned as percentage from backend
    const winRatePct = clampPercentage(Number(winRate ?? 0));

    // 2) Activity: normalize recent activity by capping at 50 matches for 100%
    const activityCap = 50;
    const activityPct = clampPercentage(percent(Number(userStats.gamesPlayed ?? 0), activityCap));

    // 3) Collection progress: current vs historical max
    const collectionPct = clampPercentage(
      percent(Number(userStats.currentCardCount ?? 0), Math.max(Number(userStats.highestCardCount ?? 0), 1))
    );

    // 4) Wealth progress: current gold vs historical max
    const wealthPct = clampPercentage(
      percent(Number(userStats.goldCount ?? 0), Math.max(Number(userStats.highestGoldCount ?? 0), 1))
    );

    // 5) Top-card usage share among shown top cards
    const topCardUsagePct = (() => {
      if (!Array.isArray(topCards) || topCards.length === 0) return 0;
      const totalMatches = topCards.reduce((sum, c) => sum + Number(c?.matches ?? 0), 0);
      if (!Number.isFinite(totalMatches) || totalMatches <= 0) return 0;
      const topMatches = Number(topCards[0]?.matches ?? 0);
      return clampPercentage((topMatches / totalMatches) * 100);
    })();

    return [
      { subject: "Win Rate", A: winRatePct },
      { subject: "Activity", A: activityPct },
      { subject: "Collection", A: collectionPct },
      { subject: "Wealth", A: wealthPct },
      { subject: "Top Card Share", A: topCardUsagePct },
    ];
  })();

  const pieData = (() => {
    if (!Array.isArray(topCards) || topCards.length === 0) return [];

    const counts: Record<string, number> = { monster: 0, spell: 0, trap: 0 };
    for (const c of topCards) {
      const t = (c?.type ?? "monster").toString();
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return [
      { id: "Monster", label: "Monster", value: counts.monster ?? 0 },
      { id: "Spell", label: "Spell", value: counts.spell ?? 0 },
      { id: "Trap", label: "Trap", value: counts.trap ?? 0 },
    ];
  })();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "monster":
        return <Sword size={16} className="text-red-400" />;
      case "spell":
        return <Zap size={16} className="text-blue-400" />;
      case "trap":
        return <Shield size={16} className="text-green-400" />;
      default:
        return <Star size={16} />;
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
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[rgb(69,26,3)]"
                    onClick={() => setShowProfPicPicker(true)}
                  >
                    <img
                      src={(pendingProfPic ?? currentUser?.profPicUrl ?? "assets/profile/prof_pic1.jpg")}
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'assets/profile/prof_pic1.jpg';
                      }}
                    />
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
                        Account ID: {accountQ?.clerkId ?? "N/A"}
                      </span>
                    </div>
                    <div className="bg-[rgba(69,26,3,0.1)] p-3 rounded border border-[rgba(69,26,3,0.3)]">
                      <span className="font-[var(--font-pirata-one)] text-black">
                      Date Created: {new Date(userStats.dateCreated).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile picture selector */}
                {showProfPicPicker && (
                <div className="mt-6">
                  <h3 className="text-sm font-[var(--font-pirata-one)] text-black mb-2">Choose a profile picture</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {availableProfPics.map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setPendingProfPic(src)}
                        className={`border rounded overflow-hidden focus:outline-none ${
                          (pendingProfPic ?? currentUser?.profPicUrl) === src
                            ? "border-[rgb(69,26,3)] ring-2 ring-[rgb(69,26,3)]"
                            : "border-[rgba(69,26,3,0.3)] hover:border-[rgb(69,26,3)]"
                        }`}
                      >
                        <img
                          src={src}
                          alt="Profile option"
                          className="w-full h-20 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'assets/profile/prof_pic1.jpg';
                          }}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-[rgb(69,26,3)] text-white"
                      onClick={saveProfilePicture}
                      disabled={!pendingProfPic || !currentUser?.clerkId}
                    >
                      Save Picture
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-black border-[rgba(69,26,3,0.4)]"
                      onClick={() => {
                        setPendingProfPic(null);
                        setShowProfPicPicker(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
                )}
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
                    <div key={category} className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-[rgba(139,115,85,0.8)] border-2 border-[rgb(212,175,55)] flex items-center justify-center">
                        <span className="text-xl font-[var(--font-pirata-one)] text-[rgb(42,24,16)] font-bold">
                          {rank}
                        </span>
                      </div>
                      <span className="mt-2 font-[var(--font-pirata-one)] text-sm text-black capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
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
                            player.username === userStats.username
                              ? "text-[rgb(69,26,3)] font-bold"
                              : "text-black"
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
                            player.username === userStats.username
                              ? "text-[rgb(69,26,3)] font-bold"
                              : "text-black"
                          }`}
                        >
                          {player.username} ({player.goldCount.toLocaleString()}
                          )
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
                            player.username === userStats.username
                              ? "text-[rgb(69,26,3)] font-bold"
                              : "text-black"
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
                  <span className="text-sm font-[var(--font-pirata-one)]">
                    Matches
                  </span>
                </div>

                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex flex-col items-center justify-center text-white shadow-lg">
                  <span className="text-2xl font-[var(--font-pirata-one)] font-bold">
                    {winRate.toFixed(1)}%
                  </span>
                  <span className="text-sm font-[var(--font-pirata-one)]">
                    Win Rate
                  </span>
                </div>

                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex flex-col items-center justify-center text-white shadow-lg">
                  <span className="text-2xl font-[var(--font-pirata-one)] font-bold">
                    {userStats.currentCardCount}/{userStats.highestCardCount}
                  </span>
                  <span className="text-sm font-[var(--font-pirata-one)]">
                    Cards
                  </span>
                </div>
              </div>

              {/* Battle Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Basic Stats */}
                <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-4 h-full min-h-[300px]">
                  <div className="grid grid-cols-1 gap-3 h-full">
                    <div className="p-3 rounded border-b border-[rgba(69,26,3,0.2)]">
                      <span className="font-[var(--font-pirata-one)] text-black">
                        Matches Won: {userStats.gamesWon}
                      </span>
                    </div>
                    <div className="p-3 rounded border-b border-[rgba(69,26,3,0.2)]">
                      <span className="font-[var(--font-pirata-one)] text-black">
                        Matches Lost: {userStats.gamesLost}
                      </span>
                    </div>
                    <div className="p-3 rounded border-b border-[rgba(69,26,3,0.2)]">
                      <span className="font-[var(--font-pirata-one)] text-black">
                        Highest Card Count: {userStats.highestCardCount}
                      </span>
                    </div>
                    <div className="p-3 rounded">
                      <span className="font-[var(--font-pirata-one)] text-black">
                        Highest Gold Count: {userStats.highestGoldCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Card Stats */}
                <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-4 h-full min-h-[300px]">
                  {topCards.length > 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="p-3 rounded w-full">
                        <span className="font-[var(--font-pirata-one)] text-black">
                          Most Used Card: {topCards[0].name} ({topCards[0].matches} matches)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="font-[var(--font-pirata-one)] text-black/50">
                        No card usage data available
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Column - Radar Chart */}
                <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-4 h-full min-h-[300px]">
                  <NivoSimpleRadar data={radarData} height={280} />
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
                  <h3 className="text-lg font-[var(--font-pirata-one)] text-black font-bold mb-4">Gold Count Graph</h3>
                  <NivoSimpleBar data={goldData} height={180} />
                  <div className="text-right mt-2">
                    <span className={`font-[var(--font-pirata-one)] text-sm ${goldPercentage >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {goldPercentage >= 0 ? "+" : ""}{goldPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Card Count Chart */}
                <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                  <h3 className="text-lg font-[var(--font-pirata-one)] text-black font-bold mb-4">Card Count Graph</h3>
                  <NivoSimpleBar data={cardData} height={180} />
                  <div className="text-right mt-2">
                    <span className={`font-[var(--font-pirata-one)] text-sm ${cardPercentage >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {cardPercentage >= 0 ? "+" : ""}{cardPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Pie Chart Section */}
              <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-[var(--font-pirata-one)] text-black font-bold">Card Stats Graph</h3>
                  <select className="bg-white border border-black rounded px-2 py-1 font-[var(--font-pirata-one)] text-sm">
                    <option>Card Type</option>
                    <option>Card Attribute</option>
                    <option>Card Class</option>
                    <option>ROI</option>
                    <option>Winrate</option>
                  </select>
                </div>
                {pieData.length > 0 ? (
                  <NivoSimplePie
                    data={pieData}
                    height={260}
                  />
                ) : (
                  <div className="h-[260px] flex items-center justify-center">
                    <span className="font-[var(--font-pirata-one)] text-black/50">
                      No card data available
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
