import { useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { useWithdraw } from '@/features/wallet/hooks/useWithdraw';
import {
  AssetPicker,
  FieldLabel,
  useAssetSelection,
} from '@/features/wallet/components/AssetPicker';
import { addressPlaceholder, looksLikeAddress } from '@/features/wallet/utils/bridgeAssets';
import {
  getWithdrawAssets,
  getWithdrawQuote,
  getWithdrawStatus,
  type WithdrawResult,
} from '@/features/wallet/services/walletService';
import { ApiRequestError } from '@/services/api/client';
import { formatUsd } from '@/utils/formatCurrency';
import { colors } from '@/theme';

const INPUT_CLASS = 'rounded-lg border border-border bg-surface px-3 py-3 text-white';

export interface WithdrawSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Withdraw trading balance (pUSD) through the Polymarket bridge: pick the
 * token and chain to receive (`/supported-assets`, same pickers as
 * deposit), enter the destination address and amount, review the bridge's
 * quote and confirm; the result keeps tracking delivery.
 */
export function WithdrawSheet({ visible, onClose }: WithdrawSheetProps) {
  const { withdraw } = useWithdraw();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<WithdrawResult | null>(null);

  const assets = useQuery({
    queryKey: ['withdraw-assets'],
    queryFn: getWithdrawAssets,
    enabled: visible,
    staleTime: 10 * 60_000,
  });
  const selection = useAssetSelection(assets.data ?? []);
  const asset = selection.asset;

  const trimmedRecipient = recipient.trim();
  const amountNumber = Number(amount);
  const amountValid = /^\d+(?:\.\d{1,6})?$/.test(amount.trim()) && amountNumber > 0;
  const recipientValid = asset ? looksLikeAddress(asset.addressType, trimmedRecipient) : false;
  const meetsMinimum = Boolean(asset) && amountValid && amountNumber >= asset!.minUsd;
  const formReady = recipientValid && meetsMinimum;

  const quoteInput = useDebounce(
    formReady && asset
      ? {
          chainId: asset.chainId,
          tokenAddress: asset.tokenAddress,
          recipient: trimmedRecipient,
          amount: amount.trim(),
        }
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
    if (submitting) return;
    onClose();
    setStep('form');
    setError(null);
    setResult(null);
  };

  const review = () => {
    if (!asset) return;
    if (!recipientValid) return setError(`Enter a valid ${asset.chainName} address.`);
    if (!amountValid) return setError('Enter a valid amount with up to 6 decimal places.');
    if (!meetsMinimum) {
      return setError(`The minimum for ${asset.symbol} on ${asset.chainName} is $${asset.minUsd}.`);
    }
    setError(null);
    setStep('review');
  };

  const confirm = async () => {
    if (!asset) return;
    setSubmitting(true);
    setError(null);
    try {
      setResult(
        await withdraw({
          chainId: asset.chainId,
          tokenAddress: asset.tokenAddress,
          recipient: trimmedRecipient,
          amount: amount.trim(),
        })
      );
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

  const receiveLine =
    quote.data && asset
      ? `≈ ${formatTokenAmount(quote.data.estimatedReceived)} ${asset.symbol} (~${formatUsd(quote.data.estimatedReceivedUsd)})`
      : null;
  const latestBridge = bridgeStatus.data?.[0]?.status ?? null;

  return (
    <BottomSheet visible={visible} onClose={close}>
      <View className="gap-4">
        <View className="gap-1">
          <Text variant="heading">Withdraw</Text>
          <Text variant="caption" color="textSecondary">
            Send your balance to a wallet or exchange.
          </Text>
        </View>

        {step === 'form' ? (
          assets.data ? (
            <View className="gap-3">
              <AssetPicker selection={selection} />
              <View>
                <FieldLabel>Recipient address</FieldLabel>
                <TextInput
                  value={recipient}
                  onChangeText={setRecipient}
                  placeholder={
                    asset ? addressPlaceholder(asset.addressType, asset.chainName) : 'Address'
                  }
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={INPUT_CLASS}
                  accessibilityLabel="Recipient address"
                />
              </View>
              <View>
                <FieldLabel>Amount</FieldLabel>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Amount (USD)"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  className={INPUT_CLASS}
                  accessibilityLabel="Amount"
                />
              </View>
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
                    {quote.isError
                      ? 'No quote for this route right now.'
                      : quote.data
                        ? `You receive ${receiveLine}. Cost ${formatUsd(quote.data.totalCostUsd)}.`
                        : 'Getting a quote…'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : assets.isError ? (
            <Text variant="caption" color="danger">
              Withdrawals are unavailable right now.
            </Text>
          ) : (
            <View className="items-center py-8">
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          )
        ) : null}

        {step === 'review' && asset ? (
          <View className="gap-2 rounded-lg border border-border bg-surface p-3">
            <Text variant="bodyStrong">Review withdrawal</Text>
            <ReviewRow label="Token" value={asset.symbol} />
            <ReviewRow label="Chain" value={asset.chainName} />
            <ReviewRow label="Amount" value={formatUsd(amountNumber)} />
            {receiveLine ? <ReviewRow label="You receive" value={receiveLine} /> : null}
            <Text variant="caption" style={{ fontFamily: 'monospace' }}>
              {trimmedRecipient}
            </Text>
            <Text variant="caption" color="danger">
              Check the address and chain. Transfers can&apos;t be reversed.
            </Text>
          </View>
        ) : null}

        {step === 'done' && result && asset ? (
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
            <Text
              variant="caption"
              color={
                latestBridge === 'COMPLETED'
                  ? 'yes'
                  : latestBridge === 'FAILED'
                    ? 'danger'
                    : 'textSecondary'
              }
            >
              {latestBridge === 'COMPLETED'
                ? `Delivered as ${asset.symbol} on ${asset.chainName}.`
                : latestBridge === 'FAILED'
                  ? "The bridge couldn't deliver it. Contact support with the transaction below."
                  : `On its way to ${asset.chainName} — about a minute.`}
            </Text>
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
                disabled={submitting || !asset || (step === 'form' && formReady && !quote.data)}
                className="min-h-12 flex-1"
              />
            </>
          )}
        </View>
      </View>
    </BottomSheet>
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

/** Destination amount: up to 6 significant decimals, trimmed. */
function formatTokenAmount(value: number): string {
  if (value >= 1) return value.toFixed(2);
  return Number(value.toPrecision(4)).toString();
}
