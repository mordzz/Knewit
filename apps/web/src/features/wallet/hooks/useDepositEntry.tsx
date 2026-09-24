'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useBuyWithCardFlow } from '@/features/wallet/hooks/useBuyWithCardFlow';
import { DepositModal } from '@/features/wallet/components/DepositModal';

/**
 * One Deposit entry point for every Deposit button (TopHeader, Wallet,
 * Settings, Callouts). A guest still gets demo funds in one tap; a real
 * account opens `DepositModal` — straight to crypto deposit, or card vs
 * crypto when card deposits are enabled. Render `depositModal` once in the
 * component that calls `startDeposit`.
 */
export function useDepositEntry() {
  const flow = useBuyWithCardFlow();
  const { isGuest } = useSession();
  const [open, setOpen] = useState(false);

  const startDeposit = () => {
    if (isGuest) {
      void flow.handleBuyWithCard();
      return;
    }
    setOpen(true);
  };

  const depositModal = (
    <DepositModal visible={open} onClose={() => setOpen(false)} onBuyWithCard={() => void flow.handleBuyWithCard()} />
  );

  return { ...flow, startDeposit, depositModal };
}
