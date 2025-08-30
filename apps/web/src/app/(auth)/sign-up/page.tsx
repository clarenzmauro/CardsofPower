"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <main 
            className="bg-cover h-screen w-screen flex items-center justify-center"
            style={{ backgroundImage: "url('/assets/backgrounds/login.jpg')" }}
        >
            <SignUp
                routing="path"
                path="/sign-up"
                fallbackRedirectUrl="/dashboard"
                appearance={{
                    variables: {
                        colorBackground: 'rgba(125, 75, 26, 0.85)', // same as sign-in
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