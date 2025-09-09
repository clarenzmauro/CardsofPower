"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * @description
 * Showcase page for new users to view their 10 starter cards individually
 * 
 * @receives data from:
 * - Clerk useUser hook for authentication
 * - Convex query for user's inventory cards
 * 
 * @sends data to:
 * - Main menu after showcase completion
 * 
 * @sideEffects:
 * - Displays cards one by one with rotation interaction
 * - Final grid view with all cards
 */
export default function ShowcasePage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showAllCards, setShowAllCards] = useState(false);
    
    const markShowcaseCompleted = useMutation(api.users.markShowcaseCompleted);
    
    // Get current user data
    const currentUser = useQuery(
        api.users.current,
        user ? {} : "skip"
    );
    
    // Get user's cards from inventory
    const userCards = useQuery(
        api.cards.getByIds,
        currentUser?.inventory ? { cardIds: currentUser.inventory as any } : "skip"
    );

    useEffect(() => {
        if (!isLoaded) return;
        
        // Redirect if not authenticated
        if (!user) {
            router.push("/sign-in" as any);
            return;
        }
        
        // Redirect if user doesn't exist or has already seen showcase
        // New users have 0 games played, some starter cards, and haven't seen showcase yet
        if (currentUser && (currentUser.gamesPlayed > 0 || currentUser.currentCardCount === 0 || currentUser.hasSeenShowcase)) {
            router.push("/main-menu" as any);
            return;
        }
    }, [isLoaded, user, currentUser, router]);

    if (!isLoaded || !currentUser || !userCards) {
        return (
            <div 
                className="min-h-screen bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: "url('/assets/backgrounds/showcase.png')" }}
            >
                <div className="text-white text-xl">Loading your cards...</div>
            </div>
        );
    }

    if (userCards.length === 0) {
        return (
            <div 
                className="min-h-screen bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: "url('/assets/backgrounds/showcase.png')" }}
            >
                <div className="text-white text-xl">Error: No cards found. Redirecting...</div>
            </div>
        );
    }

    const currentCard = userCards[currentCardIndex];

    const handleContinue = () => {
        if (currentCardIndex < userCards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
            setIsFlipped(false);
        } else {
            setShowAllCards(true);
        }
    };

    const handleProceed = async () => {
        try {
            // Mark showcase as completed so user never sees it again
            await markShowcaseCompleted();
            router.push("/main-menu" as any);
        } catch (error) {
            console.error("Failed to mark showcase completed:", error);
            // Still redirect to avoid getting stuck
            router.push("/main-menu" as any);
        }
    };

    if (showAllCards) {
        return (
            <div 
                className="min-h-screen bg-cover bg-center p-8"
                style={{ backgroundImage: "url('/assets/backgrounds/showcase.png')" }}
            >
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold text-white text-center mb-8">
                        Your Complete Collection
                    </h1>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                        {userCards.map((card: any, index: number) => (
                            <div key={card._id} className="bg-white rounded-lg p-4 shadow-lg">
                                <img 
                                    src={card.imageUrl} 
                                    alt={card.name}
                                    className="w-full h-32 object-cover rounded mb-2"
                                />
                                <h3 className="font-bold text-sm text-center">{card.name}</h3>
                                <p className="text-xs text-gray-600 text-center">{card.type}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <button
                            onClick={handleProceed}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105"
                        >
                            Proceed to Main Menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-8 bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/backgrounds/showcase.png')" }}
        >
            <div className="max-w-md mx-auto text-center">
                <h1 className="text-3xl font-bold text-white mb-4">
                    Your Starter Cards
                </h1>
                <p className="text-white/80 mb-2">
                    Card {currentCardIndex + 1} of {userCards.length}
                </p>
                
                {/* Card Display */}
                <div className="relative mb-8">
                    <div 
                        className={`relative w-64 h-96 mx-auto cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        {/* Card Front */}
                        <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-lg shadow-xl p-4">
                            <img 
                                src={currentCard.imageUrl} 
                                alt={currentCard.name}
                                className="w-full h-48 object-cover rounded mb-4"
                            />
                            <h2 className="text-xl font-bold mb-2">{currentCard.name}</h2>
                            <p className="text-sm text-gray-600 mb-2">{currentCard.type}</p>
                            {currentCard.atkPts !== undefined && (
                                <div className="flex justify-between text-sm">
                                    <span>ATK: {currentCard.atkPts}</span>
                                    <span>DEF: {currentCard.defPts}</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Card Back */}
                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-xl p-4 text-white">
                            <h2 className="text-xl font-bold mb-4">{currentCard.name}</h2>
                            <p className="text-sm mb-4">{currentCard.description || "No description available"}</p>
                            {currentCard.attribute && (
                                <p className="text-sm mb-2"><strong>Attribute:</strong> {currentCard.attribute}</p>
                            )}
                            {currentCard.class && (
                                <p className="text-sm mb-2"><strong>Class:</strong> {currentCard.class}</p>
                            )}
                            {currentCard.level && (
                                <p className="text-sm mb-2"><strong>Level:</strong> {currentCard.level}</p>
                            )}
                            <p className="text-sm"><strong>Market Value:</strong> {currentCard.marketValue} gold</p>
                        </div>
                    </div>
                </div>
                
                <p className="text-white/60 mb-4 text-sm">
                    Click the card to flip and see details
                </p>
                
                <button
                    onClick={handleContinue}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                    {currentCardIndex < userCards.length - 1 ? 'Continue' : 'View All Cards'}
                </button>
            </div>
        </div>
    );
}