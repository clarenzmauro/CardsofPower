import { mutation } from "./_generated/server";

/**
 * @description
 * Mutation to generate upload URL for file storage
 *
 * @receives data from:
 * - client: file upload request
 *
 * @sends data to:
 * - client: upload URL for file upload
 *
 * @sideEffects:
 * - generates temporary upload URL
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
