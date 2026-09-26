import { withErrorHandling } from '@/lib/apiError';
import { getBridgeAssets } from '@/lib/deposits/polymarketBridge';

/**
 * `GET /wallet/withdraw-options`  every token/chain a withdrawal can be
 * delivered as, with the bridge's minimum (`/supported-assets`). Public:
 * nothing user-specific.
 */
export async function GET() {
  return withErrorHandling(async () => Response.json({ assets: await getBridgeAssets() }));
}
