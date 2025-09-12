import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * @description
 * Query to fetch the current user's friends list with id, name, avatar, lastMessageId, and lastMessageTimestamp.
 *
 * @receives data from:
 * - friends table: friend relationships for current user (userOneId/userTwoId)
 * - users table: friend user details (name, avatar)
 *
 * @sends data to:
 * - friends page: list of friends for sidebar display
 *
 * @sideEffects:
 * - none
 */
export const getFriendsList = query({
  args: {},
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("getFriendsList: unauthenticated");

    // Find current user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("getFriendsList: user not found");
    if (!user.serverId) return [];

    // Fetch all friend relationships for this user (both directions)
    const [friendsOne, friendsTwo] = await Promise.all([
      ctx.db
        .query("friends")
        .withIndex("by_server_userOne_status_timestamp", (q) =>
          q
            .eq("serverId", user.serverId)
            .eq("userOneId", user._id)
            .eq("status", "accepted")
        )
        .collect(),
      ctx.db
        .query("friends")
        .withIndex("by_server_userTwo_status_timestamp", (q) =>
          q
            .eq("serverId", user.serverId)
            .eq("userTwoId", user._id)
            .eq("status", "accepted")
        )
        .collect(),
    ]);

    if (!Array.isArray(friendsOne) || !Array.isArray(friendsTwo)) {
      throw new Error("getFriendsList: friends not array");
    }

    // Merge and limit to 100 for safety
    const allFriends = [...friendsOne, ...friendsTwo].slice(0, 100);

    // Defensive: ensure lastMessageId and lastMessageTimestamp are present
    allFriends.forEach((f) => {
      if (f.status !== "accepted")
        throw new Error("getFriendsList: non-accepted friend status found");
      if (!("lastMessageId" in f))
        throw new Error("getFriendsList: missing lastMessageId");
      if (!("lastMessageTimestamp" in f))
        throw new Error("getFriendsList: missing lastMessageTimestamp");
    });

    // Determine the friend user ID for each relationship
    const friendUserIds = allFriends.map((f) =>
      String(f.userOneId) === String(user._id) ? f.userTwoId : f.userOneId
    );

    // Fetch friend user details
    const friendUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(...friendUserIds.map((id) => q.eq("_id", String(id))))
      )
      .collect();

    if (!Array.isArray(friendUsers))
      throw new Error("getFriendsList: friendUsers not array");

    // Map friend userId to user details
    const userMap = Object.fromEntries(
      friendUsers.map((u) => [String(u._id), u])
    );

    // For each friend, update isOnline based on the latest user data
    // Defensive: ensure friendUsers have isOnline property
    friendUsers.forEach((u) => {
      if (!("isOnline" in u))
        throw new Error("getFriendsList: user missing isOnline");
    });

    // Compose result
    const result = allFriends.map((f) => {
      const friendId =
        String(f.userOneId) === String(user._id) ? f.userTwoId : f.userOneId;
      const friendUser = userMap[String(friendId)];
      return {
        id: String(friendId),
        name: friendUser?.name ?? friendUser?.username ?? "Unknown",
        avatar: friendUser?.profPicUrl ?? null,
        lastMessageId: f.lastMessageId ?? null,
        lastMessageTimestamp: f.lastMessageTimestamp ?? "",
        status: f.status,
        createdAt: f.createdAt,
        isOnline: !!friendUser?.isOnline,
      };
    });

    // Runtime assertions
    if (!Array.isArray(result))
      throw new Error("getFriendsList: result not array");
    if (result.length > 100)
      throw new Error("getFriendsList: result too large");

    // Assert all results have lastMessageId and lastMessageTimestamp
    result.forEach((r) => {
      if (!("lastMessageId" in r))
        throw new Error("getFriendsList: missing lastMessageId in result");
      if (!("lastMessageTimestamp" in r))
        throw new Error(
          "getFriendsList: missing lastMessageTimestamp in result"
        );
    });

    return result;
  },
});

/**
 * @description
 * Search the current user's friends by name or username substring (case-insensitive).
 *
 * @receives data from:
 * - users table: user documents for friend details
 * - friends table: friend relationships for current user
 *
 * @sends data to:
 * - client: filtered friends list matching search query
 *
 * @sideEffects:
 * - none
 */
