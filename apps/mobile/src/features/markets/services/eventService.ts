import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { Event } from '@/types/market';
import type { Category } from '@/types/common';

export function getEvents() {
  return apiRequest<Event[]>(endpoints.events);
}

export function getCategories() {
  return apiRequest<Category[]>(endpoints.categories);
}
