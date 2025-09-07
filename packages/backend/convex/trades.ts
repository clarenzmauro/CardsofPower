import { mutation } from "./_generated/server";
import { v } from "convex/values";


export const initiateTrade = mutation({
  args: {
    offerorId: v.string(),
    offerorCardId: v.id("cards"),
    receiverId: v.string(),
    receiverCardId: v.id("cards"),
  },
  handler: async (ctx, args) => {
    const [offerorCard, receiverCard] = await Promise.all([
      ctx.db.get(args.offerorCardId),
      ctx.db.get(args.receiverCardId),
    ]);
    if (!offerorCard || !receiverCard) throw new Error("Cards not found");
    if (offerorCard.currentOwnerId !== args.offerorId) throw new Error("Not card owner");
    if (receiverCard.currentOwnerId !== args.receiverId) throw new Error("Receiver not card owner");
    if (!receiverCard.isForTrade) throw new Error("Card not available for trade");

    const [offeror, receiver] = await Promise.all([
      ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", args.offerorId)).unique(),
      ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", args.receiverId)).unique(),
    ]);
    if (!offeror || !receiver) throw new Error("Users not found");

    const tradeId = await ctx.db.insert("trades", {
      offerorId: offeror._id,
      offerorCardId: args.offerorCardId,
      receiverId: receiver._id,
      receiverCardId: args.receiverCardId,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return tradeId;
  },
});