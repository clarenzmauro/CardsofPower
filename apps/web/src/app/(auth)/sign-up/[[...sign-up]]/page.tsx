"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@cards-of-power/backend/convex/_generated/api";

/**
 * @description
 * Sign-up page component that integrates Clerk authentication with Convex database mutations.
 * Handles user creation flow and redirects to main menu after successful registration.
 * Also handles users redirected from sign-in who need to complete registration.
 *
 * @receives data from:
 * - Clerk: user authentication state and profile data
 * - Convex: upsertFromClerk mutation for database operations
 * - Convex: current user query to check if user already exists
 *
 * @sends data to:
 * - Convex: user data for database insertion/update
 * - Router: navigation to main menu after completion
 *
 * @sideEffects:
 * - Creates or updates user record in database via webhook or direct mutation
 * - Redirects user to main menu after account creation
 * - Handles automatic account creation for authenticated users without database records
 */

export default function SignUpPage() {
    const { user, isLoaded } = useUser();
    const currentUser = useQuery(api.users.current);
    const upsertUser = useMutation(api.users.upsertFromClerk);
    const assignServer = useMutation(api.users.assignServerOnFirstAuth);
    const router = useRouter();
    const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const shouldSkipDirectMutation = false;

    useEffect(() => {
        // only run after Clerk has loaded and user is signed up
        if (!isLoaded || !user || hasAttemptedCreation) {
            return;
        }

        // wait for the currentUser query to complete
        if (currentUser === undefined) {
            return;
        }

        // if user already exists in database, redirect to main menu
        if (currentUser) {
            router.push("/main-menu");
            return;
        }

        setHasAttemptedCreation(true);

        // for users redirected from sign-in, create account immediately
        if (!shouldSkipDirectMutation) {
            setIsCreating(true);

            // format user data for the upsertFromClerk mutation
            const userData = {
                clerkId: user.id,
                first_name: user.firstName || "",
                last_name: user.lastName || "",
                username: user.username || user.firstName || "Player",
                email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "",
            };

            upsertUser({ data: userData })
                .then(async () => {
                    try { await assignServer(); } catch {}
                    setIsCreating(false);
                    router.push("/showcase");
                })
                .catch((error) => {
                    console.error("Failed to create user:", error);
                    setIsCreating(false);
                    // still redirect to landing which routes appropriately
                    router.push("/");
                });
        }
    }, [isLoaded, user, currentUser, upsertUser, router, hasAttemptedCreation, shouldSkipDirectMutation]);

    // // show loading screen while checking user existence or creating account
    // if (!isLoaded || (user && currentUser === undefined) || isCreating) {
    //     return (
    //         <main
    //             className="bg-cover h-screen w-screen flex items-center justify-center"
    //             style={{ backgroundImage: "url('/assets/backgrounds/login.jpg')" }}
    //         >
    //             <div className="text-white text-center">
    //                 <div className="text-xl mb-4">
    //                     {isCreating ? "Creating your account..." : "Checking your account..."}
    //                 </div>
    //                 <div className="text-sm opacity-75">
    //                     {isCreating ? "Setting up your profile" : "Please wait while we verify your registration"}
    //                 </div>
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
                fallbackRedirectUrl="/showcase"
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