"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/convex/_generated/api";
import { type Id } from "@backend/convex/_generated/dataModel";

export default function BattlePage() {
  const router = useRouter();
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);
  const availableRooms = useQuery(api.battle.listJoinableBattles) ?? [];
  const createBattle = useMutation(api.battle.createBattle);
  const joinBattle = useMutation(api.battle.joinBattle);

  const handleCreateRoom = async () => {
    const battleId = await createBattle({ turnDurationSec: 30 });
    if (!battleId) throw new Error("Failed to create battle");
    router.push(`/battle/battlefield?battleId=${battleId}`);
  };

  const handleFindRooms = () => {
    setIsSearchingRooms(true);
  };

  const handleCancelSearch = () => {
    setIsSearchingRooms(false);
  };

  const handleJoinRoom = async (battleId: string, mode: 'waiting' | 'rejoin') => {
    if (mode === 'waiting') {
      await joinBattle({ battleId: battleId as Id<'battles'> });
    }
    router.push(`/battle/battlefield?battleId=${battleId}`);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-8 relative"
      style={{ 
        backgroundImage: "url('/assets/backgrounds/lobby.png')",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 to-stone-900/50"></div>
      
      {/* Main content */}
      <div className="relative z-10 flex gap-8 max-w-4xl w-full h-[500px]">
        {/* Create Room Card */}
        <div className="flex-1 bg-gradient-to-b from-stone-800/75 to-stone-900/75 backdrop-blur-s rounded-xl border-2 border-stone-600/80 shadow-2xl p-8">
          <div className="text-center h-full flex flex-col">
            <h2 className="text-3xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'var(--font-pirata-one)' }}>Create Room</h2>
            <p className="text-stone-200 mb-6 leading-relaxed flex-grow" style={{ fontFamily: 'var(--font-pirata-one)' }}>
              Start your own battle room and invite other captains to join your crew. 
              Set the rules of engagement and prepare for epic naval combat!
            </p>
            <button 
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-orange-700 to-red-800 hover:from-orange-800 hover:to-red-900 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border border-orange-600 mt-auto"
              style={{ fontFamily: 'var(--font-pirata-one)' }}
            >
              Create Your Room
            </button>
          </div>
        </div>

        {/* Join Room Card */}
        <div className="flex-1 bg-gradient-to-b from-stone-800/75 to-stone-900/75 backdrop-blur-s rounded-xl border-2 border-stone-600/80 shadow-2xl p-8">
          <div className="text-center h-full flex flex-col">
            <h2 className="text-3xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'var(--font-pirata-one)' }}>Join Room</h2>
            
            {!isSearchingRooms ? (
              <>
                <p className="text-stone-200 mb-6 leading-relaxed flex-grow" style={{ fontFamily: 'var(--font-pirata-one)' }}>
                  Search for existing battle rooms and join other captains in their 
                  quest for maritime supremacy. Choose your battles wisely!
                </p>
                <button 
                  onClick={handleFindRooms}
                  className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border border-amber-600 mt-auto"
                  style={{ fontFamily: 'var(--font-pirata-one)' }}
                >
                  Find Rooms
                </button>
              </>
            ) : (
              <>
                <div className="flex-grow flex flex-col mb-6">
                  <p className="text-stone-200 mb-4" style={{ fontFamily: 'var(--font-pirata-one)' }}>Available Rooms:</p>
                  <div className="space-y-3 overflow-y-auto max-h-64 pr-2 scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
                    {availableRooms.map((room) => (
                      <div 
                        key={room.id}
                        className="bg-stone-700/60 border border-stone-500 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div className="text-left">
                          <div className="text-stone-100 font-semibold" style={{ fontFamily: 'var(--font-pirata-one)' }}>{room.playerA.name}</div>
                          <div className="text-stone-300 text-sm" style={{ fontFamily: 'var(--font-pirata-one)' }}>Created: {new Date(room.createdAt).toLocaleTimeString()}</div>
                          {room.mode === 'rejoin' && (
                            <div className="text-emerald-300 text-xs mt-1" style={{ fontFamily: 'var(--font-pirata-one)' }}>You can rejoin this battle</div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleJoinRoom(room.id, room.mode)}
                          className={`px-4 py-2 rounded text-sm transition-colors ${room.mode === 'rejoin' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'} text-white`}
                          style={{ fontFamily: 'var(--font-pirata-one)' }}
                        >
                          {room.mode === 'rejoin' ? 'Rejoin' : 'Join'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleCancelSearch}
                  className="bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border border-stone-500 mt-auto"
                  style={{ fontFamily: 'var(--font-pirata-one)' }}
                >
                  Cancel Searching
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
