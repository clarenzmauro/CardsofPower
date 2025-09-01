import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

/**
 * @description
 * Clerk webhook handler - processes user events from Clerk and syncs with Convex database.
 * Handles user creation, updates, and deletion events from Clerk authentication service.
 *
 * @receives data from:
 * - Clerk webhook: user event data (created, updated, deleted)
 * - Svix: webhook signature validation headers
 *
 * @sends data to:
 * - Convex: user upsert/delete mutations to sync database
 * - Response: HTTP status codes (200 for success, 400 for errors)
 *
 * @sideEffects:
 * - Creates or updates user records in database on user events
 * - Deletes user records from database on user deletion
 * - Logs errors for failed operations
 */
http.route({
    path: "/clerkWebhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const event = await validateRequest(request);
        if (!event) {
            return new Response("Error occurred", { status: 400 });
        }

        switch (event.type) {
            case "user.created": // intentional fallthrough
            case "user.updated":
                try {
                    await ctx.runMutation(api.users.upsertFromClerk, {
                        data: {
                            clerkId: event.data.id,
                            first_name: event.data.first_name || "",
                            last_name: event.data.last_name || "",
                            username: event.data.username || event.data.first_name || "Player",
                            email: event.data.email_addresses?.[0]?.email_address || "",
                        },
                    });
                } catch (error) {
                    console.error("User upsert failed:", error);
                }
                break;

            case "user.deleted": {
                const clerkUserId = event.data.id!;
                try {
                    await ctx.runMutation(api.users.deleteFromClerk, { clerkUserId: clerkUserId });
                } catch (error) {
                    console.error("User deletion failed:", error);
                }
                break;
            }
        }

        return new Response(null, { status: 200 });
    }),
});

// /**
//  * @description
//  * Test endpoint to verify HTTP routes are working
//  */
// http.route({
//     path: "/testWebhook",
//     method: "GET",
//     handler: httpAction(async () => {
//         return new Response(JSON.stringify({
//             message: "HTTP Routes are working!",
//             url: "https://knowing-bear-504.convex.site/clerkWebhook",
//             timestamp: new Date().toISOString()
//         }), {
//             status: 200,
//             headers: { "Content-Type": "application/json" }
//         });
//     }),
// });

/**
 * @description
 * Validates incoming webhook requests from Clerk using Svix signature verification.
 * Ensures webhook authenticity and parses the event data securely.
 *
 * @receives data from:
 * - HTTP request: webhook payload and Svix signature headers
 * - Environment: CLERK_WEBHOOK_SECRET for signature verification
 *
 * @sends data to:
 * - Svix Webhook: payload and headers for verification
 * - Calling function: validated WebhookEvent or null on failure
 *
 * @sideEffects:
 * - Throws error if signature verification fails
 * - Logs validation errors for debugging
 */
async function validateRequest(req: Request): Promise<WebhookEvent | null> {
    const payloadString = await req.text();
    const svixHeaders = {
        "svix-id": req.headers.get("svix-id")!,
        "svix-timestamp": req.headers.get("svix-timestamp")!,
        "svix-signature": req.headers.get("svix-signature")!,
    };
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    try {
        return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
    } catch (error) {
        return null;
    }
}

export default http;
