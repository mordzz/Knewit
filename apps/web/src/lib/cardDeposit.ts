/** Card deposits (MoonPay → embedded wallet → Polymarket bridge). The
 * embedded-wallet → bridge transfer needs gas, so this stays off until
 * Privy gas sponsorship is enabled for Polygon. Off: Deposit opens crypto
 * deposit directly; on: Deposit asks card or crypto. Same flag the backend
 * reads (`lib/deposits/forwardToBridge.ts`). */
export const cardDepositEnabled = process.env.NEXT_PUBLIC_CARD_DEPOSIT_ENABLED === 'true';
