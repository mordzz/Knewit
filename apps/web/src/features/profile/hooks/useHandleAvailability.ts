import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { checkHandleAvailability } from '@/features/profile/lib/userService';

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const CHECK_DEBOUNCE_MS = 400;

/**
 * Live "is this username free?" check  same as mobile's hook: waits until
 * typing pauses, skips the current handle and invalid input, and reports
 * `isChecking` through the debounce gap so a stale "available" never shows.
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
    isChecking: HANDLE_RE.test(handle) && handle !== currentHandle && (!settled || query.isFetching),
    failed: shouldCheck && settled && query.isError,
  };
}
