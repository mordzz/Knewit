import { after } from 'next/server';
import {
  DEPOSIT_TOKEN_CONTRACTS,
  findDepositOwners,
  isValidAlchemySignature,
} from '@/lib/deposits/depositAddresses';
import { convertDepositForUser } from '@/lib/deposits/convertDeposit';

// The conversion runs after the response, within this route's budget.
export const maxDuration = 60;

interface AlchemyActivity {
  toAddress?: string;
  category?: string;
  rawContract?: { address?: string };
}

interface AlchemyAddressActivityPayload {
  id?: string;
  type?: string;
  event?: { network?: string; activity?: AlchemyActivity[] };
}

/**
 * `POST /webhooks/alchemy` — Alchemy "Address Activity" webhook (Polygon
 * Mainnet). When USDC or USDC.e lands on a known deposit address, the
 * owner's deposit is converted to trading collateral in the background —
 * the same `convertDepositForUser` the app calls, so a conversion the app
 * already started is never repeated. Answers 200 immediately (Alchemy
 * retries slow or failed deliveries); only a bad signature is rejected.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!isValidAlchemySignature(rawBody, request.headers.get('x-alchemy-signature'))) {
    return Response.json({ code: 'unauthorized', message: 'Invalid webhook signature.' }, { status: 401 });
  }

  let payload: AlchemyAddressActivityPayload;
  try {
    payload = JSON.parse(rawBody) as AlchemyAddressActivityPayload;
  } catch {
    return Response.json({ code: 'bad_request', message: 'Invalid JSON.' }, { status: 400 });
  }
  if (payload.type !== 'ADDRESS_ACTIVITY') return Response.json({ ignored: true });

  const recipients = [
    ...new Set(
      (payload.event?.activity ?? [])
        .filter(
          (activity) =>
            activity.category === 'token' &&
            activity.toAddress &&
            DEPOSIT_TOKEN_CONTRACTS.has((activity.rawContract?.address ?? '').toLowerCase())
        )
        .map((activity) => (activity.toAddress as string).toLowerCase())
    ),
  ];
  if (recipients.length === 0) return Response.json({ ignored: true });

  after(async () => {
    try {
      const owners = await findDepositOwners(recipients);
      for (const privyUserId of new Set(owners.values())) {
        const { body } = await convertDepositForUser(privyUserId, `alchemy:${payload.id ?? Date.now()}`);
        console.info('[webhooks/alchemy] deposit conversion:', { status: body.status, amountUsd: body.amountUsd });
      }
    } catch (error) {
      console.error('[webhooks/alchemy] deposit conversion failed:', error);
    }
  });

  return Response.json({ received: recipients.length });
}
