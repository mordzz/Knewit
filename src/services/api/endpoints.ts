/**
 * Planned internal API surface — see docs/API.md for request/response
 * shapes. Not yet implemented by a backend; paths are placeholders.
 */
export const endpoints = {
  markets: '/markets',
  market: (id: string) => `/markets/${id}`,
  events: '/events',
  categories: '/categories',
  positions: '/positions',
  feed: '/feed',
  calls: '/calls',
  comments: (postId: string) => `/calls/${postId}/comments`,
  users: (id: string) => `/users/${id}`,
} as const;
