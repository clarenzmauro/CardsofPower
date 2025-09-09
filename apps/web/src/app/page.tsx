"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * @description
 * Landing page that routes users to the right place and ensures database sync.
 *
 * @receives data from:
 * - Clerk useUser hook for authentication state
 * - Convex query for user data
 *
 * @sends data to:
 * - /main-menu: redirect for authenticated users
 * - /sign-in: redirect for unauthenticated users
 *
 * @sideEffects:
 * - Creates database record for authenticated users who don't exist in database
 * - Client-side redirect based on user state
 */
export default function Home() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    
    // Get current user data to check if they exist in database
    const currentUser = useQuery(
        api.users.current,
        user ? {} : "skip"
    );
    
    const upsertUser = useMutation(api.users.upsertFromClerk);

    useEffect(() => {
        if (!isLoaded) return;

        // If not authenticated, go to sign-in
        if (!user) {
            router.push("/sign-in" as any);
            return;
        }

        // Wait for user query to complete
        if (currentUser === undefined) return;

        // If user exists in database, check if they're a new user who should see showcase
        if (currentUser) {
            // New users have 0 games played, some starter cards, and haven't seen showcase yet
            if (currentUser.gamesPlayed === 0 && currentUser.currentCardCount > 0 && !currentUser.hasSeenShowcase) {
                router.push("/showcase" as any);
            } else {
                // Existing users or users who completed showcase go to main menu
                router.push("/main-menu" as any);
            }
            return;
        }

        // User is authenticated but doesn't exist in database - create them
        if (!isCreating) {
            setIsCreating(true);
            
            const userData = {
                clerkId: user.id,
                first_name: user.firstName || "",
                last_name: user.lastName || "",
                username: user.username || user.firstName || "Player",
                email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "",
            };

            upsertUser({ data: userData })
                .then((result) => {
                    setIsCreating(false);
                    
                    // Check if this is a new user
                    if (result?.isNewUser) {
                        console.log("New user detected - redirecting to showcase");
                        router.push("/showcase" as any);
                    } else {
                        console.log("Existing user - redirecting to main menu");
                        router.push("/main-menu" as any);
                    }
                })
                .catch((error) => {
                    console.error("Failed to create user:", error);
                    setIsCreating(false);
                    // Still redirect to avoid infinite loading
                    router.push("/main-menu" as any);
                });
        }
    }, [isLoaded, user, currentUser, upsertUser, router, isCreating]);

    return (
        <div 
            className="min-h-screen bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: "url('/assets/backgrounds/showcase.png')" }}
        >
            <div className="text-white text-xl">
                {!isLoaded ? "Loading..." : 
                 isCreating ? "Setting up your account..." : 
                 "Redirecting..."}
            </div>
        </div>
    );
}