import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { useWallet } from '@/hooks/useWallet';
import { useCreateTrade } from '@/features/markets/hooks/useCreateTrade';
import { formatPrice, formatUsd } from '@/utils/formatCurrency';
import type { Outcome } from '@/types/market';
import type { MarketDetail } from '@/types/social';

const AMOUNT_PRESETS = [5, 10, 25, 50];

function outcomeLabel(market: MarketDetail, outcome: Outcome): string {
  const labels = market.outcomeLabels ?? { yes: 'Yes', no: 'No' };
  return outcome === 'YES' ? labels.yes : labels.no;
}

function validateAmount(amount: number): string | null {
  if (amount === 0) return 'Enter an amount';
  if (amount < 0 || Number.isNaN(amount)) return 'Enter a valid amount';
  // No minimum is enforced beyond ">0" — no real Polymarket/backend rule
  // for one exists yet, and inventing a number would be exactly the
  // fabricated constraint Sprint 7's spec forbids. Insufficient-balance
  // validation is likewise omitted: no wallet balance data source exists
  // yet (see docs/WALLET.md) — see docs/DECISIONS.md.
  return null;
}

/**
 * Market Detail's real trading interaction — a single "Trade" button
 * rather than an always-visible panel (see docs/DECISIONS.md, "Trade
 * Button, Not an Inline Panel"), opening one `BottomSheet` whose content
 * switches between two internal steps: **pick** (outcome + amount,
 * what used to be the always-visible Card) and **confirm** (the
 * existing review → pending → success/failed machine, unchanged). One
 * sheet with a step, not two stacked sheets — nesting a second RN Modal
 * on top of a first is the kind of thing that gets visually janky on at
 * least one platform for no benefit here. Never fabricates a successful
 * trade: if the backend call fails (including because no backend exists
 * in this environment), the sheet shows a real "Trade failed" state —
 * see docs/DECISIONS.md ("No Fake Trade Success").
 */
export function TradingPanel({ market }: { market: MarketDetail }) {
  const navigation = useNavigation();
  const { isConnected, address } = useWallet();
  const [outcome, setOutcome] = useState<Outcome>('YES');
  const [amountText, setAmountText] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [isValidating, setIsValidating] = useState(false);
  const mutation = useCreateTrade(market.id);

  const amount = Number(amountText) || 0;
  const price = outcome === 'YES' ? market.yesPrice : market.noPrice;
  const shares = amount > 0 && price > 0 ? (amount * 100) / price : 0;
  const canSubmit = amount > 0 && price > 0;

  function handleChangeAmount(text: string) {
    setAmountText(text.replace(/[^0-9]/g, ''));
  }

  function openSheet() {
    if (!isConnected) {
      navigation.navigate('Auth');
      return;
    }
    mutation.reset();
    setStep('pick');
    setSheetVisible(true);
  }

  function goToConfirm() {
    if (validateAmount(amount)) return;
    setStep('confirm');
  }

  async function handleConfirm() {
    // Re-checked here, immediately before submitting, rather than only
    // when the sheet opened — guards against the wallet disconnecting
    // or the amount becoming invalid while the sheet was open (Sprint 7:
    // never trade against a stale wallet/market context).
    setIsValidating(true);
    const validationError = validateAmount(amount);
    const stillTradeable = !market.closed && !market.resolved && market.isBinary !== false;
    setIsValidating(false);
    if (validationError || !isConnected || !address || !stillTradeable) {
      return;
    }
    mutation.mutate({ marketId: market.id, outcome, usdAmount: amount });
  }

  function closeSheet() {
    setSheetVisible(false);
    setStep('pick');
    if (mutation.isSuccess) {
      // Reset for the next trade only after the user has dismissed a
      // successful one — keeps "Trade successful" on screen while the
      // sheet is still open.
      mutation.reset();
      setAmountText('');
    }
  }

  if (market.resolved) {
    return (
      <InfoBanner
        text={
          market.resolvedOutcome
            ? `This market resolved ${outcomeLabel(market, market.resolvedOutcome)}.`
            : 'This market has resolved.'
        }
      />
    );
  }
  if (market.isBinary === false) return null;
  if (market.closed) {
    return <InfoBanner text="Market Closed — Trading is no longer available." />;
  }

  const labels = market.outcomeLabels ?? { yes: 'Yes', no: 'No' };

  return (
    <>
      <Button
        label={isConnected ? 'Trade' : 'Connect Wallet to Trade'}
        onPress={openSheet}
        accessibilityLabel="Trade this market"
      />

      <BottomSheet visible={sheetVisible} onClose={closeSheet}>
        {step === 'pick' ? (
          <PickStep
            labels={labels}
            outcome={outcome}
            onSelectOutcome={setOutcome}
            yesPrice={market.yesPrice}
            noPrice={market.noPrice}
            amountText={amountText}
            onChangeAmount={handleChangeAmount}
            amount={amount}
            price={price}
            shares={shares}
            canSubmit={canSubmit}
            onContinue={goToConfirm}
          />
        ) : (
          <ConfirmTradeContent
            market={market}
            outcome={outcome}
            amount={amount}
            shares={shares}
            price={price}
            address={address}
            isValidating={isValidating}
            mutationStatus={mutation.status}
            errorMessage={mutation.error?.message ?? null}
            onConfirm={handleConfirm}
            onBack={() => setStep('pick')}
            onClose={closeSheet}
          />
        )}
      </BottomSheet>
    </>
  );
}

