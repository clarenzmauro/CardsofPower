"use client";
import { SignUp } from "@clerk/nextjs";

/**
 * @description
 * custom page for the sign-up of clerk
 */

export default function SignUpPage() {
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