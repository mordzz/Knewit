'use client';

import { usePrivy, useLogout } from '@privy-io/react-auth';
import { IoCheckmarkCircle, IoAlertCircleOutline } from 'react-icons/io5';

/**
 * Web port of `apps/frontend`'s `WalletScreen` — reached from Profile,
 * not its own sidebar item, same as mobile (docs/DECISIONS.md). Shows
 * only real Privy state: no fake balance, positions, or wallet info is
 * ever fabricated (docs/WALLET.md). `usePrivy().ready`/`user.wallet`
 * are the web SDK's equivalents of the mobile hook's `isReady`/
 * `useWallet()`.
 */
export default function WalletPage() {
  const { ready, user } = usePrivy();
  const { logout } = useLogout();
  const address = user?.wallet?.address ?? null;

  return (
    <main className="w-full px-4 py-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      {!ready ? (
        <p className="mt-4 text-text-secondary">Loading wallet…</p>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            {address ? (
              <IoCheckmarkCircle size={18} className="text-yes" />
            ) : (
              <IoAlertCircleOutline size={18} className="text-text-tertiary" />
            )}
            <span className={`font-bold ${address ? 'text-yes' : 'text-text-tertiary'}`}>
              {address ? 'Wallet Connected' : 'Not connected'}
            </span>
          </div>

          {address ? (
            <>
              <div className="my-3 h-px bg-border" />
              <p className="text-sm text-text-secondary">Address</p>
              <p className="mt-1 break-all font-mono text-sm">{address}</p>

              <div className="my-3 h-px bg-border" />
              <p className="font-bold">Wallet Information</p>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-text-secondary">Type</span>
                <span>Embedded (Privy)</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-text-secondary">Network</span>
                <span>Polygon</span>
              </div>
            </>
          ) : null}
        </div>
      )}

      <p className="mt-4 text-sm text-text-secondary">
        Your wallet is securely managed through Privy. We never see or store your private keys.
      </p>

      <button
        type="button"
        onClick={() => logout()}
        className="mt-6 w-full rounded-md border border-white/15 bg-surface-elevated py-3 font-semibold text-danger"
      >
        Log out
      </button>
    </main>
  );
}