/** Step 1 of the Trade sheet — outcome + amount, what used to be the
 * always-visible Card's contents. Purely a picker; nothing here submits
 * a trade, `onContinue` only advances to the review step. */
function PickStep({
  labels,
  outcome,
  onSelectOutcome,
  yesPrice,
  noPrice,
  amountText,
  onChangeAmount,
  amount,
  price,
  shares,
  canSubmit,
  onContinue,
}: {
  labels: { yes: string; no: string };
  outcome: Outcome;
  onSelectOutcome: (outcome: Outcome) => void;
  yesPrice: number;
  noPrice: number;
  amountText: string;
  onChangeAmount: (text: string) => void;
  amount: number;
  price: number;
  shares: number;
  canSubmit: boolean;
  onContinue: () => void;
}) {
  return (
    <View className="gap-3">
      <Text variant="heading">Trade</Text>

      <View className="flex-row gap-2">
        <OutcomeCard
          label={labels.yes}
          priceCents={yesPrice}
          selected={outcome === 'YES'}
          variant="yes"
          onPress={() => onSelectOutcome('YES')}
        />
        <OutcomeCard
          label={labels.no}
          priceCents={noPrice}
          selected={outcome === 'NO'}
          variant="no"
          onPress={() => onSelectOutcome('NO')}
        />
      </View>

      <Input
        label="Amount"
        keyboardType="numeric"
        value={amountText}
        onChangeText={onChangeAmount}
        placeholder="$0"
        accessibilityLabel="Trade amount in dollars"
      />

      <View className="flex-row gap-2">
        {AMOUNT_PRESETS.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => onChangeAmount(String(preset))}
            className="rounded-full border border-border px-3 py-1.5 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={`Set amount to $${preset}`}
          >
            <Text variant="caption" color="textSecondary">
              ${preset}
            </Text>
          </Pressable>
        ))}
      </View>

      {amount > 0 ? (
        <View className="gap-1 rounded-lg bg-surface-elevated p-3">
          <EstimateRow label="Estimated shares" value={shares.toFixed(2)} />
          <EstimateRow label="Estimated price" value={formatPrice(price)} />
          <EstimateRow label="Estimated cost" value={formatUsd(amount)} />
          <EstimateRow label="Payout if correct" value={formatUsd(shares)} />
        </View>
      ) : null}

      <Button
        variant={outcome === 'YES' ? 'yes' : 'no'}
        label={`Continue with ${outcome === 'YES' ? labels.yes : labels.no}${amount > 0 ? ` · ${formatUsd(amount)}` : ''}`}
        onPress={onContinue}
        disabled={!canSubmit}
        accessibilityLabel={`Continue with ${outcome === 'YES' ? labels.yes : labels.no}`}
      />
    </View>
  );
}

