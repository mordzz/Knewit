/**
 * The internal API surface — see docs/API.md for request/response
 * shapes. Backed by `apps/backend` (Next.js route handlers), which both
 * the web and mobile clients call.
 */
export const endpoints = {
  markets: '/markets',
  market: (id: string) => `/markets/${id}`,
  marketActivity: (id: string) => `/markets/${id}/activity`,
  marketHolders: (id: string) => `/markets/${id}/holders`,
  marketPriceHistory: (id: string) => `/markets/${id}/price-history`,
  marketTradeEstimate: (id: string) => `/markets/${id}/trade-estimate`,
  marketsTrending: '/markets/trending',
  marketsClosingSoon: '/markets/closing-soon',
  events: '/events',
  event: (id: string) => `/events/${id}`,
  eventActivity: (id: string) => `/events/${id}/activity`,
  eventHolders: (id: string) => `/events/${id}/holders`,
  categories: '/categories',
  positions: '/positions',
  position: (marketId: string) => `/positions/${marketId}`,
  tradingOrders: '/trading/orders',
  walletBalance: '/wallet/balance',
  feed: '/feed',
  feedFollowing: '/feed/following',
  feedTrending: '/feed/trending',
  search: '/search',
  calls: '/calls',
  call: (id: string) => `/calls/${id}`,
  like: (id: string) => `/calls/${id}/like`,
  comments: (postId: string) => `/calls/${postId}/comments`,
  comment: (id: string) => `/comments/${id}`,
  commentReplies: (id: string) => `/comments/${id}/replies`,
  commentLike: (id: string) => `/comments/${id}/like`,
  commentShare: (id: string) => `/comments/${id}/share`,
  /** `id` accepts the literal `"me"` to resolve to the authenticated
   * caller — see docs/API.md. Used identically for all the
   * `users/:id/...` sub-resources below. */
  users: (id: string) => `/users/${id}`,
  userCalls: (id: string) => `/users/${id}/calls`,
  userReplies: (id: string) => `/users/${id}/replies`,
  userActivity: (id: string) => `/users/${id}/activity`,
  followers: (id: string) => `/users/${id}/followers`,
  following: (id: string) => `/users/${id}/following`,
  follow: (userId: string) => `/users/${userId}/follow`,
  leaderboard: '/leaderboard',
} as const;
