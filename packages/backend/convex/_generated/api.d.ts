/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as cards from "../cards.js";
import type * as crons from "../crons.js";
import type * as friends from "../friends.js";
import type * as http from "../http.js";
import type * as mails from "../mails.js";
import type * as privateData from "../privateData.js";
import type * as snapshots from "../snapshots.js";
import type * as storage from "../storage.js";
import type * as trades from "../trades.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  account: typeof account;
  cards: typeof cards;
  crons: typeof crons;
  friends: typeof friends;
  http: typeof http;
  mails: typeof mails;
  privateData: typeof privateData;
  snapshots: typeof snapshots;
  storage: typeof storage;
  trades: typeof trades;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
