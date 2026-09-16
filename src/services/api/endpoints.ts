/**
 * Planned internal API surface — see docs/API.md for request/response
 * shapes. Not yet implemented by a backend; paths are placeholders.
 */
export const endpoints = {
  markets: '/markets',
  market: (id: string) => `/markets/${id}`,
  marketActivity: (id: string) => `/markets/${id}/activity`,
  marketHolders: (id: string) => `/markets/${id}/holders`,
  marketPriceHistory: (id: string) => `/markets/${id}/price-history`,
  marketsTrending: '/markets/trending',
  marketsClosingSoon: '/markets/closing-soon',
  events: '/events',
  categories: '/categories',
  positions: '/positions',
  position: (marketId: string) => `/positions/${marketId}`,
  tradingOrders: '/trading/orders',
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
  userPosts: (id: string) => `/users/${id}/posts`,
  userCalls: (id: string) => `/users/${id}/calls`,
  userActivity: (id: string) => `/users/${id}/activity`,
  followers: (id: string) => `/users/${id}/followers`,
  following: (id: string) => `/users/${id}/following`,
  follow: (userId: string) => `/users/${userId}/follow`,
  leaderboard: '/leaderboard',
} as const;
