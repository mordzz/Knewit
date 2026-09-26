'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';
import { LoadingState } from '@/components/feedback/LoadingState';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useCreateTrade } from '@/hooks/useCreateTrade';
import { useSession } from '@/hooks/useSession';
import { useTradeEstimate } from '@/hooks/useTradeEstimate';
import { formatPrice, formatProbability, formatUsd } from '@/lib/formatters';
import { choiceTextColor, choiceTone, type ChoiceTone } from '@/lib/choiceTone';
import type { MarketChoice } from '@/types/market';
import type { MarketDetail } from '@/types/social';

const AMOUNT_PRESETS = [5, 10, 25, 50];

/** Tone → `Button` variant: directional yes/no keep their semantic
 * variants, everything else uses the neutral pair (docs/DECISIONS.md,
 * "Trading Any Polymarket Choice"). */
function buttonVariant(tone: ChoiceTone): ButtonVariant {
  if (tone === 'accent') return 'primary';
  if (tone === 'neutral') return 'secondary';
  return tone;
}

function binaryButtonVariant(index: number): ButtonVariant {
  return index === 0 ? 'primary' : 'secondary';
}

function validateAmount(amount: number): string | null {
  if (amount === 0) return 'Enter an amount';
  if (amount < 0 || Number.isNaN(amount)) return 'Enter a valid amount';
  return null;
}

/**
 * Market Detail's trade entry point  a single "Trade" button for the
 * market it was given, opening the shared `TradeSheet`. Event rows open
 * the exact same `TradeSheet` directly (with the child market they
 * fetched), so trading from a list needs no new page.
 */
