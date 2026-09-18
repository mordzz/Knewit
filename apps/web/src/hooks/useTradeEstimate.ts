'use client';

import { useQuery } from '@tanstack/react-query';
import { getTradeEstimate } from '@/lib/marketService';
import { useDebounce } from '@/hooks/useDebounce';
import type { TradeEstimate } from '@/types/trading';

/**
 * Live order-book estimate for the amount currently being typed —
 * debounced so each keystroke doesn't hit Polymarket's book, and
 * disabled until a choice + amount exist. A failure is intentionally
 * quiet (the panel falls back to its plain `amount / price` math; no
 * fabricated estimate). See docs/API.md, "GET /markets/:id/trade-estimate".
 */
export function useTradeEstimate(
  marketId: string,
  choiceIndex: number | null,
  usdAmount: number
) {
  const debouncedAmount = useDebounce(usdAmount, 350);

  return useQuery<TradeEstimate>({
    queryKey: ['trade-estimate', marketId, choiceIndex, debouncedAmount],
    queryFn: () => getTradeEstimate(marketId, choiceIndex as number, debouncedAmount),
    enabled: Boolean(marketId) && choiceIndex !== null && debouncedAmount > 0,
    staleTime: 15_000,
    retry: 1,
  });
}
