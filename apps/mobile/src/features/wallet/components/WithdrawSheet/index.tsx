import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { useWithdraw } from '@/features/wallet/hooks/useWithdraw';
import {
  getWithdrawOptions,
  getWithdrawQuote,
  getWithdrawStatus,
  type RecipientKind,
  type WithdrawOption,
  type WithdrawResult,
} from '@/features/wallet/services/walletService';
import { ApiRequestError } from '@/services/api/client';
import { formatUsd } from '@/utils/formatCurrency';
import { colors } from '@/theme';

/** Used until (or if) the options can't be loaded — the direct route
 * always exists. */
const FALLBACK_OPTIONS: WithdrawOption[] = [
  {
    id: 'polygon-usdce',
    network: 'Polygon',
    token: 'USDC.e',
    recipientKind: 'evm',
    viaBridge: false,
    minimumUsd: 0,
  },
];

const BRIDGE_DONE = 'COMPLETED';
const BRIDGE_FAILED = 'FAILED';

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

export interface WithdrawSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Withdraw trading balance (pUSD). USDC.e on Polygon goes straight to the
 * recipient; every other network/token goes through the Polymarket bridge,
 * which converts and delivers it (its costs come out of the amount, so the
 * quote is shown before confirming). Three steps: form → review → result,
 * and for bridge routes the result keeps tracking delivery.
 */
