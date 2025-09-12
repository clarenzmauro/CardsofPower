import { mutation } from "./_generated/server";
import { v } from "convex/values";


export const initiateTrade = mutation({
  args: {
    offerorId: v.id("users"),
    offerorCardId: v.id("user_cards"),
    receiverId: v.id("users"),
    receiverCardId: v.id("user_cards"),
  },
  handler: async (ctx, args) => {
    // For V2, use marketplace listings instead of direct trades.
    throw new Error("Direct trades are deprecated. Use listings (createListingV2/purchaseListingV2).");
  },
});