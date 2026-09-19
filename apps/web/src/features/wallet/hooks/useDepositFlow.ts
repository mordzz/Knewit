'use client';

import { useState } from 'react';
import { useDeposit } from '@/features/wallet/hooks/useDeposit';
import { isUserCancelledFunding } from '@/features/auth/lib/privyErrors';

/**
 * The loading/error wrapper around `useDeposit`'s bare `deposit()` call —
 * previously duplicated in `(app)/home`'s `Header` and `(app)/wallet`;
 * factored out once so `TopHeader` doesn't become a third copy.
 */
export function useDepositFlow() {
  const { deposit } = useDeposit();
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const handleDeposit = async () => {
    setDepositError(null);
    setIsDepositing(true);
    try {
      await deposit();
    } catch (error) {
      if (isUserCancelledFunding(error)) return; // closing Privy's modal is not a failure
      console.error('Deposit flow failed:', error);
      setDepositError("Couldn't open the deposit flow. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  return { isDepositing, depositError, handleDeposit };
}