export function WithdrawSheet({ visible, onClose }: WithdrawSheetProps) {
  const { withdraw } = useWithdraw();
  const [destinationId, setDestinationId] = useState('polygon-usdce');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<WithdrawResult | null>(null);

  const options = useQuery({
    queryKey: ['withdraw-options'],
    queryFn: getWithdrawOptions,
    enabled: visible,
    staleTime: 10 * 60_000,
  });
  const list = options.data?.length ? options.data : FALLBACK_OPTIONS;
  const destination = list.find((option) => option.id === destinationId) ?? list[0];

  const trimmedRecipient = recipient.trim();
  const amountNumber = Number(amount);
  const amountValid = /^\d+(?:\.\d{1,6})?$/.test(amount.trim()) && amountNumber > 0;
  const recipientValid = looksValid(destination.recipientKind, trimmedRecipient);
  const meetsMinimum = amountValid && amountNumber >= destination.minimumUsd;
  const formReady = recipientValid && meetsMinimum;

  const quoteInput = useDebounce(
    // Only bridge routes have a cost to quote; the direct route delivers
    // exactly the amount.
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
      return latest === BRIDGE_DONE || latest === BRIDGE_FAILED ? false : 10_000;
    },
  });

  const reset = () => {
    setStep('form');
    setError(null);
    setResult(null);
    setSubmitting(false);
  };

  const close = () => {
    if (submitting) return;
    onClose();
    reset();
  };

  const review = () => {
    if (!recipientValid) {
      setError(`Enter a valid ${destination.network} address.`);
      return;
    }
    if (!amountValid) {
      setError('Enter a valid amount with up to 6 decimal places.');
      return;
    }
    if (!meetsMinimum) {
      setError(
        `The minimum for ${destination.token} on ${destination.network} is $${destination.minimumUsd}.`
      );
      return;
    }
    setError(null);
    setStep('review');
  };

  const confirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const withdrawal = await withdraw(trimmedRecipient, amount.trim(), destination.id);
      setResult(withdrawal);
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
      setSubmitting(false);
    }
  };

  const receiveLine = !destination.viaBridge
    ? amountValid
      ? `${amountNumber} ${destination.token}`
      : null
    : quote.data
      ? `≈ ${quote.data.estimatedReceived.toFixed(2)} ${destination.token} (at least ${quote.data.minReceived.toFixed(2)})`
      : null;

  return (
    <Modal visible={visible} onClose={close}>
      <ScrollView
        className="max-h-[560px]"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          <View className="gap-1">
            <Text variant="heading">Withdraw</Text>
            <Text variant="caption" color="textSecondary">
              Send your trading balance to a wallet or exchange.
            </Text>
          </View>

          {step === 'form' ? (
            <>
              <View className="gap-2">
                <Text variant="caption" color="textSecondary">
                  Receive as
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {list.map((option) => {
                    const selected = option.id === destination.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          setDestinationId(option.id);
                          setError(null);
                        }}
                        className={`min-h-9 justify-center rounded-full border px-3.5 ${
                          selected
                            ? 'border-accent bg-accent/15'
                            : 'border-border bg-surface-elevated'
                        }`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${option.token} on ${option.network}`}
                      >
                        <Text
                          variant="caption"
                          color={selected ? 'accent' : 'textSecondary'}
                          className="font-semibold"
                        >
                          {option.token} · {option.network}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text variant="micro" color="textTertiary">
                  {destination.viaBridge
                    ? `Converted by the Polymarket bridge. Minimum $${destination.minimumUsd}; a small network cost is taken from the amount.`
                    : 'Sent directly. No minimum and no fee.'}
                </Text>
              </View>

              <TextInput
                value={recipient}
                onChangeText={setRecipient}
                placeholder={addressPlaceholder(destination.recipientKind, destination.network)}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-lg border border-border bg-surface px-3 py-3 text-white"
                accessibilityLabel="Recipient address"
              />
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Amount (USD)"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                className="rounded-lg border border-border bg-surface px-3 py-3 text-white"
                accessibilityLabel="Amount"
              />

              {formReady ? (
                <View className="flex-row items-center gap-2">
                  {quote.isFetching ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : null}
                  <Text
                    variant="caption"
                    color={quote.isError ? 'danger' : 'textSecondary'}
                    className="flex-1"
                  >
                    {!destination.viaBridge
                      ? `You receive ${receiveLine}. No fee.`
                      : quote.isError
                        ? 'Could not get a quote for this route right now.'
                        : quote.data
                          ? `You receive ${receiveLine}. Cost ${formatUsd(quote.data.totalCostUsd)}, about ${quote.data.estimatedSeconds || 30}s.`
                          : 'Getting a quote…'}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {step === 'review' ? (
            <View className="gap-2 rounded-lg border border-border bg-surface p-3">
              <Text variant="bodyStrong">Review withdrawal</Text>
              <ReviewRow label="Network" value={destination.network} />
              <ReviewRow label="Token" value={destination.token} />
              <ReviewRow label="Amount" value={formatUsd(amountNumber)} />
              {receiveLine ? <ReviewRow label="You receive" value={receiveLine} /> : null}
              <Text variant="caption" color="textSecondary">
                To
              </Text>
              <Text variant="caption" style={{ fontFamily: 'monospace' }}>
                {trimmedRecipient}
              </Text>
              <Text variant="caption" color="danger">
                Check the address and network. Transfers can&apos;t be reversed.
              </Text>
            </View>
          ) : null}

          {step === 'done' && result ? (
            <View className="gap-2 rounded-lg border border-border bg-surface p-3">
              <View className="flex-row items-center gap-2">
                <Icon
                  name={result.status === 'confirmed' ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={result.status === 'confirmed' ? 'yes' : 'accent'}
                />
                <Text variant="bodyStrong" className="flex-1">
                  {result.status === 'confirmed'
                    ? `${formatUsd(result.amountUsdc)} sent`
                    : 'Withdrawal pending'}
                </Text>
              </View>
              {result.bridgeAddress ? (
                <BridgeDelivery
                  status={bridgeStatus.data?.[0]?.status ?? null}
                  network={destination.network}
                  token={destination.token}
                />
              ) : (
                <Text variant="caption" color="textSecondary">
                  {result.status === 'confirmed'
                    ? 'The USDC.e is on its way to the address on Polygon.'
                    : 'Wait for confirmation before trying again.'}
                </Text>
              )}
              {result.transactionHash ? (
                <Text variant="micro" color="textTertiary" style={{ fontFamily: 'monospace' }}>
                  Tx {result.transactionHash}
                </Text>
              ) : null}
            </View>
          ) : null}

          {error ? (
            <Text variant="caption" color="danger">
              {error}
            </Text>
          ) : null}

          <View className="flex-row gap-3">
            {step === 'done' ? (
              <Button label="Close" onPress={close} className="min-h-12 flex-1" />
            ) : (
              <>
                <Button
                  label={step === 'review' ? 'Back' : 'Cancel'}
                  variant="secondary"
                  onPress={() => (step === 'review' ? setStep('form') : close())}
                  disabled={submitting}
                  className="min-h-12 flex-1"
                />
                <Button
                  label={step === 'review' ? (submitting ? 'Submitting…' : 'Confirm') : 'Review'}
                  onPress={step === 'review' ? confirm : review}
                  loading={submitting}
                  disabled={
                    submitting ||
                    (destination.viaBridge && step === 'form' && formReady && !quote.data)
                  }
                  className="min-h-12 flex-1"
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption" className="flex-1 text-right">
        {value}
      </Text>
    </View>
  );
}

function BridgeDelivery({
  status,
  network,
  token,
}: {
  status: string | null;
  network: string;
  token: string;
}) {
  if (status === BRIDGE_DONE) {
    return (
      <Text variant="caption" color="yes">
        Delivered as {token} on {network}.
      </Text>
    );
  }
  if (status === BRIDGE_FAILED) {
    return (
      <Text variant="caption" color="danger">
        The bridge couldn&apos;t deliver this withdrawal. Contact support with the transaction
        below.
      </Text>
    );
  }
  return (
    <View className="flex-row items-center gap-2">
      <ActivityIndicator size="small" color={colors.textSecondary} />
      <Text variant="caption" color="textSecondary" className="flex-1">
        Converting and delivering to {network}. This usually takes about a minute.
      </Text>
    </View>
  );
}
