import { polygon as privyPolygon } from '@privy-io/expo';
import { env } from '@/app/config/env';

/**
 * Polygon with a working RPC. viem's default for Polygon
 * (`https://polygon-rpc.com`) now rejects every request ("API key
 * disabled, tenant disabled"), which made Privy's `fundWallet` fail to
 * read the USDC token's decimals/symbol (`asset_info_not_found`).
 * Override with `EXPO_PUBLIC_POLYGON_RPC_URL`.
 */
export const polygon = {
  ...privyPolygon,
  rpcUrls: {
    ...privyPolygon.rpcUrls,
    default: { http: [env.polygonRpcUrl] },
  },
} as typeof privyPolygon;
