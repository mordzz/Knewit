'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { useWithdraw } from '@/features/wallet/hooks/useWithdraw';

export function WithdrawModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const { withdraw } = useWithdraw();

  const close = () => {
    setError(null);
    setHash(null);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={close}>
      <Text variant="heading" className="block">Withdraw USDC</Text>
      <Text variant="body" color="textSecondary" className="mt-2 block">
        Send USDC on Polygon to another wallet. Privy will ask you to confirm the transaction.
      </Text>
      <input
        value={recipient}
        onChange={(event) => setRecipient(event.target.value)}
        placeholder="Recipient wallet address"
        className="mt-5 w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none"
      />
      <input
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        inputMode="decimal"
        placeholder="Amount (USDC)"
        className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none"
      />
      {error ? <Text variant="caption" color="danger" className="mt-3 block">{error}</Text> : null}
      {hash ? <Text variant="caption" color="yes" className="mt-3 block">Transaction sent: {hash}</Text> : null}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={close} className="rounded-md px-4 py-2 text-sm text-text-secondary">
          Cancel
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              setError(null);
              const normalized = recipient.trim();
              if (!/^0x[a-fA-F0-9]{40}$/.test(normalized)) throw new Error('Enter a valid EVM wallet address.');
              const transactionHash = await withdraw(normalized as `0x${string}`, amount.trim());
              setHash(transactionHash);
            } catch (withdrawError) {
              setError(withdrawError instanceof Error ? withdrawError.message : 'Withdrawal failed.');
            }
          }}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black"
        >
          Continue with Privy
        </button>
      </div>
    </Modal>
  );
}
