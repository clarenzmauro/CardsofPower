"use client";
import { SignUp, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@cards-of-power/backend/convex/_generated/api";

/**
 * @description
 * custom page for the sign-up of clerk
 */

export default function SignUpPage() {
    const { user, isLoaded } = useUser();
    const createUser = useMutation(api.users.createUser);
    const router = useRouter();

    useEffect(() => {
        // only run after clerk has loaded and user is signed up
        if (!isLoaded || !user) return;

        // check if user just signed up
        const userCreatedRecently = user.createdAt && 
            (Date.now() - user.createdAt.getTime()) < 10000; 

        if (userCreatedRecently) {
            // create user in convex
            createUser({
                username: user.username || user.firstName || "Player",
                email: user.primaryEmailAddress?.emailAddress || "",
            })
            .then(() => {
                console.log("User created in Convex successfully");
                // success redirect
                router.push("/main-menu");
            })
            .catch((error) => {
                console.error("Failed to create user in Convex:", error);
                // fail redirect
                router.push("/main-menu");
            });
        }
    }, [isLoaded, user, createUser, router]);

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