import { withErrorHandling } from '@/lib/apiError';
import { WITHDRAW_DESTINATIONS, withdrawMinimumUsd } from '@/lib/deposits/withdrawDestinations';

/**
 * `GET /wallet/withdraw-options` — where a withdrawal can go: USDC.e on
 * Polygon (direct, no minimum) and the Polymarket-bridge destinations
 * (USDC on Base/Arbitrum/…, USDT on Tron/BNB Chain) with the bridge's
 * current minimum for each. Public: nothing user-specific.
 */
export async function GET() {
  return withErrorHandling(async () => {
    const options = await Promise.all(
      WITHDRAW_DESTINATIONS.map(async (destination) => ({
        id: destination.id,
        network: destination.network,
        token: destination.token,
        recipientKind: destination.recipientKind,
        viaBridge: destination.viaBridge,
        minimumUsd: await withdrawMinimumUsd(destination),
      }))
    );
    return Response.json({ options });
  });
}
