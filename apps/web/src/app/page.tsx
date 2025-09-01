import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * @description
 * Landing page that routes users to the right place.
 *
 * @receives data from:
 * - Clerk auth() server helper for authentication state
 *
 * @sends data to:
 * - /main-menu: server-side redirect for authenticated users
 * - /sign-in: navigation for unauthenticated users
 *
 * @sideEffects:
 * - Server-side redirect for authenticated users
 */
export default async function Home() {
    const { userId } = await auth();
    
	// if signed in then go to main menu, otherwise, sign in
    if (userId) {
        redirect("/main-menu");
    } else {
		redirect("/sign-in");
	}

    return (
        <div className="container mx-auto max-w-3xl px-4 py-10">
            <div className="rounded-lg border p-6 text-center">
				{/* loading screen to be added here soon */}
            </div>
        </div>
    );
}