export const searchFriends = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, { search }) => {
    if (typeof search !== "string" || search.length > 100)
      throw new Error("searchFriends: invalid search string");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("searchFriends: unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("searchFriends: user not found");
    if (!user.serverId) return [];

    // Get all friend relationships for this user (both directions)
    const friendsOne = await ctx.db
      .query("friends")
      .withIndex("by_server_userOne_status_timestamp", (q) =>
        q
          .eq("serverId", user.serverId)
          .eq("userOneId", user._id)
          .eq("status", "accepted")
      )
      .collect();
    const friendsTwo = await ctx.db
      .query("friends")
      .withIndex("by_server_userTwo_status_timestamp", (q) =>
        q
          .eq("serverId", user.serverId)
          .eq("userTwoId", user._id)
          .eq("status", "accepted")
      )
      .collect();

    if (!Array.isArray(friendsOne) || !Array.isArray(friendsTwo))
      throw new Error("searchFriends: friends not array");

    // Merge and limit to 100 for safety
    const allFriends = [...friendsOne, ...friendsTwo].slice(0, 100);

    // Get the other user's ID for each friend relationship
    const friendUserIds = allFriends.map((f) =>
      String(f.userOneId) === String(user._id) ? f.userTwoId : f.userOneId
    );

    // Fetch friend user details
    const friendUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(...friendUserIds.map((id) => q.eq("_id", String(id))))
      )
      .collect();

    if (!Array.isArray(friendUsers))
      throw new Error("searchFriends: friendUsers not array");

    // Map friendId to user details for quick lookup
    const userMap = Object.fromEntries(
      friendUsers.map((u) => [String(u._id), u])
    );

    // Normalize search string
    const searchLower = search.trim().toLowerCase();

    // Compose and filter result
    const result = allFriends
      .map((f) => {
        const friendId =
          String(f.userOneId) === String(user._id) ? f.userTwoId : f.userOneId;
        const friendUser = userMap[String(friendId)];
        return {
          id: String(friendId),
          name: friendUser?.name ?? friendUser?.username ?? "Unknown",
          username: friendUser?.username ?? "",
          avatar: friendUser?.profPicUrl ?? null,
          lastMessageId: f.lastMessageId ?? null,
          lastMessageTimestamp: f.lastMessageTimestamp ?? "",
          status: f.status,
          createdAt: f.createdAt,
        };
      })
      .filter(
        (friend) =>
          friend.name.toLowerCase().includes(searchLower) ||
          friend.username.toLowerCase().includes(searchLower)
      );

    // Runtime assertions
    if (!Array.isArray(result))
      throw new Error("searchFriends: result not array");
    if (result.length > 100) throw new Error("searchFriends: result too large");

    return result;
  },
});

/**
 * @description
 * Fetches messages for a specific friend's conversation using the messages table.
 *
 * @receives data from:
 * - messages table: messages between current user and friend
 * - users table: user details for sender names
 *
 * @sends data to:
 * - client: array of messages for the conversation
 *
 * @sideEffects:
 * - none
 */