export function TradingPanel({ market }: { market: MarketDetail }) {
  const router = useRouter();
  const { walletConnected: isConnected } = useSession();
  const [sheetVisible, setSheetVisible] = useState(false);

  if (market.resolved) {
    return <InfoBanner text="This market has resolved." />;
  }
  if (market.closed) {
    return <InfoBanner text="Market Closed  Trading is no longer available." />;
  }
  if (market.choices.length === 0) return null;

  return (
    <>
      <Button
        label={isConnected ? 'Trade' : 'Connect Wallet to Trade'}
        className="w-full"
        onClick={() => {
          if (!isConnected) {
            router.push('/wallet');
            return;
          }
          setSheetVisible(true);
        }}
      />
      <TradeSheet market={market} visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}

/**
 * Web equivalent of `apps/mobile`'s `TradeSheet`  pick a choice +
 * amount, review, submit (`CreateTradeInput.choiceIndex`; the label is
 * resolved server-side). Pass `market: null` while a row-opened child
 * market is still loading and the sheet shows an honest loading state.
 * Never fabricates a successful trade  a failed backend call shows a
 * real "Trade failed" state.
 */
function useTradeFlow(market: MarketDetail | null, onClose: () => void) {
  const { address, walletConnected: isConnected } = useSession();
  // Trades spend from the Polymarket Deposit Wallet, so that's the address
  // the confirm step shows.
  const balance = useWalletBalance();
  const tradingAddress = balance.data?.address ?? null;
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [amountText, setAmountText] = useState('');
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [isValidating, setIsValidating] = useState(false);
  const mutation = useCreateTrade(market?.id ?? '');

  const choice = market?.choices[choiceIndex] ?? market?.choices[0];
  const amount = Number(amountText) || 0;
  const price = choice?.price ?? 0;
  // Order-book-aware estimate (depth included) for the amount being
  // typed; the plain `amount / price` math is only the fallback while
  // the estimate loads or if it's unavailable.
  const fallbackShares = amount > 0 && price > 0 ? (amount * 100) / price : 0;
  const estimate = useTradeEstimate(market?.id ?? '', choice?.index ?? null, amount);
  const shares = estimate.data?.estimatedShares ?? fallbackShares;
  // What the venue would actually fill at (order-book average); the
  // market's rounded summary price is only the pre-response fallback.
  const displayPrice = estimate.data?.estimatedPrice ?? price;
  const canSubmit = amount > 0 && price > 0 && choice != null;

  function handleChangeAmount(value: string) {
    // Keep digits and at most one decimal point with up to 2 decimal places
    // (USDC cents)  the previous `[^0-9]` strip silently turned "12.50"
    // into "1250".
    const cleaned = value.replace(/[^0-9.]/g, '');
    const [whole, ...rest] = cleaned.split('.');
    const normalized = rest.length > 0 ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
    setAmountText(normalized);
  }

  function closeSheet() {
    onClose();
    setStep('pick');
    if (mutation.isSuccess) {
      mutation.reset();
      setAmountText('');
    }
  }

  function goToConfirm() {
    if (validateAmount(amount)) return;
    setStep('confirm');
  }

  function handleConfirm() {
    setIsValidating(true);
    const validationError = validateAmount(amount);
    const stillTradeable = market != null && !market.closed && !market.resolved;
    setIsValidating(false);
    if (validationError || !isConnected || !address || !stillTradeable || !choice || !market) return;
    mutation.mutate({ marketId: market.id, choiceIndex: choice.index, usdAmount: amount });
  }

  return {
    market,
    address,
    tradingAddress,
    choice,
    choiceIndex,
    setChoiceIndex,
    amountText,
    handleChangeAmount,
    amount,
    displayPrice,
    shares,
    canSubmit,
    step,
    setStep,
    isValidating,
    mutation,
    closeSheet,
    goToConfirm,
    handleConfirm,
  };
}

type TradeFlow = ReturnType<typeof useTradeFlow>;

/** The pick → confirm → result content, shared by the mobile sheet and
 * the desktop inline card. */
function TradeFlowContent({ flow }: { flow: TradeFlow }) {
  const { market } = flow;

  if (!market) {
    return (
      <div className="py-2">
        <LoadingState rows={3} />
      </div>
    );
  }
  if (market.resolved) return <InfoBanner text="This market has resolved." />;
  if (market.closed) return <InfoBanner text="Market Closed  Trading is no longer available." />;
  if (market.choices.length === 0) return <InfoBanner text="This market has no tradeable outcomes." />;

  return flow.step === 'pick' ? (
    <PickStep
      choices={market.choices}
      choiceIndex={flow.choiceIndex}
      onSelectChoice={flow.setChoiceIndex}
      amountText={flow.amountText}
      onChangeAmount={flow.handleChangeAmount}
      amount={flow.amount}
      price={flow.displayPrice}
      shares={flow.shares}
      canSubmit={flow.canSubmit}
      onContinue={flow.goToConfirm}
    />
  ) : (
    <ConfirmTradeContent
      market={market}
      choice={flow.choice}
      amount={flow.amount}
      shares={flow.shares}
      price={flow.displayPrice}
      address={flow.tradingAddress}
      isValidating={flow.isValidating}
      mutationStatus={flow.mutation.status}
      errorMessage={flow.mutation.error?.message ?? null}
      onConfirm={flow.handleConfirm}
      onBack={() => flow.setStep('pick')}
      onClose={flow.closeSheet}
    />
  );
}

export function TradeSheet({
  market,
  visible,
  onClose,
}: {
  market: MarketDetail | null;
  visible: boolean;
  onClose: () => void;
}) {
  const flow = useTradeFlow(market, onClose);

  return (
    <BottomSheet visible={visible} onClose={flow.closeSheet}>
      <TradeFlowContent flow={flow} />
    </BottomSheet>
  );
}

/**
 * Desktop-only inline trade card (the right column of Market Detail)
 * the same flow as `TradeSheet`, rendered in place instead of a sheet.
 * Give it a `key` of the market id so switching markets starts fresh.
 */
export function TradeCard({ market }: { market: MarketDetail | null }) {
  const router = useRouter();
  const { walletConnected: isConnected } = useSession();
  const flow = useTradeFlow(market, () => {});

  return (
    <div className={`${CARD_SURFACE_CLASS} p-5`}>
      {!isConnected && market && !market.resolved && !market.closed ? (
        <Button label="Connect Wallet to Trade" onClick={() => router.push('/wallet')} />
      ) : (
        <TradeFlowContent flow={flow} />
      )}
    </div>
  );
}

function PickStep({
  choices,
  choiceIndex,
  onSelectChoice,
  amountText,
  onChangeAmount,
  amount,
  price,
  shares,
  canSubmit,
  onContinue,
}: {
  choices: MarketChoice[];
  choiceIndex: number;
  onSelectChoice: (index: number) => void;
  amountText: string;
  onChangeAmount: (value: string) => void;
  amount: number;
  price: number;
  shares: number;
  canSubmit: boolean;
  onContinue: () => void;
}) {
  const selected = choices[choiceIndex] ?? choices[0];
  const stacked = choices.length !== 2;

  return (
    <div className="flex flex-col gap-3">
      <Text variant="heading">Trade</Text>

      <div className={stacked ? 'flex flex-col gap-2' : 'flex gap-2'}>
        {choices.map((choice) => (
          <OutcomeCard
            key={choice.index}
            label={choice.label}
            imageUrl={choice.imageUrl}
            selected={choice.index === selected?.index}
            tone={choiceTone(choice)}
            stacked={stacked}
            onPress={() => onSelectChoice(choice.index)}
          />
        ))}
      </div>

      <Input label="Amount" inputMode="numeric" value={amountText} onChange={(e) => onChangeAmount(e.target.value)} placeholder="$0" />

      <div className="flex gap-2">
        {AMOUNT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChangeAmount(String(preset))}
            className="rounded-full border border-border px-3 py-1.5 hover:opacity-70"
          >
            <Text variant="caption" color="textSecondary">
              ${preset}
            </Text>
          </button>
        ))}
      </div>

      {amount > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-lg bg-surface-elevated p-3">
          <EstimateRow label="You pay" value={formatUsd(amount)} />
          <EstimateRow label="Shares if filled" value={shares.toFixed(2)} />
          <EstimateRow label="Average price" value={formatPrice(price)} />
          <EstimateRow label="Market-implied chance" value={formatProbability(price)} />
          <EstimateRow label="Potential payout" value={formatUsd(shares)} />
          <EstimateRow label="Potential profit" value={`+${formatUsd(Math.max(0, shares - amount))}`} />
          <Text variant="micro" color="textTertiary" className="mt-0.5 block">
            Each share pays $1 if this call wins  a cheaper share means a bigger payout, but a lower chance.
          </Text>
        </div>
      ) : null}

      <Button
        variant={selected ? (choices.length === 2 ? binaryButtonVariant(selected.index) : buttonVariant(choiceTone(selected))) : 'primary'}
        label={`Continue with ${selected?.label ?? ''}${amount > 0 ? ` · ${formatUsd(amount)}` : ''}`}
        onClick={onContinue}
        disabled={!canSubmit}
      />
    </div>
  );
}

