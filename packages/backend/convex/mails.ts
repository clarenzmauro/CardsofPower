import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * @description
 * Query to fetch all system emails from the mail table.
 *
 * @receives data from:
 * - mail table: system emails (system: true)
 *
 * @sends data to:
 * - client-side: array of system email objects
 *
 * @sideEffects:
 * - none
 */
export const getSystemEmails = query({
  args: {},
  async handler(ctx) {
    const systemEmails = await ctx.db
      .query("mails")
      .withIndex("by_isSystem_sentAt", (q) => q.eq("isSystem", true))
      .collect();

    if (!Array.isArray(systemEmails)) {
      throw new Error("getSystemEmails: expected array result from query");
    }
    if (systemEmails.length > 1000) {
      throw new Error("getSystemEmails: too many system emails returned");
    }

    return systemEmails.map((email) => ({
      _id: email._id,
      recipientId: email.recipientId,
      subject: email.subject,
      content: email.content,
      preview: email.preview ?? "",
      isRead: email.isRead ?? false,
      sentAt: email.sentAt,
      isSystem: email.isSystem ?? false,
    }));
  },
});

/**
 * @description
 * Query to fetch the full content of a specific system email by its ID.
 *
 * @receives data from:
 * - client: { mailId: string }
 * - mails table: system email document
 *
 * @sends data to:
 * - client: full system email object
 *
 * @sideEffects:
 * - none
 */
export const getSystemMailContent = query({
  args: {
    mailId: v.id("mails"),
  },
  async handler(ctx, { mailId }) {
    if (!mailId) throw new Error("getSystemMailContent: invalid mailId");

    const mail = await ctx.db.get(mailId);
    if (!mail) throw new Error("getSystemMailContent: mail not found");
    if (!mail.isSystem) throw new Error("getSystemMailContent: not a system mail");

    // Runtime assertions
    if (typeof mail.subject !== "string" || typeof mail.content !== "string") {
      throw new Error("getSystemMailContent: mail missing subject/content");
    }
    if (typeof mail.sentAt !== "string") {
      throw new Error("getSystemMailContent: mail missing sentAt");
    }

    return {
      _id: mail._id,
      recipientId: mail.recipientId,
      subject: mail.subject,
      content: mail.content,
      preview: mail.preview ?? "",
      isRead: mail.isRead ?? false,
      sentAt: mail.sentAt,
      isSystem: mail.isSystem ?? false,
    };
  },
});

/**
 * @description
 * Mutation to mark a specific mail as read.
 *
 * @receives data from:
 * - client: { mailId: Id<"mails"> }
 *
 * @sends data to:
 * - mails table: updates the isRead status of the mail
 *
 * @sideEffects:
 * - Updates the isRead field of a mail document in the database
 */
export const markMailAsRead = mutation({
  args: {
    mailId: v.id("mails"),
  },
  handler: async (ctx, { mailId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("markMailAsRead: unauthenticated");

    const mail = await ctx.db.get(mailId);
    if (!mail) throw new Error("markMailAsRead: mail not found");

    // Ensure the mail is either a system mail or addressed to the current user
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
    if (!user) throw new Error("markMailAsRead: user not found");

    if (!mail.isSystem && String(mail.recipientId) !== String(user._id)) {
      throw new Error("markMailAsRead: unauthorized to mark this mail as read");
    }

    if (mail.isRead) {
      console.warn(`Mail ${mailId} is already marked as read.`);
      return { success: true, alreadyRead: true };
    }

    await ctx.db.patch(mailId, { isRead: true });

    return { success: true, alreadyRead: false };
  },
});