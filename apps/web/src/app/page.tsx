"use client";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

/**
 * @description
 * Landing page that routes users to the right place.
 *
 * @receives data from:
 * - n/a; receives auth state from Clerk context
 *
 * @sends data to:
 * - /dashboard: navigation for authenticated users
 * - /sign-in: navigation for unauthenticated users
 *
 * @sideEffects:
 * - Client-side navigation only
 */
export default function Home() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-10">
			<SignedIn>
				<div className="rounded-lg border p-6 text-center">
					<p className="mb-4">You are signed in.</p>
					<Link className="underline" href="/dashboard">Go to dashboard</Link>
				</div>
			</SignedIn>
			<SignedOut>
				<div className="rounded-lg border p-6 text-center">
					<p className="mb-4">Welcome to Cards of Power</p>
					<Link className="underline" href={{ pathname: "/sign-in" }}>Sign in to continue</Link>
				</div>
			</SignedOut>
		</div>
	);
}