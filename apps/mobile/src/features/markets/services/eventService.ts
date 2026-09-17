import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { Event } from '@/types/market';
import type { CategoryOption } from '@/types/common';

export function getEvents() {
  return apiRequest<Event[]>(endpoints.events);
}

/** Label + slug pairs from Polymarket's live tag taxonomy — the slug is
 * the value sent back as the `category` filter (see `CategoryOption`). */
export function getCategories() {
  return apiRequest<CategoryOption[]>(endpoints.categories);
}
