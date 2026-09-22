'use client';

import { useState } from 'react';
import { getAddress, isAddress } from 'viem';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { useWithdraw } from '@/features/wallet/hooks/useWithdraw';
import type { WithdrawResult } from '@/features/wallet/lib/walletService';

export function WithdrawModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WithdrawResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { withdraw } = useWithdraw();

  const close = () => {
    setError(null);
    setResult(null);
    setConfirming(false);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={close}>
      <Text variant="heading" className="block">Withdraw USDC</Text>
      <Text variant="body" color="textSecondary" className="mt-2 block">
        Send funds from your trading balance to a Polygon wallet.
      </Text>
      {!result && !confirming ? (
        <>
          <input
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="Polygon wallet address"
            autoComplete="off"
            className="mt-5 w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none"
          />
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="Amount (USDC.e)"
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none"
          />
        </>
      ) : result ? (
        <div className="mt-4 rounded-lg border border-border bg-surface p-3">
          <Text variant="bodyStrong" className="block">
            {result.status === 'confirmed' ? 'Withdrawal confirmed' : 'Withdrawal pending'}
          </Text>
          <Text variant="caption" color="textSecondary" className="mt-1 block">
            {result.status === 'pending'
              ? 'Wait for confirmation before trying again.'
              : `${result.amountUsdc} USDC.e was transferred.`}
          </Text>
          {result.transactionHash ? (
            <a
              href={`https://polygonscan.com/tx/${result.transactionHash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all text-xs text-accent underline"
            >
              View transaction on PolygonScan
            </a>
          ) : result.transactionId ? (
            <Text variant="caption" color="textSecondary" className="mt-2 block break-all">
              Relayer transaction ID: {result.transactionId}
            </Text>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-surface p-3">
          <Text variant="bodyStrong" className="block">Review withdrawal</Text>
          <Text variant="caption" color="textSecondary" className="mt-2 block">Network: Polygon</Text>
          <Text variant="caption" color="textSecondary" className="block">Asset: USDC.e</Text>
          <Text variant="caption" className="mt-2 block break-all font-mono">{getAddress(recipient.trim())}</Text>
          <Text variant="caption" color="textSecondary" className="mt-2 block">Amount: {amount.trim()} USDC.e</Text>
          <Text variant="caption" color="danger" className="mt-2 block">Check the address and network. Transfers can't be reversed.</Text>
        </div>
      )}
      {error ? <Text variant="caption" color="danger" className="mt-3 block">{error}</Text> : null}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={() => confirming ? setConfirming(false) : close()} className="rounded-md px-4 py-2 text-sm text-text-secondary">
          {confirming ? 'Back' : 'Cancel'}
        </button>
        <button
          type="button"
          disabled={isSubmitting || Boolean(result) || (confirming && !isAddress(recipient.trim(), { strict: true }))}
          onClick={async () => {
            if (isSubmitting) return;
            if (!confirming) {
              const normalized = recipient.trim();
              if (!isAddress(normalized, { strict: true })) {
                setError('Enter a valid Polygon wallet address. Check the address and its checksum.');
                return;
              }
              setError(null);
              setRecipient(getAddress(normalized));
              setConfirming(true);
              return;
            }
            setIsSubmitting(true);
            try {
              setError(null);
              const normalized = recipient.trim();
              if (!isAddress(normalized, { strict: true })) throw new Error('Enter a valid Polygon wallet address. Check the address and its checksum.');
              const withdrawalResult = await withdraw(normalized as `0x${string}`, amount.trim());
              setResult(withdrawalResult);
            } catch (withdrawError) {
              setError(withdrawError instanceof Error ? withdrawError.message : 'Withdrawal failed.');
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : result ? 'Submitted' : confirming ? 'Confirm withdrawal' : 'Review withdrawal'}
        </button>
      </div>
    </Modal>
  );
}
