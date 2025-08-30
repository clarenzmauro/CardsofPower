"use client";
import { SignIn } from "@clerk/nextjs";

/**
 * @description
 * custom page for the sign-in component of clerk
 */

export default function SignInPage() {
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
                    fallbackRedirectUrl="/main-menu"
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