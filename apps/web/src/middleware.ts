import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * @description
 * Enforce auth on all routes except public auth pages and root.
 *
 * @receives data from:
 * - Next.js request pipeline; Clerk session cookies
 *
 * @sends data to:
 * - Clerk sign-in flow when unauthenticated on protected routes
 *
 * @sideEffects:
 * - Redirects unauthenticated users to sign-in
 */
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	if (isPublicRoute(req)) return;
	await auth.protect();
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};