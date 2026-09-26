import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { checkHandleAvailability } from '@/features/profile/services/userService';

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const CHECK_DEBOUNCE_MS = 400;

/**
 * Live "is this username free?" check for the username panel  waits
 * until typing pauses, and skips the request for the current handle or
 * one that can't be valid anyway (the panel's own rules already say so).
 * `isChecking` covers the debounce gap too, so the UI never shows a
 * stale "available" for text the user has already changed.
 */
export function useHandleAvailability(handle: string, currentHandle: string) {
  const debounced = useDebounce(handle, CHECK_DEBOUNCE_MS);
  const shouldCheck = HANDLE_RE.test(debounced) && debounced !== currentHandle;

  const query = useQuery({
    queryKey: ['handle-available', debounced],
    queryFn: () => checkHandleAvailability(debounced),
    enabled: shouldCheck,
    staleTime: 30_000,
    retry: false,
  });

  const settled = handle === debounced;
  return {
    result: shouldCheck && settled ? (query.data ?? null) : null,
    isChecking:
      HANDLE_RE.test(handle) && handle !== currentHandle && (!settled || query.isFetching),
    failed: shouldCheck && settled && query.isError,
  };
}
