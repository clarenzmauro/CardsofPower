"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@cards-of-power/backend/convex/_generated/api";

/**
 * Sign-up page that integrates Clerk authentication with a Convex backend.
 *
 * Renders Clerk's SignUp UI and, after Clerk finishes loading, ensures a corresponding
 * Convex user record exists. If the Convex query shows the user already exists the
 * component immediately navigates to "/main-menu". Otherwise it attempts to create or
 * upsert the user record from Clerk profile data and then navigates to "/main-menu".
 *
 * Side effects:
 * - Calls a Convex upsert mutation to create/update the user record when needed.
 * - Navigates the client to "/main-menu" after detecting or creating the user.
 *
 * The component guards against repeated creation attempts and waits for the Convex
 * current-user query to resolve before acting.
 *
 * @returns The sign-up page JSX element.
 */

export default function SignUpPage() {
    const { user, isLoaded } = useUser();
    const currentUser = useQuery(api.users.current);
    const upsertUser = useMutation(api.users.upsertFromClerk);
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
                .then(() => {
                    setIsCreating(false);
                    router.push("/main-menu");
                })
                .catch((error) => {
                    console.error("Failed to create user:", error);
                    setIsCreating(false);
                    // still redirect to main menu even on error to avoid infinite loading
                    router.push("/main-menu");
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