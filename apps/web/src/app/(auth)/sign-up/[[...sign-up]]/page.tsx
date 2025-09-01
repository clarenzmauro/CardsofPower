"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@cards-of-power/backend/convex/_generated/api";

/**
 * @description
 * Sign-up page component that integrates Clerk authentication with Convex database mutations.
 * Handles user creation flow and redirects to main menu after successful registration.
 *
 * @receives data from:
 * - Clerk: user authentication state and profile data
 * - Convex: upsertFromClerk mutation for database operations
 *
 * @sends data to:
 * - Convex: user data for database insertion/update
 * - Router: navigation to main menu after completion
 *
 * @sideEffects:
 * - Creates or updates user record in database via webhook or direct mutation
 * - Redirects user to main menu after account creation
 */

export default function SignUpPage() {
    const { user, isLoaded } = useUser();
    const upsertUser = useMutation(api.users.upsertFromClerk);
    const router = useRouter();
    const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const shouldSkipDirectMutation = true;

    useEffect(() => {
        // Only run after Clerk has loaded and user is signed up
        if (!isLoaded || !user || hasAttemptedCreation) {
            return;
        }

        setHasAttemptedCreation(true);

        // webhook
        if (shouldSkipDirectMutation) {
            setTimeout(() => router.push("/main-menu"), 2000);
            return;
        }

        setIsCreating(true);

        // Format user data for the upsertFromClerk mutation
        const userData = {
            clerkId: user.id,
            first_name: user.firstName || "",
            last_name: user.lastName || "",
            username: user.username || user.firstName || "Player",
            email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "",
        };

        upsertUser({ data: userData })
            .then(() => {
                setIsCreating(false);
                router.push("/main-menu");
            })
            .catch((error) => {
                console.error("Failed to create user:", error);
                setIsCreating(false);
                router.push("/main-menu");
            });
    }, [isLoaded, user, upsertUser, router, hasAttemptedCreation]);

    // if (isCreating) {
    //     return (
    //         <main
    //             className="bg-cover h-screen w-screen flex items-center justify-center"
    //             style={{ backgroundImage: "url('/assets/backgrounds/login.jpg')" }}
    //         >
    //             <div className="text-white text-center">
    //                 <div className="text-xl mb-4">Creating your account...</div>
    //                 <div className="text-sm opacity-75">Check browser console for details</div>
    //             </div>
    //         </main>
    //     );
    // }

    return (
        <main
            className="bg-cover h-screen w-screen flex items-center justify-center"
            style={{ backgroundImage: "url('/assets/backgrounds/login.jpg')" }}
        >
            <SignUp
                routing="path"
                path="/sign-up"
                fallbackRedirectUrl="/main-menu"
                signInUrl="/sign-in"
                appearance={{
                    variables: {
                        colorBackground: 'rgba(125, 75, 26, 0.85)',
                        colorText: '#000000',
                        fontFamily: 'var(--font-pirata-one)',
                        fontSize: "20px",
                    },
                    elements: {
                        // uncomment to hide clerk's branding in prod
                        // footer: 'hidden',
                    },
                }}
            />
        </main>
    );
}