export const displayConversation = query({
  args: {
    friendId: v.id("users"),
  },
  handler: async (ctx, { friendId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject)
      throw new Error("displayConversation: unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("displayConversation: user not found");
    if (!user.serverId)
      throw new Error("displayConversation: user has no server");

    // Find the friend relationship (conversation) between the two users
    const userId = user._id;
    const friendObj = await ctx.db
      .query("friends")
      .filter((q) =>
        q.or(
          q.and(
            q.eq("userOneId", String(userId)),
            q.eq("userTwoId", String(friendId))
          ),
          q.and(
            q.eq("userOneId", String(friendId)),
            q.eq("userTwoId", String(userId))
          )
        )
      )
      .first();
    if (!friendObj)
      throw new Error("displayConversation: friend relationship not found");
    if (
      !friendObj.serverId ||
      String(friendObj.serverId) !== String(user.serverId)
    ) {
      throw new Error("displayConversation: cross-server conversation denied");
    }

    // Fetch messages for this conversation (by conversationId = friendObj._id)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_timestamp", (q) =>
        q.eq("conversationId", friendObj._id)
      )
      .order("asc")
      .take(200);

    if (!Array.isArray(messages))
      throw new Error("displayConversation: messages not array");
    if (messages.length > 200)
      throw new Error("displayConversation: too many messages");

    // Get all unique sender IDs (cap at 10)
    const senderIds = [
      ...new Set(messages.map((m) => m.senderId).filter(Boolean)),
    ].slice(0, 10);

    const senders = await ctx.db
      .query("users")
      .filter((q) => q.or(...senderIds.map((id) => q.eq("_id", id as any))));
    if (!Array.isArray(senders))
      throw new Error("displayConversation: senders not array");

    const senderMap = Object.fromEntries(
      senders.map((u) => [String(u._id), u])
    );

    const result = messages.map((msg) => ({
      id: String(msg._id),
      senderId: msg.senderId,
      senderName:
        senderMap[String(msg.senderId)]?.name ??
        senderMap[String(msg.senderId)]?.username ??
        "Unknown",
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    if (!Array.isArray(result))
      throw new Error("displayConversation: result not array");
    if (result.length > 200)
      throw new Error("displayConversation: result too large");

    return result;
  },
});

/**
 * @description
 * Mutation to send a new message in a conversation between two users using the messages table.
 *
 * @receives data from:
 * - client: { friendId: string, content: string }
 *
 * @sends data to:
 * - messages table: inserts new message document
 *
 * @sideEffects:
 * - Adds a new message to the messages table in the database
 */
export const sendMessage = mutation({
  args: {
    friendId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, { friendId, content }) => {
    if (typeof content !== "string" || !content.trim())
      throw new Error("sendMessage: content is empty");
    if (content.length > 1000) throw new Error("sendMessage: content too long");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("sendMessage: unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("sendMessage: user not found");
    if (!user.serverId) throw new Error("sendMessage: user has no server");
    if (!friendId) throw new Error("sendMessage: friendId missing");

    const friend = await ctx.db
      .query("users")
      .filter((q) => q.eq("_id", String(friendId)))
      .first();
    if (!friend) throw new Error("sendMessage: friend not found");

    // Find the friend relationship (conversation) between the two users
    const friendship = await ctx.db
      .query("friends")
      .filter((q) =>
        q.or(
          q.and(
            q.eq("userOneId", String(user._id)),
            q.eq("userTwoId", String(friendId))
          ),
          q.and(
            q.eq("userOneId", String(friendId)),
            q.eq("userTwoId", String(user._id))
          )
        )
      )
      .first();

    if (!friendship) throw new Error("sendMessage: friendship not found");
    if (
      !friendship.serverId ||
      String(friendship.serverId) !== String(user.serverId)
    ) {
      throw new Error("sendMessage: cross-server message denied");
    }

    if (friendship.status !== "accepted") {
      throw new Error("sendMessage: friendship not accepted");
    }

    const now = new Date().toISOString();

    const messageId = await ctx.db.insert("messages", {
      serverId: user.serverId,
      conversationId: friendship._id,
      senderId: user._id,
      content,
      timestamp: now,
      isSystem: false,
      isRead: false,
    });

    if (!messageId) throw new Error("sendMessage: failed to insert message");

    // Update the friendship document with the last message ID and timestamp
    await ctx.db.patch(friendship._id, {
      lastMessageId: messageId,
      lastMessageTimestamp: now,
    });

    return { messageId, sentAt: now };
  },
});

/**
 * @description
 * Mutation to report a user for inappropriate behavior or content.
 *
 * @receives data from:
 * - page.tsx; reportUser: User ID and report reason from client
 *
 * @sends data to:
 * - mail table: inserts a system mail for admin review
 *
 * @sideEffects:
 * - Creates a new mail entry for admin notification
 */
export const reportUser = mutation({
  args: {
    reportedUserId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, { reportedUserId, reason }) => {
    if (typeof reportedUserId !== "string" || !reportedUserId.trim()) {
      throw new Error("reportUser: reportedUserId is required");
    }
    if (typeof reason !== "string" || !reason.trim()) {
      throw new Error("reportUser: reason is required");
    }
    if (reason.length > 1000) {
      throw new Error("reportUser: reason too long");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("reportUser: unauthenticated");

    const reporter = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!reporter) throw new Error("reportUser: reporter not found");

    // Insert a system mail for admin review
    const sentAt = new Date().toISOString();
    const mailId = await ctx.db.insert("mails", {
      recipientId: undefined, // Admin user ID if available, otherwise null as it's optional
      subject: `User Report: ${reportedUserId}`,
      content: `Reporter: ${reporter._id}\nReported User: ${reportedUserId}\nReason: ${reason}`,
      sentAt,
      isRead: false,
      isSystem: true,
    });

    if (!mailId) throw new Error("reportUser: failed to insert report mail");

    return { mailId, sentAt };
  },
});

/**
 * @description
 * Mutation to unfollow (remove friend connection) between the current user and a target user.
 *
 * @receives data from:
 * - friends table: friendship document by userOneId and userTwoId
 *
 * @sends data to:
 * - friends table: deletes the friendship document
 *
 * @sideEffects:
 * - Removes the friend relationship from the database
 */
export const unfollowUser = mutation({
  args: {
    friendId: v.id("users"),
  },
  handler: async (ctx, { friendId }) => {
    if (!friendId) {
      throw new Error("unfollowUser: friendId is required");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("unfollowUser: unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("unfollowUser: user not found");

    // Find both possible friendship directions
    const [friendship, reverseFriendship] = await Promise.all([
      ctx.db
        .query("friends")
        .withIndex("by_userOneId_userTwoId", (q) =>
          q.eq("userOneId", user._id).eq("userTwoId", friendId)
        )
        .first(),
      ctx.db
        .query("friends")
        .withIndex("by_userOneId_userTwoId", (q) =>
          q.eq("userOneId", friendId).eq("userTwoId", user._id)
        )
        .first(),
    ]);

    if (!friendship && !reverseFriendship) {
      throw new Error("unfollowUser: friendship does not exist");
    }

    if (friendship) {
      await ctx.db.delete(friendship._id);
    }
    if (reverseFriendship) {
      await ctx.db.delete(reverseFriendship._id);
    }

    return { unfollowed: true };
  },
});

export const searchUsers = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, { search }) => {
    if (typeof search !== "string" || search.length > 100) {
      throw new Error("searchUsers: invalid search string");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("searchUsers: unauthenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!currentUser) throw new Error("searchUsers: current user not found");

    const users = await ctx.db
      .query("users")
      .withSearchIndex("by_username", (q) => q.search("username", search))
      .collect();

    if (!Array.isArray(users)) {
      throw new Error("searchUsers: users not array");
    }

    // Filter out the current user from the search results
    const filteredUsers = users.filter((user) => user._id !== currentUser._id);

    // Limit results for safety
    if (filteredUsers.length > 100) {
      throw new Error("searchUsers: too many results");
    }

    return filteredUsers.map((user) => ({
      id: user._id,
      name: user.name ?? user.username ?? "Unknown",
      username: user.username ?? "",
      avatar: user.profPicUrl ?? null,
    }));
  },
});

export const sendFriendRequest = mutation({
  args: {
    friendId: v.id("users"),
  },
  handler: async (ctx, { friendId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    if (!user.serverId) throw new Error("User has no server");

    if (user._id === friendId) {
      throw new Error("Cannot send a friend request to yourself");
    }

    const existingFriendship = await ctx.db
      .query("friends")
      .withIndex("by_userOneId_userTwoId", (q) =>
        q.eq("userOneId", user._id).eq("userTwoId", friendId)
      )
      .first();

    const existingReverseFriendship = await ctx.db
      .query("friends")
      .withIndex("by_userOneId_userTwoId", (q) =>
        q.eq("userOneId", friendId).eq("userTwoId", user._id)
      )
      .first();

    if (existingFriendship || existingReverseFriendship) {
      throw new Error("Friend request already sent or you are already friends");
    }

    const friendUser = await ctx.db.get(friendId);
    if (!friendUser) throw new Error("Friend not found");
    if (
      !friendUser.serverId ||
      String(friendUser.serverId) !== String(user.serverId)
    ) {
      throw new Error("Cross-server friend request denied");
    }

    const now = new Date().toISOString();
    await ctx.db.insert("friends", {
      serverId: user.serverId,
      userOneId: user._id,
      userTwoId: friendId,
      status: "pending",
      createdAt: now,
    });

    return { success: true };
  },
});

export const getPendingFriendRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    if (!user.serverId) throw new Error("User has no server");

    const pendingRequests = await ctx.db
      .query("friends")
      .withIndex("by_server_userTwo_status_timestamp", (q) =>
        q
          .eq("serverId", user.serverId)
          .eq("userTwoId", user._id)
          .eq("status", "pending")
      )
      .collect();

    const requesters = await Promise.all(
      pendingRequests.map((req) => ctx.db.get(req.userOneId))
    );

    return pendingRequests.map((req, i) => {
      const requester = requesters[i];
      return {
        ...req,
        requester: {
          id: requester?._id,
          name: requester?.name ?? requester?.username ?? "Unknown",
          username: requester?.username ?? "",
          avatar: requester?.profPicUrl ?? null,
        },
      };
    });
  },
});

export const acceptFriendRequest = mutation({
  args: {
    friendshipId: v.id("friends"),
  },
  handler: async (ctx, { friendshipId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) throw new Error("Friendship not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    if (friendship.userTwoId !== user._id) {
      throw new Error("You are not the recipient of this friend request");
    }

    if (friendship.status !== "pending") {
      throw new Error("This friend request is not pending");
    }

    await ctx.db.patch(friendshipId, {
      status: "accepted",
    });

    return { success: true };
  },
});
