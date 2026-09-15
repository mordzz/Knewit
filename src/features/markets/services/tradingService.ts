import type { Outcome } from '@/types/market';

export interface PlaceOrderInput {
  marketId: string;
  outcome: Outcome;
  usdAmount: number;
}

/**
 * Not implemented yet. Real order placement requires the backend
 * order-construction flow and Privy signing — see docs/WALLET.md and
 * docs/API.md before implementing.
 */
export async function placeOrder(_input: PlaceOrderInput): Promise<never> {
  throw new Error('placeOrder is not implemented yet — see docs/WALLET.md');
}
