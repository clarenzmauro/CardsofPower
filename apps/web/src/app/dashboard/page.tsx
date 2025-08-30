"use client";

import { api } from "@cards-of-power/backend/convex/_generated/api";
import { UserButton, useUser } from "@clerk/nextjs";
import { Authenticated, useQuery } from "convex/react";

/**
 * @description
 * Authenticated dashboard surface. Assumes route protection via middleware.
 *
 * @receives data from:
 * - convex/privateData.get: user-scoped greeting
 *
 * @sends data to:
 * - n/a
 *
 * @sideEffects:
 * - None
 */
export default function Dashboard() {
	const user = useUser();
	const privateData = useQuery(api.privateData.get);

	return (
		<Authenticated>
			<div>
				<h1>Dashboard</h1>
				<p>Welcome {user.user?.fullName}</p>
				<p>privateData: {privateData?.message}</p>
				<UserButton />
			</div>
		</Authenticated>
	);
}