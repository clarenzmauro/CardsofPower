"use client";
import { SignIn, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { api } from "@cards-of-power/backend/convex/_generated/api";

/**
 * @description
 * custom page for the sign-in component of clerk with user existence check
 *
 * @receives data from:
 * - Clerk: user authentication state and profile data
 * - Convex: current user query to check database existence
 *
 * @sends data to:
 * - Router: navigation to sign-up or main-menu based on user existence
 *
 * @sideEffects:
 * - Redirects unregistered users to sign-up page
 * - Redirects registered users to main menu
 */

export default function SignInPage() {
    const { user, isLoaded } = useUser();
    const currentUser = useQuery(api.users.current);
    const router = useRouter();
    const assignServer = useMutation(api.users.assignServerOnFirstAuth);
    const hasAssignedRef = useRef(false);

    useEffect(() => {
        // only run after Clerk has loaded and user is authenticated
        if (!isLoaded || !user) {
            return;
        }

        // wait for the currentUser query to complete
        if (currentUser === undefined) {
            return;
        }

        // if user exists in database, redirect appropriately
        if (currentUser) {
            if (!hasAssignedRef.current) {
                hasAssignedRef.current = true;
                assignServer({}).catch(() => {});
            }
            const shouldSeeShowcase = currentUser.gamesPlayed === 0 && !currentUser.hasSeenShowcase;
            router.push(shouldSeeShowcase ? "/showcase" : "/main-menu");
            return;
        }

        // if user doesn't exist in database but is authenticated with Clerk,
        // redirect to sign-up to complete registration
        if (!currentUser) {
            router.push("/sign-up" as any);
            return;
        }
    }, [isLoaded, user, currentUser, router]);

    // Don't render the SignIn component if we're in the middle of redirecting
    if (!isLoaded || (user && currentUser === undefined)) {
        return (
            <main
                className="bg-cover h-screen w-screen flex items-center justify-center"
                style={{ backgroundImage: "url('/assets/backgrounds/login.jpg')" }}
            >
                <div className="text-white text-center">
                    <div className="text-xl mb-4">Checking your account...</div>
                    <div className="text-sm opacity-75">Please wait while we verify your registration</div>
                </div>
            </main>
        );
    }

    return (
        <main
            className="bg-cover h-screen w-screen flex items-center justify-center"
            style={{ backgroundImage: "url('/assets/backgrounds/login.jpg')" }}
        >
            {/* decided not to implement custom background and just style the clerk card - less complexity */}
            {/* <section className="min-h-[350px] h-[50vh] min-w-[350px] w-[50vh] bg-amber-900/70 border-[20px] border-amber-950 rounded-3xl shadow-inner flex flex-col justify-between p-6">
                <h1 className="text-4xl lg:text-5xl text-amber-950 uppercase text-center">
                    Log in
                </h1> */}
                <SignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    appearance={{
                        variables: {
                            colorBackground: 'rgba(125, 75, 26, 0.85)', // change this to change the color of the sign in
                            colorText: '#000000', // originally #451a03
                            fontFamily: 'var(--font-pirata-one)',
                            fontSize: "20px",
                        },
                        elements: {
                            // uncomment to hide clerk's branding in prod
                            // footer: 'hidden',
                        },
                    }}
                />
                {/* <p className="text-center text-amber-950">
                    Don&apos;t have an account?{" "}
                    <a href="/sign-up" className="text-amber-950 underline">
                        Sign up
                    </a>
                </p>
                commented out due to clerk having its own sign up component
                */}
            {/* </section> */}
        </main>
    );
}