function OutcomeCard({
  label,
  priceCents,
  selected,
  variant,
  onPress,
}: {
  label: string;
  priceCents: number;
  selected: boolean;
  variant: 'yes' | 'no';
  onPress: () => void;
}) {
  const activeClass = variant === 'yes' ? 'border-yes bg-yes-muted' : 'border-no bg-no-muted';
  const textColor = variant === 'yes' ? 'yes' : 'no';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center gap-1 rounded-xl border p-3 ${
        selected ? activeClass : 'border-border bg-surface-elevated'
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${formatPrice(priceCents)}${selected ? ', selected' : ''}`}
    >
      <Text variant="bodyStrong" color={selected ? textColor : 'textPrimary'}>
        {label}
      </Text>
      <Text variant="title" color={selected ? textColor : 'textSecondary'}>
        {formatPrice(priceCents)}
      </Text>
    </Pressable>
  );
}

function EstimateRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption" color="textPrimary">
        {value}
      </Text>
    </View>
  );
}

function ConfirmTradeContent({
  market,
  outcome,
  amount,
  shares,
  price,
  address,
  isValidating,
  mutationStatus,
  errorMessage,
  onConfirm,
  onBack,
  onClose,
}: {
  market: MarketDetail;
  outcome: Outcome;
  amount: number;
  shares: number;
  price: number;
  address: string | null;
  isValidating: boolean;
  mutationStatus: 'idle' | 'pending' | 'error' | 'success';
  errorMessage: string | null;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  // "signing" is a real, defined state (types/trading.ts) that this flow
  // never enters — see docs/DECISIONS.md ("Trade Signing Not
  // Implemented This Sprint"). Only preparing (client-side validation)
  // and pending (the live backend call) are ever actually reached.
  const status: 'idle' | 'preparing' | 'pending' | 'success' | 'failed' = isValidating
    ? 'preparing'
    : mutationStatus === 'pending'
      ? 'pending'
      : mutationStatus === 'error'
        ? 'failed'
        : mutationStatus === 'success'
          ? 'success'
          : 'idle';

  if (status === 'success') {
    return (
      <View className="items-center gap-2 py-2">
        <Icon name="checkmark-circle" size={36} color="yes" />
        <Text variant="bodyStrong">Trade successful</Text>
        <Text variant="caption" color="textSecondary" className="text-center">
          Your position will appear below shortly.
        </Text>
        <Button label="Done" onPress={onClose} className="mt-3 w-full" />
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View className="items-center gap-2 py-2">
        <Icon name="alert-circle-outline" size={36} color="danger" />
        <Text variant="bodyStrong">Trade failed</Text>
        <Text variant="caption" color="textSecondary" className="text-center">
          {friendlyTradeError(errorMessage)}
        </Text>
        <Button label="Try again" onPress={onConfirm} className="mt-3 w-full" />
        <Button label="Cancel" variant="ghost" onPress={onClose} className="w-full" />
      </View>
    );
  }

  if (status === 'preparing' || status === 'pending') {
    return (
      <View className="items-center gap-2 py-6">
        <Text variant="bodyStrong">
          {status === 'preparing' ? 'Preparing trade...' : 'Transaction pending...'}
        </Text>
        <Text variant="caption" color="textSecondary">
          This won&apos;t take long.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text variant="heading">Confirm Trade</Text>

      <ConfirmRow label="Market" value={market.question} />
      <ConfirmRow label="Position" value={outcome} valueColor={outcome === 'YES' ? 'yes' : 'no'} />
      <ConfirmRow label="Amount" value={formatUsd(amount)} />
      <ConfirmRow label="Estimated price" value={formatPrice(price)} />
      <ConfirmRow label="Estimated shares" value={shares.toFixed(2)} />
      <View className="flex-row items-center justify-between">
        <Text variant="caption" color="textSecondary">
          Wallet
        </Text>
        {address ? <WalletAddress address={address} compact /> : null}
      </View>

      <Button
        variant={outcome === 'YES' ? 'yes' : 'no'}
        label="Confirm Trade"
        onPress={onConfirm}
        className="mt-2"
      />
      <Button label="Back" variant="ghost" onPress={onBack} />
    </View>
  );
}

function ConfirmRow({
  label,
  value,
  valueColor = 'textPrimary',
}: {
  label: string;
  value: string;
  valueColor?: 'textPrimary' | 'yes' | 'no';
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyStrong" color={valueColor} className="flex-1 text-right">
        {value}
      </Text>
    </View>
  );
}

/** Never surfaces a raw stack trace/internal error to the user — maps
 * anything unrecognized to one honest, generic message. */
function friendlyTradeError(message: string | null): string {
  if (!message) return "Couldn't complete this trade right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error — check your connection and try again.';
  }
  return "Couldn't complete this trade right now. Please try again.";
}

function InfoBanner({ text }: { text: string }) {
  return (
    <Card contentClassName="p-4">
      <Text variant="body" color="textSecondary" className="text-center">
        {text}
      </Text>
    </Card>
  );
}
