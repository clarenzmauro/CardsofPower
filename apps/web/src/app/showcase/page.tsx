"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image"

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

    const cardRef = useRef<HTMLDivElement | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const tiltRef = useRef({ rx: 0, ry: 0 });
    const isFlippedRef = useRef(false);

    useEffect(() => {
        isFlippedRef.current = isFlipped;
    }, [isFlipped]);

    const applyTransform = () => {
        const node = cardRef.current;
        if (!node) return;
        const { rx, ry } = tiltRef.current;
        const flipY = isFlippedRef.current ? 180 : 0;
        node.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry + flipY}deg)`;
    };
    
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
        if (currentUser) {
            const shouldRedirectToMenu = currentUser.gamesPlayed > 0 || currentUser.hasSeenShowcase;
            console.log("Showcase guard:", {
                gamesPlayed: currentUser.gamesPlayed,
                currentCardCount: currentUser.currentCardCount,
                hasSeenShowcase: currentUser.hasSeenShowcase,
                route: shouldRedirectToMenu ? "/main-menu" : "stay",
            });
            if (shouldRedirectToMenu) {
                router.push("/main-menu" as any);
                return;
            }
        }
    }, [isLoaded, user, currentUser, router]);

    if (!isLoaded || currentUser === undefined || userCards === undefined) {
        return (
            <div 
                className="min-h-screen bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: "url('/assets/backgrounds/showcase.png')" }}
            >
                <div className="text-white text-xl">Loading your cards...</div>
            </div>
        );
    }

    if (!currentUser || !user) {
        return null;
    }

    if (userCards.length === 0) {
        return (
            <div 
                className="min-h-screen bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: "url('/assets/backgrounds/showcase.png')" }}
            >
                <div className="text-white text-xl">Preparing your starter cards…</div>
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
                className="min-h-screen bg-cover bg-center flex items-center justify-center p-8"
                style={{ backgroundImage: "url('/assets/backgrounds/showcase.png')" }}
            >
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-white mb-8 font-[family-name:var(--font-pirata-one)]">
                        Your Complete Collection
                    </h1>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
                        {userCards.map((card: any, index: number) => (
                            <div key={card._id} className="p-1">
                                <div 
                                    className="relative w-full h-70 cursor-pointer transition-transform duration-300 ease-out hover:scale-110"
                                    onMouseMove={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;
                                        const centerX = rect.width / 2;
                                        const centerY = rect.height / 2;
                                        const rotateX = (y - centerY) / 10;
                                        const rotateY = (centerX - x) / 10;
                                        e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1)`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = '';
                                    }}
                                >
                                    <img 
                                        src={card.imageUrl} 
                                        alt={card.name}
                                        className="w-full h-full object-contain rounded-lg shadow-lg"
                                    />

                                    {/* <h3 className="font-bold text-sm text-white text-center">{card.name}</h3> */}
                                    {/* <p className="text-xs text-white/80 text-center">{card.type}</p> */}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <button
                            onClick={handleProceed}
                            className="bg-black/40 backdrop-blur-sm border border-white/20 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 hover:bg-black/60 font-[family-name:var(--font-pirata-one)]"
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
                <h1 className="text-3xl font-bold text-white mb-4 font-[family-name:var(--font-pirata-one)]">
                    Your Starter Cards
                </h1>
                <p className="text-white/80 mb-2 font-[family-name:var(--font-pirata-one)]">
                    Card {currentCardIndex + 1} of {userCards.length}
                </p>
                
                {/* Card Display */}
                <div className="relative mb-8">
                    <div 
                        ref={cardRef}
                        className={`relative w-80 h-[480px] mx-auto cursor-pointer transform-style-preserve-3d hover:scale-110 transition-all duration-300 ease-out`}
                        style={{ willChange: "transform" }}
                        onClick={() => {
                            setIsFlipped((prev) => {
                                const next = !prev;
                                isFlippedRef.current = next;
                                if (rafIdRef.current == null) {
                                    rafIdRef.current = requestAnimationFrame(() => {
                                        applyTransform();
                                        rafIdRef.current = null;
                                    });
                                }
                                return next;
                            });
                        }}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            const centerX = rect.width / 2;
                            const centerY = rect.height / 2;
                            // Clamp tilt to avoid excessive GPU work
                            const rotateX = Math.max(-12, Math.min(12, (y - centerY) / 10));
                            const rotateY = Math.max(-12, Math.min(12, (centerX - x) / 10));
                            tiltRef.current = { rx: rotateX, ry: rotateY };
                            if (rafIdRef.current == null) {
                                rafIdRef.current = requestAnimationFrame(() => {
                                    applyTransform();
                                    rafIdRef.current = null;
                                });
                            }
                        }}
                        onMouseLeave={() => {
                            // Reset tilt, preserve flip
                            tiltRef.current = { rx: 0, ry: 0 };
                            applyTransform();
                        }}
                    >
                        {/* Card Front */}
                        <div className="absolute inset-0 w-full h-full backface-hidden">
                            <Image 
                                src={currentCard.imageUrl} 
                                alt={currentCard.name}
                                width={400}
                                height={500}
                                className="w-full h-full object-contain rounded-xl"
                            />
                        </div>
                        
                        {/* Card Back */}
                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                            <Image 
                                src="/assets/cards/back-card.png"
                                alt="Card Back"
                                width={400}
                                height={500}
                                className="w-full h-full object-contain rounded-xl"
                            />
                            <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-white">
                                {/* <h2 className="text-3xl font-bold mb-4 text-center drop-shadow-lg">{currentCard.name}</h2> */}
                                {/* {currentCard.description && (
                                    <div className="mb-6 p-4 bg-black/30 rounded-lg text-center text-base backdrop-blur-sm">
                                        <span className="drop-shadow-md">{currentCard.description}</span>
                                    </div>
                                )}
                                can be added back if needed
                                */}
                                
                                <div className="space-y-3 w-full max-w-sm">
                                    {currentCard.type && (
                                        <div className="flex justify-center items-center p-3 bg-black/20 rounded-lg backdrop-blur-sm font-[family-name:var(--font-pirata-one)]">
                                            <span className="capitalize text-base">{currentCard.type} Card</span>
                                        </div>
                                    )}
                                    {(currentCard.type === "trap" || currentCard.type === "spell") && (
                                        <div className="p-3 bg-yellow-900/30 rounded-lg backdrop-blur-sm font-[family-name:var(--font-pirata-one)]">
                                            <span className="text-sm text-yellow-200">
                                                {currentCard.type === "trap" ? "Trap" : "Spell"} cards have minimal stats
                                            </span>
                                        </div>
                                    )}
                                    {currentCard.attribute && (
                                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg backdrop-blur-sm font-[family-name:var(--font-pirata-one)]">
                                            <span className="font-medium text-base">Attribute:</span>
                                            <span className="capitalize text-base">{currentCard.attribute}</span>
                                        </div>
                                    )}
                                    {currentCard.class && (
                                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg backdrop-blur-sm font-[family-name:var(--font-pirata-one)]">
                                            <span className="font-medium text-base">Class:</span>
                                            <span className="capitalize text-base">{currentCard.class}</span>
                                        </div>
                                    )}
                                    {currentCard.level && (
                                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg backdrop-blur-sm font-[family-name:var(--font-pirata-one)]">
                                            <span className="font-medium text-base">Level:</span>
                                            <span className="text-base">{currentCard.level}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg backdrop-blur-sm font-[family-name:var(--font-pirata-one)]">
                                        <span className="font-medium text-base">Market Value:</span>
                                        <span className="text-base">{currentCard.marketValue} gold</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <p className="text-white/60 mb-4 text-sm font-[family-name:var(--font-pirata-one)]">
                    Click the card to flip and see details
                </p>
                
                <button
                    onClick={handleContinue}
                    className="bg-black/40 backdrop-blur-sm border border-white/20 text-white font-[family-name:var(--font-pirata-one)] py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-black/60"
                >
                    {currentCardIndex < userCards.length - 1 ? 'Continue' : 'View All Cards'}
                </button>
            </div>
        </div>
    );
}