'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { useDebounce } from '@/hooks/useDebounce';
import { useWithdraw } from '@/features/wallet/hooks/useWithdraw';
import { ApiRequestError } from '@/lib/apiClient';
import {
  getWithdrawOptions,
  getWithdrawQuote,
  getWithdrawStatus,
  type RecipientKind,
  type WithdrawOption,
  type WithdrawResult,
} from '@/features/wallet/lib/walletService';

/** Used until (or if) the options can't be loaded — the direct route always exists. */
const FALLBACK_OPTIONS: WithdrawOption[] = [
  { id: 'polygon-usdce', network: 'Polygon', token: 'USDC.e', recipientKind: 'evm', viaBridge: false, minimumUsd: 0 },
];

function looksValid(kind: RecipientKind, address: string): boolean {
  if (kind === 'evm') return /^0x[a-fA-F0-9]{40}$/.test(address) && !/^0x0{40}$/i.test(address);
  if (kind === 'solana') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

function addressPlaceholder(kind: RecipientKind, network: string): string {
  if (kind === 'solana') return 'Solana address';
  if (kind === 'tron') return 'Tron address (T…)';
  return `${network} address (0x…)`;
}

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-accent';

/**
 * Withdraw trading balance (pUSD): USDC.e on Polygon goes straight to the
 * recipient; any other network/token goes through the Polymarket bridge
 * (its costs come out of the amount, so the quote shows before confirming).
 * Same flow as the mobile `WithdrawSheet`.
 */
export function WithdrawModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { withdraw } = useWithdraw();
  const [destinationId, setDestinationId] = useState('polygon-usdce');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WithdrawResult | null>(null);

  const options = useQuery({ queryKey: ['withdraw-options'], queryFn: getWithdrawOptions, enabled: visible, staleTime: 10 * 60_000 });
  const list = options.data?.length ? options.data : FALLBACK_OPTIONS;
  const destination = list.find((option) => option.id === destinationId) ?? list[0];

  const trimmedRecipient = recipient.trim();
  const amountNumber = Number(amount);
  const amountValid = /^\d+(?:\.\d{1,6})?$/.test(amount.trim()) && amountNumber > 0;
  const recipientValid = looksValid(destination.recipientKind, trimmedRecipient);
  const meetsMinimum = amountValid && amountNumber >= destination.minimumUsd;
  const formReady = recipientValid && meetsMinimum;

  const quoteInput = useDebounce(
    formReady && destination.viaBridge
      ? { destination: destination.id, recipient: trimmedRecipient, amount: amount.trim() }
      : null,
    500
  );
  const quote = useQuery({
    queryKey: ['withdraw-quote', quoteInput],
    queryFn: () => getWithdrawQuote(quoteInput!),
    enabled: visible && quoteInput != null,
    staleTime: 30_000,
    retry: false,
  });

  const bridgeStatus = useQuery({
    queryKey: ['withdraw-status', result?.bridgeAddress],
    queryFn: () => getWithdrawStatus(result!.bridgeAddress!),
    enabled: visible && step === 'done' && Boolean(result?.bridgeAddress),
    refetchInterval: (query) => {
      const latest = query.state.data?.[0]?.status;
      return latest === 'COMPLETED' || latest === 'FAILED' ? false : 10_000;
    },
  });

  const close = () => {
    if (isSubmitting) return;
    setStep('form');
    setError(null);
    setResult(null);
    onClose();
  };

  const review = () => {
    if (!recipientValid) return setError(`Enter a valid ${destination.network} address.`);
    if (!amountValid) return setError('Enter a valid amount with up to 6 decimal places.');
    if (!meetsMinimum) {
      return setError(`The minimum for ${destination.token} on ${destination.network} is $${destination.minimumUsd}.`);
    }
    setError(null);
    setStep('review');
  };

  const confirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      setResult(await withdraw(trimmedRecipient, amount.trim(), destination.id));
      setStep('done');
    } catch (failure) {
      setError(
        failure instanceof ApiRequestError
          ? failure.body.message
          : failure instanceof Error
            ? failure.message
            : 'Withdrawal failed. Check your balance before trying again.'
      );
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const receiveLine = !destination.viaBridge
    ? amountValid
      ? `${amountNumber} ${destination.token}`
      : null
    : quote.data
    ? `≈ ${quote.data.estimatedReceived.toFixed(2)} ${destination.token} (at least ${quote.data.minReceived.toFixed(2)})`
    : null;
  const latestBridge = bridgeStatus.data?.[0]?.status ?? null;

  return (
    <Modal visible={visible} onClose={close}>
      <Text variant="heading" className="block">Withdraw</Text>
      <Text variant="body" color="textSecondary" className="mt-2 block">
        Send your trading balance to a wallet or exchange.
      </Text>

      {step === 'form' ? (
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Text variant="caption" color="textSecondary">Receive as</Text>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Withdrawal network">
              {list.map((option) => {
                const selected = option.id === destination.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setDestinationId(option.id);
                      setError(null);
                    }}
                    className={`min-h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                      selected
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-border bg-surface-elevated text-text-secondary hover:border-text-tertiary'
                    }`}
                  >
                    {option.token} · {option.network}
                  </button>
                );
              })}
            </div>
            <Text variant="micro" color="textTertiary" className="block">
              {destination.viaBridge
                ? `Converted by the Polymarket bridge. Minimum $${destination.minimumUsd}; a small network cost is taken from the amount.`
                : 'Sent directly. No minimum and no fee.'}
            </Text>
          </div>
          <input
            id="withdraw-recipient"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder={addressPlaceholder(destination.recipientKind, destination.network)}
            autoComplete="off"
            aria-label="Recipient address"
            className={INPUT_CLASS}
          />
          <input
            id="withdraw-amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="Amount (USD)"
            aria-label="Amount"
            className={INPUT_CLASS}
          />
          {formReady ? (
            <Text variant="caption" color={quote.isError ? 'danger' : 'textSecondary'} className="block">
              {!destination.viaBridge
                ? `You receive ${receiveLine}. No fee.`
                : quote.isError
                  ? 'Could not get a quote for this route right now.'
                  : quote.data
                    ? `You receive ${receiveLine}. Cost $${quote.data.totalCostUsd.toFixed(2)}, about ${quote.data.estimatedSeconds || 30}s.`
                    : 'Getting a quote…'}
            </Text>
          ) : null}
        </div>
      ) : step === 'review' ? (
        <div className="mt-4 flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3">
          <Text variant="bodyStrong" className="block">Review withdrawal</Text>
          <ReviewRow label="Network" value={destination.network} />
          <ReviewRow label="Token" value={destination.token} />
          <ReviewRow label="Amount" value={`$${amountNumber}`} />
          {receiveLine ? <ReviewRow label="You receive" value={receiveLine} /> : null}
          <Text variant="caption" className="mt-1 block break-all font-mono">{trimmedRecipient}</Text>
          <Text variant="caption" color="danger" className="mt-1 block">
            Check the address and network. Transfers can&apos;t be reversed.
          </Text>
        </div>
      ) : result ? (
        <div className="mt-4 flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3">
          <Text variant="bodyStrong" className="block">
            {result.status === 'confirmed' ? `$${result.amountUsdc} sent` : 'Withdrawal pending'}
          </Text>
          <Text
            variant="caption"
            color={latestBridge === 'COMPLETED' ? 'yes' : latestBridge === 'FAILED' ? 'danger' : 'textSecondary'}
            className="block"
          >
            {result.bridgeAddress
              ? latestBridge === 'COMPLETED'
                ? `Delivered as ${destination.token} on ${destination.network}.`
                : latestBridge === 'FAILED'
                  ? "The bridge couldn't deliver this withdrawal. Contact support with the transaction below."
                  : `Converting and delivering to ${destination.network}. This usually takes about a minute.`
              : result.status === 'confirmed'
                ? 'The USDC.e is on its way to the address on Polygon.'
                : 'Wait for confirmation before trying again.'}
          </Text>
          {result.transactionHash ? (
            <a
              href={`https://polygonscan.com/tx/${result.transactionHash}`}
              target="_blank"
              rel="noreferrer"
              className="block break-all text-xs text-accent underline"
            >
              View transaction on PolygonScan
            </a>
          ) : null}
        </div>
      ) : null}

      {error ? <Text variant="caption" color="danger" className="mt-3 block">{error}</Text> : null}

      <div className="mt-6 flex justify-end gap-3">
        {step === 'done' ? (
          <button type="button" onClick={close} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black">
            Close
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => (step === 'review' ? setStep('form') : close())}
              disabled={isSubmitting}
              className="rounded-md px-4 py-2 text-sm text-text-secondary"
            >
              {step === 'review' ? 'Back' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isSubmitting || (destination.viaBridge && step === 'form' && formReady && !quote.data)}
              onClick={step === 'review' ? confirm : review}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {step === 'review' ? (isSubmitting ? 'Submitting…' : 'Confirm withdrawal') : 'Review withdrawal'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <Text variant="caption" color="textSecondary">{label}</Text>
      <Text variant="caption" className="text-right">{value}</Text>
    </div>
  );
}
