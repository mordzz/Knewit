'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Text } from '@/components/ui/Text';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LoadingState } from '@/components/feedback/LoadingState';
import { WalletAddress } from '@/components/WalletAddress';
import { useCreateTrade } from '@/hooks/useCreateTrade';
import { formatPrice, formatUsd } from '@/lib/formatters';
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

function validateAmount(amount: number): string | null {
  if (amount === 0) return 'Enter an amount';
  if (amount < 0 || Number.isNaN(amount)) return 'Enter a valid amount';
  return null;
}

/**
 * Market Detail's trade entry point — a single "Trade" button for the
 * market it was given, opening the shared `TradeSheet`. Event rows open
 * the exact same `TradeSheet` directly (with the child market they
 * fetched), so trading from a list needs no new page.
 */
export function TradingPanel({ market }: { market: MarketDetail }) {
  const router = useRouter();
  const { user } = usePrivy();
  const isConnected = !!user?.wallet?.address;
  const [sheetVisible, setSheetVisible] = useState(false);

  if (market.resolved) {
    return <InfoBanner text="This market has resolved." />;
  }
  if (market.closed) {
    return <InfoBanner text="Market Closed — Trading is no longer available." />;
  }
  if (market.choices.length === 0) return null;

  return (
    <>
      <Button
        label={isConnected ? 'Trade' : 'Connect Wallet to Trade'}
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
 * Web equivalent of `apps/mobile`'s `TradeSheet` — pick a choice +
 * amount, review, submit (`CreateTradeInput.choiceIndex`; the label is
 * resolved server-side). Pass `market: null` while a row-opened child
 * market is still loading and the sheet shows an honest loading state.
 * Never fabricates a successful trade — a failed backend call shows a
 * real "Trade failed" state.
 */
export function TradeSheet({
  market,
  visible,
  onClose,
}: {
  market: MarketDetail | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { user } = usePrivy();
  const address = user?.wallet?.address ?? null;
  const isConnected = !!address;
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [amountText, setAmountText] = useState('');
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [isValidating, setIsValidating] = useState(false);
  const mutation = useCreateTrade(market?.id ?? '');

  const choice = market?.choices[choiceIndex] ?? market?.choices[0];
  const amount = Number(amountText) || 0;
  const price = choice?.price ?? 0;
  const shares = amount > 0 && price > 0 ? (amount * 100) / price : 0;
  const canSubmit = amount > 0 && price > 0 && choice != null;

  function handleChangeAmount(value: string) {
    setAmountText(value.replace(/[^0-9]/g, ''));
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

  return (
    <BottomSheet visible={visible} onClose={closeSheet}>
      {!market ? (
        <div className="py-2">
          <LoadingState rows={3} />
        </div>
      ) : market.resolved ? (
        <InfoBanner text="This market has resolved." />
      ) : market.closed ? (
        <InfoBanner text="Market Closed — Trading is no longer available." />
      ) : market.choices.length === 0 ? (
        <InfoBanner text="This market has no tradeable outcomes." />
      ) : step === 'pick' ? (
        <PickStep
          choices={market.choices}
          choiceIndex={choiceIndex}
          onSelectChoice={setChoiceIndex}
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
          choice={choice}
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
            priceCents={choice.price}
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
        <div className="flex flex-col gap-1 rounded-lg bg-surface-elevated p-3">
          <EstimateRow label="Estimated shares" value={shares.toFixed(2)} />
          <EstimateRow label="Estimated price" value={formatPrice(price)} />
          <EstimateRow label="Estimated cost" value={formatUsd(amount)} />
          <EstimateRow label="Payout if correct" value={formatUsd(shares)} />
        </div>
      ) : null}

      <Button
        variant={selected ? buttonVariant(choiceTone(selected)) : 'primary'}
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
  priceCents,
  imageUrl,
  selected,
  tone,
  stacked,
  onPress,
}: {
  label: string;
  priceCents: number;
  imageUrl?: string | null;
  selected: boolean;
  tone: ChoiceTone;
  stacked: boolean;
  onPress: () => void;
}) {
  const textColor = TONE_TEXT[tone];

  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex flex-col items-center gap-1 rounded-xl border p-3 ${stacked ? 'w-full' : 'flex-1'} ${selected ? TONE_ACTIVE_CLASS[tone] : 'border-border bg-surface-elevated'}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : null}
      <Text variant="bodyStrong" color={selected ? textColor : 'textPrimary'}>
        {label}
      </Text>
      <Text variant="title" color={selected ? textColor : 'textSecondary'}>
        {formatPrice(priceCents)}
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
        <Text variant="bodyStrong">{status === 'preparing' ? 'Preparing trade...' : 'Transaction pending...'}</Text>
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
      <ConfirmRow label="Amount" value={formatUsd(amount)} />
      <ConfirmRow label="Estimated price" value={formatPrice(price)} />
      <ConfirmRow label="Estimated shares" value={shares.toFixed(2)} />
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
    return 'Network error — check your connection and try again.';
  }
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
