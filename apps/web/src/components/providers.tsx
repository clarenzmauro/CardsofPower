"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import React from "react";
import { api } from "@backend/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				<ServerBootstrap>
					{children}
				</ServerBootstrap>
			</ConvexProviderWithClerk>
			<Toaster richColors />
		</ThemeProvider>
	);
}

const ServerContext = React.createContext<{ serverId: string | null }>({ serverId: null });

function ServerBootstrap({ children }: { children: React.ReactNode }) {
	const me = useQuery(api.users.getMe);
	const serverId = me?.serverId ? String(me.serverId) : null;
	return (
		<ServerContext.Provider value={{ serverId }}>
			{children}
		</ServerContext.Provider>
	);
}

export function useServer() {
	return React.useContext(ServerContext);
}