const TONE_ACTIVE_CLASS: Record<ChoiceTone, string> = {
  yes: 'border-yes bg-yes-muted',
  no: 'border-no bg-no-muted',
  accent: 'border-accent bg-accent-muted',
  neutral: 'border-accent bg-accent-muted',
};

const TONE_TEXT: Record<ChoiceTone, 'yes' | 'no' | 'accent' | 'textPrimary'> = {
  yes: 'yes',
  no: 'no',
  accent: 'accent',
  neutral: 'textPrimary',
};

function OutcomeCard({
  label,
  imageUrl,
  selected,
  tone,
  stacked,
  onPress,
}: {
  label: string;
  imageUrl?: string | null;
  selected: boolean;
  tone: ChoiceTone;
  stacked: boolean;
  onPress: () => void;
}) {
  const textColor = TONE_TEXT[tone];
  const binarySelected = !stacked && selected;

  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex flex-col items-center gap-1 rounded-xl border p-3 ${stacked ? 'w-full' : 'flex-1'} ${binarySelected ? 'border-accent bg-accent' : selected ? TONE_ACTIVE_CLASS[tone] : 'border-border bg-black'}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : null}
      <Text variant="bodyStrong" color={binarySelected ? 'textInverse' : selected ? textColor : 'textPrimary'}>
        {label}
      </Text>
    </button>
  );
}

function EstimateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption">{value}</Text>
    </div>
  );
}

function ConfirmTradeContent({
  market,
  choice,
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
  choice: MarketChoice | undefined;
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
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <Icon name="checkmark-circle" size={36} color="yes" />
        <Text variant="bodyStrong">Trade successful</Text>
        <Text variant="caption" color="textSecondary">
          Your position will appear below shortly.
        </Text>
        <Button label="Done" onClick={onClose} className="mt-3 w-full" />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <Icon name="alert-circle-outline" size={36} color="danger" />
        <Text variant="bodyStrong">Trade failed</Text>
        <Text variant="caption" color="textSecondary">
          {friendlyTradeError(errorMessage)}
        </Text>
        <Button label="Try again" onClick={onConfirm} className="mt-3 w-full" />
        <Button label="Cancel" variant="ghost" onClick={onClose} className="w-full" />
      </div>
    );
  }

  if (status === 'preparing' || status === 'pending') {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
          <Text variant="bodyStrong">{status === 'preparing' ? 'Preparing trade…' : 'Transaction pending…'}</Text>
        <Text variant="caption" color="textSecondary">
          This won&apos;t take long.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Text variant="heading">Confirm Trade</Text>

      <ConfirmRow label="Market" value={market.question} />
      <ConfirmRow
        label="Position"
        value={choice?.label ?? ''}
        valueColor={choice ? choiceTextColor(choiceTone(choice)) : 'textPrimary'}
      />
      <ConfirmRow label="You pay" value={formatUsd(amount)} />
      <ConfirmRow label="Average price" value={formatPrice(price)} />
      <ConfirmRow label="Market-implied chance" value={formatProbability(price)} />
      <ConfirmRow label="Shares if filled" value={shares.toFixed(2)} />
      <ConfirmRow label="Potential payout" value={formatUsd(shares)} />
      <ConfirmRow label="Potential profit" value={`+${formatUsd(Math.max(0, shares - amount))}`} />
      <div className="flex items-center justify-between">
        <Text variant="caption" color="textSecondary">
          Wallet
        </Text>
        {address ? <WalletAddress address={address} compact /> : null}
      </div>

      <Button variant={choice ? buttonVariant(choiceTone(choice)) : 'primary'} label="Confirm Trade" onClick={onConfirm} className="mt-2" />
      <Button label="Back" variant="ghost" onClick={onBack} />
    </div>
  );
}

function ConfirmRow({ label, value, valueColor = 'textPrimary' }: { label: string; value: string; valueColor?: 'textPrimary' | 'yes' | 'no' | 'accent' }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyStrong" color={valueColor} className="flex-1 text-right">
        {value}
      </Text>
    </div>
  );
}

function friendlyTradeError(message: string | null): string {
  if (!message) return "Couldn't complete this trade right now. Please try again.";
  if (/network/i.test(message)) {
    return 'Network error - check your connection and try again.';
  }
  // Our own preflight 400s are already actionable sentences (balance /
  // one-time setup)  surface them as-is instead of flattening to a
  // generic failure (docs/DECISIONS.md, "Trade Preflight").
  if (/balance is too low|one-time trading setup|no resting orders/i.test(message)) return message;
  return "Couldn't complete this trade right now. Please try again.";
}

function InfoBanner({ text }: { text: string }) {
  return (
    <Card contentClassName="p-4">
      <Text variant="body" color="textSecondary" className="block text-center">
        {text}
      </Text>
    </Card>
  );
}
