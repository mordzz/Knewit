const DATA_API_BASE_URL = 'https://data-api.polymarket.com';

export interface DataApiHolder {
  proxyWallet: string;
  name?: string | null;
  pseudonym?: string | null;
  profileImage?: string | null;
  amount: number;
  outcomeIndex: number;
}

export interface DataApiHoldersEntry {
  token: string;
  holders: DataApiHolder[];
}

/**
 * A market's real current holders, one entry per outcome token —
 * public, no auth. `market` is the Gamma market's `conditionId` (a hex
 * string), not its `id` — confirmed against the live API.
 */
export async function fetchHolders(
  conditionId: string,
  limit = 20
): Promise<DataApiHoldersEntry[]> {
  const query = new URLSearchParams({ market: conditionId, limit: String(limit) });
  const response = await fetch(`${DATA_API_BASE_URL}/holders?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Polymarket Data API holders failed: ${response.status}`);
  }
  return response.json() as Promise<DataApiHoldersEntry[]>;
}
